import 'server-only';

import { Prisma } from '@/generated/prisma';
import {
  ADMIN_INVENTORY_SORTS,
  ADMIN_INVENTORY_STATUSES,
  buildAdminInventoryMovementReason,
  deriveAdminInventoryStatus,
} from '@/lib/adminProductInventoryDomain';
import { getProductCoverImage } from '@/lib/productGallery';
import { deriveProductInventoryState, ProductInventoryError } from '@/lib/productInventoryDomain';
import {
  adjustProductInventoryStockInTransaction,
  runSerializableWithRetry,
} from '@/lib/productInventoryService';

const variantInclude = Object.freeze({
  product: {
    select: {
      id: true,
      nameFa: true,
      nameEn: true,
      image: true,
      supplyMode: true,
      brand: { select: { id: true, name: true, faName: true } },
      category: { select: { id: true, name: true, query: true } },
      images: {
        select: { id: true, url: true, sortOrder: true, isPrimary: true, altFa: true, altEn: true },
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        take: 1,
      },
    },
  },
  inventory: true,
  options: {
    include: {
      attribute: { select: { id: true, code: true, nameFa: true, nameEn: true, sortOrder: true } },
      attributeOption: { select: { id: true, code: true, labelFa: true, labelEn: true, swatchHex: true } },
    },
    orderBy: [{ attribute: { sortOrder: 'asc' } }, { attribute: { code: 'asc' } }],
  },
});

function notFound(message, code = 'PRODUCT_INVENTORY_NOT_FOUND') {
  return new ProductInventoryError(message, 404, code);
}

function conflict(message, code) {
  return new ProductInventoryError(message, 409, code);
}

export function serializeAdminInventoryRow(variant) {
  const options = (variant.options || []).map(row => ({
    attributeCode: row.attribute.code,
    attributeNameFa: row.attribute.nameFa,
    attributeNameEn: row.attribute.nameEn,
    optionCode: row.attributeOption.code,
    labelFa: row.attributeOption.labelFa,
    labelEn: row.attributeOption.labelEn,
    swatchHex: row.attributeOption.swatchHex,
  }));
  const inventory = variant.inventory ? {
    id: variant.inventory.id,
    ...deriveProductInventoryState(variant.inventory),
    createdAt: variant.inventory.createdAt.toISOString(),
    updatedAt: variant.inventory.updatedAt.toISOString(),
  } : null;
  return {
    productId: variant.product.id,
    productVariantId: variant.id,
    productNameFa: variant.product.nameFa,
    productNameEn: variant.product.nameEn,
    coverImage: getProductCoverImage(variant.product, null),
    sku: variant.sku,
    isActive: variant.isActive,
    options,
    variantLabel: options.map(option => option.labelFa || option.labelEn).filter(Boolean).join(' / ') || 'پیش‌فرض',
    category: variant.product.category ? {
      id: variant.product.category.id,
      name: variant.product.category.name,
      query: variant.product.category.query,
    } : null,
    brand: variant.product.brand ? {
      id: variant.product.brand.id,
      name: variant.product.brand.name,
      faName: variant.product.brand.faName,
    } : null,
    inventory,
    status: deriveAdminInventoryStatus(variant.inventory),
    reserved: Boolean(variant.inventory?.reserved > 0),
  };
}

function parseListInput(input = {}) {
  const page = Number(input.page || 1);
  const limit = Number(input.limit || 25);
  const status = input.status || '';
  const sort = input.sort || 'attention';
  if (!Number.isSafeInteger(page) || page < 1 || ![25, 50].includes(limit)
    || (status && !ADMIN_INVENTORY_STATUSES.includes(status))
    || !ADMIN_INVENTORY_SORTS.includes(sort)) {
    throw new ProductInventoryError('پارامترهای فهرست موجودی معتبر نیست.');
  }
  return {
    page,
    limit,
    status,
    sort,
    search: String(input.search || '').trim().slice(0, 160),
    categoryId: String(input.categoryId || '').trim().slice(0, 128),
    brandId: String(input.brandId || '').trim().slice(0, 128),
    productId: String(input.productId || '').trim().slice(0, 128),
    location: String(input.location || '').trim().slice(0, 200),
  };
}

function statusSql(status) {
  if (status === 'RESERVED') return Prisma.sql`i."reserved" > 0`;
  if (status === 'ATTENTION') return Prisma.sql`i."id" IS NULL OR (i."stock" - i."reserved") <= i."minStock"`;
  if (status === 'UNINITIALIZED') return Prisma.sql`i."id" IS NULL`;
  if (status === 'OUT_OF_STOCK') return Prisma.sql`i."id" IS NOT NULL AND (i."stock" - i."reserved") <= 0`;
  if (status === 'LOW_STOCK') return Prisma.sql`i."id" IS NOT NULL AND (i."stock" - i."reserved") > 0 AND (i."stock" - i."reserved") <= i."minStock"`;
  if (status === 'IN_STOCK') return Prisma.sql`i."id" IS NOT NULL AND (i."stock" - i."reserved") > i."minStock"`;
  return Prisma.sql`TRUE`;
}

function orderSql(sort) {
  const available = Prisma.sql`COALESCE(i."stock" - i."reserved", 0)`;
  if (sort === 'available_asc') return Prisma.sql`${available} ASC, p."nameFa" ASC, v."sortOrder" ASC, v."id" ASC`;
  if (sort === 'available_desc') return Prisma.sql`${available} DESC, p."nameFa" ASC, v."sortOrder" ASC, v."id" ASC`;
  if (sort === 'stock_desc') return Prisma.sql`COALESCE(i."stock", 0) DESC, p."nameFa" ASC, v."id" ASC`;
  if (sort === 'reserved_desc') return Prisma.sql`COALESCE(i."reserved", 0) DESC, p."nameFa" ASC, v."id" ASC`;
  if (sort === 'updated_desc') return Prisma.sql`COALESCE(i."updatedAt", v."updatedAt") DESC, v."id" ASC`;
  if (sort === 'product_asc') return Prisma.sql`p."nameFa" ASC, v."sortOrder" ASC, v."id" ASC`;
  return Prisma.sql`
    CASE
      WHEN i."id" IS NULL THEN 0
      WHEN (i."stock" - i."reserved") <= 0 THEN 1
      WHEN (i."stock" - i."reserved") <= i."minStock" THEN 2
      ELSE 3
    END ASC,
    p."nameFa" ASC,
    v."sortOrder" ASC,
    v."id" ASC
  `;
}

function whereSql(filters) {
  const clauses = [Prisma.sql`p."supplyMode" = 'IRAN_STOCK'::"ProductSupplyMode"`];
  if (filters.categoryId) clauses.push(Prisma.sql`p."categoryId" = ${filters.categoryId}`);
  if (filters.brandId) clauses.push(Prisma.sql`p."brandId" = ${filters.brandId}`);
  if (filters.productId) clauses.push(Prisma.sql`p."id" = ${filters.productId}`);
  if (filters.location) clauses.push(Prisma.sql`i."location" = ${filters.location}`);
  if (filters.status) clauses.push(statusSql(filters.status));
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    clauses.push(Prisma.sql`(
      p."nameFa" ILIKE ${pattern}
      OR p."nameEn" ILIKE ${pattern}
      OR v."sku" ILIKE ${pattern}
      OR EXISTS (
        SELECT 1
        FROM "ProductVariantOption" vo
        JOIN "AttributeOption" ao ON ao."id" = vo."attributeOptionId"
        WHERE vo."variantId" = v."id"
          AND (ao."labelFa" ILIKE ${pattern} OR ao."labelEn" ILIKE ${pattern})
      )
    )`);
  }
  return Prisma.join(clauses, ' AND ');
}

export async function listAdminProductInventory(client, rawInput = {}) {
  const filters = parseListInput(rawInput);
  const where = whereSql(filters);
  const offset = (filters.page - 1) * filters.limit;
  const [idRows, countRows, summaryRows, brands, categories, products, locationRows] = await Promise.all([
    client.$queryRaw(Prisma.sql`
      SELECT v."id"
      FROM "ProductVariant" v
      JOIN "Product" p ON p."id" = v."productId"
      LEFT JOIN "ProductInventory" i ON i."variantId" = v."id"
      WHERE ${where}
      ORDER BY ${orderSql(filters.sort)}
      LIMIT ${filters.limit} OFFSET ${offset}
    `),
    client.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::integer AS "count"
      FROM "ProductVariant" v
      JOIN "Product" p ON p."id" = v."productId"
      LEFT JOIN "ProductInventory" i ON i."variantId" = v."id"
      WHERE ${where}
    `),
    client.$queryRaw(Prisma.sql`
      SELECT
        COUNT(*)::integer AS "total",
        COUNT(*) FILTER (WHERE i."id" IS NOT NULL AND (i."stock" - i."reserved") > i."minStock")::integer AS "inStock",
        COUNT(*) FILTER (WHERE i."id" IS NOT NULL AND (i."stock" - i."reserved") > 0 AND (i."stock" - i."reserved") <= i."minStock")::integer AS "lowStock",
        COUNT(*) FILTER (WHERE i."id" IS NOT NULL AND (i."stock" - i."reserved") <= 0)::integer AS "outOfStock",
        COUNT(*) FILTER (WHERE i."reserved" > 0)::integer AS "reserved",
        COUNT(*) FILTER (WHERE i."id" IS NULL)::integer AS "uninitialized"
      FROM "ProductVariant" v
      JOIN "Product" p ON p."id" = v."productId"
      LEFT JOIN "ProductInventory" i ON i."variantId" = v."id"
      WHERE p."supplyMode" = 'IRAN_STOCK'::"ProductSupplyMode"
    `),
    client.brand.findMany({
      where: { products: { some: { supplyMode: 'IRAN_STOCK', variants: { some: {} } } } },
      select: { id: true, name: true, faName: true },
      orderBy: [{ faName: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    }),
    client.category.findMany({
      where: { products: { some: { supplyMode: 'IRAN_STOCK', variants: { some: {} } } } },
      select: { id: true, name: true, query: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    }),
    client.product.findMany({
      where: { supplyMode: 'IRAN_STOCK', variants: { some: {} } },
      select: { id: true, nameFa: true, nameEn: true },
      orderBy: [{ nameFa: 'asc' }, { id: 'asc' }],
    }),
    client.productInventory.findMany({
      where: { location: { not: null }, variant: { product: { supplyMode: 'IRAN_STOCK' } } },
      distinct: ['location'],
      select: { location: true },
      orderBy: { location: 'asc' },
    }),
  ]);
  const ids = idRows.map(row => row.id);
  const variants = ids.length ? await client.productVariant.findMany({
    where: { id: { in: ids } },
    include: variantInclude,
  }) : [];
  const byId = new Map(variants.map(variant => [variant.id, variant]));
  const summary = summaryRows[0] || {};
  const total = Number(countRows[0]?.count || 0);
  return {
    data: ids.map(id => byId.get(id)).filter(Boolean).map(serializeAdminInventoryRow),
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.max(1, Math.ceil(total / filters.limit)) },
    metrics: {
      total: Number(summary.total || 0),
      inStock: Number(summary.inStock || 0),
      lowStock: Number(summary.lowStock || 0),
      outOfStock: Number(summary.outOfStock || 0),
      reserved: Number(summary.reserved || 0),
      uninitialized: Number(summary.uninitialized || 0),
      attention: Number(summary.lowStock || 0) + Number(summary.outOfStock || 0) + Number(summary.uninitialized || 0),
    },
    filters: {
      brands,
      categories,
      products,
      locations: locationRows.map(row => row.location).filter(Boolean),
    },
  };
}

async function loadIranVariant(client, variantId) {
  const variant = await client.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, productId: true, isActive: true, product: { select: { supplyMode: true } }, inventory: true },
  });
  if (!variant) throw notFound('تنوع محصول پیدا نشد.', 'VARIANT_NOT_FOUND');
  if (variant.product.supplyMode !== 'IRAN_STOCK') throw conflict('این تنوع موجودی فیزیکی ایران ندارد.', 'PRODUCT_INVENTORY_NOT_APPLICABLE');
  return variant;
}

export async function updateAdminProductInventoryConfiguration(client, variantId, data) {
  const variant = await loadIranVariant(client, variantId);
  if (!variant.inventory) throw notFound('موجودی این تنوع هنوز مقداردهی نشده است.');
  const inventory = await client.productInventory.update({ where: { id: variant.inventory.id }, data });
  return { productId: variant.productId, inventory: { id: inventory.id, ...deriveProductInventoryState(inventory), updatedAt: inventory.updatedAt.toISOString() } };
}

export async function adjustAdminProductInventory(client, variantId, input, adminId) {
  return runSerializableWithRetry(client, async tx => {
    const variant = await loadIranVariant(tx, variantId);
    if (!variant.isActive) throw conflict('برای تنوع غیرفعال نمی‌توان موجودی را تغییر داد.', 'VARIANT_INACTIVE');
    if (!variant.inventory) throw notFound('موجودی این تنوع هنوز مقداردهی نشده است.');
    const replay = await tx.productInventoryMovement.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (replay) {
      const requestMatches = input.mode === 'ADD'
        ? replay.quantity === input.value
        : input.mode === 'REMOVE'
          ? replay.quantity === -input.value
          : replay.stockAfter === input.value;
      if (replay.inventoryId !== variant.inventory.id || replay.type !== 'ADJUSTMENT' || !requestMatches
        || replay.reason !== buildAdminInventoryMovementReason(input.reasonCode, input.note)) {
        throw conflict('کلید تکرارناپذیری قبلاً برای عملیات دیگری استفاده شده است.', 'IDEMPOTENCY_KEY_CONFLICT');
      }
      const current = await tx.productInventory.findUnique({ where: { id: variant.inventory.id } });
      return { productId: variant.productId, delta: replay.quantity, replayed: true, inventory: { id: current.id, ...deriveProductInventoryState(current), updatedAt: current.updatedAt.toISOString() } };
    }
    const delta = input.mode === 'ADD' ? input.value : input.mode === 'REMOVE' ? -input.value : input.value - variant.inventory.stock;
    if (delta === 0) throw new ProductInventoryError('موجودی فیزی واردشده با موجودی فعلی برابر است.');
    const inventory = await adjustProductInventoryStockInTransaction(tx, {
      inventoryId: variant.inventory.id,
      delta,
      reason: buildAdminInventoryMovementReason(input.reasonCode, input.note),
      idempotencyKey: input.idempotencyKey,
      adminId,
    });
    return { productId: variant.productId, delta, replayed: false, inventory };
  }, { retryUnique: true });
}

export async function getAdminProductInventoryHistory(client, variantId) {
  const variant = await loadIranVariant(client, variantId);
  if (!variant.inventory) return { inventoryId: null, movements: [], reservations: [] };
  const [movements, reservations] = await Promise.all([
    client.productInventoryMovement.findMany({
      where: { inventoryId: variant.inventory.id },
      include: {
        admin: { select: { id: true, email: true } },
        reservation: { select: { reservationKey: true, order: { select: { id: true, orderCode: true } } } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    }),
    client.productInventoryReservation.findMany({
      where: { inventoryId: variant.inventory.id },
      include: { order: { select: { id: true, orderCode: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    }),
  ]);
  return {
    inventoryId: variant.inventory.id,
    movements: movements.map(row => ({
      id: row.id,
      type: row.type,
      quantity: row.quantity,
      stockBefore: row.stockBefore,
      stockAfter: row.stockAfter,
      reservedBefore: row.reservedBefore,
      reservedAfter: row.reservedAfter,
      reason: row.reason,
      reference: row.reservation?.reservationKey || null,
      order: row.reservation?.order || null,
      admin: row.admin ? { id: row.admin.id, email: row.admin.email } : null,
      createdAt: row.createdAt.toISOString(),
    })),
    reservations: reservations.map(row => ({
      id: row.id,
      reservationKey: row.reservationKey,
      quantity: row.quantity,
      status: row.status,
      order: row.order,
      expiresAt: row.expiresAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}
