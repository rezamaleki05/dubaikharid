'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell, { useAdminShellData } from '@/components/admin/AdminShell';

const INITIAL_SHIPMENTS_SEED = [];
const SHIPMENTS_STORAGE_KEY = 'dubaiKharidShipments';
const CUSTOMERS_STORAGE_KEY = 'dubaiKharidCustomers';
const USERS_STORAGE_KEY = 'dubaiKharidUsers';

const readStoredArray = (key, fallback = []) => {
  try {
    const savedValue = localStorage.getItem(key);
    if (savedValue === null) return fallback;
    const parsedValue = JSON.parse(savedValue);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
};

const createShipmentView = (shipment, index = 0) => {
  const safeShipment = shipment && typeof shipment === 'object' ? shipment : {};

  return {
    ...safeShipment,
    id: String(
      safeShipment.id ??
      safeShipment.shipmentId ??
      safeShipment.trackingCode ??
      safeShipment.trackingNumber ??
      `TRK-${index + 1}`
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
      'transit'
    ),
    dateShipped: String(
      safeShipment.dateShipped ??
      safeShipment.dispatchedAt ??
      safeShipment.shippedAt ??
      safeShipment.createdAt ??
      ''
    ),
    dateUpdated: String(
      safeShipment.dateUpdated ??
      safeShipment.updatedAt ??
      safeShipment.deliveredAt ??
      ''
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
    )
  };
};

function ShipmentsContent() {
  const router = useRouter();
  const { leads: sharedLeads } = useAdminShellData();
  const leads = useMemo(
    () => (Array.isArray(sharedLeads) ? sharedLeads : []),
    [sharedLeads]
  );
  const [shipments, setShipments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [websiteUsers, setWebsiteUsers] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('همه');
  const [shipmentMethodFilter, setShipmentMethodFilter] = useState('همه');
  const [shipmentRecipientFilter, setShipmentRecipientFilter] = useState('همه');
  const [isAddShipmentOpen, setIsAddShipmentOpen] = useState(false);
  const [newShipmentForm, setNewShipmentForm] = useState({
    id: '',
    recipient: 'علی محمدی',
    method: 'هوایی',
    status: 'transit',
    dateShipped: '1403/03/20',
    dateUpdated: '1403/03/20'
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const savedShipments = readStoredArray(SHIPMENTS_STORAGE_KEY, INITIAL_SHIPMENTS_SEED);
    setShipments(savedShipments);

    if (localStorage.getItem(SHIPMENTS_STORAGE_KEY) === null) {
      localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(INITIAL_SHIPMENTS_SEED));
    }

    setCustomers(readStoredArray(CUSTOMERS_STORAGE_KEY));
    setWebsiteUsers(readStoredArray(USERS_STORAGE_KEY));
  }, []);

  // Preserve the legacy one-shipment-per-order synchronization.
  useEffect(() => {
    if (leads.length === 0) return;

    const currentShipments = readStoredArray(SHIPMENTS_STORAGE_KEY, INITIAL_SHIPMENTS_SEED);
    let hasChanges = false;

    leads.forEach((lead) => {
      if (!lead || typeof lead !== 'object') return;
      const leadId = String(lead.id ?? '');
      if (!leadId || currentShipments.some(shipment => String(shipment?.orderId ?? '') === leadId)) {
        return;
      }

      currentShipments.unshift({
        id: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        orderId: lead.id,
        recipient: lead.customerName,
        method: Number(lead.weight) > 2 ? 'زمینی' : 'هوایی',
        status: lead.status === 'delivered' ? 'delivered' : 'transit',
        dateShipped: '1403/03/20',
        dateUpdated: '1403/03/20',
        cargoWeight: lead.weight || 0.5,
        cargoValue: lead.totalToman || 15000000,
        shippingCost: lead.priceDetails?.shipping || 2500000,
        productName: lead.productName || 'کالای وارداتی',
        productImg: lead.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80',
        address: lead.address || 'تهران',
        phone: lead.phone || '09123456789',
        carrier: 'دبی اکسپرس (Dubai Express)',
        awbCode: `AWB-${Math.floor(100000000 + Math.random() * 900000000)}`
      });
      hasChanges = true;
    });

    if (hasChanges) {
      setShipments(currentShipments);
      localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(currentShipments));
    }
  }, [leads]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persistShipments = (nextShipments) => {
    const safeShipments = Array.isArray(nextShipments) ? nextShipments : [];
    setShipments(safeShipments);
    localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(safeShipments));
  };

  const getMergedCustomers = () => {
    const list = (Array.isArray(customers) ? customers : [])
      .filter(customer => customer && typeof customer === 'object')
      .map((customer, index) => ({
        ...customer,
        id: String(customer.id ?? `CUST-${index + 1}`),
        name: String(customer.name ?? 'نامشخص'),
        phone: String(customer.phone ?? ''),
        city: String(customer.city ?? 'تهران')
      }));

    (Array.isArray(websiteUsers) ? websiteUsers : []).forEach((user, index) => {
      if (!user || typeof user !== 'object') return;
      const userPhone = String(user.phone ?? '');
      const customerIndex = list.findIndex(customer => customer.phone === userPhone);
      const userLeads = leads.filter(lead => String(lead?.phone ?? '') === userPhone);
      const orderCount = userLeads.length;
      const totalToman = userLeads.reduce(
        (total, lead) => total + (Number.parseFloat(lead?.totalToman) || 0),
        0
      );
      const maxOrder = userLeads.reduce(
        (maximum, lead) => Math.max(maximum, Number.parseFloat(lead?.totalToman) || 0),
        0
      );
      const avgOrder = orderCount > 0 ? Math.round(totalToman / orderCount) : 0;
      const dateRegistered = String(user.dateRegistered ?? user.dateReg ?? '1403/01/01');
      const mappedUser = {
        id: String(user.id ?? `CUST-WEB-${userPhone || index}`),
        name: String(user.name ?? 'نامشخص'),
        phone: userPhone,
        email: String(user.email ?? 'نامشخص'),
        city: String(user.city ?? 'تهران'),
        totalToman,
        orderCount,
        status: String(user.status ?? 'active'),
        dateReg: dateRegistered,
        group: String(user.group ?? 'سایت'),
        notes: String(user.notes ?? 'کاربر ثبت‌نامی سایت'),
        avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'نامشخص')}&backgroundColor=f87820&textColor=ffffff`,
        performance: {
          avgOrder,
          lastOrder: String(userLeads[0]?.date ?? dateRegistered),
          firstOrder: String(userLeads[userLeads.length - 1]?.date ?? dateRegistered),
          maxOrder
        }
      };

      if (customerIndex !== -1) {
        list[customerIndex] = {
          ...mappedUser,
          ...list[customerIndex],
          totalToman: totalToman > 0 ? totalToman : Number(list[customerIndex].totalToman) || 0,
          orderCount: orderCount > 0 ? orderCount : Number(list[customerIndex].orderCount) || 0
        };
      } else {
        list.push(mappedUser);
      }
    });

    return list;
  };

  const getMergedShipments = () => {
    const list = (Array.isArray(shipments) ? shipments : [])
      .map((shipment, index) => createShipmentView(shipment, index));

    leads.forEach((order) => {
      if (!order || typeof order !== 'object') return;
      const orderId = String(order.id ?? '');
      const isRequest = ['pending', 'price_tagged', 'approved', 'new_order'].includes(order.status);
      if (isRequest || !orderId) return;

      const exists = list.some(shipment => (
        shipment.orderId === orderId ||
        shipment.id === `TRK-${orderId}`
      ));
      if (exists) return;

      let shipmentStatus = 'transit';
      if (order.status === 'warehouse_dubai') shipmentStatus = 'customs';
      if (order.status === 'shipped') shipmentStatus = 'iran';
      if (order.status === 'delivered') shipmentStatus = 'delivered';

      list.push(createShipmentView({
        id: `TRK-${orderId}`,
        orderId,
        recipient: order.name ?? order.customerName,
        method: order.shippingMethod || 'هوایی',
        status: shipmentStatus,
        dateShipped: order.date || '1403/03/15',
        dateUpdated: order.date || '1403/03/15'
      }, list.length));
    });

    return list;
  };

  const handleAddShipmentSubmit = (event) => {
    event.preventDefault();
    if (!String(newShipmentForm.recipient ?? '').trim()) {
      alert('لطفاً گیرنده ارسال را وارد کنید.');
      return;
    }

    const newId = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    const farsiDate = `1403/03/${String(Math.floor(10 + Math.random() * 10))}`;
    const newShipment = {
      id: newId,
      recipient: newShipmentForm.recipient,
      method: newShipmentForm.method,
      status: newShipmentForm.status,
      dateShipped: farsiDate,
      dateUpdated: farsiDate
    };

    persistShipments([newShipment, ...shipments]);
    setIsAddShipmentOpen(false);
    alert('مرسوله ارسالی جدید با موفقیت ثبت شد!');
  };

  const handleDeleteShipment = (shipmentId) => {
    if (!confirm('آیا از حذف این مرسوله ارسالی مطمئن هستید؟ داده‌های رهگیری آن برای همیشه پاک خواهند شد.')) {
      return;
    }

    persistShipments(shipments.filter(shipment => (
      String(shipment?.id ?? shipment?.shipmentId ?? '') !== String(shipmentId)
    )));
    if (selectedShipmentId === shipmentId) setSelectedShipmentId('');
    alert('مرسوله ارسالی با موفقیت حذف گردید.');
  };

  const handleUpdateShipmentStatus = (shipmentId, newStatus) => {
    persistShipments(shipments.map((shipment) => {
      const currentId = String(shipment?.id ?? shipment?.shipmentId ?? '');
      if (currentId !== String(shipmentId)) return shipment;

      return {
        ...shipment,
        status: newStatus,
        dateUpdated: `1403/03/${String(Math.floor(10 + Math.random() * 10))}`
      };
    }));
    alert('وضعیت مرسوله با موفقیت به‌روزرسانی شد!');
  };

            const allShips = getMergedShipments();
            const filteredShips = allShips.filter(s => {
              const matchSearch = !shipmentSearchQuery ||
                s.id.toLowerCase().includes(shipmentSearchQuery.toLowerCase()) ||
                s.recipient.toLowerCase().includes(shipmentSearchQuery.toLowerCase());

              const matchStatus = shipmentStatusFilter === 'همه' || s.status === shipmentStatusFilter;
              const matchMethod = shipmentMethodFilter === 'همه' || s.method === shipmentMethodFilter;
              const matchRecipient = shipmentRecipientFilter === 'همه' || s.recipient === shipmentRecipientFilter;

              return matchSearch && matchStatus && matchMethod && matchRecipient;
            });

            // Unique recipients for select filter
            const uniqueRecipients = Array.from(new Set(allShips.map(s => s.recipient)));

            // Calculate dynamic KPI metrics
            const totalCount = allShips.length;
            const transitCount = allShips.filter(s => s.status === 'transit').length;
            const customsCount = allShips.filter(s => s.status === 'customs').length;
            const iranCount = allShips.filter(s => s.status === 'iran').length;
            const deliveredCount = allShips.filter(s => s.status === 'delivered').length;
            const problemCount = allShips.filter(s => s.status === 'problem').length;

            // Calculate growth percentages comparing the last 30 days vs the previous 30 days
            const parseDate = (dStr) => {
              if (!dStr) return new Date(0);
              if (dStr.includes('T') || dStr.includes('-') || (isNaN(Date.parse(dStr)) === false && !dStr.includes('/'))) {
                return new Date(dStr);
              }
              const parts = dStr.split('/');
              if (parts.length === 3) {
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]);
                const d = parseInt(parts[2]);
                const gregYear = y + 621;
                return new Date(gregYear, m - 1, d);
              }
              return new Date(0);
            };

            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

            const curPeriod = allShips.filter(s => parseDate(s.dateShipped) >= thirtyDaysAgo);
            const prevPeriod = allShips.filter(s => {
              const d = parseDate(s.dateShipped);
              return d >= sixtyDaysAgo && d < thirtyDaysAgo;
            });

            const getGrowth = (currentCount, prevCount) => {
              if (prevCount === 0) {
                return currentCount > 0 ? 100 : 0;
              }
              return ((currentCount - prevCount) / prevCount) * 100;
            };

            const totalGrowth = getGrowth(curPeriod.length, prevPeriod.length);
            const transitGrowth = getGrowth(
              curPeriod.filter(s => s.status === 'transit').length,
              prevPeriod.filter(s => s.status === 'transit').length
            );
            const customsGrowth = getGrowth(
              curPeriod.filter(s => s.status === 'customs').length,
              prevPeriod.filter(s => s.status === 'customs').length
            );
            const iranGrowth = getGrowth(
              curPeriod.filter(s => s.status === 'iran').length,
              prevPeriod.filter(s => s.status === 'iran').length
            );
            const deliveredGrowth = getGrowth(
              curPeriod.filter(s => s.status === 'delivered').length,
              prevPeriod.filter(s => s.status === 'delivered').length
            );

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
                        setNewShipmentForm({
                          recipient: 'علی محمدی', method: 'هوایی', status: 'transit', dateShipped: '1403/03/20', dateUpdated: '1403/03/20'
                        });
                        setIsAddShipmentOpen(true);
                      }}
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
                        onChange={(e) => setShipmentSearchQuery(e.target.value)}
                        className={styles.searchBarInput}
                      />
                    </div>

                    {/* Status Filter */}
                    <select
                      value={shipmentStatusFilter}
                      onChange={(e) => setShipmentStatusFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه وضعیت‌ها</option>
                      <option value="transit">در حال ارسال</option>
                      <option value="customs">رسیده به گمرک</option>
                      <option value="iran">در ایران</option>
                      <option value="delivered">تحویل شده</option>
                      <option value="problem">مشکل در ارسال</option>
                    </select>

                    {/* Method Filter */}
                    <select
                      value={shipmentMethodFilter}
                      onChange={(e) => setShipmentMethodFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه روش‌ها</option>
                      <option value="هوایی">هوایی</option>
                      <option value="زمینی">زمینی</option>
                    </select>

                    {/* Recipient Filter */}
                    <select
                      value={shipmentRecipientFilter}
                      onChange={(e) => setShipmentRecipientFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه گیرنده‌ها</option>
                      {uniqueRecipients.map(rec => (
                        <option key={rec} value={rec}>{rec}</option>
                      ))}
                    </select>

                    {/* Date picker mock range */}
                    <div className={styles.advFilterBtn} style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{AdminIcons.calendar(12)}</span> 1403/03/01 - 1403/03/20
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
                          {filteredShips.length === 0 ? (
                            <tr key="empty-shipments">
                              <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>مرسوله‌ای یافت نشد.</td>
                            </tr>
                          ) : (
                            filteredShips.map(ship => {
                              const isSelected = selectedShipmentId === ship.id;
                              return (
                                <tr
                                  key={ship.id}
                                  onClick={() => setSelectedShipmentId(ship.id)}
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
                                    {ship.status === 'transit' && <span className={styles.badgeActive} style={{ fontSize: '10px' }}>در حال ارسال</span>}
                                    {ship.status === 'customs' && <span className={styles.badgeCustoms}>رسیده به گمرک</span>}
                                    {ship.status === 'iran' && <span className={styles.badgeIran}>در ایران</span>}
                                    {ship.status === 'delivered' && <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px' }}>تحویل شده</span>}
                                    {ship.status === 'problem' && <span className={styles.badgeProblem}>مشکل در ارسال</span>}
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
                                        className={styles.filterSelect}
                                        style={{ padding: '2px 8px', fontSize: '10.5px', minWidth: '95px', height: '24px' }}
                                      >
                                        <option value="transit">در حال ارسال</option>
                                        <option value="customs">به گمرک</option>
                                        <option value="iran">به انبار ایران</option>
                                        <option value="delivered">تحویل شده</option>
                                        <option value="problem">دارای مشکل</option>
                                      </select>

                                      {/* Trash Button */}
                                      <button
                                        onClick={() => handleDeleteShipment(ship.id)}
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
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&lt;</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#f87820', color: '#fff', borderColor: '#f87820' }}>1</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>2</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>3</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>4</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>5</button>
                        <span style={{ color: '#8b92a5', padding: '4px 4px' }}>...</span>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>125</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&gt;</button>
                      </div>

                      {/* Right Results Count */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11.5px', color: '#8b92a5' }}>
                          نمایش ۱ تا {filteredShips.length} از {totalCount} نتیجه
                        </span>
                        <select className={styles.filterSelect} style={{ padding: '4px 8px', minWidth: '55px', height: '28px', fontSize: '11px' }}>
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
                              const dotColor = ship.status === 'delivered' ? '#10b981' :
                                               ship.status === 'transit' ? '#3b82f6' :
                                               ship.status === 'customs' ? '#f59e0b' :
                                               ship.status === 'iran' ? '#a855f7' : '#ef4444';

                              const statusDesc = ship.status === 'delivered' ? 'با موفقیت تحویل شد.' :
                                                 ship.status === 'transit' ? 'به مسیر ارسال انتقال یافت.' :
                                                 ship.status === 'customs' ? 'به گمرک رسید.' :
                                                 ship.status === 'iran' ? 'وارد انبار ایران شد.' : 'مشکل در ارسال گزارش شد.';

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
                            {allShips.filter(s => s.status === 'transit').slice(0, 3).map((ship, idx) => (
                              <div key={ship.id || idx} className={styles.trackingBoxItem}>
                                <div className={styles.trackingBoxHeader}>
                                  <span className={styles.trackingBoxCode}>{ship.id}</span>
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
                            {allShips.filter(s => s.status === 'transit').length === 0 && (
                              <p style={{ color: '#8b92a5', fontSize: '11px', textAlign: 'center', padding: '10px' }}>مرسوله در حال ارسالی وجود ندارد.</p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (() => {
                      const selectedShip = allShips.find(s => s.id === selectedShipmentId);
                      if (!selectedShip) return <p style={{ color: '#8b92a5', textAlign: 'center', padding: '20px' }}>مرسوله مورد نظر یافت نشد.</p>;

                      // Format price to Persian Currency
                      const formatToman = (val) => {
                        return Math.round(val).toLocaleString('fa-IR') + ' تومان';
                      };

                      // Tracking timeline status checking
                      const getStatusProgress = (status) => {
                        const stages = [
                          { key: 'transit', label: 'ثبت اولیه و خروج از دبی', desc: 'تحویل کارگو در دبی و صدور بارنامه' },
                          { key: 'customs', label: 'رسیده به گمرک کشور', desc: 'تخلیه بار در گمرک مرزی ایران' },
                          { key: 'iran', label: 'انبار مرکزی تهران', desc: 'آماده‌سازی جهت ارسال درون‌شهری' },
                          { key: 'delivered', label: 'تحویل نهایی مشتری', desc: 'تحویل مرسوله و امضای فاکتور' }
                        ];

                        let activeIndex = 0;
                        if (status === 'customs') activeIndex = 1;
                        else if (status === 'iran') activeIndex = 2;
                        else if (status === 'delivered') activeIndex = 3;
                        else if (status === 'problem') activeIndex = -1; // problem state

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
                              onClick={() => setSelectedShipmentId('')}
                              className={styles.backToStatsBtn}
                            >
                              {AdminIcons.back(12)} برگشت به آمار
                            </button>
                          </div>

                          {/* Shipment AWB and tracking ID */}
                          <div className={styles.shipmentMainCodeRow}>
                            <span className={styles.shipmentMainCode}>{selectedShip.id}</span>
                            <div>
                              {selectedShip.status === 'transit' && <span className={styles.badgeActive} style={{ fontSize: '10px' }}>در حال ارسال</span>}
                              {selectedShip.status === 'customs' && <span className={styles.badgeCustoms}>رسیده به گمرک</span>}
                              {selectedShip.status === 'iran' && <span className={styles.badgeIran}>در انبار ایران</span>}
                              {selectedShip.status === 'delivered' && <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px' }}>تحویل شده</span>}
                              {selectedShip.status === 'problem' && <span className={styles.badgeProblem}>دارای مشکل</span>}
                            </div>
                          </div>

                          {/* Mapped order details */}
                          <div className={styles.productMiniSection}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedShip.productImg || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80'}
                              alt={selectedShip.productName}
                              className={styles.productMiniImg}
                            />
                            <div className={styles.productMiniInfo}>
                              <span className={styles.productMiniName}>{selectedShip.productName}</span>
                              <span
                                className={styles.productMiniOrderId}
                                onClick={() => {
                                  router.push(ADMIN_ROUTES.leads);
                                }}
                              >
                                شماره سفارش: {selectedShip.orderId}
                              </span>
                            </div>
                          </div>

                          {/* Cargo weight, shipping fees and values */}
                          <div className={styles.specsGrid}>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.scale(12)} وزن بار</span>
                              <span className={styles.specValue}>{selectedShip.cargoWeight} کیلوگرم</span>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.card(12)} هزینه ارسال کالا</span>
                              <span className={styles.specValue} style={{ color: '#ff9d00' }}>
                                {formatToman(selectedShip.shippingCost || 2500000)}
                              </span>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.dollar(12)} ارزش کالای بار</span>
                              <span className={styles.specValue}>
                                {formatToman(selectedShip.cargoValue || 15000000)}
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
                              <span className={styles.addressVal}>{selectedShip.carrier || 'دبی اکسپرس'}</span>
                            </div>
                            <div className={styles.addressRow} style={{ marginTop: '4px' }}>
                              <span className={styles.addressLabel}>کد بارنامه بین‌المللی:</span>
                              <span className={styles.addressVal} style={{ fontFamily: 'monospace', color: '#ff9d00', fontSize: '11.5px' }}>
                                {selectedShip.awbCode || 'AWB-100293049'}
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
                              <span className={styles.addressVal} dir="ltr">{selectedShip.phone}</span>
                            </div>
                            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                              <span className={styles.addressLabel} style={{ display: 'block', marginBottom: '4px' }}>آدرس ارسال:</span>
                              <span style={{ fontSize: '11px', color: '#c4c8d4', lineHeight: '1.5', display: 'block' }}>{selectedShip.address}</span>
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
                              value={newShipmentForm.recipient}
                              onChange={(e) => setNewShipmentForm(prev => ({ ...prev, recipient: e.target.value }))}
                              className={styles.inputField}
                            >
                              {getMergedCustomers().map(c => (
                                <option key={c.id} value={c.name}>{c.name} ({c.city})</option>
                              ))}
                              {getMergedCustomers().length === 0 && (
                                <>
                                  <option value="علی محمدی">علی محمدی</option>
                                  <option value="سمیرا احمدی">سمیرا احمدی</option>
                                  <option value="رضا حسینی">رضا حسینی</option>
                                </>
                              )}
                            </select>
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
                                <option value="transit">در حال ارسال</option>
                                <option value="customs">رسیده به گمرک</option>
                                <option value="iran">در ایران (انبار)</option>
                                <option value="delivered">تحویل شده</option>
                                <option value="problem">دارای مشکل</option>
                              </select>
                            </div>
                          </div>

                          <p style={{ fontSize: '11px', color: '#8b92a5', lineHeight: '1.5', margin: '10px 0 0 0' }}>
                            توجه: پس از ثبت نهایی، سیستم به صورت هوشمند یک شماره بارنامه اختصاصی (کد رهگیری TRK) ایجاد خواهد کرد و اطلاعات ترانزیت را به لوکال استوریج ادمین اضافه می‌نماید.
                          </p>

                        </div>

                        <div className={styles.modalFooter}>
                          <button type="button" className={styles.advFilterBtn} onClick={() => setIsAddShipmentOpen(false)}>انصراف</button>
                          <button
                            type="submit"
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
