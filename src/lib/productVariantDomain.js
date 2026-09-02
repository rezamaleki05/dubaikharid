import {
  normalizeNullableAedPrice,
  normalizeNullableDiscount,
  normalizeNullableTomanPrice,
  normalizeNullableWeight,
} from './productSupplyPricingDomain.js';

export const DEFAULT_PRODUCT_VARIANT_SIGNATURE = '__default__';
export const PRODUCT_VARIANT_WARNING_THRESHOLD = 50;
export const MAX_PRODUCT_VARIANT_COMBINATIONS = 200;

const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._/-]{0,79}$/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function strictObject(body, allowed) {
  if (!isObject(body)) return { error: 'بدنه درخواست معتبر نیست.' };
  if (Object.keys(body).some(key => !allowed.has(key))) return { error: 'فیلد غیرمجاز در درخواست وجود دارد.' };
  return null;
}

function cleanBoolean(value, label) {
  return typeof value === 'boolean' ? { value } : { error: `${label} معتبر نیست.` };
}

function cleanSortOrder(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 100_000
    ? { value: parsed }
    : { error: 'ترتیب نمایش تنوع معتبر نیست.' };
}

export function validateProductVariantEntityId(value, label = 'شناسه') {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && ID_PATTERN.test(value)
    ? { value }
    : { error: `${label} معتبر نیست.` };
}

export function normalizeProductVariantSku(value) {
  if (value === null || value === undefined || value === '') return { value: null };
  if (typeof value !== 'string') return { error: 'SKU تنوع معتبر نیست.' };
  const cleaned = value.trim().toUpperCase();
  if (!cleaned) return { value: null };
  return SKU_PATTERN.test(cleaned) ? { value: cleaned } : { error: 'SKU تنوع معتبر نیست.' };
}

export function normalizeProductVariantOptionIds(value, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || value.length > 50 || (!allowEmpty && value.length === 0)) {
    return { error: 'فهرست گزینه‌های تنوع معتبر نیست.' };
  }
  const optionIds = [];
  const seen = new Set();
  for (const valueId of value) {
    const parsed = validateProductVariantEntityId(valueId, 'شناسه گزینه ویژگی');
    if (parsed.error) return parsed;
    if (seen.has(parsed.value)) return { error: 'گزینه ویژگی تکراری است.' };
    seen.add(parsed.value);
    optionIds.push(parsed.value);
  }
  return { data: optionIds };
}

export function buildProductVariantSignature(selections) {
  if (!Array.isArray(selections) || selections.length === 0) return DEFAULT_PRODUCT_VARIANT_SIGNATURE;
  return [...selections]
    .sort((left, right) => left.attributeCode.localeCompare(right.attributeCode, 'en'))
    .map(selection => `${selection.attributeCode}=${selection.optionCode}`)
    .join('|');
}

export function validateCreateProductVariantPayload(body) {
  const allowed = new Set([
    'optionIds', 'sku', 'isActive', 'sortOrder',
    'priceAedOverride', 'priceTomanOverride', 'discountPercentOverride', 'weightOverride',
  ]);
  const shapeError = strictObject(body, allowed);
  if (shapeError) return shapeError;
  if (!Object.hasOwn(body, 'optionIds')) return { error: 'فهرست گزینه‌های تنوع الزامی است.' };
  const optionIds = normalizeProductVariantOptionIds(body.optionIds);
  if (optionIds.error) return optionIds;
  const sku = normalizeProductVariantSku(body.sku);
  if (sku.error) return sku;
  const data = { optionIds: optionIds.data, sku: sku.value };
  if (Object.hasOwn(body, 'isActive')) {
    const active = cleanBoolean(body.isActive, 'وضعیت تنوع');
    if (active.error) return active;
    data.isActive = active.value;
  }
  if (Object.hasOwn(body, 'sortOrder')) {
    const sortOrder = cleanSortOrder(body.sortOrder);
    if (sortOrder.error) return sortOrder;
    data.sortOrder = sortOrder.value;
  }
  const pricing = normalizeVariantPricingFields(body);
  if (pricing.error) return pricing;
  Object.assign(data, pricing.data);
  return { data };
}

export function validateUpdateProductVariantPayload(body) {
  const allowed = new Set([
    'sku', 'isActive', 'sortOrder',
    'priceAedOverride', 'priceTomanOverride', 'discountPercentOverride', 'weightOverride',
  ]);
  const shapeError = strictObject(body, allowed);
  if (shapeError) return shapeError;
  const data = {};
  if (Object.hasOwn(body, 'sku')) {
    const sku = normalizeProductVariantSku(body.sku);
    if (sku.error) return sku;
    data.sku = sku.value;
  }
  if (Object.hasOwn(body, 'isActive')) {
    const active = cleanBoolean(body.isActive, 'وضعیت تنوع');
    if (active.error) return active;
    data.isActive = active.value;
  }
  if (Object.hasOwn(body, 'sortOrder')) {
    const sortOrder = cleanSortOrder(body.sortOrder);
    if (sortOrder.error) return sortOrder;
    data.sortOrder = sortOrder.value;
  }
  const pricing = normalizeVariantPricingFields(body);
  if (pricing.error) return pricing;
  Object.assign(data, pricing.data);
  return Object.keys(data).length ? { data } : { error: 'تغییری ارسال نشده است.' };
}

function normalizeVariantPricingFields(body) {
  const data = {};
  const fields = [
    ['priceAedOverride', normalizeNullableAedPrice, 'قیمت درهم تنوع'],
    ['priceTomanOverride', normalizeNullableTomanPrice, 'قیمت تومان تنوع'],
    ['discountPercentOverride', normalizeNullableDiscount, 'درصد تخفیف تنوع'],
    ['weightOverride', normalizeNullableWeight, 'وزن تنوع'],
  ];
  for (const [field, normalize, label] of fields) {
    if (!Object.hasOwn(body, field)) continue;
    const parsed = normalize(body[field], label);
    if (parsed.error) return parsed;
    data[field] = parsed.value;
  }
  return { data };
}

export function validateReplaceProductVariantOptionsPayload(body) {
  const allowed = new Set(['optionIds']);
  const shapeError = strictObject(body, allowed);
  if (shapeError) return shapeError;
  if (!Object.hasOwn(body, 'optionIds')) return { error: 'فهرست گزینه‌های تنوع الزامی است.' };
  const optionIds = normalizeProductVariantOptionIds(body.optionIds, { allowEmpty: false });
  return optionIds.error ? optionIds : { data: { optionIds: optionIds.data } };
}

export function validatePreviewProductVariantPayload(body) {
  const allowed = new Set(['combinations']);
  const shapeError = strictObject(body, allowed);
  if (shapeError) return shapeError;
  if (!Array.isArray(body.combinations) || body.combinations.length === 0
    || body.combinations.length > MAX_PRODUCT_VARIANT_COMBINATIONS) {
    return { error: `تعداد ترکیب‌ها باید بین ۱ و ${MAX_PRODUCT_VARIANT_COMBINATIONS} باشد.` };
  }
  const combinations = [];
  for (const candidate of body.combinations) {
    const optionIds = normalizeProductVariantOptionIds(candidate);
    if (optionIds.error) return optionIds;
    combinations.push(optionIds.data);
  }
  return { data: { combinations } };
}

export function variantCapacityResult(existingCount, requestedCount = 1) {
  const total = existingCount + requestedCount;
  return {
    total,
    warning: total >= PRODUCT_VARIANT_WARNING_THRESHOLD,
    allowed: total <= MAX_PRODUCT_VARIANT_COMBINATIONS,
  };
}
