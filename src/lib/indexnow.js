import 'server-only';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicProduct, PUBLIC_PRODUCT_VISIBILITY } from '@/lib/publicCatalog';
import { PUBLIC_LAPTOP_MODEL_SELECT } from '@/lib/publicLaptopSeo';
import { buildLaptopModelGroups } from '@/lib/laptopSeoDomain';
import { brandGuides, storeAnswers } from '@/lib/commerceGuides';
import { createIndexNowClient, indexNowConfiguration, scheduleIndexNowComparison } from './indexnowDomain.js';

import { createIndexNowStateReader } from './indexnowPublication.js';

const client = createIndexNowClient();
const readState = createIndexNowStateReader({
  readProduct: getPublicProduct,
  readLaptopGroups: async () => buildLaptopModelGroups(await prisma.laptop.findMany({
    where: { status: 'AVAILABLE', archivedAt: null, reservedOrderId: null, priceToman: { gt: 0 }, brand: { not: null }, model: { not: null } },
    select: PUBLIC_LAPTOP_MODEL_SELECT, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
  })),
  readEntity: (kind, id) => prisma[kind].findUnique({ where: { id }, select: {
    id: true, name: true, img: true,
    ...(kind === 'store' ? { desc: true } : { faName: true, cat: true, showInBrandDirectory: true }),
    _count: { select: { products: { where: PUBLIC_PRODUCT_VISIBILITY } } },
  } }),
  brandGuides, storeAnswers,
});
async function readPublicState(kind, id) {
  if (kind === 'variant') {
    const variant = await prisma.productVariant.findUnique({ where: { id }, select: { productId: true } });
    if (!variant) return { kind: 'product', id: null, pages: {} };
    kind = 'product'; id = variant.productId;
  }
  return readState(kind, id);
}
export async function captureIndexNowState(kind, id) {
  if (!indexNowConfiguration()) return null;
  try { return await readPublicState(kind, id); }
  catch { console.warn('INDEXNOW_SNAPSHOT_UNAVAILABLE'); return null; }
}
export function scheduleIndexNowChange(before) {
  if (!indexNowConfiguration()) return;
  scheduleIndexNowComparison({ before, readAfter: () => readPublicState(before.kind, before.id), submit: urls => client.submit(urls), defer: after });
}
