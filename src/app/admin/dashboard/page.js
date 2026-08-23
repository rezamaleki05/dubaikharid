'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';

const EMPTY_DASHBOARD = Object.freeze({
  summary: { todayRevenue: '0', monthNetCashFlow: '0', activeOrders: 0, pendingPayments: 0, activeCustomers: 0 },
  purchaseRequests: { pending: 0, priceTagged: 0, approved: 0, converted: 0 },
  shipments: { unshipped: 0, readyToShip: 0 },
  warehouse: { lowStock: 0 },
  laptops: { totalUnits: '0', availableUnits: '0', reservedUnits: null, soldUnits: null },
  alerts: { exchangeRateMissing: false },
  recentOrders: [],
  recentPayments: [],
});

function formatAmount(value) {
  try { return BigInt(String(value || '0')).toLocaleString('fa-IR'); } catch { return '۰'; }
}

function formatDate(value) {
  const date = new Date(value || '');
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fa-IR');
}

function DashboardContent() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/dashboard', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'دریافت اطلاعات داشبورد ناموفق بود.');
        setDashboard(body);
      })
      .catch(fetchError => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const setActiveTab = (tab) => {
    const route = ADMIN_ROUTES[tab];
    if (route) router.push(route);
  };

  if (loading) return <div className={styles.cardPanel} style={{ padding: '24px', color: '#8b92a5' }}>در حال بارگذاری اطلاعات داشبورد...</div>;
  if (error) return <div className={styles.cardPanel} style={{ padding: '24px', color: '#ef4444' }}>{error}</div>;

  return (
    <>
      {(() => {
            const pendingLeadsCount = dashboard.purchaseRequests.pending;
            const activeOrders = dashboard.summary.activeOrders;
            const readyToShipCount = dashboard.shipments.readyToShip;
            const unverifiedPaymentsCount = dashboard.summary.pendingPayments;
            const lowStockCount = dashboard.warehouse.lowStock;
            const unansweredCount = dashboard.purchaseRequests.pending;
            const actionItemsCount = pendingLeadsCount + readyToShipCount + unverifiedPaymentsCount + lowStockCount;
            const todayRevenue = dashboard.summary.todayRevenue;
            const monthProfit = dashboard.summary.monthNetCashFlow;
            const todayRevenuePositive = BigInt(todayRevenue || '0') > 0n;
            const monthProfitPositive = BigInt(monthProfit || '0') >= 0n;

            return (
            <div className={styles.dashboardResponsivePage} style={{ direction: 'rtl' }}>

              {/* ALERTS BANNER */}
              <div style={{ background: 'rgba(248,120,32,0.06)', border: '1px solid rgba(248,120,32,0.18)', borderRadius: '14px', padding: '14px 18px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: '#f87820' }}>{AdminIcons.alert(15)}</span>
                  <span style={{ fontWeight: '800', fontSize: '13px', color: '#f87820' }}>هشدارهای امروز</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    ...(dashboard.alerts.exchangeRateMissing ? [{ text: 'نرخ درهم به‌روزرسانی نشده', urgent: true, onClick: () => setActiveTab('settings') }] : []),
                    { text: `${dashboard.shipments.unshipped} سفارش ارسال‌نشده`, urgent: true, onClick: () => window.location.assign('/admin/shipments') },
                    { text: `${pendingLeadsCount} درخواست منتظر قیمت`, urgent: false, onClick: () => window.location.assign('/admin/leads?status=pending') },
                    { text: `${lowStockCount} محصول کم‌موجود`, urgent: false, onClick: () => window.location.assign('/admin/warehouse') },
                  ].map((item, i) => (
                    <div
                      key={i}
                      onClick={item.onClick}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '5px 14px', borderRadius: '20px', cursor: 'pointer',
                        background: item.urgent ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${item.urgent ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`,
                        color: item.urgent ? '#ef4444' : '#c0c8d8',
                        fontSize: '11.5px', fontWeight: '600', transition: 'opacity 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >
                      {item.urgent ? AdminIcons.alert(11) : AdminIcons.clock(11)} {item.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI CARDS */}
              <div className={styles.dashboardKpiGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'درآمد امروز', value: formatAmount(todayRevenue), unit: 'تومان', trend: todayRevenuePositive ? 'روند صعودی امروز' : 'بدون دریافتی امروز', trendUp: todayRevenuePositive, iconColor: '#f87820', iconBg: 'rgba(248,120,32,0.1)', onClick: () => setActiveTab('financial_reports'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
                  { label: 'سود ماه جاری', value: formatAmount(monthProfit), unit: 'تومان', trend: BigInt(monthProfit || '0') > 0n ? 'سوددهی مثبت' : 'بدون سود ثبت‌شده', trendUp: monthProfitPositive, iconColor: '#2ecc71', iconBg: 'rgba(46,204,113,0.1)', onClick: () => setActiveTab('financial_reports'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                  { label: 'سفارشات فعال', value: String(activeOrders), unit: 'سفارش', trend: 'فعال در جریان', trendUp: true, iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)', onClick: () => window.location.assign('/admin/orders'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                  { label: 'درخواست‌های فعال', value: String(pendingLeadsCount), unit: 'درخواست', trend: `${pendingLeadsCount} منتظر قیمت`, trendUp: false, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)', onClick: () => window.location.assign('/admin/leads?status=pending'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg> },
                  { label: 'پرداخت‌های در انتظار', value: String(unverifiedPaymentsCount), unit: 'تراکنش', trend: 'نیاز به تایید', trendUp: false, iconColor: '#a855f7', iconBg: 'rgba(168,85,247,0.1)', onClick: () => window.location.assign('/admin/payments'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
                  { label: 'مشتریان فعال', value: String(dashboard.summary.activeCustomers), unit: 'مشتری', trend: 'ثبت‌شده در سیستم', trendUp: true, iconColor: '#eab308', iconBg: 'rgba(234,179,8,0.1)', onClick: () => window.location.assign('/admin/customers'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                ].map((card, i) => (
                  <div key={i} className={styles.cardPanel} onClick={card.onClick}
                    style={{ padding: '16px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(248,120,32,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.backgroundColor = 'var(--admin-card-bg)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.iconColor }}>{card.icon}</div>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', textAlign: 'left' }}>{card.label}</span>
                    </div>
                    <strong style={{ fontSize: '20px', fontWeight: '900', color: '#fff', display: 'block', lineHeight: 1 }}>{card.value}</strong>
                    <span style={{ fontSize: '9px', color: '#8b92a5' }}>{card.unit}</span>
                    <div style={{ marginTop: '8px', fontSize: '9.5px', color: card.trendUp ? '#2ecc71' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {card.trendUp ? '▲' : '●'} {card.trend}
                    </div>
                  </div>
                ))}
              </div>

              {/* QUICK ACCESS */}
              <div className={styles.cardPanel} style={{ padding: '14px 20px', borderRadius: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '800', fontSize: '12px', color: '#8b92a5', whiteSpace: 'nowrap' }}>دسترسی سریع:</span>
                  {[
                    { label: 'ثبت سفارش', onClick: () => window.location.assign('/admin/leads') },
                    { label: 'افزودن محصول', onClick: () => window.location.assign('/admin/products') },
                    { label: 'افزودن لپ‌تاپ استوک', onClick: () => window.location.assign('/admin/laptops') },
                    { label: 'ثبت پرداخت', onClick: () => window.location.assign('/admin/payments') },
                    { label: 'ثبت ارسال', onClick: () => window.location.assign('/admin/shipments') },
                    { label: 'به‌روزرسانی نرخ درهم', onClick: () => setActiveTab('settings') },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.onClick}
                      style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#c0c8d8', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(248,120,32,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,120,32,0.3)'; e.currentTarget.style.color = '#f87820'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#c0c8d8'; }}
                    >{btn.label}</button>
                  ))}
                </div>
              </div>

              {/* MAIN GRID: Action Items + Orders */}
              <div className={styles.dashboardMainGrid} style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '18px', marginBottom: '18px' }}>

                {/* کارهای نیازمند اقدام */}
                <div className={`${styles.cardPanel} ${styles.dashboardOrdersCard}`} style={{ padding: '20px', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>کارهای نیازمند اقدام</span>
                    <span style={{ fontSize: '9px', background: 'rgba(248,120,32,0.15)', color: '#f87820', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>{actionItemsCount} مورد</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'درخواست‌های منتظر قیمت', count: pendingLeadsCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: AdminIcons.clock(13), onClick: () => window.location.assign('/admin/leads?status=pending') },
                      { label: 'سفارش‌های آماده ارسال', count: readyToShipCount, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', icon: AdminIcons.truck(13), onClick: () => window.location.assign('/admin/shipments') },
                      { label: 'پرداخت‌های تایید نشده', count: unverifiedPaymentsCount, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: AdminIcons.card(13), onClick: () => window.location.assign('/admin/payments') },
                      { label: 'محصولات کم‌موجود', count: lowStockCount, color: '#a855f7', bg: 'rgba(168,85,247,0.08)', icon: AdminIcons.alert(13), onClick: () => window.location.assign('/admin/warehouse') },
                      { label: 'درخواست‌های بدون پاسخ', count: unansweredCount, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', icon: AdminIcons.chat(13), onClick: () => window.location.assign('/admin/leads') },
                    ].map((item, i) => (
                      <div key={i} onClick={item.onClick}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', background: item.bg, border: `1px solid ${item.color}20`, transition: 'opacity 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: item.color }}>
                          {item.icon}
                          <span style={{ fontSize: '11.5px', color: '#c0c8d8', fontWeight: '600' }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: item.color }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* آخرین سفارشات */}
                <div className={styles.cardPanel} style={{ padding: '20px', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>آخرین سفارشات</span>
                    <button onClick={() => window.location.assign('/admin/orders')} style={{ padding: '5px 14px', fontSize: '10px', borderRadius: '8px', border: '1px solid rgba(248,120,32,0.4)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده همه</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 90px 80px', gap: '8px', padding: '4px 8px', marginBottom: '6px' }}>
                    {['شماره سفارش', 'مشتری', 'مبلغ', 'وضعیت', 'تاریخ', ''].map((h, i) => (
                      <span key={i} style={{ fontSize: '9.5px', color: '#8b92a5', fontWeight: '700' }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dashboard.recentOrders.map((order) => {
                      const stMap = {
                        pending: { label: 'در انتظار', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                        pricing: { label: 'قیمت‌گذاری', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
                        paid: { label: 'پرداخت شده', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' },
                        approved: { label: 'تایید شده', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' },
                        purchased: { label: 'خریداری', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
                        warehouse_dubai: { label: 'انبار دبی', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                        shipped: { label: 'ارسال شده', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' },
                        delivered: { label: 'تحویل شده', color: '#8b92a5', bg: 'rgba(139,146,165,0.1)' },
                        cancelled: { label: 'لغو شده', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                      };
                      const st = stMap[order.status] || { label: order.status, color: '#8b92a5', bg: 'rgba(139,146,165,0.1)' };
                      return (
                        <div key={order.id} onClick={() => window.location.assign('/admin/orders')}
                          style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 90px 80px', gap: '8px', alignItems: 'center', padding: '10px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(248,120,32,0.04)'; e.currentTarget.style.borderColor = 'rgba(248,120,32,0.15)'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'; }}
                        >
                          <span style={{ fontWeight: '700', fontSize: '11px', color: '#f87820' }}>#{order.orderCode}</span>
                          <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>{order.customerName}</span>
                          <span style={{ fontSize: '11px', color: '#c0c8d8' }}>{order.totalToman === null ? 'ثبت نشده' : `${formatAmount(order.totalToman)} ت`}</span>
                          <span style={{ fontSize: '9.5px', padding: '3px 8px', borderRadius: '6px', background: st.bg, color: st.color, fontWeight: '700' }}>{st.label}</span>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>{formatDate(order.createdAt)}</span>
                          <button style={{ padding: '4px 10px', fontSize: '9.5px', borderRadius: '6px', border: '1px solid rgba(248,120,32,0.3)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده ↩</button>
                        </div>
                      );
                    })}
                    {dashboard.recentOrders.length === 0 && (
                      <p style={{ color: '#8b92a5', fontSize: '11px', textAlign: 'center', padding: '16px' }}>سفارشی ثبت نشده است.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM GRID */}
              <div className={styles.dashboardBottomGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 210px', gap: '18px' }}>

                {/* درخواست‌های خرید */}
                <div className={styles.cardPanel} style={{ padding: '20px', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>درخواست‌های خرید</span>
                    <button onClick={() => window.location.assign('/admin/leads')} style={{ padding: '5px 14px', fontSize: '10px', borderRadius: '8px', border: '1px solid rgba(248,120,32,0.4)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده همه</button>
                  </div>
                  {[
                    { label: 'منتظر قیمت‌گذاری', count: dashboard.purchaseRequests.pending, color: '#f59e0b', desc: 'درخواست ارسال شده، قیمت‌گذاری نشده', onClick: () => window.location.assign('/admin/leads?status=pending') },
                    { label: 'قیمت ارسال شده', count: dashboard.purchaseRequests.priceTagged, color: '#a855f7', desc: 'در انتظار تایید مشتری', onClick: () => window.location.assign('/admin/leads?status=price_tagged') },
                    { label: 'منتظر تایید مشتری', count: dashboard.purchaseRequests.approved, color: '#06b6d4', desc: 'قیمت اعلام شده، تایید نشده', onClick: () => window.location.assign('/admin/leads?status=approved') },
                    { label: 'تبدیل به سفارش', count: dashboard.purchaseRequests.converted, color: '#2ecc71', desc: 'پرداخت شده و در جریان', onClick: () => window.location.assign('/admin/leads') },
                  ].map((stage, i) => (
                    <div key={i} onClick={stage.onClick}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = `${stage.color}10`; e.currentTarget.style.borderColor = `${stage.color}30`; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '4px', height: '36px', borderRadius: '4px', background: stage.color }} />
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#fff' }}>{stage.label}</div>
                          <div style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>{stage.desc}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '22px', fontWeight: '900', color: stage.color }}>{stage.count}</span>
                    </div>
                  ))}
                </div>

                {/* تراکنش‌های اخیر */}
                <div className={styles.cardPanel} style={{ padding: '20px', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>تراکنش‌های اخیر</span>
                    <button onClick={() => window.location.assign('/admin/payments')} style={{ padding: '5px 14px', fontSize: '10px', borderRadius: '8px', border: '1px solid rgba(248,120,32,0.4)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده همه</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dashboard.recentPayments.map((tx, i) => {
                      const typeKey = tx.status === 'success' ? 'success' : tx.status === 'pending' ? 'pending' : 'refund';
                      const ts = {
                        success: { color: '#2ecc71', bg: 'rgba(46,204,113,0.08)', label: 'موفق', icon: AdminIcons.check(11) },
                        pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'در انتظار', icon: AdminIcons.clock(11) },
                        refund: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'برگشتی', icon: AdminIcons.sync(11) }
                      }[typeKey] || { color: '#8b92a5', bg: 'rgba(139,146,165,0.08)', label: tx.status, icon: AdminIcons.info(11) };

                      return (
                        <div key={tx.id || i} onClick={() => { window.location.assign('/admin/payments'); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(248,120,32,0.15)'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ts.color }}>{ts.icon}</div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#fff' }}>{tx.type} #{tx.orderId || tx.id}</div>
                              <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '1px' }}>{formatAmount(tx.amount)} تومان</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '9.5px', padding: '3px 8px', borderRadius: '6px', background: ts.bg, color: ts.color, fontWeight: '700' }}>{ts.label}</span>
                        </div>
                      );
                    })}
                    {dashboard.recentPayments.length === 0 && (
                      <p style={{ color: '#8b92a5', fontSize: '11px', textAlign: 'center', padding: '10px' }}>تراکنی ثبت نشده است.</p>
                    )}
                  </div>
                </div>

                {/* موجودی لپ‌تاپ‌های استوک */}
                {(() => {
                  const availableCount = formatAmount(dashboard.laptops.availableUnits);
                  const reservedCount = dashboard.laptops.reservedUnits === null ? 'ثبت نشده' : `${formatAmount(dashboard.laptops.reservedUnits)} دستگاه`;
                  const soldCount = dashboard.laptops.soldUnits === null ? 'ثبت نشده' : `${formatAmount(dashboard.laptops.soldUnits)} دستگاه`;
                  return (
                    <div className={styles.cardPanel} onClick={() => window.location.assign('/admin/laptops')}
                      style={{ padding: '20px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(248,120,32,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(248,120,32,0.03)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.backgroundColor = 'var(--admin-card-bg)'; }}
                    >
                      <div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(248,120,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87820', marginBottom: '14px' }}>{AdminIcons.laptop(20)}</div>
                        <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>موجودی لپ‌تاپ‌های استوک</div>
                        <div style={{ fontSize: '52px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{formatAmount(dashboard.laptops.totalUnits)}</div>
                        <div style={{ fontSize: '12px', color: '#8b92a5', marginTop: '4px' }}>دستگاه</div>
                      </div>
                      <div style={{ marginTop: '16px' }}>
                        {[['موجود', `${availableCount} دستگاه`, '#2ecc71'], ['رزرو شده', reservedCount, '#f59e0b'], ['فروخته شده', soldCount, '#8b92a5']].map(([k, v, c]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '10px', color: '#8b92a5' }}>{k}</span>
                            <span style={{ fontSize: '10px', color: c, fontWeight: '700' }}>{v}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: '12px', textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(248,120,32,0.08)', border: '1px solid rgba(248,120,32,0.15)', color: '#f87820', fontSize: '11px', fontWeight: '700' }}>مشاهده کاتالوگ ↩</div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
            );
          })()}
    </>
  );
}

export default function DashboardPage() {
  return (
    <AdminShell activeTab="overview">
      <DashboardContent />
    </AdminShell>
  );
}
