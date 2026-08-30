import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  adminWarehouseInclude,
  assertNotLaptopWarehouseItem,
  assertPublishableWarehouseItem,
  resolveWarehouseRelations,
  serializeMovement,
  serializeWarehouseItem,
  validateWarehousePayload,
  WarehouseDomainError,
} from '@/lib/adminWarehouse';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : null;
}

function warehouseErrorResponse(error, fallback) {
  if (error instanceof WarehouseDomainError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error?.code === 'P2002') {
    return NextResponse.json({ error: 'کالایی با این SKU، نامک عمومی یا محصول مرتبط قبلاً ثبت شده است.' }, { status: 409 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: 'عملیات انبار با خطا مواجه شد.' }, { status: 500 });
}

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.WAREHOUSE_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInteger(searchParams.get('page'), 1);
  const limit = parsePositiveInteger(searchParams.get('limit'), 10, 100);
  const search = searchParams.get('search')?.trim().slice(0, 160) || '';
  const brand = searchParams.get('brand')?.trim().slice(0, 160) || '';
  const category = searchParams.get('category')?.trim().slice(0, 160) || '';
  const status = searchParams.get('status')?.trim() || '';
  const mode = searchParams.get('mode')?.trim() || 'all';
  const allowedStatuses = new Set(['', 'موجود', 'کم موجود', 'ناموجود']);
  const allowedModes = new Set(['all', 'lowstock', 'outofstock', 'reserved', 'overreserved', 'sellable']);
  if (!page || !limit || !allowedStatuses.has(status) || !allowedModes.has(mode)) {
    return NextResponse.json({ error: 'پارامترهای فیلتر انبار معتبر نیستند.' }, { status: 400 });
  }

  const where = { isArchived: false };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { brand: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { brand: { is: { faName: { contains: search, mode: 'insensitive' } } } },
    ];
  }
  if (brand) where.brand = { is: { name: { equals: brand, mode: 'insensitive' } } };
  if (category) where.categoryKey = { equals: category, mode: 'insensitive' };

  const stockField = prisma.warehouseItem.fields.stock;
  const reservedField = prisma.warehouseItem.fields.reserved;
  const minStockField = prisma.warehouseItem.fields.minStock;
  if (status === 'موجود') where.stock = { gt: minStockField };
  if (status === 'کم موجود') where.AND = [{ stock: { gt: 0 } }, { stock: { lte: minStockField } }];
  if (status === 'ناموجود') where.stock = 0;
  if (mode === 'lowstock') where.AND = [...(where.AND || []), { stock: { gt: 0 } }, { stock: { lte: minStockField } }];
  if (mode === 'outofstock') where.stock = 0;
  if (mode === 'reserved') where.reserved = { gt: 0 };
  if (mode === 'overreserved') where.reserved = { gt: stockField };
  if (mode === 'sellable') where.stock = { gt: reservedField };

  try {
    const [items, total, summaryRows, recentMovements] = await Promise.all([
      prisma.warehouseItem.findMany({
        where,
        include: adminWarehouseInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.warehouseItem.count({ where }),
      prisma.$queryRaw`
        SELECT
          COALESCE(SUM(w."stock" * w."price"), 0)::double precision AS "totalValue",
          COALESCE(SUM(w."stock" - w."reserved"), 0)::bigint AS "totalSellable",
          COALESCE(SUM(w."reserved"), 0)::bigint AS "totalReserved",
          COUNT(*) FILTER (WHERE w."stock" > 0 AND w."stock" <= w."minStock")::bigint AS "lowStockCount",
          COUNT(*) FILTER (WHERE w."stock" = 0)::bigint AS "outOfStockCount",
          COUNT(*) FILTER (WHERE w."reserved" > w."stock")::bigint AS "overReservedCount",
          COALESCE(ARRAY_AGG(DISTINCT b."name") FILTER (WHERE b."name" IS NOT NULL), ARRAY[]::text[]) AS brands,
          COALESCE(ARRAY_AGG(DISTINCT COALESCE(w."categoryKey", c."query", c."name"))
            FILTER (WHERE COALESCE(w."categoryKey", c."query", c."name") IS NOT NULL), ARRAY[]::text[]) AS categories
        FROM "WarehouseItem" w
        LEFT JOIN "Brand" b ON b."id" = w."brandId"
        LEFT JOIN "Category" c ON c."id" = w."categoryId"
        WHERE w."isArchived" = false
      `,
      prisma.inventoryMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          admin: { select: { id: true, email: true } },
          warehouseItem: { select: { id: true, name: true, sku: true } },
        },
      }),
    ]);
    const summary = summaryRows[0] || {};
    const stats = {
      totalValue: Number(summary.totalValue) || 0,
      totalSellable: Number(summary.totalSellable) || 0,
      totalReserved: Number(summary.totalReserved) || 0,
      lowStockCount: Number(summary.lowStockCount) || 0,
      outOfStockCount: Number(summary.outOfStockCount) || 0,
      overReservedCount: Number(summary.overReservedCount) || 0,
    };
    const brands = Array.isArray(summary.brands) ? summary.brands.sort() : [];
    const categories = Array.isArray(summary.categories) ? summary.categories.sort() : [];

    return NextResponse.json({
      data: items.map(serializeWarehouseItem),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      stats,
      filters: { brands, categories },
      recentHistory: recentMovements.map(movement => ({
        ...serializeMovement(movement),
        productName: movement.warehouseItem.name,
        productId: movement.warehouseItem.id,
        sku: movement.warehouseItem.sku,
      })),
    });
  } catch (error) {
    return warehouseErrorResponse(error, 'Error fetching warehouse items:');
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.WAREHOUSE_EDIT);
  if (response) return response;
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }); }
  const validated = validateWarehousePayload(body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });

  try {
    const item = await prisma.$transaction(async tx => {
      const relationData = await resolveWarehouseRelations(tx, validated.relations);
      const createData = {
        ...validated.data,
        ...relationData,
        ...(validated.images?.length ? {
          images: { create: validated.images },
        } : {}),
        ...(validated.data.isPublished ? { publishedAt: new Date() } : {}),
      };
      assertNotLaptopWarehouseItem({ name: createData.name, categoryKey: createData.categoryKey });
      assertPublishableWarehouseItem(createData);
      const created = await tx.warehouseItem.create({ data: createData });
      await tx.inventoryMovement.create({ data: {
        warehouseItemId: created.id,
        type: 'INITIAL_STOCK',
        quantityChange: created.stock,
        quantityBefore: 0,
        quantityAfter: created.stock,
        reservedBefore: 0,
        reservedAfter: created.reserved,
        reason: 'ثبت اولیه کالا در انبار',
        adminId: admin.id,
      } });
      return tx.warehouseItem.findUnique({ where: { id: created.id }, include: adminWarehouseInclude });
    }, { isolationLevel: 'Serializable' });
    await logAdminActivity({
      adminId: admin.id,
      action: 'WAREHOUSE_ITEM_CREATED',
      entityType: 'WarehouseItem',
      entityId: item.id,
      metadata: { sku: item.sku, initialStock: item.stock, reserved: item.reserved },
      request,
    });
    revalidatePublicCatalog();
    return NextResponse.json(serializeWarehouseItem(item), { status: 201 });
  } catch (error) {
    return warehouseErrorResponse(error, 'Error creating warehouse item:');
  }
}
