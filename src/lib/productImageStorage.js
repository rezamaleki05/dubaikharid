import 'server-only';

import { del } from '@vercel/blob';
import { isOwnedProductBlobPathname } from '@/lib/productGallery';

export async function deleteUnreferencedProductBlobs(client, pathnames) {
  const candidates = [...new Set((pathnames || []).filter(isOwnedProductBlobPathname))];
  if (!candidates.length || !process.env.BLOB_READ_WRITE_TOKEN) {
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
      await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
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
