'use client';
import { useEffect, useState } from 'react';
import { LEAD_SETTING_KEYS, LEAD_ERRORS } from '@/lib/leadNotifications/domain';
import styles from './telegram/Telegram.module.css';
import leadStyles from './LeadNotificationSettings.module.css';

export default function LeadNotificationSettings({ values, onChange, onSave, canEdit, saving, loading }) {
  const [configuration, setConfiguration] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(null);
  useEffect(() => {
    let active = true;
    fetch('/api/admin/lead-notifications', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (active) setConfiguration(data);
    }).catch(() => { if (active) setNotice('دریافت وضعیت اعلان‌ها ناموفق بود.'); });
    return () => { active = false; };
  }, []);
  const disabled = !canEdit || busy || saving || loading;
  const change = (key, value) => { onChange({ ...values, [key]: value }); setConfiguration(null); };
  async function save() {
    setNotice(''); setConfirming(null);
    const saved = await onSave(Object.fromEntries(LEAD_SETTING_KEYS.map(key => [key,
      key === 'telegramLeadEnabled' ? Boolean(values[key]) : values[key] || ''])), 'تنظیمات اعلان لیدها ذخیره شد.');
    if (!saved) return;
    try {
      const response = await fetch('/api/admin/lead-notifications', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      setConfiguration(await response.json());
    } catch { setNotice('دریافت وضعیت اعلان‌ها ناموفق بود.'); }
  }
  async function test(action, confirmed = false) {
    if (action === 'test' && !confirmed) { setConfirming(true); return; }
    setBusy(true); setNotice(''); setConfirming(null);
    try {
      const response = await fetch('/api/admin/lead-notifications', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...(action === 'test' ? { confirm: true } : {}) }) });
      const result = await response.json();
      setNotice(result.code ? (LEAD_ERRORS[result.code] || 'آزمایش ناموفق بود.')
        : !response.ok ? 'آزمایش ناموفق بود.' : action === 'verify' ? 'گروه خصوصی و اجازه ارسال ربات تأیید شد؛ پیامی ارسال نشد.' : 'پیام آزمایشی توسط ارائه‌دهنده پذیرفته شد؛ تحویل نهایی را در مقصد بررسی کنید.');
    } catch { setNotice('آزمایش ناموفق بود؛ پیش از تکرار، مقصد را بررسی کنید.'); }
    finally { setBusy(false); }
  }
  const status = configuration
    ? (LEAD_ERRORS[configuration.code] || 'آماده بررسی اتصال گروه') : 'پس از تغییر تنظیمات، ابتدا ذخیره کنید.';
  const testDisabled = disabled || !configuration || Boolean(configuration.code);
  return <section className={styles.panel + ' ' + leadStyles.root} aria-labelledby="lead-notifications-title">
    <h2 id="lead-notifications-title">اعلان لیدها در تلگرام</h2>
    <p>لیدهای مشتریان به گروه خصوصی تیم ارسال می‌شوند و در کانال محصولات منتشر نمی‌شوند.</p>
    <div className={leadStyles.provider}>
      <h3>گروه خصوصی تیم</h3>
      <div className={styles.fields}>
        <label className={styles.toggle}><input type="checkbox" disabled={disabled} checked={Boolean(values.telegramLeadEnabled)} onChange={event => change('telegramLeadEnabled', event.target.checked)} />فعال‌سازی اعلان لیدها</label>
        <label className={styles.field}>Chat ID گروه لیدها<input dir="ltr" inputMode="text" maxLength={17} placeholder="-100…" disabled={disabled} value={values.telegramLeadChatId || ''} onChange={event => change('telegramLeadChatId', event.target.value)} /><small>شناسه عددی منفی گروه خصوصی؛ برای سوپرگروه معمولاً با ‎-100 شروع می‌شود. نام کاربری یا شناسه کانال مجاز نیست.</small></label>
      </div>
      <p>گروه «مشتری های دبی خرید» باید خصوصی باشد و ربات فروشگاه عضو آن باشد و اجازه ارسال داشته باشد. شناسه گروه را ذخیره و سپس اتصال را بررسی کنید. توکن فقط در سرور نگهداری می‌شود.</p>
      <p role="status">وضعیت اتصال: {status}</p>
      <div className={styles.actions}><button type="button" disabled={testDisabled} onClick={() => test('verify')}>بررسی اتصال گروه</button><button type="button" disabled={testDisabled} onClick={() => test('test')}>تست ارسال لید تلگرام</button></div>
    </div>
    <div className={styles.actions}><button type="button" disabled={disabled} onClick={save}>ذخیره تنظیمات اعلان لیدها</button></div>
    {confirming && <div role="group" aria-label="تأیید آزمایش گروه لیدها"><p>یک پیام آزمایشی ثابت و بدون اطلاعات مشتری فقط به گروه خصوصی ذخیره‌شده ارسال می‌شود.</p><div className={styles.actions}><button type="button" disabled={disabled} onClick={() => test('test', true)}>تأیید و ارسال آزمایش گروه</button><button type="button" disabled={busy} onClick={() => setConfirming(null)}>لغو</button></div></div>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
  </section>;
}
