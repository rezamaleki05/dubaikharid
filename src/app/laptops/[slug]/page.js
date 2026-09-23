import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JsonLd from '@/components/seo/JsonLd';
import LaptopModelUnits from '@/components/laptop/LaptopModelUnits';
import { getPublicLaptopModelBySlug } from '@/lib/publicLaptopSeo';
import { absoluteUrl, breadcrumbSchema, publicPageMetadata } from '@/lib/seo';
import styles from './LaptopModel.module.css';

function descriptionFor(group) {
  const availableSpecs = [...new Set(group.units.flatMap(unit => [unit.cpu, unit.ram, unit.storage, unit.gpu]).filter(Boolean))];
  const specSummary = availableSpecs.length ? ` مشخصات موجود شامل ${availableSpecs.slice(0, 4).join('، ')} است.` : '';
  return `خرید لپ تاپ استوک ${group.brand} ${group.model} با مشخصات پردازنده، رم، حافظه، کارت گرافیک، وضعیت دستگاه و قیمت به‌روز.${specSummary}`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const group = await getPublicLaptopModelBySlug(slug);
  if (!group) return { title: 'مدل لپ تاپ پیدا نشد', robots: { index: false, follow: true } };
  return publicPageMetadata({
    title: `${group.brand} ${group.model} استوک | قیمت و خرید`,
    description: descriptionFor(group),
    path: `/laptops/${group.slug}`,
    image: group.image,
    type: 'website',
  });
}

export default async function LaptopModelPage({ params }) {
  const { slug } = await params;
  const group = await getPublicLaptopModelBySlug(slug);
  if (!group) notFound();

  const canonicalPath = `/laptops/${group.slug}`;
  const lowPriceIrr = (BigInt(group.lowPriceToman) * 10n).toString();
  const highPriceIrr = (BigInt(group.highPriceToman) * 10n).toString();
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(canonicalPath)}#product`,
    name: group.name,
    url: absoluteUrl(canonicalPath),
    description: descriptionFor(group),
    image: group.images.length ? group.images.map(absoluteUrl) : [absoluteUrl(group.image)],
    brand: { '@type': 'Brand', name: group.brand },
    itemCondition: 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'AggregateOffer',
      url: absoluteUrl(canonicalPath),
      priceCurrency: 'IRR',
      lowPrice: lowPriceIrr,
      highPrice: highPriceIrr,
      offerCount: group.availableCount,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
    },
  };
  const breadcrumbs = breadcrumbSchema([
    { name: 'صفحه اصلی', path: '/' },
    { name: 'لپ تاپ استوک', path: '/stock-laptops' },
    { name: group.name, path: canonicalPath },
  ]);

  return (
    <div className={styles.pageWrapper}>
      <JsonLd data={[breadcrumbs, productSchema]} />
      <Header />
      <main className={styles.main} dir="rtl">
        <section className={styles.hero}>
          <div className={styles.imageStage}>
            <img src={group.image} alt={`لپ تاپ استوک ${group.brand} ${group.model}`} />
          </div>
          <div className={styles.summary}>
            <span className={styles.eyebrow}>{group.brand}</span>
            <h1>{group.name}</h1>
            <p>{descriptionFor(group)}</p>
            <dl className={styles.summaryFacts}>
              <div><dt>موجودی</dt><dd>موجود</dd></div>
              <div><dt>تعداد دستگاه قابل انتخاب</dt><dd>{group.availableCount.toLocaleString('fa-IR')}</dd></div>
              <div>
                <dt>قیمت</dt>
                <dd>{group.priceVaries ? 'از ' : ''}{Number(group.lowPriceToman).toLocaleString('fa-IR')} تومان</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={styles.unitsSection} aria-labelledby="available-configurations">
          <div className={styles.sectionHeading}>
            <h2 id="available-configurations">مشخصات دستگاه‌های موجود</h2>
            <p>هر گزینه یک دستگاه فیزیکی قابل خرید است؛ شماره سریال و شناسه‌های داخلی در این صفحه نمایش داده نمی‌شوند.</p>
          </div>
          <LaptopModelUnits units={group.units} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
