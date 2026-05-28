'use client';

import { use } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProductById } from '@/data/products';
import { useCart } from '@/context/CartContext';
import styles from './Product.module.css';

const EXCHANGE_RATE = 19500;
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

export default function ProductPage({ params }) {
  // Unwrap params using React.use() to avoid Next.js sync params warning
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { addToCart } = useCart();
  
  const product = getProductById(id);

  if (!product) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div className={styles.notFound}>محصول مورد نظر یافت نشد.</div>
        <Footer />
      </div>
    );
  }

  const tomanPrice = product.priceAed * EXCHANGE_RATE;

  return (
    <div className={styles.pageWrapper}>
      <Header />
      
      <main className={styles.mainContainer}>
        <div className={styles.productGrid}>
          {/* Image Section */}
          <div className={styles.imageSection}>
            <img src={product.image} alt={product.name} className={styles.mainImage} />
          </div>

          {/* Info Section */}
          <div className={styles.infoSection} dir="rtl">
            <div className={styles.brandBadge}>{product.brand}</div>
            <h1 className={styles.productName}>{product.name}</h1>
            
            {product.model ? (
              <div className={styles.specsGrid}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>مدل:</span>
                  <span className={styles.specValue}>{product.model}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>پردازنده (CPU):</span>
                  <span className={styles.specValue}>{product.cpu}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>رم (RAM):</span>
                  <span className={styles.specValue}>{product.ram}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>حافظه:</span>
                  <span className={styles.specValue}>{product.storage}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>گرافیک (GPU):</span>
                  <span className={styles.specValue}>{product.gpu}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>اندازه صفحه:</span>
                  <span className={styles.specValue}>{product.screenSize}</span>
                </div>
              </div>
            ) : (
              <div className={styles.productSpec}>{product.spec}</div>
            )}
            
            <div className={styles.productDescription}>
              {product.description || 'اطلاعات کامل و جزئیات دقیق این محصول را می‌توانید از طریق لینک فروشگاه اصلی مشاهده کنید. ما این کالا را به صورت مستقیم از دبی خریداری کرده و درب منزل به شما تحویل می‌دهیم.'}
            </div>

            <div className={styles.priceSection}>
              <div className={styles.priceLabel}>قیمت نهایی با احتساب هزینه‌های ارسال:</div>
              <div className={styles.priceValue}>
                {fmtToman(tomanPrice)}
                <span className={styles.priceUnit}>تومان</span>
              </div>
            </div>

            <div className={styles.actionSection}>
              <button 
                className={styles.addToCartBtn}
                onClick={() => {
                  addToCart(product);
                  alert(`«${product.name}» به سبد خرید افزوده شد.`);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                افزودن به سبد خرید
              </button>

              <div className={styles.storeInfo}>
                <span className={styles.storeLabel}>فروشگاه مبدا (دبی):</span>
                <span className={styles.storeName}>{product.store}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
