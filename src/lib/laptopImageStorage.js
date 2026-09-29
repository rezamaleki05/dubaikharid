import 'server-only';

import { del } from '@vercel/blob';
import { getProductBlobAuthOptions } from '@/lib/productImageStorage';
import {
  isOwnedLaptopBlobPathname,
  laptopReferencesBlob,
} from '@/lib/laptopImageOwnership';

export function getLaptopBlobAuthOptions() {
  return getProductBlobAuthOptions();
}

export async function deleteUnreferencedLaptopBlobs(client, pathnames) {
  const candidates = [...new Set((pathnames || []).filter(isOwnedLaptopBlobPathname))];
  const blobAuth = getLaptopBlobAuthOptions();
  if (!candidates.length || !blobAuth) {
    return { deleted: [], referenced: [], skipped: candidates };
  }

  const deleted = [];
  const referenced = [];
  const skipped = [];
  let laptops;
  try {
    laptops = await client.laptop.findMany({ select: { image: true, images: true } });
  } catch (error) {
    console.error('Laptop Blob reference check failed after the database mutation committed:', {
      message: error instanceof Error ? error.message : 'Unknown reference-check error',
    });
    return { deleted, referenced, skipped: candidates };
  }

  for (const pathname of candidates) {
    if (laptops.some(laptop => laptopReferencesBlob(laptop, pathname))) {
      referenced.push(pathname);
      continue;
    }
    try {
      await del(pathname, blobAuth);
      deleted.push(pathname);
    } catch (error) {
      skipped.push(pathname);
      console.error('Laptop Blob cleanup failed after the database mutation committed:', {
        pathname,
        message: error instanceof Error ? error.message : 'Unknown cleanup error',
      });
    }
  }

  return { deleted, referenced, skipped };
}
