import React from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from './AdminIcons';
import ThemeSwitcher from '@/components/ThemeSwitcher';

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
        <ThemeSwitcher compact />
        <div className={styles.notificationRoot}>
          <button
            className={styles.iconControlBtn}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label="موارد نیازمند اقدام"
          >
            <span>{AdminIcons.bell(16)}</span>
            {actionableCount > 0 && (
              <span className={styles.bellBadge}>{actionableCount}</span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className={styles.notificationDropdown}>
              {/* Header */}
              <div className={styles.notificationHeader}>
                <span>
                  {AdminIcons.bell(13)} موارد نیازمند اقدام
                  {actionableCount > 0 && <span className={styles.notificationCount}>{actionableCount} مورد</span>}
                </span>
              </div>

              {/* Notifications list */}
              <div className={styles.notificationList}>
                {actionableItems.length === 0 ? (
                  <div className={styles.notificationEmpty}>مورد نیازمند اقدامی وجود ندارد</div>
                ) : actionableItems.map(item => (
                  <div
                    key={item.key}
                    onClick={() => {
                      if (setIsNotificationsOpen) setIsNotificationsOpen(false);
                      window.location.assign(item.href);
                    }}
                    className={styles.notificationItem}
                  >
                    <span className={styles.notificationDot} />
                    <div className={styles.notificationBody}>
                      <p>{item.label}</p>
                      <div className={styles.notificationMeta}>
                        <span>{item.description}</span>
                        <strong>{item.count}</strong>
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
