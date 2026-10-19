import { laptopModelBaseSlug } from './laptopSeoDomain.js';
export const LAPTOP_ORIGIN = 'https://dubaikharid.shop';
export function laptopPath(laptop) {
  const slug = laptop.slug || laptop.canonicalSlug || laptopModelBaseSlug(laptop.brand, laptop.model, laptop.series);
  return `/laptops/${encodeURIComponent(slug)}`;
}
