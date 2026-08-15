'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { AdminIcons } from '@/components/admin/AdminIcons';
import styles from '@/app/admin/Admin.module.css';

const ROLE_LABELS = {
  SUPER_ADMIN: 'مدیر ارشد',
  ADMIN: 'مدیر',
  OPERATIONS: 'عملیات',
  FINANCE: 'مالی',
  CONTENT: 'محتوا',
};

const ROLES = Object.keys(ROLE_LABELS);

export default function AdminUsersPage() {
  const { admin: currentAdmin } = useAdminAccess();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetTargetId, setResetTargetId] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [form, setForm] = useState({ email: '', password: '', role: 'ADMIN' });

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/admin-users', { cache: 'no-store' });
      if (!response.ok) throw new Error('دریافت فهرست مدیران ناموفق بود.');
      setAdmins(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdmins();
  }, [loadAdmins]);

  const sendUpdate = async (id, body) => {
    setError('');
    setMessage('');
    const response = await fetch(`/api/admin/admin-users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'ثبت تغییر ناموفق بود.');
      return false;
    }
    setAdmins(items => items.map(item => item.id === result.id ? result : item));
    setMessage('تغییرات با موفقیت ذخیره شد.');
    return true;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const response = await fetch('/api/admin/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'ایجاد مدیر ناموفق بود.');
      return;
    }
    setAdmins(items => [...items, result]);
    setForm({ email: '', password: '', role: 'ADMIN' });
    setMessage('مدیر جدید با موفقیت ایجاد شد.');
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (await sendUpdate(resetTargetId, { password: resetPassword })) {
      setResetTargetId('');
      setResetPassword('');
    }
  };

  return (
    <AdminShell activeTab="admin_users">
      <div style={{ direction: 'rtl' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '0 0 6px' }}>
            {AdminIcons.user(20)} مدیریت مدیران سیستم
          </h1>
          <p style={{ fontSize: '12px', color: '#8b92a5', margin: 0 }}>ایجاد حساب، تعیین نقش و مدیریت وضعیت دسترسی مدیران</p>
        </div>

        {error && <div className={styles.loginError}>{error}</div>}
        {message && <div style={{ padding: '10px 14px', marginBottom: '18px', color: '#2ecc71', border: '1px solid rgba(46,204,113,.25)', background: 'rgba(46,204,113,.08)', borderRadius: '8px', fontSize: '12px' }}>{message}</div>}

        <form onSubmit={handleCreate} className={styles.cardPanel} style={{ padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', color: '#fff', margin: '0 0 16px' }}>افزودن مدیر جدید</h2>
          <div className={styles.adminManagementFormGrid}>
            <label style={{ fontSize: '11px', color: '#8b92a5' }}>ایمیل
              <input type="email" required value={form.email} onChange={event => setForm(value => ({ ...value, email: event.target.value }))} className={styles.loginInput} style={{ marginTop: '6px' }} />
            </label>
            <label style={{ fontSize: '11px', color: '#8b92a5' }}>رمز عبور
              <input type="password" required minLength="10" value={form.password} onChange={event => setForm(value => ({ ...value, password: event.target.value }))} className={styles.loginInput} style={{ marginTop: '6px' }} />
            </label>
            <label style={{ fontSize: '11px', color: '#8b92a5' }}>نقش
              <select value={form.role} onChange={event => setForm(value => ({ ...value, role: event.target.value }))} className={styles.loginInput} style={{ marginTop: '6px' }}>
                {ROLES.map(role => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
              </select>
            </label>
            <button type="submit" className={styles.loginBtn} style={{ width: 'auto', minWidth: '120px', margin: 0 }}>ایجاد حساب</button>
          </div>
        </form>

        <div className={styles.cardPanel} style={{ padding: '10px 18px' }}>
          {loading ? <p style={{ color: '#8b92a5' }}>در حال دریافت اطلاعات...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead><tr style={{ color: '#8b92a5', textAlign: 'right' }}><th style={{ padding: '12px' }}>ایمیل</th><th>نقش</th><th>وضعیت</th><th>تاریخ ایجاد</th><th>عملیات</th></tr></thead>
                <tbody>
                  {admins.map(item => (
                    <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,.06)', color: '#fff' }}>
                      <td style={{ padding: '14px 12px', direction: 'ltr', textAlign: 'right' }}>{item.email}{item.id === currentAdmin?.id ? ' (شما)' : ''}</td>
                      <td>
                        <select value={item.role} disabled={item.id === currentAdmin?.id} onChange={event => sendUpdate(item.id, { role: event.target.value })} className={styles.loginInput} style={{ width: '140px', padding: '7px 9px' }}>
                          {ROLES.map(role => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                        </select>
                      </td>
                      <td style={{ color: item.status === 'ACTIVE' ? '#2ecc71' : '#ef4444' }}>{item.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString('fa-IR')}</td>
                      <td style={{ display: 'flex', gap: '8px', padding: '10px 0' }}>
                        <button type="button" disabled={item.id === currentAdmin?.id} onClick={() => sendUpdate(item.id, { status: item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' })} className={styles.advFilterBtn}>{item.status === 'ACTIVE' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</button>
                        <button type="button" onClick={() => { setResetTargetId(item.id); setResetPassword(''); }} className={styles.advFilterBtn}>تغییر رمز</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {resetTargetId && (
          <div className={styles.modalOverlay} onClick={() => setResetTargetId('')}>
            <form onSubmit={handleResetPassword} className={styles.loginCard} onClick={event => event.stopPropagation()}>
              <h2 style={{ color: '#fff', fontSize: '16px' }}>تغییر رمز عبور مدیر</h2>
              <p>رمز جدید نمایش داده یا در گزارش فعالیت ذخیره نخواهد شد.</p>
              <input type="password" minLength="10" required autoFocus value={resetPassword} onChange={event => setResetPassword(event.target.value)} className={styles.loginInput} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className={styles.loginBtn}>ذخیره رمز جدید</button>
                <button type="button" onClick={() => setResetTargetId('')} className={styles.advFilterBtn}>انصراف</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
