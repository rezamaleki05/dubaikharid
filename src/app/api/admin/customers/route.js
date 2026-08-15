import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { attachOrderAggregates, CUSTOMER_STATUS_SET, validateCustomerInput } from '@/lib/adminCustomers';
import { prisma } from '@/lib/prisma';

function positiveInteger(value, fallback, maximum) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 && number <= maximum ? number : null;
}

function growth(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CUSTOMERS_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = positiveInteger(searchParams.get('page'), 1, 100000);
  const limit = positiveInteger(searchParams.get('limit'), 8, 100);
  const search = searchParams.get('search')?.trim().slice(0, 120) || '';
  const group = searchParams.get('group')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';
  const city = searchParams.get('city')?.trim() || '';
  if (!page || !limit || (status && !CUSTOMER_STATUS_SET.has(status)) || group.length > 80 || city.length > 120) {
    return NextResponse.json({ error: 'پارامترهای فیلتر مشتری معتبر نیستند.' }, { status: 400 });
  }

  const where = {};
  if (group) where.group = group;
  if (status) where.status = status;
  if (city) where.city = city;
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
    { code: { contains: search, mode: 'insensitive' } },
    { city: { contains: search, mode: 'insensitive' } },
  ];
  const normalizedSearch = search.replace(/[^\d+]/g, '');
  if (normalizedSearch) where.OR.push({ normalizedPhone: { contains: normalizedSearch, mode: 'insensitive' } });

  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  try {
    const [customers, total, totalCustomers, active, vip, newThisMonth, previousNew, cities, orderAverage] = await Promise.all([
      prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.customer.count({ where }),
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.customer.count({ where: { OR: [{ status: 'vip' }, { group: 'VIP' }] } }),
      prisma.customer.count({ where: { createdAt: { gte: currentMonth } } }),
      prisma.customer.count({ where: { createdAt: { gte: previousMonth, lt: currentMonth } } }),
      prisma.customer.findMany({ distinct: ['city'], where: { city: { not: null } }, select: { city: true }, orderBy: { city: 'asc' } }),
      prisma.order.aggregate({ where: { status: { not: 'cancelled' }, customerId: { not: null } }, _avg: { totalToman: true } }),
    ]);
    const data = await attachOrderAggregates(customers);
    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      stats: {
        total: totalCustomers,
        active,
        newThisMonth,
        vip,
        averagePurchase: Math.round(orderAverage._avg.totalToman || 0),
        growth: { total: growth(newThisMonth, previousNew), active: 0, new: growth(newThisMonth, previousNew), vip: 0 },
      },
      filters: { cities: cities.map(item => item.city).filter(Boolean) },
    });
  } catch (error) {
    console.error('Error fetching admin customers:', error);
    return NextResponse.json({ error: 'دریافت مشتریان با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CUSTOMERS_EDIT);
  if (response) return response;
  let body;
  try { body = await request.json(); } catch { body = null; }
  const validation = validateCustomerInput(body);
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });

  try {
    const customer = await prisma.customer.create({ data: validation.data });
    await logAdminActivity({ adminId: admin.id, action: 'CUSTOMER_CREATED', entityType: 'Customer', entityId: customer.id, request });
    return NextResponse.json((await attachOrderAggregates([customer]))[0], { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002' || error?.cause?.code === '23505') {
      return NextResponse.json({ error: 'مشتری دیگری با این شماره تماس ثبت شده است.' }, { status: 409 });
    }
    console.error('Error creating admin customer:', error);
    return NextResponse.json({ error: 'ثبت مشتری با خطا مواجه شد.' }, { status: 500 });
  }
}
