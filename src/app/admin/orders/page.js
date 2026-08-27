'use client';

import Link from 'next/link';
import React, { useDeferredValue, useEffect, useState } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import {
  ORDER_STATUS_DEFINITIONS,
  getAvailableOrderStatusOptions,
  getOrderStatusMeta,
} from '@/lib/orderStatuses';

const SUMMARY_GROUPS = Object.freeze([
  { key: 'all', label: 'همه سفارش‌ها', statuses: null, icon: 'clipboard' },
  { key: 'needs_action', label: 'نیاز به اقدام', statuses: ['pending', 'pricing'], icon: 'alert' },
  { key: 'in_progress', label: 'در حال انجام', statuses: ['paid', 'processing', 'purchased', 'warehouse_dubai', 'shipped'], icon: 'clock' },
  { key: 'completed', label: 'تکمیل‌شده', statuses: ['delivered'], icon: 'check' },
]);

const CANCELLABLE_ORDER_STATUSES = new Set([
  'pending',
  'pricing',
  'paid',
  'processing',
  'purchased',
  'warehouse_dubai',
]);

const NEXT_ACTIONS = Object.freeze({
  paid: { label: 'شروع پردازش سفارش', kind: 'status', nextStatus: 'processing', description: 'پرداخت تأیید شده و سفارش آماده پردازش است.' },
  processing: { label: 'ثبت خرید / ادامه پردازش', kind: 'status', nextStatus: 'purchased', description: 'پس از انجام خرید، مرحله روند دبی را ثبت کنید.' },
  purchased: { label: 'ارسال به انبار دبی', kind: 'status', nextStatus: 'warehouse_dubai', description: 'ورود کالا به انبار دبی را ثبت کنید.' },
  warehouse_dubai: { label: 'آماده ارسال', kind: 'link', href: ADMIN_ROUTES.shipments, permission: ADMIN_PERMISSIONS.SHIPMENTS_VIEW, description: 'اطلاعات مرسوله را در بخش ارسال‌ها ثبت کنید.' },
  shipped: { label: 'پیگیری تحویل', kind: 'link', href: ADMIN_ROUTES.shipments, permission: ADMIN_PERMISSIONS.SHIPMENTS_VIEW, description: 'رهگیری و تحویل مرسوله در بخش ارسال‌ها مدیریت می‌شود.' },
  delivered: { label: 'سفارش تکمیل شده', kind: 'complete', description: 'چرخه سفارش با تحویل به مشتری کامل شده است.' },
  cancelled: { label: 'سفارش لغو شده', kind: 'cancelled', description: 'برای سفارش لغوشده اقدام عملیاتی دیگری وجود ندارد.' },
});

function getOrderNextAction(order) {
  if (order?.status === 'pending' || order?.status === 'pricing') {
    const isLegacyPricingOrder = order.status === 'pricing';
    const paymentIsPending = order.payment?.status === 'pending';
    return {
      label: paymentIsPending
        ? 'بررسی پرداخت'
        : isLegacyPricingOrder ? 'در انتظار تکمیل پرداخت' : 'در انتظار پرداخت',
      kind: paymentIsPending ? 'link' : 'info',
      href: paymentIsPending ? ADMIN_ROUTES.payments : undefined,
      permission: paymentIsPending ? ADMIN_PERMISSIONS.PAYMENTS_VIEW : undefined,
      description: isLegacyPricingOrder
        ? 'این سفارش قدیمی در وضعیت قیمت‌گذاری است و پس از تأیید پرداخت قابل ادامه است.'
        : 'قیمت سفارش تأیید شده و ادامه چرخه منوط به تأیید پرداخت است.',
    };
  }
  return NEXT_ACTIONS[order?.status] || null;
}

const SHIPMENT_STATUS_LABELS = Object.freeze({
  PENDING: 'در انتظار',
  READY: 'آماده ارسال',
  SHIPPED: 'ارسال‌شده',
  IN_TRANSIT: 'در مسیر',
  OUT_FOR_DELIVERY: 'آماده تحویل',
  DELIVERED: 'تحویل‌شده',
  FAILED: 'ناموفق',
  CANCELLED: 'لغوشده',
});

function getSafeDateLabel(value, includeTime = false) {
  const parsedDate = new Date(value || '');
  if (Number.isNaN(parsedDate.getTime())) return '';
  return includeTime ? parsedDate.toLocaleString('fa-IR') : parsedDate.toLocaleDateString('fa-IR');
}

function getSummaryCount(group, statusCounts) {
  if (!group.statuses) {
    return Object.values(statusCounts).reduce((total, count) => total + Number(count || 0), 0);
  }
  return group.statuses.reduce((total, status) => total + Number(statusCounts[status] || 0), 0);
}

function StatusBadge({ status }) {
  const statusMeta = getOrderStatusMeta(status);
  return (
    <span className={styles.ordersStatusBadge} style={{ '--status-color': statusMeta.color, '--status-bg': statusMeta.bg }}>
      {statusMeta.label}
    </span>
  );
}

function OrderDetailSection({ title, icon, children, defaultOpen = false, trailing }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <section className={styles.orderDetailSection}>
      <button
        type="button"
        className={styles.orderDetailSectionHeader}
        onClick={() => setIsOpen(current => !current)}
        aria-expanded={isOpen}
      >
        <span className={styles.orderDetailSectionTitle}>{icon}{title}</span>
        <span className={styles.orderDetailSectionTrailing}>
          {trailing}
          <span className={styles.orderDetailChevron}>{isOpen ? AdminIcons.chevronUp(15) : AdminIcons.chevronDown(15)}</span>
        </span>
      </button>
      {isOpen && <div className={styles.orderDetailSectionBody}>{children}</div>}
    </section>
  );
}

function OrdersContent({ onOrdersChange }) {
  const { can } = useAdminAccess();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [summaryGroup, setSummaryGroup] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activePaymentFilter, setActivePaymentFilter] = useState('all');
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [statusCounts, setStatusCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingActionId, setPendingActionId] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const deferredSearch = useDeferredValue(orderSearch.trim());

  useEffect(() => {
    const controller = new AbortController();
    const baseParams = new URLSearchParams();
    if (deferredSearch) baseParams.set('search', deferredSearch);
    if (activePaymentFilter !== 'all') baseParams.set('paymentMethod', activePaymentFilter);
    if (activeDateFilter !== 'all') {
      const today = new Date();
      const formatDate = date => date.toISOString().slice(0, 10);
      if (activeDateFilter === 'today') {
        baseParams.set('from', formatDate(today));
        baseParams.set('to', formatDate(today));
      } else if (activeDateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        baseParams.set('from', formatDate(yesterday));
        baseParams.set('to', formatDate(yesterday));
      } else if (activeDateFilter === 'this-month') {
        baseParams.set('from', formatDate(new Date(today.getFullYear(), today.getMonth(), 1)));
        baseParams.set('to', formatDate(today));
      }
    }

    async function requestOrders(params) {
      const response = await fetch(`/api/admin/orders?${params}`, { signal: controller.signal, cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'دریافت سفارش‌ها با خطا مواجه شد.');
      return payload;
    }

    async function requestAllForStatus(status) {
      const firstParams = new URLSearchParams(baseParams);
      firstParams.set('status', status);
      firstParams.set('page', '1');
      firstParams.set('limit', '100');
      const firstPayload = await requestOrders(firstParams);
      const pageCount = Number(firstPayload.pagination?.totalPages || 1);
      if (pageCount <= 1) return firstPayload;
      const remaining = await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => {
        const params = new URLSearchParams(firstParams);
        params.set('page', String(index + 2));
        return requestOrders(params);
      }));
      return { ...firstPayload, data: [firstPayload, ...remaining].flatMap(payload => payload.data || []) };
    }

    async function loadOrders() {
      setIsLoading(true);
      setError('');
      try {
        const selectedGroup = SUMMARY_GROUPS.find(group => group.key === summaryGroup);
        let nextOrders;
        let nextPagination;
        let nextStatusCounts;

        if (activeStatusFilter !== 'all' || !selectedGroup?.statuses) {
          const params = new URLSearchParams(baseParams);
          params.set('page', String(pagination.page));
          params.set('limit', String(pagination.limit));
          if (activeStatusFilter !== 'all') params.set('status', activeStatusFilter);
          const payload = await requestOrders(params);
          nextOrders = Array.isArray(payload.data) ? payload.data : [];
          nextPagination = payload.pagination;
          nextStatusCounts = payload.statusCounts || {};
        } else {
          const payloads = await Promise.all(selectedGroup.statuses.map(requestAllForStatus));
          const groupedOrders = payloads
            .flatMap(payload => Array.isArray(payload.data) ? payload.data : [])
            .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
          const start = (pagination.page - 1) * pagination.limit;
          nextOrders = groupedOrders.slice(start, start + pagination.limit);
          nextPagination = {
            page: pagination.page,
            limit: pagination.limit,
            total: groupedOrders.length,
            totalPages: Math.max(1, Math.ceil(groupedOrders.length / pagination.limit)),
          };
          nextStatusCounts = payloads[0]?.statusCounts || {};
        }

        setOrders(nextOrders);
        onOrdersChange(nextOrders);
        setPagination(nextPagination);
        setStatusCounts(nextStatusCounts);
        setSelectedOrderId(current => nextOrders.some(order => order.id === current) ? current : nextOrders[0]?.id || null);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setOrders([]);
          onOrdersChange([]);
          setError(loadError.message || 'دریافت سفارش‌ها با خطا مواجه شد.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadOrders();
    return () => controller.abort();
  }, [activeDateFilter, activePaymentFilter, activeStatusFilter, deferredSearch, onOrdersChange, pagination.limit, pagination.page, refreshToken, summaryGroup]);

  const formatToman = value => {
    const numericValue = Number.parseFloat(value);
    return Math.round(Number.isFinite(numericValue) ? numericValue : 0).toLocaleString('fa-IR');
  };

  const getWhatsAppLink = order => {
    let cleanPhone = String(order?.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) cleanPhone = `98${cleanPhone.slice(1)}`;
    const message = `سلام ${String(order?.customerName || '')} عزیز،\nپیش‌فاکتور خرید شما در سایت «دبی خرید» ثبت گردید.\n\nسفارش شما: ${String(order?.productName || '')}\nمبلغ کل: ${formatToman(order?.totalToman)} تومان\nآدرس تحویل: ${String(order?.address || '')}\n\nجهت هماهنگی نهایی خرید، تأیید رنگ/سایز و صدور فاکتور در خدمت شما هستیم.`;
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
      setOrders(current => {
        const nextOrders = current.map(order => order.id === leadId ? payload : order);
        onOrdersChange(nextOrders);
        return nextOrders;
      });
      setRefreshToken(current => current + 1);
      return payload;
    } catch (updateError) {
      setError(updateError.message || 'به‌روزرسانی سفارش با خطا مواجه شد.');
      setRefreshToken(current => current + 1);
      return null;
    } finally {
      setPendingActionId(null);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!can(ADMIN_PERMISSIONS.ORDERS_EDIT)) return;
    await updateOrder(orderId, { status: newStatus });
  };

  const handleCancelOrder = async orderId => {
    if (!can(ADMIN_PERMISSIONS.ORDERS_DELETE)) return;
    if (!confirm('آیا از لغو این سفارش مطمئن هستید؟')) return;
    setPendingActionId(orderId);
    setError('');
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'لغو سفارش با خطا مواجه شد.');
      setRefreshToken(current => current + 1);
    } catch (cancelError) {
      setError(cancelError.message || 'لغو سفارش با خطا مواجه شد.');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleUpdateNotes = async selectedOrder => {
    if (!can(ADMIN_PERMISSIONS.ORDERS_EDIT)) return;
    const note = prompt('یادداشت داخلی جدید خود را وارد کنید:', String(selectedOrder?.adminNotes || ''));
    if (note === null) return;
    await updateOrder(selectedOrder.id, { adminNotes: note });
  };

  const clearFilters = () => {
    setSummaryGroup('all');
    setActiveStatusFilter('all');
    setActivePaymentFilter('all');
    setActiveDateFilter('all');
    setPagination(current => ({ ...current, page: 1 }));
  };

  const activeFilterCount = [activeStatusFilter, activePaymentFilter, activeDateFilter].filter(value => value !== 'all').length;
  const selectedOrder = orders.find(order => order.id === selectedOrderId) || orders[0] || null;
  const selectedLead = selectedOrder;
  const selectedNextAction = getOrderNextAction(selectedOrder);
  const canCancelSelectedOrder = Boolean(selectedOrder && CANCELLABLE_ORDER_STATUSES.has(selectedOrder.status));

  return (
    <div className={styles.ordersPage}>
      <header className={styles.ordersPageHeader}>
        <div>
          <span className={styles.ordersPageEyebrow}>مرکز عملیات سفارش</span>
          <h1>{AdminIcons.bag(22)} سفارشات خرید از دبی</h1>
          <p>بررسی، پیگیری و تکمیل سفارش‌ها با تمرکز بر اقدام بعدی.</p>
        </div>
      </header>

      {error && <div role="alert" className={styles.ordersError}>{error}</div>}

      <section className={styles.ordersSummaryGrid} aria-label="خلاصه سفارش‌ها">
        {SUMMARY_GROUPS.map(group => {
          const isActive = summaryGroup === group.key && activeStatusFilter === 'all';
          return (
            <button
              type="button"
              key={group.key}
              className={`${styles.ordersSummaryCard} ${isActive ? styles.ordersSummaryCardActive : ''}`}
              onClick={() => {
                setSummaryGroup(group.key);
                setActiveStatusFilter('all');
                setPagination(current => ({ ...current, page: 1 }));
              }}
              aria-pressed={isActive}
            >
              <span className={styles.ordersSummaryIcon}>{AdminIcons[group.icon](17)}</span>
              <span className={styles.ordersSummaryMeta}>
                <span>{group.label}</span>
                <strong>{getSummaryCount(group, statusCounts).toLocaleString('fa-IR')}</strong>
              </span>
            </button>
          );
        })}
      </section>

      <div className={styles.ordersToolbar}>
        <label className={styles.ordersSearchField}>
          <span className={styles.ordersSearchIcon}>{AdminIcons.search(16)}</span>
          <input
            type="search"
            value={orderSearch}
            placeholder="جستجو در سفارش‌ها..."
            onChange={event => {
              setOrderSearch(event.target.value);
              setPagination(current => ({ ...current, page: 1 }));
            }}
          />
        </label>
        <button
          type="button"
          className={`${styles.ordersFilterTrigger} ${areFiltersOpen ? styles.ordersFilterTriggerActive : ''}`}
          onClick={() => setAreFiltersOpen(current => !current)}
          aria-expanded={areFiltersOpen}
          aria-controls="orders-filter-panel"
        >
          {AdminIcons.sliders(15)} فیلترها{activeFilterCount > 0 ? ` (${activeFilterCount.toLocaleString('fa-IR')})` : ''}
        </button>
      </div>

      {areFiltersOpen && (
        <section id="orders-filter-panel" className={styles.ordersFilterPanel} aria-label="فیلترهای سفارش">
          <label>
            <span>وضعیت دقیق</span>
            <select
              value={activeStatusFilter}
              onChange={event => {
                setActiveStatusFilter(event.target.value);
                setSummaryGroup('all');
                setPagination(current => ({ ...current, page: 1 }));
              }}
            >
              <option value="all">همه وضعیت‌ها</option>
              {ORDER_STATUS_DEFINITIONS.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <label>
            <span>روش پرداخت</span>
            <select value={activePaymentFilter} onChange={event => { setActivePaymentFilter(event.target.value); setPagination(current => ({ ...current, page: 1 })); }}>
              <option value="all">همه روش‌ها</option>
              <option value="gateway">درگاه بانکی</option>
              <option value="card">کارت به کارت</option>
            </select>
          </label>
          <label>
            <span>بازه زمانی</span>
            <select value={activeDateFilter} onChange={event => { setActiveDateFilter(event.target.value); setPagination(current => ({ ...current, page: 1 })); }}>
              <option value="all">همه تاریخ‌ها</option>
              <option value="today">امروز</option>
              <option value="yesterday">دیروز</option>
              <option value="this-month">این ماه</option>
            </select>
          </label>
          <button type="button" className={styles.ordersClearFilters} onClick={clearFilters} disabled={activeFilterCount === 0 && summaryGroup === 'all'}>پاک کردن فیلترها</button>
        </section>
      )}

      <div className={styles.ordersWorkspace}>
        <div className={styles.ordersListColumn}>
          <div className={styles.ordersTableScroller}>
            <table className={styles.ordersTable}>
              <thead><tr><th>شماره سفارش</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th><th>عملیات</th></tr></thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <tr key={`skeleton-${index}`} className={styles.ordersSkeletonRow} aria-hidden="true"><td><span /></td><td><span /></td><td><span /></td><td><span /></td><td><span /></td><td><span /></td></tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr><td colSpan="6"><div className={styles.ordersEmptyState}><span>{AdminIcons.clipboard(24)}</span><strong>سفارشی پیدا نشد</strong><p>{orderSearch || activeFilterCount > 0 || summaryGroup !== 'all' ? 'فیلترها یا عبارت جستجو را تغییر دهید.' : 'هنوز سفارشی برای نمایش ثبت نشده است.'}</p>{(orderSearch || activeFilterCount > 0 || summaryGroup !== 'all') && <button type="button" onClick={() => { setOrderSearch(''); clearFilters(); }}>نمایش همه سفارش‌ها</button>}</div></td></tr>
                ) : orders.map(order => {
                  const isSelected = selectedOrder?.id === order.id;
                  const needsAttention = ['pending', 'pricing'].includes(order.status);
                  return (
                    <tr
                      key={order.id}
                      className={`${isSelected ? styles.ordersTableRowSelected : ''} ${needsAttention ? styles.ordersTableRowAttention : ''}`}
                      onClick={() => setSelectedOrderId(order.id)}
                      tabIndex="0"
                      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedOrderId(order.id); } }}
                    >
                      <td><div className={styles.ordersOrderCodeCell}>{needsAttention && <span className={styles.ordersAttentionDot} title="نیاز به اقدام" />}<strong dir="ltr">{order.orderCode}</strong></div></td>
                      <td><span className={styles.ordersCustomerName}>{order.customerName || 'بدون نام'}</span>{order.phone && <small dir="ltr">{order.phone}</small>}</td>
                      <td className={styles.ordersAmountCell}>{formatToman(order.totalToman)} <small>تومان</small></td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className={styles.ordersDateCell}>{getSafeDateLabel(order.date)}</td>
                      <td onClick={event => event.stopPropagation()}><div className={styles.ordersRowActions}><a href={getWhatsAppLink(order)} target="_blank" rel="noopener noreferrer" aria-label="تماس در واتساپ" title="واتساپ">{AdminIcons.whatsapp(15)}</a>{can(ADMIN_PERMISSIONS.ORDERS_DELETE) && CANCELLABLE_ORDER_STATUSES.has(order.status) && <button type="button" onClick={() => handleCancelOrder(order.id)} disabled={pendingActionId === order.id} aria-label="لغو سفارش" title="لغو سفارش">{AdminIcons.close(14)}</button>}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.ordersPager}>
            <span>نمایش {pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total.toLocaleString('fa-IR')}</span>
            <div>
              <select value={String(pagination.limit)} onChange={event => setPagination(current => ({ ...current, page: 1, limit: Number(event.target.value) }))} aria-label="تعداد ردیف در صفحه"><option value="8">۸ ردیف</option><option value="15">۱۵ ردیف</option><option value="30">۳۰ ردیف</option></select>
              <button type="button" disabled={pagination.page <= 1} onClick={() => setPagination(current => ({ ...current, page: current.page - 1 }))}>قبلی</button>
              <span>{pagination.page.toLocaleString('fa-IR')} / {pagination.totalPages.toLocaleString('fa-IR')}</span>
              <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(current => ({ ...current, page: current.page + 1 }))}>بعدی</button>
            </div>
          </div>
        </div>

        {selectedOrder ? (
          <aside className={styles.orderDetailPanel} aria-label="جزئیات سفارش انتخاب‌شده">
            <header className={styles.orderDetailSummary}>
              <div className={styles.orderDetailSummaryTop}>
                <div><span>سفارش</span><div className={styles.orderDetailCodeRow}><strong dir="ltr">{selectedOrder.orderCode}</strong><button type="button" onClick={() => navigator.clipboard.writeText(String(selectedOrder.orderCode || ''))} aria-label="کپی شماره سفارش" title="کپی شماره سفارش">{AdminIcons.clipboard(14)}</button></div></div>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <dl className={styles.orderDetailFacts}>
                <div><dt>مشتری</dt><dd>{selectedOrder.customerName || 'بدون نام'}</dd></div>
                <div><dt>مبلغ کل</dt><dd>{formatToman(selectedOrder.totalToman)} <small>تومان</small></dd></div>
                <div><dt>تاریخ ثبت</dt><dd>{getSafeDateLabel(selectedOrder.date, true)}</dd></div>
              </dl>
            </header>

            {selectedNextAction && (
              <section className={`${styles.orderNextAction} ${styles[`orderNextAction_${selectedNextAction.kind}`] || ''}`}>
                <div><span>اقدام بعدی</span><strong>{selectedNextAction.label}</strong><p>{selectedNextAction.description}</p></div>
                {selectedNextAction.kind === 'status' && <button type="button" className={styles.orderNextActionButton} disabled={!can(ADMIN_PERMISSIONS.ORDERS_EDIT) || pendingActionId === selectedOrder.id} onClick={() => handleStatusChange(selectedOrder.id, selectedNextAction.nextStatus)}>{pendingActionId === selectedOrder.id ? 'در حال ثبت...' : selectedNextAction.label}{AdminIcons.back(15)}</button>}
                {selectedNextAction.kind === 'link' && can(selectedNextAction.permission) && <Link className={styles.orderNextActionButton} href={selectedNextAction.href}>{selectedNextAction.label}{AdminIcons.back(15)}</Link>}
              </section>
            )}

            <div className={styles.orderDetailSections}>
              <OrderDetailSection title="اقلام سفارش" icon={AdminIcons.bag(15)} defaultOpen trailing={`${selectedOrder.items?.length || 0} قلم`}>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? selectedOrder.items.map(item => <div key={item.id || `${item.name}-${item.quantity}`} className={styles.orderItemRow}><div><strong>{item.name || 'کالای بدون نام'}</strong><span>{Number(item.quantity) || 0} عدد</span></div><span>{item.priceToman == null ? 'قیمت ثبت نشده' : `${formatToman(item.priceToman)} تومان`}</span></div>) : <p className={styles.orderDetailEmpty}>اقلامی برای این سفارش ثبت نشده است.</p>}
              </OrderDetailSection>

              <OrderDetailSection title="مشتری و آدرس" icon={AdminIcons.user(15)} defaultOpen>
                <dl className={styles.orderDetailList}><div><dt>نام مشتری</dt><dd>{selectedOrder.customerName || 'ثبت نشده'}</dd></div><div><dt>شماره تماس</dt><dd dir="ltr">{selectedOrder.phone || 'ثبت نشده'}</dd></div><div><dt>ایمیل</dt><dd dir="ltr">{selectedOrder.email || 'ثبت نشده'}</dd></div><div className={styles.orderDetailListWide}><dt>آدرس تحویل</dt><dd>{selectedOrder.address || 'ثبت نشده'}</dd></div>{selectedOrder.notes && <div className={styles.orderDetailListWide}><dt>توضیحات مشتری</dt><dd>{selectedOrder.notes}</dd></div>}</dl>
              </OrderDetailSection>

              <OrderDetailSection title="مبالغ" icon={AdminIcons.dollar(15)}>
                <dl className={styles.orderPriceList}><div><dt>قیمت خالص محصول</dt><dd>{formatToman(selectedOrder.priceDetails?.product ?? 0)} تومان</dd></div><div><dt>هزینه ارسال</dt><dd>{formatToman(selectedOrder.priceDetails?.shipping ?? 0)} تومان</dd></div><div><dt>کارمزد دبی‌خرید</dt><dd>{formatToman(selectedOrder.priceDetails?.commission ?? 0)} تومان</dd></div><div className={styles.orderPriceTotal}><dt>مبلغ کل سفارش</dt><dd>{formatToman(selectedOrder.totalToman)} تومان</dd></div></dl>
              </OrderDetailSection>

              <OrderDetailSection title="پرداخت" icon={AdminIcons.card(15)} trailing={selectedOrder.paymentStatus === 'paid' ? 'تأییدشده' : 'در انتظار'}>
                <dl className={styles.orderDetailList}><div><dt>وضعیت مالی</dt><dd>{selectedOrder.paymentStatus === 'paid' ? 'تأیید و پرداخت شده' : 'در انتظار تأیید پرداخت'}</dd></div><div><dt>روش پرداخت</dt><dd>{selectedOrder.paymentMethod === 'gateway' ? 'درگاه بانکی' : selectedOrder.paymentMethod === 'card' ? 'کارت به کارت' : 'ثبت نشده'}</dd></div>{selectedOrder.payment?.amount != null && <div><dt>مبلغ ثبت‌شده</dt><dd>{formatToman(selectedOrder.payment.amount)} تومان</dd></div>}{selectedOrder.payment?.reference && <div><dt>مرجع پرداخت</dt><dd dir="ltr">{selectedOrder.payment.reference}</dd></div>}</dl>
                {can(ADMIN_PERMISSIONS.PAYMENTS_VIEW) && <Link className={styles.orderDetailTextLink} href={ADMIN_ROUTES.payments}>مشاهده در بخش پرداخت‌ها {AdminIcons.back(13)}</Link>}
              </OrderDetailSection>

              <OrderDetailSection title="ارسال" icon={AdminIcons.truck(15)} trailing={selectedOrder.shipment ? SHIPMENT_STATUS_LABELS[selectedOrder.shipment.status] || selectedOrder.shipment.status : 'ثبت نشده'}>
                {selectedOrder.shipment ? <dl className={styles.orderDetailList}><div><dt>وضعیت مرسوله</dt><dd>{SHIPMENT_STATUS_LABELS[selectedOrder.shipment.status] || selectedOrder.shipment.status}</dd></div><div><dt>شرکت حمل</dt><dd>{selectedOrder.shipment.carrier || 'ثبت نشده'}</dd></div><div><dt>روش ارسال</dt><dd>{selectedOrder.shipment.method || 'ثبت نشده'}</dd></div><div><dt>کد رهگیری مرسوله</dt><dd dir="ltr">{selectedOrder.shipment.trackingCode || 'ثبت نشده'}</dd></div></dl> : <p className={styles.orderDetailEmpty}>برای این سفارش هنوز مرسوله‌ای ثبت نشده است.</p>}
                {can(ADMIN_PERMISSIONS.SHIPMENTS_VIEW) && <Link className={styles.orderDetailTextLink} href={ADMIN_ROUTES.shipments}>مدیریت در بخش ارسال‌ها {AdminIcons.back(13)}</Link>}
              </OrderDetailSection>

              <OrderDetailSection title="یادداشت داخلی" icon={AdminIcons.edit(15)} trailing={selectedOrder.adminNotes ? 'ثبت‌شده' : 'بدون یادداشت'}>
                <p className={selectedOrder.adminNotes ? styles.orderAdminNote : styles.orderDetailEmpty}>{selectedOrder.adminNotes || 'برای این سفارش یادداشت داخلی ثبت نشده است.'}</p>
                <button type="button" className={styles.orderSecondaryButton} disabled={!can(ADMIN_PERMISSIONS.ORDERS_EDIT) || pendingActionId === selectedOrder.id} onClick={() => handleUpdateNotes(selectedOrder)}>{AdminIcons.edit(13)} {selectedOrder.adminNotes ? 'ویرایش یادداشت' : 'ثبت یادداشت'}</button>
              </OrderDetailSection>
            </div>

            <footer className={styles.orderDetailFooter}>
              <label><span>تغییر وضعیت</span><select value={selectedOrder.status || ''} disabled={!can(ADMIN_PERMISSIONS.ORDERS_EDIT) || pendingActionId === selectedOrder.id} onChange={event => handleStatusChange(selectedOrder.id, event.target.value)}>{getAvailableOrderStatusOptions(selectedLead.status).map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              {can(ADMIN_PERMISSIONS.ORDERS_DELETE) && canCancelSelectedOrder && <button type="button" className={styles.orderCancelButton} disabled={pendingActionId === selectedOrder.id} onClick={() => handleCancelOrder(selectedOrder.id)}>{AdminIcons.close(13)} لغو سفارش</button>}
            </footer>
          </aside>
        ) : <aside className={styles.orderDetailPlaceholder}>{AdminIcons.clipboard(25)}<p>برای مشاهده جزئیات، یک سفارش را انتخاب کنید.</p></aside>}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [shellOrders, setShellOrders] = useState([]);
  return <AdminShell activeTab="orders" leadsOverride={shellOrders}><OrdersContent onOrdersChange={setShellOrders} /></AdminShell>;
}
