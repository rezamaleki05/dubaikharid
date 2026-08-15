import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { adminOrderInclude, ORDER_STATUS_SET, serializeAdminOrder } from '@/lib/adminOrders';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) return null;
  return parsed;
}

function parseDate(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) date.setUTCHours(23, 59, 59, 999);
  return date;
}

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ORDERS_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInteger(searchParams.get('page'), 1);
  const limit = parsePositiveInteger(searchParams.get('limit'), 8, 100);
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim().slice(0, 120) || '';
  const paymentMethod = searchParams.get('paymentMethod');
  const from = parseDate(searchParams.get('from'));
  const to = parseDate(searchParams.get('to'), true);

  if (!page || !limit || (status && !ORDER_STATUS_SET.has(status)) || from === undefined || to === undefined) {
    return NextResponse.json({ error: 'پارامترهای فیلتر سفارش معتبر نیستند.' }, { status: 400 });
  }
  if (paymentMethod && !['gateway', 'card'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'روش پرداخت معتبر نیست.' }, { status: 400 });
  }

  const where = {};
  if (status) where.status = status;
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  if (search) {
    where.OR = [
      { orderCode: { contains: search, mode: 'insensitive' } },
      { customer: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { customer: { is: { phone: { contains: search, mode: 'insensitive' } } } },
      { customer: { is: { email: { contains: search, mode: 'insensitive' } } } },
      { items: { some: { name: { contains: search, mode: 'insensitive' } } } },
    ];
  }
  if (paymentMethod) {
    where.payments = {
      some: paymentMethod === 'gateway'
        ? { method: 'ONLINE' }
        : { method: { not: 'ONLINE' } },
    };
  }

  try {
    const countWhere = { ...where };
    delete countWhere.status;
    const [orders, total, groupedStatuses] = await Promise.all([
      prisma.order.findMany({
        where,
        include: adminOrderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ['status'], where: countWhere, _count: { _all: true } }),
    ]);

    return NextResponse.json({
      data: orders.map(serializeAdminOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      statusCounts: Object.fromEntries(groupedStatuses.map(row => [row.status, row._count._all])),
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: 'دریافت سفارش‌ها با خطا مواجه شد.' }, { status: 500 });
  }
}
