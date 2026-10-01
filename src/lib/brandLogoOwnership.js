const BRAND_LOGO_PATHNAME = /^brands\/\d{4}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;

export function isOwnedBrandLogoPathname(value) {
  return typeof value === 'string' && BRAND_LOGO_PATHNAME.test(value);
}

export function ownedBrandLogoPathnameFromUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const pathname = decodeURIComponent(new URL(value).pathname).replace(/^\/+/, '');
    return isOwnedBrandLogoPathname(pathname) ? pathname : null;
  } catch {
    return null;
  }
}
