import { calculateProductPricing } from './pricing.js';

export const PRODUCT_SUPPLY_MODES = Object.freeze(['EXTERNAL_DUBAI', 'IRAN_STOCK']);
export const PRODUCT_SUPPLY_MODE_SET = new Set(PRODUCT_SUPPLY_MODES);

export class ProductSupplyPricingError extends Error {
  constructor(message, status = 400, code = 'PRODUCT_SUPPLY_PRICING_INVALID') {
    super(message);
    this.name = 'ProductSupplyPricingError';
    this.status = status;
    this.code = code;
  }
}

function strictObject(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'بدنه درخواست معتبر نیست.';
  return Object.keys(body).some(key => !allowed.has(key)) ? 'فیلد غیرمجاز در درخواست وجود دارد.' : null;
}

function normalizeNullableDecimal(value, { scale, integerDigits, label }) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return { value: null };
  }
  const decimalLike = value && typeof value === 'object' && typeof value.toString === 'function';
  if (!['string', 'number'].includes(typeof value) && !decimalLike) return { error: `${label} معتبر نیست.` };
  const raw = String(value).trim();
  const match = raw.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match || (match[2]?.length || 0) > scale) return { error: `${label} معتبر نیست.` };
  const integer = match[1].replace(/^0+(?=\d)/, '');
  const fraction = (match[2] || '').padEnd(scale, '0');
  if (integer.length > integerDigits) return { error: `${label} از محدوده مجاز بزرگ‌تر است.` };
  const scaled = BigInt(`${integer}${fraction}`);
  if (scaled <= 0n) return { error: `${label} باید بیشتر از صفر باشد.` };
  return { value: scale ? `${integer}.${fraction}` : integer };
}

export function normalizeNullableAedPrice(value, label = 'قیمت درهم') {
  return normalizeNullableDecimal(value, { scale: 2, integerDigits: 10, label });
}

export function normalizeNullableTomanPrice(value, label = 'قیمت تومان') {
  return normalizeNullableDecimal(value, { scale: 0, integerDigits: 18, label });
}

export function normalizeNullableDiscount(value, label = 'درصد تخفیف') {
  if (value === null || value === undefined || value === '') return { value: null };
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 && numeric <= 100
    ? { value: numeric }
    : { error: `${label} باید عدد صحیح بین صفر تا صد باشد.` };
}

export function normalizeNullableWeight(value, label = 'وزن') {
  if (value === null || value === undefined || value === '') return { value: null };
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0.01 && numeric <= 10_000
    ? { value: numeric }
    : { error: `${label} باید بین ۰٫۰۱ و ۱۰٬۰۰۰ کیلوگرم باشد.` };
}

export function validateProductSupplyPricingPayload(body) {
  const shapeError = strictObject(body, new Set(['supplyMode', 'priceAed', 'priceToman']));
  if (shapeError) return { error: shapeError };
  const data = {};
  if (Object.hasOwn(body, 'supplyMode')) {
    if (!PRODUCT_SUPPLY_MODE_SET.has(body.supplyMode)) return { error: 'روش تأمین محصول معتبر نیست.' };
    data.supplyMode = body.supplyMode;
  }
  if (Object.hasOwn(body, 'priceAed')) {
    const parsed = normalizeNullableAedPrice(body.priceAed);
    if (parsed.error) return parsed;
    data.priceAed = parsed.value;
  }
  if (Object.hasOwn(body, 'priceToman')) {
    const parsed = normalizeNullableTomanPrice(body.priceToman);
    if (parsed.error) return parsed;
    data.priceToman = parsed.value;
  }
  return Object.keys(data).length ? { data } : { error: 'تغییری ارسال نشده است.' };
}

export function getEffectiveDiscountPercent(product, variant = null) {
  if (variant?.discountPercentOverride !== null && variant?.discountPercentOverride !== undefined) {
    const parsed = normalizeNullableDiscount(variant.discountPercentOverride);
    if (parsed.error) throw new ProductSupplyPricingError(parsed.error, 400, 'INVALID_DISCOUNT');
    return parsed.value;
  }
  if (product?.hasDiscount !== true) return 0;
  const parsed = normalizeNullableDiscount(product.discountPercent);
  if (parsed.error || parsed.value === null) {
    throw new ProductSupplyPricingError('درصد تخفیف محصول معتبر نیست.', 400, 'INVALID_DISCOUNT');
  }
  return parsed.value;
}

function requirePositivePrice(value, normalizer, message, code) {
  const parsed = normalizer(value);
  if (parsed.error || parsed.value === null) throw new ProductSupplyPricingError(message, 409, code);
  return parsed.value;
}

function roundDiscountedToman(basePrice, discountPercent) {
  const numerator = BigInt(basePrice) * BigInt(100 - discountPercent);
  return ((numerator + 50n) / 100n).toString();
}

function serialNumber(value) {
  if (!Number.isFinite(value)) throw new ProductSupplyPricingError('خروجی محاسبه قیمت معتبر نیست.', 500, 'INVALID_PRICE_RESULT');
  return String(value);
}

export function resolveProductVariantPriceFromData({ product, variant = null, settings = null }) {
  if (!product || !PRODUCT_SUPPLY_MODE_SET.has(product.supplyMode)) {
    throw new ProductSupplyPricingError('روش تأمین محصول معتبر نیست.', 409, 'INVALID_SUPPLY_MODE');
  }
  if (variant && variant.productId && variant.productId !== product.id) {
    throw new ProductSupplyPricingError('تنوع به این محصول تعلق ندارد.', 409, 'VARIANT_PRODUCT_MISMATCH');
  }
  const discountPercent = getEffectiveDiscountPercent(product, variant);
  const weight = variant?.weightOverride ?? product.weight;

  if (product.supplyMode === 'EXTERNAL_DUBAI') {
    const basePrice = requirePositivePrice(
      variant?.priceAedOverride ?? product.priceAed,
      normalizeNullableAedPrice,
      'قیمت معتبر درهم برای این محصول/تنوع ثبت نشده است.',
      'AED_PRICE_REQUIRED',
    );
    const discountedBase = Number(basePrice) * (1 - discountPercent / 100);
    const quote = calculateProductPricing({ priceAed: discountedBase, weight }, settings);
    return {
      supplyMode: product.supplyMode,
      currencySource: 'AED',
      basePrice,
      discountPercent,
      discountedBasePrice: serialNumber(discountedBase),
      commissionAmount: serialNumber(quote.commissionAed),
      shippingAmount: serialNumber(quote.shippingAed),
      exchangeRate: serialNumber(quote.exchangeRate),
      finalPriceToman: String(quote.totalToman),
      weight: quote.billableWeight,
      variantId: variant?.id || null,
    };
  }

  const basePrice = requirePositivePrice(
    variant?.priceTomanOverride ?? product.priceToman,
    normalizeNullableTomanPrice,
    'قیمت معتبر تومان برای این محصول/تنوع ثبت نشده است.',
    'TOMAN_PRICE_REQUIRED',
  );
  const finalPriceToman = roundDiscountedToman(basePrice, discountPercent);
  return {
    supplyMode: product.supplyMode,
    currencySource: 'TOMAN',
    basePrice,
    discountPercent,
    discountedBasePrice: finalPriceToman,
    commissionAmount: null,
    shippingAmount: null,
    exchangeRate: null,
    finalPriceToman,
    weight: Number(weight),
    variantId: variant?.id || null,
  };
}
