'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { menProducts } from '@/data/products';
import { useWishlist } from '@/context/WishlistContext';
import styles from './Men.module.css';

const EXCHANGE_RATE = 19500;
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

function MenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSub = searchParams.get('sub') || 'all';

  const { toggleWishlist, isInWishlist } = useWishlist();

  // Active category filter state
  const [activeTab, setActiveTab] = useState(initialSub);
  
  // Selected brands filter state
  const [selectedBrands, setSelectedBrands] = useState([]);

  // Sorting state
  const [sortOption, setSortOption] = useState('');

  // Sync state if URL search query changes
  useEffect(() => {
    setActiveTab(initialSub);
  }, [initialSub]);

  // Extract unique brands present in men catalog
  const availableBrands = Array.from(new Set(menProducts.map(p => p.brand)));

  // Toggle brand filtering selection
  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Filter products based on subcategory & brands
  const filteredProducts = menProducts.filter(product => {
    const matchesTab = activeTab === 'all' || product.category === activeTab;
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    return matchesTab && matchesBrand;
  });

  // Sort products based on sort select option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const origPriceA = a.priceAed * EXCHANGE_RATE;
    const salePriceA = a.discountPercent && a.discountPercent > 0 
      ? origPriceA * (1 - a.discountPercent / 100) 
      : origPriceA;

    const origPriceB = b.priceAed * EXCHANGE_RATE;
    const salePriceB = b.discountPercent && b.discountPercent > 0 
      ? origPriceB * (1 - b.discountPercent / 100) 
      : origPriceB;

    if (sortOption === 'price_asc') {
      return salePriceA - salePriceB; // price low-to-high
    }
    if (sortOption === 'price_desc') {
      return salePriceB - salePriceA; // price high-to-low
    }
    if (sortOption === 'newest') {
      return b.id.localeCompare(a.id); // newest products first
    }
    return 0;
  });

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContainer} dir="rtl">
        {/* Category Header */}
        <div className={styles.heroSection}>
          <h1 className={styles.title}>مجموعه مردانه دبی خرید</h1>
          <p className={styles.subtitle}>خرید مستقیم لباس، شلوار، کفش و اکسسوری اصل برندهای جهانی از دبی با ارسال سریع</p>
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
            
            {/* Category tabs and Sorting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
              <div className={styles.tabs} style={{ marginBottom: 0, flex: 1 }}>
                <button 
                  className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  همه محصولات
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'clothing' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('clothing')}
                >
                  لباس
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'pants' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('pants')}
                >
                  شلوار
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'shoes' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('shoes')}
                >
                  کفش
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'accessories' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('accessories')}
                >
                  اکسسوری
                </button>
              </div>

              <div>
                <select 
                  className={styles.sortSelect}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  dir="rtl"
                >
                  <option value="" disabled style={{ color: '#8b92a5' }}>مرتب‌سازی بر اساس...</option>
                  <option value="newest">جدیدترین‌ها</option>
                  <option value="price_asc">قیمت: از کم به زیاد</option>
                  <option value="price_desc">قیمت: از زیاد به کم</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            {sortedProducts.length === 0 ? (
              <div className={styles.noProducts}>
                <div className={styles.noProductsIcon}>🧥</div>
                <p>هیچ محصولی با فیلترهای انتخاب شده یافت نشد.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {sortedProducts.map(product => {
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
                        {product.discountPercent && product.discountPercent > 0 && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#ff3333', color: '#fff', fontSize: '11px', fontWeight: '850', padding: '3px 8px', borderRadius: '4px', boxShadow: '0 0 10px #ff3333', zIndex: 5, direction: 'ltr' }}>
                            {product.discountPercent}%-
                          </div>
                        )}
                        
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
                          {product.discountPercent && product.discountPercent > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', width: '100%' }}>
                              <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#8b92a5' }}>{fmtToman(tomanPrice)} تومان</span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <span className={styles.priceToman} style={{ color: '#ff3333' }}>{fmtToman(tomanPrice * (1 - product.discountPercent / 100))} تومان</span>
                                <span style={{ fontSize: '11px', color: '#ff3333', fontWeight: '600' }}>تحویل درب منزل</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className={styles.priceLabel}>تحویل درب منزل:</span>
                              <span className={styles.priceToman}>{fmtToman(tomanPrice)} تومان</span>
                            </>
                          )}
                        </div>

                        <button className={styles.cartBtn}>
                          مشاهده و انتخاب محصول
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

export default function MenPage() {
  return (
    <Suspense fallback={<div style={{padding: '100px', textAlign: 'center', color: '#fff'}}>در حال بارگذاری...</div>}>
      <MenContent />
    </Suspense>
  );
}
