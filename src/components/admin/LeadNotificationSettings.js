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
      key.endsWith('Enabled') ? Boolean(values[key]) : values[key] || ''])), 'تنظیمات اعلان لیدها ذخیره شد.');
    if (!saved) return;
    try {
      const response = await fetch('/api/admin/lead-notifications', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      setConfiguration(await response.json());
    } catch { setNotice('دریافت وضعیت اعلان‌ها ناموفق بود.'); }
  }
  async function test(provider, action, confirmed = false) {
    if (action === 'test' && !confirmed) { setConfirming(provider); return; }
    setBusy(true); setNotice(''); setConfirming(null);
    try {
      const response = await fetch('/api/admin/lead-notifications', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, action, ...(action === 'test' ? { confirm: true } : {}) }) });
      const result = await response.json();
      setNotice(result.code ? (LEAD_ERRORS[result.code] || 'آزمایش ناموفق بود.')
        : !response.ok ? 'آزمایش ناموفق بود.' : action === 'verify' ? 'گفت‌وگوی شخصی تأیید شد؛ پیامی ارسال نشد.' : 'پیام آزمایشی توسط ارائه‌دهنده پذیرفته شد؛ تحویل نهایی را در مقصد بررسی کنید.');
    } catch { setNotice('آزمایش ناموفق بود؛ پیش از تکرار، مقصد را بررسی کنید.'); }
    finally { setBusy(false); }
  }
  const status = provider => configuration?.[provider]
    ? `${LEAD_ERRORS[configuration[provider].configurationCode] || (configuration[provider].configured ? 'اتصال سرور تنظیم شده' : 'اتصال سرور تنظیم نشده')} · ${LEAD_ERRORS[configuration[provider].code] || 'آماده بررسی'}`
    : 'وضعیت تنظیمات ذخیره‌شده؛ پس از تغییر، ابتدا ذخیره کنید.';
  const testDisabled = provider => disabled || !configuration || Boolean(configuration[provider]?.code);
  return <section className={`${styles.panel} ${leadStyles.root}`} aria-labelledby="lead-notifications-title">
    <h2 id="lead-notifications-title">اعلان لیدها</h2>
    <p>درخواست‌های خرید و سفارش‌های جدید فقط به مقصد شخصی مالک ارسال می‌شوند. کانال تلگرام محصولات مقصد لیدها نیست.</p>
    <div className={leadStyles.provider}>
      <h3>تلگرام شخصی برای لیدها</h3>
      <div className={styles.fields}>
        <label className={styles.toggle}><input type="checkbox" disabled={disabled} checked={Boolean(values.telegramLeadsEnabled)} onChange={event => change('telegramLeadsEnabled', event.target.checked)} />فعال‌سازی اعلان لید تلگرام</label>
        <label className={styles.field}>شناسه چت شخصی تلگرام<input dir="ltr" inputMode="numeric" maxLength={16} placeholder="123456789" disabled={disabled} value={values.telegramLeadChatId || ''} onChange={event => change('telegramLeadChatId', event.target.value)} /><small>فقط شناسه عددی مثبت حساب مالک؛ نام کاربری، کانال و گروه مجاز نیست.</small></label>
      </div>
      <p>ابتدا ربات فروشگاه را در تلگرام باز کنید و Start را بزنید. شناسه عددی حساب شخصی خود را از ابزار مورد اعتماد دریافت کنید، ذخیره کنید و سپس گفت‌وگو را بررسی کنید. توکن ربات فقط در سرور نگهداری می‌شود.</p>
      <p role="status">{status('telegram')}</p>
      <div className={styles.actions}><button type="button" disabled={testDisabled('telegram')} onClick={() => test('telegram', 'verify')}>بررسی چت شخصی</button><button type="button" disabled={testDisabled('telegram')} onClick={() => test('telegram', 'test')}>آزمایش اعلان خصوصی تلگرام</button></div>
    </div>
    <div className={leadStyles.provider}>
      <h3>واتساپ مالک برای لیدها</h3>
      <div className={styles.fields}>
        <label className={styles.toggle}><input type="checkbox" disabled={disabled} checked={Boolean(values.whatsappLeadsEnabled)} onChange={event => change('whatsappLeadsEnabled', event.target.checked)} />فعال‌سازی اعلان لید واتساپ</label>
        <label className={styles.field}>شماره واتساپ مالک<input dir="ltr" inputMode="tel" maxLength={40} placeholder="+971…" disabled={disabled} value={values.whatsappLeadRecipient || ''} onChange={event => change('whatsappLeadRecipient', event.target.value)} /><small>شماره بین‌المللی مالک با رضایت دریافت اعلان؛ مستقل از شماره پشتیبانی مشتریان.</small></label>
        <label className={styles.field}>نام قالب تأییدشده Meta<input dir="ltr" maxLength={100} placeholder="owner_lead_notification" disabled={disabled} value={values.whatsappLeadTemplate || ''} onChange={event => change('whatsappLeadTemplate', event.target.value)} /></label>
        <label className={styles.field}>زبان قالب<input dir="ltr" maxLength={6} placeholder="fa" disabled={disabled} value={values.whatsappLeadTemplateLanguage || ''} onChange={event => change('whatsappLeadTemplateLanguage', event.target.value)} /></label>
      </div>
      <p>ارائه‌دهنده: Meta WhatsApp Cloud API. اعلان خودکار فقط با قالب تأییدشده دارای ۸ پارامتر متنی ارسال می‌شود: نوع، نام، تماس، محصول/سفارش، مبلغ، پیام، منبع/لینک و زمان. تأیید قالب در Meta لازم است؛ ذخیره نام قالب به معنی تأیید آن نیست.</p>
      <p role="status">{status('whatsapp')}</p>
      <div className={styles.actions}><button type="button" disabled={testDisabled('whatsapp')} onClick={() => test('whatsapp', 'test')}>آزمایش اعلان واتساپ مالک</button></div>
    </div>
    <div className={styles.actions}><button type="button" disabled={disabled} onClick={save}>ذخیره تنظیمات اعلان لیدها</button></div>
    {confirming && <div role="group" aria-label="تأیید آزمایش اعلان مالک"><p>یک پیام آزمایشی بدون اطلاعات مشتری به مقصد شخصی ذخیره‌شده {confirming === 'telegram' ? 'تلگرام' : 'واتساپ'} ارسال می‌شود.</p><div className={styles.actions}><button type="button" disabled={disabled} onClick={() => test(confirming, 'test', true)}>تأیید و ارسال آزمایش مالک</button><button type="button" disabled={busy} onClick={() => setConfirming(null)}>لغو</button></div></div>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
  </section>;
}
