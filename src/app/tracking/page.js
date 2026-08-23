'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './Tracking.module.css';

const statusLabels = {
  pending: 'ثبت شده', pricing: 'در حال قیمت‌گذاری', paid: 'پرداخت شده', processing: 'در حال پردازش',
  purchased: 'خریداری شده', warehouse_dubai: 'انبار دبی', shipped: 'ارسال شده', delivered: 'تحویل شده', cancelled: 'لغو شده',
};

export default function TrackingPage() {
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/orders/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderCode, phone }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'پیگیری سفارش با خطا مواجه شد.');
      setResult(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main} dir="rtl">
        <section className={styles.panel}>
          <h1>پیگیری سفارش</h1>
          <p>شماره سفارش و شماره موبایلی که هنگام ثبت سفارش وارد کرده‌اید را بنویسید.</p>
          <form onSubmit={submit} className={styles.form}>
            <label>شماره سفارش<input value={orderCode} onChange={event => setOrderCode(event.target.value)} placeholder="DK-..." dir="ltr" /></label>
            <label>شماره موبایل<input value={phone} onChange={event => setPhone(event.target.value)} placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" /></label>
            <button disabled={loading}>{loading ? 'در حال بررسی...' : 'پیگیری سفارش'}</button>
          </form>
          {error && <div className={styles.error}>{error}</div>}
          {result && (
            <div className={styles.result}>
              <div><span>شماره سفارش</span><strong dir="ltr">{result.orderCode}</strong></div>
              <div><span>وضعیت</span><strong>{statusLabels[result.status] || result.status}</strong></div>
              <div><span>مبلغ ثبت‌شده</span><strong>{Number(result.totalToman || 0).toLocaleString('fa-IR')} تومان</strong></div>
              <div><span>وضعیت پرداخت</span><strong>{result.paymentStatus === 'success' ? 'تأیید شده' : 'در انتظار تأیید'}</strong></div>
              <div><span>مرسوله</span><strong>{result.shipment?.trackingCode || 'کد رهگیری ثبت نشده'}</strong></div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
