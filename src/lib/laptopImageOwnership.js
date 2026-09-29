export const MAX_LAPTOP_IMAGES = 12;

const LAPTOP_BLOB_PATHNAME = /^laptops\/\d{4}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;

export function isOwnedLaptopBlobPathname(value) {
  return typeof value === 'string' && LAPTOP_BLOB_PATHNAME.test(value);
}

export function ownedLaptopBlobPathnameFromUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
    return isOwnedLaptopBlobPathname(pathname) ? pathname : null;
  } catch {
    return null;
  }
}

export function laptopImageUrls(laptop) {
  const gallery = Array.isArray(laptop?.images)
    ? laptop.images.filter(value => typeof value === 'string')
    : [];
  return [...new Set([laptop?.image, ...gallery].filter(value => typeof value === 'string'))];
}

export function laptopReferencesBlob(laptop, pathname) {
  if (!isOwnedLaptopBlobPathname(pathname)) return false;
  return laptopImageUrls(laptop).some(url => ownedLaptopBlobPathnameFromUrl(url) === pathname);
}

export function ownedLaptopBlobPathnames(laptop) {
  return [...new Set(laptopImageUrls(laptop).map(ownedLaptopBlobPathnameFromUrl).filter(Boolean))];
}
