import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import StockLaptopCatalog from '@/components/laptop/StockLaptopCatalog';
import { getPublicLaptopModelGroups } from '@/lib/publicLaptopSeo';
import { NOINDEX_METADATA, publicPageMetadata } from '@/lib/seo';
import styles from './StockLaptops.module.css';

const TITLE = 'لپ تاپ استوک | خرید و قیمت لپ تاپ استوک';
const DESCRIPTION = 'خرید لپ تاپ استوک Dell، HP و Lenovo با مشخصات کامل، قیمت به‌روز و بررسی وضعیت دستگاه. مدل‌های ورک‌استیشن، مهندسی و گرافیکی را در دبی خرید ببینید.';

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  const hasFilters = Object.values(query || {}).some(value => value !== undefined && value !== '');
  return publicPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: '/stock-laptops',
    ...(hasFilters ? NOINDEX_METADATA : {}),
  });
}

export default async function StockLaptopsPage() {
  let groups = [];
  let error = '';
  try {
    groups = await getPublicLaptopModelGroups();
  } catch (loadError) {
    console.error('Unable to load public Laptop model groups:', loadError);
    error = 'دریافت لپ‌تاپ‌ها با خطا مواجه شد.';
  }

  const strategicBrands = ['Dell', 'HP', 'Lenovo']
    .map(brand => ({
      brand,
      groups: groups.filter(group => group.brand.toLocaleLowerCase('en-US') === brand.toLocaleLowerCase('en-US')),
    }))
    .filter(section => section.groups.length > 0);

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.mainContainer} dir="rtl">
        <header className={styles.headerSection}>
          <h1 className={styles.title}>{TITLE}</h1>
          <p className={styles.subtitle}>
            خرید لپ تاپ استوک Dell، HP و Lenovo با مشخصات کامل، وضعیت دستگاه، قیمت به‌روز و امکان انتخاب مدل‌های ورک‌استیشن، مهندسی و گرافیکی.
          </p>
        </header>

        {error ? <div className={styles.statusMessage}>{error}</div> : null}
        {!error && groups.length === 0 ? <div className={styles.statusMessage}>در حال حاضر لپ‌تاپ موجودی ثبت نشده است.</div> : null}
        {!error && groups.length > 0 ? <StockLaptopCatalog groups={groups} /> : null}

        <section className={styles.seoContent} aria-labelledby="stock-laptop-guide">
          {strategicBrands.map(section => (
            <article key={section.brand} className={styles.seoSection}>
              <h2>لپ تاپ استوک {section.brand}</h2>
              <p>
                {section.groups.length.toLocaleString('fa-IR')} مدل موجود از {section.brand} را می‌توانید بر اساس مشخصات واقعی، وضعیت ظاهری و بازه قیمت مقایسه کنید.
              </p>
              <ul>{section.groups.map(group => <li key={group.slug}><Link href={`/laptops/${group.slug}`}>{group.name}</Link></li>)}</ul>
            </article>
          ))}
          <article className={styles.seoSection}>
            <h2 id="stock-laptop-guide">راهنمای خرید لپ تاپ استوک</h2>
            <p>
              پیش از انتخاب، پردازنده، رم، نوع حافظه، کارت گرافیک، نمایشگر و وضعیت هر دستگاه را بررسی کنید. هر صفحه مدل، واحدهای واقعاً موجود و تفاوت مشخصات و قیمت آن‌ها را یک‌جا نشان می‌دهد.
            </p>
            <p>برای کار مهندسی یا تدوین، ابتدا نیاز نرم‌افزار و نوع پروژه را مشخص کنید. نام ورک‌استیشن به‌تنهایی کافی نیست؛ مدل دقیق پردازنده و گرافیک، حافظه و نمایشگر همان واحد را بررسی کنید. نتیجه تستی که ثبت نشده، از نام خانواده دستگاه قابل استنتاج نیست.</p>
            <p>4K و لمسی بودن، ویژگی همه نسخه‌های یک مدل نیست. اگر وضعیت باتری، نمایشگر یا اقلام همراه درج نشده، پیش از خرید سؤال کنید؛ اطلاعات نامعلوم به معنی تأیید سلامت نیست.</p>
            <Link href="/guides/stock-laptop-checklist">برگه بررسی وضعیت، نمایشگر و مشخصات هر واحد ←</Link>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
