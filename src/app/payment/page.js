'use client';

import { useRouter } from 'next/navigation';
import styles from './Payment.module.css';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function PaymentGateway() {
  const router = useRouter();
  const { settings } = useSiteSettings();

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <img src={settings.siteLogoUrl} alt={settings.siteName} className={styles.shaparakLogo} style={{ filter: 'brightness(0) invert(1)' }} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
          <div className={styles.headerText}>
            <h1>پرداخت امن سفارش</h1>
            <span>{settings.siteName}</span>
          </div>
        </div>
      </header>

      <main className={styles.gatewayContainer}>
        <div className={styles.formCard} style={{ textAlign: 'center', padding: '48px 28px' }}>
          <h2 className={styles.formTitle}>درگاه پرداخت آنلاین در حال اتصال است</h2>
          <p style={{ color: '#596273', lineHeight: 2, margin: '24px auto', maxWidth: '520px' }}>
            برای حفظ امنیت اطلاعات بانکی، تا زمان اتصال رسمی درگاه هیچ شماره کارت، CVV2 یا رمز پویایی در این صفحه دریافت نمی‌شود. برای تکمیل سفارش با پشتیبانی تماس بگیرید.
          </p>
          <button type="button" onClick={() => router.push('/')} className={styles.payBtn} style={{ maxWidth: '280px', margin: '0 auto' }}>
            بازگشت به فروشگاه
          </button>
        </div>
      </main>
    </div>
  );
}
