import 'server-only';

import { Prisma } from '@/generated/prisma/client';
import {
  buildProductVariantOrderItemSnapshotFromData,
  ProductVariantOrderItemError,
} from '@/lib/productVariantOrderItemDomain';
import { resolveAuthoritativeProductVariantPrice } from '@/lib/productSupplyPricingService';

const variantSnapshotSelect = Object.freeze({
  id: true,
  productId: true,
  sku: true,
  optionSignature: true,
  isActive: true,
  product: {
    select: {
      id: true,
      nameFa: true,
      nameEn: true,
      supplyMode: true,
    },
  },
  options: {
    select: {
      attribute: {
        select: { code: true, nameFa: true, nameEn: true, sortOrder: true },
      },
      attributeOption: {
        select: { code: true, labelFa: true, labelEn: true, sortOrder: true },
      },
    },
  },
});

function decimalOrNull(value) {
  return value === null || value === undefined ? null : new Prisma.Decimal(value);
}

export async function buildProductVariantOrderItemSnapshot(
  client,
  { productId, variantId, quantity, pricingContext = null },
) {
  if (typeof productId !== 'string' || !productId || typeof variantId !== 'string' || !variantId) {
    throw new ProductVariantOrderItemError('شناسه محصول یا تنوع معتبر نیست.', 400, 'INVALID_IDENTIFIER');
  }
  const variant = await client.productVariant.findUnique({
    where: { id: variantId },
    select: variantSnapshotSelect,
  });
  if (!variant) throw new ProductVariantOrderItemError('تنوع محصول پیدا نشد.', 404, 'VARIANT_NOT_FOUND');
  if (variant.productId !== productId) {
    throw new ProductVariantOrderItemError('تنوع به این محصول تعلق ندارد.', 409, 'VARIANT_PRODUCT_MISMATCH');
  }
  if (!variant.isActive) {
    throw new ProductVariantOrderItemError('تنوع محصول غیرفعال است.', 409, 'VARIANT_INACTIVE');
  }
  const pricing = await resolveAuthoritativeProductVariantPrice(client, {
    productId,
    variantId,
    settings: pricingContext?.settings || null,
  });
  const snapshot = buildProductVariantOrderItemSnapshotFromData({
    product: variant.product,
    variant,
    pricing,
    quantity,
  });
  return {
    ...snapshot,
    unitPriceAedSnapshot: decimalOrNull(snapshot.unitPriceAedSnapshot),
    unitPriceTomanSnapshot: decimalOrNull(snapshot.unitPriceTomanSnapshot),
    finalUnitPriceTomanSnapshot: decimalOrNull(snapshot.finalUnitPriceTomanSnapshot),
  };
}
