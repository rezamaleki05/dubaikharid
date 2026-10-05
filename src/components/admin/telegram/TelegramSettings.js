'use client';
import { useEffect, useState } from 'react';
import { TELEGRAM_ERRORS } from '@/lib/telegram/domain';
import styles from './Telegram.module.css';

export default function TelegramSettings({ values, onChange, onSave, canEdit, saving, loading }) {
  const [configuration, setConfiguration] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(false);
  async function refresh() {
    const response = await fetch('/api/admin/telegram', { cache: 'no-store' });
    if (!response.ok) throw new Error('دریافت وضعیت اتصال ناموفق بود.');
    setConfiguration(await response.json());
  }
  useEffect(() => {
    let active = true;
    fetch('/api/admin/telegram', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (active) setConfiguration(result);
    }).catch(() => { if (active) setNotice('دریافت وضعیت اتصال ناموفق بود.'); });
    return () => { active = false; };
  }, []);
  async function save() {
    setNotice('');
    const saved = await onSave({ telegramEnabled: Boolean(values.telegramEnabled), telegramAutoPublishProducts: Boolean(values.telegramAutoPublishProducts), telegramChannel: values.telegramChannel || '' }, 'تنظیمات تلگرام ذخیره شد.');
    if (saved) { try { await refresh(); } catch (error) { setNotice(error.message); } }
  }
  async function test(action, confirmed = false) {
    if (action === 'test-message' && !confirmed) { setConfirming(true); return; }
    setConfirming(false);
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/admin/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...(action === 'test-message' ? { confirm: true } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'آزمایش اتصال ناموفق بود.');
      setNotice(action === 'test-message' ? 'پیام آزمایشی ارسال شد؛ می‌توانید آن را از کانال حذف کنید.' : 'اتصال برقرار است و ربات مجوز انتشار در کانال دارد.');
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }
  const disabled = !canEdit || busy || saving || loading;
  return <section className={styles.panel} aria-labelledby="telegram-settings-title">
    <h3 id="telegram-settings-title">تلگرام</h3>
    <p>انتشار محصولات در کانال فروشگاه. محصولات قبلی فقط با ارسال دستی منتشر می‌شوند.</p>
    <div className={styles.fields}>
      <label className={styles.toggle}><input type="checkbox" disabled={disabled} checked={Boolean(values.telegramEnabled)} onChange={event => onChange({ ...values, telegramEnabled: event.target.checked })} />فعال‌سازی تلگرام</label>
      <label className={styles.toggle}><input type="checkbox" disabled={disabled} checked={Boolean(values.telegramAutoPublishProducts)} onChange={event => onChange({ ...values, telegramAutoPublishProducts: event.target.checked })} />ارسال خودکار محصولات در اولین انتشار</label>
      <label className={styles.field}>کانال مقصد<input dir="ltr" placeholder="@channelusername" maxLength={40} disabled={disabled} value={values.telegramChannel || ''} onChange={event => onChange({ ...values, telegramChannel: event.target.value })} /><small>نام کاربری با @ یا شناسه عددی منفی کانال</small></label>
    </div>
    <div className={styles.actions}><button type="button" disabled={disabled} onClick={save}>{saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات تلگرام'}</button></div>
    <div className={styles.status}><span>ربات در سرور تنظیم شده: {configuration ? (configuration.configured ? 'بله' : 'خیر') : 'در حال بررسی…'}</span><span>وضعیت اتصال: {configuration ? (TELEGRAM_ERRORS[configuration.code] || 'آماده آزمایش') : 'در حال بررسی…'}</span></div>
    <p>آزمایش با کانال ذخیره‌شده انجام می‌شود. بررسی اتصال پیامی ارسال نمی‌کند؛ پیام آزمایشی نیاز به تأیید جداگانه دارد.</p>
    <div className={styles.actions}><button type="button" disabled={disabled || !configuration || Boolean(configuration.code)} onClick={() => test('test-connection')}>بررسی اتصال</button><button type="button" disabled={disabled || !configuration || Boolean(configuration.code)} onClick={() => test('test-message')}>ارسال پیام آزمایشی</button></div>
    {confirming && <div role="group" aria-label="تأیید پیام آزمایشی"><p className={styles.notice}>پیام «DubaiKharid Telegram Test» در کانال ذخیره‌شده ارسال می‌شود.</p><div className={styles.actions}><button type="button" disabled={disabled} onClick={() => test('test-message', true)}>تأیید و ارسال پیام آزمایشی</button><button type="button" disabled={busy} onClick={() => setConfirming(false)}>لغو پیام آزمایشی</button></div></div>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
  </section>;
}
