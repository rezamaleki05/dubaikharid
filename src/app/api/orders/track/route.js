import { NextResponse } from 'next/server';
import { normalizeCustomerPhone } from '@/lib/adminCustomers';
import { prisma } from '@/lib/prisma';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

export async function POST(request) {
  const guard = publicRequestGuard(request, { limit: 8 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  let body;
  try { body = await request.json(); } catch { body = null; }
  const orderCode = typeof body?.orderCode === 'string' ? body.orderCode.trim() : '';
  const normalizedPhone = normalizeCustomerPhone(body?.phone);
  if (!orderCode || orderCode.length > 80 || !normalizedPhone) return NextResponse.json({ error: 'شماره سفارش و موبایل معتبر الزامی است.' }, { status: 400 });
  const order = await prisma.order.findFirst({
    where: {
      orderCode,
      OR: [
        { customerPhoneSnapshot: normalizedPhone },
        { customer: { normalizedPhone } },
      ],
    },
    select: { orderCode: true, status: true, type: true, pricingStatus: true, totalToman: true, createdAt: true, updatedAt: true, items: { select: { name: true, quantity: true } }, payments: { select: { status: true }, orderBy: { createdAt: 'desc' }, take: 1 }, shipment: { select: { status: true, carrier: true, trackingCode: true, trackingUrl: true, shippedAt: true, deliveredAt: true } } },
  });
  if (!order) return NextResponse.json({ error: 'سفارشی با این مشخصات پیدا نشد.' }, { status: 404 });
  return NextResponse.json({ data: { ...order, paymentStatus: order.payments[0]?.status || 'pending' } });
}
