'use client';
import { useEffect, useState } from 'react';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { TELEGRAM_ERRORS } from '@/lib/telegram/domain';
import styles from './Telegram.module.css';

const LABELS = { PENDING: 'در انتظار', SENT: 'ارسال شد', FAILED: 'ناموفق' };
export default function ProductTelegramStatus({ productId }) {
  const { can } = useAdminAccess();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const url = '/api/admin/products/' + encodeURIComponent(productId) + '/telegram';
  async function refresh() {
    const response = await fetch(url, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'دریافت وضعیت تلگرام ناموفق بود.');
    setData(result);
  }
  useEffect(() => {
    let active = true;
    fetch(url, { cache: 'no-store' }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'دریافت وضعیت تلگرام ناموفق بود.');
      if (active) setData(result);
    }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [url]);
  const row = data?.publication;
  async function send(confirmed = false) {
    const confirmRepost = Boolean(row?.sentAt || row?.uncertain);
    if (confirmRepost && !confirmed) { setConfirming(true); return; }
    setConfirming(false);
    setBusy(true); setError('');
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedAttemptCount: row?.attemptCount || 0, confirmRepost }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ارسال ناموفق بود.');
      await refresh();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <section className={`${styles.panel} ${styles.product}`} aria-label="وضعیت انتشار تلگرام">
    <h3>تلگرام</h3>
    <p>وضعیت محصول ذخیره‌شده در سایت؛ ارسال تلگرام مستقل از ذخیره تغییرات این فرم است.</p>
    <div className={styles.status}><strong>{data ? (LABELS[row?.status] || 'ارسال نشده') : 'در حال بررسی…'}</strong>{row && <span>تعداد تلاش: {row.attemptCount.toLocaleString('fa-IR')}</span>}{row?.sentAt && <span>آخرین ارسال: {new Date(row.sentAt).toLocaleString('fa-IR')}</span>}</div>
    {row?.lastError && <p className={styles.notice} role="status">ارسال تلگرام ناموفق بود؛ وضعیت انتشار محصول در سایت تغییر نکرده است. {row.lastError}</p>}
    {row?.retryAfter && <p>زمان تلاش دوباره: {new Date(row.retryAfter).toLocaleString('fa-IR')}</p>}
    {data?.configuration?.code && <p>{TELEGRAM_ERRORS[data.configuration.code]}</p>}
    {data && !data.published && <p>برای ارسال به تلگرام، ابتدا محصول را در سایت منتشر و ذخیره کنید.</p>}
    <div className={styles.actions}>
      <button type="button" disabled={busy || !can(ADMIN_PERMISSIONS.PRODUCTS_EDIT) || !data?.published || Boolean(data?.configuration?.code)} onClick={() => send()}>{busy ? 'در حال ارسال…' : row?.status === 'SENT' ? 'ارسال مجدد' : row?.status === 'FAILED' ? 'ارسال مجدد به تلگرام' : row?.status === 'PENDING' ? 'پیگیری ارسال' : 'ارسال به تلگرام'}</button>
      <button type="button" disabled={busy} onClick={() => refresh().catch(error => setError(error.message))}>تازه‌سازی وضعیت</button>
    </div>
    {confirming && <div role="group" aria-label="تأیید ارسال دوباره"><p className={styles.notice}>این عملیات ممکن است پست تکراری ایجاد کند. ابتدا کانال را بررسی کنید؛ سپس ارسال دوباره را تأیید کنید.</p><div className={styles.actions}><button type="button" disabled={busy} onClick={() => send(true)}>کانال را بررسی کردم؛ ارسال دوباره</button><button type="button" disabled={busy} onClick={() => setConfirming(false)}>لغو ارسال دوباره</button></div></div>}
    {error && <p className={styles.notice} role="alert">{error}</p>}
  </section>;
}
