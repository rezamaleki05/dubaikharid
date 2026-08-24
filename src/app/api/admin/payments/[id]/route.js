import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { adminPaymentInclude, applySuccessfulPaymentOrderEffects, decimalFromOrderTotal, isPaymentId, serializeAdminPayment } from '@/lib/adminPayments';
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
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['status', 'notes', 'rejectionReason'].includes(key))) return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  if (!['success', 'failed', 'refunded'].includes(body.status)) return NextResponse.json({ error: 'وضعیت پرداخت معتبر نیست.' }, { status: 400 });
  if (Object.hasOwn(body, 'notes') && (body.notes !== null && typeof body.notes !== 'string' || body.notes?.length > 4000)) return NextResponse.json({ error: 'یادداشت معتبر نیست.' }, { status: 400 });
  if (Object.hasOwn(body, 'rejectionReason') && (body.rejectionReason !== null && typeof body.rejectionReason !== 'string' || body.rejectionReason?.length > 1000)) return NextResponse.json({ error: 'دلیل رد معتبر نیست.' }, { status: 400 });
  const rejectionReason = typeof body.rejectionReason === 'string' ? body.rejectionReason.trim() : '';
  if (body.status === 'failed' && !rejectionReason) return NextResponse.json({ error: 'ثبت دلیل رد رسید الزامی است.' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      const current = await tx.payment.findUnique({ where: { id }, include: { order: { select: { totalToman: true, status: true } } } });
      if (!current) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
      if (current.status === body.status) return { payment: await tx.payment.findUnique({ where: { id }, include: adminPaymentInclude }), changed: false, previousStatus: current.status };
      const allowed = current.status === 'pending' ? new Set(['success', 'failed']) : current.status === 'success' ? new Set(['refunded']) : new Set();
      if (!allowed.has(body.status)) throw Object.assign(new Error('INVALID_TRANSITION'), { status: 409 });
      if (body.status === 'success') {
        if (current.method === 'ONLINE') throw Object.assign(new Error('UNTRUSTED_GATEWAY'), { status: 409 });
        if (current.method === 'CARD' && !current.receiptBlobPathname) throw Object.assign(new Error('RECEIPT_REQUIRED'), { status: 409 });
        const expected = decimalFromOrderTotal(current.order?.totalToman);
        if (!expected || !current.orderId) throw Object.assign(new Error('ORDER_TOTAL_MISSING'), { status: 409 });
        const aggregate = await tx.payment.aggregate({ where: { orderId: current.orderId, status: 'success', id: { not: id } }, _sum: { amount: true } });
        const paid = aggregate._sum.amount || expected.minus(expected);
        if (!paid.plus(current.amount).equals(expected)) throw Object.assign(new Error('AMOUNT_MISMATCH'), { status: 409 });
      }
      const payment = await tx.payment.update({ where: { id }, data: { status: body.status, notes: Object.hasOwn(body, 'notes') ? body.notes?.trim() || null : undefined, rejectionReason: body.status === 'failed' ? rejectionReason : null, paidAt: body.status === 'success' ? new Date() : current.paidAt, confirmedById: body.status === 'success' ? admin.id : current.confirmedById }, include: adminPaymentInclude });
      if (body.status === 'success') await applySuccessfulPaymentOrderEffects(tx, current.orderId);
      return { payment, changed: true, previousStatus: current.status, orderPreviousStatus: current.order?.status || null };
    }, { isolationLevel: 'Serializable' });
    if (result.changed) await logAdminActivity({ adminId: admin.id, action: result.payment.status === 'success' ? 'PAYMENT_MARKED_PAID' : result.payment.status === 'refunded' ? 'PAYMENT_REFUNDED' : 'PAYMENT_FAILED', entityType: 'Payment', entityId: id, metadata: { paymentId: id, previousStatus: result.previousStatus, newStatus: result.payment.status, orderId: result.payment.orderId, amount: result.payment.amount.toString(), currency: result.payment.currency, method: result.payment.method }, request });
    if (result.changed && result.payment.status === 'success' && ['pending', 'pricing'].includes(result.orderPreviousStatus)) await logAdminActivity({ adminId: admin.id, action: 'ORDER_STATUS_CHANGED', entityType: 'Order', entityId: result.payment.orderId, metadata: { previousStatus: result.orderPreviousStatus, newStatus: 'paid', source: 'payment_confirmation' }, request });
    return NextResponse.json(serializeAdminPayment(result.payment));
  } catch (error) {
    const messages = { NOT_FOUND: ['پرداخت پیدا نشد.', 404], INVALID_TRANSITION: ['تغییر وضعیت پرداخت مجاز نیست.', 409], UNTRUSTED_GATEWAY: ['تأیید دستی پرداخت آنلاین بدون پاسخ معتبر درگاه مجاز نیست.', 409], RECEIPT_REQUIRED: ['برای تأیید کارت‌به‌کارت ابتدا باید رسید مشتری ثبت شود.', 409], ORDER_TOTAL_MISSING: ['مبلغ معتبر سفارش در دسترس نیست.', 409], AMOUNT_MISMATCH: ['مبلغ پرداخت با مانده معتبر سفارش مطابقت ندارد.', 409], ORDER_CANCELLED: ['سفارش مرتبط لغو شده است.', 409] };
    const known = messages[error.message];
    if (known) return NextResponse.json({ error: known[0] }, { status: known[1] });
    console.error('Error updating admin payment:', error);
    return NextResponse.json({ error: 'به‌روزرسانی پرداخت با خطا مواجه شد.' }, { status: 500 });
  }
}
