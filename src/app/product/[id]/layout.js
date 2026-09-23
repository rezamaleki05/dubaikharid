import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import { getSeoProduct } from '@/lib/publicSeoData';
import { absoluteUrl, breadcrumbSchema, publicPageMetadata } from '@/lib/seo';

function descriptionFor(item) {
  if (item.kind === 'laptop') {
    return [item.brand, item.model, item.cpu, item.ram, item.storage].filter(Boolean).join('، ');
  }
  if (item.description?.trim()) return item.description.trim().replace(/\s+/g, ' ').slice(0, 220);
  const brand = item.brand?.faName || item.brand?.name;
  const originalName = item.nameEn ? ` (${item.nameEn})` : '';
  return `مشاهده ${item.name}${originalName}${brand ? ` از برند ${brand}` : ''}، بررسی مشخصات و ثبت سفارش با قیمت معتبر سرور در دبی خرید.`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = await getSeoProduct(id);
  if (!item) return { title: 'محصول پیدا نشد', robots: { index: false, follow: true } };
  const title = item.kind === 'laptop'
    ? `${[item.brand, item.model].filter(Boolean).join(' ')} استوک | خرید لپ‌تاپ استوک`
    : item.name;
  return publicPageMetadata({
    title,
    description: descriptionFor(item),
    path: item.kind === 'laptop' ? item.canonicalPath : `/product/${item.id}`,
    image: item.image || undefined,
    type: 'website',
    ...(item.kind === 'laptop' ? { robots: { index: false, follow: true } } : {}),
  });
}

export default async function ProductSeoLayout({ children, params }) {
  const { id } = await params;
  const item = await getSeoProduct(id);
  if (!item) notFound();

  const brandName = item.kind === 'product' ? item.brand?.faName || item.brand?.name : item.brand;
  const crumbs = [
    { name: 'صفحه اصلی', path: '/' },
    ...(item.kind === 'laptop'
      ? [{ name: 'لپ‌تاپ‌های استوک', path: '/stock-laptops' }]
      : item.brand?.showInBrandDirectory
        ? [{ name: brandName, path: `/brands/${item.brand.id}` }]
        : []),
    { name: item.name, path: item.kind === 'laptop' ? item.canonicalPath : `/product/${item.id}` },
  ];
  const productSchema = item.kind === 'product' ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/product/${item.id}`)}#product`,
    name: item.name,
    ...(item.nameEn ? { alternateName: item.nameEn } : {}),
    url: absoluteUrl(`/product/${item.id}`),
    description: descriptionFor(item),
    ...(item.image ? { image: [absoluteUrl(item.image)] } : {}),
    ...(brandName ? { brand: { '@type': 'Brand', name: brandName } } : {}),
    ...(item.seoPriceRange ? {
      offers: item.seoPriceRange.varies ? {
        '@type': 'AggregateOffer',
        url: absoluteUrl(`/product/${item.id}`),
        priceCurrency: 'IRR',
        lowPrice: (BigInt(item.seoPriceRange.lowPriceToman) * 10n).toString(),
        highPrice: (BigInt(item.seoPriceRange.highPriceToman) * 10n).toString(),
        offerCount: item.variants.length,
        availability: item.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      } : {
        '@type': 'Offer',
        url: absoluteUrl(`/product/${item.id}`),
        priceCurrency: 'IRR',
        price: (BigInt(item.seoPriceRange.lowPriceToman) * 10n).toString(),
        availability: item.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    } : {}),
  } : null;
  return <><JsonLd data={[breadcrumbSchema(crumbs), ...(productSchema ? [productSchema] : [])]} />{children}</>;
}
