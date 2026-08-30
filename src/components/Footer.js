'use client';

import Link from 'next/link';
import MinimalIcon from '@/components/ui/MinimalIcon';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { trackWhatsAppClick } from '@/lib/analytics';
import styles from './Footer.module.css';

export default function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className={styles.footer}>
      {/* Top Section */}
      <div className={styles.footerTop}>
        <div className="container">
          <div className={styles.footerTopInner}>
            <div className={styles.aboutCol}>
              <div className={styles.logo}>
                <img src={settings.siteLogoUrl} alt={settings.siteName} className={styles.logoImg} />
              </div>
              <p className={styles.aboutText}>
                {settings.siteName} یک سرویس فارسی‌زبان مستقل برای ثبت درخواست خرید از فروشگاه‌های امارات، برآورد هزینه و هماهنگی ارسال کالا از دبی به ایران است.
              </p>
              <div className={styles.socials}>
                <a href={`https://instagram.com/${settings.instagramId?.replace('@', '')}`} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام"><MinimalIcon name="instagram" size={19} /></a>
                <a href={`https://t.me/${settings.telegramId?.replace('@', '')}`} target="_blank" rel="noopener noreferrer" aria-label="تلگرام"><MinimalIcon name="telegram" size={19} /></a>
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="واتساپ" onClick={() => trackWhatsAppClick('footer')}><MinimalIcon name="whatsapp" size={19} /></a>
              </div>
            </div>

            <div className={styles.linksGrid}>
              <div className={styles.linksCol}>
                <h4>راهنمای خرید</h4>
                <ul>
                  <li><Link href="/buy-from-dubai">نحوه ثبت سفارش خرید از دبی</Link></li>
                  <li><Link href="/tracking">پیگیری سفارش</Link></li>
                  <li><Link href="/#calculator">محاسبه برآورد قیمت سفارش</Link></li>
                  <li><Link href="/buy-from-dubai#shipping">توضیح هزینه ارسال از دبی</Link></li>
                  <li><Link href="/buy-from-dubai#faq">پرسش‌های متداول خریداران</Link></li>
                </ul>
              </div>

              <div className={styles.linksCol}>
                <h4>قوانین و اطلاعات</h4>
                <ul>
                  <li><Link href="/about">درباره دبی خرید</Link></li>
                  <li><Link href="/brands">برندها و فروشگاه‌های قابل بررسی</Link></li>
                  <li><Link href="/stock-laptops">لپ‌تاپ‌های استوک موجود</Link></li>
                  <li><Link href="/warehouse">کالاهای موجود و آماده ارسال</Link></li>
                  <li><Link href="/buy-from-dubai#stores">سفارش از سایت‌های امارات</Link></li>
                </ul>
              </div>

              <div className={styles.linksCol}>
                <h4>تماس با {settings.siteName}</h4>
                <p className={styles.contactItem}>
                  <MinimalIcon name="pin" size={16} /> <strong>دفتر ایران:</strong> {settings.iranAddress}
                </p>
                <p className={styles.contactItem}>
                  <MinimalIcon name="pin" size={16} /> <strong>دفتر دبی:</strong> {settings.dubaiAddress}
                </p>
                <p className={styles.contactItem}>
                  <MinimalIcon name="phone" size={16} /> <strong>تلفن پشتیبانی:</strong> {settings.supportPhone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className={styles.footerBottom}>
        <div className="container">
          <div className={styles.footerBottomInner}>
            <p className={styles.copyright}>
              © ۱۴۰۵ تمامی حقوق مادی و معنوی این وب‌سایت متعلق به <strong>{settings.siteName} (Dubaikharid.shop)</strong> می‌باشد.
              <Link href="/admin" className={styles.adminLink} title="ورود به پنل مدیریت"><MinimalIcon name="key" size={13} /> ورود ادمین</Link>
            </p>
            <div className={styles.trustLogos}>
              <span className={styles.trustBadge}><MinimalIcon name="shield" size={15} /> ضمانت اصالت</span>
              <span className={styles.trustBadge}><MinimalIcon name="creditCard" size={15} /> درگاه شتاب</span>
              <span className={styles.trustBadge}><MinimalIcon name="lightning" size={15} /> ارسال سریع</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
