import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  assertLaptopCatalogSelection,
  LAPTOP_STATUS_SET,
  serializeLaptop,
  validateLaptopPayload,
} from '@/lib/adminLaptops';
import { countAvailableLaptopGroups, laptopSpecGroupKey } from '@/lib/laptopCatalog';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

function positiveInteger(value, fallback, maximum) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : null;
}

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_VIEW);
  if (response) return response;
  const { searchParams } = new URL(request.url);
  const page = positiveInteger(searchParams.get('page'), 1, 1_000_000);
  const limit = positiveInteger(searchParams.get('limit'), 20, 100);
  const search = searchParams.get('search')?.trim().slice(0, 160) || '';
  const brand = searchParams.get('brand')?.trim().slice(0, 120) || '';
  const ram = searchParams.get('ram')?.trim().slice(0, 64) || '';
  const cpu = searchParams.get('cpu')?.trim().slice(0, 120) || '';
  const statusInput = searchParams.get('status')?.trim().toUpperCase() || '';
  const status = { AVAILABLE: 'AVAILABLE', RESERVED: 'RESERVED', SOLD: 'SOLD', INACTIVE: 'INACTIVE', AVAILABLE_: 'AVAILABLE' }[statusInput]
    || ({ available: 'AVAILABLE', reserved: 'RESERVED', sold: 'SOLD', unavailable: 'INACTIVE' }[searchParams.get('status')?.trim().toLowerCase()]);
  if (!page || !limit || (statusInput && (!status || !LAPTOP_STATUS_SET.has(status)))) {
    return NextResponse.json({ error: 'پارامترهای فیلتر لپ‌تاپ معتبر نیستند.' }, { status: 400 });
  }

  const where = {
    archivedAt: null,
    ...(status ? { status } : {}),
    ...(brand ? { brand: { equals: brand, mode: 'insensitive' } } : {}),
    ...(ram ? { ram: { contains: ram, mode: 'insensitive' } } : {}),
    ...(cpu ? { cpu: { contains: cpu, mode: 'insensitive' } } : {}),
  };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
      { internalSku: { contains: search, mode: 'insensitive' } },
      { cpu: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const statsWhere = { OR: [{ archivedAt: null }, { status: 'SOLD' }] };
    const [laptops, total, statusRows, brands, soldTotals, monthlySoldRows, availableUnits] = await Promise.all([
      prisma.laptop.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.laptop.count({ where }),
      prisma.laptop.groupBy({ by: ['status'], where: statsWhere, _count: { _all: true } }),
      prisma.laptop.findMany({ where: { archivedAt: null, brand: { not: null } }, distinct: ['brand'], select: { brand: true }, orderBy: { brand: 'asc' } }),
      prisma.laptop.aggregate({
        where: { status: 'SOLD' },
        _sum: { priceToman: true, purchasePriceAed: true, extraCostsAed: true },
      }),
      prisma.$queryRaw`
        SELECT
          to_char(date_trunc('month', "soldAt"), 'YYYY-MM') AS "key",
          COALESCE(SUM("priceToman"), 0)::text AS "revenueToman",
          COALESCE(SUM(COALESCE("purchasePriceAed", 0) + COALESCE("extraCostsAed", 0)), 0)::text AS "costAed"
        FROM "Laptop"
        WHERE "status" = 'SOLD'
          AND "soldAt" >= date_trunc('month', CURRENT_DATE) - interval '5 months'
        GROUP BY date_trunc('month', "soldAt")
        ORDER BY date_trunc('month', "soldAt")
      `,
      prisma.laptop.findMany({
        where: { status: 'AVAILABLE', archivedAt: null, reservedOrderId: null },
        select: { brand: true, model: true, cpu: true, ram: true, storage: true, secondaryStorage: true, gpu: true, screen: true, condition: true, priceToman: true, status: true, archivedAt: true, reservedOrderId: true },
      }),
    ]);
    const groupCounts = countAvailableLaptopGroups(availableUnits);
    const statusCounts = Object.fromEntries(statusRows.map(row => [row.status, row._count._all]));
    const monthlyMap = new Map(monthlySoldRows.map(row => [row.key, row]));
    const now = new Date();
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      const row = monthlyMap.get(key);
      return {
        key,
        label: new Intl.DateTimeFormat('fa-IR-u-ca-gregory', { month: 'long' }).format(date),
        revenueToman: row?.revenueToman || '0',
        costAed: row?.costAed || '0',
      };
    });
    return NextResponse.json({
      data: laptops.map(laptop => ({
        ...serializeLaptop(laptop),
        specGroupKey: laptopSpecGroupKey(laptop),
        groupAvailableCount: groupCounts.get(laptopSpecGroupKey(laptop)) || 0,
      })),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      stats: {
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
        available: statusCounts.AVAILABLE || 0,
        reserved: statusCounts.RESERVED || 0,
        sold: statusCounts.SOLD || 0,
        inactive: statusCounts.INACTIVE || 0,
        soldRevenueToman: soldTotals._sum.priceToman?.toFixed(0) || '0',
        soldCostAed: (soldTotals._sum.purchasePriceAed || 0).toString() === '0'
          ? (soldTotals._sum.extraCostsAed?.toFixed(2) || '0')
          : soldTotals._sum.purchasePriceAed.plus(soldTotals._sum.extraCostsAed || 0).toFixed(2),
        monthly,
      },
      filters: { brands: brands.map(row => row.brand).filter(Boolean) },
    });
  } catch (error) {
    console.error('Error fetching admin laptops:', error);
    return NextResponse.json({ error: 'دریافت لپ‌تاپ‌ها با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_EDIT);
  if (response) return response;
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }); }
  const validated = validateLaptopPayload(body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });

  try {
    await assertLaptopCatalogSelection(prisma, { brandName: validated.data.brand, modelName: validated.data.model });
    const laptop = await prisma.laptop.create({
      data: {
        ...validated.data,
        ...(validated.data.status === 'SOLD' ? { soldAt: new Date() } : {}),
      },
    });
    await logAdminActivity({
      adminId: admin.id, action: 'LAPTOP_CREATED', entityType: 'Laptop', entityId: laptop.id,
      metadata: { status: laptop.status, brand: laptop.brand, model: laptop.model, serialNumber: laptop.serialNumber }, request,
    });
    return NextResponse.json(serializeLaptop(laptop), { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'شماره سریال یا کد داخلی قبلاً ثبت شده است.' }, { status: 409 });
    console.error('Error creating admin laptop:', error);
    return NextResponse.json({ error: 'ثبت لپ‌تاپ با خطا مواجه شد.' }, { status: 500 });
  }
}
