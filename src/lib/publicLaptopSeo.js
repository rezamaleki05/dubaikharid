import 'server-only';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { buildLaptopModelGroups, searchLaptopModelGroups } from '@/lib/laptopSeoDomain';

const PUBLIC_LAPTOP_MODEL_SELECT = Object.freeze({
  id: true,
  name: true,
  brand: true,
  model: true,
  cpu: true,
  ram: true,
  storage: true,
  secondaryStorage: true,
  gpu: true,
  screen: true,
  manufactureYear: true,
  batteryHealth: true,
  condition: true,
  priceToman: true,
  image: true,
  images: true,
  description: true,
  status: true,
  archivedAt: true,
  reservedOrderId: true,
  updatedAt: true,
});

export const getPublicLaptopModelGroups = cache(async () => {
  const laptops = await prisma.laptop.findMany({
    where: {
      status: 'AVAILABLE',
      archivedAt: null,
      reservedOrderId: null,
      priceToman: { gt: 0 },
      brand: { not: null },
      model: { not: null },
    },
    select: PUBLIC_LAPTOP_MODEL_SELECT,
    orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
  });
  return buildLaptopModelGroups(laptops);
});

export const getPublicLaptopModelBySlug = cache(async slug => {
  if (typeof slug !== 'string' || !slug || slug.length > 180) return null;
  const groups = await getPublicLaptopModelGroups();
  return groups.find(group => group.slug === slug) || null;
});

export const getPublicLaptopModelForUnit = cache(async id => {
  if (typeof id !== 'string' || !id || id.length > 180) return null;
  const groups = await getPublicLaptopModelGroups();
  return groups.find(group => group.units.some(unit => unit.id === id)) || null;
});

export async function searchPublicLaptopModels(query, limit = 24) {
  const groups = await getPublicLaptopModelGroups();
  return searchLaptopModelGroups(groups, query, limit).map(group => ({
    id: group.slug,
    slug: group.slug,
    href: `/laptops/${group.slug}`,
    name: group.name,
    brand: group.brand,
    model: group.model,
    image: group.image,
    spec: [...new Set(group.units.flatMap(unit => [unit.cpu, unit.ram, unit.storage]).filter(Boolean))].slice(0, 3).join(' / '),
    lowPriceToman: group.lowPriceToman,
    highPriceToman: group.highPriceToman,
    priceVaries: group.priceVaries,
    availableCount: group.availableCount,
  }));
}
