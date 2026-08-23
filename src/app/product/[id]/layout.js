import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import { getSeoProduct } from '@/lib/publicSeoData';
import { absoluteUrl, breadcrumbSchema, publicPageMetadata } from '@/lib/seo';

function descriptionFor(item) {
  if (item.kind === 'laptop') {
    return [item.brand, item.model, item.cpu, item.ram, item.storage].filter(Boolean).join('، ');
  }
  const brand = item.brand?.faName || item.brand?.name;
  return `مشاهده ${item.name}${brand ? ` از برند ${brand}` : ''}، بررسی مشخصات و ثبت سفارش با قیمت معتبر سرور در دبی خرید.`;
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
    path: `/product/${item.id}`,
    image: item.image || undefined,
    type: 'website',
  });
}

export default async function ProductSeoLayout({ children, params }) {
  const { id } = await params;
  const item = await getSeoProduct(id);
  if (!item && (/^c[a-z0-9-]{20,}$/i.test(id) || id.length > 180)) notFound();
  if (!item) return children;

  const brandName = item.kind === 'product' ? item.brand?.faName || item.brand?.name : item.brand;
  const crumbs = [
    { name: 'صفحه اصلی', path: '/' },
    ...(item.kind === 'laptop'
      ? [{ name: 'لپ‌تاپ‌های استوک', path: '/stock-laptops' }]
      : item.brand ? [{ name: brandName, path: `/brands/${item.brand.id}` }] : []),
    { name: item.name, path: `/product/${item.id}` },
  ];
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/product/${item.id}`)}#product`,
    name: item.name,
    url: absoluteUrl(`/product/${item.id}`),
    description: descriptionFor(item),
    ...(item.image ? { image: [absoluteUrl(item.image)] } : {}),
    ...(brandName ? { brand: { '@type': 'Brand', name: brandName } } : {}),
    ...(item.kind === 'laptop' && item.priceToman ? {
      itemCondition: 'https://schema.org/UsedCondition',
      offers: {
        '@type': 'Offer',
        url: absoluteUrl(`/product/${item.id}`),
        priceCurrency: 'IRR',
        price: Number(item.priceToman) * 10,
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/UsedCondition',
      },
    } : {}),
  };
  return <><JsonLd data={[breadcrumbSchema(crumbs), productSchema]} />{children}</>;
}
