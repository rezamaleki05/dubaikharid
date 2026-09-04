import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { adminOrderInclude, OrderDomainError, ORDER_STATUS_SET, serializeAdminOrder, updateOrderLifecycle } from '@/lib/adminOrders';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

function isValidOrderId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 128;
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ORDERS_VIEW);
  if (response) return response;

  const { id } = await params;
  if (!isValidOrderId(id)) return NextResponse.json({ error: 'شناسه سفارش معتبر نیست.' }, { status: 400 });

  try {
    const order = await prisma.order.findUnique({ where: { id }, include: adminOrderInclude });
    if (!order) return NextResponse.json({ error: 'سفارش پیدا نشد.' }, { status: 404 });
    return NextResponse.json(serializeAdminOrder(order));
  } catch (error) {
    console.error('Error fetching admin order:', error);
    return NextResponse.json({ error: 'دریافت سفارش با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ORDERS_EDIT);
  if (response) return response;

  const { id } = await params;
  if (!isValidOrderId(id)) return NextResponse.json({ error: 'شناسه سفارش معتبر نیست.' }, { status: 400 });

  const body = await readJsonBody(request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  }

  const allowedFields = new Set(['status', 'adminNotes']);
  if (Object.keys(body).some(key => !allowedFields.has(key))) {
    return NextResponse.json({ error: 'فیلد غیرمجاز در درخواست وجود دارد.' }, { status: 400 });
  }

  const data = {};
  if (Object.hasOwn(body, 'status')) {
    if (typeof body.status !== 'string' || !ORDER_STATUS_SET.has(body.status)) {
      return NextResponse.json({ error: 'وضعیت سفارش معتبر نیست.' }, { status: 400 });
    }
    data.status = body.status;
  }
  if (Object.hasOwn(body, 'adminNotes')) {
    if (body.adminNotes !== null && typeof body.adminNotes !== 'string') {
      return NextResponse.json({ error: 'یادداشت داخلی معتبر نیست.' }, { status: 400 });
    }
    const adminNotes = body.adminNotes?.trim() || null;
    if (adminNotes && adminNotes.length > 4000) {
      return NextResponse.json({ error: 'یادداشت داخلی بیش از حد طولانی است.' }, { status: 400 });
    }
    data.adminNotes = adminNotes;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'تغییری ارسال نشده است.' }, { status: 400 });
  }

  try {
    const previous = await prisma.order.findUnique({ where: { id }, select: { status: true, adminNotes: true } });
    if (!previous) return NextResponse.json({ error: 'سفارش پیدا نشد.' }, { status: 404 });

    const updated = await prisma.$transaction(tx => updateOrderLifecycle(tx, id, data), { isolationLevel: 'Serializable', timeout: 20_000 });
    const statusChanged = data.status && data.status !== previous.status;
    const action = statusChanged
      ? (data.status === 'cancelled' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED')
      : 'ORDER_UPDATED';

    await logAdminActivity({
      adminId: admin.id,
      action,
      entityType: 'Order',
      entityId: id,
      metadata: {
        ...(statusChanged ? { previousStatus: previous.status, newStatus: data.status } : {}),
        ...(Object.hasOwn(data, 'adminNotes') ? { adminNotesChanged: previous.adminNotes !== data.adminNotes } : {}),
      },
      request,
    });

    return NextResponse.json(serializeAdminOrder(updated));
  } catch (error) {
    if (error instanceof OrderDomainError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Error updating admin order:', error);
    return NextResponse.json({ error: 'به‌روزرسانی سفارش با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ORDERS_DELETE);
  if (response) return response;

  const { id } = await params;
  if (!isValidOrderId(id)) return NextResponse.json({ error: 'شناسه سفارش معتبر نیست.' }, { status: 400 });

  try {
    const previous = await prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (!previous) return NextResponse.json({ error: 'سفارش پیدا نشد.' }, { status: 404 });
    if (previous.status === 'cancelled') {
      return NextResponse.json({ error: 'این سفارش قبلاً لغو شده است.' }, { status: 409 });
    }

    const cancelled = await prisma.$transaction(tx => updateOrderLifecycle(tx, id, { status: 'cancelled' }), { isolationLevel: 'Serializable', timeout: 20_000 });
    await logAdminActivity({
      adminId: admin.id,
      action: 'ORDER_CANCELLED',
      entityType: 'Order',
      entityId: id,
      metadata: { previousStatus: previous.status, newStatus: 'cancelled' },
      request,
    });

    return NextResponse.json(serializeAdminOrder(cancelled));
  } catch (error) {
    if (error instanceof OrderDomainError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Error cancelling admin order:', error);
    return NextResponse.json({ error: 'لغو سفارش با خطا مواجه شد.' }, { status: 500 });
  }
}
