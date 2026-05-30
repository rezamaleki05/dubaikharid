'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { laptops, trendingProducts, EXCHANGE_RATE } from '@/data/products';
import styles from './ProductSlider.module.css';

export default function ProductSlider({ onSelectProduct }) {
  const [wishlist, setWishlist] = useState({});
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleSelect = (product) => {
    router.push(`/product/${product.id}`);
  };

  const fmtAed = (n) => n.toLocaleString('en-US');
  const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

  const ProductCard = ({ product, showStore }) => {
    const tomanPrice = product.priceAed * EXCHANGE_RATE;
    return (
      <div 
        className={styles.productCard} 
        onClick={() => handleSelect(product)}
        style={{ cursor: 'pointer' }}
      >
        <div className={styles.imageWrap}>
          <img src={product.image} alt={product.name} className={styles.productImg} />
          {showStore && <span className={styles.storeBadge}>{product.store}</span>}
          
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
        <div className={styles.cardBody}>
          <div className={styles.brandName}>{product.brand}</div>
          <div className={styles.productName}>{product.name}</div>
          <div className={styles.priceRow} style={{justifyContent: 'flex-start'}}>
            <span className={styles.priceToman} style={{color: '#fff', fontSize: '1.1rem'}}>{fmtToman(tomanPrice)} تومان</span>
          </div>
          <button className={styles.cartBtn} onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
            alert(`«${product.name}» به سبد خرید افزوده شد.`);
          }}>
            افزودن به سبد خرید
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Laptops */}
      <section id="laptops" className={styles.slider}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleDot}></span>
              لپتاپ های استوک
            </h2>
            <button className={styles.seeAllBtn} onClick={() => router.push('/stock-laptops')}>مشاهده همه ←</button>
          </div>
          <div className={styles.productGrid}>
            {laptops.map(p => <ProductCard key={p.id} product={p} showStore={true} />)}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section id="trending" className={styles.slider}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleDot}></span>
              محصولات پرفروش و محبوب
            </h2>
            <button className={styles.seeAllBtn} onClick={() => router.push('/best-sellers')}>مشاهده همه ←</button>
          </div>
          <div className={styles.productGrid}>
            {trendingProducts.map(p => <ProductCard key={p.id} product={p} showStore={true} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
