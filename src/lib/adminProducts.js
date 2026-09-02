import 'server-only';

import { randomUUID } from 'node:crypto';
import { normalizeProductSourceUrl, parseExternalHttpUrl } from '@/lib/externalUrls';
import { productNameApiFields, validateProductNames } from '@/lib/productNames';

export const PRODUCT_STATUSES = Object.freeze(['active', 'hidden', 'needs_update', 'broken_link']);
export const PRODUCT_STATUS_SET = new Set(PRODUCT_STATUSES);

export const adminProductInclude = Object.freeze({
  brand: { select: { id: true, name: true, faName: true } },
  category: { select: { id: true, name: true, query: true } },
  store: { select: { id: true, name: true, url: true } },
});

const EDITABLE_FIELDS = new Set([
  'nameFa', 'nameEn', 'description', 'slug', 'code', 'brandId', 'categoryId', 'storeId', 'priceAed', 'weight',
  'originalLink', 'image', 'gender', 'discountPercent', 'hasDiscount', 'isBestSeller', 'status',
]);

function cleanOptionalString(value, maxLength) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength) return undefined;
  return cleaned;
}

function parseFiniteNumber(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
}

export function slugifyProductName(value) {
  const slug = String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return slug || `product-${randomUUID().slice(0, 8)}`;
}

export function createProductCode() {
  return `DK-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}

export function validateProductPayload(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'بدنه درخواست معتبر نیست.' };
  }
  if (Object.keys(body).some(key => !EDITABLE_FIELDS.has(key))) {
    return { error: 'فیلد غیرمجاز در درخواست وجود دارد.' };
  }

  const data = {};
  const relationIds = {};

  const names = validateProductNames(body, { partial });
  if (names.error) return names;
  Object.assign(data, names.data);
  // Expand-contract compatibility: keep the required legacy column synchronized
  // until a later, separately deployed contract migration removes Product.name.
  if (Object.hasOwn(names.data, 'nameFa')) data.name = names.data.nameFa;

  if (Object.hasOwn(body, 'description')) {
    if (body.description === null || body.description === '') {
      data.description = null;
    } else if (typeof body.description !== 'string') {
      return { error: 'توضیحات محصول معتبر نیست.' };
    } else {
      const description = body.description.trim();
      if (description.length > 20_000) return { error: 'توضیحات محصول حداکثر ۲۰٬۰۰۰ کاراکتر است.' };
      data.description = description || null;
    }
  }

  if (!partial || Object.hasOwn(body, 'brandId')) {
    const brandId = cleanOptionalString(body.brandId, 128);
    if (brandId === undefined) return { error: 'برند انتخاب‌شده معتبر نیست.' };
    data.brandId = brandId;
    if (brandId) relationIds.brandId = brandId;
  }

  for (const field of ['categoryId', 'storeId']) {
    if (!partial || Object.hasOwn(body, field)) {
      const value = cleanOptionalString(body[field], 128);
      if (!value) return { error: 'دسته‌بندی و فروشگاه معتبر الزامی هستند.' };
      data[field] = value;
      relationIds[field] = value;
    }
  }

  if (!partial || Object.hasOwn(body, 'priceAed')) {
    const priceAed = parseFiniteNumber(body.priceAed, { min: 0.01, max: 9999999999.99 });
    if (priceAed === undefined) return { error: 'قیمت درهم باید عددی مثبت و معتبر باشد.' };
    data.priceAed = priceAed.toFixed(2);
  }

  if (!partial || Object.hasOwn(body, 'weight')) {
    const weight = parseFiniteNumber(body.weight ?? 1, { min: 0.01, max: 10000 });
    if (weight === undefined) return { error: 'وزن محصول معتبر نیست.' };
    data.weight = weight;
  }

  if (Object.hasOwn(body, 'slug')) {
    const slug = cleanOptionalString(body.slug, 140);
    if (!slug || !/^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u.test(slug)) {
      return { error: 'اسلاگ محصول معتبر نیست.' };
    }
    data.slug = slug.toLowerCase();
  }

  if (Object.hasOwn(body, 'code')) {
    const code = cleanOptionalString(body.code, 64);
    if (!code || !/^[A-Za-z0-9_-]+$/.test(code)) return { error: 'کد محصول معتبر نیست.' };
    data.code = code.toUpperCase();
  }

  if (Object.hasOwn(body, 'originalLink')) {
    if (body.originalLink === null || body.originalLink === '') {
      data.originalLink = null;
      data.sourceUrlKey = null;
    } else {
      const normalized = normalizeProductSourceUrl(body.originalLink);
      if (!normalized) return { error: 'لینک اصلی محصول معتبر نیست.' };
      data.originalLink = normalized;
      data.sourceUrlKey = normalized;
    }
  }

  if (Object.hasOwn(body, 'image')) {
    if (body.image === null || body.image === '') {
      data.image = null;
    } else {
      const image = parseExternalHttpUrl(body.image, { maxLength: 2048 });
      if (!image) return { error: 'آدرس تصویر باید یک URL امن http/https باشد.' };
      data.image = image.toString();
    }
  }

  if (Object.hasOwn(body, 'gender')) {
    const gender = cleanOptionalString(body.gender, 32);
    if (body.gender && !gender) return { error: 'مقدار جنسیت معتبر نیست.' };
    data.gender = gender;
  }

  if (Object.hasOwn(body, 'status')) {
    if (typeof body.status !== 'string' || !PRODUCT_STATUS_SET.has(body.status)) {
      return { error: 'وضعیت محصول معتبر نیست.' };
    }
    data.status = body.status;
  }

  if (Object.hasOwn(body, 'discountPercent')) {
    const discountPercent = parseFiniteNumber(body.discountPercent, { min: 0, max: 100 });
    if (discountPercent === undefined || !Number.isInteger(discountPercent)) {
      return { error: 'درصد تخفیف باید عدد صحیح بین صفر تا صد باشد.' };
    }
    data.discountPercent = discountPercent;
  }

  for (const field of ['hasDiscount', 'isBestSeller']) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== 'boolean') return { error: 'مقدار گزینه محصول معتبر نیست.' };
      data[field] = body[field];
    }
  }

  if (!partial) {
    data.slug ||= slugifyProductName(data.nameEn);
    data.code ||= createProductCode();
    data.status ||= 'active';
    data.hasDiscount ??= false;
    data.isBestSeller ??= false;
    data.discountPercent ??= 0;
  }

  if (partial && Object.keys(data).length === 0) return { error: 'تغییری ارسال نشده است.' };
  return { data, relationIds };
}

export async function validateProductRelations(prisma, relationIds) {
  const checks = [
    ['brandId', 'brand', 'برند'],
    ['categoryId', 'category', 'دسته‌بندی'],
    ['storeId', 'store', 'فروشگاه'],
  ].filter(([field]) => relationIds[field]);

  const results = await Promise.all(checks.map(([, model], index) => (
    prisma[model].findUnique({ where: { id: relationIds[checks[index][0]] }, select: { id: true } })
  )));
  const missingIndex = results.findIndex(result => !result);
  return missingIndex === -1 ? null : `${checks[missingIndex][2]} انتخاب‌شده پیدا نشد.`;
}

export function serializeAdminProduct(product) {
  return {
    id: product.id,
    code: product.code,
    ...productNameApiFields(product),
    description: product.description,
    slug: product.slug,
    priceAed: product.priceAed == null ? null : Number(product.priceAed),
    priceToman: product.priceToman == null ? null : product.priceToman.toFixed(0),
    supplyMode: product.supplyMode,
    weight: product.weight,
    originalLink: product.originalLink,
    image: product.image,
    gender: product.gender,
    discountPercent: product.discountPercent,
    hasDiscount: product.hasDiscount,
    isBestSeller: product.isBestSeller,
    status: product.status,
    brandId: product.brandId,
    categoryId: product.categoryId,
    storeId: product.storeId,
    brand: product.brand,
    category: product.category,
    store: product.store,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
