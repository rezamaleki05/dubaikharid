'use client';
import { useSiteSettings, getProductTomanPrice } from '@/context/SiteSettingsContext';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CatalogPagination from '@/components/CatalogPagination';
import MinimalIcon from '@/components/ui/MinimalIcon';
import { usePublicCatalog } from '@/hooks/usePublicCatalog';
import { useWishlist } from '@/context/WishlistContext';
import styles from './Sale.module.css';

// Replaced hardcoded exchange rate
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

function SaleContent() {
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSiteSettings();

  // Active category filter tab
  const [activeTab, setActiveTab] = useState('all');
  
  // Sort state
  const [sortOption, setSortOption] = useState(''); // '', 'discount', 'price_asc', 'price_desc'

  const {
    products: sortedProducts,
    pagination,
    setPage,
    loading,
    error,
  } = usePublicCatalog({
    scope: ['men', 'women', 'kids'].includes(activeTab) ? activeTab : 'all',
    category: activeTab === 'acc_tech' ? 'acc_tech' : 'all',
    sale: true,
    sort: sortOption || 'newest',
  });

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContainer} dir="rtl">
        {/* Category Header */}
        <div className={styles.heroSection}>
          <h1 className={styles.title}>تخفیف‌های شگفت‌انگیز دبی خرید</h1>
          <p className={styles.subtitle}>خرید مستقیم کالاهای تخفیف‌دار و حراجی‌های معتبر دبی (آمازون، نون و شین) با تضمین اصالت و بهترین قیمت</p>
        </div>

        {/* Controls Row */}
        <div className={styles.controlsRow}>
          
          {/* Category Tabs */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('all')}
            >
              همه تخفیف‌ها
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'men' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('men')}
            >
              مردانه
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'women' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('women')}
            >
              زنانه
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'kids' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('kids')}
            >
              بچگانه
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'acc_tech' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('acc_tech')}
            >
              اکسسوری و دیجیتال
            </button>
          </div>

          {/* Sort Menu */}
          <div className={styles.sortBox}>
            <select 
              className={styles.sortSelect} 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="" disabled style={{ color: '#8b92a5' }}>مرتب‌سازی بر اساس...</option>
              <option value="discount">بیشترین تخفیف</option>
              <option value="price_asc">قیمت: از کم به زیاد</option>
              <option value="price_desc">قیمت: از زیاد به کم</option>
            </select>
          </div>

        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className={styles.noProducts}><p>در حال دریافت محصولات تخفیف‌دار...</p></div>
        ) : error ? (
          <div className={styles.noProducts}><p>{error}</p></div>
        ) : sortedProducts.length === 0 ? (
          <div className={styles.noProducts}>
            <div className={styles.noProductsIcon}><MinimalIcon name="fire" size={50} weight="thin" /></div>
            <p>در حال حاضر هیچ کالای تخفیف‌داری در این دسته موجود نیست.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {sortedProducts.map(product => {
              const originalPriceToman = getProductTomanPrice(product, settings);
              const salePriceToman = originalPriceToman * (1 - product.discountPercent / 100);
              
              return (
                <div 
                  key={product.id} 
                  className={styles.productCard}
                  onClick={() => router.push(`/product/${product.id}`)}
                >
                  <div className={styles.imageWrap}>
                    <img src={product.image} alt={product.name} className={styles.productImg} />
                    <span className={styles.storeBadge}>{product.store}</span>
                    
                    {/* Glowing Discount Percentage tag */}
                    <div className={styles.discountBadge}>
                      {product.discountPercent}%-
                    </div>
                    
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
                      <span className={styles.originalPrice}>{fmtToman(originalPriceToman)} تومان</span>
                      <span className={styles.priceToman}>{fmtToman(salePriceToman)} تومان</span>
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
        <CatalogPagination pagination={pagination} onPageChange={setPage} />
      </main>

      <Footer />
    </div>
  );
}

export default function SalePage() {
  const { settings } = useSiteSettings();
  return (
    <Suspense fallback={<div style={{padding: '100px', textAlign: 'center', color: '#fff'}}>در حال بارگذاری تخفیف‌ها...</div>}>
      <SaleContent />
    </Suspense>
  );
}
