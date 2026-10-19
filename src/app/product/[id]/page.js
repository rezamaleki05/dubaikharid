import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicProduct } from '@/lib/publicCatalog';
import { getSeoProduct } from '@/lib/publicSeoData';
import ProductClient from './ProductClient';

export default async function ProductPage({ params }) {
  const { id } = await params;
  // Preserve the existing physical-Laptop legacy redirect before Product-only lookup.
  const identity = await getSeoProduct(id);
  if (identity?.kind === 'laptop') permanentRedirect(identity.canonicalPath);
  const product = await getPublicProduct(id);
  if (!product) notFound();
  if (id !== product.id) permanentRedirect(`/product/${product.id}`);
  return <ProductClient key={product.id} params={Promise.resolve({ id: product.id })} initialProduct={product} />;
}
