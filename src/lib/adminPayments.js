import 'server-only';

import { Prisma } from '@/generated/prisma/client';

export const PAYMENT_STATUSES = Object.freeze(['pending', 'success', 'failed', 'refunded']);
export const PAYMENT_STATUS_SET = new Set(PAYMENT_STATUSES);
export const PAYMENT_METHODS = Object.freeze(['CASH', 'CARD', 'POS', 'BANK_TRANSFER', 'ONLINE', 'OTHER']);
export const PAYMENT_METHOD_SET = new Set(PAYMENT_METHODS);

export const PAYMENT_METHOD_LABELS = Object.freeze({
  CASH: 'نقدی',
  CARD: 'کارت به کارت',
  POS: 'کارتخوان',
  BANK_TRANSFER: 'حواله بانکی',
  ONLINE: 'درگاه بانکی',
  OTHER: 'سایر',
});

export const adminPaymentInclude = Object.freeze({
  order: {
    select: {
      id: true,
      orderCode: true,
      totalToman: true,
      status: true,
      customer: { select: { id: true, name: true, phone: true, email: true, city: true } },
      items: { select: { name: true, quantity: true } },
    },
  },
  confirmedBy: { select: { id: true, email: true } },
});

export function serializeAdminPayment(payment) {
  const amount = Number(payment.amount);
  const isExpense = payment.type === 'EXPENSE';
  return {
    id: payment.id,
    orderId: payment.order?.orderCode || payment.orderId || '',
    orderDbId: payment.orderId,
    amount: isExpense ? -amount : amount,
    rawAmount: amount,
    currency: payment.currency,
    method: PAYMENT_METHOD_LABELS[payment.method] || PAYMENT_METHOD_LABELS.OTHER,
    methodCode: payment.method,
    type: isExpense ? 'پرداختی' : 'دریافتی',
    typeCode: payment.type,
    category: payment.category || (isExpense ? 'هزینه ها' : 'سفارشات'),
    status: payment.status,
    reference: payment.reference || '',
    account: payment.account || '',
    notes: payment.notes || '',
    paidAt: payment.paidAt,
    date: payment.createdAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    recipient: payment.order?.customer?.name || payment.counterparty || '',
    customerId: payment.order?.customer?.id || null,
    phone: payment.order?.customer?.phone || '',
    address: payment.order?.customer?.city || '',
    productName: payment.order?.items?.map(item => item.name).filter(Boolean).join(' + ') || '',
    orderTotalToman: payment.order?.totalToman ?? null,
    confirmedBy: payment.confirmedBy || null,
    hasReceipt: Boolean(payment.receiptBlobPathname),
    receiptOriginalName: payment.receiptOriginalName || '',
    receiptMimeType: payment.receiptMimeType || '',
    receiptSizeBytes: payment.receiptSizeBytes || null,
    receiptSubmittedAt: payment.receiptSubmittedAt || null,
    receiptUrl: payment.receiptBlobPathname ? `/api/admin/payments/${encodeURIComponent(payment.id)}/receipt` : null,
    rejectionReason: payment.rejectionReason || '',
  };
}

export function decimalFromOrderTotal(value) {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return null;
  return new Prisma.Decimal(String(Math.round(value)));
}

export function parsePaymentDate(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) date.setUTCHours(23, 59, 59, 999);
  return date;
}

export function parsePaymentCreateInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'بدنه درخواست معتبر نیست.' };
  const allowed = new Set(['orderId', 'method', 'status', 'reference', 'account', 'notes']);
  if (Object.keys(body).some(key => !allowed.has(key))) return { error: 'فیلد غیرمجاز در درخواست وجود دارد.' };
  if (typeof body.orderId !== 'string' || !body.orderId.trim() || body.orderId.length > 128) return { error: 'شماره سفارش مرجع الزامی است.' };
  if (typeof body.method !== 'string' || !PAYMENT_METHOD_SET.has(body.method)) return { error: 'روش پرداخت معتبر نیست.' };
  if (body.method === 'ONLINE') return { error: 'درگاه آنلاین هنوز متصل نیست و ثبت موفقیت ساختگی مجاز نیست.' };
  const status = body.status ?? 'pending';
  if (!['pending', 'success'].includes(status)) return { error: 'وضعیت اولیه پرداخت معتبر نیست.' };
  const data = { orderId: body.orderId.trim(), method: body.method, status };
  for (const [key, maximum] of [['reference', 200], ['account', 240], ['notes', 4000]]) {
    if (!Object.hasOwn(body, key)) continue;
    if (body[key] !== null && typeof body[key] !== 'string') return { error: `${key} معتبر نیست.` };
    const value = body[key]?.trim() || null;
    if (value && value.length > maximum) return { error: `${key} بیش از حد طولانی است.` };
    data[key] = value;
  }
  return { data };
}

export function isPaymentId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 128;
}

export async function applySuccessfulPaymentOrderEffects(tx, orderId) {
  if (!orderId) return;
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order || order.status === 'cancelled') throw Object.assign(new Error('ORDER_CANCELLED'), { status: 409 });
  if (['pending', 'pricing'].includes(order.status)) await tx.order.update({ where: { id: orderId }, data: { status: 'paid' } });
  await tx.laptop.updateMany({ where: { reservedOrderId: orderId, status: 'RESERVED' }, data: { status: 'SOLD', soldAt: new Date(), reservedOrderId: null } });
}
