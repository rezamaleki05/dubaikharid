import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { buildManualPaymentAccess } from '@/lib/manualPayments';
import { prisma } from '@/lib/prisma';
import { convertPurchaseRequestInTransaction } from '@/lib/purchaseRequestOrders';
import { getSettings } from '@/lib/settings';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

export async function POST(request, { params }) {
  const guard = publicRequestGuard(request, { limit: 8 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'وارد حساب کاربری نشده‌اید.' }, { status: 401 });
  const { values } = await getSettings(['cardPaymentEnabled']);
  if (values.cardPaymentEnabled !== true) return NextResponse.json({ error: 'پرداخت کارت‌به‌کارت در حال حاضر فعال نیست.' }, { status: 409 });
  const { id } = await params;
  if (!id || id.length > 160) return NextResponse.json({ error: 'درخواست خرید پیدا نشد.' }, { status: 404 });
  try {
    const result = await prisma.$transaction(async tx => {
      const current = await tx.purchaseRequest.findFirst({ where: { id, customerId: customer.id }, include: { customer: true, order: { include: { payments: true } } } });
      if (!current) throw new Error('NOT_FOUND');
      return convertPurchaseRequestInTransaction(tx, current);
    }, { isolationLevel: 'Serializable' });
    const access = await buildManualPaymentAccess(result.order, { includeCapability: true });
    await logAdminActivity({ action: 'PURCHASE_REQUEST_PAYMENT_STARTED', entityType: 'PurchaseRequest', entityId: id, metadata: { orderId: result.order.id, orderCode: result.order.orderCode, customerId: customer.id }, request });
    return NextResponse.json({ data: { requestId: id, orderId: result.order.id, orderCode: result.order.orderCode, totalToman: Number(result.order.totalToman), manualPayment: access } }, { status: 201 });
  } catch (error) {
    if (error.message === 'NOT_FOUND') return NextResponse.json({ error: 'درخواست خرید پیدا نشد.' }, { status: 404 });
    if (error.message === 'FINAL_PRICE_REQUIRED' || error.message === 'REQUEST_NOT_PAYABLE') return NextResponse.json({ error: 'این درخواست هنوز قیمت نهایی معتبر ندارد.' }, { status: 409 });
    if (error?.code === 'P2002') {
      const current = await prisma.purchaseRequest.findFirst({ where: { id, customerId: customer.id }, include: { order: { include: { payments: true } } } });
      if (current?.order) {
        const access = await buildManualPaymentAccess(current.order, { includeCapability: true });
        return NextResponse.json({ data: { requestId: id, orderId: current.order.id, orderCode: current.order.orderCode, totalToman: Number(current.order.totalToman), manualPayment: access } });
      }
    }
    console.error('Purchase request payment start failed:', error);
    return NextResponse.json({ error: 'آماده‌سازی پرداخت با خطا مواجه شد.' }, { status: 500 });
  }
}
