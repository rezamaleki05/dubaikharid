import { NextResponse } from 'next/server';
import { logAdminActivity } from '@/lib/adminActivity';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { createPublicOrder, PublicOrderError, serializePublicOrder } from '@/lib/publicOrders';
import { publicRequestGuard, readIdempotencyKey } from '@/lib/publicRequestGuard';
import { buildManualPaymentAccess } from '@/lib/manualPayments';

export async function POST(request) {
  const guard = publicRequestGuard(request);
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const idempotencyKey = readIdempotencyKey(request);
  if (!idempotencyKey) return NextResponse.json({ error: 'شناسه یکتای ثبت سفارش معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { body = null; }
  try {
    const authenticatedCustomer = await getCurrentCustomer();
    const result = await createPublicOrder(body, idempotencyKey, { authenticatedCustomerId: authenticatedCustomer?.id || null });
    if (result.created) await logAdminActivity({ action: 'ORDER_CREATED', entityType: 'Order', entityId: result.order.id, metadata: { orderCode: result.order.orderCode, type: result.order.type, customerId: result.order.customerId, totalToman: result.order.totalToman }, request });
    const data = serializePublicOrder(result.order);
    const manualPayment = data.paymentMethod === 'CARD'
      ? await buildManualPaymentAccess(result.order, { includeCapability: true })
      : null;
    return NextResponse.json({ success: true, orderId: data.id, orderNumber: data.orderCode, data: { ...data, manualPayment } }, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof PublicOrderError) return NextResponse.json({ error: error.message, code: error.code, ...(error.details ? { details: error.details } : {}) }, { status: error.status });
    console.error('Error creating public order:', error);
    return NextResponse.json({ error: 'ثبت سفارش با خطا مواجه شد.' }, { status: 500 });
  }
}
