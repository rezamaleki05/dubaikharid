import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { customerOrderInclude, serializeCustomerOrder } from '@/lib/customerAccount';
import { prisma } from '@/lib/prisma';

export async function GET(_request, { params }) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'وارد حساب کاربری نشده‌اید.' }, { status: 401 });
  const { id } = await params;
  if (!id || id.length > 160) return NextResponse.json({ error: 'سفارش پیدا نشد.' }, { status: 404 });
  const order = await prisma.order.findFirst({
    where: { customerId: customer.id, OR: [{ id }, { orderCode: id }] },
    include: customerOrderInclude,
  });
  if (!order) return NextResponse.json({ error: 'سفارش پیدا نشد.' }, { status: 404 });
  return NextResponse.json({ data: serializeCustomerOrder(order, customer) });
}
