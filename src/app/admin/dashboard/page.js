'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { laptops } from '@/data/products';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell, { useAdminShellData } from '@/components/admin/AdminShell';

const INITIAL_PAYMENTS_SEED = [];
const INITIAL_LEADS_SEED = [];

function DashboardContent() {
  const router = useRouter();
  const { leads: sharedLeads } = useAdminShellData();
  const leads = Array.isArray(sharedLeads) ? sharedLeads : INITIAL_LEADS_SEED;
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dashboardUploadedProducts, setDashboardUploadedProducts] = useState([]);
  const [dashboardDeletedStaticLaptopIds, setDashboardDeletedStaticLaptopIds] = useState([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const readStoredArray = (key) => {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    setCustomers(readStoredArray('dubaiKharidCustomers'));
    setPayments(readStoredArray('dubaiKharidPayments'));
    setWarehouseProducts(readStoredArray('dubaiKharidWarehouseProducts'));
    setDashboardUploadedProducts(readStoredArray('dubaiKharidUploadedProducts'));
    setDashboardDeletedStaticLaptopIds(readStoredArray('dubaiKharidDeletedStaticLaptops'));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
      if (leads.length === 0) return;

      const savedPayments = localStorage.getItem('dubaiKharidPayments');
      let currentPayments = INITIAL_PAYMENTS_SEED;
      if (savedPayments) {
        try {
          const parsedPayments = JSON.parse(savedPayments);
          currentPayments = Array.isArray(parsedPayments) ? parsedPayments : INITIAL_PAYMENTS_SEED;
        } catch {
          currentPayments = INITIAL_PAYMENTS_SEED;
        }
      }

      let hasChanges = false;
      leads.forEach(lead => {
        // Check if this lead already has a payment transaction (matched by orderId)
        const exists = currentPayments.some(p => p.orderId === lead.id);
        if (!exists) {
          // Create new payment transaction
          const txnId = `TXN-${Math.floor(800000 + Math.random() * 200000)}`;
          const regDate = lead.date ? lead.date.slice(0, 10).replace(/-/g, '/') + ' - ' + new Date(lead.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '1403/03/20 - 12:00';

          const newPayment = {
            id: txnId,
            orderId: lead.id,
            recipient: lead.customerName,
            amount: lead.totalToman || 15000000,
            method: lead.paymentMethod === 'card' ? 'کارت به کارت' : 'درگاه شتاب',
            date: regDate,
            status: lead.status === 'approved' || lead.paymentStatus === 'paid' ? 'success' : 'pending',
            reference: `REF-${Math.floor(100000000 + Math.random() * 900000000)}`,
            account: lead.paymentMethod === 'card' ? '۶۰۳۷-۹۹**-**-۵۶۷۸ (بانک ملی)' : 'درگاه پرداخت آنلاین شتاب',
            phone: lead.phone || '09123456789',
            address: lead.address || 'تهران',
            productName: lead.productName || 'کالای سفارشی دبی',
            notes: lead.notes || 'تراکنش خودکار سفارش ثبت شده از سبد خرید'
          };

          currentPayments.unshift(newPayment);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setPayments(currentPayments);
        localStorage.setItem('dubaiKharidPayments', JSON.stringify(currentPayments));
      }
    }, [leads]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const getMergedCustomers = () => {
      let list = Array.isArray(customers) ? [...customers] : [];
      let websiteUsers = [];
      if (typeof window !== 'undefined') {
        try {
          const usersSaved = localStorage.getItem('dubaiKharidUsers');
          if (usersSaved) {
            const parsedUsers = JSON.parse(usersSaved);
            websiteUsers = Array.isArray(parsedUsers) ? parsedUsers : [];
          }
        } catch (e) {
          console.error('Error reading website users:', e);
        }
      }

      websiteUsers.forEach(user => {
        const userPhone = String(user?.phone || '');
        const idx = list.findIndex(c => String(c?.phone || '') === userPhone);

        // Calculate order count and total spend dynamically from leads
        const userLeads = (Array.isArray(leads) ? leads : []).filter(l => String(l?.phone || '') === userPhone);
        const orderCount = userLeads.length;
        const totalToman = userLeads.reduce((acc, curr) => acc + (parseFloat(curr.totalToman) || 0), 0);
        const maxOrder = userLeads.reduce((max, curr) => Math.max(max, parseFloat(curr.totalToman) || 0), 0);
        const avgOrder = orderCount > 0 ? Math.round(totalToman / orderCount) : 0;

        const mappedUser = {
          id: user?.id || `CUST-WEB-${userPhone}`,
          name: user?.name || 'نامشخص',
          phone: userPhone,
          email: user?.email || 'نامشخص',
          city: user?.city || 'تهران',
          totalToman: totalToman,
          orderCount: orderCount,
          status: user?.status || 'active',
          dateReg: user?.dateRegistered || user?.dateReg || '1403/01/01',
          group: user?.group || 'سایت',
          notes: user?.notes || 'کاربر ثبت‌نامی سایت',
          avatar: user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'نامشخص')}&backgroundColor=f87820&textColor=ffffff`,
          performance: {
            avgOrder: avgOrder || 0,
            lastOrder: userLeads[0]?.date || user?.dateRegistered || '1403/01/01',
            firstOrder: userLeads[userLeads.length - 1]?.date || user?.dateRegistered || '1403/01/01',
            maxOrder: maxOrder || 0
          }
        };

        if (idx !== -1) {
          list[idx] = {
            ...mappedUser,
            ...list[idx],
            totalToman: totalToman > 0 ? totalToman : (list[idx].totalToman || 0),
            orderCount: orderCount > 0 ? orderCount : (list[idx].orderCount || 0)
          };
        } else {
          list.push(mappedUser);
        }
      });

      return list;
    };

  const getMergedPayments = () => {
      let list = [...payments];

      // Create payment records dynamically from all orders that have paymentStatus === 'paid' or status in ['processing', 'purchased', 'warehouse_dubai', 'shipped', 'delivered']
      leads.forEach(order => {
        const isPaid = order.paymentStatus === 'paid' || !['pending', 'price_tagged', 'approved', 'new_order'].includes(order.status);
        if (isPaid) {
          const exists = list.some(p => p.orderId === order.id || p.id === `TXN-ORD-${order.id}`);
          if (!exists) {
            list.push({
              id: `TXN-ORD-${order.id}`,
              orderId: order.id,
              recipient: order.name,
              phone: order.phone,
              amount: parseFloat(order.totalToman) || 0,
              type: 'دریافتی',
              method: order.paymentMethod || 'درگاه بانکی',
              category: 'سفارشات',
              status: 'success',
              date: order.date || '1403/03/15',
              productName: order.items ? order.items.map(item => item.name).join(' + ') : 'خرید لپ‌تاپ'
            });
          }
        }
      });

      return list;
    };

  const getDashboardLaptops = () => {
      let merged = [...laptops].filter(product => !dashboardDeletedStaticLaptopIds.includes(product.id));
      const uploadedLaptops = dashboardUploadedProducts.filter(product => product?.category === 'electronics');

      uploadedLaptops.forEach(product => {
        const existingIndex = merged.findIndex(existing => existing.id === product.id);
        if (existingIndex !== -1) {
          merged[existingIndex] = product;
        } else {
          merged.unshift(product);
        }
      });

      return merged;
    };

  const setActiveTab = (tab) => {
    const route = ADMIN_ROUTES[tab];
    if (route) router.push(route);
  };

  return (
    <>
      {(() => {
            const pendingLeadsCount = leads.filter(l => l.status === 'pending').length;
            const activeOrders = leads.filter(l => l.status !== 'cancelled' && l.status !== 'delivered').length;
            const readyToShipCount = leads.filter(l => l.status === 'purchased' || l.status === 'warehouse_dubai').length;
            const unverifiedPaymentsCount = getMergedPayments().filter(p => p.status === 'pending').length;
            const lowStockCount = warehouseProducts.filter(product => (Number(product?.stock) || 0) < 3).length;
            const unansweredCount = leads.filter(l => l.status === 'pending').length;
            const actionItemsCount = pendingLeadsCount + readyToShipCount + unverifiedPaymentsCount + lowStockCount;

            const todayPersian = new Date().toLocaleDateString('fa-IR');
            const currentMonthPrefix = todayPersian.split('/').slice(0, 2).join('/');
            const todayRevenue = getMergedPayments()
              .filter(p => p.type === 'دریافتی' && p.status === 'success' && p.date && p.date.startsWith(todayPersian))
              .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const monthProfit = getMergedPayments()
              .filter(p => p.status === 'success' && p.date && p.date.startsWith(currentMonthPrefix))
              .reduce((sum, p) => p.type === 'پرداختی' ? sum - (Number(p.amount) || 0) : sum + (Number(p.amount) || 0), 0);

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
                    { text: 'نرخ درهم به‌روزرسانی نشده', urgent: true, onClick: () => setActiveTab('settings') },
                    { text: `${leads.filter(l => ['processing', 'purchased', 'noon_dubai', 'warehouse_dubai'].includes(l.status)).length} سفارش ارسال‌نشده`, urgent: true, onClick: () => window.location.assign('/admin/shipments') },
                    { text: `${pendingLeadsCount} درخواست منتظر قیمت`, urgent: false, onClick: () => window.location.assign('/admin/leads?status=pending') },
                    { text: `${warehouseProducts.filter(product => (Number(product?.stock) || 0) < 3).length} محصول کم‌موجود`, urgent: false, onClick: () => window.location.assign('/admin/warehouse') },
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
                  { label: 'درآمد امروز', value: todayRevenue.toLocaleString('fa-IR'), unit: 'تومان', trend: todayRevenue > 0 ? 'روند صعودی امروز' : 'بدون دریافتی امروز', trendUp: todayRevenue > 0, iconColor: '#f87820', iconBg: 'rgba(248,120,32,0.1)', onClick: () => setActiveTab('financial_reports'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
                  { label: 'سود ماه جاری', value: monthProfit.toLocaleString('fa-IR'), unit: 'تومان', trend: monthProfit > 0 ? 'سوددهی مثبت' : 'بدون سود ثبت‌شده', trendUp: monthProfit >= 0, iconColor: '#2ecc71', iconBg: 'rgba(46,204,113,0.1)', onClick: () => setActiveTab('financial_reports'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                  { label: 'سفارشات فعال', value: String(activeOrders), unit: 'سفارش', trend: 'فعال در جریان', trendUp: true, iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)', onClick: () => window.location.assign('/admin/leads'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                  { label: 'درخواست‌های فعال', value: String(pendingLeadsCount), unit: 'درخواست', trend: `${pendingLeadsCount} منتظر قیمت`, trendUp: false, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)', onClick: () => window.location.assign('/admin/leads?status=pending'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg> },
                  { label: 'پرداخت‌های در انتظار', value: String(getMergedPayments().filter(p => p.status === 'pending').length), unit: 'تراکنش', trend: 'نیاز به تایید', trendUp: false, iconColor: '#a855f7', iconBg: 'rgba(168,85,247,0.1)', onClick: () => window.location.assign('/admin/payments'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
                  { label: 'مشتریان فعال', value: String(getMergedCustomers().length), unit: 'مشتری', trend: 'ثبت‌شده در سیستم', trendUp: true, iconColor: '#eab308', iconBg: 'rgba(234,179,8,0.1)', onClick: () => window.location.assign('/admin/customers'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
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
                    <button onClick={() => window.location.assign('/admin/leads')} style={{ padding: '5px 14px', fontSize: '10px', borderRadius: '8px', border: '1px solid rgba(248,120,32,0.4)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده همه</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 90px 80px', gap: '8px', padding: '4px 8px', marginBottom: '6px' }}>
                    {['شماره سفارش', 'مشتری', 'مبلغ', 'وضعیت', 'تاریخ', ''].map((h, i) => (
                      <span key={i} style={{ fontSize: '9.5px', color: '#8b92a5', fontWeight: '700' }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[...leads].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7).map((order) => {
                      const stMap = {
                        pending: { label: 'در انتظار', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                        price_tagged: { label: 'قیمت‌گذاری', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
                        approved: { label: 'تایید شده', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' },
                        purchased: { label: 'خریداری', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
                        warehouse_dubai: { label: 'انبار دبی', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                        shipped: { label: 'ارسال شده', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' },
                        delivered: { label: 'تحویل شده', color: '#8b92a5', bg: 'rgba(139,146,165,0.1)' },
                        cancelled: { label: 'لغو شده', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                      };
                      const st = stMap[order.status] || { label: order.status, color: '#8b92a5', bg: 'rgba(139,146,165,0.1)' };
                      const d = new Date(order.date);
                      const dateStr = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
                      return (
                        <div key={order.id} onClick={() => window.location.assign(`/admin/leads?lead=${encodeURIComponent(String(order.id ?? ''))}`)}
                          style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 90px 80px', gap: '8px', alignItems: 'center', padding: '10px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(248,120,32,0.04)'; e.currentTarget.style.borderColor = 'rgba(248,120,32,0.15)'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'; }}
                        >
                          <span style={{ fontWeight: '700', fontSize: '11px', color: '#f87820' }}>#{order.id}</span>
                          <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>{order.customerName}</span>
                          <span style={{ fontSize: '11px', color: '#c0c8d8' }}>{(order.totalToman || 0).toLocaleString()} ت</span>
                          <span style={{ fontSize: '9.5px', padding: '3px 8px', borderRadius: '6px', background: st.bg, color: st.color, fontWeight: '700' }}>{st.label}</span>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>{dateStr}</span>
                          <button style={{ padding: '4px 10px', fontSize: '9.5px', borderRadius: '6px', border: '1px solid rgba(248,120,32,0.3)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده ↩</button>
                        </div>
                      );
                    })}
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
                    { label: 'منتظر قیمت‌گذاری', count: leads.filter(l => l.status === 'pending').length, color: '#f59e0b', desc: 'درخواست ارسال شده، قیمت‌گذاری نشده', onClick: () => window.location.assign('/admin/leads?status=pending') },
                    { label: 'قیمت ارسال شده', count: leads.filter(l => l.status === 'price_tagged').length, color: '#a855f7', desc: 'در انتظار تایید مشتری', onClick: () => window.location.assign('/admin/leads?status=price_tagged') },
                    { label: 'منتظر تایید مشتری', count: leads.filter(l => l.status === 'approved').length, color: '#06b6d4', desc: 'قیمت اعلام شده، تایید نشده', onClick: () => window.location.assign('/admin/leads?status=approved') },
                    { label: 'تبدیل به سفارش', count: leads.filter(l => ['purchased','warehouse_dubai','shipped','delivered'].includes(l.status)).length, color: '#2ecc71', desc: 'پرداخت شده و در جریان', onClick: () => window.location.assign('/admin/leads') },
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
                    {getMergedPayments().slice(0, 5).map((tx, i) => {
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
                              <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '1px' }}>{(Number(tx.amount) || 0).toLocaleString('fa-IR')} تومان</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '9.5px', padding: '3px 8px', borderRadius: '6px', background: ts.bg, color: ts.color, fontWeight: '700' }}>{ts.label}</span>
                        </div>
                      );
                    })}
                    {getMergedPayments().length === 0 && (
                      <p style={{ color: '#8b92a5', fontSize: '11px', textAlign: 'center', padding: '10px' }}>تراکنی ثبت نشده است.</p>
                    )}
                  </div>
                </div>

                {/* موجودی لپ‌تاپ‌های استوک */}
                {(() => {
                  const allLaptops = getDashboardLaptops();
                  const availableCount = allLaptops.filter(l => (l.stockStatus || 'available') === 'available').length;
                  const reservedCount = allLaptops.filter(l => l.stockStatus === 'reserved').length;
                  const soldCount = allLaptops.filter(l => l.stockStatus === 'sold').length;
                  return (
                    <div className={styles.cardPanel} onClick={() => window.location.assign('/admin/laptops')}
                      style={{ padding: '20px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(248,120,32,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(248,120,32,0.03)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.backgroundColor = 'var(--admin-card-bg)'; }}
                    >
                      <div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(248,120,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87820', marginBottom: '14px' }}>{AdminIcons.laptop(20)}</div>
                        <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>موجودی لپ‌تاپ‌های استوک</div>
                        <div style={{ fontSize: '52px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{allLaptops.length}</div>
                        <div style={{ fontSize: '12px', color: '#8b92a5', marginTop: '4px' }}>دستگاه</div>
                      </div>
                      <div style={{ marginTop: '16px' }}>
                        {[['موجود', `${availableCount} دستگاه`, '#2ecc71'], ['رزرو شده', `${reservedCount} دستگاه`, '#f59e0b'], ['فروخته شده', `${soldCount} دستگاه`, '#8b92a5']].map(([k, v, c]) => (
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
