'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './Brands.module.css';

// ── DATA ARRAYS ──
const steps = [
  { id: 1, title: '۱. انتخاب برند', desc: 'برند مورد نظر خود را انتخاب کنید', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
  { id: 2, title: '۲. ورود به سایت اصلی', desc: 'با کلیک روی لوگو یا دکمه ورود، وارد سایت رسمی امارات شوید', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> },
  { id: 3, title: '۳. انتخاب محصول', desc: 'لینک محصول را کپی کنید', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { id: 4, title: '۴. ارسال لینک محصول', desc: 'لینک محصول یا عکس از محصول انتخابی خود را برای ما ارسال کنید', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> }
];

const isAldoBrand = brand => String(brand.name || '').trim().toLowerCase() === 'aldo';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [stores, setStores] = useState([]);
  const [activeCat, setActiveCat] = useState('همه برندها');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/catalog/discovery?limit=100', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'دریافت برندها و فروشگاه‌ها با خطا مواجه شد.');
        setBrands(Array.isArray(payload.brands) ? payload.brands : []);
        setStores(Array.isArray(payload.stores) ? payload.stores : []);
      })
      .catch(error => {
        if (error.name !== 'AbortError') console.error('Error loading public brands and stores:', error);
      });
    return () => controller.abort();
  }, []);

  const categories = ['همه برندها', ...new Set(brands.flatMap(brand => [
    brand.cat,
    ...(Array.isArray(brand.categories) ? brand.categories.map(category => category.name) : []),
  ]).filter(Boolean))];

  const filteredBrands = brands.filter(brand => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      return (
        brand.name.toLowerCase().includes(query) || 
        String(brand.faName || '').includes(query) ||
        String(brand.cat || '').includes(query)
      );
    }
    return activeCat === 'همه/برندها'
      || activeCat === 'همه برندها'
      || brand.cat === activeCat
      || brand.categories?.some(category => category.name === activeCat);
  });

  const sortedBrands = [...filteredBrands].sort((a, b) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const aNameMatch = a.name.toLowerCase().startsWith(q) || String(a.faName || '').includes(q);
      const bNameMatch = b.name.toLowerCase().startsWith(q) || String(b.faName || '').includes(q);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
    }

    if (sortOption === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    if (sortOption === 'newest') {
      return b.id.localeCompare(a.id);
    }
    return 0;
  });

  return (
    <div className={styles.pageWrapper}>
      <Header />

      {/* ── HERO SECTION ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>دسترسی به بهترین<br/>برندهای دنیا در <span style={{color: '#f87820'}}>دبی</span></h1>
          <p className={styles.heroSubtitle}>با یک کلیک وارد فروشگاه رسمی امارات شده و خرید خود را به راحتی ثبت کنید.</p>
          
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <svg className={styles.statIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div className={styles.statText}>
                <div className={styles.statValue}>100%</div>
                <div className={styles.statLabel}>لینک‌های رسمی</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <svg className={styles.statIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a5 5 0 0 1 10 0v2"/></svg>
              <div className={styles.statText}>
                <div className={styles.statValue}>{brands.length.toLocaleString('fa-IR')}+</div>
                <div className={styles.statLabel}>برند معتبر</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <svg className={styles.statIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <div className={styles.statText}>
                <div className={styles.statValue}>امن و مطمئن</div>
                <div className={styles.statLabel}>تضمین اصالت</div>
              </div>
            </div>
          </div>

          <form 
            className={styles.searchBox} 
            onSubmit={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 600, behavior: 'smooth' });
            }}
          >
            <input 
              type="text" 
              placeholder="جستجو بین برندها (فارسی یا انگلیسی)..." 
              className={styles.searchInput} 
              dir="rtl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer'}}>
              <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          </form>
        </div>
      </section>

      {/* ── HOW TO BUY STEPS ── */}
      <section className={styles.stepsSection}>
        <h2 className={styles.sectionTitle}>چطور از برند مورد نظر خرید کنم؟</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepArrow}>
            <span>←</span><span>←</span><span>←</span>
          </div>
          {steps.map(step => (
            <div key={step.id} className={styles.stepItem}>
              <div className={styles.stepIcon}>{step.icon}</div>
              <div className={styles.stepText}>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FILTERS ── */}
      <section className={styles.filtersSection}>
        <div className={styles.filtersList}>
          <button 
            className={`${styles.filterBtn} ${activeCat === 'همه برندها' ? styles.active : ''}`}
            onClick={() => setActiveCat('همه برندها')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            همه برندها
          </button>
          {categories.slice(1).map(cat => (
            <button 
              key={cat} 
              className={`${styles.filterBtn} ${activeCat === cat ? styles.active : ''}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── BRANDS GRID ── */}
      <section className={styles.mainContainer}>
        <div className={styles.brandsHeader}>
          <div className={styles.brandsCount}>{activeCat} <span>({sortedBrands.length})</span></div>
          <select 
            className={styles.sortSelect} 
            dir="rtl"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="" disabled style={{ color: '#8b92a5' }}>مرتب‌سازی بر اساس...</option>
            <option value="popular">محبوب‌ترین</option>
            <option value="newest">جدیدترین</option>
            <option value="alphabetical">حروف الفبا</option>
          </select>
        </div>

        <div className={`${styles.grid} ${styles.brandGrid}`}>
          {sortedBrands.map(brand => (
            <div key={brand.id} className={`${styles.card} ${styles.brandCard}`}>
              <div className={styles.logoWrap}>
                {brand.hasImage ? (
                  <>
                    <img
                      src={brand.img}
                      alt={brand.name}
                      className={`${styles.logoImg} ${isAldoBrand(brand) ? styles.originalAldoLogo : ''}`}
                    />
                    {isAldoBrand(brand) ? (
                      <span
                        className={styles.lightAldoLogo}
                        role="img"
                        aria-label={brand.name}
                      />
                    ) : null}
                  </>
                ) : (
                  <div className={styles.logoFallback}>{brand.fallback}</div>
                )}
              </div>
              <h3 className={styles.brandName}>{brand.name}</h3>
              {/* Display Farsi brand subtitle */}
              <p className={styles.brandFaName}>{brand.faName}</p>
              <p className={styles.brandCategory}>{brand.cat}</p>
              <a 
                href={brand.url || `/brands/${brand.id}`}
                className={`${styles.linkBtn} ${brand.url ? '' : styles.internalBrandLink}`}
                {...(brand.url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                ورود به سایت رسمی
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          ))}
        </div>

        {/* ── ONLINE STORES ── */}
        <h2 className={styles.sectionTitle} style={{textAlign: 'right', fontSize: '1.2rem', marginBottom: '20px', marginTop: '50px'}}>فروشگاه‌های آنلاین دبی</h2>
        <div className={styles.grid} style={{marginBottom: '40px'}}>
          {stores.map(store => (
            <div key={store.id} className={styles.card}>
              <div className={styles.logoWrap}>
                {store.hasImage ? (
                  <img src={store.img} alt={store.name} className={styles.logoImg} />
                ) : (
                  <div className={styles.logoFallback} style={{fontSize: '1.5rem'}}>{store.fallback}</div>
                )}
              </div>
              <h3 className={styles.brandName}>{store.name}</h3>
              <p className={styles.brandCategory} style={{minHeight: '36px'}}>{store.desc}</p>
              <p className={styles.brandCategory} style={{color: '#f87820', direction: 'ltr'}}>{store.url ? store.url.replace('https://', '') : 'آدرس ثبت نشده'}</p>
              <a 
                href={store.url || `/stores/${store.id}`}
                className={styles.linkBtn}
                {...(store.url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                ورود به سایت امارات
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── SUPPORT FEATURES ── */}
      <section className={styles.supportSection}>
        <div className={styles.supportItem}>
          <div className={styles.supportIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div className={styles.supportText}>
            <h4>پشتیبانی اختصاصی</h4>
            <p>تیم ما در تمام مراحل خرید همراه شماست</p>
          </div>
        </div>
        <div className={styles.supportItem}>
          <div className={styles.supportIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a5 5 0 0 1 10 0v2"/></svg>
          </div>
          <div className={styles.supportText}>
            <h4>ارسال به دبی و ایران</h4>
            <p>امکان ارسال سریع با بهترین روش‌ها</p>
          </div>
        </div>
        <div className={styles.supportItem}>
          <div className={styles.supportIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className={styles.supportText}>
            <h4>خرید امن و مطمئن</h4>
            <p>اطلاعات شما محفوظ است</p>
          </div>
        </div>
        <div className={styles.supportItem}>
          <div className={styles.supportIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </div>
          <div className={styles.supportText}>
            <h4>لینک‌های رسمی و معتبر</h4>
            <p>تمامی لینک‌ها از سایت‌های رسمی</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
