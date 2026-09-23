import 'server-only';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { PUBLIC_PRODUCT_VISIBILITY } from '@/lib/publicCatalog';
import { getProductCoverImage } from '@/lib/productGallery';
import { getPublicLaptopModelForUnit } from '@/lib/publicLaptopSeo';
import { resolveProductVariantPriceFromData } from '@/lib/productSupplyPricingDomain';
import { getPricingSettings } from '@/lib/settings';

export const getSeoProduct = cache(async id => {
  if (typeof id !== 'string' || !id || id.length > 180) return null;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], ...PUBLIC_PRODUCT_VISIBILITY },
    select: {
      id: true, slug: true, nameFa: true, nameEn: true, description: true, image: true,
      priceAed: true, priceToman: true, supplyMode: true, weight: true,
      discountPercent: true, hasDiscount: true, updatedAt: true,
      images: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, url: true, sortOrder: true, isPrimary: true },
      },
      brand: { select: { id: true, name: true, faName: true, showInBrandDirectory: true } },
      store: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          priceAedOverride: true,
          priceTomanOverride: true,
          discountPercentOverride: true,
          weightOverride: true,
          inventory: { select: { stock: true, reserved: true } },
        },
      },
    },
  });
  if (product) {
    const settings = product.supplyMode === 'EXTERNAL_DUBAI' ? await getPricingSettings() : null;
    const pricedVariants = product.variants.flatMap(variant => {
      try {
        return [resolveProductVariantPriceFromData({ product, variant, settings })];
      } catch {
        return [];
      }
    });
    const prices = pricedVariants.map(price => BigInt(price.finalPriceToman));
    const lowPrice = prices.length ? prices.reduce((minimum, price) => price < minimum ? price : minimum) : null;
    const highPrice = prices.length ? prices.reduce((maximum, price) => price > maximum ? price : maximum) : null;
    const inStock = product.variants.some(variant => product.supplyMode === 'EXTERNAL_DUBAI'
      || (variant.inventory && variant.inventory.stock - variant.inventory.reserved > 0));
    return {
      kind: 'product',
      ...product,
      name: product.nameFa,
      image: getProductCoverImage(product, null),
      inStock,
      seoPriceRange: lowPrice === null ? null : {
        lowPriceToman: lowPrice.toString(),
        highPriceToman: highPrice.toString(),
        varies: lowPrice !== highPrice,
      },
    };
  }
  const laptop = await prisma.laptop.findFirst({
    where: { id, status: 'AVAILABLE', archivedAt: null },
    select: {
      id: true, name: true, brand: true, model: true, cpu: true, ram: true, storage: true,
      image: true, priceToman: true, status: true, updatedAt: true,
    },
  });
  if (!laptop) return null;
  const modelGroup = await getPublicLaptopModelForUnit(laptop.id);
  return {
    kind: 'laptop',
    ...laptop,
    modelGroup,
    canonicalPath: modelGroup ? `/laptops/${modelGroup.slug}` : '/stock-laptops',
  };
});

export const getSeoStore = cache(async id => prisma.store.findUnique({
  where: { id },
  select: {
    id: true, name: true, desc: true, url: true, img: true,
    _count: { select: { products: { where: PUBLIC_PRODUCT_VISIBILITY } } },
  },
}).then(store => store ? { ...store, productCount: store._count.products } : null));

export const getSeoBrand = cache(async id => prisma.brand.findFirst({
  where: { id, showInBrandDirectory: true },
  select: {
    id: true, name: true, faName: true, cat: true, img: true,
    _count: { select: { products: { where: PUBLIC_PRODUCT_VISIBILITY } } },
  },
}).then(brand => brand ? { ...brand, productCount: brand._count.products } : null));
