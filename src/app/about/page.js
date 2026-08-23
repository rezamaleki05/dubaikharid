import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { absoluteUrl, breadcrumbSchema, publicPageMetadata, SITE_NAME } from '@/lib/seo';
import styles from '../buy-from-dubai/BuyFromDubai.module.css';

export const metadata = publicPageMetadata({
  title: 'درباره دبی خرید',
  description: 'دبی خرید چیست و فرایند ثبت درخواست خرید از فروشگاه‌های دبی و امارات و ارسال کالا به ایران چگونه مدیریت می‌شود؟',
  path: '/about',
});

export default function AboutPage() {
  const crumbs = [{ name: 'صفحه اصلی', path: '/' }, { name: 'درباره دبی خرید', path: '/about' }];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'درباره دبی خرید',
    url: absoluteUrl('/about'),
    about: { '@id': `${absoluteUrl('/') }#organization`, name: SITE_NAME },
    inLanguage: 'fa-IR',
  };
  return <div className={styles.page}>
    <JsonLd data={[breadcrumbSchema(crumbs), schema]} />
    <Header />
    <main className={styles.main}>
      <Breadcrumbs items={crumbs} />
      <section className={styles.hero}>
        <p className={styles.eyebrow}>DubaiKharid</p>
        <h1>درباره دبی خرید</h1>
        <p>دبی خرید یک سرویس فارسی‌زبان مستقل است که ثبت درخواست خرید کالا از فروشگاه‌های دبی و امارات، برآورد هزینه و هماهنگی ارسال سفارش به ایران را برای کاربران انجام می‌دهد.</p>
      </section>
      <section className={styles.section}>
        <h2>نقش دبی خرید در سفارش چیست؟</h2>
        <p>کاربر لینک مستقیم محصول و گزینه‌های موردنظر را ارسال می‌کند. اطلاعات کالا، موجودی، قیمت به درهم و وزن قابل بررسی هستند و مبلغ نهایی تنها پس از تأیید داده‌های معتبر مشخص می‌شود. دبی خرید مالک یا نماینده فروشگاه‌ها و برندهای مبدأ نیست.</p>
        <h2>شفافیت قیمت و وضعیت سفارش</h2>
        <p>برآورد اولیه از قیمت کالا، نرخ ثبت‌شده درهم، کارمزد و هزینه حمل تشکیل می‌شود. سفارش‌های دیتابیسی با قیمت و موجودی سمت سرور کنترل می‌شوند و درخواست‌های خرید خارجی تا زمان بررسی کارشناس در وضعیت برآورد باقی می‌مانند.</p>
        <div className={styles.actions}><Link href="/buy-from-dubai" className={styles.secondary}>مطالعه راهنمای خرید از دبی</Link><Link href="/#calculator" className={styles.primary}>ثبت لینک محصول</Link></div>
      </section>
    </main>
    <Footer />
  </div>;
}
