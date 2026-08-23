import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { customerOrderInclude, serializeCustomerOrder, serializeCustomerRequest } from '@/lib/customerAccount';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'وارد حساب کاربری نشده‌اید.' }, { status: 401 });
  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '25', 10) || 25));
  const skip = (page - 1) * limit;

  const [orders, total, requests] = await Promise.all([
    prisma.order.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: 'desc' }, skip, take: limit, include: customerOrderInclude }),
    prisma.order.count({ where: { customerId: customer.id } }),
    prisma.purchaseRequest.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { order: { select: { orderCode: true, payments: { select: { status: true, reference: true }, orderBy: { createdAt: 'desc' } } } } },
    }),
  ]);
  return NextResponse.json({
    data: {
      orders: orders.map(order => serializeCustomerOrder(order, customer)),
      requests: requests.map(item => serializeCustomerRequest(item, customer)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}
