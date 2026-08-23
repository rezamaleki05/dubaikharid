'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './StockLaptops.module.css';

const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

export default function StockLaptopsPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [allLaptops, setAllLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/laptops?limit=60', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'دریافت لپ‌تاپ‌ها با خطا مواجه شد.');
        setAllLaptops(Array.isArray(payload.data) ? payload.data : []);
      })
      .catch(fetchError => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message || 'دریافت لپ‌تاپ‌ها با خطا مواجه شد.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleSelect = (product) => {
    router.push(`/product/${product.id}`);
  };

  const ProductCard = ({ product }) => {
    const tomanPrice = Number(product.priceToman) || 0;
    return (
      <div 
        className={styles.productCard} 
        onClick={() => handleSelect(product)}
      >
        <div className={styles.imageWrap}>
          {product.image ? <img src={product.image} alt={product.name} className={styles.productImg} /> : <div className={styles.productImg} aria-label={product.name} />}
          <span className={styles.storeBadge}>{product.store}</span>
          
          <button 
            className={`${styles.wishlistBtn} ${isInWishlist(product.id) ? styles.wished : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            aria-label="افزودن به علاقه‌مندی‌ها"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? "#ff4757" : "none"} stroke={isInWishlist(product.id) ? "#ff4757" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>
        </div>
        <div className={styles.cardBody} dir="rtl">
          <div className={styles.brandName}>{product.brand}</div>
          <div className={styles.productName}>{product.name}</div>
          <div className={styles.productSpec}>{product.spec}</div>
          <div className={styles.priceRow}>
            <span className={styles.priceToman}>{fmtToman(tomanPrice)} تومان</span>
          </div>
          <button 
            className={styles.cartBtn} 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
              alert(`«${product.name}» به سبد خرید افزوده شد.`);
            }}
          >
            افزودن به سبد خرید
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      
      <main className={styles.mainContainer} dir="rtl">
        <div className={styles.headerSection}>
          <h1 className={styles.title}>لپتاپ های استوک</h1>
          <p className={styles.subtitle}>واردات مستقیم و تضمین شده، موجود در انبار ایران با قابلیت ارسال فوری.</p>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '48px 0' }}>در حال بارگذاری لپ‌تاپ‌ها...</div>}
        {!loading && error && <div style={{ textAlign: 'center', padding: '48px 0' }}>{error}</div>}
        {!loading && !error && allLaptops.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0' }}>در حال حاضر لپ‌تاپ موجودی ثبت نشده است.</div>}
        <div className={styles.grid}>
          {!loading && !error && allLaptops.map(laptop => (
            <ProductCard key={laptop.id} product={laptop} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
