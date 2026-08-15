'use client';

import React, { useCallback, useDeferredValue, useEffect, useState } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';

const EMPTY_STATS = { total: 0, active: 0, newThisMonth: 0, vip: 0, averagePurchase: 0, growth: {} };
const EMPTY_FORM = { name: '', phone: '', email: '', city: 'تهران', group: 'عادی', code: '', status: 'active', notes: '' };
const formatApiDate = value => value
  ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
  : '—';

function CustomersContent() {
  const { can } = useAdminAccess();
  const canEditCustomers = can(ADMIN_PERMISSIONS.CUSTOMERS_EDIT);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => (
    typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('customer') || ''
  ));
  const [customerDetails, setCustomerDetails] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(customerSearchQuery);
  const [customerGroupFilter, setCustomerGroupFilter] = useState('همه');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('همه');
  const [customerCityFilter, setCustomerCityFilter] = useState('همه');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [stats, setStats] = useState(EMPTY_STATS);
  const [uniqueCities, setUniqueCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [customerDetailsTab, setCustomerDetailsTab] = useState('general');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNoteText, setTempNoteText] = useState('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(EMPTY_FORM);
  const [editCustomerForm, setEditCustomerForm] = useState({ id: '', ...EMPTY_FORM });

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (deferredSearch.trim()) params.set('search', deferredSearch.trim());
    if (customerGroupFilter !== 'همه') params.set('group', customerGroupFilter);
    if (customerStatusFilter !== 'همه') params.set('status', customerStatusFilter);
    if (customerCityFilter !== 'همه') params.set('city', customerCityFilter);
    try {
      const response = await fetch(`/api/admin/customers?${params}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'دریافت مشتریان ناموفق بود.');
      setCustomers(payload.data || []);
      setPagination(payload.pagination);
      setStats(payload.stats || EMPTY_STATS);
      setUniqueCities(payload.filters?.cities || []);
      setSelectedCustomerId(current => current || payload.data?.[0]?.id || '');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [customerCityFilter, customerGroupFilter, customerStatusFilter, deferredSearch, limit, page]);

  useEffect(() => {
    // This effect synchronizes the paginated admin view with its protected API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCustomers();
  }, [loadCustomers, refreshKey]);
  useEffect(() => {
    if (!selectedCustomerId) return;
    let cancelled = false;
    fetch(`/api/admin/customers/${encodeURIComponent(selectedCustomerId)}`, { cache: 'no-store' })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'دریافت جزئیات مشتری ناموفق بود.');
        if (!cancelled) setCustomerDetails(payload);
      })
      .catch(error => { if (!cancelled) setErrorMessage(error.message); });
    return () => { cancelled = true; };
  }, [selectedCustomerId, refreshKey]);

  const requestMutation = async (url, options) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'عملیات ناموفق بود.');
      return payload;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomerSubmit = async (event) => {
    event.preventDefault();
    try {
      const created = await requestMutation('/api/admin/customers', { method: 'POST', body: JSON.stringify(newCustomerForm) });
      setSelectedCustomerId(created.id);
      setCustomerDetails(created);
      setIsAddCustomerOpen(false);
      setNewCustomerForm(EMPTY_FORM);
      setRefreshKey(value => value + 1);
    } catch (error) { setErrorMessage(error.message); }
  };

  const handleEditCustomerSubmit = async (event) => {
    event.preventDefault();
    const { id, ...data } = editCustomerForm;
    try {
      const updated = await requestMutation(`/api/admin/customers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
      setCustomerDetails(updated);
      setIsEditCustomerOpen(false);
      setRefreshKey(value => value + 1);
    } catch (error) { setErrorMessage(error.message); }
  };

  const handleDeleteCustomer = async (id) => {
    if (!confirm('آیا این مشتری غیرفعال شود؟ سوابق سفارش و اطلاعات او محفوظ می‌ماند.')) return;
    try {
      const updated = await requestMutation(`/api/admin/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setCustomerDetails(updated);
      setRefreshKey(value => value + 1);
    } catch (error) { setErrorMessage(error.message); }
  };

  const handleSaveNotes = async (id, notes) => {
    try {
      const updated = await requestMutation(`/api/admin/customers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ notes }) });
      setCustomerDetails(updated);
      setRefreshKey(value => value + 1);
    } catch (error) { setErrorMessage(error.message); }
  };

  const filteredCustomers = customers;
  const selectedCustomer = customerDetails?.id === selectedCustomerId
    ? customerDetails
    : customers.find(customer => customer.id === selectedCustomerId) || customers[0] || null;
  const totalCount = stats.total;
  const activeCount = stats.active;
  const newCount = stats.newThisMonth;
  const vipCount = stats.vip;
  const averagePurchase = stats.averagePurchase;
  const totalCustomerGrowth = stats.growth?.total || 0;
  const activeCustomerGrowth = stats.growth?.active || 0;
  const newCustomerGrowth = stats.growth?.new || 0;
  const vipCustomerGrowth = stats.growth?.vip || 0;
  const renderGrowth = (growth) => {
    if (growth === 0) {
      return <span className={styles.metricSubText} style={{ color: '#8b92a5', marginTop: '2px' }}>بدون تغییر</span>;
    }
    const isUp = growth > 0;
    return (
      <span className={`${styles.metricSubText} ${isUp ? styles.up : ''}`} style={{ color: isUp ? '#10b981' : '#ef4444', marginTop: '2px' }}>
        {isUp ? '+' : ''}{growth.toFixed(1)}% نسبت به ماه قبل
      </span>
    );
  };
  const openEditCustomer = (customer) => {
    if (!canEditCustomers) return;
    setSelectedCustomerId(customer.id);
    setEditCustomerForm({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      group: customer.group,
      status: customer.status,
      code: customer.code || '',
      notes: customer.notes
    });
    setIsEditCustomerOpen(true);
  };
  const triggerEditNotes = (customer) => {
    setTempNoteText(customer.notes);
    setIsEditingNotes(true);
  };
  const triggerSaveNotes = async (id) => {
    await handleSaveNotes(id, tempNoteText);
    setIsEditingNotes(false);
  };

  return (
    <div>
      <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
        <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#f87820', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.users(28)}</span>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>مشتریان</h1>
            <p style={{ fontSize: '11.5px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>مدیریت و بررسی اطلاعات مشتریان</p>
          </div>
        </div>

        <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {canEditCustomers && <button
            type="button"
            onClick={() => {
              setNewCustomerForm(EMPTY_FORM);
              setIsAddCustomerOpen(true);
            }}
            className={styles.saveFormBtn}
            style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.4)', borderRadius: '10px', padding: '10px 18px', fontWeight: '700', fontSize: '13px' }}
          >
            + افزودن مشتری جدید
          </button>}
          <button type="button" disabled title="فیلترهای اصلی در نوار پایین فعال هستند" className={styles.advFilterBtn} style={{ padding: '10px 15px' }}>
            <span>{AdminIcons.sliders(12)}</span> فیلترها
          </button>
          <button type="button" disabled title="خروجی اکسل در این فاز فعال نشده است" className={styles.advFilterBtn} style={{ padding: '10px 15px' }}>
            <span>{AdminIcons.download(12)}</span> خروجی اکسل
          </button>
        </div>
      </div>

      {errorMessage && <div role="alert" style={{ marginBottom: '14px', padding: '10px 14px', border: '1px solid rgba(239,68,68,.28)', color: '#fca5a5', background: 'rgba(239,68,68,.08)', borderRadius: '10px', fontSize: '12px' }}>{errorMessage}</div>}

      <div className={styles.metricsGrid5}>
        <div className={styles.metricCard}>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>کل مشتریان</span>
            <span className={styles.metricValue}>{totalCount.toLocaleString()}</span>
            {renderGrowth(totalCustomerGrowth)}
          </div>
          <div className={styles.metricIconContainer} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>{AdminIcons.users(18)}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>مشتریان فعال</span>
            <span className={styles.metricValue}>{activeCount.toLocaleString()}</span>
            {renderGrowth(activeCustomerGrowth)}
          </div>
          <div className={styles.metricIconContainer} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>{AdminIcons.user(18)}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>مشتریان جدید (ماه)</span>
            <span className={styles.metricValue}>{newCount.toLocaleString()}</span>
            {renderGrowth(newCustomerGrowth)}
          </div>
          <div className={styles.metricIconContainer} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>{AdminIcons.lock(18)}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>مشتریان VIP</span>
            <span className={styles.metricValue}>{vipCount.toLocaleString()}</span>
            {renderGrowth(vipCustomerGrowth)}
          </div>
          <div className={styles.metricIconContainer} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>{AdminIcons.crown(18)}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>میانگین خرید</span>
            <span className={styles.metricValue}>{averagePurchase.toLocaleString()}</span>
            <span style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>تومان</span>
          </div>
          <div className={styles.metricIconContainer} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>{AdminIcons.card(18)}</div>
        </div>
      </div>

      <div className={styles.filterStrip}>
        <div className={styles.filterControlsLeft}>
          <div className={styles.searchBarWrapper}>
            <span className={styles.searchBarIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.search(13)}</span>
            <input
              type="text"
              placeholder="جستجو در مشتریان..."
              value={customerSearchQuery}
              onChange={(event) => { setCustomerSearchQuery(event.target.value); setPage(1); }}
              className={styles.searchBarInput}
            />
          </div>
          <select value={customerGroupFilter} onChange={(event) => { setCustomerGroupFilter(event.target.value); setPage(1); }} className={styles.filterSelect}>
            <option value="همه">همه گروه‌ها</option>
            <option value="VIP">گروه VIP</option>
            <option value="همکار">گروه همکار</option>
            <option value="عادی">گروه عادی</option>
          </select>
          <select value={customerStatusFilter} onChange={(event) => { setCustomerStatusFilter(event.target.value); setPage(1); }} className={styles.filterSelect}>
            <option value="همه">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="vip">VIP</option>
            <option value="inactive">غیرفعال</option>
          </select>
          <select value={customerCityFilter} onChange={(event) => { setCustomerCityFilter(event.target.value); setPage(1); }} className={styles.filterSelect}>
            <option value="همه">همه شهرها</option>
            {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        <button type="button" disabled title="فیلترهای موجود فعال هستند" className={styles.advFilterBtn}>
          <span>{AdminIcons.sliders(12)}</span> فیلتر پیشرفته
        </button>
      </div>

      <div className={styles.customerSplitGrid}>
        <div style={{ background: '#11131a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>مشتری</th>
                  <th>اطلاعات تماس</th>
                  <th>جمع خریدها</th>
                  <th>وضعیت</th>
                  <th>تاریخ ثبت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>در حال دریافت مشتریان...</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr key="empty-customers">
                    <td colSpan="6" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>مشتری منطبق با فیلترهای جستجو یافت نشد.</td>
                  </tr>
                ) : filteredCustomers.map(customer => {
                  const isSelected = selectedCustomer?.id === customer.id;
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setIsEditingNotes(false);
                      }}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(248, 120, 32, 0.05)' : 'transparent',
                        borderLeft: isSelected ? '3px solid #f87820' : 'none'
                      }}
                    >
                      <td><span style={{ fontWeight: '800', color: '#fff', fontSize: '13px' }}>{customer.name}</span></td>
                      <td style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui', fontSize: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span>{customer.phone}</span>
                          <span style={{ color: '#8b92a5', fontSize: '10.5px', marginTop: '2px' }}>{customer.email}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-vazirmatn), system-ui', fontWeight: '850', color: '#fff' }}>
                        {customer.totalToman.toLocaleString('fa-IR')} تومان
                      </td>
                      <td>
                        {customer.status === 'active' && <span className={styles.badgeActive}>فعال</span>}
                        {customer.status === 'vip' && <span className={styles.badgeVip}>VIP</span>}
                        {customer.status === 'inactive' && <span className={styles.badgeInactive}>غیرفعال</span>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui', fontSize: '12.5px' }}>{customer.dateReg}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        {canEditCustomers ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            onClick={() => openEditCustomer(customer)}
                            style={{ background: 'none', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '16px', padding: '6px', display: 'inline-flex', alignItems: 'center' }}
                            title="ویرایش سریع"
                          >
                            {AdminIcons.edit(13)}
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '6px', marginRight: '6px' }}
                            title="غیرفعال‌سازی"
                          >
                            {AdminIcons.trash(13)}
                          </button>
                        </div>
                        ) : <span style={{ color: '#6b7280' }}>فقط مشاهده</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.customerPager} style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))} className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&lt;</button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
                const target = Math.min(Math.max(1, page - 2), Math.max(1, pagination.totalPages - 4)) + index;
                return <button type="button" key={target} onClick={() => setPage(target)} className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px', ...(target === page ? { backgroundColor: '#f87820', color: '#fff', borderColor: '#f87820' } : {}) }}>{target.toLocaleString('fa-IR')}</button>;
              })}
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(value => Math.min(pagination.totalPages, value + 1))} className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&gt;</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11.5px', color: '#8b92a5' }}>
                نمایش {pagination.total ? ((page - 1) * limit + 1).toLocaleString('fa-IR') : '۰'} تا {Math.min(page * limit, pagination.total).toLocaleString('fa-IR')} از {pagination.total.toLocaleString('fa-IR')} نتیجه
              </span>
              <select value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(1); }} className={styles.filterSelect} style={{ padding: '4px 8px', minWidth: '55px', height: '28px', fontSize: '11px' }}>
                <option value="8">8</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          {selectedCustomer ? (
            <div className={styles.stickyDetailsPanel}>
              <div className={styles.detailsHeader}>
                <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className={styles.largeAvatar} />
                <h2 className={styles.detailsName}>{selectedCustomer.name}</h2>
                <div style={{ marginTop: '4px' }}>
                  {selectedCustomer.status === 'active' && <span className={styles.badgeActive}>فعال</span>}
                  {selectedCustomer.status === 'vip' && <span className={styles.badgeVip}>VIP</span>}
                  {selectedCustomer.status === 'inactive' && <span className={styles.badgeInactive}>غیرفعال</span>}
                </div>
              </div>

              <div className={styles.quickActionsRow}>
                {canEditCustomers && <div className={styles.actionButtonWrapper}>
                  <button disabled={isSaving || selectedCustomer.status === 'inactive'} onClick={() => handleDeleteCustomer(selectedCustomer.id)} className={`${styles.actionCircleBtn} ${styles.delete}`} title="غیرفعال‌سازی مشتری">
                    {AdminIcons.trash(13)}
                  </button>
                  <span className={styles.actionLabel}>غیرفعال</span>
                </div>}
                {canEditCustomers && <div className={styles.actionButtonWrapper}>
                  <button onClick={() => openEditCustomer(selectedCustomer)} className={styles.actionCircleBtn} title="ویرایش مشخصات">
                    {AdminIcons.edit(14)}
                  </button>
                  <span className={styles.actionLabel}>ویرایش</span>
                </div>}
                <div className={styles.actionButtonWrapper}>
                  <a href={`mailto:${selectedCustomer.email}`} className={styles.actionCircleBtn} title="ارسال ایمیل" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {AdminIcons.mail(14)}
                  </a>
                  <span className={styles.actionLabel}>ایمیل</span>
                </div>
                <div className={styles.actionButtonWrapper}>
                  <button
                    disabled
                    className={styles.actionCircleBtn}
                    title="سرویس پیامک هنوز پیکربندی نشده است"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {AdminIcons.chat(14)}
                  </button>
                  <span className={styles.actionLabel}>پیامک</span>
                </div>
                <div className={styles.actionButtonWrapper}>
                  <a href={`tel:${selectedCustomer.phone}`} className={styles.actionCircleBtn} title="تماس تلفنی" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {AdminIcons.phone(14)}
                  </a>
                  <span className={styles.actionLabel}>تماس</span>
                </div>
              </div>

              <div className={styles.detailsTabContainer}>
                <button onClick={() => setCustomerDetailsTab('general')} className={`${styles.detailsTabBtn} ${customerDetailsTab === 'general' ? styles.detailsTabBtnActive : ''}`}>اطلاعات کلی</button>
                <button onClick={() => setCustomerDetailsTab('payments')} className={`${styles.detailsTabBtn} ${customerDetailsTab === 'payments' ? styles.detailsTabBtnActive : ''}`}>تاریخچه پرداخت</button>
                <button onClick={() => setCustomerDetailsTab('history')} className={`${styles.detailsTabBtn} ${customerDetailsTab === 'history' ? styles.detailsTabBtnActive : ''}`}>تاریخچه</button>
                <button onClick={() => setCustomerDetailsTab('notes')} className={`${styles.detailsTabBtn} ${customerDetailsTab === 'notes' ? styles.detailsTabBtnActive : ''}`}>یادداشت‌ها</button>
              </div>

              <div style={{ minHeight: '120px' }}>
                {customerDetailsTab === 'general' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className={styles.profileDetailField}><span className={styles.fieldLabel}>شماره موبایل</span><span className={styles.fieldValue} style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui' }}>{selectedCustomer.phone}</span></div>
                    <div className={styles.profileDetailField}><span className={styles.fieldLabel}>ایمیل</span><span className={styles.fieldValue} style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui' }}>{selectedCustomer.email}</span></div>
                    <div className={styles.profileDetailField}><span className={styles.fieldLabel}>شهر محل سکونت</span><span className={styles.fieldValue}>{selectedCustomer.city}</span></div>
                    <div className={styles.profileDetailField}><span className={styles.fieldLabel}>تاریخ ثبت نام</span><span className={styles.fieldValue} style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui' }}>{selectedCustomer.dateReg}</span></div>
                    <div className={styles.profileDetailField}><span className={styles.fieldLabel}>گروه مشتری</span><span className={styles.fieldValue}><span className={styles.badgeVip} style={{ fontSize: '10px', padding: '2px 8px' }}>{selectedCustomer.group}</span></span></div>
                    <div className={styles.profileDetailField}><span className={styles.fieldLabel}>کد مشتری</span><span className={styles.fieldValue} style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui' }}>{selectedCustomer.code || selectedCustomer.id}</span></div>
                    <div className={styles.profileDetailField}><span className={styles.fieldLabel}>تعداد سفارشات</span><span className={styles.fieldValue}>{selectedCustomer.orderCount} سفارش</span></div>
                    <div className={styles.profileDetailField}><span className={styles.fieldLabel}>جمع کل خریدها</span><span className={styles.fieldValue}>{selectedCustomer.totalToman.toLocaleString()} تومان</span></div>
                  </div>
                )}

                {customerDetailsTab === 'payments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selectedCustomer.recentOrders || []).flatMap(order => order.payments || []).length === 0 && <div style={{ color: '#8b92a5', fontSize: '11.5px', padding: '14px 0' }}>پرداخت ثبت‌شده‌ای برای این مشتری وجود ندارد.</div>}
                    {(selectedCustomer.recentOrders || []).flatMap(order => (order.payments || []).map(payment => ({ ...payment, orderCode: order.orderCode }))).map(payment => (
                      <div key={payment.id} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b92a5' }}><span>{payment.method || 'روش پرداخت ثبت نشده'}</span><span>{formatApiDate(payment.createdAt)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff', fontWeight: 'bold', marginTop: '4px' }}><span>{payment.reference || payment.orderCode}</span><span style={{ color: payment.status === 'paid' ? '#10b981' : '#f59e0b' }}>{Number(payment.amount || 0).toLocaleString('fa-IR')} تومان</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {customerDetailsTab === 'history' && (
                  <div style={{ fontSize: '11.5px', color: '#c4c8d4', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '8px', borderRight: '2px solid rgba(255,255,255,0.06)' }}>
                    {(selectedCustomer.recentOrders || []).map(order => <div key={order.id}><span style={{ color: '#f87820', fontWeight: 'bold' }}>• {formatApiDate(order.createdAt)}</span><p style={{ margin: '2px 0 0 0', color: '#8b92a5' }}>سفارش {order.orderCode} — {Number(order.totalToman || 0).toLocaleString('fa-IR')} تومان</p></div>)}
                    <div><span style={{ color: '#f87820', fontWeight: 'bold' }}>• {selectedCustomer.dateReg}</span><p style={{ margin: '2px 0 0 0', color: '#8b92a5' }}>ثبت‌نام اولیه در وب‌سایت دبی خرید</p></div>
                  </div>
                )}

                {customerDetailsTab === 'notes' && (
                  <div style={{ fontSize: '11.5px', color: '#c4c8d4', lineHeight: '1.6' }}>
                    <p style={{ margin: 0 }}>مجموعه یادداشت‌های ثبت‌شده برای پشتیبانی و تعامل با مشتری:</p>
                    <div style={{ padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '8px' }}>{selectedCustomer.notes}</div>
                  </div>
                )}
              </div>

              <div className={styles.notesWidget}>
                <div className={styles.notesWidgetHeader}>
                  <span className={styles.notesWidgetTitle}>{AdminIcons.edit(13)} یادداشت ادمین</span>
                  {!isEditingNotes ? (
                    canEditCustomers ?
                    <button onClick={() => triggerEditNotes(selectedCustomer)} className={styles.notesEditBtn}>{AdminIcons.edit(12)} ویرایش</button>
                    : <span style={{ color: '#6b7280', fontSize: '11px' }}>فقط مشاهده</span>
                  ) : (
                    <button disabled={isSaving} onClick={() => triggerSaveNotes(selectedCustomer.id)} className={styles.notesEditBtn} style={{ color: '#10b981', fontWeight: 'bold' }}>{AdminIcons.check(12)} ذخیره</button>
                  )}
                </div>
                {!isEditingNotes ? (
                  <div onClick={() => canEditCustomers && triggerEditNotes(selectedCustomer)} className={styles.notesContentBlock} style={{ cursor: canEditCustomers ? 'pointer' : 'default' }}>
                    {selectedCustomer.notes || 'بدون یادداشت (جهت درج یادداشت کلیک کنید)'}
                  </div>
                ) : (
                  <textarea
                    value={tempNoteText}
                    onChange={(event) => setTempNoteText(event.target.value)}
                    className={styles.notesTextarea}
                    autoFocus
                  />
                )}
              </div>

              <div className={styles.performanceSummary}>
                <h3 className={styles.performanceTitle}>{AdminIcons.chart(16)} خلاصه عملکرد مشتری</h3>
                <div className={styles.performanceGrid}>
                  <div className={styles.perfItem}><span className={styles.perfLabel}>میانگین هر سفارش</span><span className={styles.perfValue}>{selectedCustomer.performance.avgOrder.toLocaleString()} تومان</span></div>
                  <div className={styles.perfItem}><span className={styles.perfLabel}>آخرین سفارش</span><span className={styles.perfValue}>{selectedCustomer.performance.lastOrder}</span></div>
                  <div className={styles.perfItem}><span className={styles.perfLabel}>اولین سفارش</span><span className={styles.perfValue}>{selectedCustomer.performance.firstOrder}</span></div>
                  <div className={styles.perfItem}><span className={styles.perfLabel}>بیشترین خرید</span><span className={styles.perfValue}>{selectedCustomer.performance.maxOrder.toLocaleString()} تومان</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', background: '#11131a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#8b92a5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{AdminIcons.users(32)}</span>
              <p style={{ color: '#8b92a5', fontSize: '12px', marginTop: '10px' }}>جهت مشاهده جزئیات کامل، روی ردیف یکی از مشتریان کلیک کنید.</p>
            </div>
          )}
        </div>
      </div>

      {isAddCustomerOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddCustomerOpen(false)}>
          <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{AdminIcons.plus(16)} افزودن مشخصات مشتری جدید</h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsAddCustomerOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddCustomerSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                  <label>نام و نام خانوادگی مشتری:</label>
                  <input type="text" required value={newCustomerForm.name} onChange={(event) => setNewCustomerForm(previous => ({ ...previous, name: event.target.value }))} placeholder="مثال: علی محمدی..." className={styles.inputField} />
                </div>
                <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                  <div className={styles.formGroup}>
                    <label>شماره تماس همراه:</label>
                    <input type="text" required value={newCustomerForm.phone} onChange={(event) => setNewCustomerForm(previous => ({ ...previous, phone: event.target.value }))} placeholder="مثال: 09123456789..." className={styles.inputField} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>آدرس ایمیل:</label>
                    <input type="email" value={newCustomerForm.email} onChange={(event) => setNewCustomerForm(previous => ({ ...previous, email: event.target.value }))} placeholder="ali.mohammadi@gmail.com..." className={styles.inputField} />
                  </div>
                </div>
                <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                  <div className={styles.formGroup}>
                    <label>شهر محل سکونت:</label>
                    <input type="text" required value={newCustomerForm.city} onChange={(event) => setNewCustomerForm(previous => ({ ...previous, city: event.target.value }))} placeholder="مثال: تهران، مشهد..." className={styles.inputField} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>گروه مشتری:</label>
                    <select value={newCustomerForm.group} onChange={(event) => setNewCustomerForm(previous => ({ ...previous, group: event.target.value }))} className={styles.inputField}>
                      <option value="عادی">عادی</option>
                      <option value="VIP">VIP ممتاز</option>
                      <option value="همکار">همکار صنف</option>
                    </select>
                  </div>
                </div>
                <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                  <div className={styles.formGroup}>
                    <label>وضعیت حساب:</label>
                    <select value={newCustomerForm.status} onChange={(event) => setNewCustomerForm(previous => ({ ...previous, status: event.target.value }))} className={styles.inputField}>
                      <option value="active">فعال</option>
                      <option value="vip">VIP ممتاز</option>
                      <option value="inactive">غیرفعال</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>یادداشت‌های اختصاصی ادمین:</label>
                  <textarea value={newCustomerForm.notes} onChange={(event) => setNewCustomerForm(previous => ({ ...previous, notes: event.target.value }))} placeholder="توضیحات و رفتار خرید مشتری را اینجا یادداشت کنید..." className={styles.notesTextarea} />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.advFilterBtn} onClick={() => setIsAddCustomerOpen(false)}>انصراف</button>
                <button disabled={isSaving} type="submit" className={styles.saveFormBtn} style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 'bold' }}>{isSaving ? 'در حال ثبت...' : 'ثبت مشتری جدید'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditCustomerOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditCustomerOpen(false)}>
          <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{AdminIcons.edit(16)} ویرایش اطلاعات مشتری</h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsEditCustomerOpen(false)}>×</button>
            </div>
            <form onSubmit={handleEditCustomerSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                  <label>نام و نام خانوادگی مشتری:</label>
                  <input type="text" required value={editCustomerForm.name} onChange={(event) => setEditCustomerForm(previous => ({ ...previous, name: event.target.value }))} className={styles.inputField} />
                </div>
                <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                  <div className={styles.formGroup}>
                    <label>شماره تماس همراه:</label>
                    <input type="text" required value={editCustomerForm.phone} onChange={(event) => setEditCustomerForm(previous => ({ ...previous, phone: event.target.value }))} className={styles.inputField} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>آدرس ایمیل:</label>
                    <input type="email" value={editCustomerForm.email} onChange={(event) => setEditCustomerForm(previous => ({ ...previous, email: event.target.value }))} className={styles.inputField} />
                  </div>
                </div>
                <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                  <div className={styles.formGroup}>
                    <label>شهر محل سکونت:</label>
                    <input type="text" required value={editCustomerForm.city} onChange={(event) => setEditCustomerForm(previous => ({ ...previous, city: event.target.value }))} className={styles.inputField} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>گروه مشتری:</label>
                    <select value={editCustomerForm.group} onChange={(event) => setEditCustomerForm(previous => ({ ...previous, group: event.target.value }))} className={styles.inputField}>
                      <option value="عادی">عادی</option>
                      <option value="VIP">VIP ممتاز</option>
                      <option value="همکار">همکار صنف</option>
                    </select>
                  </div>
                </div>
                <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                  <div className={styles.formGroup}>
                    <label>وضعیت حساب:</label>
                    <select value={editCustomerForm.status} onChange={(event) => setEditCustomerForm(previous => ({ ...previous, status: event.target.value }))} className={styles.inputField}>
                      <option value="active">فعال</option>
                      <option value="vip">VIP ممتاز</option>
                      <option value="inactive">غیرفعال</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>یادداشت‌های اختصاصی ادمین:</label>
                  <textarea value={editCustomerForm.notes} onChange={(event) => setEditCustomerForm(previous => ({ ...previous, notes: event.target.value }))} className={styles.notesTextarea} />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.advFilterBtn} onClick={() => setIsEditCustomerOpen(false)}>انصراف</button>
                <button disabled={isSaving} type="submit" className={styles.saveFormBtn} style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 'bold' }}>{isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <AdminShell activeTab="customers">
      <CustomersContent />
    </AdminShell>
  );
}
