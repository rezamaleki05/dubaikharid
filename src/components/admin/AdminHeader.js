import React from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from './AdminIcons';

export default function AdminHeader({
  leads = [],
  readNotifIds = [],
  setReadNotifIds,
  isNotificationsOpen,
  setIsNotificationsOpen,
  setActiveTab,
  setSelectedOrderId
}) {
  // Build dynamic notifications from real leads state (latest 5)
  const sortedLeads = [...leads].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const dynamicNotifs = sortedLeads.map(lead => ({
    id: lead.id,
    text: `سفارش ${lead.id} توسط ${lead.customerName} — ${lead.productName}`,
    time: (() => {
      const diff = Date.now() - new Date(lead.date).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (mins < 60) return `${mins} دقیقه پیش`;
      if (hours < 24) return `${hours} ساعت پیش`;
      return `${days} روز پیش`;
    })(),
    unread: !readNotifIds.includes(lead.id),
    status: lead.status,
    targetTab: 'leads',
    targetOrderId: lead.id
  }));
  const unreadCount = dynamicNotifs.filter(n => n.unread).length;
  const statusLabel = {
    pending: 'در انتظار',
    pricing: 'قیمت‌گذاری شده',
    paid: 'تایید شده',
    processing: 'در حال پردازش',
    price_tagged: 'قیمت‌گذاری شده',
    approved: 'تایید شده',
    purchased: 'خریداری شده',
    noon_dubai: 'نون دبی',
    warehouse_dubai: 'انبار دبی',
    shipped: 'ارسال شده',
    delivered: 'تحویل داده شده',
    cancelled: 'لغو شده'
  };

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
            {unreadCount > 0 && (
              <span className={styles.bellBadge}>{unreadCount}</span>
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
                  {AdminIcons.bell(13)} اعلان‌های سفارشات
                  {unreadCount > 0 && <span style={{ background: '#f87820', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '10px' }}>{unreadCount} جدید</span>}
                </span>
                <span
                  style={{ fontSize: '10px', color: '#f87820', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => { if (setReadNotifIds) setReadNotifIds(dynamicNotifs.map(n => n.id)); }}
                >
                  همه خوانده شد
                </span>
              </div>

              {/* Notifications list */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {dynamicNotifs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#8b92a5', fontSize: '12px' }}>اعلانی وجود ندارد</div>
                ) : dynamicNotifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (setActiveTab) setActiveTab(n.targetTab);
                      if (setSelectedOrderId) setSelectedOrderId(n.targetOrderId);
                      if (setReadNotifIds) setReadNotifIds(prev => [...new Set([...prev, n.id])]);
                      if (setIsNotificationsOpen) setIsNotificationsOpen(false);
                    }}
                    style={{
                      padding: '11px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      background: n.unread ? 'rgba(248,120,32,0.05)' : 'transparent',
                      transition: 'background 0.2s',
                      display: 'flex', alignItems: 'flex-start', gap: '10px'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = n.unread ? 'rgba(248,120,32,0.05)' : 'transparent'}
                  >
                    {/* Unread dot */}
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: n.unread ? '#f87820' : 'transparent', flexShrink: 0, marginTop: '5px', border: n.unread ? 'none' : '1px solid #3a3f50' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '11.5px', color: n.unread ? '#fff' : '#c0c8d8', lineHeight: '1.5', fontWeight: n.unread ? '600' : '400' }}>{n.text}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '9.5px', color: '#8b92a5' }}>{n.time}</span>
                        <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: '#c0c8d8' }}>{statusLabel[n.status] || n.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <span
                  style={{ fontSize: '11px', color: '#f87820', cursor: 'pointer', fontWeight: '600' }}
                  onClick={() => { if (setActiveTab) setActiveTab('leads'); if (setIsNotificationsOpen) setIsNotificationsOpen(false); }}
                >
                  مشاهده همه سفارشات
                </span>
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
