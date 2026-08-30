import 'server-only';

import { revalidatePath } from 'next/cache';

const PUBLIC_CATALOG_PATHS = Object.freeze([
  '/', '/men', '/women', '/kids', '/clothing', '/sports-shoes',
  '/bags-accessories', '/watches', '/other-products', '/mobile',
  '/electronics', '/beauty-health', '/sale', '/best-sellers',
  '/search', '/brands', '/sitemap.xml', '/api/products',
  '/warehouse', '/api/warehouse',
]);

export function revalidatePublicCatalog(productId = null) {
  try {
    for (const path of PUBLIC_CATALOG_PATHS) revalidatePath(path);
    revalidatePath('/brands/[slug]', 'page');
    revalidatePath('/stores/[slug]', 'page');
    revalidatePath('/product/[id]', 'page');
    if (productId) revalidatePath(`/product/${productId}`);
  } catch (error) {
    console.error('Unable to revalidate public catalog paths:', error);
  }
}
