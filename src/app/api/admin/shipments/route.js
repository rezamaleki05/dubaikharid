import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { fulfillOrderWarehouseReservations } from '@/lib/adminOrders';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import {
  adminShipmentInclude,
  orderStatusForShipment,
  parseShipmentCreateInput,
  serializeAdminShipment,
  SHIPMENT_STATUS_SET,
  shipmentTimestampData,
} from '@/lib/adminShipments';
import { prisma } from '@/lib/prisma';

function positiveInteger(value, fallback, maximum) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : null;
}

function parseDate(value, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) parsed.setUTCHours(23, 59, 59, 999);
  return parsed;
}

function growth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function statusCounts(rows) {
  return Object.fromEntries(rows.map(row => [row.status, row._count._all]));
}

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SHIPMENTS_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = positiveInteger(searchParams.get('page'), 1, 100000);
  const limit = positiveInteger(searchParams.get('limit'), 20, 100);
  const search = searchParams.get('search')?.trim().slice(0, 120) || '';
  const status = searchParams.get('status');
  const carrier = searchParams.get('carrier')?.trim().slice(0, 160) || '';
  const method = searchParams.get('method')?.trim().slice(0, 80) || '';
  const recipient = searchParams.get('recipient')?.trim().slice(0, 240) || '';
  const from = parseDate(searchParams.get('from'));
  const to = parseDate(searchParams.get('to'), true);
  const includeOrders = searchParams.get('includeOrders') === '1';
  if (!page || !limit || (status && !SHIPMENT_STATUS_SET.has(status)) || from === undefined || to === undefined) {
    return NextResponse.json({ error: 'پارامترهای فیلتر ارسال معتبر نیستند.' }, { status: 400 });
  }

  const where = {};
  if (status) where.status = status;
  if (carrier) where.carrier = { equals: carrier, mode: 'insensitive' };
  if (method) where.method = { equals: method, mode: 'insensitive' };
  if (recipient) where.recipient = { equals: recipient, mode: 'insensitive' };
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { trackingCode: { contains: search, mode: 'insensitive' } },
      { recipient: { contains: search, mode: 'insensitive' } },
      { recipientPhone: { contains: search, mode: 'insensitive' } },
      { carrier: { contains: search, mode: 'insensitive' } },
      { order: { is: { orderCode: { contains: search, mode: 'insensitive' } } } },
      { order: { is: { customer: { is: { name: { contains: search, mode: 'insensitive' } } } } } },
      { order: { is: { customer: { is: { phone: { contains: search, mode: 'insensitive' } } } } } },
    ];
  }

  const statsWhere = { ...where };
  delete statsWhere.status;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

  try {
    const [shipments, total, grouped, trendRows, filterRows, eligibleOrders] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: adminShipmentInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shipment.count({ where }),
      prisma.shipment.groupBy({ by: ['status'], where: statsWhere, _count: { _all: true } }),
      prisma.shipment.findMany({
        where: { AND: [statsWhere, { createdAt: { gte: sixtyDaysAgo } }] },
        select: { status: true, createdAt: true },
      }),
      prisma.shipment.findMany({
        where: statsWhere,
        select: { recipient: true, carrier: true, method: true },
        distinct: ['recipient', 'carrier', 'method'],
        take: 500,
      }),
      includeOrders
        ? prisma.order.findMany({
            where: { shipment: { is: null }, status: { not: 'cancelled' } },
            select: {
              id: true,
              orderCode: true,
              status: true,
              customer: { select: { name: true, phone: true, city: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          })
        : Promise.resolve([]),
    ]);

    const counts = statusCounts(grouped);
    const currentRows = trendRows.filter(row => row.createdAt >= thirtyDaysAgo);
    const previousRows = trendRows.filter(row => row.createdAt < thirtyDaysAgo);
    const growthFor = expectedStatus => growth(
      currentRows.filter(row => !expectedStatus || row.status === expectedStatus).length,
      previousRows.filter(row => !expectedStatus || row.status === expectedStatus).length,
    );
    const unique = key => [...new Set(filterRows.map(row => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fa'));

    return NextResponse.json({
      data: shipments.map(serializeAdminShipment),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      stats: {
        total: Object.values(counts).reduce((sum, value) => sum + value, 0),
        statusCounts: counts,
        growth: {
          total: growthFor(null),
          SHIPPED: growthFor('SHIPPED'),
          IN_TRANSIT: growthFor('IN_TRANSIT'),
          OUT_FOR_DELIVERY: growthFor('OUT_FOR_DELIVERY'),
          DELIVERED: growthFor('DELIVERED'),
        },
      },
      filters: {
        recipients: unique('recipient'),
        carriers: unique('carrier'),
        methods: unique('method'),
      },
      eligibleOrders,
    });
  } catch (error) {
    console.error('Error fetching admin shipments:', error);
    return NextResponse.json({ error: 'دریافت ارسال‌ها با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SHIPMENTS_EDIT);
  if (response) return response;
  let body;
  try { body = await request.json(); } catch { body = null; }
  const parsed = parseShipmentCreateInput(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const shipment = await prisma.$transaction(async tx => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: parsed.data.orderId }, { orderCode: parsed.data.orderId }] },
        select: {
          id: true,
          orderCode: true,
          status: true,
          shipment: { select: { id: true } },
          customer: { select: { name: true, phone: true, city: true } },
        },
      });
      if (!order) throw new Error('ORDER_NOT_FOUND');
      if (order.status === 'cancelled') throw new Error('ORDER_CANCELLED');
      if (order.shipment) throw new Error('DUPLICATE_SHIPMENT');

      const now = new Date();
      const timestampData = shipmentTimestampData({ shippedAt: null, deliveredAt: null }, parsed.data.status, now);
      const created = await tx.shipment.create({
        data: {
          ...parsed.data,
          orderId: order.id,
          recipient: order.customer?.name?.trim() || `سفارش ${order.orderCode}`,
          recipientPhone: order.customer?.phone?.trim() || null,
          deliveryAddress: order.customer?.city?.trim() || null,
          ...timestampData,
        },
      });

      const targetOrderStatus = orderStatusForShipment(created.status);
      if (targetOrderStatus === 'delivered') {
        await fulfillOrderWarehouseReservations(tx, order.id, order.orderCode);
        await tx.order.update({ where: { id: order.id }, data: { status: 'delivered' } });
      } else if (targetOrderStatus === 'shipped' && !['shipped', 'delivered'].includes(order.status)) {
        await fulfillOrderWarehouseReservations(tx, order.id, order.orderCode);
        await tx.order.update({ where: { id: order.id }, data: { status: 'shipped' } });
      }
      return tx.shipment.findUnique({ where: { id: created.id }, include: adminShipmentInclude });
    }, { isolationLevel: 'Serializable' });

    await logAdminActivity({
      adminId: admin.id,
      action: 'SHIPMENT_CREATED',
      entityType: 'Shipment',
      entityId: shipment.id,
      metadata: {
        shipmentId: shipment.id,
        orderId: shipment.orderId,
        status: shipment.status,
        carrier: shipment.carrier,
        trackingNumber: shipment.trackingCode,
      },
      request,
    });
    return NextResponse.json(serializeAdminShipment(shipment), { status: 201 });
  } catch (error) {
    const known = {
      ORDER_NOT_FOUND: ['سفارش پیدا نشد.', 404],
      ORDER_CANCELLED: ['برای سفارش لغوشده نمی‌توان مرسوله ثبت کرد.', 409],
      DUPLICATE_SHIPMENT: ['برای این سفارش قبلاً مرسوله ثبت شده است.', 409],
    }[error.message];
    if (known) return NextResponse.json({ error: known[0] }, { status: known[1] });
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'برای این سفارش قبلاً مرسوله ثبت شده است.' }, { status: 409 });
    }
    console.error('Error creating admin shipment:', error);
    return NextResponse.json({ error: 'ثبت مرسوله با خطا مواجه شد.' }, { status: 500 });
  }
}
