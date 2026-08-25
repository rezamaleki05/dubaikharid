'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import MinimalIcon from '@/components/ui/MinimalIcon';
import styles from './CheckoutModal.module.css';

const EMPTY_FORM = Object.freeze({ name: '', phone: '', address: '', notes: '' });

function toEnglishDigits(value) {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(value || '')
    .replace(/[۰-۹]/g, digit => farsiDigits.indexOf(digit))
    .replace(/[٠-٩]/g, digit => arabicDigits.indexOf(digit));
}

export default function QuickPurchaseRequestModal({ isOpen, requestData, onClose }) {
  const { currentUser, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('form');
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);
  const idempotencyKeyRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = 'unset';
      return undefined;
    }
    idempotencyKeyRef.current ||= crypto.randomUUID();
    document.body.style.overflow = 'hidden';
    if (currentUser) {
      Promise.resolve().then(() => setFormData(current => ({
        ...current,
        name: current.name || currentUser.name || '',
        phone: current.phone || currentUser.phone || '',
        address: current.address || currentUser.address || currentUser.defaultAddress || '',
      })));
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [currentUser, isOpen]);

  if (!isOpen || !requestData) return null;

  const estimatedToman = Math.max(0, Number(requestData.totalToman) || 0);

  const handleInputChange = event => {
    const { name, value } = event.target;
    setFormData(current => ({ ...current, [name]: value }));
    if (errors[name]) setErrors(current => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    const phone = toEnglishDigits(formData.phone).replace(/\s+/g, '');
    if (!formData.name.trim()) nextErrors.name = 'نام و نام خانوادگی الزامی است';
    if (!phone) nextErrors.phone = 'شماره موبایل الزامی است';
    else if (!/^(?:09|\+989|989|00989)\d{9}$/.test(phone)) nextErrors.phone = 'شماره موبایل معتبر نیست (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)';
    if (!formData.address.trim()) nextErrors.address = 'آدرس تحویل الزامی است';
    setErrors(nextErrors);
    return { valid: Object.keys(nextErrors).length === 0, phone };
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (submittingRef.current) return;
    const validation = validate();
    if (!validation.valid) return;
    submittingRef.current = true;
    setPhase('loading');
    setSubmitError('');
    try {
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKeyRef.current },
        body: JSON.stringify({
          customer: {
            name: formData.name.trim(),
            phone: validation.phone,
            address: formData.address.trim(),
          },
          productUrl: requestData.link,
          productName: requestData.productName,
          sourceStore: requestData.store || 'فروشگاه دبی',
          priceAed: Math.max(0, Number(requestData.priceAed) || 0),
          weight: Math.max(0, Number(requestData.weight) || 0),
          quantity: 1,
          notes: formData.notes.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ثبت درخواست خرید با خطا مواجه شد.');
      setResult({
        requestCode: payload.data.requestCode,
        status: payload.data.status,
        productName: requestData.productName,
        productUrl: requestData.link,
      });
      setPhase('success');
    } catch (error) {
      submittingRef.current = false;
      setSubmitError(error.message || 'ثبت درخواست خرید با خطا مواجه شد.');
      setPhase('form');
    }
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setPhase('form');
    setSubmitError('');
    setResult(null);
    idempotencyKeyRef.current = null;
    submittingRef.current = false;
    onClose();
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="ثبت درخواست خرید خارجی">
      <div className={styles.modalContainer}>
        <button type="button" onClick={handleClose} className={styles.closeBtn} aria-label="بستن">
          <MinimalIcon name="x" size={19} />
        </button>

        {phase === 'form' && (
          <form onSubmit={handleSubmit} className={styles.form} dir="rtl">
            <div className={styles.modalHeader}>
              <span className={styles.airplaneIcon}><MinimalIcon name="clipboard" size={34} weight="thin" /></span>
              <h2>ثبت درخواست خرید از دبی</h2>
              <p>اطلاعات تماس و تحویل را ثبت کنید تا کارشناسان قیمت واقعی محصول را بررسی کنند.</p>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>برآورد اولیه</div>
              <div className={styles.summaryDetails}>
                <span className={styles.prodName}>{requestData.productName}</span>
                <a href={requestData.link} target="_blank" rel="noopener noreferrer" className={styles.prodBrand} dir="ltr" style={{ overflowWrap: 'anywhere' }}>{requestData.link}</a>
              </div>
              <div className={styles.summaryPriceRow}>
                <span>مبلغ تخمینی:</span>
                <span className={styles.totalPrice}>{Math.round(estimatedToman).toLocaleString('fa-IR')} تومان</span>
              </div>
              <p className={styles.successDesc} style={{ margin: '10px 0 0' }}>مبلغ نهایی پس از بررسی کارشناسان دبی خرید اعلام می‌شود.</p>
            </div>

            <div className={styles.formFields}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>نام و نام خانوادگی:</label>
                <input name="name" value={formData.name} onChange={handleInputChange} className={`${styles.input} ${errors.name ? styles.inputError : ''}`} />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>شماره موبایل:</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} className={`${styles.input} ${errors.phone ? styles.inputError : ''}`} dir="ltr" />
                {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>آدرس تحویل در ایران:</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`} />
                {errors.address && <span className={styles.errorText}>{errors.address}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>توضیحات محصول (رنگ، سایز و سایر موارد):</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" className={styles.textarea} />
              </div>
            </div>

            {submitError && <div role="alert" className={styles.errorText} style={{ marginBottom: '12px' }}>{submitError}</div>}
            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn}>ثبت درخواست خرید</button>
              <button type="button" onClick={handleClose} className={styles.cancelBtn}>انصراف</button>
            </div>
          </form>
        )}

        {phase === 'loading' && (
          <div className={styles.loadingContainer} dir="rtl">
            <div className={styles.loaderSpinner} />
            <h3>در حال ثبت درخواست خرید...</h3>
            <p>در این مرحله هیچ سفارش یا پرداختی ایجاد نمی‌شود.</p>
          </div>
        )}

        {phase === 'success' && result && (
          <div className={styles.successContainer} dir="rtl">
            <div className={styles.successCircle}><MinimalIcon name="check" size={38} weight="bold" /></div>
            <h2>درخواست شما با موفقیت ثبت شد</h2>
            <div className={styles.trackingCard}>
              <div className={styles.trackingLabel}>کد درخواست:</div>
              <div className={styles.trackingCode}>{result.requestCode}</div>
            </div>
            <div className={styles.summaryCard} style={{ width: '100%', textAlign: 'right' }}>
              <div className={styles.prodName}>{result.productName}</div>
              <a href={result.productUrl} target="_blank" rel="noopener noreferrer" className={styles.prodBrand} dir="ltr" style={{ overflowWrap: 'anywhere' }}>{result.productUrl}</a>
              <div style={{ marginTop: '10px', color: '#f87820', fontSize: '13px' }}>وضعیت: {result.status === 'pending' ? 'در انتظار بررسی قیمت' : result.status}</div>
            </div>
            <p className={styles.successDesc}>
              کارشناسان دبی خرید قیمت نهایی را بررسی می‌کنند.<br />
              پس از قیمت‌گذاری، مبلغ نهایی در حساب کاربری شما نمایش داده می‌شود.<br />
              تا قبل از اعلام قیمت نهایی، نیازی به پرداخت نیست.
            </p>
            <div className={styles.actions} style={{ width: '100%' }}>
              {isLoggedIn && <Link href="/profile" className={styles.doneBtn}>مشاهده درخواست‌های من</Link>}
              <button type="button" onClick={handleClose} className={styles.cancelBtn}>بستن</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
