'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import BankCard from '@/components/payment/BankCard';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import styles from './BankAccounts.module.css';

const EMPTY = { bankName: '', cardNumber: '', iban: '', accountHolderName: '', isActive: true, isDefault: false };

function BankAccountsContent() {
  const { can } = useAdminAccess();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({ cardPaymentEnabled: true, onlinePaymentEnabled: false });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const response = await fetch('/api/admin/bank-accounts', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'دریافت حساب‌ها انجام نشد.');
    setAccounts(payload.data || []);
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [accountsResponse, settingsResponse] = await Promise.all([
          fetch('/api/admin/bank-accounts', { cache: 'no-store' }),
          fetch('/api/admin/settings', { cache: 'no-store' }),
        ]);
        const [accountsPayload, settingsPayload] = await Promise.all([accountsResponse.json(), settingsResponse.json()]);
        if (!accountsResponse.ok) throw new Error(accountsPayload.error || 'دریافت حساب‌ها انجام نشد.');
        if (!settingsResponse.ok) throw new Error(settingsPayload.error || 'دریافت تنظیمات پرداخت انجام نشد.');
        setAccounts(accountsPayload.data || []);
        setPaymentSettings({
          cardPaymentEnabled: settingsPayload.data?.cardPaymentEnabled !== false,
          onlinePaymentEnabled: settingsPayload.data?.onlinePaymentEnabled === true,
        });
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    loadInitial();
  }, []);

  const updatePaymentSetting = async (key, value) => {
    setSettingsBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ذخیره تنظیمات پرداخت انجام نشد.');
      setPaymentSettings(current => ({ ...current, [key]: payload.data?.[key] === true }));
      setMessage('تنظیمات روش‌های پرداخت ذخیره شد.');
    } catch (err) { setError(err.message); } finally { setSettingsBusy(false); }
  };

  const submit = async event => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(editingId ? `/api/admin/bank-accounts/${encodeURIComponent(editingId)}` : '/api/admin/bank-accounts', {
        method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ذخیره حساب بانکی انجام نشد.');
      await load(); setForm(EMPTY); setEditingId(''); setMessage('اطلاعات حساب بانکی ذخیره شد.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const edit = account => { setEditingId(account.id); setForm({ bankName: account.bankName, cardNumber: account.cardNumber, iban: account.iban, accountHolderName: account.accountHolderName, isActive: account.isActive, isDefault: account.isDefault }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const patch = async (id, body) => {
    const response = await fetch(`/api/admin/bank-accounts/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'به‌روزرسانی انجام نشد.');
    await load();
  };

  const remove = async account => {
    if (!window.confirm(`حساب ${account.bankName} حذف شود؟`)) return;
    const response = await fetch(`/api/admin/bank-accounts/${encodeURIComponent(account.id)}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'حذف حساب انجام نشد.');
    await load();
  };

  return <div className={styles.page} dir="rtl">
    <header><div><h1>مدیریت حساب‌های بانکی</h1><p>مقصدهای امن پرداخت کارت‌به‌کارت مشتریان</p></div></header>
    {error && <div className={styles.error}>{error}</div>}{message && <div className={styles.success}>{message}</div>}
    <section className={styles.featureFlags} aria-label="تنظیمات روش‌های پرداخت">
      <div><strong>روش‌های پرداخت فروشگاه</strong><span>درگاه آنلاین تا زمان اتصال واقعی به شبکه پرداخت غیرفعال باقی می‌ماند.</span></div>
      <label><input type="checkbox" checked={paymentSettings.cardPaymentEnabled} disabled={settingsBusy || !can(ADMIN_PERMISSIONS.SETTINGS_EDIT)} onChange={event => updatePaymentSetting('cardPaymentEnabled', event.target.checked)} /><span>کارت به کارت</span></label>
      <label><input type="checkbox" checked={paymentSettings.onlinePaymentEnabled} disabled={settingsBusy || !can(ADMIN_PERMISSIONS.SETTINGS_EDIT)} onChange={event => updatePaymentSetting('onlinePaymentEnabled', event.target.checked)} /><span>درگاه آنلاین</span><small>{paymentSettings.onlinePaymentEnabled ? 'فعال' : 'به‌زودی'}</small></label>
    </section>
    {can(ADMIN_PERMISSIONS.SETTINGS_EDIT) && <form className={styles.form} onSubmit={submit}>
      <div className={styles.formTitle}><strong>{editingId ? 'ویرایش حساب بانکی' : 'افزودن حساب بانکی'}</strong><span>اطلاعات محرمانه بانکی مانند CVV2 یا رمز را وارد نکنید.</span></div>
      <label>نام بانک<input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} required /></label>
      <label>شماره کارت<input dir="ltr" inputMode="numeric" value={form.cardNumber} onChange={e => setForm({ ...form, cardNumber: e.target.value })} required /></label>
      <label>شماره شبا<input dir="ltr" value={form.iban} onChange={e => setForm({ ...form, iban: e.target.value })} placeholder="IR..." required /></label>
      <label>نام صاحب حساب<input value={form.accountHolderName} onChange={e => setForm({ ...form, accountHolderName: e.target.value })} required /></label>
      <div className={styles.checks}><label><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> فعال</label><label><input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked, isActive: e.target.checked ? true : form.isActive })} /> حساب پیش‌فرض</label></div>
      <div className={styles.actions}><button disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره حساب'}</button>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(EMPTY); }}>انصراف</button>}</div>
    </form>}
    <section className={styles.list}>
      {loading ? <div className={styles.empty}>در حال دریافت حساب‌ها...</div> : accounts.length === 0 ? <div className={styles.empty}>هنوز حساب بانکی ثبت نشده است.</div> : accounts.map(account => <article key={account.id} className={`${styles.account} ${!account.isActive ? styles.inactive : ''}`}>
        <BankCard account={account} />
        <footer><div><span className={account.isActive ? styles.activeBadge : styles.inactiveBadge}>{account.isActive ? 'فعال' : 'غیرفعال'}</span>{account.isDefault && <span className={styles.defaultBadge}>پیش‌فرض</span>}</div>{can(ADMIN_PERMISSIONS.SETTINGS_EDIT) && <div className={styles.rowActions}><button onClick={() => edit(account)}>ویرایش</button><button onClick={() => patch(account.id, { isActive: !account.isActive })}>{account.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</button>{!account.isDefault && account.isActive && <button onClick={() => patch(account.id, { isDefault: true })}>انتخاب پیش‌فرض</button>}<button className={styles.delete} onClick={() => remove(account).catch(err => setError(err.message))}>حذف</button></div>}</footer>
      </article>)}
    </section>
  </div>;
}

export default function BankAccountsPage() { return <AdminShell activeTab="bank_accounts"><BankAccountsContent /></AdminShell>; }
