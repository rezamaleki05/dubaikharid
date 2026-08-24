'use client';

import { useEffect, useMemo, useState } from 'react';
import BankCard from './BankCard';
import styles from './ManualPayment.module.css';

const STATUS_LABELS = {
  pendingEmpty: 'در انتظار پرداخت و ارسال رسید',
  pendingReceipt: 'رسید ارسال شده — در انتظار بررسی',
  success: 'پرداخت تایید شد',
  failed: 'رسید/پرداخت تایید نشد',
  refunded: 'بازپرداخت شده',
};

export function paymentStatusLabel(payment) {
  if (!payment) return STATUS_LABELS.pendingEmpty;
  if (payment.status === 'pending') return payment.hasReceipt ? STATUS_LABELS.pendingReceipt : STATUS_LABELS.pendingEmpty;
  return STATUS_LABELS[payment.status] || STATUS_LABELS.pendingEmpty;
}

export default function ManualPaymentPanel({ orderCode, totalToman, access, uploadToken = null, onSkip = null, onSubmitted = null }) {
  const [payment, setPayment] = useState(access?.payment || null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const preview = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const statusText = useMemo(() => paymentStatusLabel(payment), [payment]);
  const canUpload = payment && ['pending', 'failed'].includes(payment.status);
  const whatsappUrl = access?.whatsapp
    ? `https://wa.me/${String(access.whatsapp).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`سلام، درباره پرداخت سفارش ${orderCode} پیام می‌دهم.`)}`
    : '';

  const submitReceipt = async () => {
    if (!file || !payment || busy) return;
    setBusy(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(payment.id)}/receipt`, {
        method: 'POST',
        headers: uploadToken ? { Authorization: `Bearer ${uploadToken}` } : {},
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ارسال رسید با خطا مواجه شد.');
      setPayment(payload.data);
      setSubmitted(true);
      onSubmitted?.(payload.data);
    } catch (uploadError) {
      setError(uploadError.message || 'ارسال رسید با خطا مواجه شد.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.panel} dir="rtl">
      <header className={styles.paymentHeader}>
        <div><span>شماره سفارش</span><strong dir="ltr">{orderCode}</strong></div>
        <div><span>مبلغ نهایی قابل پرداخت</span><strong>{Math.round(Number(totalToman || 0)).toLocaleString('fa-IR')} تومان</strong></div>
        <div><span>روش پرداخت</span><strong>کارت به کارت</strong></div>
      </header>

      <div className={`${styles.statusBanner} ${styles[payment?.status || 'pending']}`}>
        <span className={styles.statusDot} aria-hidden="true" />
        <strong>{statusText}</strong>
      </div>

      {payment?.rejectionReason && <div className={styles.rejection}><strong>دلیل رد:</strong> {payment.rejectionReason}</div>}

      {payment?.status !== 'success' && payment?.status !== 'refunded' && (
        <>
          {access?.bankAccount ? <BankCard account={access.bankAccount} /> : <div className={styles.notice}>حساب بانکی فعال هنوز توسط مدیریت تنظیم نشده است. لطفاً پیش از واریز با پشتیبانی هماهنگ کنید.</div>}
          <p className={styles.instruction}>لطفاً مبلغ سفارش را به حساب بالا واریز کرده و تصویر رسید پرداخت را ارسال کنید.</p>
        </>
      )}

      {canUpload && (
        <section className={styles.uploadSection}>
          <label className={styles.uploadLabel}>
            <span>{payment.hasReceipt ? 'جایگزینی رسید پرداخت' : 'آپلود رسید پرداخت'}</span>
            <small>JPG، PNG یا WEBP — حداکثر ۴ مگابایت</small>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { setFile(event.target.files?.[0] || null); setSubmitted(false); setError(''); }} />
          </label>
          {(preview || payment.hasReceipt) && (
            <div className={styles.receiptPreview}>
              <img src={preview || payment.receiptUrl} alt="پیش‌نمایش رسید پرداخت" />
              <span>{file?.name || payment.receiptOriginalName || 'رسید ثبت‌شده'}</span>
            </div>
          )}
          {error && <div className={styles.error} role="alert">{error}</div>}
          {submitted && <div className={styles.successMessage} role="status"><strong>رسید شما با موفقیت ارسال شد</strong><span>پرداخت شما در انتظار بررسی کارشناسان است.</span></div>}
          {file && !submitted && <button type="button" className={styles.primaryAction} onClick={submitReceipt} disabled={busy}>{busy ? 'در حال ارسال...' : 'ارسال رسید برای بررسی'}</button>}
        </section>
      )}

      <div className={styles.secondaryActions}>
        {onSkip && <button type="button" onClick={onSkip}>بعداً ارسال می‌کنم</button>}
        {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer">ارسال از طریق واتساپ</a>}
      </div>
    </div>
  );
}
