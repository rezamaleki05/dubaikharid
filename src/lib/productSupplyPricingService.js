import 'server-only';

import {
  normalizeNullableAedPrice,
  normalizeNullableTomanPrice,
  ProductSupplyPricingError,
  resolveProductVariantPriceFromData,
} from '@/lib/productSupplyPricingDomain';
import { getPricingSettings } from '@/lib/settings';

const productPricingSelect = Object.freeze({
  id: true,
  supplyMode: true,
  priceAed: true,
  priceToman: true,
  weight: true,
  hasDiscount: true,
  discountPercent: true,
});

const variantPricingSelect = Object.freeze({
  id: true,
  productId: true,
  isDefault: true,
  isActive: true,
  priceAedOverride: true,
  priceTomanOverride: true,
  discountPercentOverride: true,
  weightOverride: true,
});

function moneyString(value, digits) {
  return value === null || value === undefined ? null : value.toFixed(digits);
}

export function serializeProductSupplyPricing(product) {
  return {
    id: product.id,
    supplyMode: product.supplyMode,
    priceAed: moneyString(product.priceAed, 2),
    priceToman: moneyString(product.priceToman, 0),
  };
}

function positive(value, normalizer) {
  const parsed = normalizer(value);
  return !parsed.error && parsed.value !== null;
}

function assertProductPricingState(product, variants) {
  if (product.supplyMode === 'EXTERNAL_DUBAI') {
    if (!positive(product.priceAed, normalizeNullableAedPrice)) {
      throw new ProductSupplyPricingError(
        'محصول با تأمین دبی به قیمت معتبر درهم نیاز دارد.',
        409,
        'AED_PRICE_REQUIRED',
      );
    }
    return;
  }
  const activeVariants = variants.filter(variant => variant.isActive);
  const effectiveRows = activeVariants.length ? activeVariants : [{ priceTomanOverride: null }];
  const missing = effectiveRows.some(variant => !positive(
    variant.priceTomanOverride ?? product.priceToman,
    normalizeNullableTomanPrice,
  ));
  if (missing) {
    throw new ProductSupplyPricingError(
      'همه تنوع‌های فعال محصول موجود در ایران به قیمت معتبر تومان در سطح محصول یا تنوع نیاز دارند.',
      409,
      'TOMAN_PRICE_REQUIRED',
    );
  }
}

export async function updateProductSupplyPricing(client, productId, data) {
  return client.$transaction(async tx => {
    const current = await tx.product.findUnique({
      where: { id: productId },
      select: {
        ...productPricingSelect,
        variants: { select: variantPricingSelect },
      },
    });
    if (!current) throw new ProductSupplyPricingError('محصول پیدا نشد.', 404, 'PRODUCT_NOT_FOUND');
    const next = { ...current, ...data };
    assertProductPricingState(next, current.variants);
    return tx.product.update({ where: { id: productId }, data, select: productPricingSelect });
  }, { isolationLevel: 'Serializable' });
}

export async function resolveAuthoritativeProductVariantPrice(client, { productId, variantId = null }) {
  const product = await client.product.findUnique({ where: { id: productId }, select: productPricingSelect });
  if (!product) throw new ProductSupplyPricingError('محصول پیدا نشد.', 404, 'PRODUCT_NOT_FOUND');
  const variant = variantId
    ? await client.productVariant.findUnique({ where: { id: variantId }, select: variantPricingSelect })
    : await client.productVariant.findFirst({
      where: { productId, isDefault: true },
      select: variantPricingSelect,
    });
  if (!variant) throw new ProductSupplyPricingError('تنوع محصول پیدا نشد.', 404, 'VARIANT_NOT_FOUND');
  if (variant.productId !== productId) {
    throw new ProductSupplyPricingError('تنوع به این محصول تعلق ندارد.', 409, 'VARIANT_PRODUCT_MISMATCH');
  }
  const settings = product.supplyMode === 'EXTERNAL_DUBAI' ? await getPricingSettings() : null;
  return resolveProductVariantPriceFromData({ product, variant, settings });
}

export async function getProductSupplyPricing(client, productId) {
  const product = await client.product.findUnique({ where: { id: productId }, select: productPricingSelect });
  if (!product) throw new ProductSupplyPricingError('محصول پیدا نشد.', 404, 'PRODUCT_NOT_FOUND');
  return serializeProductSupplyPricing(product);
}
