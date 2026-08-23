import 'server-only';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getSeoProduct = cache(async id => {
  if (typeof id !== 'string' || !id || id.length > 180) return null;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], status: 'active' },
    select: {
      id: true, slug: true, name: true, image: true, priceAed: true, weight: true,
      discountPercent: true, hasDiscount: true, updatedAt: true,
      brand: { select: { id: true, name: true, faName: true } },
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
    products: {
      where: { status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: 24,
      select: { id: true, name: true, image: true, updatedAt: true },
    },
  },
}));

export const getSeoBrand = cache(async id => prisma.brand.findUnique({
  where: { id },
  select: {
    id: true, name: true, faName: true, cat: true, img: true,
    products: {
      where: { status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: 24,
      select: { id: true, name: true, image: true, updatedAt: true },
    },
  },
}));
