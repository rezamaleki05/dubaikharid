import 'server-only';

import { getPricingSettings } from '@/lib/settings';
import {
  ProductCartError,
  resolveProductCartLineFromData,
} from '@/lib/productCartDomain';
import { PUBLIC_PRODUCT_VISIBILITY } from '@/lib/publicCatalog';

const productCartSelect = Object.freeze({
  id: true,
  nameFa: true,
  nameEn: true,
  priceAed: true,
  priceToman: true,
  supplyMode: true,
  weight: true,
  hasDiscount: true,
  discountPercent: true,
  image: true,
  originalLink: true,
  brand: { select: { name: true, faName: true } },
  store: { select: { name: true } },
  category: {
    select: {
      name: true,
      _count: {
        select: {
          attributeAssignments: {
            where: { isVariantDefining: true, attribute: { isActive: true } },
          },
        },
      },
    },
  },
  warehouseItem: { select: { stock: true, reserved: true, isArchived: true } },
  variants: {
    select: {
      id: true,
      productId: true,
      sku: true,
      optionSignature: true,
      isDefault: true,
      isActive: true,
      sortOrder: true,
      priceAedOverride: true,
      priceTomanOverride: true,
      discountPercentOverride: true,
      weightOverride: true,
      inventory: { select: { stock: true, reserved: true } },
      options: {
        select: {
          attribute: { select: { code: true, nameFa: true, nameEn: true, sortOrder: true } },
          attributeOption: { select: { code: true, labelFa: true, labelEn: true, sortOrder: true } },
        },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
});

function withAxisCount(product) {
  return {
    ...product,
    variantAxisCount: product.category?._count?.attributeAssignments || 0,
  };
}

export async function resolveAuthoritativeProductCartLines(
  client,
  lines,
  { settings = null } = {},
) {
  if (!Array.isArray(lines) || lines.length < 1) return [];
  const products = await client.product.findMany({
    where: { id: { in: [...new Set(lines.map(line => line.productId))] }, ...PUBLIC_PRODUCT_VISIBILITY },
    select: productCartSelect,
  });
  const needsExternalSettings = products.some(product => product.supplyMode === 'EXTERNAL_DUBAI');
  const authoritativeSettings = needsExternalSettings ? (settings || await getPricingSettings()) : null;
  const byId = new Map(products.map(product => [product.id, withAxisCount(product)]));
  return lines.map(line => {
    const product = byId.get(line.productId);
    if (!product) throw new ProductCartError('محصول پیدا نشد یا قابل سفارش نیست.', 404, 'PRODUCT_UNAVAILABLE');
    return resolveProductCartLineFromData({ product, line, settings: authoritativeSettings });
  });
}

export async function resolvePublicProductCartLines(client, lines) {
  if (!lines.length) return [];
  const products = await client.product.findMany({
    where: { id: { in: [...new Set(lines.map(line => line.productId))] }, ...PUBLIC_PRODUCT_VISIBILITY },
    select: productCartSelect,
  });
  const normalizedProducts = products.map(withAxisCount);
  const byId = new Map(normalizedProducts.map(product => [product.id, product]));
  const settings = products.some(product => product.supplyMode === 'EXTERNAL_DUBAI')
    ? await getPricingSettings()
    : null;
  return lines.map(line => {
    try {
      const product = byId.get(line.productId);
      if (!product) throw new ProductCartError('محصول پیدا نشد یا قابل سفارش نیست.', 404, 'PRODUCT_UNAVAILABLE');
      return resolveProductCartLineFromData({ product, line, settings });
    } catch (error) {
      if (!(error instanceof ProductCartError) && !error?.code) throw error;
      return {
        type: 'PRODUCT',
        id: line.productId,
        productId: line.productId,
        productVariantId: line.productVariantId || null,
        quantity: line.quantity,
        requestKey: line.requestKey,
        key: line.requestKey,
        authoritative: true,
        available: false,
        code: error.code || 'PRODUCT_UNAVAILABLE',
        message: error.message,
      };
    }
  });
}

export { productCartSelect };
