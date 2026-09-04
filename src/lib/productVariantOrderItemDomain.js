import { DEFAULT_PRODUCT_VARIANT_SIGNATURE } from './productVariantDomain.js';

const LEGACY_SIZE_ATTRIBUTE_CODES = new Set(['eu_size', 'clothing_size', 'shoe_size', 'size']);

export class ProductVariantOrderItemError extends Error {
  constructor(message, status = 400, code = 'PRODUCT_VARIANT_ORDER_ITEM_INVALID') {
    super(message);
    this.name = 'ProductVariantOrderItemError';
    this.status = status;
    this.code = code;
  }
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function decimalString(value, digits = null) {
  if (value === null || value === undefined) return null;
  if (digits !== null && typeof value?.toFixed === 'function') return value.toFixed(digits);
  return String(value);
}

function assertQuantity(quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000) {
    throw new ProductVariantOrderItemError('تعداد قلم سفارش معتبر نیست.', 400, 'INVALID_QUANTITY');
  }
}

function canonicalOptionRows(options) {
  return [...(options || [])].sort((left, right) => {
    const attributeOrder = Number(left.attribute?.sortOrder || 0) - Number(right.attribute?.sortOrder || 0);
    if (attributeOrder) return attributeOrder;
    const attributeCode = text(left.attribute?.code).localeCompare(text(right.attribute?.code), 'en');
    if (attributeCode) return attributeCode;
    const optionOrder = Number(left.attributeOption?.sortOrder || 0) - Number(right.attributeOption?.sortOrder || 0);
    if (optionOrder) return optionOrder;
    return text(left.attributeOption?.code).localeCompare(text(right.attributeOption?.code), 'en');
  });
}

export function buildSelectedOptionsSnapshot(options) {
  return canonicalOptionRows(options).map(row => ({
    attributeCode: text(row.attribute?.code),
    attributeNameFa: text(row.attribute?.nameFa),
    attributeNameEn: text(row.attribute?.nameEn),
    optionCode: text(row.attributeOption?.code),
    labelFa: text(row.attributeOption?.labelFa),
    labelEn: text(row.attributeOption?.labelEn),
  }));
}

function legacyOptionValue(options, predicate) {
  const row = options.find(candidate => predicate(candidate.attributeCode));
  return row ? row.labelFa || row.labelEn || null : null;
}

export function buildProductVariantOrderItemSnapshotFromData({ product, variant, pricing, quantity }) {
  assertQuantity(quantity);
  if (!product?.id) {
    throw new ProductVariantOrderItemError('محصول پیدا نشد.', 404, 'PRODUCT_NOT_FOUND');
  }
  if (!variant?.id) {
    throw new ProductVariantOrderItemError('تنوع محصول پیدا نشد.', 404, 'VARIANT_NOT_FOUND');
  }
  if (variant.productId !== product.id) {
    throw new ProductVariantOrderItemError('تنوع به این محصول تعلق ندارد.', 409, 'VARIANT_PRODUCT_MISMATCH');
  }
  if (variant.isActive !== true) {
    throw new ProductVariantOrderItemError('تنوع محصول غیرفعال است.', 409, 'VARIANT_INACTIVE');
  }
  if (pricing?.variantId !== variant.id || pricing?.supplyMode !== product.supplyMode) {
    throw new ProductVariantOrderItemError('قیمت معتبر این تنوع قابل تأیید نیست.', 409, 'VARIANT_PRICING_MISMATCH');
  }
  const productNameFa = text(product.nameFa);
  const productNameEn = text(product.nameEn);
  if (!productNameFa || !productNameEn) {
    throw new ProductVariantOrderItemError('نام‌های محصول برای ثبت snapshot کامل نیست.', 409, 'PRODUCT_NAME_REQUIRED');
  }
  const selectedOptionsSnapshot = buildSelectedOptionsSnapshot(variant.options);
  if (variant.optionSignature === DEFAULT_PRODUCT_VARIANT_SIGNATURE && selectedOptionsSnapshot.length !== 0) {
    throw new ProductVariantOrderItemError('تنوع پیش‌فرض نباید گزینه انتخاب‌شده داشته باشد.', 409, 'DEFAULT_VARIANT_OPTIONS_INVALID');
  }
  const discountPercent = Number(pricing.discountPercent);
  if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new ProductVariantOrderItemError('درصد تخفیف snapshot معتبر نیست.', 409, 'INVALID_DISCOUNT');
  }
  const finalUnitPriceToman = decimalString(pricing.finalPriceToman);
  if (!finalUnitPriceToman || !/^\d+$/.test(finalUnitPriceToman) || BigInt(finalUnitPriceToman) <= 0n) {
    throw new ProductVariantOrderItemError('قیمت نهایی snapshot معتبر نیست.', 409, 'INVALID_FINAL_PRICE');
  }
  const isExternal = product.supplyMode === 'EXTERNAL_DUBAI';
  if (!isExternal && product.supplyMode !== 'IRAN_STOCK') {
    throw new ProductVariantOrderItemError('روش تأمین snapshot معتبر نیست.', 409, 'INVALID_SUPPLY_MODE');
  }
  const basePrice = decimalString(pricing.basePrice);
  const weight = Number(pricing.weight);
  if (!Number.isFinite(weight) || weight <= 0 || weight > 10_000) {
    throw new ProductVariantOrderItemError('وزن snapshot معتبر نیست.', 409, 'INVALID_WEIGHT');
  }
  const finalUnitPriceInteger = BigInt(finalUnitPriceToman);
  const selectedColor = legacyOptionValue(selectedOptionsSnapshot, code => code === 'color');
  const selectedSize = legacyOptionValue(selectedOptionsSnapshot, code => LEGACY_SIZE_ATTRIBUTE_CODES.has(code));

  return {
    name: productNameFa,
    quantity,
    priceAed: isExternal ? Number(pricing.discountedBasePrice) : null,
    priceToman: finalUnitPriceInteger <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(finalUnitPriceToman) : null,
    productId: product.id,
    productVariantId: variant.id,
    selectedColor,
    selectedSize,
    weight,
    sourceKind: 'PRODUCT_VARIANT',
    supplyModeSnapshot: product.supplyMode,
    selectedOptionsSnapshot,
    productNameFaSnapshot: productNameFa,
    productNameEnSnapshot: productNameEn,
    skuSnapshot: text(variant.sku) || null,
    unitPriceAedSnapshot: isExternal ? basePrice : null,
    unitPriceTomanSnapshot: isExternal ? null : basePrice,
    discountPercentSnapshot: discountPercent,
    finalUnitPriceTomanSnapshot: finalUnitPriceToman,
  };
}

function snapshotMoney(value, digits) {
  if (value === null || value === undefined) return null;
  return typeof value?.toFixed === 'function' ? value.toFixed(digits) : String(value);
}

function safeOptions(value) {
  return Array.isArray(value) ? value.map(option => ({ ...option })) : null;
}

export function serializeOrderItemSnapshot(item) {
  const selectedOptionsSnapshot = safeOptions(item.selectedOptionsSnapshot);
  return {
    ...item,
    selectedOptionsSnapshot,
    unitPriceAedSnapshot: snapshotMoney(item.unitPriceAedSnapshot, 2),
    unitPriceTomanSnapshot: snapshotMoney(item.unitPriceTomanSnapshot, 0),
    finalUnitPriceTomanSnapshot: snapshotMoney(item.finalUnitPriceTomanSnapshot, 0),
    variantNameFaSnapshot: selectedOptionsSnapshot?.map(option => option.labelFa || option.labelEn).filter(Boolean).join(' / ') || null,
    variantNameEnSnapshot: selectedOptionsSnapshot?.map(option => option.labelEn || option.labelFa).filter(Boolean).join(' / ') || null,
  };
}
