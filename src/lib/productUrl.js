// The public Product canonical route is ID-based; slugs are lookup aliases.
export function productPath(id) {
  return `/product/${encodeURIComponent(id)}`;
}

export function publicProductHref(product) {
  if (product?.publicHref?.startsWith('/laptop-accessories/')) return product.publicHref;
  const profile = product?.accessoryProfile;
  if (profile && /^[a-z0-9-]+$/.test(profile.categorySlug) && /^[a-z0-9-]+$/.test(product.slug)) return `/laptop-accessories/${profile.categorySlug}/${product.slug}`;
  return productPath(product?.id || product?.productId || '');
}
