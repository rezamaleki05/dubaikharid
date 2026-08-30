import 'server-only';

import { prisma } from '@/lib/prisma';
import { PUBLIC_PRODUCT_PLACEHOLDER } from '@/lib/publicCatalog';
import { getWarehouseAvailableQuantity, getWarehouseUnitPriceToman } from '@/lib/warehouseSales';

export const PUBLIC_WAREHOUSE_VISIBILITY = Object.freeze({ isPublished: true, isArchived: false });

const PUBLIC_WAREHOUSE_SELECT = Object.freeze({
  id: true,
  slug: true,
  name: true,
  publicNameEn: true,
  description: true,
  price: true,
  stock: true,
  reserved: true,
  image: true,
  gender: true,
  discountPercent: true,
  hasDiscount: true,
  isBestSeller: true,
  createdAt: true,
  updatedAt: true,
  brand: { select: { id: true, name: true, faName: true } },
  category: { select: { id: true, name: true, query: true } },
});

export function serializePublicWarehouseItem(item) {
  const available = getWarehouseAvailableQuantity(item);
  const discountPercent = item.hasDiscount ? item.discountPercent : 0;
  const salePrice = getWarehouseUnitPriceToman(item);
  return {
    id: item.id,
    warehouseItemId: item.id,
    type: 'WAREHOUSE',
    product_type: 'warehouse_stock',
    slug: item.slug,
    name: item.name,
    nameFa: item.name,
    nameEn: item.publicNameEn || '',
    description: item.description || '',
    priceToman: item.price,
    finalPriceToman: salePrice,
    originalPriceToman: item.price,
    image: item.image || PUBLIC_PRODUCT_PLACEHOLDER,
    available,
    inStock: available > 0,
    discountPercent,
    hasDiscount: discountPercent > 0,
    isBestSeller: item.isBestSeller,
    brandId: item.brand?.id || null,
    brand: item.brand?.faName || item.brand?.name || '',
    brandName: item.brand?.name || '',
    categoryId: item.category?.id || null,
    category: item.category?.query || item.category?.name || '',
    categoryName: item.category?.name || '',
    store: 'موجودی دبی خرید',
    spec: item.category?.name || 'موجود در انبار',
  };
}

export async function getPublicWarehouseCatalog({ page = 1, limit = 24, search = '' } = {}) {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  if (!Number.isSafeInteger(parsedPage) || parsedPage < 1 || !Number.isSafeInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 60) {
    throw new Error('INVALID_PAGINATION');
  }
  const cleanSearch = typeof search === 'string' ? search.trim().slice(0, 160) : '';
  const where = {
    ...PUBLIC_WAREHOUSE_VISIBILITY,
    ...(cleanSearch ? { OR: [
      { name: { contains: cleanSearch, mode: 'insensitive' } },
      { publicNameEn: { contains: cleanSearch, mode: 'insensitive' } },
      { brand: { is: { OR: [
        { name: { contains: cleanSearch, mode: 'insensitive' } },
        { faName: { contains: cleanSearch, mode: 'insensitive' } },
      ] } } },
    ] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.warehouseItem.findMany({
      where,
      select: PUBLIC_WAREHOUSE_SELECT,
      orderBy: [{ createdAt: 'desc' }],
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
    prisma.warehouseItem.count({ where }),
  ]);
  return {
    data: items.map(serializePublicWarehouseItem),
    pagination: { page: parsedPage, limit: parsedLimit, total, totalPages: Math.max(1, Math.ceil(total / parsedLimit)) },
  };
}

export async function getPublicWarehouseItem(identifier) {
  if (typeof identifier !== 'string' || !identifier || identifier.length > 180) return null;
  const item = await prisma.warehouseItem.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }], ...PUBLIC_WAREHOUSE_VISIBILITY },
    select: PUBLIC_WAREHOUSE_SELECT,
  });
  return item ? serializePublicWarehouseItem(item) : null;
}
