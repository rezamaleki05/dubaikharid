import React from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from './AdminIcons';

export default function AdminHeader({
  alertSummary,
  isNotificationsOpen,
  setIsNotificationsOpen,
}) {
  const actionableItems = Array.isArray(alertSummary?.items) ? alertSummary.items : [];
  const actionableCount = Number(alertSummary?.counts?.total) > 0 ? Number(alertSummary.counts.total) : 0;

  return (
    <header className={styles.topHeader}>
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>{AdminIcons.search(14)}</span>
        <input type="text" placeholder="جستجو کنید..." className={styles.searchInput} />
      </div>
      
      <div className={styles.topRightControls}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            className={styles.iconControlBtn}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            style={{ position: 'relative' }}
          >
            <span>{AdminIcons.bell(16)}</span>
            {actionableCount > 0 && (
              <span className={styles.bellBadge}>{actionableCount}</span>
            )}
          </button>

          {isNotificationsOpen && (
            <div
              style={{
                position: 'absolute', top: '50px', left: '0', width: '340px',
                backgroundColor: '#11131a', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                zIndex: 999, direction: 'rtl', textAlign: 'right', overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {AdminIcons.bell(13)} موارد نیازمند اقدام
                  {actionableCount > 0 && <span style={{ background: '#f87820', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '10px' }}>{actionableCount} مورد</span>}
                </span>
              </div>

              {/* Notifications list */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {actionableItems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#8b92a5', fontSize: '12px' }}>مورد نیازمند اقدامی وجود ندارد</div>
                ) : actionableItems.map(item => (
                  <div
                    key={item.key}
                    onClick={() => {
                      if (setIsNotificationsOpen) setIsNotificationsOpen(false);
                      window.location.assign(item.href);
                    }}
                    style={{
                      padding: '11px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      background: 'rgba(248,120,32,0.035)',
                      transition: 'background 0.2s',
                      display: 'flex', alignItems: 'flex-start', gap: '10px'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(248,120,32,0.035)'}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f87820', flexShrink: 0, marginTop: '5px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#fff', lineHeight: '1.5', fontWeight: '650' }}>{item.label}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '9.5px', color: '#8b92a5' }}>{item.description}</span>
                        <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '6px', background: 'rgba(248,120,32,.12)', color: '#f87820' }}>{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
        
        <div className={styles.headerProfileBadge}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', marginLeft: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,120,32,0.15)', color: '#f87820' }}>{AdminIcons.user(16)}</div>
          <span>مدیر سایت</span>
        </div>
      </div>
    </header>
  );
}
