'use client';
import { useSiteSettings, getProductTomanPrice } from '@/context/SiteSettingsContext';

import { useState, useEffect } from 'react';
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
  const [paymentMethod, setPaymentMethod] = useState('gateway'); // 'gateway' | 'card'
  const [copied, setCopied] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !orderData) return null;

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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setStep(2); // Go to Payment Selection Step
  };

  const handlePaymentSubmit = () => {
    const cleanPhone = toEnglishDigits(formData.phone.trim().replace(/\s+/g, ''));

    // Transition to loading step
    setStep(3);

    // Simulate database insertion and payment gateway handshake
    setTimeout(() => {
      // Generate standard random tracking code
      const randNum = Math.floor(10000 + Math.random() * 90000);
      const tracking = `DKHARID-${randNum}`;
      setTrackingCode(tracking);

      const totalTomanVal = orderData.totalToman || ((orderData.price || 0) * 19500);
      const isCardSelected = paymentMethod === 'card';

      // Save order lead to localStorage for Admin Panel
      try {
        const existingLeads = JSON.parse(localStorage.getItem('dubaiKharidLeads') || '[]');
        const paymentNotes = isCardSelected 
          ? `[کارت به کارت] ${formData.notes.trim()}`
          : `[درگاه شتاب] ${formData.notes.trim()}`;

        const newLead = {
          id: tracking,
          customerName: formData.name.trim(),
          phone: cleanPhone,
          address: formData.address.trim(),
          notes: paymentNotes,
          productName: orderData.productName || orderData.name || 'پیش‌فاکتور سبد خرید دبی',
          brand: orderData.brand || 'دبی خرید',
          weight: orderData.weight || 0.5,
          totalToman: totalTomanVal,
          priceAed: orderData.priceAed || orderData.price || 0,
          date: new Date().toISOString(),
          status: 'pending', // 'pending' = در انتظار بررسی
          items: orderData.items || null
        };
        existingLeads.unshift(newLead);
        localStorage.setItem('dubaiKharidLeads', JSON.stringify(existingLeads));
      } catch (err) {
        console.error('Failed to save checkout lead locally:', err);
      }

      if (!isCardSelected) {
        // RENDER 1: ONLINE BANK PORTAL (Simulated banking Shetab)
        if (onCartIncrement) {
          onCartIncrement(); // Empties the cart if checked out from cart page
        }
        // Redirect browser to Shetab online payment gate
        window.location.href = `/payment?amount=${totalTomanVal}&tracking=${tracking}&prodName=${encodeURIComponent(orderData.productName || orderData.name)}&customer=${encodeURIComponent(formData.name.trim())}&phone=${cleanPhone}&address=${encodeURIComponent(formData.address.trim())}&notes=${encodeURIComponent(formData.notes.trim())}`;
        return;
      }

      // RENDER 2: CARD TO CARD (Transition to Success / Bank Card details)
      setStep(4);
      if (onCartIncrement) {
        onCartIncrement(); // Empties the cart for card-to-card success
      }
    }, 1800);
  };

  const handleClose = () => {
    setStep(1);
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setErrors({});
    setPaymentMethod('gateway');
    setCopied(false);
    onClose();
  };

  const handleCopyCard = () => {
    navigator.clipboard.writeText('6037997512345678');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (price) => {
    return Math.round(price).toLocaleString('fa-IR');
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Close Button */}
        <button onClick={handleClose} className={styles.closeBtn} aria-label="بستن">
          ✕
        </button>

        {/* STEP 1: FORM INPUT */}
        {step === 1 && (
          <form onSubmit={handleFormSubmit} className={styles.form} dir="rtl">
            <div className={styles.modalHeader}>
              <span className={styles.airplaneIcon}>✈️</span>
              <h2>ثبت نهایی سفارش خرید از دبی</h2>
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
                <span>مبلغ قابل پرداخت:</span>
                <span className={styles.totalPrice}>{formatPrice(orderData.totalToman || (orderData.price * (orderData.category === 'laptops' ? 19500 : (parseFloat(settings.aedRate) || 19500))))} تومان</span>
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
                تأیید مشخصات و مرحله بعد
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
              <span className={styles.airplaneIcon}>💳</span>
              <h2 className={styles.paymentTitle}>انتخاب روش پرداخت سفارش</h2>
              <p>لطفاً یکی از دو روش پرداخت ایمن زیر را برای نهایی کردن سفارش انتخاب کنید.</p>
            </div>

            {/* Price Row */}
            <div className={styles.summaryCard} style={{ marginBottom: '20px' }}>
              <div className={styles.summaryPriceRow}>
                <span>مبلغ قابل پرداخت سفارش:</span>
                <span className={styles.totalPrice}>{formatPrice(orderData.totalToman || (orderData.price * (orderData.category === 'laptops' ? 19500 : (parseFloat(settings.aedRate) || 19500))))} تومان</span>
              </div>
            </div>

            {/* Methods list */}
            <div className={styles.paymentCards}>
              {/* Method 1: online Gateway */}
              <div 
                className={`${styles.paymentCard} ${paymentMethod === 'gateway' ? styles.paymentCardActive : ''}`}
                onClick={() => setPaymentMethod('gateway')}
              >
                <div className={styles.paymentCardIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div className={styles.paymentCardInfo}>
                  <div className={styles.paymentCardTitle}>درگاه پرداخت آنلاین شتاب</div>
                  <div className={styles.paymentCardDesc}>اتصال مستقیم به کلیه کارت‌های بانکی عضو شبکه شتاب</div>
                </div>
                <div className={styles.paymentRadio}>
                  <div className={styles.paymentRadioInner}></div>
                </div>
              </div>

              {/* Method 2: Card to Card */}
              <div 
                className={`${styles.paymentCard} ${paymentMethod === 'card' ? styles.paymentCardActive : ''}`}
                onClick={() => setPaymentMethod('card')}
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
              <button type="button" onClick={handlePaymentSubmit} className={styles.submitBtn}>
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

            <h2>پیش‌فاکتور سفارش شما با موفقیت ثبت شد!</h2>

            {/* Tracking Card */}
            <div className={styles.trackingCard}>
              <div className={styles.trackingLabel}>کد رهگیری پیش‌فاکتور شما:</div>
              <div className={styles.trackingCode}>{trackingCode}</div>
            </div>

            {/* Direct Bank Card Details for Card to Card transfer */}
            <div className={styles.bankDetailsBox}>
              <div className={styles.bankDetailsTitle}>💳 اطلاعات کارت فروشگاه جهت واریز کارت‌به‌کارت:</div>
              
              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>شماره کارت:</span>
                <div className={styles.cardNumBox}>
                  <span className={styles.cardNum}>۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸</span>
                  <button onClick={handleCopyCard} className={styles.copyBtn}>
                    {copied ? 'کپی شد! ✓' : 'کپی کارت'}
                  </button>
                </div>
              </div>

              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>نام بانک:</span>
                <span className={styles.bankValue}>بانک ملی ایران</span>
              </div>

              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>نام صاحب حساب:</span>
                <span className={styles.bankValue}>امین دبی خرید (مدیریت سیستم)</span>
              </div>

              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>مبلغ واریزی:</span>
                <span className={styles.bankValue} style={{ color: '#4ade80', fontSize: '1rem' }}>
                  {formatPrice(orderData.totalToman || (orderData.price * (orderData.category === 'laptops' ? 19500 : (parseFloat(settings.aedRate) || 19500))))} تومان
                </span>
              </div>
            </div>

            <p className={styles.successDesc} style={{ textAlign: 'right' }}>
              کاربر گرامی، سفارش شما با موفقیت در پنل مدیریت دبی خرید به ثبت رسید. لطفا مبلغ فوق را به شماره کارت درج شده واریز کرده و فیش واریزی را جهت نهایی‌سازی فاکتور و ارسال هوایی بار از دبی، نزد خود نگه دارید. کارشناسان ما حداکثر تا <strong>۳۰ دقیقه آینده</strong> با شما تماس خواهند گرفت.
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
