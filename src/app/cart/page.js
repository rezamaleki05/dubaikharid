'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import { useCart } from '@/context/CartContext';
import styles from './Cart.module.css';

const EXCHANGE_RATE = 19500;
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

export default function CartPage() {
  const { cartItems, addToCart, decrementQuantity, removeFromCart, clearCart, cartCount } = useCart();
  
  // Checkout Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrderData, setModalOrderData] = useState(null);

  // Calculate Subtotal (AED) and convert to Toman
  const subtotalAed = cartItems.reduce((acc, item) => acc + (item.priceAed * item.quantity), 0);
  const subtotalToman = subtotalAed * EXCHANGE_RATE;
  
  // For now, shipping is free/included
  const shippingToman = 0; 
  const totalToman = subtotalToman + shippingToman;

  // Trigger pre-invoice checkout modal for entire cart
  const handleProceedToCheckout = () => {
    // Compile total order weight and general description
    const totalWeight = cartItems.reduce((acc, item) => acc + (item.weight * item.quantity), 0);
    
    const orderData = {
      price: subtotalAed,
      weight: totalWeight,
      category: 'shopping_cart_checkout',
      name: `سبد خرید دبی خرید شامل ${cartItems.length} محصول`,
      brand: 'دبی خرید'
    };

    setModalOrderData(orderData);
    setIsModalOpen(true);
  };

  const handleCheckoutSuccess = () => {
    setIsModalOpen(false);
    clearCart(); // Clear cart after successful checkout submission
    alert('پیش‌فاکتور شما با موفقیت ثبت شد و سبد خرید خالی گردید.');
  };

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
                    <div key={item.cartItemId} className={styles.cartItem}>
                      <img src={item.image || item.img} alt={item.name} className={styles.itemImage} />
                      
                      <div className={styles.itemInfo}>
                        <div className={styles.brandName}>{item.brand || ''}</div>
                        <div className={styles.itemName}>{item.name}</div>
                        
                        {/* Render size and color options if selected */}
                        {(item.selectedSize || item.selectedColor) && (
                          <div style={{ display: 'flex', gap: '12px', margin: '6px 0 10px', fontSize: '12px', color: '#ff781f', fontWeight: '600' }}>
                            {item.selectedColor && (
                              <span>رنگ: {item.selectedColor}</span>
                            )}
                            {item.selectedSize && (
                              <span>سایز: {item.selectedSize}</span>
                            )}
                          </div>
                        )}

                        <div className={styles.itemPrice}>{fmtToman(tomanPrice)} تومان</div>
                        
                        <div className={styles.itemControls}>
                          <div className={styles.qtyBox}>
                            <button 
                              className={styles.qtyBtn} 
                              onClick={() => addToCart(item, item.selectedSize, item.selectedColor)}
                            >
                              +
                            </button>
                            <span className={styles.qtyValue}>{item.quantity}</span>
                            <button 
                              className={styles.qtyBtn} 
                              onClick={() => decrementQuantity(item.cartItemId)}
                            >
                              -
                            </button>
                          </div>
                          
                          <button 
                            className={styles.removeBtn} 
                            onClick={() => removeFromCart(item.cartItemId)}
                          >
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
                  type="button"
                  className={styles.checkoutBtn}
                  onClick={handleProceedToCheckout}
                >
                  تکمیل سفارش و پرداخت
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />

      {/* Reusable Pre-invoice Checkout Modal */}
      <CheckoutModal
        isOpen={isModalOpen}
        orderData={modalOrderData}
        onClose={() => setIsModalOpen(false)}
        onCartIncrement={handleCheckoutSuccess}
      />
    </div>
  );
}
