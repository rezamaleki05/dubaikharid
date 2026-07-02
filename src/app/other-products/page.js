'use client';

import { useSiteSettings, getProductTomanPrice } from '@/context/SiteSettingsContext';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAllProducts } from '@/data/products';
import { useWishlist } from '@/context/WishlistContext';
import styles from '../men/Men.module.css';

// Formatting utilities
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

function OtherProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSub = searchParams.get('sub') || 'all';

  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSiteSettings();

  // Active tab state
  const [activeTab, setActiveTab] = useState(initialSub);
  
  // Selected brands filter state
  const [selectedBrands, setSelectedBrands] = useState([]);

  // Sorting state
  const [sortOption, setSortOption] = useState('');

  // Local state for all products to react to localStorage changes
  const [allProducts, setAllProducts] = useState([]);

  // Sync state if URL sub parameter changes
  useEffect(() => {
    setActiveTab(initialSub);
  }, [initialSub]);

  // Load and merge products
  useEffect(() => {
    let merged = getAllProducts();
    try {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      if (saved) {
        const uploaded = JSON.parse(saved);
        uploaded.forEach(p => {
          if (!merged.some(m => m.id === p.id)) {
            merged.unshift(p);
          }
        });
      }
    } catch (e) {
      console.error('Error loading uploaded products:', e);
    }
    setAllProducts(merged);
  }, []);

  // Filter out laptops, men/women/kids fashion, and bags/accessories
  const otherProducts = allProducts.filter(product => {
    // Exclude laptops
    if (product.id && (product.id.startsWith('lap') || product.product_type === 'stock_laptop')) {
      return false;
    }
    // Also check name fallback for laptops
    const nameLower = (product.name || '').toLowerCase();
    if (nameLower.includes('laptop') || nameLower.includes('macbook') || nameLower.includes('thinkpad') || nameLower.includes('spectre') || nameLower.includes('zephyrus')) {
      return false;
    }

    const isMen = product.gender === 'men';
    const isWomen = product.gender === 'women';
    const isKids = product.gender === 'kids';
    const isBagsAcc = product.category === 'bags' || product.category === 'accessories' || product.category === 'watches_glasses' || product.category === 'wallets_belts';

    return !isMen && !isWomen && !isKids && !isBagsAcc;
  });

  // Extract unique brands present in other products catalog
  const availableBrands = Array.from(new Set(otherProducts.map(p => p.brand).filter(Boolean)));

  // Toggle brand filtering selection
  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Filter products based on subcategory tab & brands selection
  const filteredProducts = otherProducts.filter(product => {
    const categoryLower = (product.category || '').toLowerCase();
    
    let matchesTab = true;
    if (activeTab === 'phones') {
      matchesTab = categoryLower === 'electronics' || categoryLower === 'mobile' || categoryLower === 'phone' || categoryLower.includes('گوشی') || categoryLower.includes('تبلت');
    } else if (activeTab === 'beauty') {
      matchesTab = categoryLower === 'beauty' || categoryLower === 'perfume' || categoryLower.includes('عطر') || categoryLower.includes('آرایشی');
    } else if (activeTab === 'health') {
      matchesTab = categoryLower === 'health' || categoryLower === 'pills' || categoryLower === 'supplement' || categoryLower === 'pharmacy' || categoryLower.includes('مکمل') || categoryLower.includes('قرص') || categoryLower.includes('بهداشتی');
    } else if (activeTab === 'others') {
      const isPhone = categoryLower === 'electronics' || categoryLower === 'mobile' || categoryLower === 'phone' || categoryLower.includes('گوشی') || categoryLower.includes('تبلت');
      const isBeauty = categoryLower === 'beauty' || categoryLower === 'perfume' || categoryLower.includes('عطر') || categoryLower.includes('آرایشی');
      const isHealth = categoryLower === 'health' || categoryLower === 'pills' || categoryLower === 'supplement' || categoryLower === 'pharmacy' || categoryLower.includes('مکمل') || categoryLower.includes('قرص') || categoryLower.includes('بهداشتی');
      matchesTab = !isPhone && !isBeauty && !isHealth;
    }

    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    return matchesTab && matchesBrand;
  });

  // Sort products based on sort select option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const origPriceA = getProductTomanPrice(a, settings);
    const salePriceA = a.discountPercent && a.discountPercent > 0 
      ? origPriceA * (1 - a.discountPercent / 100) 
      : origPriceA;

    const origPriceB = getProductTomanPrice(b, settings);
    const salePriceB = b.discountPercent && b.discountPercent > 0 
      ? origPriceB * (1 - b.discountPercent / 100) 
      : origPriceB;

    if (sortOption === 'price_asc') {
      return salePriceA - salePriceB;
    }
    if (sortOption === 'price_desc') {
      return salePriceB - salePriceA;
    }
    if (sortOption === 'newest') {
      return b.id.localeCompare(a.id);
    }
    return 0;
  });

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContainer} dir="rtl">
        {/* Category Header */}
        <div className={styles.heroSection}>
          <h1 className={styles.title}>سایر محصولات دبی خرید</h1>
          <p className={styles.subtitle}>خرید مستقیم انواع کالاها شامل گوشی موبایل، عطر و ادکلن، مکمل و قرص، لوازم الکترونیکی و سایر کالاهای خاص از دبی</p>
        </div>

        <div className={styles.contentLayout}>
          
          {/* Sidebar - Brand Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterBlock}>
              <h3 className={styles.filterTitle}>فیلتر بر اساس برندها</h3>
              {availableBrands.length === 0 ? (
                <p style={{ fontSize: '11px', color: '#8b92a5', padding: '10px 0' }}>برندی یافت نشد.</p>
              ) : (
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
              )}
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
                  className={`${styles.tab} ${activeTab === 'phones' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('phones')}
                >
                  گوشی و دیجیتال
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'beauty' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('beauty')}
                >
                  عطر و ادکلن
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'health' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('health')}
                >
                  مکمل و قرص‌ها
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'others' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('others')}
                >
                  سایر موارد
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
                <div className={styles.noProductsIcon}>📦</div>
                <p>هیچ محصولی در این دسته فیلتر یافت نشد.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {sortedProducts.map(product => {
                  const tomanPrice = getProductTomanPrice(product, settings);
                  return (
                    <div 
                      key={product.id} 
                      className={styles.productCard}
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      <div className={styles.imageWrap}>
                        <img src={product.image} alt={product.name} className={styles.productImg} />
                        <span className={styles.storeBadge}>{product.store || 'خرید مستقیم'}</span>
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
                          {tomanPrice > 0 ? (
                            product.discountPercent && product.discountPercent > 0 ? (
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
                            )
                          ) : (
                            <span className={styles.priceToman} style={{ color: '#ff9d00', fontSize: '12px' }}>استعلام قیمت (سفارشی دبی)</span>
                          )}
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

export default function OtherProductsPage() {
  return (
    <Suspense fallback={<div style={{padding: '100px', textAlign: 'center', color: '#fff'}}>در حال بارگذاری...</div>}>
      <OtherProductsContent />
    </Suspense>
  );
}
