import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getPublicCatalog } from '@/lib/publicCatalog';
import { getSeoStore } from '@/lib/publicSeoData';
import { breadcrumbSchema, publicPageMetadata } from '@/lib/seo';
import styles from '../../seo-collection.module.css';

const STORE_INTENTS = {
  amazon: { fa: 'آمازون امارات', title: 'خرید از آمازون امارات', common: 'کالاهای دیجیتال، لوازم خانه، پوشاک و محصولات روزمره' },
  noon: { fa: 'نون دبی', title: 'خرید از نون دبی', common: 'کالاهای دیجیتال، زیبایی، خانه، مد و محصولات چندمنظوره' },
  namshi: { fa: 'نمشی امارات', title: 'خرید از نمشی امارات', common: 'پوشاک، کفش، کیف و اکسسوری برندهای مختلف' },
  ounass: { fa: 'اُناس امارات', title: 'خرید از اُناس امارات', common: 'پوشاک و اکسسوری لوکس از برندهای بین‌المللی' },
  '6thstreet': { fa: 'سیکس استریت امارات', title: 'خرید از سیکس استریت امارات', common: 'پوشاک، کفش و اکسسوری زنانه، مردانه و کودک' },
  modanisa: { fa: 'مودانیسا', title: 'خرید از مودانیسا', common: 'پوشاک و اکسسوری بانوان' },
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const store = await getSeoStore(slug);
  if (!store) return { title: 'فروشگاه پیدا نشد', robots: { index: false, follow: false } };
  const intent = STORE_INTENTS[store.id] || { fa: store.name, title: `خرید از ${store.name}`, common: store.desc || 'کالاهای موجود در فروشگاه' };
  return publicPageMetadata({
    title: intent.title,
    description: `راهنمای ثبت سفارش از ${intent.fa} با دبی خرید؛ ارسال لینک محصول، برآورد قیمت به درهم و هماهنگی ارسال کالا از دبی به ایران.`,
    path: `/stores/${store.id}`,
    image: store.img || undefined,
  });
}

export default async function StorePage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const store = await getSeoStore(slug);
  if (!store) notFound();
  const requestedPage = /^\d+$/.test(query?.page || '') ? Number(query.page) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 1_000_000
    ? requestedPage
    : 1;
  const catalog = await getPublicCatalog({ store: store.id, page, limit: 24 });
  const intent = STORE_INTENTS[store.id] || { fa: store.name, title: `خرید از ${store.name}`, common: store.desc || 'کالاهای موجود در فروشگاه' };
  const crumbs = [{ name: 'صفحه اصلی', path: '/' }, { name: 'برندها و فروشگاه‌ها', path: '/brands' }, { name: intent.fa, path: `/stores/${store.id}` }];

  return (
    <div className={styles.page}>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <Header />
      <main className={styles.main}>
        <Breadcrumbs items={crumbs} />
        <header className={styles.header}>
          {store.img && <img src={store.img} alt={`لوگوی ${store.name}`} className={styles.logo} />}
          <div><p className={styles.eyebrow}>فروشگاه آنلاین امارات</p><h1>{intent.title}</h1></div>
        </header>
        <section className={styles.intro}>
          <h2>{store.name} چه فروشگاهی است؟</h2>
          <p>{store.desc || `${store.name} یکی از فروشگاه‌های آنلاین قابل بررسی برای ثبت سفارش کالا از امارات است.`} مشتریان معمولاً {intent.common} را در این فروشگاه بررسی می‌کنند.</p>
          <p>دبی خرید یک سرویس مستقل خرید و ارسال است و بخشی از {store.name} محسوب نمی‌شود. برای ثبت درخواست، صفحه دقیق محصول را در سایت مبدأ پیدا کنید و لینک آن را برای بررسی قیمت و موجودی بفرستید.</p>
        </section>
        <section className={styles.process}>
          <h2>نحوه سفارش از {intent.fa}</h2>
          <ol><li>محصول و گزینه‌های موردنظر را در صفحه فروشگاه انتخاب کنید.</li><li>لینک مستقیم محصول را کپی کنید.</li><li>لینک را در فرم استعلام وارد کنید تا برآورد اولیه محاسبه شود.</li><li>پس از بررسی قیمت، موجودی و وزن واقعی، ادامه سفارش هماهنگ می‌شود.</li></ol>
          <Link href="/#calculator" className={styles.cta}>ثبت سفارش از {intent.fa}</Link>
        </section>
        {catalog.data.length > 0 && <section className={styles.products}><h2>محصولات ثبت‌شده از {store.name}</h2><div className={styles.grid}>{catalog.data.map(product => <Link key={product.id} href={`/product/${product.id}`}><span>{product.name}</span></Link>)}</div>{catalog.pagination.totalPages > 1 && <nav aria-label="صفحه‌بندی محصولات" style={{display:'flex',justifyContent:'center',gap:'18px',marginTop:'24px'}}>{page > 1 && <Link href={`?page=${page - 1}`}>صفحه قبل</Link>}{page < catalog.pagination.totalPages && <Link href={`?page=${page + 1}`}>صفحه بعد</Link>}</nav>}</section>}
        <section className={styles.related}><Link href="/buy-from-dubai">راهنمای کامل خرید مستقیم از دبی</Link><Link href="/brands">مشاهده برندها و فروشگاه‌های دیگر</Link></section>
      </main>
      <Footer />
    </div>
  );
}
