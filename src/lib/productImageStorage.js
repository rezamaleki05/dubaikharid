import 'server-only';

import { del } from '@vercel/blob';
import { isOwnedProductBlobPathname } from '@/lib/productGallery';

export function getProductBlobAuthOptions() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return { token: process.env.BLOB_READ_WRITE_TOKEN };
  }
  if (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID) {
    return {
      oidcToken: process.env.VERCEL_OIDC_TOKEN,
      storeId: process.env.BLOB_STORE_ID,
    };
  }
  return null;
}

export async function deleteUnreferencedProductBlobs(client, pathnames) {
  const candidates = [...new Set((pathnames || []).filter(isOwnedProductBlobPathname))];
  const blobAuth = getProductBlobAuthOptions();
  if (!candidates.length || !blobAuth) {
    return { deleted: [], skipped: candidates };
  }

  const deleted = [];
  const skipped = [];
  for (const pathname of candidates) {
    try {
      const references = await client.productImage.count({ where: { blobPathname: pathname } });
      if (references > 0) {
        skipped.push(pathname);
        continue;
      }
      await del(pathname, blobAuth);
      deleted.push(pathname);
    } catch (error) {
      skipped.push(pathname);
      console.error('Product Blob cleanup failed after the database mutation committed:', {
        pathname,
        message: error instanceof Error ? error.message : 'Unknown cleanup error',
      });
    }
  }
  return { deleted, skipped };
}
