'use client';
import { useSiteSettings, getProductTomanPrice } from '@/context/SiteSettingsContext';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trendingProducts, getAllProducts } from '@/data/products';
import { useWishlist } from '@/context/WishlistContext';
import styles from '../men/Men.module.css';

// Replaced hardcoded exchange rate
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

function BestSellersContent() {
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSiteSettings();

  // Sorting state
  const [sortOption, setSortOption] = useState('');
  const [bestSellersList, setBestSellersList] = useState([]);

  useEffect(() => {
    let merged = getAllProducts();
    
    // 1. Filter out deleted static laptops
    try {
      const deletedSaved = localStorage.getItem('dubaiKharidDeletedStaticLaptops');
      if (deletedSaved) {
        const deletedIds = JSON.parse(deletedSaved);
        merged = merged.filter(p => !deletedIds.includes(p.id));
      }
    } catch (e) {
      console.error('Error loading deleted static laptops:', e);
    }

    // 2. Load dynamic uploads & apply overrides
    try {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      if (saved) {
        const uploaded = JSON.parse(saved);
        uploaded.forEach(p => {
          const index = merged.findIndex(m => m.id === p.id);
          if (index !== -1) {
            merged[index] = p; // Apply edit override
          } else {
            merged.unshift(p); // Prepend new upload
          }
        });
      }
    } catch (e) {
      console.error('Error merging uploaded products for best sellers:', e);
    }

    // 3. Load actually sold products from orders/leads
    let soldProductNames = [];
    try {
      const leadsSaved = localStorage.getItem('dubaiKharidLeads');
      if (leadsSaved) {
        const leads = JSON.parse(leadsSaved);
        soldProductNames = leads.map(l => l.productName?.toLowerCase().trim()).filter(Boolean);
      }
    } catch (e) {
      console.error('Error loading sold products for best sellers:', e);
    }

    // 4. Load actually searched queries
    let searchHistory = [];
    try {
      const historySaved = localStorage.getItem('dubaiKharidSearchHistory');
      if (historySaved) {
        searchHistory = JSON.parse(historySaved).filter(Boolean);
      }
    } catch (e) {
      console.error('Error loading search history for best sellers:', e);
    }

    const filteredBest = merged.filter((p, index, self) => {
      // Condition A: marked as best seller or trending manually
      const isManualBest = p.isBestSeller === true || trendingProducts.some(t => t.id === p.id);
      
      // Condition B: matches actually sold order names
      const isSold = soldProductNames.some(name => 
        p.name.toLowerCase().includes(name) || name.includes(p.name.toLowerCase())
      );
      
      // Condition C: matches searched queries
      const isSearched = searchHistory.some(query => 
        p.name.toLowerCase().includes(query) || 
        p.brand.toLowerCase().includes(query) || 
        (p.category && p.category.toLowerCase().includes(query))
      );

      const matchesAny = isManualBest || isSold || isSearched;
      const isUnique = self.findIndex(t => t.id === p.id) === index;
      
      return matchesAny && isUnique;
    });

    setBestSellersList(filteredBest);
  }, []);

  // Extract unique brands present in best sellers list
  const availableBrands = Array.from(new Set(bestSellersList.map(p => p.brand)));

  // Selected brands filter state
  const [selectedBrands, setSelectedBrands] = useState([]);

  // Toggle brand filtering selection
  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Filter products based on selected brands
  const filteredProducts = bestSellersList.filter(product => {
    return selectedBrands.length === 0 || selectedBrands.includes(product.brand);
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
      return salePriceA - salePriceB; // price low-to-high
    }
    if (sortOption === 'price_desc') {
      return salePriceB - salePriceA; // price high-to-low
    }
    if (sortOption === 'newest') {
      return b.id.localeCompare(a.id); // newest first
    }
    return 0;
  });

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContainer} dir="rtl">
        {/* Page Header */}
        <div className={styles.heroSection}>
          <h1 className={styles.title}>محصولات پرفروش و محبوب دبی خرید</h1>
          <p className={styles.subtitle}>محبوب‌ترین کالاهایی که خریداران مستقیماً از بازارهای دبی سفارش داده‌اند با تضمین بهترین قیمت و کیفیت</p>
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
            
            {/* Sorting controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
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
                <div className={styles.noProductsIcon}>🔥</div>
                <p>هیچ محصولی با فیلترهای انتخاب شده یافت نشد.</p>
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

export default function BestSellersPage() {
  const { settings } = useSiteSettings();
  return (
    <Suspense fallback={<div style={{padding: '100px', textAlign: 'center', color: '#fff'}}>در حال بارگذاری...</div>}>
      <BestSellersContent />
    </Suspense>
  );
}
