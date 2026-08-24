import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { buildManualPaymentAccess, getOwnedOrderForManualPayment } from '@/lib/manualPayments';

export async function GET(_request, { params }) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'وارد حساب کاربری نشده‌اید.' }, { status: 401 });
  const { id } = await params;
  if (!id || id.length > 160) return NextResponse.json({ error: 'سفارش پیدا نشد.' }, { status: 404 });
  const order = await getOwnedOrderForManualPayment(id, customer.id);
  if (!order) return NextResponse.json({ error: 'سفارش پیدا نشد.' }, { status: 404 });
  const manualPayment = await buildManualPaymentAccess(order);
  if (!manualPayment) return NextResponse.json({ error: 'پرداخت کارت‌به‌کارت برای این سفارش در دسترس نیست.' }, { status: 409 });
  return NextResponse.json({ data: { orderCode: order.orderCode, totalToman: Number(order.totalToman || 0), ...manualPayment } }, { headers: { 'Cache-Control': 'private, no-store' } });
}
