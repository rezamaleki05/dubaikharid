'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import styles from './Cart.module.css';

const EXCHANGE_RATE = 19500;
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

export default function CartPage() {
  const { cartItems, addToCart, decrementQuantity, removeFromCart, cartCount } = useCart();

  // Calculate Subtotal (AED) and convert to Toman
  const subtotalAed = cartItems.reduce((acc, item) => acc + (item.priceAed * item.quantity), 0);
  const subtotalToman = subtotalAed * EXCHANGE_RATE;
  
  // For now, shipping is free/included
  const shippingToman = 0; 
  const totalToman = subtotalToman + shippingToman;

  return (
    <div className={styles.pageWrapper}>
      <Header />
      
      <main className={styles.mainContainer} dir="rtl">
        {cartCount === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <h1 className={styles.emptyText}>سبد خرید شما خالی است</h1>
            <p className={styles.emptySubText}>هنوز هیچ محصولی به سبد خرید خود اضافه نکرده‌اید.</p>
            <Link href="/" className={styles.shopBtn}>
              بازگشت به فروشگاه
            </Link>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>سبد خرید ({cartCount} کالا)</h1>
            
            <div className={styles.layoutGrid}>
              {/* Items List */}
              <div className={styles.cartItems}>
                {cartItems.map((item) => {
                  const tomanPrice = item.priceAed * EXCHANGE_RATE;
                  return (
                    <div key={item.id} className={styles.cartItem}>
                      <img src={item.image || item.img} alt={item.name} className={styles.itemImage} />
                      
                      <div className={styles.itemInfo}>
                        <div className={styles.brandName}>{item.brand || item.faName || ''}</div>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemPrice}>{fmtToman(tomanPrice)} تومان</div>
                        
                        <div className={styles.itemControls}>
                          <div className={styles.qtyBox}>
                            <button className={styles.qtyBtn} onClick={() => addToCart(item)}>+</button>
                            <span className={styles.qtyValue}>{item.quantity}</span>
                            <button className={styles.qtyBtn} onClick={() => decrementQuantity(item.id)}>-</button>
                          </div>
                          
                          <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className={styles.summaryBox}>
                <h2 className={styles.summaryTitle}>خلاصه سفارش</h2>
                
                <div className={styles.summaryRow}>
                  <span>مبلغ کالاها ({cartCount}):</span>
                  <span>{fmtToman(subtotalToman)} تومان</span>
                </div>
                
                <div className={styles.summaryRow}>
                  <span>هزینه ارسال:</span>
                  <span>رایگان</span>
                </div>
                
                <div className={styles.summaryTotalRow}>
                  <span>جمع کل:</span>
                  <span>{fmtToman(totalToman)} تومان</span>
                </div>
                
                <button 
                  className={styles.checkoutBtn}
                  onClick={() => alert('انتقال به درگاه پرداخت در این نسخه دمو فعال نیست.')}
                >
                  تکمیل سفارش و پرداخت
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
