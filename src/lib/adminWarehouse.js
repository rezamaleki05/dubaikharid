import 'server-only';

import { randomUUID } from 'node:crypto';

const MAX_IMAGE_LENGTH = 2_800_000;
const MAX_RETRIES = 4;
const CATEGORY_QUERY_MAP = Object.freeze({
  electronics: 'tech', clothing: 'fashion', pants: 'fashion', shoes: 'shoes', bags: 'shoes',
  accessories: 'accessories', watches_glasses: 'accessories', wallets_belts: 'shoes', trending: 'fashion',
});

export class WarehouseDomainError extends Error {
  constructor(message, status = 400, code = 'WAREHOUSE_ERROR') {
    super(message);
    this.name = 'WarehouseDomainError';
    this.status = status;
    this.code = code;
  }
}

export const adminWarehouseInclude = Object.freeze({
  brand: { select: { id: true, name: true, faName: true } },
  category: { select: { id: true, name: true, query: true } },
  product: { select: { id: true, code: true, name: true, slug: true } },
  movements: {
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { admin: { select: { id: true, email: true } } },
  },
  notes: {
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { admin: { select: { id: true, email: true } } },
  },
});

const EDITABLE_FIELDS = new Set([
  'name', 'brandId', 'brand', 'categoryId', 'category', 'productId', 'sku', 'price',
  'stock', 'reserved', 'minStock', 'location', 'image', 'gender', 'isBestSeller',
  'hasDiscount', 'discountPercent', 'isArchived',
]);

function cleanOptionalString(value, maxLength) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength) return undefined;
  return cleaned;
}

function parseInteger(value, { min = 0, max = 1_000_000_000 } = {}) {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
}

function parseNumber(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
}

function validateImage(value) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > MAX_IMAGE_LENGTH) return undefined;
  const cleaned = value.trim();
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) return cleaned;
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(cleaned)) return cleaned;
  try {
    const parsed = new URL(cleaned);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function createWarehouseSku() {
  return `SKU-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}

export function validateWarehousePayload(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'بدنه درخواست معتبر نیست.' };
  }
  if (Object.keys(body).some(key => !EDITABLE_FIELDS.has(key))) {
    return { error: 'فیلد غیرمجاز در درخواست وجود دارد.' };
  }

  const data = {};
  const relations = {};

  if (!partial || Object.hasOwn(body, 'name')) {
    const name = cleanOptionalString(body.name, 240);
    if (!name) return { error: 'نام کالا الزامی و حداکثر ۲۴۰ کاراکتر است.' };
    data.name = name;
  }

  for (const field of ['sku', 'location', 'gender']) {
    if (Object.hasOwn(body, field)) {
      const limits = { sku: 80, location: 160, gender: 32 };
      const value = cleanOptionalString(body[field], limits[field]);
      if (body[field] && !value) return { error: `مقدار ${field} معتبر نیست.` };
      data[field] = value;
    }
  }

  if (Object.hasOwn(body, 'brandId')) {
    const value = cleanOptionalString(body.brandId, 128);
    if (value === undefined) return { error: 'برند انتخاب‌شده معتبر نیست.' };
    relations.brandId = value;
  } else if (Object.hasOwn(body, 'brand')) {
    const value = cleanOptionalString(body.brand, 160);
    if (value === undefined) return { error: 'برند انتخاب‌شده معتبر نیست.' };
    relations.brandName = value;
  }

  if (Object.hasOwn(body, 'categoryId')) {
    const value = cleanOptionalString(body.categoryId, 128);
    if (!value) return { error: 'دسته‌بندی انتخاب‌شده معتبر نیست.' };
    relations.categoryId = value;
  } else if (Object.hasOwn(body, 'category')) {
    const value = cleanOptionalString(body.category, 160);
    if (!value) return { error: 'دسته‌بندی کالا الزامی است.' };
    relations.categoryKey = value;
    data.categoryKey = value;
  } else if (!partial) {
    return { error: 'دسته‌بندی کالا الزامی است.' };
  }

  if (Object.hasOwn(body, 'productId')) {
    const value = cleanOptionalString(body.productId, 128);
    if (body.productId && !value) return { error: 'محصول مرتبط معتبر نیست.' };
    data.productId = value;
    if (value) relations.productId = value;
  }

  if (!partial || Object.hasOwn(body, 'price')) {
    const price = parseNumber(body.price, { min: 0, max: 999_999_999_999_999 });
    if (price === undefined) return { error: 'قیمت کالا باید عددی نامنفی و معتبر باشد.' };
    data.price = price;
  }

  for (const field of ['stock', 'reserved', 'minStock', 'discountPercent']) {
    if (!partial || Object.hasOwn(body, field)) {
      const defaults = { stock: 0, reserved: 0, minStock: 5, discountPercent: 0 };
      const max = field === 'discountPercent' ? 100 : 1_000_000_000;
      const value = parseInteger(body[field] ?? defaults[field], { min: 0, max });
      if (value === undefined) return { error: `${field} باید عدد صحیح نامنفی و معتبر باشد.` };
      data[field] = value;
    }
  }

  for (const field of ['isBestSeller', 'hasDiscount', 'isArchived']) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== 'boolean') return { error: 'مقدار گزینه کالا معتبر نیست.' };
      data[field] = body[field];
    }
  }

  if (Object.hasOwn(body, 'image')) {
    const image = validateImage(body.image);
    if (image === undefined) return { error: 'تصویر کالا معتبر نیست.' };
    data.image = image;
  }

  if (!partial) {
    data.sku ||= createWarehouseSku();
    data.isBestSeller ??= false;
    data.hasDiscount ??= false;
    data.discountPercent ??= 0;
    data.isArchived ??= false;
    if (data.reserved > data.stock) return { error: 'موجودی رزروشده نمی‌تواند بیشتر از موجودی فیزیکی باشد.' };
  }

  if (partial && Object.keys(data).length === 0 && Object.keys(relations).length === 0) {
    return { error: 'تغییری ارسال نشده است.' };
  }
  return { data, relations };
}

export async function resolveWarehouseRelations(client, relations) {
  const data = {};
  if (Object.hasOwn(relations, 'brandId')) {
    if (relations.brandId === null) {
      data.brandId = null;
    } else {
      const brand = await client.brand.findUnique({ where: { id: relations.brandId }, select: { id: true } });
      if (!brand) throw new WarehouseDomainError('برند انتخاب‌شده پیدا نشد.', 404, 'BRAND_NOT_FOUND');
      data.brandId = brand.id;
    }
  } else if (relations.brandName) {
    const brand = await client.brand.findFirst({
      where: { name: { equals: relations.brandName, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!brand) throw new WarehouseDomainError('برند انتخاب‌شده پیدا نشد.', 404, 'BRAND_NOT_FOUND');
    data.brandId = brand.id;
  }
  if (relations.categoryId || relations.categoryKey) {
    const category = relations.categoryId
      ? await client.category.findUnique({ where: { id: relations.categoryId }, select: { id: true } })
      : await client.category.findFirst({
        where: { OR: [
          { query: { equals: relations.categoryKey, mode: 'insensitive' } },
          { name: { equals: relations.categoryKey, mode: 'insensitive' } },
          ...(CATEGORY_QUERY_MAP[relations.categoryKey] ? [{ query: CATEGORY_QUERY_MAP[relations.categoryKey] }] : []),
        ] },
        select: { id: true },
      });
    if (!category) throw new WarehouseDomainError('دسته‌بندی انتخاب‌شده پیدا نشد.', 404, 'CATEGORY_NOT_FOUND');
    data.categoryId = category.id;
  }
  if (relations.productId) {
    const product = await client.product.findUnique({ where: { id: relations.productId }, select: { id: true } });
    if (!product) throw new WarehouseDomainError('محصول مرتبط پیدا نشد.', 404, 'PRODUCT_NOT_FOUND');
  }
  return data;
}

export function serializeMovement(movement) {
  return {
    id: movement.id,
    type: movement.type,
    quantityChange: movement.quantityChange,
    quantityBefore: movement.quantityBefore,
    quantityAfter: movement.quantityAfter,
    reservedBefore: movement.reservedBefore,
    reservedAfter: movement.reservedAfter,
    reason: movement.reason,
    orderId: movement.orderId,
    admin: movement.admin || null,
    createdAt: movement.createdAt.toISOString(),
  };
}

export function serializeWarehouseItem(item) {
  return {
    id: item.id,
    name: item.name,
    brandId: item.brandId,
    categoryId: item.categoryId,
    categoryKey: item.categoryKey,
    productId: item.productId,
    gender: item.gender,
    sku: item.sku,
    price: item.price,
    stock: item.stock,
    reserved: item.reserved,
    available: item.stock - item.reserved,
    minStock: item.minStock,
    location: item.location,
    image: item.image,
    isBestSeller: item.isBestSeller,
    hasDiscount: item.hasDiscount,
    discountPercent: item.discountPercent,
    isArchived: item.isArchived,
    brand: item.brand || null,
    category: item.category || null,
    product: item.product || null,
    movements: Array.isArray(item.movements) ? item.movements.map(serializeMovement) : [],
    notes: Array.isArray(item.notes) ? item.notes.map(note => ({
      id: note.id,
      text: note.text,
      admin: note.admin || null,
      createdAt: note.createdAt.toISOString(),
    })) : [],
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function isRetryable(error) {
  return error?.code === 'P2034' || error?.code === 'WAREHOUSE_CONCURRENT_UPDATE';
}

async function runSerializableWithRetry(prisma, operation) {
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: 'Serializable' });
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === MAX_RETRIES - 1) throw error;
    }
  }
  throw lastError;
}

function concurrentUpdateError() {
  return new WarehouseDomainError('موجودی هم‌زمان تغییر کرد؛ درخواست دوباره اجرا شد اما نهایی نشد.', 409, 'WAREHOUSE_CONCURRENT_UPDATE');
}

export async function adjustWarehouseStock(prisma, { id, quantityChange, reason, adminId, type }) {
  return runSerializableWithRetry(prisma, async tx => {
    const current = await tx.warehouseItem.findUnique({ where: { id } });
    if (!current || current.isArchived) throw new WarehouseDomainError('کالای فعال انبار پیدا نشد.', 404, 'ITEM_NOT_FOUND');
    const quantityAfter = current.stock + quantityChange;
    if (quantityAfter < 0 || quantityAfter < current.reserved) {
      throw new WarehouseDomainError('این کاهش باعث منفی شدن موجودی قابل‌فروش می‌شود.', 409, 'INSUFFICIENT_AVAILABLE_STOCK');
    }
    const result = await tx.warehouseItem.updateMany({
      where: { id, stock: current.stock, reserved: current.reserved, isArchived: false },
      data: { stock: quantityAfter },
    });
    if (result.count !== 1) throw concurrentUpdateError();
    await tx.inventoryMovement.create({ data: {
      warehouseItemId: id,
      type,
      quantityChange,
      quantityBefore: current.stock,
      quantityAfter,
      reservedBefore: current.reserved,
      reservedAfter: current.reserved,
      reason,
      adminId,
    } });
    return tx.warehouseItem.findUnique({ where: { id }, include: adminWarehouseInclude });
  });
}

export async function updateWarehouseItem(prisma, { id, data, relations, adminId }) {
  return runSerializableWithRetry(prisma, async tx => {
    const current = await tx.warehouseItem.findUnique({ where: { id } });
    if (!current) throw new WarehouseDomainError('کالای انبار پیدا نشد.', 404, 'ITEM_NOT_FOUND');
    const relationData = await resolveWarehouseRelations(tx, relations);
    const stockAfter = Object.hasOwn(data, 'stock') ? data.stock : current.stock;
    const reservedAfter = Object.hasOwn(data, 'reserved') ? data.reserved : current.reserved;
    if (stockAfter < 0 || reservedAfter < 0 || reservedAfter > stockAfter) {
      throw new WarehouseDomainError('موجودی رزروشده نمی‌تواند بیشتر از موجودی فیزیکی باشد.', 409, 'INVALID_STOCK_STATE');
    }
    const result = await tx.warehouseItem.updateMany({
      where: { id, stock: current.stock, reserved: current.reserved },
      data: { ...data, ...relationData },
    });
    if (result.count !== 1) throw concurrentUpdateError();

    if (stockAfter !== current.stock || reservedAfter !== current.reserved) {
      await tx.inventoryMovement.create({ data: {
        warehouseItemId: id,
        type: stockAfter !== current.stock ? 'CORRECTION' : 'RESERVATION_ADJUSTMENT',
        quantityChange: stockAfter - current.stock,
        quantityBefore: current.stock,
        quantityAfter: stockAfter,
        reservedBefore: current.reserved,
        reservedAfter,
        reason: stockAfter !== current.stock ? 'اصلاح موجودی از فرم ویرایش کالا' : 'اصلاح مقدار رزروشده',
        adminId,
      } });
    }
    return tx.warehouseItem.findUnique({ where: { id }, include: adminWarehouseInclude });
  });
}
