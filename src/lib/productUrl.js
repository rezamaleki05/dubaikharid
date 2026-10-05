// The public Product canonical route is ID-based; slugs are lookup aliases.
export function productPath(id) {
  return `/product/${encodeURIComponent(id)}`;
}
