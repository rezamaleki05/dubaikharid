import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
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

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ORDERS_EDIT);
  if (response) return response;
  let body;
  try { body = await request.json(); } catch { body = null; }
  const allowed = new Set(['customerId', 'items', 'totalAed', 'totalToman', 'notes']);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.has(key))) return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  const customerId = typeof body.customerId === 'string' ? body.customerId.trim() : '';
  const totalToman = Number(body.totalToman);
  const totalAed = body.totalAed === null || body.totalAed === undefined || body.totalAed === '' ? null : Number(body.totalAed);
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (!customerId || customerId.length > 160 || !Number.isFinite(totalToman) || totalToman <= 0 || (totalAed !== null && (!Number.isFinite(totalAed) || totalAed < 0)) || notes.length > 4000 || !Array.isArray(body.items) || !body.items.length || body.items.length > 30) return NextResponse.json({ error: 'اطلاعات سفارش دستی معتبر نیست.' }, { status: 400 });
  const items = [];
  for (const item of body.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(key => !['name', 'quantity', 'priceAed', 'priceToman'].includes(key))) return NextResponse.json({ error: 'اقلام سفارش دستی معتبر نیستند.' }, { status: 400 });
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const quantity = Number(item.quantity ?? 1);
    const priceAed = item.priceAed === null || item.priceAed === undefined || item.priceAed === '' ? null : Number(item.priceAed);
    const priceToman = item.priceToman === null || item.priceToman === undefined || item.priceToman === '' ? null : Number(item.priceToman);
    if (!name || name.length > 300 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000 || (priceAed !== null && (!Number.isFinite(priceAed) || priceAed < 0)) || (priceToman !== null && (!Number.isFinite(priceToman) || priceToman < 0))) return NextResponse.json({ error: 'اقلام سفارش دستی معتبر نیستند.' }, { status: 400 });
    items.push({ name, quantity, priceAed, priceToman });
  }
  try {
    const order = await prisma.$transaction(async tx => {
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
      return tx.order.create({ data: { orderCode: `DK-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`, type: 'MANUAL_ADMIN', pricingStatus: 'CONFIRMED', customerId, customerNameSnapshot: customer.name, customerPhoneSnapshot: customer.normalizedPhone, customerEmailSnapshot: customer.email, status: 'pending', totalAed, totalToman, notes: notes || null, items: { create: items } }, include: adminOrderInclude });
    });
    await logAdminActivity({ adminId: admin.id, action: 'ORDER_CREATED', entityType: 'Order', entityId: order.id, metadata: { orderCode: order.orderCode, type: order.type, customerId }, request });
    return NextResponse.json(serializeAdminOrder(order), { status: 201 });
  } catch (error) {
    if (error.message === 'CUSTOMER_NOT_FOUND') return NextResponse.json({ error: 'مشتری پیدا نشد.' }, { status: 404 });
    console.error('Error creating manual admin order:', error);
    return NextResponse.json({ error: 'ثبت سفارش دستی با خطا مواجه شد.' }, { status: 500 });
  }
}
