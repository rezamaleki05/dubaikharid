'use client';
import { useSiteSettings, getProductTomanPrice } from '@/context/SiteSettingsContext';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAllProducts } from '@/data/products';
import { useWishlist } from '@/context/WishlistContext';
import styles from './Search.module.css';

// Replaced hardcoded exchange rate
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

// Brands database
const mockDatabase = [
  { id: 'gucci', name: 'Gucci', faName: 'گوچی', cat: 'مد و پوشاک', hasImage: false, fallback: 'GUCCI' },
  { id: 'lv', name: 'Louis Vuitton', faName: 'لویی ویتون', cat: 'مد و پوشاک', hasImage: false, fallback: 'LV' },
  { id: 'chanel', name: 'Chanel', faName: 'شنل', cat: 'مد و پوشاک', hasImage: false, fallback: 'CHANEL' },
  { id: 'prada', name: 'Prada', faName: 'پرادا', cat: 'کیف و کفش', hasImage: false, fallback: 'PRADA' },
  { id: 'dior', name: 'Dior', faName: 'دیور', cat: 'مد و پوشاک', hasImage: false, fallback: 'DIOR' },
  { id: 'hermes', name: 'Hermès', faName: 'هرمس', cat: 'کیف و کفش', hasImage: false, fallback: 'HERMÈS' },
  { id: 'rolex', name: 'Rolex', faName: 'رولکس', cat: 'ساعت و اکسسوری', hasImage: false, fallback: 'ROLEX' },
  { id: 'cartier', name: 'Cartier', faName: 'کارتیر', cat: 'ساعت و اکسسوری', hasImage: false, fallback: 'Cartier' },
  { id: 'nike', name: 'Nike', faName: 'نایک نایکی', cat: 'ورزشی ( اسپورت )', hasImage: true, img: '/images/logo/NIKE.svg' },
  { id: 'adidas', name: 'Adidas', faName: 'آدیداس ادیداس', cat: 'ورزشی ( اسپورت )', hasImage: true, img: '/images/logo/adidas.png' },
  { id: 'shein', name: 'Shein', faName: 'شی این', cat: 'مد و پوشاک', hasImage: true, img: '/images/logo/Shein.png' },
  { id: 'apple', name: 'Apple', faName: 'اپل', cat: 'تکنولوژی', hasImage: false, fallback: '' },
  { id: 'samsung', name: 'Samsung', faName: 'سامسونگ', cat: 'تکنولوژی', hasImage: false, fallback: 'SAMSUNG' },
  { id: 'sephora', name: 'Sephora', faName: 'سفورا', cat: 'عطر و آرایشی', hasImage: false, fallback: 'SEPHORA' },
  { id: 'dyson', name: 'Dyson', faName: 'دایسون', cat: 'خانه و دکوراسیون', hasImage: false, fallback: 'dyson' },
  { id: 'noon', name: 'Noon', faName: 'نون', cat: 'فروشگاه آنلاین', hasImage: true, img: '/images/logo/Noon.webp' },
  { id: 'amazon', name: 'Amazon.ae', faName: 'آمازون امیدی امارات', cat: 'فروشگاه آنلاین', hasImage: true, img: '/images/logo/amazon.png' }
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { toggleWishlist, isInWishlist } = useWishlist();

  const qLower = query.toLowerCase().trim();
  const [allProducts, setAllProducts] = useState([]);

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
      console.error('Error merging products for search:', e);
    }
    setAllProducts(merged);
  }, []);

  useEffect(() => {
    if (query) {
      try {
        const savedHistory = localStorage.getItem('dubaiKharidSearchHistory');
        let historyList = savedHistory ? JSON.parse(savedHistory) : [];
        const cleanQuery = query.toLowerCase().trim();
        if (cleanQuery && !historyList.includes(cleanQuery)) {
          historyList.push(cleanQuery);
          if (historyList.length > 50) historyList.shift();
          localStorage.setItem('dubaiKharidSearchHistory', JSON.stringify(historyList));
        }
      } catch (e) {
        console.error('Error saving search query to history:', e);
      }
    }
  }, [query]);

  // 1. Search in Brand Catalog
  const brandResults = qLower
    ? mockDatabase.filter(item => 
        item.name.toLowerCase().includes(qLower) || 
        (item.faName && item.faName.includes(qLower)) ||
        item.cat.includes(qLower)
      )
    : [];

  // 2. Search in Products Database (extended)
  const productResults = qLower
    ? allProducts.filter(product => 
        product.name.toLowerCase().includes(qLower) ||
        product.brand.toLowerCase().includes(qLower) ||
        (product.store && product.store.toLowerCase().includes(qLower)) ||
        (product.category && product.category.toLowerCase().includes(qLower)) ||
        (product.spec && product.spec.toLowerCase().includes(qLower)) ||
        (product.description && product.description.toLowerCase().includes(qLower))
      )
    : [];

  const totalResultsCount = brandResults.length + productResults.length;

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.searchContainer} dir="rtl">
        <div className={styles.searchHeader}>
          {query ? (
            <h1 className={styles.searchTitle}>
              نتایج جستجو برای: <span className={styles.searchQuery}>"{query}"</span>
              <span className={styles.resultsCount}>({totalResultsCount} مورد یافت شد)</span>
            </h1>
          ) : (
            <h1 className={styles.searchTitle}>عبارتی برای جستجو وارد کنید</h1>
          )}
        </div>

        {query && totalResultsCount > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
            
            {/* Section 1: Found Brands */}
            {brandResults.length > 0 && (
              <div>
                <h2 className={styles.sectionTitle}>برندهای یافت شده</h2>
                <div className={styles.grid}>
                  {brandResults.map(item => (
                    <div key={item.id} className={styles.card}>
                      <div className={styles.logoWrap}>
                        {item.hasImage ? (
                          <img src={item.img} alt={item.name} className={styles.logoImg} />
                        ) : (
                          <div className={styles.logoFallback}>{item.fallback}</div>
                        )}
                      </div>
                      <h3 className={styles.brandName}>{item.name}</h3>
                      <p className={styles.brandCategory}>{item.cat}</p>
                      <a 
                        href={`/brands?id=${item.id}`} 
                        className={styles.linkBtn}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/brands`);
                        }}
                      >
                        مشاهده برند
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Found Products */}
            {productResults.length > 0 && (
              <div>
                <h2 className={styles.sectionTitle}>محصولات یافت شده</h2>
                <div className={styles.productsGrid}>
                  {productResults.map(product => {
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
                          <h3 className={styles.productCardName}>{product.name}</h3>
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
                                <span className={styles.priceLabel}>قیمت تحویلی:</span>
                                <span className={styles.priceToman}>{fmtToman(tomanPrice)} تومان</span>
                              </>
                            )}
                          </div>

                          <div className={styles.cartBtn}>
                            مشاهده و خرید محصول
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : query ? (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>🔍</div>
            <p className={styles.noResultsText}>متاسفانه نتیجه‌ای برای "{query}" یافت نشد.</p>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  const { settings } = useSiteSettings();
  return (
    <Suspense fallback={<div style={{padding: '100px', textAlign: 'center', color: '#fff'}}>در حال جستجو...</div>}>
      <SearchContent />
    </Suspense>
  );
}
