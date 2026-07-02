import styles from './Hero.module.css';


export default function Hero() {
  return (
    <section className={styles.hero}>
      {/* Background image — do NOT change */}
      <div className={styles.bgImage}></div>
      {/* Gradient overlay — dark on right (RTL text side) */}
      <div className={styles.overlay}></div>

      <div className="container" style={{ position: 'relative', zIndex: 2, height: '100%' }}>
        <div className={styles.inner}>

          {/* TEXT BLOCK — right side in RTL */}
          <div className={styles.content}>

            {/* Breadcrumb tag */}
            <div className={styles.breadcrumb}>
              <span className={styles.breadDiamond}>♦</span>
              <span>خرید مستقیم از دبی | ارسال سریع به سراسر ایران</span>
            </div>

            {/* H1 */}
            <h1 className={styles.title}>
              خرید برندهای لوکس و اورجینال<br />
              <span className={styles.highlight}>مستقیم از دبی</span>
            </h1>

            {/* Description */}
            <p className={styles.desc}>
              خرید مستقیم پوشاک، کیف، کفش، عطر، موبایل و اکسسوری<br />
              از برندهای معتبر جهانی با تضمین اصالت، قیمت رقابتی و ارسال سریع به ایران.
            </p>

            {/* Buttons */}
            <div className={styles.btns}>
              <a href="#trending" className={styles.btnSecondary}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                مشاهده محصولات
              </a>
              <a href="#calculator" className={styles.btnPrimary}>
                شروع خرید
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              </a>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
              
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  {/* Shield */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f8a320" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <div className={styles.statText}>
                  <span className={styles.statNum}>۱۰۰٪</span>
                  <span className={styles.statLabel}>تضمین اصالت</span>
                </div>
              </div>

              <div className={styles.statDivider}></div>

              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  {/* Truck */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f8a320" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <div className={styles.statText}>
                  <span className={styles.statNum}>۱۰ تا ۱۵ روز</span>
                  <span className={styles.statLabel}>تحویل</span>
                </div>
              </div>

              <div className={styles.statDivider}></div>

              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  {/* Diamond */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f8a320" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div className={styles.statText}>
                  <span className={styles.statNum}>+۵۰۰</span>
                  <span className={styles.statLabel}>برند جهانی</span>
                </div>
              </div>
              
            </div>

          </div>
          {/* left side: intentionally blank – background image visible */}
          <div className={styles.spacer}></div>
        </div>
      </div>
    </section>
  );
}
