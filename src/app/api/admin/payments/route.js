import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  adminPaymentInclude,
  decimalFromOrderTotal,
  parsePaymentCreateInput,
  parsePaymentDate,
  PAYMENT_METHOD_SET,
  PAYMENT_STATUS_SET,
  serializeAdminPayment,
} from '@/lib/adminPayments';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

function positiveInteger(value, fallback, maximum) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 && number <= maximum ? number : null;
}

function growth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function summarize(rows) {
  const income = rows.filter(row => row.type === 'INCOME' && row.status === 'success').reduce((sum, row) => sum + Number(row.amount), 0);
  const expenses = rows.filter(row => row.type === 'EXPENSE' && row.status === 'success').reduce((sum, row) => sum + Number(row.amount), 0);
  return { income, expenses, profit: income - expenses, count: rows.length };
}

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PAYMENTS_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = positiveInteger(searchParams.get('page'), 1, 100000);
  const limit = positiveInteger(searchParams.get('limit'), 12, 100);
  const search = searchParams.get('search')?.trim().slice(0, 120) || '';
  const status = searchParams.get('status');
  const method = searchParams.get('method');
  const category = searchParams.get('category')?.trim().slice(0, 120) || '';
  const from = parsePaymentDate(searchParams.get('from'));
  const to = parsePaymentDate(searchParams.get('to'), true);
  if (!page || !limit || (status && !PAYMENT_STATUS_SET.has(status)) || (method && !PAYMENT_METHOD_SET.has(method)) || from === undefined || to === undefined) {
    return NextResponse.json({ error: 'پارامترهای فیلتر پرداخت معتبر نیستند.' }, { status: 400 });
  }

  const where = {};
  if (status) where.status = status;
  if (method) where.method = method;
  if (category) where.category = category;
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
      { counterparty: { contains: search, mode: 'insensitive' } },
      { order: { is: { orderCode: { contains: search, mode: 'insensitive' } } } },
      { order: { is: { customer: { is: { name: { contains: search, mode: 'insensitive' } } } } } },
      { order: { is: { customer: { is: { phone: { contains: search, mode: 'insensitive' } } } } } },
      { order: { is: { items: { some: { name: { contains: search, mode: 'insensitive' } } } } } },
    ];
  }

  const dateWhere = from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const [payments, total, statsRows, trendRows, accountRows] = await Promise.all([
      prisma.payment.findMany({ where, include: adminPaymentInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.payment.count({ where }),
      prisma.payment.findMany({ where: dateWhere, select: { amount: true, type: true, status: true, method: true, createdAt: true } }),
      prisma.payment.findMany({ where: { createdAt: { gte: sixtyDaysAgo } }, select: { amount: true, type: true, status: true, method: true, createdAt: true } }),
      prisma.payment.findMany({ where: { status: 'success' }, select: { amount: true, type: true, account: true } }),
    ]);
    const summary = summarize(statsRows);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const current = summarize(trendRows.filter(row => row.createdAt >= thirtyDaysAgo));
    const previous = summarize(trendRows.filter(row => row.createdAt < thirtyDaysAgo));
    const methodTotals = Object.fromEntries(['ONLINE', 'CARD', 'BANK_TRANSFER', 'CASH', 'POS', 'OTHER'].map(code => [code, statsRows.filter(row => row.method === code).reduce((sum, row) => sum + Number(row.amount), 0)]));
    const distribution = {
      income: statsRows.filter(row => row.type === 'INCOME' && row.status === 'success').length,
      expense: statsRows.filter(row => row.type === 'EXPENSE' && row.status === 'success').length,
      pending: statsRows.filter(row => row.status === 'pending').length,
    };
    const flowWeeks = Array.from({ length: 5 }, (_, index) => {
      const start = new Date(monthStart.getTime() + index * 7 * 86400000);
      const end = new Date(start.getTime() + 7 * 86400000);
      const values = summarize(statsRows.filter(row => row.createdAt >= start && row.createdAt < end));
      return { income: values.income, expense: values.expenses, profit: values.profit, label: `هفته ${String(index + 1).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit])}` };
    });
    const balances = new Map();
    for (const row of accountRows) {
      const key = row.account || 'بدون حساب مشخص';
      const signed = row.type === 'EXPENSE' ? -Number(row.amount) : Number(row.amount);
      balances.set(key, (balances.get(key) || 0) + signed);
    }
    return NextResponse.json({
      data: payments.map(serializeAdminPayment),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      stats: {
        ...summary,
        balance: [...balances.values()].reduce((sum, value) => sum + value, 0),
        growth: { income: growth(current.income, previous.income), expenses: growth(current.expenses, previous.expenses), profit: growth(current.profit, previous.profit), count: growth(current.count, previous.count) },
        distribution,
        methodTotals,
        flowWeeks,
        balances: [...balances].map(([account, amount]) => ({ account, amount })),
      },
    });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    return NextResponse.json({ error: 'دریافت پرداخت‌ها با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PAYMENTS_EDIT);
  if (response) return response;
  let body;
  try { body = await request.json(); } catch { body = null; }
  const parsed = parsePaymentCreateInput(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const payment = await prisma.$transaction(async tx => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: parsed.data.orderId }, { orderCode: parsed.data.orderId }] },
        select: { id: true, totalToman: true, status: true },
      });
      if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { status: 404 });
      if (order.status === 'cancelled') throw Object.assign(new Error('ORDER_CANCELLED'), { status: 409 });
      const expected = decimalFromOrderTotal(order.totalToman);
      if (!expected) throw Object.assign(new Error('ORDER_TOTAL_MISSING'), { status: 409 });
      const existing = await tx.payment.findMany({ where: { orderId: order.id }, select: { amount: true, status: true } });
      const successful = existing.filter(item => item.status === 'success').reduce((sum, item) => sum.plus(item.amount), expected.minus(expected));
      if (successful.greaterThanOrEqualTo(expected)) throw Object.assign(new Error('ORDER_ALREADY_PAID'), { status: 409 });
      if (!successful.isZero()) throw Object.assign(new Error('PARTIAL_NOT_SUPPORTED'), { status: 409 });
      if (existing.some(item => item.status === 'pending')) throw Object.assign(new Error('PAYMENT_ALREADY_PENDING'), { status: 409 });
      return tx.payment.create({
        data: {
          orderId: order.id,
          amount: expected,
          currency: 'TOMAN',
          method: parsed.data.method,
          type: 'INCOME',
          category: 'سفارشات',
          status: parsed.data.status,
          reference: parsed.data.reference,
          account: parsed.data.account,
          notes: parsed.data.notes,
          paidAt: parsed.data.status === 'success' ? new Date() : null,
          confirmedById: parsed.data.status === 'success' ? admin.id : null,
        },
        include: adminPaymentInclude,
      });
    }, { isolationLevel: 'Serializable' });
    await logAdminActivity({ adminId: admin.id, action: payment.status === 'success' ? 'PAYMENT_MARKED_PAID' : 'PAYMENT_CREATED', entityType: 'Payment', entityId: payment.id, metadata: { paymentId: payment.id, orderId: payment.orderId, amount: payment.amount.toString(), currency: payment.currency, method: payment.method, status: payment.status }, request });
    return NextResponse.json(serializeAdminPayment(payment), { status: 201 });
  } catch (error) {
    const messages = {
      ORDER_NOT_FOUND: ['سفارش پیدا نشد.', 404], ORDER_CANCELLED: ['برای سفارش لغوشده نمی‌توان پرداخت ثبت کرد.', 409], ORDER_TOTAL_MISSING: ['مبلغ نهایی سفارش هنوز ثبت نشده است.', 409], ORDER_ALREADY_PAID: ['این سفارش قبلاً به‌طور کامل پرداخت شده است.', 409], PARTIAL_NOT_SUPPORTED: ['این سفارش دارای پرداخت ناقص قبلی است و نیاز به بررسی مالی دارد.', 409], PAYMENT_ALREADY_PENDING: ['برای این سفارش یک پرداخت در انتظار وجود دارد.', 409],
    };
    const known = messages[error.message];
    if (known) return NextResponse.json({ error: known[0] }, { status: known[1] });
    console.error('Error creating admin payment:', error);
    return NextResponse.json({ error: 'ثبت پرداخت با خطا مواجه شد.' }, { status: 500 });
  }
}
