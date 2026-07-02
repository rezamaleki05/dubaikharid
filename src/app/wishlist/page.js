'use client';
import { useSiteSettings, getProductTomanPrice } from '@/context/SiteSettingsContext';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useWishlist } from '@/context/WishlistContext';
import styles from './Wishlist.module.css';

// Replaced hardcoded exchange rate
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

export default function WishlistPage() {
  const { settings } = useSiteSettings();
  const router = useRouter();
  const { wishlistItems, toggleWishlist } = useWishlist();

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContainer} dir="rtl">
        {wishlistItems.length === 0 ? (
          /* Empty Favorites state */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>❤️</div>
            <h1 className={styles.emptyText}>لیست علاقه‌مندی‌های شما خالی است</h1>
            <p className={styles.emptySubText}>هنوز هیچ محصولی را لایک نکرده‌اید تا به این صفحه اضافه شود.</p>
            <Link href="/" className={styles.shopBtn}>
              بازگشت به فروشگاه و مرور محصولات
            </Link>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className={styles.titleHeader}>
              <h1 className={styles.title}>محصولات انتخاب شده ({wishlistItems.length} کالا)</h1>
              <p className={styles.subtitle}>محصولات لایک شده شما در این بخش ذخیره شده‌اند تا به راحتی بتوانید آن‌ها را انتخاب و خریداری کنید.</p>
            </div>

            {/* Favorites Grid */}
            <div className={styles.grid}>
              {wishlistItems.map((item) => {
                const tomanPrice = getProductTomanPrice(item, settings);
                return (
                  <div 
                    key={item.id} 
                    className={styles.wishItemCard}
                    onClick={() => router.push(`/product/${item.id}`)}
                  >
                    <div className={styles.imageWrap}>
                      <img src={item.image || item.img} alt={item.name} className={styles.productImg} />
                      <span className={styles.storeBadge}>{item.store}</span>
                      {item.discountPercent && item.discountPercent > 0 && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#ff3333', color: '#fff', fontSize: '11px', fontWeight: '850', padding: '3px 8px', borderRadius: '4px', boxShadow: '0 0 10px #ff3333', zIndex: 5, direction: 'ltr' }}>
                          {item.discountPercent}%-
                        </div>
                      )}
                      
                      {/* Unlike absolute button */}
                      <button 
                        className={styles.unlikeBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(item);
                        }}
                        aria-label="حذف از علاقه‌مندی‌ها"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff4757" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                      </button>
                    </div>

                    <div className={styles.cardBody}>
                      <span className={styles.brandBadge}>{item.brand || ''}</span>
                      <h3 className={styles.productName}>{item.name}</h3>
                      <p className={styles.productSpec}>{item.spec || ''}</p>
                      
                      <div className={styles.priceRow}>
                        {item.discountPercent && item.discountPercent > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', width: '100%' }}>
                            <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#8b92a5' }}>{fmtToman(tomanPrice)} تومان</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <span className={styles.priceToman} style={{ color: '#ff3333' }}>{fmtToman(tomanPrice * (1 - item.discountPercent / 100))} تومان</span>
                              <span style={{ fontSize: '11px', color: '#ff3333', fontWeight: '600' }}>تحویل درب منزل</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className={styles.priceLabel}>قیمت تحویلی:</span>
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
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
