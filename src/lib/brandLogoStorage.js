import 'server-only';

import { del } from '@vercel/blob';
import { getProductBlobAuthOptions } from '@/lib/productImageStorage';
import { isOwnedBrandLogoPathname, ownedBrandLogoPathnameFromUrl } from '@/lib/brandLogoOwnership';

export async function deleteUnreferencedBrandLogos(client, pathnames) {
  const candidates = [...new Set((pathnames || []).filter(isOwnedBrandLogoPathname))];
  const auth = getProductBlobAuthOptions();
  if (!candidates.length || !auth) return { deleted: [], referenced: [], skipped: candidates };
  const brands = await client.brand.findMany({ where: { img: { not: null } }, select: { img: true } });
  const referencedPaths = new Set(brands.map(brand => ownedBrandLogoPathnameFromUrl(brand.img)).filter(Boolean));
  const deleted = [];
  const referenced = [];
  const skipped = [];
  for (const pathname of candidates) {
    if (referencedPaths.has(pathname)) { referenced.push(pathname); continue; }
    try { await del(pathname, auth); deleted.push(pathname); }
    catch (error) { console.error('Brand logo cleanup failed:', { pathname, message: error instanceof Error ? error.message : 'Unknown error' }); skipped.push(pathname); }
  }
  return { deleted, referenced, skipped };
}
