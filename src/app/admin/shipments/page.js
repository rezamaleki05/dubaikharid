'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

const SHIPMENT_STATUS_OPTIONS = Object.freeze([
  { value: 'PENDING', label: 'در انتظار' },
  { value: 'READY', label: 'آماده ارسال' },
  { value: 'SHIPPED', label: 'در حال ارسال' },
  { value: 'IN_TRANSIT', label: 'رسیده به گمرک' },
  { value: 'OUT_FOR_DELIVERY', label: 'در ایران' },
  { value: 'DELIVERED', label: 'تحویل شده' },
  { value: 'FAILED', label: 'مشکل در ارسال' },
  { value: 'CANCELLED', label: 'لغو شده' },
]);

const statusLabel = status => SHIPMENT_STATUS_OPTIONS.find(option => option.value === status)?.label || status;

const formatShipmentDate = value => {
  if (!value) return 'ثبت نشده';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'ثبت نشده' : date.toLocaleDateString('fa-IR');
};

const createShipmentView = (shipment, index = 0) => {
  const safeShipment = shipment && typeof shipment === 'object' ? shipment : {};

  return {
    ...safeShipment,
    id: String(
      safeShipment.id ??
      safeShipment.shipmentId ??
      `SHIP-${index + 1}`
    ),
    orderId: String(safeShipment.orderId ?? safeShipment.orderNumber ?? ''),
    recipient: String(
      safeShipment.recipient ??
      safeShipment.recipientName ??
      safeShipment.customerName ??
      ''
    ),
    method: String(safeShipment.method ?? safeShipment.shippingMethod ?? ''),
    status: String(
      safeShipment.status ??
      safeShipment.shipmentStatus ??
      safeShipment.deliveryStatus ??
      'PENDING'
    ),
    productName: String(safeShipment.productName ?? ''),
    productImg: String(safeShipment.productImg ?? ''),
    phone: String(safeShipment.phone ?? safeShipment.recipientPhone ?? safeShipment.customerPhone ?? ''),
    address: String(safeShipment.address ?? safeShipment.destination ?? ''),
    carrier: String(safeShipment.carrier ?? safeShipment.courier ?? safeShipment.shippingCompany ?? ''),
    awbCode: String(
      safeShipment.awbCode ??
      safeShipment.trackingCode ??
      safeShipment.trackingNumber ??
      ''
    ),
    dateShipped: formatShipmentDate(safeShipment.shippedAt ?? safeShipment.dateShipped),
    dateUpdated: formatShipmentDate(safeShipment.updatedAt ?? safeShipment.dateUpdated),
    allowedTransitions: Array.isArray(safeShipment.allowedTransitions) ? safeShipment.allowedTransitions : [],
  };
};

function ShipmentsContent() {
  const router = useRouter();
  const { can } = useAdminAccess();
  const canEditShipments = can(ADMIN_PERMISSIONS.SHIPMENTS_EDIT);
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({ total: 0, statusCounts: {}, growth: {} });
  const [filterOptions, setFilterOptions] = useState({ recipients: [], carriers: [], methods: [] });
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingShipmentId, setUpdatingShipmentId] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('همه');
  const [shipmentMethodFilter, setShipmentMethodFilter] = useState('همه');
  const [shipmentRecipientFilter, setShipmentRecipientFilter] = useState('همه');
  const [shipmentDateFrom, setShipmentDateFrom] = useState('');
  const [shipmentDateTo, setShipmentDateTo] = useState('');
  const [isAddShipmentOpen, setIsAddShipmentOpen] = useState(false);
  const [newShipmentForm, setNewShipmentForm] = useState({
    orderId: '',
    method: 'هوایی',
    status: 'SHIPPED',
    carrier: '',
    trackingNumber: '',
    trackingUrl: '',
    notes: '',
  });

  const loadShipments = useCallback(async ({ signal } = {}) => {
    setIsLoading(true);
    setErrorMessage('');
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
      includeOrders: '1',
    });
    if (shipmentSearchQuery.trim()) params.set('search', shipmentSearchQuery.trim());
    if (shipmentStatusFilter !== 'همه') params.set('status', shipmentStatusFilter);
    if (shipmentMethodFilter !== 'همه') params.set('method', shipmentMethodFilter);
    if (shipmentRecipientFilter !== 'همه') params.set('recipient', shipmentRecipientFilter);
    if (shipmentDateFrom) params.set('from', shipmentDateFrom);
    if (shipmentDateTo) params.set('to', shipmentDateTo);
    try {
      const response = await fetch(`/api/admin/shipments?${params.toString()}`, { cache: 'no-store', signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'دریافت ارسال‌ها با خطا مواجه شد.');
      setShipments(Array.isArray(payload.data) ? payload.data : []);
      setStats(payload.stats || { total: 0, statusCounts: {}, growth: {} });
      setFilterOptions(payload.filters || { recipients: [], carriers: [], methods: [] });
      setEligibleOrders(Array.isArray(payload.eligibleOrders) ? payload.eligibleOrders : []);
      setPagination(previous => ({ ...previous, ...(payload.pagination || {}) }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        setErrorMessage(error.message || 'دریافت ارسال‌ها با خطا مواجه شد.');
        setShipments([]);
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    shipmentDateFrom,
    shipmentDateTo,
    shipmentMethodFilter,
    shipmentRecipientFilter,
    shipmentSearchQuery,
    shipmentStatusFilter,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadShipments({ signal: controller.signal }), 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadShipments]);

  const selectShipment = useCallback(async shipmentId => {
    setSelectedShipmentId(shipmentId);
    setSelectedShipment(null);
    try {
      const response = await fetch(`/api/admin/shipments/${encodeURIComponent(shipmentId)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'دریافت مرسوله با خطا مواجه شد.');
      setSelectedShipment(payload);
    } catch (error) {
      setErrorMessage(error.message || 'دریافت مرسوله با خطا مواجه شد.');
    }
  }, []);

  useEffect(() => {
    const requestedShipmentId = new URLSearchParams(window.location.search).get('shipmentId')?.trim();
    if (!requestedShipmentId) return undefined;
    const timer = window.setTimeout(() => void selectShipment(requestedShipmentId), 0);
    return () => window.clearTimeout(timer);
  }, [selectShipment]);

  const resetNewShipmentForm = () => setNewShipmentForm({
    orderId: eligibleOrders[0]?.id || '',
    method: 'هوایی',
    status: 'SHIPPED',
    carrier: '',
    trackingNumber: '',
    trackingUrl: '',
    notes: '',
  });

  const handleAddShipmentSubmit = async event => {
    event.preventDefault();
    if (!newShipmentForm.orderId) {
      alert('لطفاً گیرنده ارسال را وارد کنید.');
      return;
    }
    setUpdatingShipmentId('create');
    try {
      const response = await fetch('/api/admin/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: newShipmentForm.orderId,
          shippingMethod: newShipmentForm.method,
          status: newShipmentForm.status,
          carrier: newShipmentForm.carrier,
          trackingNumber: newShipmentForm.trackingNumber,
          trackingUrl: newShipmentForm.trackingUrl,
          notes: newShipmentForm.notes,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ثبت مرسوله با خطا مواجه شد.');
      setIsAddShipmentOpen(false);
      setPagination(previous => ({ ...previous, page: 1 }));
      await loadShipments();
      alert('مرسوله ارسالی جدید با موفقیت ثبت شد!');
    } catch (error) {
      alert(error.message || 'ثبت مرسوله با خطا مواجه شد.');
    } finally {
      setUpdatingShipmentId('');
    }
  };

  const handleDeleteShipment = async shipmentId => {
    if (!confirm('آیا از لغو این مرسوله ارسالی مطمئن هستید؟')) {
      return;
    }
    setUpdatingShipmentId(shipmentId);
    try {
      const response = await fetch(`/api/admin/shipments/${encodeURIComponent(shipmentId)}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'لغو مرسوله با خطا مواجه شد.');
      if (selectedShipmentId === shipmentId) {
        setSelectedShipmentId('');
        setSelectedShipment(null);
      }
      await loadShipments();
      alert('مرسوله ارسالی با موفقیت لغو گردید.');
    } catch (error) {
      alert(error.message || 'لغو مرسوله با خطا مواجه شد.');
    } finally {
      setUpdatingShipmentId('');
    }
  };

  const handleUpdateShipmentStatus = async (shipmentId, newStatus) => {
    setUpdatingShipmentId(shipmentId);
    try {
      const response = await fetch(`/api/admin/shipments/${encodeURIComponent(shipmentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'به‌روزرسانی مرسوله با خطا مواجه شد.');
      if (selectedShipmentId === shipmentId) setSelectedShipment(payload);
      await loadShipments();
      alert('وضعیت مرسوله با موفقیت به‌روزرسانی شد!');
    } catch (error) {
      alert(error.message || 'به‌روزرسانی مرسوله با خطا مواجه شد.');
    } finally {
      setUpdatingShipmentId('');
    }
  };

            const allShips = shipments.map(createShipmentView);
            const filteredShips = allShips;
            const uniqueRecipients = filterOptions.recipients || [];
            const totalCount = stats.total || 0;
            const transitCount = stats.statusCounts?.SHIPPED || 0;
            const customsCount = stats.statusCounts?.IN_TRANSIT || 0;
            const iranCount = stats.statusCounts?.OUT_FOR_DELIVERY || 0;
            const deliveredCount = stats.statusCounts?.DELIVERED || 0;
            const problemCount = stats.statusCounts?.FAILED || 0;
            const totalGrowth = stats.growth?.total || 0;
            const transitGrowth = stats.growth?.SHIPPED || 0;
            const customsGrowth = stats.growth?.IN_TRANSIT || 0;
            const iranGrowth = stats.growth?.OUT_FOR_DELIVERY || 0;
            const deliveredGrowth = stats.growth?.DELIVERED || 0;

            const renderGrowthSub = (growthVal) => {
              if (growthVal === 0) {
                return <span className={styles.metricSubText} style={{ color: '#8b92a5', marginTop: '2px' }}>بدون تغییر</span>;
              }
              const isUp = growthVal > 0;
              const color = isUp ? '#10b981' : '#ef4444';
              const sign = isUp ? '+' : '';
              return (
                <span className={`${styles.metricSubText} ${isUp ? styles.up : ''}`} style={{ color, marginTop: '2px' }}>
                  {sign}{growthVal.toFixed(1)}% نسبت به قبل
                </span>
              );
            };

            const pct = (val) => {
              if (totalCount === 0) return '0%';
              return ((val / totalCount) * 100).toFixed(1) + '%';
            };

            // SVG Stroke offsets helper
            const getStrokeProps = (count, accumBefore) => {
              if (totalCount === 0) return { dashOffset: 314, rotation: -90 };
              const share = count / totalCount;
              const dashOffset = 314 - (314 * share);
              const rotation = -90 + (accumBefore / totalCount) * 360;
              return { dashOffset, rotation };
            };

            return (
              <div>
                {/* Header Title Row */}
                <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
                  <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#f87820', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.truck(28)}</span>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>ارسال ها</h1>
                      <p style={{ fontSize: '11.5px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>مدیریت و پیگیری تمام ارسالی های کالا</p>
                    </div>
                  </div>

                  <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        resetNewShipmentForm();
                        setIsAddShipmentOpen(true);
                      }}
                      disabled={!canEditShipments || eligibleOrders.length === 0}
                      className={styles.saveFormBtn}
                      style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.4)', borderRadius: '10px', padding: '10px 18px', fontWeight: '700', fontSize: '13px' }}
                    >
                      + ثبت ارسال جدید
                    </button>
                    
                    <button type="button" className={styles.advFilterBtn} style={{ padding: '10px 15px' }}>
                      <span>{AdminIcons.sliders(12)}</span> فیلترها
                    </button>

                    <button type="button" className={styles.advFilterBtn} style={{ padding: '10px 15px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{AdminIcons.chart(12)}</span> گزارش ارسال ها
                    </button>
                  </div>
                </div>

                {/* 5 KPI metrics row */}
                <div className={styles.metricsGrid5}>
                  {/* Card 1: کل ارسال‌ها */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>کل ارسال ها</span>
                      <span className={styles.metricValue}>{totalCount.toLocaleString()}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>در این ماه</span>
                      {renderGrowthSub(totalGrowth)}
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      {AdminIcons.chart(18)}
                    </div>
                  </div>

                  {/* Card 2: در حال ارسال */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>در حال ارسال</span>
                      <span className={styles.metricValue}>{transitCount}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>سفارش</span>
                      {renderGrowthSub(transitGrowth)}
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      {AdminIcons.truck(18)}
                    </div>
                  </div>

                  {/* Card 3: رسیده به گمرک */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>رسیده به گمرک</span>
                      <span className={styles.metricValue}>{customsCount}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>سفارش</span>
                      {renderGrowthSub(customsGrowth)}
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      {AdminIcons.settings(18)}
                    </div>
                  </div>

                  {/* Card 4: در ایران */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>در ایران</span>
                      <span className={styles.metricValue}>{iranCount}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>سفارش</span>
                      {renderGrowthSub(iranGrowth)}
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                      {AdminIcons.bag(18)}
                    </div>
                  </div>

                  {/* Card 5: تحویل شده */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>تحویل شده</span>
                      <span className={styles.metricValue}>{deliveredCount.toLocaleString()}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>سفارش</span>
                      {renderGrowthSub(deliveredGrowth)}
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      {AdminIcons.check(18)}
                    </div>
                  </div>
                </div>

                {/* Filter Strip */}
                <div className={styles.filterStrip}>
                  <div className={styles.filterControlsLeft}>
                    {/* Search bar input */}
                    <div className={styles.searchBarWrapper}>
                      <span className={styles.searchBarIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.search(13)}</span>
                      <input 
                        type="text" 
                        placeholder="جستجو کنید..." 
                        value={shipmentSearchQuery}
                        onChange={(e) => {
                          setShipmentSearchQuery(e.target.value);
                          setPagination(previous => ({ ...previous, page: 1 }));
                        }}
                        className={styles.searchBarInput} 
                      />
                    </div>

                    {/* Status Filter */}
                    <select 
                      value={shipmentStatusFilter} 
                      onChange={(e) => {
                        setShipmentStatusFilter(e.target.value);
                        setPagination(previous => ({ ...previous, page: 1 }));
                      }}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه وضعیت‌ها</option>
                      <option value="PENDING">در انتظار</option>
                      <option value="READY">آماده ارسال</option>
                      <option value="SHIPPED">در حال ارسال</option>
                      <option value="IN_TRANSIT">رسیده به گمرک</option>
                      <option value="OUT_FOR_DELIVERY">در ایران</option>
                      <option value="DELIVERED">تحویل شده</option>
                      <option value="FAILED">مشکل در ارسال</option>
                      <option value="CANCELLED">لغو شده</option>
                    </select>

                    {/* Method Filter */}
                    <select 
                      value={shipmentMethodFilter} 
                      onChange={(e) => {
                        setShipmentMethodFilter(e.target.value);
                        setPagination(previous => ({ ...previous, page: 1 }));
                      }}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه روش‌ها</option>
                      {(filterOptions.methods?.length ? filterOptions.methods : ['هوایی', 'زمینی']).map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>

                    {/* Recipient Filter */}
                    <select 
                      value={shipmentRecipientFilter} 
                      onChange={(e) => {
                        setShipmentRecipientFilter(e.target.value);
                        setPagination(previous => ({ ...previous, page: 1 }));
                      }}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه گیرنده‌ها</option>
                      {uniqueRecipients.map(rec => (
                        <option key={rec} value={rec}>{rec}</option>
                      ))}
                    </select>

                    <div className={styles.advFilterBtn} style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{AdminIcons.calendar(12)}</span>
                      <input
                        type="date"
                        value={shipmentDateFrom}
                        onChange={event => {
                          setShipmentDateFrom(event.target.value);
                          setPagination(previous => ({ ...previous, page: 1 }));
                        }}
                        style={{ background: 'transparent', border: 0, color: 'inherit', font: 'inherit' }}
                      />
                      <span>-</span>
                      <input
                        type="date"
                        value={shipmentDateTo}
                        onChange={event => {
                          setShipmentDateTo(event.target.value);
                          setPagination(previous => ({ ...previous, page: 1 }));
                        }}
                        style={{ background: 'transparent', border: 0, color: 'inherit', font: 'inherit' }}
                      />
                    </div>
                  </div>

                  <button type="button" className={styles.advFilterBtn}>
                    <span>{AdminIcons.sliders(12)}</span> فیلتر پیشرفته
                  </button>
                </div>

                {/* Split Workspace */}
                <div className={styles.customerSplitGrid}>
                  
                  {/* LEFT SPLIT COLUMN: Main Shipments Table */}
                  <div style={{ background: '#11131a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.adminTable}>
                        <thead>
                          <tr>
                            <th>شماره ارسال</th>
                            <th>گیرنده</th>
                            <th>روش ارسال</th>
                            <th>وضعیت</th>
                            <th>تاریخ ارسال</th>
                            <th>تاریخ به‌روزرسانی</th>
                            <th>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr key="loading-shipments">
                              <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>در حال دریافت ارسال‌ها...</td>
                            </tr>
                          ) : errorMessage ? (
                            <tr key="error-shipments">
                              <td colSpan="7" style={{ textAlign: 'center', color: '#ef4444', padding: '50px 0' }}>{errorMessage}</td>
                            </tr>
                          ) : filteredShips.length === 0 ? (
                            <tr key="empty-shipments">
                              <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>مرسوله‌ای یافت نشد.</td>
                            </tr>
                          ) : (
                            filteredShips.map(ship => {
                              const isSelected = selectedShipmentId === ship.id;
                              return (
                                <tr 
                                  key={ship.id}
                                  onClick={() => selectShipment(ship.id)}
                                  className={isSelected ? styles.activeRowHighlight : ''}
                                  style={{ 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s', 
                                    backgroundColor: isSelected ? 'rgba(248, 120, 32, 0.08)' : 'transparent',
                                    borderRight: isSelected ? '4px solid #f87820' : 'none'
                                  }}
                                >
                                  {/* Shipment Code */}
                                  <td style={{ fontWeight: '850', color: '#ff9d00', fontFamily: 'monospace', fontSize: '12px' }}>
                                    {ship.id}
                                  </td>

                                  {/* Recipient Name */}
                                  <td style={{ fontWeight: 'bold', color: '#fff' }}>{ship.recipient}</td>

                                  {/* Shipping Method airplane/truck icons */}
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {ship.method === 'هوایی' ? (
                                        <>
                                          <span style={{ color: '#3b82f6', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.plane(14)}</span>
                                          <span>هوایی</span>
                                        </>
                                      ) : (
                                        <>
                                          <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.truck(14)}</span>
                                          <span>زمینی</span>
                                        </>
                                      )}
                                    </div>
                                  </td>

                                  {/* Status Badges */}
                                  <td>
                                    {ship.status === 'SHIPPED' && <span className={styles.badgeActive} style={{ fontSize: '10px' }}>در حال ارسال</span>}
                                    {ship.status === 'IN_TRANSIT' && <span className={styles.badgeCustoms}>رسیده به گمرک</span>}
                                    {ship.status === 'OUT_FOR_DELIVERY' && <span className={styles.badgeIran}>در ایران</span>}
                                    {ship.status === 'DELIVERED' && <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px' }}>تحویل شده</span>}
                                    {ship.status === 'FAILED' && <span className={styles.badgeProblem}>مشکل در ارسال</span>}
                                    {['PENDING', 'READY', 'CANCELLED'].includes(ship.status) && <span className={styles.badgeIran}>{statusLabel(ship.status)}</span>}
                                  </td>

                                  {/* Dates */}
                                  <td style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui', fontSize: '12px' }}>{ship.dateShipped}</td>
                                  <td style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui', fontSize: '12px' }}>{ship.dateUpdated}</td>

                                  {/* Live Status Select & Delete operations cell */}
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                      {/* Update Status Inline Select */}
                                      <select 
                                        value={ship.status} 
                                        onChange={(e) => handleUpdateShipmentStatus(ship.id, e.target.value)}
                                        disabled={!canEditShipments || updatingShipmentId === ship.id || ship.allowedTransitions.length === 0}
                                        className={styles.filterSelect}
                                        style={{ padding: '2px 8px', fontSize: '10.5px', minWidth: '95px', height: '24px' }}
                                      >
                                        {SHIPMENT_STATUS_OPTIONS
                                          .filter(option => option.value === ship.status || ship.allowedTransitions.includes(option.value))
                                          .map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                      </select>

                                      {/* Trash Button */}
                                      <button 
                                        onClick={() => handleDeleteShipment(ship.id)}
                                        disabled={!canEditShipments || updatingShipmentId === ship.id || !ship.allowedTransitions.includes('CANCELLED')}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
                                        title="حذف مرسوله"
                                      >
                                        {AdminIcons.trash(13)}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Farsi Pagination Controls */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Left Page selection numbers in English */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className={styles.advFilterBtn}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          disabled={pagination.page <= 1 || isLoading}
                          onClick={() => setPagination(previous => ({ ...previous, page: Math.max(1, previous.page - 1) }))}
                        >&lt;</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#f87820', color: '#fff', borderColor: '#f87820' }}>{pagination.page}</button>
                        <button
                          className={styles.advFilterBtn}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          disabled={pagination.page >= pagination.totalPages || isLoading}
                          onClick={() => setPagination(previous => ({ ...previous, page: Math.min(previous.totalPages, previous.page + 1) }))}
                        >&gt;</button>
                      </div>

                      {/* Right Results Count */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11.5px', color: '#8b92a5' }}>
                          نمایش {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total} نتیجه
                        </span>
                        <select
                          value={pagination.limit}
                          onChange={event => setPagination(previous => ({ ...previous, page: 1, limit: Number(event.target.value) }))}
                          className={styles.filterSelect}
                          style={{ padding: '4px 8px', minWidth: '55px', height: '28px', fontSize: '11px' }}
                        >
                          <option value="20">20</option>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SPLIT COLUMN: Sticky Sidebar Widgets Panel */}
                  <div className={styles.shipmentsRightWidgetsContainer}>
                    {selectedShipmentId === '' ? (
                      <>
                        {/* Widget 1: Doughnut Chart SVG representation */}
                        <div className={styles.shipmentsDoughnutCard}>
                          <h3 className={styles.shipmentsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{AdminIcons.chart(14)} وضعیت ارسال‌ها</h3>
                          
                          <div className={styles.doughnutWrapper}>
                            {/* Circular doughnut SVG graphics */}
                            <div className={styles.doughnutSvgContainer}>
                              <svg width="120" height="120" viewBox="0 0 120 120">
                                {/* Background Track Circle */}
                                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                                
                                {/* Segment 1: Delivered (green circle) */}
                                {deliveredCount > 0 && (() => {
                                  const { dashOffset, rotation } = getStrokeProps(deliveredCount, 0);
                                  return (
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="12" 
                                            strokeDasharray="314" strokeDashoffset={dashOffset} transform={`rotate(${rotation} 60 60)`} />
                                  );
                                })()}

                                {/* Segment 2: In transit (blue segment) */}
                                {transitCount > 0 && (() => {
                                  const { dashOffset, rotation } = getStrokeProps(transitCount, deliveredCount);
                                  return (
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#3b82f6" strokeWidth="12" 
                                            strokeDasharray="314" strokeDashoffset={dashOffset} transform={`rotate(${rotation} 60 60)`} />
                                  );
                                })()}

                                {/* Segment 3: Customs (orange segment) */}
                                {customsCount > 0 && (() => {
                                  const { dashOffset, rotation } = getStrokeProps(customsCount, deliveredCount + transitCount);
                                  return (
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f59e0b" strokeWidth="12" 
                                            strokeDasharray="314" strokeDashoffset={dashOffset} transform={`rotate(${rotation} 60 60)`} />
                                  );
                                })()}

                                {/* Segment 4: In Iran (purple segment) */}
                                {iranCount > 0 && (() => {
                                  const { dashOffset, rotation } = getStrokeProps(iranCount, deliveredCount + transitCount + customsCount);
                                  return (
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#a855f7" strokeWidth="12" 
                                            strokeDasharray="314" strokeDashoffset={dashOffset} transform={`rotate(${rotation} 60 60)`} />
                                  );
                                })()}

                                {/* Segment 5: Problem (red segment) */}
                                {problemCount > 0 && (() => {
                                  const { dashOffset, rotation } = getStrokeProps(problemCount, deliveredCount + transitCount + customsCount + iranCount);
                                  return (
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#ef4444" strokeWidth="12" 
                                            strokeDasharray="314" strokeDashoffset={dashOffset} transform={`rotate(${rotation} 60 60)`} />
                                  );
                                })()}
                              </svg>
                              
                              <div className={styles.doughnutCenterText}>
                                <span className={styles.doughnutCenterNum}>{totalCount}</span>
                                <span className={styles.doughnutCenterLabel}>کل ارسال‌ها</span>
                              </div>
                            </div>

                            {/* Chart Legend listing matching mockup percentages */}
                            <div className={styles.doughnutLegendList}>
                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }} />
                                  <span className={styles.legendText}>در حال ارسال</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{transitCount}</span>
                                  <span className={styles.legendPct}>({pct(transitCount)})</span>
                                </div>
                              </div>

                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }} />
                                  <span className={styles.legendText}>رسیده به گمرک</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{customsCount}</span>
                                  <span className={styles.legendPct}>({pct(customsCount)})</span>
                                </div>
                              </div>

                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#a855f7' }} />
                                  <span className={styles.legendText}>در ایران</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{iranCount}</span>
                                  <span className={styles.legendPct}>({pct(iranCount)})</span>
                                </div>
                              </div>

                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} />
                                  <span className={styles.legendText}>تحویل شده</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{deliveredCount}</span>
                                  <span className={styles.legendPct}>({pct(deliveredCount)})</span>
                                </div>
                              </div>

                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }} />
                                  <span className={styles.legendText}>مشکل</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{problemCount}</span>
                                  <span className={styles.legendPct}>({pct(problemCount)})</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button type="button" className={styles.advFilterBtn} style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                            مشاهده گزارش کامل
                          </button>
                        </div>

                        {/* Widget 2: Recent Updates Timeline */}
                        <div className={styles.shipmentsTimelineCard}>
                          <h3 className={styles.shipmentsCardTitle}>آخرین به‌روزرسانی‌ها</h3>
                          
                          <div className={styles.timelineList}>
                            {allShips.slice(0, 5).map((ship, idx) => {
                              const dotColor = ship.status === 'DELIVERED' ? '#10b981' :
                                               ship.status === 'SHIPPED' ? '#3b82f6' :
                                               ship.status === 'IN_TRANSIT' ? '#f59e0b' :
                                               ship.status === 'OUT_FOR_DELIVERY' ? '#a855f7' : '#ef4444';
                              
                              const statusDesc = ship.status === 'DELIVERED' ? 'با موفقیت تحویل شد.' :
                                                 ship.status === 'SHIPPED' ? 'به مسیر ارسال انتقال یافت.' :
                                                 ship.status === 'IN_TRANSIT' ? 'به گمرک رسید.' :
                                                 ship.status === 'OUT_FOR_DELIVERY' ? 'وارد انبار ایران شد.' : 'مشکل در ارسال گزارش شد.';
                              
                              return (
                                <div key={ship.id || idx} className={styles.timelineItem}>
                                  <span className={styles.timelineItemDot} style={{ backgroundColor: dotColor }} />
                                  <span className={styles.timelineTime}>{ship.dateUpdated || 'اخیراً'}</span>
                                  <span className={styles.timelineDesc}><strong>{ship.id}</strong> {statusDesc}</span>
                                </div>
                              );
                            })}
                            {allShips.length === 0 && (
                              <p style={{ color: '#8b92a5', fontSize: '11px', textAlign: 'center', padding: '10px' }}>به‌روزرسانی جدیدی ثبت نشده است.</p>
                            )}
                          </div>
                        </div>

                        {/* Widget 3: Active Transit tracking box preview list */}
                        <div className={styles.shipmentsTrackingCard}>
                          <div className={styles.shipmentsCardTitle}>
                            <span>ارسال‌های در حال پیگیری</span>
                            <span className={styles.trackingCardHeaderLink}>مشاهده همه</span>
                          </div>
                          
                          <div className={styles.trackingList}>
                            {allShips.filter(s => s.status === 'SHIPPED').slice(0, 3).map((ship, idx) => (
                              <div key={ship.id || idx} className={styles.trackingBoxItem}>
                                <div className={styles.trackingBoxHeader}>
                                  <span className={styles.trackingBoxCode}>{ship.awbCode || 'کد رهگیری ثبت نشده'}</span>
                                  <span className={styles.badgeActive} style={{ fontSize: '8.5px', padding: '1px 6px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>در حال ارسال</span>
                                </div>
                                <div className={styles.trackingBoxRoute}>
                                  <div className={styles.trackingBoxRouteDetails}>
                                    <span>دبی</span>
                                    <span style={{ fontSize: '10px', color: '#f87820' }}>↔</span>
                                    <span>{ship.recipient || 'ایران'}</span>
                                  </div>
                                  <span className={styles.trackingBoxRouteEst}>تاریخ: {ship.dateUpdated}</span>
                                </div>
                              </div>
                            ))}
                            {allShips.filter(s => s.status === 'SHIPPED').length === 0 && (
                              <p style={{ color: '#8b92a5', fontSize: '11px', textAlign: 'center', padding: '10px' }}>مرسوله در حال ارسالی وجود ندارد.</p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (() => {
                      const selectedShipmentData = selectedShipment || allShips.find(s => s.id === selectedShipmentId);
                      if (!selectedShipmentData) return <p style={{ color: '#8b92a5', textAlign: 'center', padding: '20px' }}>در حال دریافت جزئیات مرسوله...</p>;
                      const selectedShip = createShipmentView(selectedShipmentData);
                      
                      // Format price to Persian Currency
                      const formatToman = (val) => {
                        return Math.round(val).toLocaleString('fa-IR') + ' تومان';
                      };

                      // Tracking timeline status checking
                      const getStatusProgress = (status) => {
                        const stages = [
                          { key: 'SHIPPED', label: 'ثبت اولیه و خروج از دبی', desc: 'تحویل کارگو در دبی و صدور بارنامه' },
                          { key: 'IN_TRANSIT', label: 'رسیده به گمرک کشور', desc: 'تخلیه بار در گمرک مرزی ایران' },
                          { key: 'OUT_FOR_DELIVERY', label: 'انبار مرکزی تهران', desc: 'آماده‌سازی جهت ارسال درون‌شهری' },
                          { key: 'DELIVERED', label: 'تحویل نهایی مشتری', desc: 'تحویل مرسوله و امضای فاکتور' }
                        ];

                        let activeIndex = 0;
                        if (status === 'IN_TRANSIT') activeIndex = 1;
                        else if (status === 'OUT_FOR_DELIVERY') activeIndex = 2;
                        else if (status === 'DELIVERED') activeIndex = 3;
                        else if (status === 'FAILED') activeIndex = -1; // problem state

                        return { stages, activeIndex };
                      };

                      const { stages, activeIndex } = getStatusProgress(selectedShip.status);

                      return (
                        <div className={styles.shipmentDetailsCard}>
                          {/* Details Header with back button */}
                          <div className={styles.detailsHeader}>
                            <h3>{AdminIcons.clipboard(18)} جزئیات کامل مرسوله</h3>
                            <button 
                              type="button"
                              onClick={() => {
                                setSelectedShipmentId('');
                                setSelectedShipment(null);
                              }}
                              className={styles.backToStatsBtn}
                            >
                              {AdminIcons.back(12)} برگشت به آمار
                            </button>
                          </div>

                          {/* Shipment AWB and tracking ID */}
                          <div className={styles.shipmentMainCodeRow}>
                            <span className={styles.shipmentMainCode}>{selectedShip.id}</span>
                            <div>
                              {selectedShip.status === 'SHIPPED' && <span className={styles.badgeActive} style={{ fontSize: '10px' }}>در حال ارسال</span>}
                              {selectedShip.status === 'IN_TRANSIT' && <span className={styles.badgeCustoms}>رسیده به گمرک</span>}
                              {selectedShip.status === 'OUT_FOR_DELIVERY' && <span className={styles.badgeIran}>در انبار ایران</span>}
                              {selectedShip.status === 'DELIVERED' && <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px' }}>تحویل شده</span>}
                              {selectedShip.status === 'FAILED' && <span className={styles.badgeProblem}>دارای مشکل</span>}
                              {['PENDING', 'READY', 'CANCELLED'].includes(selectedShip.status) && <span className={styles.badgeIran}>{statusLabel(selectedShip.status)}</span>}
                            </div>
                          </div>

                          {/* Mapped order details */}
                          <div className={styles.productMiniSection}>
                            {selectedShip.productImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={selectedShip.productImg} alt={selectedShip.productName} className={styles.productMiniImg} />
                            ) : (
                              <span className={styles.productMiniImg} style={{ display: 'grid', placeItems: 'center', color: '#8b92a5' }}>{AdminIcons.package(20)}</span>
                            )}
                            <div className={styles.productMiniInfo}>
                              <span className={styles.productMiniName}>{selectedShip.productName || 'ثبت نشده'}</span>
                              <span 
                                className={styles.productMiniOrderId}
                                onClick={() => {
                                  router.push(ADMIN_ROUTES.orders);
                                }}
                              >
                                شماره سفارش: {selectedShip.orderCode || selectedShip.orderId}
                              </span>
                            </div>
                          </div>

                          {/* Cargo weight, shipping fees and values */}
                          <div className={styles.specsGrid}>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.scale(12)} وزن بار</span>
                              <span className={styles.specValue}>{selectedShip.cargoWeight ? `${selectedShip.cargoWeight} کیلوگرم` : 'ثبت نشده'}</span>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.card(12)} هزینه ارسال کالا</span>
                              <span className={styles.specValue} style={{ color: '#ff9d00' }}>
                                {selectedShip.shippingCost ? formatToman(selectedShip.shippingCost) : 'ثبت نشده'}
                              </span>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.dollar(12)} ارزش کالای بار</span>
                              <span className={styles.specValue}>
                                {selectedShip.cargoValue ? formatToman(selectedShip.cargoValue) : 'ثبت نشده'}
                              </span>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.package(12)} نوع روش حمل</span>
                              <span className={styles.specValue}>
                                {selectedShip.method === 'هوایی' ? <span>{AdminIcons.plane(12)} ارسال هوایی سریع</span> : <span>{AdminIcons.truck(12)} ارسال زمینی کارگو</span>}
                              </span>
                            </div>
                          </div>

                          {/* Carrier and Airway Bill (AWB) Code */}
                          <div className={styles.addressSection} style={{ marginBottom: '16px' }}>
                            <h4 className={styles.addressTitle}>{AdminIcons.clipboard(18)} مشخصات بارنامه و خط حمل</h4>
                            <div className={styles.addressRow}>
                              <span className={styles.addressLabel}>شرکت حمل‌کننده:</span>
                              <span className={styles.addressVal}>{selectedShip.carrier || 'ثبت نشده'}</span>
                            </div>
                            <div className={styles.addressRow} style={{ marginTop: '4px' }}>
                              <span className={styles.addressLabel}>کد بارنامه بین‌المللی:</span>
                              <span className={styles.addressVal} style={{ fontFamily: 'monospace', color: '#ff9d00', fontSize: '11.5px' }}>
                                {selectedShip.awbCode || 'کد رهگیری ثبت نشده'}
                              </span>
                            </div>
                          </div>

                          {/* Recipient info, phone and shipping address */}
                          <div className={styles.addressSection}>
                            <h4 className={styles.addressTitle}>{AdminIcons.user(14)} مشخصات گیرنده و آدرس تحویل</h4>
                            <div className={styles.addressRow}>
                              <span className={styles.addressLabel}>تحویل‌گیرنده:</span>
                              <span className={styles.addressVal}>{selectedShip.recipient}</span>
                            </div>
                            <div className={styles.addressRow} style={{ marginTop: '4px' }}>
                              <span className={styles.addressLabel}>شماره تماس:</span>
                              <span className={styles.addressVal} dir="ltr">{selectedShip.phone || 'ثبت نشده'}</span>
                            </div>
                            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                              <span className={styles.addressLabel} style={{ display: 'block', marginBottom: '4px' }}>آدرس ارسال:</span>
                              <span style={{ fontSize: '11px', color: '#c4c8d4', lineHeight: '1.5', display: 'block' }}>{selectedShip.address || 'ثبت نشده'}</span>
                            </div>
                          </div>

                          {/* Interactive transit timeline stages */}
                          <div className={styles.trackingTimelineSection}>
                            <h4 className={styles.timelineHeading}>{AdminIcons.sliders(14)} مراحل وضعیت ارسال مرسوله</h4>
                            <div className={styles.timelineStages}>
                              {stages.map((stage, idx) => {
                                let isCompleted = activeIndex >= idx;
                                let isActive = activeIndex === idx;
                                if (activeIndex === -1) {
                                  // problem state: first stage is completed, second stage is warning
                                  isCompleted = idx === 0;
                                  isActive = idx === 1;
                                }

                                return (
                                  <div key={stage.key} className={styles.timelineStage}>
                                    <span 
                                      className={`${styles.stageDot} ${isCompleted ? styles.stageDotCompleted : ''} ${isActive ? styles.stageDotActive : ''}`} 
                                      style={{
                                        backgroundColor: activeIndex === -1 && idx === 1 ? '#ef4444' : undefined,
                                        boxShadow: activeIndex === -1 && idx === 1 ? '0 0 0 4px rgba(239, 68, 68, 0.2)' : undefined
                                      }}
                                    />
                                    <div className={styles.stageInfo}>
                                      <span className={`${styles.stageTitle} ${isCompleted ? styles.stageTitleCompleted : ''} ${isActive ? styles.stageTitleActive : ''}`}
                                        style={{ color: activeIndex === -1 && idx === 1 ? '#ef4444' : undefined }}
                                      >
                                        {stage.label} {activeIndex === -1 && idx === 1 && <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', marginRight: '4px' }}>{AdminIcons.alert(12)}</span>}
                                      </span>
                                      <span className={styles.stageSubtext}>
                                        {activeIndex === -1 && idx === 1 ? 'توقف مرسوله به دلیل بازرسی گمرکی یا نقض مدارک' : stage.desc}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Print packing label actions */}
                          <button 
                            type="button" 
                            className={styles.printLabelActionBtn}
                            onClick={() => alert(`برچسب بارکد دار مرسوله ${selectedShip.id} آماده چاپ شد. جهت ارسال دستور چاپ به چاپگر حرارتی انبار دبی تایید نمایید.`)}
                          >
                            {AdminIcons.printer(12)} چاپ بارکد و برچسب مرسوله ارسالی
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* MODAL: Register New Shipment */}
                {isAddShipmentOpen && (
                  <div className={styles.modalOverlay} onClick={() => setIsAddShipmentOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.modalHeader}>
                        <h3>{AdminIcons.package(16)} ثبت اطلاعات مرسوله ارسالی جدید</h3>
                        <button className={styles.modalCloseBtn} onClick={() => setIsAddShipmentOpen(false)}>×</button>
                      </div>
                      
                      <form onSubmit={handleAddShipmentSubmit}>
                        <div className={styles.modalBody}>
                          
                          <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                            <label>انتخاب گیرنده مرسوله:</label>
                            <select 
                              value={newShipmentForm.orderId}
                              onChange={(e) => setNewShipmentForm(prev => ({ ...prev, orderId: e.target.value }))}
                              className={styles.inputField}
                              required
                            >
                              {eligibleOrders.map(order => (
                                <option key={order.id} value={order.id}>
                                  {order.customer?.name || order.orderCode} ({order.customer?.city || order.orderCode})
                                </option>
                              ))}
                              {eligibleOrders.length === 0 && <option value="">سفارش واجد شرایطی وجود ندارد.</option>}
                            </select>
                          </div>

                          <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                            <div className={styles.formGroup}>
                              <label>شرکت حمل‌کننده:</label>
                              <input
                                type="text"
                                value={newShipmentForm.carrier}
                                onChange={event => setNewShipmentForm(previous => ({ ...previous, carrier: event.target.value }))}
                                className={styles.inputField}
                                maxLength={160}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>کد بارنامه بین‌المللی:</label>
                              <input
                                type="text"
                                value={newShipmentForm.trackingNumber}
                                onChange={event => setNewShipmentForm(previous => ({ ...previous, trackingNumber: event.target.value }))}
                                className={styles.inputField}
                                maxLength={160}
                              />
                            </div>
                          </div>

                          <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                            <label>لینک رهگیری:</label>
                            <input
                              type="url"
                              value={newShipmentForm.trackingUrl}
                              onChange={event => setNewShipmentForm(previous => ({ ...previous, trackingUrl: event.target.value }))}
                              className={styles.inputField}
                              maxLength={2048}
                              placeholder="https://"
                            />
                          </div>

                          <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                            <label>یادداشت:</label>
                            <textarea
                              value={newShipmentForm.notes}
                              onChange={event => setNewShipmentForm(previous => ({ ...previous, notes: event.target.value }))}
                              className={styles.inputField}
                              maxLength={4000}
                              rows={3}
                            />
                          </div>

                          <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                            <div className={styles.formGroup}>
                              <label>روش حمل و ارسال:</label>
                              <select 
                                value={newShipmentForm.method} 
                                onChange={(e) => setNewShipmentForm(prev => ({ ...prev, method: e.target.value }))}
                                className={styles.inputField}
                              >
                                <option value="هوایی">هوایی</option>
                                <option value="زمینی">زمینی</option>
                              </select>
                            </div>

                            <div className={styles.formGroup}>
                              <label>وضعیت فعلی ارسال:</label>
                              <select 
                                value={newShipmentForm.status} 
                                onChange={(e) => setNewShipmentForm(prev => ({ ...prev, status: e.target.value }))}
                                className={styles.inputField}
                              >
                                <option value="SHIPPED">در حال ارسال</option>
                                <option value="IN_TRANSIT">رسیده به گمرک</option>
                                <option value="OUT_FOR_DELIVERY">در ایران (انبار)</option>
                                <option value="DELIVERED">تحویل شده</option>
                                <option value="FAILED">دارای مشکل</option>
                              </select>
                            </div>
                          </div>

                          <p style={{ fontSize: '11px', color: '#8b92a5', lineHeight: '1.5', margin: '10px 0 0 0' }}>
                            توجه: اگر کد رهگیری شرکت حمل هنوز صادر نشده است، این فیلد را خالی بگذارید؛ سیستم کد ساختگی تولید نمی‌کند.
                          </p>

                        </div>

                        <div className={styles.modalFooter}>
                          <button type="button" className={styles.advFilterBtn} onClick={() => setIsAddShipmentOpen(false)}>انصراف</button>
                          <button 
                            type="submit" 
                            disabled={updatingShipmentId === 'create' || eligibleOrders.length === 0}
                            className={styles.saveFormBtn}
                            style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 'bold' }}
                          >
                            ثبت مرسوله جدید
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            );
}

export default function ShipmentsPage() {
  return (
    <AdminShell activeTab="shipments">
      <ShipmentsContent />
    </AdminShell>
  );
}
