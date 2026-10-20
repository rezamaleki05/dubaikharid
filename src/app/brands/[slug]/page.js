import MultiStoreNotice from '@/components/seo/MultiStoreNotice';
import AnswerSections from '@/components/seo/AnswerSections';
import { brandGuides } from '@/lib/commerceGuides';
import { orderingEvidence } from '@/lib/organicGrowthContent';
import ContentEvidence from '@/components/seo/ContentEvidence';
import { collectionSeoState, collectionPageExists } from '@/lib/collectionSeoDomain';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getPublicCatalog } from '@/lib/publicCatalog';
import { getSeoBrand } from '@/lib/publicSeoData';
import { breadcrumbSchema, publicPageMetadata } from '@/lib/seo';
import styles from '../../seo-collection.module.css';

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const brand = await getSeoBrand(slug);
  const seo = collectionSeoState(`/brands/${brand?.id || slug}`, await searchParams);
  if (!brand) return { title: 'برند پیدا نشد', robots: { index: false, follow: false } };
  const guide = brandGuides[brand.id];
  const displayName = brand.faName || brand.name;
  return publicPageMetadata({
    title: guide?.title || `خرید محصولات ${displayName} از دبی`,
    description: guide?.intro || `مشاهده و ثبت سفارش محصولات ${displayName} از فروشگاه‌های امارات؛ ارسال لینک، برآورد قیمت و هماهنگی ارسال به ایران با دبی خرید.`,
    path: seo.path,
    image: brand.img || undefined,
    robots: seo.noindex || (!brand.productCount && !guide) ? { index: false, follow: true } : undefined,
  });
}

export default async function BrandPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const brand = await getSeoBrand(slug);
  if (!brand) notFound();
  const seo = collectionSeoState(`/brands/${brand.id}`, query);
  if (seo.page === null) notFound();
  const page = seo.page;
  const catalog = await getPublicCatalog({ brands: [brand.id], page, limit: 24 });
  if (!collectionPageExists(page, catalog.pagination.totalPages)) notFound();
  const guide = brandGuides[brand.id];
  const displayName = brand.faName || brand.name;
  const crumbs = [{ name: 'صفحه اصلی', path: '/' }, { name: 'برندها', path: '/brands' }, { name: displayName, path: `/brands/${brand.id}` }];
  return (
    <div className={styles.page}>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <Header />
      <main className={styles.main}>
        <Breadcrumbs items={crumbs} />
        <header className={styles.header}>
          {brand.img && <img src={brand.img} alt={`لوگوی برند ${displayName}`} className={styles.logo} width={96} height={72} />}
          <div><p className={styles.eyebrow}>{brand.cat || 'برند بین‌المللی'}</p><h1>{guide?.title || `خرید محصولات ${displayName} از دبی`}</h1></div>
        </header>
        {guide && <section className={styles.intro}><p>{guide.intro}</p></section>}
        <section className={styles.intro}>
          <h2>سفارش {displayName} از فروشگاه‌های امارات</h2>
          <p>برای خرید محصولات {displayName}، ابتدا کالا را در فروشگاه رسمی یا یکی از فروشگاه‌های معتبر امارات انتخاب کنید. سپس لینک مستقیم، رنگ و سایز موردنظر را برای بررسی موجودی و برآورد هزینه ارسال کنید.</p>
          <p>دبی خرید یک سرویس مستقل برای ثبت و پیگیری سفارش است و نماینده یا مالک برند {brand.name} نیست.</p>
          <Link href="/#calculator" className={styles.cta}>ارسال لینک محصول {displayName}</Link>
        </section>
        {guide && <AnswerSections answers={guide.answers} links={guide.links} />}
        {orderingEvidence[brand.id] && <ContentEvidence evidence={orderingEvidence[brand.id]} />}
        {catalog.data.length > 0 ? <section className={styles.products}><h2>محصولات {displayName}</h2><div className={styles.grid}>{catalog.data.map(product => <Link key={product.id} href={`/product/${product.id}`}><span>{product.name}</span></Link>)}</div>{catalog.pagination.totalPages > 1 && <nav aria-label="صفحه‌بندی محصولات" style={{display:'flex',justifyContent:'center',gap:'18px',marginTop:'24px'}}>{page > 1 && <Link href={`?page=${page - 1}`}>صفحه قبل</Link>}{page < catalog.pagination.totalPages && <Link href={`?page=${page + 1}`}>صفحه بعد</Link>}</nav>}</section> : <section className={styles.notice}><h2>محصول ثبت‌شده‌ای موجود نیست</h2><p>می‌توانید لینک محصول دلخواه خود را از سایت مبدأ ارسال کنید. قیمت و موجودی هر درخواست پس از بررسی همان لینک اعلام می‌شود.</p></section>}
        <MultiStoreNotice />
        <section className={styles.related}><Link href="/buy-from-dubai">راهنمای خرید مستقیم از دبی</Link><Link href="/brands">بازگشت به فهرست برندها</Link></section>
      </main>
      <Footer />
    </div>
  );
}
