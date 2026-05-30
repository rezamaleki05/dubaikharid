'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { laptops } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './StockLaptops.module.css';

const EXCHANGE_RATE = 19500;
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

export default function StockLaptopsPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [allLaptops, setAllLaptops] = useState([]);

  useEffect(() => {
    let merged = [...laptops];
    
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
        const uploadedLaptops = uploaded.filter(p => p.category === 'electronics');
        uploadedLaptops.forEach(p => {
          const index = merged.findIndex(m => m.id === p.id);
          if (index !== -1) {
            merged[index] = p; // Apply edit override
          } else {
            merged.unshift(p); // Prepend new upload
          }
        });
      }
    } catch (e) {
      console.error('Error loading uploaded laptops:', e);
    }
    setAllLaptops(merged);
  }, []);

  const handleSelect = (product) => {
    router.push(`/product/${product.id}`);
  };

  const ProductCard = ({ product }) => {
    const tomanPrice = product.priceAed * EXCHANGE_RATE;
    return (
      <div 
        className={styles.productCard} 
        onClick={() => handleSelect(product)}
      >
        <div className={styles.imageWrap}>
          <img src={product.image} alt={product.name} className={styles.productImg} />
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

        <div className={styles.grid}>
          {allLaptops.map(laptop => (
            <ProductCard key={laptop.id} product={laptop} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
