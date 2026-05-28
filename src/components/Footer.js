import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Top Section */}
      <div className={styles.footerTop}>
        <div className="container">
          <div className={styles.footerTopInner}>
            <div className={styles.aboutCol}>
              <div className={styles.logo}>
                <span className={styles.logoMain}>DUBI</span>
                <span className={styles.logoSub}>SHOP</span>
                <span className={styles.logoArrow}>▶</span>
              </div>
              <p className={styles.aboutText}>
                دبی شاپ به عنوان معتبرترین کارگزار خرید مستقیم از بازارهای بین‌المللی امارات و دبی، به شما امکان می‌دهد کالاهای اصل را از آمازون، نون، شین و... خریداری کرده و با کارگو اختصاصی هوایی با کمترین هزینه در ایران درب منزل دریافت کنید.
              </p>
              <div className={styles.socials}>
                <a href="#" aria-label="اینستاگرام">📸</a>
                <a href="#" aria-label="تلگرام">✈️</a>
                <a href="#" aria-label="واتساپ">💬</a>
                <a href="#" aria-label="توییتر">🐦</a>
              </div>
            </div>

            <div className={styles.linksGrid}>
              <div className={styles.linksCol}>
                <h4>راهنمای خرید</h4>
                <ul>
                  <li><a href="#">نحوه ثبت سفارش خرید دبی</a></li>
                  <li><a href="#">فرمول محاسبه قیمت و هزینه‌ها</a></li>
                  <li><a href="#">دسته‌بندی‌های مجاز باربری</a></li>
                  <li><a href="#">پرسش‌های متداول خریداران</a></li>
                </ul>
              </div>

              <div className={styles.linksCol}>
                <h4>قوانین و اطلاعات</h4>
                <ul>
                  <li><a href="#">شرایط و قوانین استفاده</a></li>
                  <li><a href="#">ضمانت سلامت فیزیکی کالا</a></li>
                  <li><a href="#">رویه مرجوعی کالا در دبی</a></li>
                  <li><a href="#">حریم خصوصی کاربران</a></li>
                </ul>
              </div>

              <div className={styles.linksCol}>
                <h4>تماس با دبی شاپ</h4>
                <p className={styles.contactItem}>
                  📍 <strong>دفتر تهران:</strong> تهران، خیابان ولیعصر، نرسیده به میدان ونک، برج نگار، طبقه ۱۵
                </p>
                <p className={styles.contactItem}>
                  📍 <strong>دفتر دبی:</strong> امارات، دبی، منطقه دیره، خیابان المکتوم، مجتمع البدور
                </p>
                <p className={styles.contactItem}>
                  📞 <strong>تلفن پشتیبانی:</strong> ۰۲۱-۹۱۰۰۰۰۰۰
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
              © ۱۴۰۵ تمامی حقوق مادی و معنوی این وب‌سایت متعلق به <strong>دبی شاپ (DUBI SHOP)</strong> می‌باشد.
            </p>
            <div className={styles.trustLogos}>
              <span className={styles.trustBadge}>🛡️ ضمانت اصالت</span>
              <span className={styles.trustBadge}>💳 درگاه شتاب</span>
              <span className={styles.trustBadge}>⚡ ارسال سریع</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
