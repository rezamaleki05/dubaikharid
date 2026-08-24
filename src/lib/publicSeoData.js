import 'server-only';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { PUBLIC_PRODUCT_VISIBILITY } from '@/lib/publicCatalog';

export const getSeoProduct = cache(async id => {
  if (typeof id !== 'string' || !id || id.length > 180) return null;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], ...PUBLIC_PRODUCT_VISIBILITY },
    select: {
      id: true, slug: true, name: true, image: true, priceAed: true, weight: true,
      discountPercent: true, hasDiscount: true, updatedAt: true,
      brand: { select: { id: true, name: true, faName: true, showInBrandDirectory: true } },
      store: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });
  if (product) return { kind: 'product', ...product };
  const laptop = await prisma.laptop.findFirst({
    where: { id, status: 'AVAILABLE', archivedAt: null },
    select: {
      id: true, name: true, brand: true, model: true, cpu: true, ram: true, storage: true,
      image: true, priceToman: true, status: true, updatedAt: true,
    },
  });
  return laptop ? { kind: 'laptop', ...laptop } : null;
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
