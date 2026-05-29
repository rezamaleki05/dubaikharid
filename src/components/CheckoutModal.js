'use client';

import { useState, useEffect } from 'react';
import styles from './CheckoutModal.module.css';

export default function CheckoutModal({ isOpen, orderData, onClose, onCartIncrement }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1 = Form, 2 = Loading, 3 = Success
  const [trackingCode, setTrackingCode] = useState('');

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
      newErrors.phone = 'شماره موبایل معتبر نیست (نمونه: ۰۹۱۲۳۴۵۶۷۸۹ یا +۹۸۹۱۲۳۴۵۶۷۸۹)';
    }
    
    if (!formData.address.trim()) newErrors.address = 'آدرس تحویل الزامی است';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanPhone = toEnglishDigits(formData.phone.trim().replace(/\s+/g, ''));

    // Transition to loading step
    setStep(2);

    // Simulate database insertion and payment gateway handshake
    setTimeout(() => {
      // Generate standard random tracking code
      const randNum = Math.floor(10000 + Math.random() * 90000);
      const tracking = `DKHARID-${randNum}`;
      setTrackingCode(tracking);

      // Save order lead to localStorage for Admin Panel
      try {
        const existingLeads = JSON.parse(localStorage.getItem('dubaiKharidLeads') || '[]');
        const newLead = {
          id: tracking,
          customerName: formData.name.trim(),
          phone: cleanPhone,
          address: formData.address.trim(),
          notes: formData.notes.trim(),
          productName: orderData.productName || orderData.name || 'کالای سفارشی دبی',
          brand: orderData.brand || 'سفارشی',
          weight: orderData.weight || 0.5,
          totalToman: orderData.totalToman || ((orderData.price || 0) * 19500),
          priceAed: orderData.priceAed || orderData.price || 0,
          date: new Date().toISOString(),
          status: 'pending', // 'pending' = در انتظار بررسی, 'contacted' = تماس گرفته شده, etc.
          items: orderData.items || null
        };
        existingLeads.unshift(newLead);
        localStorage.setItem('dubaiKharidLeads', JSON.stringify(existingLeads));
      } catch (err) {
        console.error('Failed to save checkout lead locally:', err);
      }

      setStep(3);
      if (onCartIncrement) {
        onCartIncrement();
      }
    }, 1800);
  };

  const handleClose = () => {
    setStep(1);
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setErrors({});
    onClose();
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
          <form onSubmit={handleSubmit} className={styles.form}>
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
                <span className={styles.totalPrice}>{formatPrice(orderData.totalToman)} تومان</span>
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
                  placeholder="مثال: رضا احمدی"
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
                تأیید و ثبت نهایی سفارش خرید دبی
              </button>
              <button type="button" onClick={handleClose} className={styles.cancelBtn}>
                انصراف
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SIMULATED GATEWAY LOADING */}
        {step === 2 && (
          <div className={styles.loadingContainer}>
            <div className={styles.loaderSpinner}></div>
            <h3>در حال ثبت اطلاعات و هماهنگی خرید از دبی...</h3>
            <p>لطفاً شکیبا باشید. اطلاعات پیش‌فاکتور شما در حال اتصال به سرور مرکزی خرید است.</p>
          </div>
        )}

        {/* STEP 3: SUCCESS ANIMATION SCREEN */}
        {step === 3 && (
          <div className={styles.successContainer}>
            {/* Animated Checkmark Circle */}
            <div className={styles.successCircle}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2>سفارش شما با موفقیت در دبی ثبت شد!</h2>
            
            {/* Tracking Card */}
            <div className={styles.trackingCard}>
              <div className={styles.trackingLabel}>کد رهگیری پیش‌فاکتور شما:</div>
              <div className={styles.trackingCode}>{trackingCode}</div>
            </div>

            <p className={styles.successDesc}>
              کارشناسان دبی خرید ظرف حداکثر <strong>۳۰ دقیقه آینده</strong> جهت هماهنگی نهایی خرید، تأیید رنگ/سایز و صدور فاکتور نهایی و نحوه پرداخت ایمن با شماره تلفن <strong>{formData.phone}</strong> تماس خواهند گرفت.
            </p>

            <div className={styles.successBadges}>
              <div className={styles.badgeItem}>🛡️ خرید تضمینی</div>
              <div className={styles.badgeItem}>📦 تحویل قطعی درب منزل</div>
              <div className={styles.badgeItem}>✈️ کارگو اختصاصی هوایی</div>
            </div>

            <button type="button" onClick={handleClose} className={styles.doneBtn}>
              فهمیدم، بازگشت به فروشگاه
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
