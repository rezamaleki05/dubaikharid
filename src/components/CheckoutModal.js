'use client';
import { useSiteSettings, getProductTomanPrice } from '@/context/SiteSettingsContext';

import { useState, useEffect, useMemo, useRef } from 'react';
import MinimalIcon from '@/components/ui/MinimalIcon';
import ManualPaymentPanel from '@/components/payment/ManualPaymentPanel';
import { markPurchasePending, trackBeginCheckout } from '@/lib/analytics';
import styles from './CheckoutModal.module.css';

export default function CheckoutModal({ isOpen, orderData, onClose, onCartIncrement }) {
  const { settings } = useSiteSettings();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1 = Form, 2 = Payment Method, 3 = Loading, 4 = Success
  const [trackingCode, setTrackingCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'gateway' | 'card'
  const [submitError, setSubmitError] = useState('');
  const [resultKind, setResultKind] = useState('order');
  const [authoritativeTotal, setAuthoritativeTotal] = useState(null);
  const [manualPayment, setManualPayment] = useState(null);
  const idempotencyKeyRef = useRef(null);
  const submittingRef = useRef(false);
  const completedResultRef = useRef(null);
  const checkoutTrackedRef = useRef(false);
  const checkoutItems = useMemo(() => orderData?.items || [], [orderData]);
  const canCreateDatabaseOrder = checkoutItems.length > 0 && (
    checkoutItems.every(item => item.laptopId || item.product_type === 'laptop_stock')
    || checkoutItems.every(item => item.warehouseItemId || item.product_type === 'warehouse_stock')
    || checkoutItems.every(item => item.productId && !item.laptopId)
  );

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      idempotencyKeyRef.current ||= crypto.randomUUID();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && canCreateDatabaseOrder && !checkoutTrackedRef.current) {
      checkoutTrackedRef.current = trackBeginCheckout(checkoutItems);
    }
  }, [canCreateDatabaseOrder, checkoutItems, isOpen]);

  if (!isOpen || !orderData) return null;

  const calculateFallbackTotal = () => {
    const rate = Number(settings.aedRate);
    const price = Number(orderData.priceAed ?? orderData.price);
    return Number.isFinite(rate) && rate > 0 && Number.isFinite(price) && price >= 0 ? Math.round(price * rate) : 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toEnglishDigits = (str) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str
      .replace(/[۰-۹]/g, (w) => farsiDigits.indexOf(w))
      .replace(/[٠-٩]/g, (w) => arabicDigits.indexOf(w));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'نام و نام خانوادگی الزامی است';
    
    const cleanPhone = toEnglishDigits(formData.phone.trim().replace(/\s+/g, ''));
    
    if (!cleanPhone) {
      newErrors.phone = 'شماره موبایل الزامی است';
    } else if (!/^(?:09|\+989|989|00989)\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'شماره موبایل معتبر نیست (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)';
    }
    
    if (!formData.address.trim()) newErrors.address = 'آدرس تحویل الزامی است';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (canCreateDatabaseOrder) setStep(2);
    else await handlePaymentSubmit();
  };

  const handlePaymentSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const cleanPhone = toEnglishDigits(formData.phone.trim().replace(/\s+/g, ''));
    setStep(3);
    setSubmitError('');
    const customer = { name: formData.name.trim(), phone: cleanPhone, address: formData.address.trim() };
    const sourceItems = orderData.items || [];
    const laptopItems = sourceItems.filter(item => item.laptopId || item.product_type === 'laptop_stock');
    const isLaptopOrder = laptopItems.length > 0 && laptopItems.length === sourceItems.length;
    const warehouseItems = sourceItems.filter(item => item.warehouseItemId || item.product_type === 'warehouse_stock');
    const isWarehouseOrder = warehouseItems.length > 0 && warehouseItems.length === sourceItems.length;
    const isCatalogOrder = sourceItems.length > 0 && sourceItems.every(item => item.productId && !item.laptopId);

    try {
      const endpoint = isLaptopOrder || isWarehouseOrder || isCatalogOrder ? '/api/orders' : '/api/purchase-requests';
      const payload = endpoint === '/api/orders'
        ? {
            customer,
            paymentMethod: paymentMethod === 'card' ? 'CARD' : 'ONLINE',
            notes: formData.notes.trim(),
            items: sourceItems.map(item => ({
              ...(item.laptopId || item.product_type === 'laptop_stock'
                ? { laptopId: item.laptopId || item.id }
                : item.warehouseItemId || item.product_type === 'warehouse_stock'
                  ? { warehouseItemId: item.warehouseItemId || item.id }
                  : { productId: item.productId }),
              quantity: item.quantity || 1,
              selectedColor: item.color || item.selectedColor || '',
              selectedSize: item.size || item.selectedSize || '',
            })),
          }
        : {
            customer,
            productUrl: orderData.link || orderData.productUrl || orderData.originalLink || sourceItems[0]?.link || sourceItems[0]?.originalLink || window.location.href,
            productName: orderData.productName || orderData.name || sourceItems.map(item => item.name).join(' + '),
            sourceStore: orderData.store || orderData.brand || 'فروشگاه دبی',
            priceAed: Number(orderData.priceAed ?? orderData.price ?? sourceItems.reduce((sum, item) => sum + Number(item.priceAed || 0) * Number(item.quantity || 1), 0)),
            weight: Number(orderData.weight || sourceItems.reduce((sum, item) => sum + Number(item.weight || 0) * Number(item.quantity || 1), 0)),
            quantity: sourceItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0) || 1,
            notes: formData.notes.trim(),
          };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKeyRef.current },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        const itemMessage = result.details?.items?.map(item => item.message).filter(Boolean).join('، ');
        throw new Error(itemMessage || result.error || 'ثبت اطلاعات با خطا مواجه شد.');
      }
      const isOrder = endpoint === '/api/orders';
      const code = isOrder ? result.data.orderCode : result.data.requestCode;
      if (isOrder) markPurchasePending(code);
      setTrackingCode(code);
      setResultKind(isOrder ? 'order' : 'request');
      setAuthoritativeTotal(isOrder ? Number(result.data.totalToman) : null);
      setManualPayment(result.data.manualPayment || null);
      completedResultRef.current = { kind: isOrder ? 'order' : 'request', code, items: sourceItems };
      if (isOrder && paymentMethod === 'gateway') {
        if (onCartIncrement) onCartIncrement(completedResultRef.current);
        completedResultRef.current = null;
        window.location.href = `/payment?order=${encodeURIComponent(code)}`;
        return;
      }
      setStep(4);
    } catch (error) {
      submittingRef.current = false;
      setSubmitError(error.message || 'ثبت اطلاعات با خطا مواجه شد.');
      setStep(2);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setErrors({});
    setPaymentMethod('card');
    setSubmitError('');
    setResultKind('order');
    setAuthoritativeTotal(null);
    setManualPayment(null);
    idempotencyKeyRef.current = null;
    submittingRef.current = false;
    checkoutTrackedRef.current = false;
    if (completedResultRef.current && onCartIncrement) onCartIncrement(completedResultRef.current);
    completedResultRef.current = null;
    onClose();
  };

  const formatPrice = (price) => {
    return Math.round(price).toLocaleString('fa-IR');
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContainer} ${step === 4 && resultKind === 'order' && manualPayment ? styles.manualPaymentModal : ''}`}>
        {/* Close Button */}
        <button onClick={handleClose} className={styles.closeBtn} aria-label="بستن">
          <MinimalIcon name="x" size={19} />
        </button>

        {/* STEP 1: FORM INPUT */}
        {step === 1 && (
          <form onSubmit={handleFormSubmit} className={styles.form} dir="rtl">
            <div className={styles.modalHeader}>
              <span className={styles.airplaneIcon}><MinimalIcon name="airplane" size={34} weight="thin" /></span>
              <h2>{canCreateDatabaseOrder ? 'ثبت نهایی سفارش خرید از دبی' : 'ثبت درخواست خرید از دبی'}</h2>
              <p>مشخصات خود را وارد کنید تا کارشناسان ما فرآیند خرید کالا را برای شما آغاز کنند.</p>
            </div>

            {/* Product Summary Mini Card */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>خلاصه سفارش شما:</div>
              <div className={styles.summaryDetails}>
                <span className={styles.prodName}>{orderData.productName}</span>
                <span className={styles.prodBrand}>برند: {orderData.brand} | وزن: {orderData.weight} کیلوگرم</span>
              </div>
              <div className={styles.summaryPriceRow}>
                <span>{canCreateDatabaseOrder ? 'مبلغ برآوردی تا تأیید سرور:' : 'هزینه تقریبی:'}</span>
                <span className={styles.totalPrice}>{formatPrice(orderData.totalToman || calculateFallbackTotal())} تومان</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className={styles.formFields}>
              {/* Name */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>نام و نام خانوادگی:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="مثال: رضا ملکی"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              {/* Mobile Phone */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>شماره موبایل (جهت هماهنگی):</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                  className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                  dir="ltr"
                />
                {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
              </div>

              {/* Delivery Address */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>آدرس دقیق جهت تحویل در ایران:</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="استان، شهر، خیابان اصلی و فرعی، کوچه، پلاک، واحد"
                  rows="3"
                  className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`}
                ></textarea>
                {errors.address && <span className={styles.errorText}>{errors.address}</span>}
              </div>

              {/* Notes */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>توضیحات سفارشی یا مشخصات فنی محصول (رنگ، سایز و...):</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="در صورتی که کالا دارای سایزبندی یا رنگ خاصی است، در این قسمت بنویسید..."
                  rows="2"
                  className={styles.textarea}
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn}>
                {canCreateDatabaseOrder ? 'تأیید مشخصات و مرحله بعد' : 'ثبت درخواست خرید'}
              </button>
              <button type="button" onClick={handleClose} className={styles.cancelBtn}>
                انصراف
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PAYMENT METHOD SELECTOR */}
        {step === 2 && (
          <div className={styles.paymentSection} dir="rtl">
            <div className={styles.modalHeader}>
              <span className={styles.airplaneIcon}><MinimalIcon name="creditCard" size={34} weight="thin" /></span>
              <h2 className={styles.paymentTitle}>انتخاب روش پرداخت سفارش</h2>
              <p>لطفاً یکی از دو روش پرداخت ایمن زیر را برای نهایی کردن سفارش انتخاب کنید.</p>
            </div>

            {/* Price Row */}
            <div className={styles.summaryCard} style={{ marginBottom: '20px' }}>
              <div className={styles.summaryPriceRow}>
                <span>مبلغ برآوردی تا تأیید نهایی سرور:</span>
                <span className={styles.totalPrice}>{formatPrice(orderData.totalToman || calculateFallbackTotal())} تومان</span>
              </div>
            </div>

            {/* Methods list */}
            <div className={styles.paymentCards}>
              {/* Method 1: online Gateway */}
              <div 
                className={`${styles.paymentCard} ${paymentMethod === 'gateway' ? styles.paymentCardActive : ''}`}
                onClick={() => { if (settings.onlinePaymentEnabled === true) setPaymentMethod('gateway'); }}
                aria-disabled={settings.onlinePaymentEnabled !== true}
                style={settings.onlinePaymentEnabled !== true ? { opacity: 0.48, cursor: 'not-allowed' } : undefined}
              >
                <div className={styles.paymentCardIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div className={styles.paymentCardInfo}>
                  <div className={styles.paymentCardTitle}>درگاه پرداخت آنلاین شتاب</div>
                  <div className={styles.paymentCardDesc}>{settings.onlinePaymentEnabled === true ? 'اتصال مستقیم به کلیه کارت‌های بانکی عضو شبکه شتاب' : 'به‌زودی'}</div>
                </div>
                <div className={styles.paymentRadio}>
                  <div className={styles.paymentRadioInner}></div>
                </div>
              </div>

              {/* Method 2: Card to Card */}
              <div 
                className={`${styles.paymentCard} ${paymentMethod === 'card' ? styles.paymentCardActive : ''}`}
                onClick={() => { if (settings.cardPaymentEnabled !== false) setPaymentMethod('card'); }}
                aria-disabled={settings.cardPaymentEnabled === false}
                style={settings.cardPaymentEnabled === false ? { opacity: 0.48, cursor: 'not-allowed' } : undefined}
              >
                <div className={styles.paymentCardIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
                </div>
                <div className={styles.paymentCardInfo}>
                  <div className={styles.paymentCardTitle}>کارت به کارت مستقیم بانکی</div>
                  <div className={styles.paymentCardDesc}>انتقال مستقیم مبلغ به کارت بانکی فروشگاه دبی خرید</div>
                </div>
                <div className={styles.paymentRadio}>
                  <div className={styles.paymentRadioInner}></div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              {submitError && <div className={styles.errorText}>{submitError}</div>}
              <button type="button" onClick={handlePaymentSubmit} className={styles.submitBtn} disabled={step === 3 || (paymentMethod === 'gateway' ? settings.onlinePaymentEnabled !== true : settings.cardPaymentEnabled === false)}>
                تأیید و پرداخت نهایی سفارش
              </button>
              <button type="button" onClick={() => setStep(1)} className={styles.cancelBtn}>
                مرحله قبل
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LOADING SPINNER */}
        {step === 3 && (
          <div className={styles.loadingContainer}>
            <div className={styles.loaderSpinner}></div>
            <h3>در حال ثبت اطلاعات و اتصال به درگاه پرداخت...</h3>
            <p>لطفاً شکیبا باشید. اطلاعات پیش‌فاکتور شما در حال اتصال به سرور مرکزی خرید است.</p>
          </div>
        )}

        {/* STEP 4: CARD TRANSFER SUCCESS OR GATEWAY DONE SCREEN */}
        {step === 4 && (
          <div className={styles.successContainer} dir="rtl">
            <div className={styles.successCircle}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2>{resultKind === 'order' ? 'درخواست شما با موفقیت ثبت شد' : 'درخواست خرید شما با موفقیت ثبت شد!'}</h2>

            {/* Tracking Card */}
            <div className={styles.trackingCard}>
              <div className={styles.trackingLabel}>{resultKind === 'order' ? 'شماره واقعی سفارش شما:' : 'شناسه درخواست خرید شما:'}</div>
              <div className={styles.trackingCode}>{trackingCode}</div>
            </div>

            {resultKind === 'order' && authoritativeTotal !== null && manualPayment && (
              <div className={styles.manualPaymentArea}>
                <ManualPaymentPanel
                  orderCode={trackingCode}
                  totalToman={authoritativeTotal}
                  access={manualPayment}
                  uploadToken={manualPayment.uploadToken}
                  onSkip={handleClose}
                />
              </div>
            )}

            <p className={styles.successDesc} style={{ textAlign: 'right' }}>
              {resultKind === 'order'
                ? <>کاربر گرامی، سفارش شما با موفقیت در پنل مدیریت دبی خرید ثبت شد. وضعیت پرداخت تا زمان تأیید معتبر، «در انتظار» باقی می‌ماند و کارشناسان ما برای ادامه فرایند با شما تماس خواهند گرفت.</>
                : <>این مبلغ صرفاً برآورد اولیه است. پس از بررسی لینک، موجودی، وزن واقعی و نرخ معتبر، قیمت نهایی توسط کارشناس اعلام می‌شود.</>}
            </p>

            <button type="button" onClick={handleClose} className={styles.doneBtn}>
              فهمیدم، بازگشت به فروشگاه
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
