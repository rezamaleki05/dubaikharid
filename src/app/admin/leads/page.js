'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell, { useAdminShellData } from '@/components/admin/AdminShell';
import { calculateProductPricing } from '@/lib/pricing';

const REQUEST_STATUSES = ['pending', 'price_tagged', 'approved', 'new_order'];
const EMPTY_SETTINGS = {};

const getStatusStyle = (status) => {
  const stylesMap = {
    pending: { label: 'در انتظار بررسی', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
    price_tagged: { label: 'قیمت‌گذاری شده', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
    approved: { label: 'تایید شده', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    processing: { label: 'در حال پردازش', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    purchased: { label: 'در نون دبی', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    noon_dubai: { label: 'در نون دبی', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    warehouse_dubai: { label: 'در انبار دبی', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
    shipped: { label: 'ارسال شده', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    delivered: { label: 'تحویل شده', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    cancelled: { label: 'لغو شده', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
  };
  return stylesMap[status] || stylesMap.pending;
};

const fmtToman = (value) => {
  const numericValue = Number.parseFloat(value);
  return Math.round(Number.isFinite(numericValue) ? numericValue : 0).toLocaleString('fa-IR');
};

const getSafeDateLabel = (value, includeTime = false) => {
  const parsedDate = new Date(value || '');
  if (Number.isNaN(parsedDate.getTime())) return '';
  return includeTime ? parsedDate.toLocaleString('fa-IR') : parsedDate.toLocaleDateString('fa-IR');
};

function LeadsContent() {
  const { settings: siteCtxSettings } = useSiteSettings();
  const { leads: sharedLeads, setLeads } = useAdminShellData();
  const leads = useMemo(
    () => (Array.isArray(sharedLeads) ? sharedLeads : []),
    [sharedLeads]
  );
  const safeSettings = siteCtxSettings && typeof siteCtxSettings === 'object' ? siteCtxSettings : EMPTY_SETTINGS;

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activePaymentFilter, setActivePaymentFilter] = useState('all');
  const [isCustomerInfoExpanded, setIsCustomerInfoExpanded] = useState(true);
  const [leadSearch, setLeadSearch] = useState('');
  const [calcPriceAed, setCalcPriceAed] = useState(0);
  const [calcWeight, setCalcWeight] = useState(0);
  const [calcShippingAed, setCalcShippingAed] = useState(0);
  const [calcCommissionAed, setCalcCommissionAed] = useState(0);
  const [calcAedRate, setCalcAedRate] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedStatus = params.get('status');
    const requestedLead = params.get('lead');
    if (requestedStatus) setActiveStatusFilter(requestedStatus);
    if (requestedLead) setSelectedOrderId(requestedLead);
  }, []);

  useEffect(() => {
    const selectedLead = leads.find(lead => lead?.id === selectedOrderId);
    if (!selectedLead) return;

    const priceValue = Number.parseFloat(selectedLead.priceAed) || 0;
    const weightValue = Number.parseFloat(selectedLead.weight) || 0.5;
    let pricing;
    try { pricing = calculateProductPricing({ priceAed: priceValue, weight: weightValue }, safeSettings); } catch { return; }

    setCalcPriceAed(priceValue);
    setCalcWeight(weightValue);
    setCalcAedRate(pricing.exchangeRate);
    setCalcCommissionAed(Math.round(pricing.commissionAed));
    setCalcShippingAed(Math.round(pricing.shippingAed));
  }, [leads, safeSettings, selectedOrderId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persistLeads = (nextLeads) => {
    const safeLeads = Array.isArray(nextLeads) ? nextLeads : [];
    setLeads(safeLeads);
  };

  const patchLead = async (leadId, body) => {
    const response = await fetch(`/api/admin/purchase-requests/${encodeURIComponent(leadId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'به‌روزرسانی درخواست با خطا مواجه شد.');
    persistLeads(leads.map(lead => lead.id === leadId ? payload : lead));
    return payload;
  };

  const calcTotalAed = calcPriceAed + calcShippingAed + calcCommissionAed;
  const calcTotalToman = Math.round(calcTotalAed * calcAedRate);

  const handleSaveFinalPrice = async () => {
    try {
      await patchLead(selectedOrderId, { status: 'price_tagged', priceAed: calcPriceAed, weight: calcWeight, finalToman: calcTotalToman });
      alert(`قیمت نهایی ${calcTotalToman.toLocaleString('fa-IR')} تومان ثبت و وضعیت درخواست به «قیمت اعلام شده» تغییر یافت.`);
    } catch (error) { alert(error.message); }
  };

  const getWhatsAppPaymentLink = (lead) => {
    const safeLead = lead && typeof lead === 'object' ? lead : {};
    const productName = String(safeLead.productName ?? '');
    const customerName = String(safeLead.customerName ?? '');
    const phone = String(safeLead.phone ?? '');
    const link = `${window.location.origin}/payment?amount=${Number(safeLead.totalToman ?? 0)}&tracking=${encodeURIComponent(String(safeLead.id ?? ''))}&prodName=${encodeURIComponent(productName)}&customer=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(phone)}`;
    const text = `سلام جناب ${customerName} عزیز،\nقیمت نهایی محصول مورد نظر شما (${productName}) بررسی و اعلام گردید:\n\nقیمت محصول: ${Number(safeLead.priceAed ?? 0)} درهم\nوزن واقعی: ${Number(safeLead.weight ?? 0)} کیلوگرم\nقیمت نهایی به تومان: ${Number(safeLead.totalToman ?? 0).toLocaleString('fa-IR')} تومان\n\nجهت تکمیل پرداخت آنلاین از طریق درگاه شتاب بانکی می‌توانید روی لینک زیر کلیک کنید:\n${link}\n\nبا تشکر، دبی خرید`;
    return `https://wa.me/${phone.replace(/^[0]/, '+98')}?text=${encodeURIComponent(text)}`;
  };

  const handleSendPaymentLink = (lead) => {
    const safeLead = lead && typeof lead === 'object' ? lead : {};
    const link = `${window.location.origin}/payment?amount=${Number(safeLead.totalToman ?? 0)}&tracking=${encodeURIComponent(String(safeLead.id ?? ''))}&prodName=${encodeURIComponent(String(safeLead.productName ?? ''))}&customer=${encodeURIComponent(String(safeLead.customerName ?? ''))}&phone=${encodeURIComponent(String(safeLead.phone ?? ''))}`;
    navigator.clipboard.writeText(link);
    alert('لینک پرداخت با موفقیت به کلیپ‌بورد کپی شد!');
    window.open(getWhatsAppPaymentLink(safeLead), '_blank');
  };

  const handleConvertToOrder = async (leadId) => {
    const lead = leads.find(item => item?.id === leadId);
    if (!lead || ['purchased', 'noon_dubai', 'warehouse_dubai', 'shipped', 'delivered'].includes(lead.status)) {
      return;
    }
    try {
      await patchLead(leadId, { action: 'convert' });
      alert('درخواست با موفقیت به سفارش خرید قطعی تبدیل شد.');
    } catch (error) { alert(error.message); }
  };

  const handleManualPayment = async (leadId) => {
    try {
      await patchLead(leadId, { action: 'convert', markPaid: true });
      alert('پرداخت دستی ثبت شد و درخواست به سفارش قطعی تبدیل گردید.');
    } catch (error) { alert(error.message); }
  };

  const handleCancelRequest = async (leadId) => {
    try {
      await patchLead(leadId, { action: 'cancel' });
      alert('درخواست با موفقیت لغو شد.');
    } catch (error) { alert(error.message); }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try { await patchLead(leadId, { status: newStatus }); } catch (error) { alert(error.message); }
  };

  const handleDeleteLead = (leadId) => {
    if (!confirm('آیا از حذف این سفارش مطمئن هستید؟')) return;
    handleCancelRequest(leadId);
  };

  const handleUpdateNotes = async (selectedLead) => {
    const note = prompt('یادداشت داخلی جدید خود را وارد کنید:', String(selectedLead?.notes ?? ''));
    if (note === null) return;
    try { await patchLead(selectedLead.id, { note }); } catch (error) { alert(error.message); }
  };

  const getWhatsAppLink = (lead) => {
    const safeLead = lead && typeof lead === 'object' ? lead : {};
    let cleanPhone = String(safeLead.phone ?? '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) cleanPhone = `98${cleanPhone.slice(1)}`;
    const message = `سلام ${String(safeLead.customerName ?? '')} عزیز،\nپیش‌فاکتور خرید شما در سایت «دبی خرید» ثبت گردید.\n\n📦 سفارش شما: ${String(safeLead.productName ?? '')}\n💰 مبلغ کل: ${fmtToman(safeLead.totalToman)} تومان\n📍 آدرس تحویل: ${String(safeLead.address ?? '')}\n\nجهت هماهنگی نهایی خرید، تأیید رنگ/سایز و صدور فاکتور در خدمت شما هستیم.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  const filteredLeads = leads.filter(lead => {
    if (!lead || typeof lead !== 'object') return false;
    const query = leadSearch.toLowerCase();
    const matchesSearch = (
      String(lead.customerName ?? '').toLowerCase().includes(query) ||
      String(lead.phone ?? '').toLowerCase().includes(query) ||
      String(lead.id ?? '').toLowerCase().includes(query) ||
      String(lead.productName ?? '').toLowerCase().includes(query)
    );
    if (!matchesSearch || !REQUEST_STATUSES.includes(lead.status)) return false;

    const matchesStatus = activeStatusFilter === 'all' ||
      (activeStatusFilter === 'noon_dubai'
        ? lead.status === 'noon_dubai' || lead.status === 'purchased'
        : lead.status === activeStatusFilter);
    const matchesPayment = activePaymentFilter === 'all' || lead.paymentMethod === activePaymentFilter;
    return matchesStatus && matchesPayment;
  });

  const selectedLead = filteredLeads.find(lead => lead?.id === selectedOrderId) || filteredLeads[0];
  const statCards = [
    { key: 'approved', label: 'تایید شده', count: leads.filter(lead => lead?.status === 'approved').length, icon: AdminIcons.check(18), color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { key: 'price_tagged', label: 'قیمت‌گذاری شده', count: leads.filter(lead => lead?.status === 'price_tagged').length, icon: AdminIcons.tag(18), color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    { key: 'pending', label: 'در انتظار بررسی', count: leads.filter(lead => lead?.status === 'pending').length, icon: AdminIcons.clock(18), color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
    { key: 'new_order', label: 'سفارش جدید', count: leads.filter(lead => lead?.status === 'new_order').length, icon: AdminIcons.download(18), color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { key: 'all', label: 'همه درخواست‌ها', count: leads.filter(lead => REQUEST_STATUSES.includes(lead?.status)).length, icon: AdminIcons.clipboard(18), color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' }
  ];

  const compactInputStyle = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#fff',
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: 'bold',
    outline: 'none',
    textAlign: 'left',
    direction: 'ltr',
    fontFamily: 'monospace'
  };

  const filterSelectStyle = {
    background: '#1a1d26',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e5e7eb',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none'
  };

  return (
    <div>
      <div className={styles.sectionHeader} style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>
            {AdminIcons.download(22)} درخواست‌های خرید از دبی
          </h1>
          <p className={styles.sectionDesc} style={{ fontSize: '12px', color: '#8b92a5' }}>
            بررسی پیش‌فاکتورها، اعلام قیمت و مدیریت درخواست‌های اولیه خرید
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => alert('خروجی اکسل با موفقیت بارگیری شد (شبیه‌سازی)')}
            className={styles.advFilterBtn}
          >
            {AdminIcons.download(12)} خروجی اکسل
          </button>
          <button className={styles.advFilterBtn}>
            {AdminIcons.search(12)} فیلترها
          </button>
          <button
            type="button"
            aria-label="ایجاد سفارش جدید"
            onClick={() => window.location.assign('/admin/orders')}
            className={styles.leadsNewOrderBtn}
          >
            <span className={styles.leadsNewOrderIcon} aria-hidden="true">
              {AdminIcons.plus(15)}
            </span>
            <span className={styles.leadsNewOrderLabel}>
              <strong>سفارش جدید</strong>
              <small>ثبت درخواست خرید</small>
            </span>
          </button>
        </div>
      </div>

      <div className={styles.statOrdersRow}>
        {statCards.map(card => {
          const isActive = activeStatusFilter === card.key;
          return (
            <div
              key={card.key}
              className={`${styles.statOrdersCard} ${isActive ? styles.statOrdersCardActive : ''}`}
              onClick={() => setActiveStatusFilter(card.key)}
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
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '14px',
              padding: '12px 16px'
            }}
          >
            <div style={{ position: 'relative', flexGrow: 1, maxWidth: '350px' }}>
              <span style={{ position: 'absolute', right: '12px', top: '10px', color: '#8b92a5' }}>
                {AdminIcons.search(12)}
              </span>
              <input
                type="text"
                placeholder="جستجو کنید..."
                value={leadSearch ?? ''}
                onChange={event => setLeadSearch(event.target.value)}
                style={{
                  width: '100%',
                  background: '#11131a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '8px 34px 8px 12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select value={activeStatusFilter ?? 'all'} onChange={event => setActiveStatusFilter(event.target.value)} style={filterSelectStyle}>
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار بررسی</option>
                <option value="price_tagged">قیمت‌گذاری شده</option>
                <option value="approved">تایید شده</option>
                <option value="warehouse_dubai">در انبار دبی</option>
                <option value="noon_dubai">در نون دبی</option>
                <option value="shipped">ارسال شده</option>
                <option value="delivered">تحویل شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
              <select value={activePaymentFilter ?? 'all'} onChange={event => setActivePaymentFilter(event.target.value)} style={filterSelectStyle}>
                <option value="all">همه روش‌های پرداخت</option>
                <option value="gateway">درگاه بانکی</option>
                <option value="card">کارت به کارت</option>
              </select>
              <select defaultValue="all" style={filterSelectStyle}>
                <option value="all">همه تاریخ‌ها</option>
                <option value="today">امروز</option>
                <option value="yesterday">دیروز</option>
                <option value="this-month">این ماه</option>
              </select>
              <button className={styles.advFilterBtn}>{AdminIcons.sliders(12)} فیلتر پیشرفته</button>
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
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>
                      هیچ موردی با فیلترهای کنونی یافت نشد.
                    </td>
                  </tr>
                ) : filteredLeads.map(lead => {
                  const isSelected = selectedLead?.id === lead.id;
                  const statusSpec = getStatusStyle(lead.status);
                  return (
                    <tr
                      key={String(lead.id)}
                      onClick={() => setSelectedOrderId(String(lead.id ?? ''))}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(248, 120, 32, 0.06)' : 'transparent',
                        borderRight: isSelected ? '3px solid #f87820' : '3px solid transparent'
                      }}
                    >
                      <td style={{ fontWeight: '800', fontFamily: 'monospace', color: '#ff9d00', fontSize: '12px' }}>{String(lead.id ?? '')}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '750', color: '#fff', fontSize: '12.5px' }}>{String(lead.customerName ?? '')}</span>
                          <span style={{ fontSize: '10.5px', color: '#8b92a5', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{String(lead.phone ?? '')}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '10.5px', fontWeight: '750', color: statusSpec.color, backgroundColor: statusSpec.bg, display: 'inline-block' }}>
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
                      <td style={{ textAlign: 'left', paddingLeft: '20px' }} onClick={event => event.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <a
                            href={getWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderRadius: '6px', padding: '5px 8px', textDecoration: 'none', display: 'inline-flex' }}
                          >
                            {AdminIcons.whatsapp(12)}
                          </a>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', display: 'inline-flex' }}
                            title="حذف سفارش"
                          >
                            {AdminIcons.trash(12)}
                          </button>
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
              <button className={`${styles.pagerBtn} ${styles.pagerBtnActive}`}>1</button>
              <button className={styles.pagerBtn}>2</button>
              <button className={styles.pagerBtn}>3</button>
              <button className={styles.pagerBtn}>4</button>
              <button className={styles.pagerBtn}>...</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#8b92a5' }}>
              <span>نمایش 1 تا {filteredLeads.length} از {248 + leads.length} نتیجه</span>
              <select defaultValue="8" style={{ ...filterSelectStyle, padding: '4px 8px' }}>
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
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '9.5px',
                    fontWeight: '750',
                    color: getStatusStyle(selectedLead.status).color,
                    backgroundColor: getStatusStyle(selectedLead.status).bg
                  }}
                >
                  {getStatusStyle(selectedLead.status).label}
                </span>
              </div>
              <div className={styles.detailsOrderCodeRow}>
                <span className={styles.detailsOrderCode}>{String(selectedLead.id ?? '')}</span>
                <span
                  onClick={() => {
                    navigator.clipboard.writeText(String(selectedLead.id ?? ''));
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
                      {String(selectedLead.customerName || 'م').trim().charAt(0)}
                    </div>
                    <div className={styles.customerMeta}>
                      <span className={styles.customerName}>{String(selectedLead.customerName ?? '')}</span>
                      <span className={styles.customerPhone} style={{ direction: 'ltr' }}>{String(selectedLead.phone ?? '')}</span>
                    </div>
                  </div>
                  <div className={styles.customerDetailsList}>
                    <div className={styles.customerDetailItem}>
                      <span className={styles.customerDetailLabel}>آدرس تحویل:</span>
                      <span className={styles.customerDetailValue} style={{ maxWidth: '170px', textAlign: 'left', wordBreak: 'break-word', whiteSpace: 'normal', color: '#f3f4f6' }}>
                        {String(selectedLead.address ?? '')}
                      </span>
                    </div>
                    <div className={styles.customerDetailItem}>
                      <span className={styles.customerDetailLabel}>ایمیل:</span>
                      <span className={styles.customerDetailValue} style={{ fontFamily: 'monospace', color: '#d1d5db' }}>
                        {String(selectedLead.email || 'ثبت نشده')}
                      </span>
                    </div>
                    <div className={styles.customerDetailItem}>
                      <span className={styles.customerDetailLabel}>وضعیت خریدار:</span>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', background: selectedLead.isRequest ? 'rgba(248,120,32,0.1)' : 'rgba(16, 185, 129, 0.1)', color: selectedLead.isRequest ? '#f87820' : '#10b981' }}>
                        {selectedLead.isRequest ? 'سفارش آنلاین سایت' : 'تایید شده'}
                      </span>
                    </div>
                    {selectedLead.notes && (
                      <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                        <span style={{ display: 'block', fontSize: '9.5px', color: '#f87820', fontWeight: 'bold', marginBottom: '2px' }}>{AdminIcons.edit(13)} توضیحات مشتری:</span>
                        <p style={{ margin: 0, fontSize: '10.5px', color: '#d1d5db', lineHeight: '1.4' }}>{String(selectedLead.notes)}</p>
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
                    <div key={`${String(item?.name ?? 'item')}-${index}`} className={styles.detailsProductItem}>
                      {selectedLead.img && <img src={String(selectedLead.img)} alt={String(item?.name ?? '')} className={styles.detailsProductImg} />}
                      <div className={styles.detailsProductInfo}>
                        <h4 className={styles.detailsProductTitle}>{String(item?.name ?? '')}</h4>
                        <span className={styles.detailsProductDesc}>
                          {String(selectedLead.store || 'فروشگاه ثبت نشده')}{(item?.color || item?.size) ? ` | ${item?.color ? `رنگ: ${item.color}` : ''}${item?.color && item?.size ? ' - ' : ''}${item?.size ? `سایز: ${item.size}` : ''}` : ''}
                        </span>
                      </div>
                      <span className={styles.detailsProductQty}>{Number(item?.quantity ?? 0)} عدد</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.detailsProductItem}>
                    {selectedLead.img && <img src={String(selectedLead.img)} alt={String(selectedLead.productName ?? '')} className={styles.detailsProductImg} />}
                    <div className={styles.detailsProductInfo}>
                      <h4 className={styles.detailsProductTitle}>{String(selectedLead.productName ?? '')}</h4>
                      <span className={styles.detailsProductDesc}>{String(selectedLead.store || 'فروشگاه ثبت نشده')}{selectedLead.brand ? ` | برند ${String(selectedLead.brand)}` : ''}</span>
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
                {selectedLead.isRequest === true && ['pending', 'price_tagged'].includes(selectedLead.status) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>قیمت خرید (درهم):</label>
                        <input
                          type="number"
                          value={calcPriceAed ?? 0}
                          onChange={event => {
                            const value = Number.parseFloat(event.target.value) || 0;
                            setCalcPriceAed(value);
                            setCalcCommissionAed(Math.round(value * ((Number.parseFloat(safeSettings.commissionPercent) || 0) / 100)));
                          }}
                          style={compactInputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>وزن واقعی (کیلو):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={calcWeight ?? 0}
                          onChange={event => {
                            const value = Number.parseFloat(event.target.value) || 0;
                            setCalcWeight(value);
                            const minimumWeight = Number.parseFloat(safeSettings.minWeightClass) || 0;
                            let roundedWeight = value;
                            if ((safeSettings.roundingMethod || 'ceil') === 'ceil') roundedWeight = Math.ceil(value);
                            else if (safeSettings.roundingMethod === 'floor') roundedWeight = Math.floor(value);
                            else if (safeSettings.roundingMethod === 'round') roundedWeight = Math.round(value);
                            if (roundedWeight < minimumWeight) roundedWeight = minimumWeight;
                            setCalcShippingAed(Math.round(roundedWeight * (Number.parseFloat(safeSettings.shippingPerKgAed) || 0)));
                          }}
                          style={compactInputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>هزینه ارسال (درهم):</label>
                        <input type="number" value={calcShippingAed ?? 0} onChange={event => setCalcShippingAed(Number.parseFloat(event.target.value) || 0)} style={compactInputStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>کارمزد دبی‌خرید (درهم):</label>
                        <input type="number" value={calcCommissionAed ?? 0} onChange={event => setCalcCommissionAed(Number.parseFloat(event.target.value) || 0)} style={compactInputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>نرخ درهم (تومان):</label>
                        <input type="number" value={calcAedRate ?? 0} onChange={event => setCalcAedRate(Number.parseFloat(event.target.value) || 0)} style={compactInputStyle} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <button onClick={handleSaveFinalPrice} className={styles.addOrderBtn}>{AdminIcons.tag(13)} محاسبه و ثبت قیمت</button>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(248, 120, 32, 0.04)', border: '1px dashed rgba(248, 120, 32, 0.2)', borderRadius: '8px', padding: '10px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>
                        <span>مجموع درهم (AED):</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{calcTotalAed} درهم</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                        <span style={{ color: '#fff' }}>مبلغ کل به تومان:</span>
                        <span style={{ color: '#f87820' }}>{calcTotalToman.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <table className={styles.nestedPriceTable}>
                    <tbody>
                      <tr><td>قیمت خالص محصول (دبی)</td><td style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff' }}>{fmtToman(selectedLead.priceDetails?.product ?? 0)} تومان</td></tr>
                      <tr><td>هزینه ارسال هوایی به ایران</td><td style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff' }}>{fmtToman(selectedLead.priceDetails?.shipping ?? 0)} تومان</td></tr>
                      <tr><td>کارمزد سرویس دبی‌خرید</td><td style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff' }}>{fmtToman(selectedLead.priceDetails?.commission ?? 0)} تومان</td></tr>
                      <tr><td style={{ fontSize: '12px', fontWeight: '900', color: '#fff', paddingTop: '8px' }}>مبلغ کل سفارش</td><td style={{ textAlign: 'left', fontSize: '13px', fontWeight: '900', color: '#f87820', paddingTop: '8px' }}>{fmtToman(selectedLead.totalToman)} تومان</td></tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ marginTop: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '12px', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#8b92a5' }}>روش پرداخت:</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{selectedLead.paymentMethod === 'gateway' ? '💳 درگاه بانکی مستقیم' : '💳 کارت به کارت شتابی'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#8b92a5' }}>کد پیگیری تراکنش:</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', color: '#ff9d00' }}>{String(selectedLead.trackingNum || 'ثبت نشده')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#8b92a5' }}>وضعیت مالی:</span>
                <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9.5px', fontWeight: 'bold', background: selectedLead.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)', color: selectedLead.paymentStatus === 'paid' ? '#10b981' : '#f97316' }}>
                  {selectedLead.paymentStatus === 'paid' ? 'تایید و پرداخت شده' : 'در انتظار تایید فیش'}
                </span>
              </div>
            </div>

            <div className={styles.detailsFooterActions}>
              {selectedLead.isRequest === true && selectedLead.status === 'price_tagged' ? (
                <>
                  <div className={styles.detailsActionsRow}>
                    <button className={styles.detailsActionBtn} style={{ borderColor: '#10b981', color: '#10b981' }} onClick={() => handleSendPaymentLink(selectedLead)}>💬 ارسال لینک پرداخت (واتساپ)</button>
                    <button className={styles.detailsActionBtn} style={{ borderColor: '#f87820', color: '#f87820' }} onClick={() => handleConvertToOrder(selectedLead.id)}>✅ تبدیل به سفارش</button>
                  </div>
                  <div className={styles.detailsActionsRow} style={{ marginTop: '8px' }}>
                    <button className={styles.detailsActionBtn} onClick={() => handleManualPayment(selectedLead.id)}>💳 ثبت پرداخت دستی</button>
                    <button className={`${styles.detailsActionBtn} ${styles.detailsActionBtnRed}`} onClick={() => handleCancelRequest(selectedLead.id)}>{AdminIcons.close(12)} لغو درخواست</button>
                  </div>
                </>
              ) : selectedLead.isRequest === true && selectedLead.status === 'pending' ? (
                <div className={styles.detailsActionsRow}>
                  <button className={styles.detailsActionBtn} onClick={() => handleUpdateNotes(selectedLead)}>{AdminIcons.edit(13)} یادداشت داخلی</button>
                  <button className={`${styles.detailsActionBtn} ${styles.detailsActionBtnRed}`} onClick={() => handleCancelRequest(selectedLead.id)}>{AdminIcons.close(12)} لغو درخواست</button>
                </div>
              ) : (
                <>
                  <div className={styles.detailsActionsRow}>
                    <button className={styles.detailsActionBtn} onClick={() => handleUpdateNotes(selectedLead)}>{AdminIcons.edit(13)} یادداشت داخلی</button>
                    <select value={String(selectedLead.status ?? '')} onChange={event => handleStatusChange(selectedLead.id, event.target.value)} className={styles.detailsActionBtn} style={{ flex: 1, background: 'transparent', color: 'var(--admin-white)' }}>
                      <option value="pending">وضعیت: بررسی</option>
                      <option value="price_tagged">وضعیت: قیمت‌گذاری</option>
                      <option value="approved">وضعیت: تایید شده</option>
                      <option value="processing">وضعیت: در حال پردازش</option>
                      <option value="warehouse_dubai">وضعیت: انبار دبی</option>
                      <option value="noon_dubai">وضعیت: در نون دبی</option>
                      <option value="shipped">وضعیت: ارسال شده</option>
                      <option value="delivered">وضعیت: تحویل شده</option>
                      <option value="cancelled">وضعیت: لغو شده</option>
                    </select>
                  </div>
                  <div className={styles.detailsActionsRow} style={{ marginTop: '8px' }}>
                    <button className={`${styles.detailsActionBtn} ${styles.detailsActionBtnRed}`} onClick={() => handleDeleteLead(selectedLead.id)}>{AdminIcons.close(12)} لغو سفارش</button>
                    <button className={styles.detailsActionBtn} onClick={() => alert('آپلود فاکتور خرید شبیه‌سازی شد! فایل با موفقیت آپلود گردید.')}>{AdminIcons.cloud(12)} آپلود فاکتور</button>
                  </div>
                </>
              )}
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

export default function LeadsPage() {
  return (
    <AdminShell activeTab="leads">
      <LeadsContent />
    </AdminShell>
  );
}
