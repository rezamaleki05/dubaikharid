'use client';
import { useSiteSettings, getProductTomanPrice } from '@/context/SiteSettingsContext';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import MinimalIcon from '@/components/ui/MinimalIcon';
import { useCart } from '@/context/CartContext';
import { trackViewCart } from '@/lib/analytics';
import styles from './Cart.module.css';

// EXCHANGE_RATE replaced dynamically
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

export default function CartPage() {
  const { settings } = useSiteSettings();
  const { cartItems, addToCart, decrementQuantity, removeFromCart, removePurchasedItems, cartCount, hydrated, resolveError } = useCart();
  
  // Checkout Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrderData, setModalOrderData] = useState(null);
  const cartViewTrackedRef = useRef(false);

  // Calculate original and discounted subtotals
  const billableItems = cartItems.filter(item => !item.unavailable);
  const originalSubtotalToman = billableItems.reduce((acc, item) => acc + (getProductTomanPrice(item, settings) * item.quantity), 0);
  
  const discountedSubtotalToman = billableItems.reduce((acc, item) => {
    const itemOriginalPrice = getProductTomanPrice(item, settings);
    const finalPrice = item.discountPercent && item.discountPercent > 0 
      ? itemOriginalPrice * (1 - item.discountPercent / 100) 
      : itemOriginalPrice;
    return acc + (finalPrice * item.quantity);
  }, 0);

  const savingsToman = originalSubtotalToman - discountedSubtotalToman;
  
  const subtotalAed = billableItems.reduce((acc, item) => {
    if (item.type !== 'PRODUCT') return acc;
    const finalPriceAed = item.discountPercent && item.discountPercent > 0
      ? item.priceAed * (1 - item.discountPercent / 100)
      : item.priceAed;
    return acc + (finalPriceAed * item.quantity);
  }, 0);

  const shippingToman = 0;
  const totalToman = discountedSubtotalToman + shippingToman;
  const hasUnavailableItems = cartItems.some(item => item.unavailable);
  const isResolving = cartItems.some(item => item.resolving);
  const checkoutGroups = new Set(cartItems.map(item => (
    item.type === 'PRODUCT' ? `PRODUCT:${item.supplyMode || 'UNRESOLVED'}` : item.type
  )));
  const hasMixedFulfillmentGroups = checkoutGroups.size > 1;

  useEffect(() => {
    if (hydrated && !isResolving && !cartViewTrackedRef.current && trackViewCart(cartItems)) {
      cartViewTrackedRef.current = true;
    }
  }, [cartItems, hydrated, isResolving]);

  // Trigger pre-invoice checkout modal for entire cart
  const handleProceedToCheckout = () => {
    if (hasUnavailableItems || isResolving || hasMixedFulfillmentGroups || resolveError) return;
    // Compile total order weight and general description
    const totalWeight = cartItems.reduce((acc, item) => acc + (item.weight * item.quantity), 0);
    
    const orderData = {
      price: subtotalAed,
      weight: totalWeight,
      category: 'shopping_cart_checkout',
      name: `سبد خرید دبی خرید شامل ${cartItems.length} محصول`,
      brand: 'دبی خرید',
      totalToman: totalToman,
      items: cartItems.map(item => ({
        cartKey: item.key,
        id: item.id,
        type: item.type,
        ...(item.type === 'LAPTOP' ? { laptopId: item.id } : {}),
        ...(item.type === 'PRODUCT' ? { productId: item.id } : {}),
        ...(item.type === 'PRODUCT' && item.productVariantId ? { productVariantId: item.productVariantId } : {}),
        ...(item.type === 'WAREHOUSE' ? { warehouseItemId: item.id } : {}),
        product_type: item.product_type,
        link: item.originalLink || item.link || '',
        weight: item.weight,
        name: item.name,
        brand: item.brand,
        quantity: item.quantity,
        color: item.selectedColor || '',
        size: item.selectedSize || '',
        priceAed: item.priceAed,
        priceToman: item.priceToman,
        discountPercent: item.discountPercent || 0
      }))
    };

    setModalOrderData(orderData);
    setIsModalOpen(true);
  };

  const handleCheckoutSuccess = ({ items = [] } = {}) => {
    setIsModalOpen(false);
    removePurchasedItems(items.map(item => item.cartKey).filter(Boolean));
    alert('پیش‌فاکتور شما با موفقیت ثبت شد.');
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      
      <main className={styles.mainContainer} dir="rtl">
        {!hydrated ? (
          <div className={styles.emptyState}><p className={styles.emptySubText}>در حال بارگذاری سبد خرید...</p></div>
        ) : cartCount === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><MinimalIcon name="shoppingCart" size={52} weight="thin" /></div>
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
                  const tomanPrice = getProductTomanPrice(item, settings);
                  return (
                    <div key={item.cartItemId} className={styles.cartItem}>
                      <img src={item.image || item.img} alt={item.name} className={styles.itemImage} />
                      
                      <div className={styles.itemInfo}>
                        <div className={styles.brandName}>{item.brand || ''}</div>
                        <div className={styles.itemName}>{item.name}</div>
                        
                        {/* Render size and color options if selected */}
                        {(item.variant?.options?.length || item.selectedSize || item.selectedColor) && (
                          <div style={{ display: 'flex', gap: '12px', margin: '6px 0 10px', fontSize: '12px', color: '#ff781f', fontWeight: '600' }}>
                            {item.variant?.options?.length
                              ? item.variant.options.map(option => (
                                  <span key={`${option.attributeCode}:${option.optionCode}`}>{option.attributeNameFa}: {option.labelFa}</span>
                                ))
                              : <>
                                  {item.selectedColor && <span>رنگ: {item.selectedColor}</span>}
                                  {item.selectedSize && <span>سایز: {item.selectedSize}</span>}
                                </>}
                          </div>
                        )}

                        <div className={styles.itemPrice}>
                          {item.discountPercent && item.discountPercent > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '11px', textDecoration: 'line-through', color: '#8b92a5' }}>
                                {fmtToman(tomanPrice * item.quantity)} تومان
                              </span>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ color: '#ff3333', fontWeight: 'bold' }}>
                                  {fmtToman(tomanPrice * (1 - item.discountPercent / 100) * item.quantity)} تومان
                                </span>
                                <span style={{ background: '#ff3333', color: '#fff', fontSize: '10px', padding: '1px 4px', borderRadius: '3px' }}>
                                  {item.discountPercent}%-
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span>{fmtToman(tomanPrice * item.quantity)} تومان</span>
                          )}
                        </div>

                        {item.unavailable && <div style={{ color: '#d93025', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>این کالا در حال حاضر قابل سفارش نیست.</div>}
                        {item.priceChanged && <div style={{ color: '#a35b00', fontSize: '12px', marginBottom: '8px' }}>قیمت کالا با آخرین اطلاعات فروشگاه به‌روزرسانی شد.</div>}
                        
                        <div className={styles.itemControls}>
                          <div className={styles.qtyBox}>
                            <button 
                              className={styles.qtyBtn} 
                              onClick={() => addToCart(item, item.selectedSize, item.selectedColor)}
                              disabled={item.type === 'LAPTOP' || item.unavailable}
                            >
                              +
                            </button>
                            <span className={styles.qtyValue}>{item.quantity}</span>
                            <button 
                              className={styles.qtyBtn} 
                              onClick={() => decrementQuantity(item.cartItemId)}
                              disabled={item.type === 'LAPTOP' || item.unavailable}
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
                  <span style={savingsToman > 0 ? { textDecoration: 'line-through', color: '#8b92a5' } : {}}>{fmtToman(originalSubtotalToman)} تومان</span>
                </div>
                
                {savingsToman > 0 && (
                  <div className={styles.summaryRow} style={{ color: '#ff3333' }}>
                    <span>سود شما از خرید (تخفیف):</span>
                    <span style={{ fontWeight: '600' }}>{fmtToman(savingsToman)} تومان-</span>
                  </div>
                )}
                
                <div className={styles.summaryRow}>
                  <span>هزینه ارسال:</span>
                  <span>رایگان</span>
                </div>
                
                <div className={styles.summaryTotalRow}>
                  <span>جمع برآوردی:</span>
                  <span>{fmtToman(totalToman)} تومان</span>
                </div>

                {resolveError && <div style={{ color: '#d93025', fontSize: '12px', marginBottom: '10px' }}>{resolveError}</div>}
                {hasUnavailableItems && <div style={{ color: '#d93025', fontSize: '12px', marginBottom: '10px' }}>برای ادامه، کالای ناموجود را از سبد حذف کنید.</div>}
                {hasMixedFulfillmentGroups && <div style={{ color: '#a35b00', fontSize: '12px', marginBottom: '10px' }}>گروه‌های تأمین متفاوت باید جداگانه سفارش داده شوند.</div>}
                
                <button 
                  type="button"
                  className={styles.checkoutBtn}
                  onClick={handleProceedToCheckout}
                  disabled={hasUnavailableItems || isResolving || hasMixedFulfillmentGroups || Boolean(resolveError)}
                >
                  {isResolving ? 'در حال بررسی قیمت و موجودی...' : 'تکمیل سفارش و پرداخت'}
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
