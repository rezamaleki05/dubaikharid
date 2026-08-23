'use client';

import React, { useDeferredValue, useEffect, useState } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
const getSafeDateLabel = (value, includeTime = false) => {
  const parsedDate = new Date(value || '');
  if (Number.isNaN(parsedDate.getTime())) return '';
  return includeTime ? parsedDate.toLocaleString('fa-IR') : parsedDate.toLocaleDateString('fa-IR');
};

function OrdersContent({ onOrdersChange }) {
  const { can } = useAdminAccess();
  const [leads, setLeads] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activePaymentFilter, setActivePaymentFilter] = useState('all');
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [isCustomerInfoExpanded, setIsCustomerInfoExpanded] = useState(true);
  const [leadSearch, setLeadSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [statusCounts, setStatusCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingActionId, setPendingActionId] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const deferredSearch = useDeferredValue(leadSearch.trim());

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
    });
    if (deferredSearch) params.set('search', deferredSearch);
    if (activeStatusFilter !== 'all') params.set('status', activeStatusFilter);
    if (activePaymentFilter !== 'all') params.set('paymentMethod', activePaymentFilter);
    if (activeDateFilter !== 'all') {
      const today = new Date();
      const formatDate = date => date.toISOString().slice(0, 10);
      if (activeDateFilter === 'today') {
        params.set('from', formatDate(today));
        params.set('to', formatDate(today));
      } else if (activeDateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        params.set('from', formatDate(yesterday));
        params.set('to', formatDate(yesterday));
      } else if (activeDateFilter === 'this-month') {
        params.set('from', formatDate(new Date(today.getFullYear(), today.getMonth(), 1)));
        params.set('to', formatDate(today));
      }
    }

    async function loadOrders() {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/orders?${params}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'دریافت سفارش‌ها با خطا مواجه شد.');
        const nextOrders = Array.isArray(payload.data) ? payload.data : [];
        setLeads(nextOrders);
        onOrdersChange(nextOrders);
        setPagination(payload.pagination);
        setStatusCounts(payload.statusCounts || {});
        setSelectedOrderId(current => nextOrders.some(order => order.id === current) ? current : nextOrders[0]?.id || null);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setLeads([]);
          onOrdersChange([]);
          setError(loadError.message || 'دریافت سفارش‌ها با خطا مواجه شد.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadOrders();
    return () => controller.abort();
  }, [activeDateFilter, activePaymentFilter, activeStatusFilter, deferredSearch, onOrdersChange, pagination.limit, pagination.page, refreshToken]);

  const fmtToman = (value) => {
    const numericValue = Number.parseFloat(value);
    return Math.round(Number.isFinite(numericValue) ? numericValue : 0).toLocaleString('fa-IR');
  };

  const getWhatsAppLink = (lead) => {
    let cleanPhone = String(lead?.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) cleanPhone = `98${cleanPhone.slice(1)}`;

    const message = `سلام ${String(lead?.customerName || '')} عزیز،\nپیش‌فاکتور خرید شما در سایت «دبی خرید» ثبت گردید.\n\n📦 سفارش شما: ${String(lead?.productName || '')}\n💰 مبلغ کل: ${fmtToman(lead?.totalToman)} تومان\n📍 آدرس تحویل: ${String(lead?.address || '')}\n\nجهت هماهنگی نهایی خرید، تأیید رنگ/سایز و صدور فاکتور در خدمت شما هستیم.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  const updateOrder = async (leadId, body) => {
    setPendingActionId(leadId);
    setError('');
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(leadId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'به‌روزرسانی سفارش با خطا مواجه شد.');
      setLeads(current => current.map(order => order.id === leadId ? payload : order));
      setRefreshToken(current => current + 1);
      return payload;
    } catch (updateError) {
      setError(updateError.message || 'به‌روزرسانی سفارش با خطا مواجه شد.');
      return null;
    } finally {
      setPendingActionId(null);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    if (!can(ADMIN_PERMISSIONS.ORDERS_EDIT)) return;
    await updateOrder(leadId, { status: newStatus });
  };

  const handleDeleteLead = async (leadId) => {
    if (!can(ADMIN_PERMISSIONS.ORDERS_DELETE)) return;
    if (!confirm('آیا از لغو این سفارش مطمئن هستید؟')) return;
    setPendingActionId(leadId);
    setError('');
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(leadId)}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'لغو سفارش با خطا مواجه شد.');
      setRefreshToken(current => current + 1);
    } catch (cancelError) {
      setError(cancelError.message || 'لغو سفارش با خطا مواجه شد.');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleUpdateNotes = async (selectedLead) => {
    if (!can(ADMIN_PERMISSIONS.ORDERS_EDIT)) return;
    const note = prompt('یادداشت داخلی جدید خود را وارد کنید:', String(selectedLead?.adminNotes || ''));
    if (note === null) return;
    await updateOrder(selectedLead.id, { adminNotes: note });
  };

  const getStatusStyle = (status) => {
    const stylesMap = {
      pending: { label: 'در انتظار بررسی', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
      pricing: { label: 'قیمت‌گذاری شده', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
      paid: { label: 'تایید شده', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      processing: { label: 'در حال پردازش', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
      purchased: { label: 'در نون دبی', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      warehouse_dubai: { label: 'در انبار دبی', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
      shipped: { label: 'ارسال شده', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
      delivered: { label: 'تحویل شده', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      cancelled: { label: 'لغو شده', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    };
    return stylesMap[status] || stylesMap.pending;
  };

  const filteredOrders = leads;
  const totalStatusCount = Object.values(statusCounts).reduce((total, count) => total + Number(count || 0), 0);

  const statCards = [
    { key: 'cancelled', label: 'لغو شده', count: statusCounts.cancelled || 0, icon: AdminIcons.close(18), color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    { key: 'delivered', label: 'تحویل شده', count: statusCounts.delivered || 0, icon: AdminIcons.check(18), color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { key: 'shipped', label: 'ارسال شده', count: statusCounts.shipped || 0, icon: AdminIcons.truck(18), color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    { key: 'warehouse_dubai', label: 'در انبار دبی', count: statusCounts.warehouse_dubai || 0, icon: AdminIcons.building(18), color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
    { key: 'purchased', label: 'در نون دبی', count: statusCounts.purchased || 0, icon: AdminIcons.package(18), color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { key: 'processing', label: 'در حال پردازش', count: statusCounts.processing || 0, icon: AdminIcons.clock(18), color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { key: 'all', label: 'همه سفارشات', count: totalStatusCount, icon: AdminIcons.clipboard(18), color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' }
  ];

  const selectedLead = filteredOrders.find(lead => lead?.id === selectedOrderId) || filteredOrders[0];

  return (
    <div>
      <div className={styles.sectionHeader} style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>
            {AdminIcons.card(22)} سفارشات خرید از دبی
          </h1>
          <p className={styles.sectionDesc} style={{ fontSize: '12px', color: '#8b92a5' }}>
            مدیریت و پیگیری سفارشات نهایی و پرداخت شده مشتریان، وضعیت‌های ارسال و تحویل
          </p>
        </div>
      </div>

      <div className={styles.statOrdersRow}>
        {statCards.map((card) => {
          const isActive = activeStatusFilter === card.key;
          return (
            <div
              key={card.key}
              className={`${styles.statOrdersCard} ${isActive ? styles.statOrdersCardActive : ''}`}
              onClick={() => {
                setActiveStatusFilter(card.key);
                setPagination(current => ({ ...current, page: 1 }));
              }}
            >
              <div
                className={styles.statOrdersCardIcon}
                style={{
                  color: card.color,
                  backgroundColor: isActive ? 'transparent' : card.bg,
                  border: isActive ? `1px solid ${card.color}` : 'none'
                }}
              >
                {card.icon}
              </div>
              <div className={styles.statOrdersMeta}>
                <span className={styles.statOrdersLabel}>{card.label}</span>
                <div className={styles.statOrdersCountRow}>
                  <span className={styles.statOrdersCount}>{card.count}</span>
                  <span className={styles.statOrdersSub}>سفارش</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.splitWorkspaceGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className={styles.ordersFilterBar}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
              background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '14px', padding: '12px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1, maxWidth: '350px' }}>
              <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', right: '12px', color: '#8b92a5', fontSize: '12px' }}>{AdminIcons.search(12)}</span>
                <input
                  type="text"
                  placeholder="جستجو کنید..."
                  value={leadSearch}
                  onChange={(event) => {
                    setLeadSearch(event.target.value);
                    setPagination(current => ({ ...current, page: 1 }));
                  }}
                  style={{
                    width: '100%', background: '#11131a', border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px', padding: '8px 34px 8px 12px', color: '#fff',
                    fontSize: '12px', fontFamily: 'inherit', outline: 'none', transition: 'all 0.25s'
                  }}
                  onFocus={(event) => { event.target.style.borderColor = 'rgba(248, 120, 32, 0.4)'; }}
                  onBlur={(event) => { event.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={activeStatusFilter}
                onChange={(event) => {
                  setActiveStatusFilter(event.target.value);
                  setPagination(current => ({ ...current, page: 1 }));
                }}
                style={{
                  background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb',
                  padding: '8px 12px', borderRadius: '10px', fontSize: '11.5px', fontWeight: '700',
                  fontFamily: 'inherit', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار بررسی</option>
                <option value="pricing">قیمت‌گذاری شده</option>
                <option value="paid">تایید شده</option>
                <option value="processing">در حال پردازش</option>
                <option value="warehouse_dubai">در انبار دبی</option>
                <option value="purchased">در نون دبی</option>
                <option value="shipped">ارسال شده</option>
                <option value="delivered">تحویل شده</option>
                <option value="cancelled">لغو شده</option>
              </select>

              <select
                value={activePaymentFilter}
                onChange={(event) => {
                  setActivePaymentFilter(event.target.value);
                  setPagination(current => ({ ...current, page: 1 }));
                }}
                style={{
                  background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb',
                  padding: '8px 12px', borderRadius: '10px', fontSize: '11.5px', fontWeight: '700',
                  fontFamily: 'inherit', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="all">همه روش‌های پرداخت</option>
                <option value="gateway">درگاه بانکی</option>
                <option value="card">کارت به کارت</option>
              </select>

              <select
                value={activeDateFilter}
                onChange={(event) => {
                  setActiveDateFilter(event.target.value);
                  setPagination(current => ({ ...current, page: 1 }));
                }}
                style={{
                  background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb',
                  padding: '8px 12px', borderRadius: '10px', fontSize: '11.5px', fontWeight: '700',
                  fontFamily: 'inherit', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="all">همه تاریخ‌ها</option>
                <option value="today">امروز</option>
                <option value="yesterday">دیروز</option>
                <option value="this-month">این ماه</option>
              </select>

              <button
                style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb',
                  padding: '8px 12px', borderRadius: '10px', fontSize: '11.5px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                {AdminIcons.sliders(12)} فیلتر پیشرفته
              </button>
            </div>
          </div>

          <div className={styles.tableContainer} style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', overflow: 'hidden' }}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>شماره سفارش</th>
                  <th>مشتری</th>
                  <th>وضعیت</th>
                  <th>مبلغ (تومان)</th>
                  <th>روش پرداخت</th>
                  <th>تاریخ ثبت</th>
                  <th style={{ textAlign: 'left', paddingLeft: '20px' }}>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr key="loading-orders">
                    <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>در حال دریافت سفارش‌ها...</td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr key="empty-orders">
                    <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>
                      {error || (leadSearch || activeStatusFilter !== 'all' || activePaymentFilter !== 'all' ? 'هیچ موردی با فیلترهای کنونی یافت نشد.' : 'سفارشی ثبت نشده است')}
                    </td>
                  </tr>
                ) : filteredOrders.map((lead) => {
                  const isSelected = selectedOrderId === lead.id;
                  const statusSpec = getStatusStyle(lead.status);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedOrderId(lead.id)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(248, 120, 32, 0.06)' : 'transparent',
                        borderRight: isSelected ? '3px solid #f87820' : '3px solid transparent',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <td style={{ fontWeight: '800', fontFamily: 'monospace', color: '#ff9d00', fontSize: '12px' }}>{lead.orderCode}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '750', color: '#fff', fontSize: '12.5px' }}>{lead.customerName || ''}</span>
                          <span style={{ fontSize: '10.5px', color: '#8b92a5', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{lead.phone || ''}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '10.5px', fontWeight: '750',
                            color: statusSpec.color, backgroundColor: statusSpec.bg, display: 'inline-block'
                          }}
                        >
                          {statusSpec.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: '850', color: '#fff', fontSize: '13px' }}>
                        {fmtToman(lead.totalToman)} <span style={{ fontSize: '10px', color: '#8b92a5', fontWeight: 'normal' }}>T</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={styles.paymentDot} style={{ backgroundColor: lead.paymentMethod === 'gateway' ? '#10b981' : '#f59e0b' }} />
                          <span style={{ fontSize: '11px', fontWeight: '700' }}>{lead.paymentMethod === 'gateway' ? 'درگاه بانکی' : 'کارت به کارت'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '11px', color: '#8b92a5' }}>{getSafeDateLabel(lead.date)}</td>
                      <td style={{ textAlign: 'left', paddingLeft: '20px' }} onClick={(event) => event.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <a
                            href={getWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderRadius: '6px',
                              padding: '5px 8px', fontSize: '10.5px', fontWeight: '700',
                              textDecoration: 'none', display: 'inline-flex', alignItems: 'center'
                            }}
                          >
                            {AdminIcons.whatsapp(12)}
                          </a>
                          {can(ADMIN_PERMISSIONS.ORDERS_DELETE) && <button
                            onClick={() => handleDeleteLead(lead.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }}
                            disabled={pendingActionId === lead.id || lead.status === 'cancelled'}
                            title="لغو سفارش"
                          >
                            {AdminIcons.trash(12)}
                          </button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.pagerContainer}>
            <div className={styles.pagerBtns}>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, index) => index + 1).map(pageNumber => (
                <button
                  key={pageNumber}
                  className={`${styles.pagerBtn} ${pagination.page === pageNumber ? styles.pagerBtnActive : ''}`}
                  onClick={() => setPagination(current => ({ ...current, page: pageNumber }))}
                >
                  {pageNumber}
                </button>
              ))}
              {pagination.totalPages > 5 && <button className={styles.pagerBtn} disabled>...</button>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#8b92a5' }}>
              <span>نمایش {pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total} نتیجه</span>
              <select
                value={String(pagination.limit)}
                onChange={(event) => setPagination(current => ({ ...current, page: 1, limit: Number(event.target.value) }))}
                style={{
                  background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb',
                  padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer'
                }}
              >
                <option value="8">۸ ردیف</option>
                <option value="15">۱۵ ردیف</option>
                <option value="30">۳۰ ردیف</option>
              </select>
            </div>
          </div>
        </div>

        {selectedLead ? (
          <div className={styles.detailsContainer}>
            <div className={styles.detailsHeader}>
              <div className={styles.detailsTitleRow}>
                <span className={styles.detailsTitle}>جزئیات سفارش</span>
                <span
                  style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '9.5px', fontWeight: '750',
                    color: getStatusStyle(selectedLead.status).color,
                    backgroundColor: getStatusStyle(selectedLead.status).bg
                  }}
                >
                  {getStatusStyle(selectedLead.status).label}
                </span>
              </div>
              <div className={styles.detailsOrderCodeRow}>
                <span className={styles.detailsOrderCode}>{selectedLead.orderCode}</span>
                <span
                  onClick={() => {
                    navigator.clipboard.writeText(String(selectedLead.orderCode || ''));
                    alert('کد سفارش کپی شد!');
                  }}
                  style={{ fontSize: '12px', color: '#8b92a5', cursor: 'pointer', userSelect: 'none' }}
                  title="کپی شناسه"
                >
                  {AdminIcons.clipboard(18)}
                </span>
              </div>
              <div className={styles.detailsDate}>ثبت شده در: {getSafeDateLabel(selectedLead.date, true)}</div>
            </div>

            <div className={styles.detailsCollapsible}>
              <div className={styles.detailsSectionHeader} onClick={() => setIsCustomerInfoExpanded(previous => !previous)}>
                <h3>{AdminIcons.user(16)} اطلاعات خریدار</h3>
                <span className={styles.detailsArrowIcon} style={{ transform: isCustomerInfoExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </div>

              {isCustomerInfoExpanded && (
                <div className={styles.detailsCollapsibleBody}>
                  <div className={styles.customerAvatarBox}>
                    <div className={styles.customerAvatar} aria-hidden="true" style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                      {(selectedLead.customerName || 'م').trim().charAt(0)}
                    </div>
                    <div className={styles.customerMeta}>
                      <span className={styles.customerName}>{selectedLead.customerName || ''}</span>
                      <span className={styles.customerPhone} style={{ direction: 'ltr' }}>{selectedLead.phone || ''}</span>
                    </div>
                  </div>

                  <div className={styles.customerDetailsList}>
                    <div className={styles.customerDetailItem}>
                      <span className={styles.customerDetailLabel}>آدرس تحویل:</span>
                      <span className={styles.customerDetailValue} style={{ maxWidth: '170px', textAlign: 'left', wordBreak: 'break-word', whiteSpace: 'normal', color: '#f3f4f6' }}>
                        {selectedLead.address || ''}
                      </span>
                    </div>
                    <div className={styles.customerDetailItem} style={{ borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '6px', marginTop: '4px' }}>
                      <span className={styles.customerDetailLabel}>ایمیل:</span>
                      <span className={styles.customerDetailValue} style={{ fontFamily: 'monospace', color: '#d1d5db' }}>
                        {selectedLead.email || ''}
                      </span>
                    </div>
                    <div className={styles.customerDetailItem} style={{ borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '6px', marginTop: '4px' }}>
                      <span className={styles.customerDetailLabel}>وضعیت خریدار:</span>
                      <span
                        style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold',
                          background: selectedLead.isRequest ? 'rgba(248,120,32,0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: selectedLead.isRequest ? '#f87820' : '#10b981'
                        }}
                      >
                        {selectedLead.isRequest ? 'سفارش آنلاین سایت' : 'تایید شده'}
                      </span>
                    </div>
                    {selectedLead.notes && (
                      <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                        <span style={{ display: 'block', fontSize: '9.5px', color: '#f87820', fontWeight: 'bold', marginBottom: '2px' }}>{AdminIcons.edit(13)} توضیحات مشتری:</span>
                        <p style={{ margin: 0, fontSize: '10.5px', color: '#d1d5db', lineHeight: '1.4' }}>{selectedLead.notes}</p>
                      </div>
                    )}
                    {selectedLead.adminNotes && (
                      <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(248,120,32,0.04)', border: '1px dashed rgba(248,120,32,0.18)', borderRadius: '8px' }}>
                        <span style={{ display: 'block', fontSize: '9.5px', color: '#f87820', fontWeight: 'bold', marginBottom: '2px' }}>{AdminIcons.edit(13)} یادداشت داخلی:</span>
                        <p style={{ margin: 0, fontSize: '10.5px', color: '#d1d5db', lineHeight: '1.4' }}>{selectedLead.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.detailsCollapsible}>
              <div className={styles.detailsSectionHeader}>
                <h3>{AdminIcons.bag(16)} اقلام پیش‌فاکتور</h3>
              </div>
              <div className={styles.detailsCollapsibleBody}>
                {Array.isArray(selectedLead.items) && selectedLead.items.length > 0 ? (
                  selectedLead.items.map((item, index) => (
                    <div key={`${item?.name || 'item'}-${index}`} className={styles.detailsProductItem}>
                      {selectedLead.img && <img src={selectedLead.img} alt={item?.name || 'محصول'} className={styles.detailsProductImg} />}
                      <div className={styles.detailsProductInfo}>
                        <h4 className={styles.detailsProductTitle}>{item?.name || ''}</h4>
                        <span className={styles.detailsProductDesc}>
                          {selectedLead.store || 'فروشگاه ثبت نشده'}{(item?.color || item?.size) ? ` | ${item?.color ? `رنگ: ${item.color}` : ''}${item?.color && item?.size ? ' - ' : ''}${item?.size ? `سایز: ${item.size}` : ''}` : ''}
                        </span>
                      </div>
                      <span className={styles.detailsProductQty}>{Number(item?.quantity) || 0} عدد</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.detailsProductItem}>
                    {selectedLead.img && <img src={selectedLead.img} alt={selectedLead.productName || 'محصول'} className={styles.detailsProductImg} />}
                    <div className={styles.detailsProductInfo}>
                      <h4 className={styles.detailsProductTitle}>{selectedLead.productName || ''}</h4>
                      <span className={styles.detailsProductDesc}>{selectedLead.store || 'فروشگاه ثبت نشده'}{selectedLead.brand ? ` | برند ${selectedLead.brand}` : ''}</span>
                    </div>
                    <span className={styles.detailsProductQty}>۱ عدد</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.detailsCollapsible} style={{ borderBottom: 'none', marginBottom: 0 }}>
              <div className={styles.detailsSectionHeader} style={{ cursor: 'default' }}>
                <h3>{AdminIcons.dollar(16)} برآورد هزینه‌ها</h3>
              </div>
              <div className={styles.detailsCollapsibleBody}>
                <table className={styles.nestedPriceTable}>
                  <tbody>
                    <tr>
                      <td>قیمت خالص محصول (دبی)</td>
                      <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff' }}>
                        {fmtToman(selectedLead.priceDetails?.product ?? 0)} تومان
                      </td>
                    </tr>
                    <tr>
                      <td>هزینه ارسال هوایی به ایران</td>
                      <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff' }}>
                        {fmtToman(selectedLead.priceDetails?.shipping ?? 0)} تومان
                      </td>
                    </tr>
                    <tr>
                      <td>کارمزد سرویس دبی‌خرید</td>
                      <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff' }}>
                        {fmtToman(selectedLead.priceDetails?.commission ?? 0)} تومان
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '12px', fontWeight: '900', color: '#fff', paddingTop: '8px' }}>مبلغ کل سفارش</td>
                      <td style={{ textAlign: 'left', fontSize: '13px', fontWeight: '900', color: '#f87820', paddingTop: '8px' }}>
                        {fmtToman(selectedLead.totalToman)} تومان
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '12px', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#8b92a5' }}>روش پرداخت:</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>
                  {selectedLead.paymentMethod === 'gateway' ? <span>{AdminIcons.card(14)} درگاه بانکی مستقیم</span> : <span>{AdminIcons.card(14)} کارت به کارت شتابی</span>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#8b92a5' }}>کد پیگیری تراکنش:</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', color: '#ff9d00' }}>{selectedLead.trackingNum || 'ثبت نشده'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#8b92a5' }}>وضعیت مالی:</span>
                <span
                  style={{
                    padding: '2px 6px', borderRadius: '4px', fontSize: '9.5px', fontWeight: 'bold',
                    background: selectedLead.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                    color: selectedLead.paymentStatus === 'paid' ? '#10b981' : '#f97316'
                  }}
                >
                  {selectedLead.paymentStatus === 'paid' ? 'تایید و پرداخت شده' : 'در انتظار تایید فیش'}
                </span>
              </div>
            </div>

            <div className={styles.detailsFooterActions}>
              <div className={styles.detailsActionsRow}>
                <button className={styles.detailsActionBtn} disabled={!can(ADMIN_PERMISSIONS.ORDERS_EDIT) || pendingActionId === selectedLead.id} onClick={() => handleUpdateNotes(selectedLead)}>
                  {AdminIcons.edit(13)} یادداشت داخلی
                </button>
                <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                  <select
                    value={selectedLead.status || ''}
                    disabled={!can(ADMIN_PERMISSIONS.ORDERS_EDIT) || pendingActionId === selectedLead.id}
                    onChange={(event) => handleStatusChange(selectedLead.id, event.target.value)}
                    className={styles.detailsActionBtn}
                    style={{
                      width: '100%', appearance: 'none', textAlignLast: 'center', background: 'transparent',
                      border: '1px solid var(--admin-border)', color: 'var(--admin-white)', cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value="pending">وضعیت: بررسی</option>
                    <option value="pricing">وضعیت: قیمت‌گذاری</option>
                    <option value="paid">وضعیت: تایید شده</option>
                    <option value="processing">وضعیت: در حال پردازش</option>
                    <option value="warehouse_dubai">وضعیت: انبار دبی</option>
                    <option value="purchased">وضعیت: در نون دبی</option>
                    <option value="shipped">وضعیت: ارسال شده</option>
                    <option value="delivered">وضعیت: تحویل شده</option>
                    <option value="cancelled">وضعیت: لغو شده</option>
                  </select>
                </div>
              </div>
              <div className={styles.detailsActionsRow} style={{ marginTop: '8px' }}>
                {can(ADMIN_PERMISSIONS.ORDERS_DELETE) && <button disabled={pendingActionId === selectedLead.id || selectedLead.status === 'cancelled'} className={`${styles.detailsActionBtn} ${styles.detailsActionBtnRed}`} onClick={() => handleDeleteLead(selectedLead.id)}>
                  {AdminIcons.close(12)} لغو سفارش
                </button>}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.detailsContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8b92a5' }}>
            سفارشی جهت نمایش انتخاب نشده است.
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [shellOrders, setShellOrders] = useState([]);

  return (
    <AdminShell activeTab="orders" leadsOverride={shellOrders}>
      <OrdersContent onOrdersChange={setShellOrders} />
    </AdminShell>
  );
}
