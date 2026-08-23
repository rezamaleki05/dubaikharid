'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { AdminIcons } from '@/components/admin/AdminIcons';
import styles from '@/app/admin/Admin.module.css';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ action: '', dateFrom: '', dateTo: '' });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    try {
      const response = await fetch(`/api/admin/activity-logs?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('دریافت گزارش فعالیت‌ها ناموفق بود.');
      setLogs(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs();
  }, [loadLogs]);

  return (
    <AdminShell activeTab="activity_logs">
      <div style={{ direction: 'rtl' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '0 0 6px' }}>{AdminIcons.chart(20)} گزارش فعالیت مدیران</h1>
          <p style={{ fontSize: '12px', color: '#8b92a5', margin: 0 }}>۱۰۰ رویداد اخیر امنیتی و مدیریتی</p>
        </div>

        <div className={`${styles.cardPanel} ${styles.adminManagementFormGrid}`} style={{ padding: '16px', marginBottom: '18px' }}>
          <label style={{ fontSize: '11px', color: '#8b92a5' }}>نوع فعالیت
            <input value={filters.action} onChange={event => setFilters(value => ({ ...value, action: event.target.value }))} placeholder="مثال: ADMIN_LOGIN" className={styles.loginInput} style={{ marginTop: '6px' }} />
          </label>
          <label style={{ fontSize: '11px', color: '#8b92a5' }}>از تاریخ
            <input type="date" value={filters.dateFrom} onChange={event => setFilters(value => ({ ...value, dateFrom: event.target.value }))} className={styles.loginInput} style={{ marginTop: '6px' }} />
          </label>
          <label style={{ fontSize: '11px', color: '#8b92a5' }}>تا تاریخ
            <input type="date" value={filters.dateTo} onChange={event => setFilters(value => ({ ...value, dateTo: event.target.value }))} className={styles.loginInput} style={{ marginTop: '6px' }} />
          </label>
          <button type="button" onClick={loadLogs} className={styles.advFilterBtn}>بروزرسانی</button>
        </div>

        {error && <div className={styles.loginError}>{error}</div>}
        <div className={styles.cardPanel} style={{ padding: '10px 18px', overflowX: 'auto' }}>
          {loading ? <p style={{ color: '#8b92a5' }}>در حال دریافت گزارش...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead><tr style={{ color: '#8b92a5', textAlign: 'right' }}><th style={{ padding: '12px' }}>تاریخ</th><th>مدیر</th><th>فعالیت</th><th>موجودیت</th><th>جزئیات</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderTop: '1px solid rgba(255,255,255,.06)', color: '#fff' }}>
                    <td style={{ padding: '13px 12px', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString('fa-IR')}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{log.admin?.email || 'سیستم'}</td>
                    <td style={{ color: '#f87820', fontWeight: '700' }}>{log.action}</td>
                    <td>{log.entityType ? `${log.entityType}${log.entityId ? ` / ${log.entityId}` : ''}` : '—'}</td>
                    <td style={{ maxWidth: '280px', color: '#c0c8d8' }}>{log.metadata ? JSON.stringify(log.metadata) : '—'}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{log.ipAddress || '—'}</td>
                  </tr>
                ))}
                {!logs.length && <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#8b92a5' }}>فعالیتی ثبت نشده است.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
