import { prisma } from '@/lib/prisma';
import { absoluteUrl } from '@/lib/seo';
import { isPreviewDeployment } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  if (isPreviewDeployment()) return [];

  const staticEntries = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/buy-from-dubai'), changeFrequency: 'monthly', priority: 0.95 },
    { url: absoluteUrl('/about'), changeFrequency: 'yearly', priority: 0.55 },
    { url: absoluteUrl('/brands'), changeFrequency: 'monthly', priority: 0.75 },
    { url: absoluteUrl('/stock-laptops'), changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/mobile'), changeFrequency: 'weekly', priority: 0.75 },
    { url: absoluteUrl('/electronics'), changeFrequency: 'weekly', priority: 0.75 },
    { url: absoluteUrl('/watches'), changeFrequency: 'weekly', priority: 0.75 },
    { url: absoluteUrl('/sports-shoes'), changeFrequency: 'weekly', priority: 0.75 },
    { url: absoluteUrl('/bags-accessories'), changeFrequency: 'weekly', priority: 0.75 },
    { url: absoluteUrl('/beauty-health'), changeFrequency: 'weekly', priority: 0.75 },
    { url: absoluteUrl('/clothing'), changeFrequency: 'weekly', priority: 0.75 },
    { url: absoluteUrl('/kids'), changeFrequency: 'weekly', priority: 0.75 },
  ];
  try {
    const [products, laptops, stores, brands] = await Promise.all([
      prisma.product.findMany({ where: { status: 'active' }, select: { id: true, updatedAt: true } }),
      prisma.laptop.findMany({ where: { status: 'AVAILABLE', archivedAt: null }, select: { id: true, updatedAt: true } }),
      prisma.store.findMany({ select: { id: true } }),
      prisma.brand.findMany({ where: { products: { some: { status: 'active' } } }, select: { id: true } }),
    ]);
    return [
      ...staticEntries,
      ...stores.map(store => ({ url: absoluteUrl(`/stores/${store.id}`), changeFrequency: 'monthly', priority: 0.7 })),
      ...brands.map(brand => ({ url: absoluteUrl(`/brands/${brand.id}`), changeFrequency: 'weekly', priority: 0.7 })),
      ...products.map(product => ({ url: absoluteUrl(`/product/${product.id}`), lastModified: product.updatedAt, changeFrequency: 'weekly', priority: 0.7 })),
      ...laptops.map(laptop => ({ url: absoluteUrl(`/product/${laptop.id}`), lastModified: laptop.updatedAt, changeFrequency: 'daily', priority: 0.75 })),
    ];
  } catch (error) {
    console.error('Unable to load dynamic sitemap records:', error);
    return staticEntries;
  }
}
