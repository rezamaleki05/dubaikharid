import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { PURCHASE_REQUEST_STATUSES, serializeAdminPurchaseRequest } from '@/lib/adminPurchaseRequests';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

function code() {
  return `DK-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PURCHASE_REQUESTS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!id || id.length > 160) return NextResponse.json({ error: 'شناسه درخواست معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { body = null; }
  const allowed = new Set(['status', 'priceAed', 'weight', 'finalToman', 'note', 'action', 'markPaid']);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.has(key))) return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  if (body.status && !PURCHASE_REQUEST_STATUSES.has(body.status)) return NextResponse.json({ error: 'وضعیت درخواست معتبر نیست.' }, { status: 400 });
  const data = {};
  for (const field of ['priceAed', 'weight', 'finalToman']) {
    if (!Object.hasOwn(body, field)) continue;
    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < 0) return NextResponse.json({ error: 'مقادیر مالی درخواست معتبر نیست.' }, { status: 400 });
    data[field] = value;
  }
  if (Object.hasOwn(body, 'note')) {
    if (body.note !== null && (typeof body.note !== 'string' || body.note.length > 4000)) return NextResponse.json({ error: 'یادداشت معتبر نیست.' }, { status: 400 });
    data.note = body.note?.trim() || null;
  }
  if (body.status) data.status = body.status;
  if (body.action === 'cancel') data.status = 'cancelled';
  if (body.action && !['cancel', 'convert'].includes(body.action)) return NextResponse.json({ error: 'عملیات معتبر نیست.' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      const current = await tx.purchaseRequest.findUnique({ where: { id }, include: { customer: true, order: { include: { payments: true } } } });
      if (!current) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
      if (body.action === 'convert') {
        if (current.order) return current;
        const finalToman = Number(data.finalToman ?? current.finalToman);
        const priceAed = Number(data.priceAed ?? current.priceAed ?? 0);
        const weight = Number(data.weight ?? current.weight ?? 0);
        if (!Number.isFinite(finalToman) || finalToman <= 0) throw Object.assign(new Error('FINAL_PRICE_REQUIRED'), { status: 409 });
        await tx.order.create({
          data: {
            orderCode: code(),
            type: 'EXTERNAL_PURCHASE',
            pricingStatus: 'CONFIRMED',
            purchaseRequestId: current.id,
            customerId: current.customerId,
            customerNameSnapshot: current.customer?.name,
            customerPhoneSnapshot: current.customer?.normalizedPhone,
            customerEmailSnapshot: current.customer?.email,
            deliveryAddress: current.deliveryAddress,
            status: body.markPaid ? 'paid' : 'pricing',
            totalAed: priceAed,
            totalToman: finalToman,
            notes: current.note,
            productSubtotalToman: new Prisma.Decimal(String(Math.round(finalToman))),
            items: { create: { name: current.productName || 'سفارش خرید خارجی', quantity: current.quantity, priceAed: priceAed || null, priceToman: finalToman / current.quantity, weight } },
            ...(body.markPaid ? { payments: { create: { amount: new Prisma.Decimal(String(Math.round(finalToman))), currency: 'TOMAN', method: 'CARD', type: 'INCOME', category: 'سفارشات', status: 'success', paidAt: new Date(), confirmedById: admin.id } } } : {}),
          },
        });
        await tx.purchaseRequest.update({ where: { id }, data: { ...data, status: 'converted' } });
        return tx.purchaseRequest.findUnique({ where: { id }, include: { customer: true, order: { include: { payments: true } } } });
      }
      await tx.purchaseRequest.update({ where: { id }, data });
      return tx.purchaseRequest.findUnique({ where: { id }, include: { customer: true, order: { include: { payments: true } } } });
    }, { isolationLevel: 'Serializable' });
    await logAdminActivity({ adminId: admin.id, action: body.action === 'convert' ? 'PURCHASE_REQUEST_CONVERTED' : data.status === 'cancelled' ? 'PURCHASE_REQUEST_CANCELLED' : 'PURCHASE_REQUEST_UPDATED', entityType: 'PurchaseRequest', entityId: id, metadata: { status: result.status, orderCode: result.order?.orderCode || null }, request });
    return NextResponse.json(serializeAdminPurchaseRequest(result));
  } catch (error) {
    if (error.message === 'NOT_FOUND') return NextResponse.json({ error: 'درخواست خرید پیدا نشد.' }, { status: 404 });
    if (error.message === 'FINAL_PRICE_REQUIRED') return NextResponse.json({ error: 'پیش از تبدیل، قیمت نهایی معتبر ثبت کنید.' }, { status: 409 });
    console.error('Error updating purchase request:', error);
    return NextResponse.json({ error: 'به‌روزرسانی درخواست خرید با خطا مواجه شد.' }, { status: 500 });
  }
}
