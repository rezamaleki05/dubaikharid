import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, publicPageMetadata } from '@/lib/seo';
import styles from './BuyFromDubai.module.css';

export const metadata = publicPageMetadata({
  title: 'خرید مستقیم از دبی',
  description: 'راهنمای خرید مستقیم از دبی و امارات؛ از انتخاب کالا و ارسال لینک تا برآورد قیمت، ثبت درخواست و ارسال سفارش به ایران با دبی خرید.',
  path: '/buy-from-dubai',
});

const steps = [
  ['انتخاب کالا', 'کالا را در فروشگاه موردنظر امارات پیدا کنید و مشخصات، رنگ و سایز را بررسی کنید.'],
  ['ارسال لینک', 'لینک دقیق صفحه محصول را در فرم استعلام دبی خرید وارد کنید.'],
  ['بررسی و برآورد', 'سامانه بر اساس قیمت کالا، نرخ ثبت‌شده درهم، کارمزد و وزن قابل محاسبه، برآورد اولیه را نمایش می‌دهد.'],
  ['تأیید و پیگیری', 'درخواست ثبت می‌شود و پس از بررسی موجودی، وزن واقعی و قیمت معتبر، ادامه فرایند با شما هماهنگ خواهد شد.'],
];

const faqs = [
  { question: 'چگونه از دبی خرید کنیم؟', answer: 'محصول را در یک فروشگاه معتبر امارات انتخاب و لینک همان صفحه را برای دبی خرید ارسال می‌کنید. پس از ثبت اطلاعات، قیمت و موجودی معتبر بررسی می‌شود و نتیجه برای ادامه سفارش اعلام خواهد شد.' },
  { question: 'هزینه سفارش چگونه محاسبه می‌شود؟', answer: 'برآورد اولیه با قیمت کالا به درهم، نرخ درهم ثبت‌شده در سامانه، کارمزد و هزینه حمل متناسب با وزن محاسبه می‌شود. مبلغ نهایی پس از بررسی واقعی لینک، موجودی و وزن تأیید می‌شود.' },
  { question: 'از چه سایت‌هایی می‌توان سفارش داد؟', answer: 'امکان ثبت لینک از فروشگاه‌های شناخته‌شده امارات مانند Amazon.ae، Noon، Namshi و فروشگاه‌های رسمی برندها وجود دارد. پذیرش نهایی هر کالا به موجودی، اطلاعات صفحه و امکان ارسال آن بستگی دارد.' },
  { question: 'هزینه ارسال از دبی به ایران چگونه مشخص می‌شود؟', answer: 'هزینه حمل بر پایه وزن قابل محاسبه و تنظیمات معتبر سامانه برآورد می‌شود. اگر وزن واقعی یا شرایط کالا با اطلاعات اولیه متفاوت باشد، مبلغ نهایی پیش از ادامه فرایند اعلام می‌شود.' },
  { question: 'آیا می‌توان فقط لینک محصول را ارسال کرد؟', answer: 'بله. برای شروع کافی است لینک مستقیم محصول را در فرم استعلام وارد کنید. هرچه صفحه محصول و گزینه‌های انتخابی دقیق‌تر باشند، بررسی سریع‌تر و شفاف‌تر انجام می‌شود.' },
];

export default function BuyFromDubaiPage() {
  const crumbs = [{ name: 'صفحه اصلی', path: '/' }, { name: 'خرید مستقیم از دبی', path: '/buy-from-dubai' }];
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <div className={styles.page}>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema]} />
      <Header />
      <main className={styles.main}>
        <Breadcrumbs items={crumbs} />
        <section className={styles.hero}>
          <p className={styles.eyebrow}>راهنمای سفارش کالا از امارات</p>
          <h1>خرید مستقیم از دبی</h1>
          <p>دبی خرید یک سرویس فارسی‌زبان مستقل برای ثبت سفارش از فروشگاه‌های دبی و امارات و هماهنگی ارسال کالا به ایران است. دبی خرید نماینده یا مالک Amazon، Noon، Nike و سایر فروشگاه‌های مبدأ نیست.</p>
          <div className={styles.actions}>
            <Link href="/#calculator" className={styles.primary}>ارسال لینک و استعلام قیمت</Link>
            <Link href="/brands" className={styles.secondary}>مشاهده برندها و فروشگاه‌ها</Link>
          </div>
        </section>

        <section className={styles.section}>
          <h2>خرید مستقیم از دبی چگونه انجام می‌شود؟</h2>
          <p>فرایند با انتخاب کالا و ارسال لینک مستقیم آن آغاز می‌شود. قیمت نمایش‌داده‌شده در مرحله استعلام، برآورد است؛ موجودی، قیمت نهایی و وزن واقعی پیش از ادامه سفارش از سمت سرور و کارشناس بررسی می‌شوند.</p>
          <ol className={styles.steps}>
            {steps.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}
          </ol>
        </section>

        <section className={styles.split} id="stores">
          <div>
            <h2>از چه سایت‌هایی می‌توان خرید کرد؟</h2>
            <p>فروشگاه‌های چندمنظوره و سایت رسمی برندهای امارات، متداول‌ترین مبدأ سفارش هستند. هر صفحه زیر درباره نحوه ثبت سفارش همان فروشگاه توضیح مشخص ارائه می‌دهد.</p>
            <ul className={styles.links}>
              <li><Link href="/stores/amazon">خرید از آمازون امارات</Link></li>
              <li><Link href="/stores/noon">خرید از نون دبی</Link></li>
              <li><Link href="/stores/namshi">خرید از نمشی امارات</Link></li>
              <li><Link href="/brands/nike">مشاهده محصولات نایک</Link></li>
              <li><Link href="/brands/adidas">مشاهده محصولات آدیداس</Link></li>
              <li><Link href="/brands/shein">خرید محصولات شین</Link></li>
            </ul>
          </div>
          <div>
            <h2>نحوه محاسبه قیمت سفارش</h2>
            <p>سامانه برای برآورد سفارش، قیمت کالا به درهم، نرخ معتبر درهم، کارمزد خرید و هزینه حمل بر اساس وزن را در نظر می‌گیرد. مبلغ نهایی بدون بررسی دوباره قیمت، موجودی و وزن واقعی قطعی تلقی نمی‌شود.</p>
            <Link href="/#calculator" className={styles.textLink}>محاسبه برآورد قیمت خرید از دبی ←</Link>
          </div>
        </section>

        <section className={styles.section} id="shipping">
          <h2>هزینه ارسال از دبی به ایران</h2>
          <p>هزینه حمل به وزن قابل محاسبه و تنظیمات جاری سامانه وابسته است. به همین دلیل برای کالاهایی که وزن دقیق آن‌ها در صفحه فروشگاه مشخص نیست، نتیجه اولیه برآوردی است و پس از بررسی می‌تواند اصلاح شود.</p>
          <h2>چه کالاهایی قابل سفارش هستند؟</h2>
          <p>پوشاک، کفش، کیف، اکسسوری، محصولات زیبایی و بسیاری از کالاهای مصرفی یا الکترونیکی قابل بررسی هستند. امکان ثبت سفارش به موجودی فروشگاه، محدودیت‌های حمل و اطلاعات واقعی همان کالا بستگی دارد؛ ثبت لینک به‌تنهایی تضمین پذیرش نهایی نیست.</p>
          <div className={styles.categoryLinks}>
            <Link href="/men">محصولات مردانه</Link>
            <Link href="/women">محصولات زنانه</Link>
            <Link href="/bags-accessories">کیف و اکسسوری</Link>
            <Link href="/stock-laptops">لپ‌تاپ‌های استوک موجود</Link>
          </div>
        </section>

        <section className={styles.section} id="faq">
          <h2>سوالات متداول خرید از دبی</h2>
          <div className={styles.faqs}>
            {faqs.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </div>
        </section>

        <section className={styles.cta}>
          <h2>لینک محصول را آماده دارید؟</h2>
          <p>برای دریافت برآورد اولیه، لینک دقیق محصول و گزینه‌های موردنظر را در فرم ثبت کنید.</p>
          <Link href="/#calculator" className={styles.primary}>ثبت سفارش از دبی</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
