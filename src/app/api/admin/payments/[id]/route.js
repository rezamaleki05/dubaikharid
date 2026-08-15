import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { adminPaymentInclude, decimalFromOrderTotal, isPaymentId, serializeAdminPayment } from '@/lib/adminPayments';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PAYMENTS_VIEW);
  if (response) return response;
  const { id } = await params;
  if (!isPaymentId(id)) return NextResponse.json({ error: 'شناسه پرداخت معتبر نیست.' }, { status: 400 });
  const payment = await prisma.payment.findUnique({ where: { id }, include: adminPaymentInclude });
  if (!payment) return NextResponse.json({ error: 'پرداخت پیدا نشد.' }, { status: 404 });
  return NextResponse.json(serializeAdminPayment(payment));
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PAYMENTS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!isPaymentId(id)) return NextResponse.json({ error: 'شناسه پرداخت معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { body = null; }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['status', 'notes'].includes(key))) return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  if (!['success', 'failed', 'refunded'].includes(body.status)) return NextResponse.json({ error: 'وضعیت پرداخت معتبر نیست.' }, { status: 400 });
  if (Object.hasOwn(body, 'notes') && (body.notes !== null && typeof body.notes !== 'string' || body.notes?.length > 4000)) return NextResponse.json({ error: 'یادداشت معتبر نیست.' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      const current = await tx.payment.findUnique({ where: { id }, include: { order: { select: { totalToman: true } } } });
      if (!current) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
      if (current.status === body.status) return { payment: await tx.payment.findUnique({ where: { id }, include: adminPaymentInclude }), changed: false, previousStatus: current.status };
      const allowed = current.status === 'pending' ? new Set(['success', 'failed']) : current.status === 'success' ? new Set(['refunded']) : new Set();
      if (!allowed.has(body.status)) throw Object.assign(new Error('INVALID_TRANSITION'), { status: 409 });
      if (body.status === 'success') {
        if (current.method === 'ONLINE') throw Object.assign(new Error('UNTRUSTED_GATEWAY'), { status: 409 });
        const expected = decimalFromOrderTotal(current.order?.totalToman);
        if (!expected || !current.orderId) throw Object.assign(new Error('ORDER_TOTAL_MISSING'), { status: 409 });
        const aggregate = await tx.payment.aggregate({ where: { orderId: current.orderId, status: 'success', id: { not: id } }, _sum: { amount: true } });
        const paid = aggregate._sum.amount || expected.minus(expected);
        if (!paid.plus(current.amount).equals(expected)) throw Object.assign(new Error('AMOUNT_MISMATCH'), { status: 409 });
      }
      const payment = await tx.payment.update({ where: { id }, data: { status: body.status, notes: Object.hasOwn(body, 'notes') ? body.notes?.trim() || null : undefined, paidAt: body.status === 'success' ? new Date() : current.paidAt, confirmedById: body.status === 'success' ? admin.id : current.confirmedById }, include: adminPaymentInclude });
      return { payment, changed: true, previousStatus: current.status };
    }, { isolationLevel: 'Serializable' });
    if (result.changed) await logAdminActivity({ adminId: admin.id, action: result.payment.status === 'success' ? 'PAYMENT_MARKED_PAID' : result.payment.status === 'refunded' ? 'PAYMENT_REFUNDED' : 'PAYMENT_FAILED', entityType: 'Payment', entityId: id, metadata: { paymentId: id, previousStatus: result.previousStatus, newStatus: result.payment.status, orderId: result.payment.orderId, amount: result.payment.amount.toString(), currency: result.payment.currency, method: result.payment.method }, request });
    return NextResponse.json(serializeAdminPayment(result.payment));
  } catch (error) {
    const messages = { NOT_FOUND: ['پرداخت پیدا نشد.', 404], INVALID_TRANSITION: ['تغییر وضعیت پرداخت مجاز نیست.', 409], UNTRUSTED_GATEWAY: ['تأیید دستی پرداخت آنلاین بدون پاسخ معتبر درگاه مجاز نیست.', 409], ORDER_TOTAL_MISSING: ['مبلغ معتبر سفارش در دسترس نیست.', 409], AMOUNT_MISMATCH: ['مبلغ پرداخت با مانده معتبر سفارش مطابقت ندارد.', 409] };
    const known = messages[error.message];
    if (known) return NextResponse.json({ error: known[0] }, { status: known[1] });
    console.error('Error updating admin payment:', error);
    return NextResponse.json({ error: 'به‌روزرسانی پرداخت با خطا مواجه شد.' }, { status: 500 });
  }
}
