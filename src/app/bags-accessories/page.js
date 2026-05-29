'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { bagsAndAccessoriesProducts } from '@/data/products';
import { useWishlist } from '@/context/WishlistContext';
import styles from '../men/Men.module.css';

const EXCHANGE_RATE = 19500;
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

function BagsAccessoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSub = searchParams.get('sub') || 'all';

  const { toggleWishlist, isInWishlist } = useWishlist();

  // Active subcategory tab
  const [activeTab, setActiveTab] = useState(initialSub);
  
  // Selected brands filter state
  const [selectedBrands, setSelectedBrands] = useState([]);

  // Sync state if URL sub parameter changes
  useEffect(() => {
    setActiveTab(initialSub);
  }, [initialSub]);

  // Extract unique brands present in bags and accessories catalog
  const availableBrands = Array.from(new Set(bagsAndAccessoriesProducts.map(p => p.brand)));

  // Toggle brand filtering selection
  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Filter products based on subcategory tab & brands selection
  const filteredProducts = bagsAndAccessoriesProducts.filter(product => {
    const matchesTab = activeTab === 'all' || product.category === activeTab;
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    return matchesTab && matchesBrand;
  });

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContainer} dir="rtl">
        {/* Category Header */}
        <div className={styles.heroSection}>
          <h1 className={styles.title}>مجموعه کیف و اکسسوری دبی خرید</h1>
          <p className={styles.subtitle}>خرید مستقیم کیف‌های دستی لوکس، عینک‌های برند، ساعت‌های مچی و کیف پول اصل از بازارهای دبی</p>
        </div>

        <div className={styles.contentLayout}>
          
          {/* Sidebar - Brand Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterBlock}>
              <h3 className={styles.filterTitle}>فیلتر بر اساس برندها</h3>
              <div className={styles.brandList}>
                {availableBrands.map((brand, idx) => (
                  <label key={idx} className={styles.brandItem}>
                    <input 
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Catalog Grid Section */}
          <section className={styles.gridSection}>
            
            {/* Category tabs */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('all')}
              >
                همه اکسسوری‌ها
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'bags' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('bags')}
              >
                کیف و کوله‌پشتی
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'watches_glasses' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('watches_glasses')}
              >
                عینک و ساعت مچی
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'wallets_belts' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('wallets_belts')}
              >
                کیف پول و کمربند
              </button>
            </div>

            {/* Catalog Grid */}
            {filteredProducts.length === 0 ? (
              <div className={styles.noProducts}>
                <div className={styles.noProductsIcon}>💼</div>
                <p>هیچ اکسسوری با فیلترهای انتخاب شده یافت نشد.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredProducts.map(product => {
                  const tomanPrice = product.priceAed * EXCHANGE_RATE;
                  return (
                    <div 
                      key={product.id} 
                      className={styles.productCard}
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      <div className={styles.imageWrap}>
                        <img src={product.image} alt={product.name} className={styles.productImg} />
                        <span className={styles.storeBadge}>{product.store}</span>
                        
                        {/* Wishlist Button */}
                        <button 
                          className={`${styles.wishlistBtn} ${isInWishlist(product.id) ? styles.wished : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          aria-label="افزودن به علاقه‌مندی‌ها"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? "#ff4757" : "none"} stroke={isInWishlist(product.id) ? "#ff4757" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                          </svg>
                        </button>
                      </div>

                      <div className={styles.cardBody}>
                        <span className={styles.brandBadge}>{product.brand}</span>
                        <h3 className={styles.productName}>{product.name}</h3>
                        <p className={styles.productSpec}>{product.spec}</p>
                        
                        <div className={styles.priceRow}>
                          <span className={styles.priceLabel}>تحویل درب منزل:</span>
                          <span className={styles.priceToman}>{fmtToman(tomanPrice)} تومان</span>
                        </div>

                        <button className={styles.cartBtn}>
                          مشاهده و خرید محصول
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function BagsAccessoriesPage() {
  return (
    <Suspense fallback={<div style={{padding: '100px', textAlign: 'center', color: '#fff'}}>در حال بارگذاری...</div>}>
      <BagsAccessoriesContent />
    </Suspense>
  );
}
