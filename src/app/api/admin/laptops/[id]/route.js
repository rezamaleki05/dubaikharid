import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  assertLaptopTransition,
  assertLaptopCatalogSelection,
  isValidLaptopId,
  LaptopDomainError,
  serializeLaptop,
  validateLaptopPayload,
} from '@/lib/adminLaptops';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

function domainError(error, fallback) {
  if (error instanceof LaptopDomainError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error?.code === 'P2002') return NextResponse.json({ error: 'شماره سریال یا کد داخلی قبلاً ثبت شده است.' }, { status: 409 });
  console.error(fallback, error);
  return NextResponse.json({ error: 'عملیات لپ‌تاپ با خطا مواجه شد.' }, { status: 500 });
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_VIEW);
  if (response) return response;
  const { id } = await params;
  if (!isValidLaptopId(id)) return NextResponse.json({ error: 'شناسه لپ‌تاپ معتبر نیست.' }, { status: 400 });
  try {
    const laptop = await prisma.laptop.findUnique({ where: { id } });
    if (!laptop) return NextResponse.json({ error: 'لپ‌تاپ پیدا نشد.' }, { status: 404 });
    return NextResponse.json(serializeLaptop(laptop));
  } catch (error) {
    return domainError(error, 'Error fetching admin laptop:');
  }
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!isValidLaptopId(id)) return NextResponse.json({ error: 'شناسه لپ‌تاپ معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }); }
  const validated = validateLaptopPayload(body, { partial: true });
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      const previous = await tx.laptop.findUnique({ where: { id } });
      if (!previous) throw new LaptopDomainError('لپ‌تاپ پیدا نشد.', 404, 'LAPTOP_NOT_FOUND');
      const nextStatus = validated.data.status;
      const brandChanged = validated.data.brand && validated.data.brand.trim().toLowerCase() !== String(previous.brand || '').trim().toLowerCase();
      const modelChanged = validated.data.model && validated.data.model.trim().toLowerCase() !== String(previous.model || '').trim().toLowerCase();
      if (brandChanged || modelChanged) {
        await assertLaptopCatalogSelection(tx, {
          brandName: validated.data.brand || previous.brand,
          modelName: validated.data.model || previous.model,
        });
      }
      assertLaptopTransition(previous.status, nextStatus);
      const data = {
        ...validated.data,
        ...(nextStatus === 'SOLD' && previous.status !== 'SOLD' ? { soldAt: new Date() } : {}),
      };
      if (nextStatus === 'SOLD') {
        const updated = await tx.laptop.updateMany({ where: { id, status: { not: 'SOLD' } }, data });
        if (updated.count !== 1) throw new LaptopDomainError('این لپ‌تاپ قبلاً فروخته شده است.', 409, 'LAPTOP_ALREADY_SOLD');
      } else {
        await tx.laptop.update({ where: { id }, data });
      }
      return { previous, laptop: await tx.laptop.findUnique({ where: { id } }) };
    }, { isolationLevel: 'Serializable' });
    const statusChanged = result.previous.status !== result.laptop.status;
    await logAdminActivity({
      adminId: admin.id,
      action: statusChanged && result.laptop.status === 'SOLD' ? 'LAPTOP_SOLD' : statusChanged ? 'LAPTOP_STATUS_CHANGED' : 'LAPTOP_UPDATED',
      entityType: 'Laptop', entityId: id,
      metadata: {
        changedFields: Object.keys(validated.data),
        ...(statusChanged ? { previousStatus: result.previous.status, newStatus: result.laptop.status } : {}),
        serialNumber: result.laptop.serialNumber,
      },
      request,
    });
    return NextResponse.json(serializeLaptop(result.laptop));
  } catch (error) {
    return domainError(error, 'Error updating admin laptop:');
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!isValidLaptopId(id)) return NextResponse.json({ error: 'شناسه لپ‌تاپ معتبر نیست.' }, { status: 400 });
  try {
    const previous = await prisma.laptop.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: 'لپ‌تاپ پیدا نشد.' }, { status: 404 });
    if (previous.archivedAt) return NextResponse.json({ error: 'این لپ‌تاپ قبلاً بایگانی شده است.' }, { status: 409 });
    const laptop = await prisma.laptop.update({
      where: { id },
      data: { archivedAt: new Date(), ...(previous.status === 'SOLD' ? {} : { status: 'INACTIVE' }) },
    });
    await logAdminActivity({
      adminId: admin.id, action: 'LAPTOP_DEACTIVATED', entityType: 'Laptop', entityId: id,
      metadata: { previousStatus: previous.status, newStatus: laptop.status, archived: true }, request,
    });
    return NextResponse.json(serializeLaptop(laptop));
  } catch (error) {
    return domainError(error, 'Error archiving admin laptop:');
  }
}
