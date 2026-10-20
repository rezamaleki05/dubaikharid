export const PUBLIC_BLOB_IMAGE_HOST = '5pdfiowt51ljxje3.public.blob.vercel-storage.com';
// Do not proxy arbitrary external-store URLs, signed links or private resources.
export function canOptimizePublicImage(source) {
  if (typeof source !== 'string' || source.trim() !== source) return false;
  if (/^\/images\/[\w /.-]+\.(?:png|jpe?g|webp|avif)$/i.test(source) && !source.includes('..')) return true;
  try {
    const url = new URL(source);
    return url.protocol === 'https:' && url.hostname === PUBLIC_BLOB_IMAGE_HOST
      && !url.port && !url.username && !url.password && !url.search && !url.hash
      && /\.(?:png|jpe?g|webp|avif)$/i.test(url.pathname);
  } catch { return false; }
}
