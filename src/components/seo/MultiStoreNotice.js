import Link from 'next/link';
import styles from './Guide.module.css';

export default function MultiStoreNotice() {
  return <section className={styles.answer} aria-label="خرید از فروشگاه‌های دیگر">
    <span className={styles.number} aria-hidden="true">↗</span>
    <div><h2>اگر محصول در فروشگاه دیگری باشد چه؟</h2>
      <p>دبی خرید به این فروشگاه محدود نیست. لینک دقیق محصول را از بسیاری از فروشگاه‌های آنلاین معتبر دبی و امارات می‌توانید برای بررسی بفرستید؛ امکان خرید به فروشنده، کالا، موجودی و شرایط حمل همان سفارش بستگی دارد.</p>
      <Link className={styles.cta} href="/buy-from-dubai#send-link">لینک محصول را برای بررسی خرید بفرستید ←</Link>
    </div>
  </section>;
}
