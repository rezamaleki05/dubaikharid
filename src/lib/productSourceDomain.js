// Source metadata never participates in a ProductVariant option signature.
export function sameSourceHomepage(value, homepage) {
  if (!value || !homepage) return false;
  try {
    const a = new URL(value), b = new URL(homepage);
    const host = url => url.hostname.toLowerCase().replace(/^www\./, '');
    return host(a) === host(b) && a.port === b.port && a.pathname.replace(/\/+$/, '') === b.pathname.replace(/\/+$/, '') && a.search === b.search;
  } catch { return false; }
}
export function exactProductSourceInput(product) {
  return !product.storeId && sameSourceHomepage(product.originalLink, product.brand?.url) ? '' : (product.originalLink || '');
}
export function productSourceLink(form, brand) {
  if (form.sourceType === 'none') return null;
  const exact = String(form.originalLink || '').trim();
  return exact || (form.sourceType === 'brand' ? brand?.url || null : null);
}
export function officialSourceDomainWarning(value, homepage) {
  if (!value || !homepage) return false;
  try {
    const host = url => new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const a = host(value), b = host(homepage);
    return a !== b && !a.endsWith('.' + b) && !b.endsWith('.' + a);
  } catch { return false; }
}
