import 'server-only';

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PAYMENT_METHODS = ['CASH', 'CARD', 'POS', 'BANK_TRANSFER', 'ONLINE', 'OTHER'];
const ZERO = new Prisma.Decimal(0);

const ORDER_STATUS_LABELS = Object.freeze({
  pending: 'در انتظار',
  pricing: 'قیمت‌گذاری',
  paid: 'پرداخت شده',
  processing: 'در حال پردازش',
  purchased: 'خریداری',
  warehouse_dubai: 'انبار دبی',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
});

function decimal(value) {
  return value ? new Prisma.Decimal(value) : ZERO;
}

function decimalString(value) {
  return decimal(value).toFixed(0);
}

function decimalPercent(part, total) {
  const denominator = decimal(total);
  if (denominator.lessThanOrEqualTo(0)) return 0;
  return decimal(part).dividedBy(denominator).times(100).toDecimalPlaces(1).toNumber();
}

function getZonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
}

function zonedDateTimeToUtc({ year, month, day, hour = 0, minute = 0, second = 0 }, timeZone) {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = getZonedParts(new Date(utc), timeZone);
    const represented = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
    const correction = Date.UTC(year, month - 1, day, hour, minute, second) - represented;
    if (correction === 0) break;
    utc += correction;
  }
  return new Date(utc);
}

function addCalendarDays(parts, count) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + count));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function addCalendarMonths(parts, count) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1 + count, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: 1 };
}

function parseIsoDate(value) {
  if (!ISO_DATE.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

export function validateFinancialReportQuery(searchParams) {
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const groupBy = searchParams.get('groupBy') || 'month';
  if ((startDate && !parseIsoDate(startDate)) || (endDate && !parseIsoDate(endDate))) {
    return { error: 'بازه تاریخ گزارش معتبر نیست.' };
  }
  if (Boolean(startDate) !== Boolean(endDate)) return { error: 'تاریخ شروع و پایان باید با هم ارسال شوند.' };
  if (groupBy !== 'month') return { error: 'نوع گروه‌بندی گزارش معتبر نیست.' };
  return { startDate, endDate, groupBy };
}

async function resolveTimeZone() {
  const { values } = await getSettings(['timezone']);
  try {
    new Intl.DateTimeFormat('en', { timeZone: values.timezone }).format();
    return values.timezone;
  } catch {
    return 'Asia/Tehran';
  }
}

function reportRangeFromQuery(query, timeZone) {
  if (!query.startDate) return null;
  const startParts = parseIsoDate(query.startDate);
  const endParts = addCalendarDays(parseIsoDate(query.endDate), 1);
  const start = zonedDateTimeToUtc(startParts, timeZone);
  const end = zonedDateTimeToUtc(endParts, timeZone);
  if (start >= end || end.getTime() - start.getTime() > 730 * DAY_MS) {
    throw Object.assign(new Error('INVALID_DATE_RANGE'), { status: 400 });
  }
  return { start, end };
}

function eventDateWhere(field, range) {
  if (!range) return {};
  return { [field]: { gte: range.start, lt: range.end } };
}

function paidEventWhere(range) {
  if (!range) return {};
  return {
    OR: [
      { paidAt: { gte: range.start, lt: range.end } },
      { paidAt: null, createdAt: { gte: range.start, lt: range.end } },
    ],
  };
}

async function paymentEventGroups(range) {
  const by = ['type', 'status', 'method', 'category'];
  const [gross, refunds] = await Promise.all([
    prisma.payment.groupBy({
      by,
      where: { status: { in: ['success', 'refunded'] }, ...paidEventWhere(range) },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by,
      where: { status: 'refunded', ...eventDateWhere('updatedAt', range) },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);
  return { gross, refunds };
}

function sumGroups(rows, predicate) {
  return rows.reduce((total, row) => predicate(row) ? total.plus(row._sum.amount || ZERO) : total, ZERO);
}

function summarizePaymentEvents(groups) {
  const grossIncome = sumGroups(groups.gross, row => row.type === 'INCOME');
  const incomeRefunds = sumGroups(groups.refunds, row => row.type === 'INCOME');
  const grossExpenses = sumGroups(groups.gross, row => row.type === 'EXPENSE');
  const expenseRefunds = sumGroups(groups.refunds, row => row.type === 'EXPENSE');
  const netRevenue = grossIncome.minus(incomeRefunds);
  const netExpenses = grossExpenses.minus(expenseRefunds);
  return {
    grossRevenue: decimalString(grossIncome),
    refunds: decimalString(incomeRefunds),
    netRevenue: decimalString(netRevenue),
    grossExpenses: decimalString(grossExpenses),
    expenseRefunds: decimalString(expenseRefunds),
    netExpenses: decimalString(netExpenses),
    netCashFlow: decimalString(netRevenue.minus(netExpenses)),
    successfulIncomeCount: groups.gross.reduce((count, row) => count + (row.type === 'INCOME' ? row._count._all : 0), 0),
  };
}

function paymentMethodBreakdown(groups) {
  return PAYMENT_METHODS.map(method => {
    const gross = sumGroups(groups.gross, row => row.type === 'INCOME' && row.method === method);
    const refunds = sumGroups(groups.refunds, row => row.type === 'INCOME' && row.method === method);
    return { method, amount: decimalString(gross.minus(refunds)) };
  });
}

function expenseCategoryKey(category) {
  const value = String(category || '').trim();
  if (/تامین|تأمین|خرید|کالا|محصول|لپ.?تاپ/.test(value)) return 'supply';
  if (/حمل|ترخیص|کارگو|ارسال|پست|گمرک/.test(value)) return 'cargo';
  if (/تبلیغ|مارکتینگ|گوگل|اینستاگرام/.test(value)) return 'promotion';
  return 'office';
}

function expenseBreakdown(groups) {
  const totals = { supply: ZERO, cargo: ZERO, promotion: ZERO, office: ZERO };
  for (const row of groups.gross) {
    if (row.type !== 'EXPENSE') continue;
    const key = expenseCategoryKey(row.category);
    totals[key] = totals[key].plus(row._sum.amount || ZERO);
  }
  for (const row of groups.refunds) {
    if (row.type !== 'EXPENSE') continue;
    const key = expenseCategoryKey(row.category);
    totals[key] = totals[key].minus(row._sum.amount || ZERO);
  }
  const total = Object.values(totals).reduce((sum, value) => sum.plus(value), ZERO);
  return Object.fromEntries(Object.entries(totals).map(([key, amount]) => [key, {
    amount: decimalString(amount),
    percentage: decimalPercent(amount, total),
  }]));
}

function monthLabel(parts, timeZone) {
  const instant = zonedDateTimeToUtc({ ...parts, day: 15, hour: 12 }, timeZone);
  return new Intl.DateTimeFormat('fa-IR-u-ca-gregory', { timeZone, month: 'long', year: 'numeric' }).format(instant);
}

function monthPeriods(timeZone, anchor = new Date()) {
  const now = getZonedParts(anchor, timeZone);
  const current = { year: now.year, month: now.month, day: 1 };
  return Array.from({ length: 4 }, (_, index) => {
    const parts = addCalendarMonths(current, index - 3);
    const next = addCalendarMonths(parts, 1);
    return {
      key: `${parts.year}-${String(parts.month).padStart(2, '0')}`,
      name: monthLabel(parts, timeZone),
      start: zonedDateTimeToUtc(parts, timeZone),
      end: zonedDateTimeToUtc(next, timeZone),
    };
  });
}

async function monthlyFinancialSeries(timeZone, anchor, reportRange = null) {
  const periods = monthPeriods(timeZone, anchor);
  const groups = await Promise.all(periods.map(period => {
    if (!reportRange) return paymentEventGroups(period);
    const range = {
      start: new Date(Math.max(period.start.getTime(), reportRange.start.getTime())),
      end: new Date(Math.min(period.end.getTime(), reportRange.end.getTime())),
    };
    if (range.start >= range.end) return { gross: [], refunds: [] };
    return paymentEventGroups(range);
  }));
  return periods.map((period, index) => ({
    key: period.key,
    name: period.name,
    ...summarizePaymentEvents(groups[index]),
  }));
}

function serializeRecentOrder(order) {
  return {
    id: order.id,
    orderCode: order.orderCode,
    customerName: order.customer?.name || 'مشتری ثبت نشده',
    totalToman: order.totalToman === null ? null : String(Math.round(order.totalToman)),
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
    createdAt: order.createdAt,
  };
}

function serializeRecentPayment(payment) {
  return {
    id: payment.id,
    orderId: payment.order?.orderCode || payment.orderId || '',
    amount: decimalString(payment.amount),
    type: payment.type === 'EXPENSE' ? 'پرداختی' : 'دریافتی',
    status: payment.status,
    createdAt: payment.createdAt,
  };
}

export async function getDashboardReport() {
  const timeZone = await resolveTimeZone();
  const now = new Date();
  const zonedNow = getZonedParts(now, timeZone);
  const todayParts = { year: zonedNow.year, month: zonedNow.month, day: zonedNow.day };
  const monthParts = { year: zonedNow.year, month: zonedNow.month, day: 1 };
  const todayRange = { start: zonedDateTimeToUtc(todayParts, timeZone), end: zonedDateTimeToUtc(addCalendarDays(todayParts, 1), timeZone) };
  const monthRange = { start: zonedDateTimeToUtc(monthParts, timeZone), end: zonedDateTimeToUtc(addCalendarMonths(monthParts, 1), timeZone) };

  const [
    orderGroups,
    requestGroups,
    pendingPayments,
    customerGroups,
    shipmentGroups,
    productGroups,
    warehouseRows,
    laptopGroups,
    recentOrders,
    recentPayments,
    todayPayments,
    monthPayments,
    financialSettings,
  ] = await Promise.all([
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.purchaseRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.payment.count({ where: { status: 'pending' } }),
    prisma.customer.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.shipment.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.product.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.$queryRaw`SELECT COUNT(*)::int AS "items", COALESCE(SUM("stock"), 0)::text AS "quantity", COUNT(*) FILTER (WHERE "stock" <= "minStock")::int AS "lowStock", COUNT(*) FILTER (WHERE "stock" <= 0)::int AS "outOfStock" FROM "WarehouseItem" WHERE "isArchived" = false`,
    prisma.laptop.groupBy({ by: ['status'], where: { archivedAt: null }, _count: { _all: true } }),
    prisma.order.findMany({
      select: { id: true, orderCode: true, status: true, totalToman: true, createdAt: true, customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 7,
    }),
    prisma.payment.findMany({
      select: { id: true, orderId: true, amount: true, type: true, status: true, createdAt: true, order: { select: { orderCode: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    paymentEventGroups(todayRange),
    paymentEventGroups(monthRange),
    prisma.setting.findMany({ where: { key: { in: ['aed_toman_rate', 'aedLastUpdate'] } }, select: { key: true, value: true } }),
  ]);

  const orderCounts = Object.fromEntries(orderGroups.map(row => [row.status, row._count._all]));
  const requestCounts = Object.fromEntries(requestGroups.map(row => [row.status, row._count._all]));
  const customerCounts = Object.fromEntries(customerGroups.map(row => [row.status, row._count._all]));
  const shipmentCounts = Object.fromEntries(shipmentGroups.map(row => [row.status, row._count._all]));
  const productCounts = Object.fromEntries(productGroups.map(row => [row.status, row._count._all]));
  const laptopCounts = Object.fromEntries(laptopGroups.map(row => [row.status, row._count._all]));
  const warehouse = warehouseRows[0] || { items: 0, quantity: '0', lowStock: 0, outOfStock: 0 };
  const today = summarizePaymentEvents(todayPayments);
  const month = summarizePaymentEvents(monthPayments);
  const settings = new Map(financialSettings.map(row => [row.key, row.value]));
  const activeOrders = orderGroups.reduce((count, row) => ['delivered', 'cancelled'].includes(row.status) ? count : count + row._count._all, 0);
  const totalOrders = orderGroups.reduce((count, row) => count + row._count._all, 0);
  const totalCustomers = customerGroups.reduce((count, row) => count + row._count._all, 0);
  const totalProducts = productGroups.reduce((count, row) => count + row._count._all, 0);
  const unshipped = (shipmentCounts.PENDING || 0) + (shipmentCounts.READY || 0);

  return {
    generatedAt: now,
    timeZone,
    summary: {
      todayRevenue: today.netRevenue,
      monthNetCashFlow: month.netCashFlow,
      activeOrders,
      totalOrders,
      pendingPayments,
      activeCustomers: customerCounts.active || 0,
      totalCustomers,
    },
    purchaseRequests: {
      total: requestGroups.reduce((count, row) => count + row._count._all, 0),
      pending: requestCounts.pending || 0,
      priceTagged: requestCounts.price_tagged || 0,
      approved: requestCounts.approved || 0,
      converted: ['new_order', 'purchased', 'warehouse_dubai', 'shipped', 'delivered'].reduce((count, status) => count + (requestCounts[status] || 0), 0),
    },
    shipments: {
      unshipped,
      readyToShip: (shipmentCounts.PENDING || 0) + (shipmentCounts.READY || 0),
      pending: shipmentCounts.PENDING || 0,
      inTransit: (shipmentCounts.SHIPPED || 0) + (shipmentCounts.IN_TRANSIT || 0) + (shipmentCounts.OUT_FOR_DELIVERY || 0),
      delivered: shipmentCounts.DELIVERED || 0,
    },
    warehouse: {
      items: Number(warehouse.items || 0),
      quantity: String(warehouse.quantity || '0'),
      lowStock: Number(warehouse.lowStock || 0),
      outOfStock: Number(warehouse.outOfStock || 0),
    },
    products: {
      total: totalProducts,
      active: productCounts.active || 0,
      inactive: totalProducts - (productCounts.active || 0),
    },
    laptops: {
      totalRecords: laptopGroups.reduce((count, row) => count + row._count._all, 0),
      totalUnits: String(laptopGroups.reduce((count, row) => count + row._count._all, 0)),
      availableUnits: String(laptopCounts.AVAILABLE || 0),
      reservedUnits: String(laptopCounts.RESERVED || 0),
      soldUnits: String(laptopCounts.SOLD || 0),
    },
    alerts: {
      exchangeRateMissing: !settings.get('aed_toman_rate'),
      exchangeRateLastUpdated: settings.get('aedLastUpdate') || null,
    },
    recentOrders: recentOrders.map(serializeRecentOrder),
    recentPayments: recentPayments.map(serializeRecentPayment),
  };
}

export async function getFinancialReport(query) {
  const timeZone = await resolveTimeZone();
  const range = reportRangeFromQuery(query, timeZone);
  const anchor = range ? new Date(range.end.getTime() - 1) : new Date();
  const orderWhere = {
    status: { not: 'cancelled' },
    ...(range ? { createdAt: { gte: range.start, lt: range.end } } : {}),
  };
  const [groups, monthly, orderValue, orderStatuses] = await Promise.all([
    paymentEventGroups(range),
    monthlyFinancialSeries(timeZone, anchor, range),
    prisma.order.aggregate({ where: orderWhere, _count: { _all: true }, _sum: { totalToman: true }, _avg: { totalToman: true } }),
    prisma.order.groupBy({ by: ['status'], where: range ? { createdAt: { gte: range.start, lt: range.end } } : {}, _count: { _all: true } }),
  ]);
  const summary = summarizePaymentEvents(groups);
  const methods = paymentMethodBreakdown(groups);
  const methodAmounts = Object.fromEntries(methods.map(row => [row.method, row.amount]));
  const onlineAmount = decimal(methodAmounts.ONLINE);
  const netRevenue = decimal(summary.netRevenue);
  const netCashFlow = decimal(summary.netCashFlow);

  return {
    generatedAt: new Date(),
    timeZone,
    filters: {
      startDate: query.startDate || null,
      endDate: query.endDate || null,
      groupBy: query.groupBy,
    },
    summary: {
      ...summary,
      averageOrderValue: orderValue._avg.totalToman === null ? '0' : String(Math.round(orderValue._avg.totalToman)),
      totalOrderValue: orderValue._sum.totalToman === null ? '0' : String(Math.round(orderValue._sum.totalToman)),
      orderCount: orderValue._count._all,
      onlineShare: decimalPercent(onlineAmount, netRevenue),
      netMargin: decimalPercent(netCashFlow, netRevenue),
    },
    paymentMethods: methods,
    expenses: expenseBreakdown(groups),
    orderStatuses: orderStatuses.map(row => ({ status: row.status, count: row._count._all })),
    monthly,
    historicalData: {
      commissionSnapshotAvailable: false,
      exchangeRateSnapshotAvailable: false,
      shippingSnapshotAvailable: false,
    },
  };
}
