import Link from 'next/link';
import styles from './Guide.module.css';

export default function ShoeSizingWorkflow() {
  return <section id="size-reference" className={styles.evidence}>
    <p className={styles.reviewDate}>مرجع انتخاب · بازبینی منابع: <time dateTime="2026-10-25">۳ آبان ۱۴۰۵</time></p>
    <h2>از اندازه پا تا انتخاب در صفحه مبدأ</h2>
    <p><strong>طول هر دو پا، گروه سایز و جدول همان مدل را کنار هم قرار دهید.</strong> EU، US و UK سه برچسب متفاوت‌اند؛ عدد یکسان یا سایز معمول شما، تبدیل ثابت میان برندها را ثابت نمی‌کند.</p>
    <figure className={styles.sizeFigure}>
      <svg viewBox="0 0 520 250" role="img" aria-labelledby="foot-measure-title foot-measure-desc" className={styles.sizeDiagram}>
        <title id="foot-measure-title">طرح آموزشی اندازه‌گیری فاصله پاشنه تا بلندترین انگشت</title>
        <desc id="foot-measure-desc">نمای شماتیک یک پا روی کاغذ؛ دو خط راهنما مرز پاشنه و بلندترین انگشت را نشان می‌دهند. خط اندازه میان این دو مرز است. طرح مقیاس واقعی و جدول تبدیل سایز نیست.</desc>
        <rect x="20" y="20" width="480" height="210" rx="2" fill="none" stroke="currentColor" opacity=".25" />
        <path d="M120 161 C88 163 82 129 108 112 C133 98 172 106 203 92 C233 78 262 54 289 59 C304 41 322 46 327 62 C346 50 359 60 359 77 C382 70 393 85 386 99 C410 101 411 124 395 133 C393 153 372 163 348 166 C297 174 264 149 225 153 C186 158 156 168 120 161Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M88 45V200 M410 45V200 M88 197H410 M88 197l10 -7 M88 197l10 7 M410 197l-10 -7 M410 197l-10 7" fill="none" stroke="var(--accent)" strokeWidth="2" />
      </svg>
      <figcaption>طرح اصلی دبی خرید: فاصله پاشنه تا بلندترین انگشت؛ بدون مقیاس واقعی یا پیشنهاد سایز. برای اندازه‌گیری، روش راهنمای سازنده را دنبال کنید.</figcaption>
    </figure>
    <ol className={styles.workflow}>
      <li><strong>اندازه را ثبت کنید.</strong> روی سطح صاف، طول هر دو پا را طبق روش سازنده اندازه بگیرید و واحد را بنویسید. اگر دو اندازه متفاوت‌اند، توصیه همان راهنما برای انتخاب را بخوانید.</li>
      <li><strong>جدول درست را باز کنید.</strong> راهنمای همان محصول را با گروه مردانه، زنانه، کودک یا یونیسکس تطبیق دهید؛ برای عرض و قالب نیز توضیح همان مدل را بررسی کنید.</li>
      <li><strong>برچسب را عیناً منتقل کنید.</strong> استاندارد EU یا US یا UK، گروه، نام مدل، کد رنگ و اندازه انتخابی را کنار لینک بفرستید. طول پا را با عدد درج‌شده روی جعبه به‌جای یکدیگر به کار نبرید.</li>
      <li><strong>ابهام را پیش از خرید روشن کنید.</strong> موجودی رنگ و سایز و شرایط بازگشت همان سفارش جداگانه بررسی می‌شوند؛ جدول اندازه تضمین تناسب یا تعویض رایگان نیست.</li>
    </ol>
    <p>نمونه صرفاً آموزشی: اگر اندازه‌های ثبت‌شده دو پا «۲۵٫۱ سانتی‌متر» و «۲۵٫۴ سانتی‌متر» باشند، هر دو عدد و واحد را یادداشت کنید و راهنمای همان مدل را بررسی کنید. از این دو عدد به‌تنهایی نمی‌توان یک سایز EU، US یا UK قطعی پیشنهاد کرد؛ این نمونه، اندازه مشتری یا نتیجه آزمایش نیست.</p>
    <h3>مراجع رسمی؛ جدول مرتبط با انتخاب خودتان را پیدا کنید</h3>
    <p>راهنمای آدیداس گروه‌ها و استانداردهای متفاوت دارد؛ راهنمای نایکی نیز گروه‌های مردانه، زنانه، یونیسکس و کودک را جدا می‌کند. اگر صفحه کالا توضیح خاصی دارد، آن را همراه جدول بخوانید.</p>
    <ul className={styles.sourceLinks}>
      <li><a href="https://www.adidas.ae/en/size-chart-men-shoes.html" rel="noopener noreferrer" target="_blank">راهنمای رسمی اندازه کفش آدیداس امارات</a></li>
      <li><a href="https://www.nike.com/size-fit/mens-footwear" rel="noopener noreferrer" target="_blank">راهنمای رسمی سایز نایکی و انتخاب گروه</a></li>
    </ul>
    <nav className={styles.evidenceLinks} aria-label="انتخاب منبع کفش">
      <Link href="/brands/adidas">بررسی لینک آدیداس</Link><Link href="/brands/nike">بررسی کد مدل نایکی</Link><Link href="/stores/namshi">انتخاب سایز در نمشی</Link><Link href="/buy-from-dubai#cost-methodology">روش برآورد هزینه سفارش</Link>
    </nav>
  </section>;
}
