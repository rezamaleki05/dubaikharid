'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

const EMPTY_STATS = {
  income: 0, expenses: 0, profit: 0, count: 0, balance: 0,
  growth: { income: 0, expenses: 0, profit: 0, count: 0 },
  distribution: { income: 0, expense: 0, pending: 0 },
  methodTotals: {}, flowWeeks: [], balances: [],
};

const EMPTY_FORM = {
  orderId: '', recipient: '', amount: '', method: 'CARD', type: 'دریافتی', category: 'سفارشات',
  status: 'success', reference: '', account: '', phone: '', address: '', productName: '', notes: '',
};

function PaymentsContent() {
  const { can } = useAdminAccess();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [paymentsError, setPaymentsError] = useState('');
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('همه');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('همه');
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState('همه');
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [paymentEndDate, setPaymentEndDate] = useState('');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState(EMPTY_FORM);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(pagination.page), limit: String(pagination.limit) });
    if (paymentSearchQuery.trim()) params.set('search', paymentSearchQuery.trim());
    if (paymentStatusFilter !== 'همه') params.set('status', paymentStatusFilter);
    const methodCodes = { 'درگاه بانکی': 'ONLINE', 'کارت به کارت': 'CARD', 'حواله بانکی': 'BANK_TRANSFER' };
    if (paymentMethodFilter !== 'همه') params.set('method', methodCodes[paymentMethodFilter] || paymentMethodFilter);
    if (paymentCategoryFilter !== 'همه') params.set('category', paymentCategoryFilter);
    if (paymentStartDate) params.set('from', paymentStartDate);
    if (paymentEndDate) params.set('to', paymentEndDate);
    fetch(`/api/admin/payments?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'دریافت پرداخت‌ها با خطا مواجه شد.');
        setPayments(Array.isArray(payload.data) ? payload.data : []);
        setStats(payload.stats || EMPTY_STATS);
        setPagination(current => ({ ...current, ...(payload.pagination || {}) }));
        setPaymentsError('');
      })
      .catch(error => { if (error.name !== 'AbortError') setPaymentsError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setIsPaymentsLoading(false); });
    return () => controller.abort();
  }, [pagination.page, pagination.limit, paymentSearchQuery, paymentStatusFilter, paymentMethodFilter, paymentCategoryFilter, paymentStartDate, paymentEndDate, refreshToken]);

  const navigateToAdminSection = (tab) => {
    const route = ADMIN_ROUTES[tab];
    if (route) router.push(route);
  };

  const getMergedPayments = () => payments;

  const patchPayment = async (paymentId, body) => {
    const response = await fetch(`/api/admin/payments/${encodeURIComponent(paymentId)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'به‌روزرسانی پرداخت با خطا مواجه شد.');
    setRefreshToken(value => value + 1);
    return payload;
  };

  const handleApprovePayment = async (paymentId) => {
    if (!can(ADMIN_PERMISSIONS.PAYMENTS_EDIT)) return;
    try { await patchPayment(paymentId, { status: 'success' }); alert('فیش واریزی با موفقیت تایید و سفارش مربوطه فعال گردید!'); }
    catch (error) { alert(error.message); }
  };

  const handleRejectPayment = async (paymentId) => {
    if (!can(ADMIN_PERMISSIONS.PAYMENTS_EDIT)) return;
    if (!confirm('آیا از رد این تراکنش مطمئن هستید؟ پیام عدم تایید و مغایرت مالی ثبت خواهد شد.')) return;

    try { await patchPayment(paymentId, { status: 'failed', notes: 'واریزی توسط مدیریت رد شد. مغایرت در رسید واریزی.' }); alert('تراکنش رد شد و مغایرت مالی فیش اعلام گردید.'); }
    catch (error) { alert(error.message); }
  };

  const handleExportExcel = () => {
    const headers = ['شناسه تراکنش', 'تاریخ و ساعت', 'نوع', 'مبلغ (تومان)', 'روش پرداخت', 'دسته', 'وضعیت', 'سفارش مرجع', 'مشتری', 'تلفن', 'آدرس', 'کالا', 'توضیحات'];
    const csvRows = [headers.join(',')];
    getMergedPayments().forEach((payment) => {
      const typeValue = payment.type || (payment.amount > 0 ? 'دریافتی' : 'پرداختی');
      const categoryValue = payment.category || (payment.amount > 0 ? 'سفارشات' : 'هزینه ها');
      const statusValue = payment.status === 'success' ? 'تسویه شده' : 'در انتظار';
      const row = [
        payment.id,
        payment.date,
        typeValue,
        payment.amount,
        payment.method,
        categoryValue,
        statusValue,
        payment.orderId,
        payment.recipient,
        payment.phone,
        payment.address,
        payment.productName,
        payment.notes
      ];
      csvRows.push(row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dubaikharid-payments-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('فایل گزارش اکسل تراکنش‌ها با موفقیت دانلود شد.');
  };

  const handleAddPaymentSubmit = async (event) => {
    event.preventDefault();
    if (!can(ADMIN_PERMISSIONS.PAYMENTS_EDIT)) return;
    if (!newPaymentForm.orderId) {
      alert('لطفاً شماره سفارش مرجع را وارد کنید.');
      return;
    }
    try {
      const response = await fetch('/api/admin/payments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: newPaymentForm.orderId, method: newPaymentForm.method, status: newPaymentForm.status, reference: newPaymentForm.reference, account: newPaymentForm.account, notes: newPaymentForm.notes }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ثبت پرداخت با خطا مواجه شد.');
      setIsAddPaymentOpen(false);
      setNewPaymentForm(EMPTY_FORM);
      setRefreshToken(value => value + 1);
      alert('تراکنش مالی جدید با موفقیت ثبت شد!');
    } catch (error) { alert(error.message); }
  };

            const allPayments = getMergedPayments();

            const filteredPayments = allPayments;
            const displayIncome = stats.income || 0;
            const displayExpenses = stats.expenses || 0;
            const displayProfit = stats.profit || 0;
            const displayTxnCount = stats.count || 0;
            const displayBalance = stats.balance || 0;
            const incomeGrowth = stats.growth?.income || 0;
            const expenseGrowth = stats.growth?.expenses || 0;
            const profitGrowth = stats.growth?.profit || 0;
            const txnGrowth = stats.growth?.count || 0;

            const payRenderGrowth = (gVal) => {
              if (gVal === 0) return <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '4px' }}>بدون تغییر</span>;
              const isUp = gVal > 0;
              const color = isUp ? '#10b981' : '#ef4444';
              return (
                <span style={{ fontSize: '9.5px', color, marginTop: '4px', fontWeight: 'bold' }}>
                  نسبت ماه قبل {Math.abs(gVal).toFixed(1).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])}٪ {isUp ? '+' : '-'}
                </span>
              );
            };

            // --- Widget: توزیع پرداخت‌ها (Doughnut) ---
            const distIncome = stats.distribution?.income || 0;
            const distExpense = stats.distribution?.expense || 0;
            const distPending = stats.distribution?.pending || 0;
            const distTotal = distIncome + distExpense + distPending || 1;
            const distIncomePct = Math.round((distIncome / distTotal) * 100);
            const distExpensePct = Math.round((distExpense / distTotal) * 100);
            const distPendingPct = 100 - distIncomePct - distExpensePct;
            const doughnutCircum = 2 * Math.PI * 38; // ~238.76
            const doughnutIncomeLen = (distIncomePct / 100) * doughnutCircum;
            const doughnutExpenseLen = (distExpensePct / 100) * doughnutCircum;
            const doughnutPendingLen = (distPendingPct / 100) * doughnutCircum;
            const doughnutIncomeOffset = doughnutCircum - doughnutIncomeLen;
            const doughnutExpenseOffset = doughnutCircum - doughnutExpenseLen;
            const doughnutPendingOffset = doughnutCircum - doughnutPendingLen;
            const doughnutExpenseRotate = -90 + (distIncomePct / 100) * 360;
            const doughnutPendingRotate = doughnutExpenseRotate + (distExpensePct / 100) * 360;

            // --- Widget: خلاصه روش‌های پرداخت ---
            const knownMethods = ['درگاه بانکی', 'کارت به کارت', 'حواله بانکی'];
            const methodIcons = { 'درگاه بانکی': 'card', 'کارت به کارت': 'phone', 'حواله بانکی': 'bank' };
            const methodColors = { 'درگاه بانکی': '#f59e0b', 'کارت به کارت': '#3b82f6', 'حواله بانکی': '#c4c8d4' };
            const methodTotals = {};
            let methodGrandTotal = 0;
            const methodCodeByLabel = { 'درگاه بانکی': 'ONLINE', 'کارت به کارت': 'CARD', 'حواله بانکی': 'BANK_TRANSFER' };
            knownMethods.forEach(m => {
              const total = stats.methodTotals?.[methodCodeByLabel[m]] || 0;
              methodTotals[m] = total;
              methodGrandTotal += total;
            });
            const otherMethodTotal = ['CASH', 'POS', 'OTHER'].reduce((sum, code) => sum + (stats.methodTotals?.[code] || 0), 0);
            methodGrandTotal += otherMethodTotal;
            const safeGrandTotal = methodGrandTotal || 1;

            // --- Widget: نمودار جریان مالی (SVG line chart) ---
            // Build weekly data for the current month
            const flowWeeks = Array.isArray(stats.flowWeeks) ? stats.flowWeeks : [];
            if (flowWeeks.length === 0) flowWeeks.push({ income: 0, expense: 0, profit: 0, label: 'هفته ۱' });

            const flowMaxVal = Math.max(...flowWeeks.map(w => Math.max(w.income, w.expense, w.profit)), 1);
            const flowToY = (val) => 110 - (val / flowMaxVal) * 90;
            const flowXStep = flowWeeks.length > 1 ? 250 / (flowWeeks.length - 1) : 0;
            const flowMakePath = (key) => flowWeeks.map((w, i) => `${i === 0 ? 'M' : 'L'} ${40 + i * flowXStep} ${flowToY(w[key])}`).join(' ');
            const flowYLabels = [flowMaxVal, Math.round(flowMaxVal * 0.66), Math.round(flowMaxVal * 0.33), 0];
            const flowFormatLabel = (v) => {
              if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
              if (v >= 1e6) return (v / 1e6).toFixed(0) + 'M';
              if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
              return v.toString();
            };

            return (
              <div>
                {/* Header Title Row */}
                <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
                  <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#f87820', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.card(28)}</span>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>پرداخت‌ها</h1>
                      <p style={{ fontSize: '11.5px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>مدیریت تمامی پرداخت‌های دریافتی و هزینه‌ها</p>
                    </div>
                  </div>

                  <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => navigateToAdminSection('financial_reports')} 
                      className={styles.advFilterBtn} 
                      style={{ padding: '10px 15px', color: '#fff' }}
                      title="گزارشات جامع مالی"
                    >
                      {AdminIcons.chart(12)} گزارش مالی
                    </button>
                    <button 
                      type="button" 
                      onClick={handleExportExcel} 
                      className={styles.advFilterBtn} 
                      style={{ padding: '10px 15px', color: '#fff' }}
                      title="دریافت فایل اکسل"
                    >
                      {AdminIcons.download(12)} اکسل
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setPaymentStatusFilter(paymentStatusFilter === 'همه' ? 'pending' : 'همه')} 
                      className={styles.advFilterBtn} 
                      style={{ padding: '10px 15px', color: '#fff' }}
                      title="تغییر نمایش فیلترها"
                    >
                      {AdminIcons.sliders(12)} فیلتر
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddPaymentOpen(true)} 
                      className={styles.addOrderBtn}
                      style={{ height: '42px', padding: '0 20px', borderRadius: '10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {AdminIcons.plus(12)} ثبت پرداخت جدید
                    </button>
                  </div>
                </div>

                {/* 5 KPI metrics row */}
                <div className={styles.metricsGrid5}>
                  {/* KPI 1 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => {
                      setPaymentCategoryFilter('سفارشات');
                      setPaymentMethodFilter('همه');
                      setPaymentStatusFilter('success');
                    }}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="فیلتر سفارشات موفق"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>کل پرداخت ها (دریافتی)</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayIncome.toLocaleString('fa-IR')}
                      </span>
                      {payRenderGrowth(incomeGrowth)}
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '50%' }}>
                      {AdminIcons.download(18)}
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => {
                      setPaymentCategoryFilter('هزینه ها');
                      setPaymentMethodFilter('همه');
                      setPaymentStatusFilter('همه');
                    }}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="فیلتر هزینه های خروجی"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>کل هزینه ها (پرداختی)</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayExpenses.toLocaleString('fa-IR')}
                      </span>
                      {payRenderGrowth(expenseGrowth)}
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%' }}>
                      {AdminIcons.upload(18)}
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => navigateToAdminSection('financial_reports')}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="مشاهده گزارش سود سالانه"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>سود خالص</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', color: '#10b981', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayProfit.toLocaleString('fa-IR')}
                      </span>
                      {payRenderGrowth(profitGrowth)}
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '50%' }}>
                      {AdminIcons.bank(18)}
                    </div>
                  </div>

                  {/* KPI 4 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => {
                      setPaymentCategoryFilter('همه');
                      setPaymentMethodFilter('همه');
                      setPaymentStatusFilter('همه');
                      setPaymentSearchQuery('');
                    }}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="نمایش کل تراکنش‌ها"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>تعداد تراکنش ها</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayTxnCount.toLocaleString('fa-IR')}
                      </span>
                      {payRenderGrowth(txnGrowth)}
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '50%' }}>
                      {AdminIcons.sync(18)}
                    </div>
                  </div>

                  {/* KPI 5 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => setIsBalanceModalOpen(true)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="جزئیات موجودی حساب‌ها"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>مانده حساب</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', color: '#ff9d00', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayBalance.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '4px' }}>
                        موجودی در حال گردش
                      </span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#f59e0b', borderRadius: '50%' }}>
                      {AdminIcons.lock(18)}
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
                        placeholder="جستجو..." 
                        value={paymentSearchQuery}
                        onChange={(e) => setPaymentSearchQuery(e.target.value)}
                        className={styles.searchBarInput}
                        style={{ width: '240px' }}
                      />
                    </div>

                    {/* Status Filter */}
                    <select 
                      value={paymentStatusFilter} 
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه وضعیت‌ها</option>
                      <option value="success">تسویه شده</option>
                      <option value="pending">در انتظار</option>
                    </select>

                    {/* Method Filter */}
                    <select 
                      value={paymentMethodFilter} 
                      onChange={(e) => setPaymentMethodFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">مبلغ روش‌ها</option>
                      <option value="درگاه بانکی">درگاه بانکی</option>
                      <option value="کارت به کارت">کارت به کارت</option>
                      <option value="حواله بانکی">حواله بانکی</option>
                    </select>

                    {/* Category Filter */}
                    <select 
                      value={paymentCategoryFilter} 
                      onChange={(e) => setPaymentCategoryFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه دسته‌ها</option>
                      <option value="سفارشات">سفارشات</option>
                      <option value="هزینه ها">هزینه‌ها</option>
                    </select>

                    {/* Date filter inputs */}
                    <div className={styles.paymentDateFilters} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#11131a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '4px 10px', minHeight: '38px' }}>
                      <span style={{ color: '#8b92a5', fontSize: '11.5px', display: 'flex', alignItems: 'center' }}>{AdminIcons.calendar(12)}</span>
                      <input 
                        type="date" 
                        value={paymentStartDate} 
                        onChange={(e) => setPaymentStartDate(e.target.value)} 
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' }} 
                        title="تاریخ شروع"
                      />
                      <span style={{ color: '#8b92a5', fontSize: '10px' }}>تا</span>
                      <input 
                        type="date" 
                        value={paymentEndDate} 
                        onChange={(e) => setPaymentEndDate(e.target.value)} 
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' }} 
                        title="تاریخ پایان"
                      />
                      {(paymentStartDate || paymentEndDate) && (
                        <button 
                          onClick={() => { setPaymentStartDate(''); setPaymentEndDate(''); }}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px', padding: '0 4px', fontWeight: 'bold' }}
                          title="حذف فیلتر تاریخ"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Split Workspace */}
                <div className={styles.customerSplitGrid}>
                  
                  {/* LEFT COLUMN: Payments Table */}
                  <div style={{ background: '#11131a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.adminTable}>
                        <thead>
                          <tr>
                            <th>شماره</th>
                            <th>تاریخ</th>
                            <th>نوع</th>
                            <th>مبلغ (تومان)</th>
                            <th>روش پرداخت</th>
                            <th>دسته</th>
                            <th>وضعیت</th>
                            <th>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.length === 0 ? (
                            <tr key="empty-payments">
                              <td colSpan="8" style={{ textAlign: 'center', color: paymentsError ? '#ef4444' : '#8b92a5', padding: '50px 0' }}>{isPaymentsLoading ? 'در حال دریافت تراکنش‌ها...' : paymentsError || 'هیچ تراکنش مالی یافت نشد.'}</td>
                            </tr>
                          ) : (
                            filteredPayments.map(txn => {
                              const isSelected = selectedPaymentId === txn.id;
                              const isPositive = txn.amount > 0;
                              
                              // Determine method icon and color
                              let methodIcon = AdminIcons.card(12);
                              let methodColor = '#f59e0b'; // Gateway yellow
                              if (txn.method === 'کارت به کارت') {
                                methodIcon = AdminIcons.phone(12);
                                methodColor = '#3b82f6'; // Card blue
                              } else if (txn.method === 'حواله بانکی') {
                                methodIcon = AdminIcons.bank(12);
                                methodColor = '#c4c8d4'; // Bank silver
                              }

                              return (
                                <tr 
                                  key={txn.id}
                                  onClick={() => setSelectedPaymentId(txn.id)}
                                  className={isSelected ? styles.activeRowHighlight : ''}
                                  style={{ 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s', 
                                    backgroundColor: isSelected ? 'rgba(248, 120, 32, 0.08)' : 'transparent',
                                    borderRight: isSelected ? '4px solid #f87820' : 'none'
                                  }}
                                >
                                  {/* Transaction ID */}
                                  <td style={{ fontWeight: '850', color: '#ff9d00', fontFamily: 'monospace', fontSize: '11.5px' }}>
                                    {txn.id}
                                  </td>

                                  {/* Date */}
                                  <td style={{ fontSize: '11.5px', color: '#c4c8d4', fontFamily: 'var(--font-vazirmatn)' }}>
                                    {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(txn.date))}
                                  </td>

                                  {/* Type */}
                                  <td>
                                    {isPositive ? (
                                      <span style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        دریافتی
                                      </span>
                                    ) : (
                                      <span style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '10px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        پرداختی
                                      </span>
                                    )}
                                  </td>

                                  {/* Amount */}
                                  <td style={{ 
                                    fontFamily: 'var(--font-vazirmatn)', 
                                    fontWeight: '800', 
                                    color: isPositive ? '#10b981' : '#ef4444', 
                                    fontSize: '12.5px',
                                    direction: 'ltr',
                                    textAlign: 'right'
                                  }}>
                                    {isPositive ? '+' : ''}{txn.amount.toLocaleString('fa-IR')}
                                  </td>

                                  {/* Method */}
                                  <td style={{ fontSize: '12px' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ color: methodColor }}>{methodIcon}</span>
                                      <span>{txn.method}</span>
                                    </span>
                                  </td>

                                  {/* Category */}
                                  <td style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                                    {txn.category || (isPositive ? 'سفارشات' : 'هزینه ها')}
                                  </td>

                                  {/* Status */}
                                  <td>
                                    {txn.status === 'success' ? (
                                      <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '9.5px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        تسویه شده
                                      </span>
                                    ) : txn.status === 'failed' || txn.status === 'refunded' ? (
                                      <span className={styles.badgeCustoms} style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '9.5px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        {txn.status === 'refunded' ? 'بازپرداخت شده' : 'ناموفق'}
                                      </span>
                                    ) : (
                                      <span className={styles.badgeCustoms} style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '9.5px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        در انتظار
                                      </span>
                                    )}
                                  </td>

                                  {/* Action */}
                                  <td>
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedPaymentId(txn.id); }} style={{ background: 'none', border: 'none', color: '#f87820', cursor: 'pointer', fontSize: '13px', padding: '4px' }} title="مشاهده تراکنش">
                                      {AdminIcons.eye(13)}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button disabled={pagination.page <= 1} onClick={() => setPagination(current => ({ ...current, page: current.page - 1 }))} className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&lt;</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#f87820', color: '#fff', borderColor: '#f87820' }}>{pagination.page.toLocaleString('fa-IR')}</button>
                        <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(current => ({ ...current, page: current.page + 1 }))} className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&gt;</button>
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#8b92a5' }}>
                        نمایش {filteredPayments.length ? ((pagination.page - 1) * pagination.limit + 1).toLocaleString('fa-IR') : '۰'} تا {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString('fa-IR')} از {pagination.total.toLocaleString('fa-IR')} نتیجه
                      </span>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Sticky widgets or Receipt Card */}
                  <div className={styles.shipmentsRightWidgetsContainer}>
                    {selectedPaymentId === '' ? (
                      <>
                        {/* Widget 1: نمودار جریان مالی (Mocked SVG Line Chart mirroring mockup) */}
                        <div 
                          className={styles.shipmentsDoughnutCard} 
                          onClick={() => navigateToAdminSection('financial_reports')} 
                          style={{ cursor: 'pointer' }}
                          title="مشاهده جزئیات در گزارش مالی"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 className={styles.shipmentsCardTitle} style={{ margin: 0, border: 'none', padding: 0 }}>نمودار جریان مالی</h3>
                            <select 
                              defaultValue="monthly" 
                              onClick={(e) => e.stopPropagation()} 
                              className={styles.filterSelect} 
                              style={{ padding: '3px 8px', fontSize: '10px' }}
                            >
                              <option value="monthly">ماه جاری</option>
                            </select>
                          </div>
                          
                          {/* Rich visual SVG double-line graph - DYNAMIC */}
                          <div style={{ height: '140px', position: 'relative', marginTop: '10px' }}>
                            <svg width="100%" height="100%" viewBox="0 0 300 130" preserveAspectRatio="none">
                              {/* Grid lines */}
                              <line x1="30" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                              <line x1="30" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                              <line x1="30" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                              <line x1="30" y1="110" x2="300" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                              
                              {/* Y-Axis Labels */}
                              {flowYLabels.map((v, i) => (
                                <text key={i} x="0" y={24 + i * 30} fill="#6c7284" fontSize="8" textAnchor="start">{flowFormatLabel(v)}</text>
                              ))}
                              
                              {/* Income Line - Green */}
                              <path d={flowMakePath('income')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                              
                              {/* Expense Line - Red */}
                              <path d={flowMakePath('expense')} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                              
                              {/* Net Profit Line - Blue */}
                              <path d={flowMakePath('profit')} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,3" strokeLinecap="round" />
                              
                              {/* End Points */}
                              {flowWeeks.length > 0 && (
                                <>
                                  <circle cx={40 + (flowWeeks.length - 1) * flowXStep} cy={flowToY(flowWeeks[flowWeeks.length - 1].income)} r="4" fill="#10b981" />
                                  <circle cx={40 + (flowWeeks.length - 1) * flowXStep} cy={flowToY(flowWeeks[flowWeeks.length - 1].expense)} r="4" fill="#ef4444" />
                                  <circle cx={40 + (flowWeeks.length - 1) * flowXStep} cy={flowToY(flowWeeks[flowWeeks.length - 1].profit)} r="3" fill="#3b82f6" />
                                </>
                              )}
                            </svg>
                          </div>
                          
                          {/* Legend / Axis - Dynamic week labels */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 30px 0', fontSize: '9px', color: '#8b92a5', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: '8px' }}>
                            {flowWeeks.map((w, i) => (
                              <span key={i}>{w.label}</span>
                            ))}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '9.5px', color: '#c4c8d4' }}>
                              <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '2px' }} /> دریافتی ها
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '9.5px', color: '#c4c8d4' }}>
                              <span style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '2px' }} /> پرداختی ها
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '9.5px', color: '#c4c8d4' }}>
                              <span style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px' }} strokeDasharray="2,2" /> سود خالص
                            </span>
                          </div>
                        </div>

                        {/* Widget 2: توزیع پرداخت‌ها (Doughnut Chart SVG - DYNAMIC) */}
                        <div className={styles.shipmentsDoughnutCard}>
                          <h3 className={styles.shipmentsCardTitle}>توزیع پرداخت ها</h3>
                          
                          <div className={styles.doughnutWrapper}>
                            <div className={styles.doughnutSvgContainer}>
                              <svg width="110" height="110" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="11" />
                                
                                {/* Dynamic arcs */}
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="11" 
                                        strokeDasharray={`${doughnutIncomeLen} ${doughnutCircum - doughnutIncomeLen}`} strokeDashoffset="0" transform="rotate(-90 50 50)" />
                                {distExpensePct > 0 && <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="11" 
                                        strokeDasharray={`${doughnutExpenseLen} ${doughnutCircum - doughnutExpenseLen}`} strokeDashoffset="0" transform={`rotate(${doughnutExpenseRotate} 50 50)`} />}
                                {distPendingPct > 0 && <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="11" 
                                        strokeDasharray={`${doughnutPendingLen} ${doughnutCircum - doughnutPendingLen}`} strokeDashoffset="0" transform={`rotate(${doughnutPendingRotate} 50 50)`} />}
                              </svg>
                              <div className={styles.doughnutCenterText} style={{ width: '100%' }}>
                                <span className={styles.doughnutCenterNum} style={{ fontSize: '15px' }}>
                                  {displayTxnCount.toLocaleString('fa-IR')}
                                </span>
                                <span className={styles.doughnutCenterLabel} style={{ fontSize: '8px' }}>تراکنش</span>
                              </div>
                            </div>

                            <div className={styles.doughnutLegendList}>
                              <div 
                                className={styles.doughnutLegendItem} 
                                onClick={() => { setPaymentCategoryFilter('سفارشات'); setPaymentStatusFilter('success'); }} 
                                style={{ cursor: 'pointer' }}
                                title="کلیک برای فیلتر"
                              >
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} />
                                  <span className={styles.legendText}>دریافتی</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{distIncome.toLocaleString('fa-IR')}</span>
                                  <span className={styles.legendPct}>{distIncomePct.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])}٪</span>
                                </div>
                              </div>
                              <div 
                                className={styles.doughnutLegendItem} 
                                onClick={() => { setPaymentCategoryFilter('هزینه ها'); setPaymentStatusFilter('success'); }} 
                                style={{ cursor: 'pointer' }}
                                title="کلیک برای فیلتر"
                              >
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }} />
                                  <span className={styles.legendText}>پرداختی</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{distExpense.toLocaleString('fa-IR')}</span>
                                  <span className={styles.legendPct}>{distExpensePct.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])}٪</span>
                                </div>
                              </div>
                              <div 
                                className={styles.doughnutLegendItem} 
                                onClick={() => { setPaymentStatusFilter('pending'); }} 
                                style={{ cursor: 'pointer' }}
                                title="کلیک برای فیلتر"
                              >
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }} />
                                  <span className={styles.legendText}>در انتظار</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{distPending.toLocaleString('fa-IR')}</span>
                                  <span className={styles.legendPct}>{distPendingPct.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])}٪</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Widget 3: خلاصه روش‌های پرداخت */}
                        <div className={styles.shipmentsDoughnutCard}>
                          <h3 className={styles.shipmentsCardTitle}>خلاصه روش های پرداخت</h3>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                            {/* Dynamic method bars */}
                            {knownMethods.map((m) => {
                              const mTotal = methodTotals[m] || 0;
                              const mPct = Math.round((mTotal / safeGrandTotal) * 100);
                              const mIcon = methodIcons[m];
                              const mColor = methodColors[m];
                              const formatted = mTotal.toLocaleString('fa-IR') + ' تومان';
                              const pctStr = mPct.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                              return (
                                <div key={m}
                                  onClick={() => setPaymentMethodFilter(m)} 
                                  style={{ cursor: 'pointer' }} 
                                  title={`فیلتر ${m}`}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c4c8d4' }}>
                                      <span>{AdminIcons[mIcon] ? AdminIcons[mIcon](12) : AdminIcons.card(12)}</span> {m}
                                    </span>
                                    <span style={{ fontWeight: 'bold' }}>
                                      {formatted} <span style={{ color: '#8b92a5', fontSize: '9px', marginRight: '6px' }}>({pctStr}٪)</span>
                                    </span>
                                  </div>
                                  <div className={styles.progressBarTrack}>
                                    <div className={styles.progressBarFill} style={{ width: `${mPct}%`, backgroundColor: mColor }} />
                                  </div>
                                </div>
                              );
                            })}

                            {/* Other methods */}
                            {(() => {
                              const oPct = Math.round((otherMethodTotal / safeGrandTotal) * 100);
                              const oFormatted = otherMethodTotal.toLocaleString('fa-IR') + ' تومان';
                              const oPctStr = oPct.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                              return (
                                <div
                                  onClick={() => setPaymentMethodFilter('همه')} 
                                  style={{ cursor: 'pointer' }} 
                                  title="حذف فیلتر روش"
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c4c8d4' }}>
                                      {AdminIcons.folder(12)} سایر روش‌ها
                                    </span>
                                    <span style={{ fontWeight: 'bold' }}>
                                      {oFormatted} <span style={{ color: '#8b92a5', fontSize: '9px', marginRight: '6px' }}>({oPctStr}٪)</span>
                                    </span>
                                  </div>
                                  <div className={styles.progressBarTrack}>
                                    <div className={styles.progressBarFill} style={{ width: `${oPct}%`, backgroundColor: '#8b92a5' }} />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </>
                    ) : (() => {
                      const selectedTxn = getMergedPayments().find(p => p.id === selectedPaymentId);
                      if (!selectedTxn) return <p style={{ color: '#8b92a5', textAlign: 'center', padding: '20px' }}>تراکنش یافت نشد.</p>;

                      return (
                        <div className={styles.shipmentDetailsCard} style={{ animation: 'fadeIn 0.25s ease' }}>
                          <div className={styles.detailsHeader}>
                            <h3>{AdminIcons.receipt(16)} رسید دیجیتالی تراکنش</h3>
                            <button 
                              type="button"
                              onClick={() => setSelectedPaymentId('')} 
                              className={styles.backToStatsBtn}
                            >
                              {AdminIcons.back(12)} برگشت به آمار
                            </button>
                          </div>

                          {/* Transaction code and Status */}
                          <div className={styles.shipmentMainCodeRow}>
                            <span className={styles.shipmentMainCode}>{selectedTxn.id}</span>
                            <div>
                              {selectedTxn.status === 'success' ? (
                                <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px' }}>
                                  تراکنش موفق
                                </span>
                              ) : (
                                <span className={styles.badgeCustoms} style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '10px' }}>
                                  در انتظار بررسی
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Order Details Mini Box */}
                          <div className={styles.productMiniSection}>
                            <div className={styles.productMiniInfo} style={{ width: '100%' }}>
                              <span className={styles.productMiniName} style={{ fontSize: '13.5px', display: 'block', marginBottom: '4px' }}>
                                {selectedTxn.productName || 'بابت ثبت فاکتور سفارش مشتری'}
                              </span>
                              {selectedTxn.orderId && (
                                <span 
                                  className={styles.productMiniOrderId}
                                  onClick={() => {
                                    navigateToAdminSection('leads');
                                  }}
                                  style={{ cursor: 'pointer', textDecoration: 'underline', color: '#f87820' }}
                                >
                                  شماره سفارش مرجع: {selectedTxn.orderId}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Amount Card */}
                          <div style={{ background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>مبلغ کل واریزی:</span>
                            <span style={{ fontSize: '20px', fontWeight: '900', color: selectedTxn.amount > 0 ? '#10b981' : '#ef4444' }}>
                              {selectedTxn.amount.toLocaleString('fa-IR')} تومان
                            </span>
                          </div>

                          {/* Transaction Details grid */}
                          <div className={styles.addressSection} style={{ marginBottom: '20px' }}>
                            <h4 className={styles.addressTitle}>{AdminIcons.clipboard(18)} مشخصات و رهگیری بانکی</h4>
                            
                            <div className={styles.addressRow}>
                              <span className={styles.addressLabel}>روش واریز:</span>
                              <span className={styles.addressVal} style={{ fontWeight: 'bold', color: '#fff' }}>{selectedTxn.method}</span>
                            </div>
                            
                            {selectedTxn.reference && (
                              <div className={styles.addressRow} style={{ marginTop: '6px' }}>
                                <span className={styles.addressLabel}>شماره مرجع بانکی:</span>
                                <span className={styles.addressVal} style={{ fontFamily: 'monospace', color: '#ff9d00' }}>{selectedTxn.reference}</span>
                              </div>
                            )}

                            {selectedTxn.account && (
                              <div className={styles.addressRow} style={{ marginTop: '6px' }}>
                                <span className={styles.addressLabel}>حساب مقصد / درگاه:</span>
                                <span className={styles.addressVal}>{selectedTxn.account}</span>
                              </div>
                            )}

                            <div className={styles.addressRow} style={{ marginTop: '6px' }}>
                              <span className={styles.addressLabel}>تاریخ و زمان ثبت:</span>
                              <span className={styles.addressVal} dir="ltr">{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(selectedTxn.date))}</span>
                            </div>
                          </div>

                          {/* Client profiles */}
                          {selectedTxn.recipient && (
                            <div className={styles.addressSection} style={{ marginBottom: '20px' }}>
                              <h4 className={styles.addressTitle}>{AdminIcons.user(14)} اطلاعات پرداخت‌کننده کالا</h4>
                              <div className={styles.addressRow}>
                                <span className={styles.addressLabel}>نام و نام‌خانوادگی:</span>
                                <span 
                                  className={styles.addressVal} 
                                  style={{ cursor: 'pointer', textDecoration: 'underline', color: '#f87820', fontWeight: 'bold' }}
                                  onClick={() => {
                                    const customerQuery = selectedTxn.customerId
                                      ? `?customer=${encodeURIComponent(selectedTxn.customerId)}`
                                      : '';
                                    window.location.assign(`/admin/customers${customerQuery}`);
                                  }}
                                >
                                  {selectedTxn.recipient}
                                </span>
                              </div>
                              {selectedTxn.phone && selectedTxn.phone !== '-' && (
                                <div className={styles.addressRow} style={{ marginTop: '4px' }}>
                                  <span className={styles.addressLabel}>شماره تماس:</span>
                                  <span className={styles.addressVal} dir="ltr">{selectedTxn.phone}</span>
                                </div>
                              )}
                              {selectedTxn.address && selectedTxn.address !== '-' && (
                                <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                                  <span className={styles.addressLabel} style={{ display: 'block', marginBottom: '4px' }}>آدرس تحویل کالا:</span>
                                  <span style={{ fontSize: '11px', color: '#c4c8d4', lineHeight: '1.5' }}>{selectedTxn.address}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* System Internal Notes */}
                          {selectedTxn.notes && (
                            <div className={styles.addressSection} style={{ background: 'rgba(248, 120, 32, 0.02)', borderColor: 'rgba(248, 120, 32, 0.1)', marginBottom: '20px' }}>
                              <h4 className={styles.addressTitle} style={{ color: '#f87820', borderBottomColor: 'rgba(248, 120, 32, 0.1)' }}>{AdminIcons.edit(13)} یادداشت تراکنش سیستم</h4>
                              <p style={{ fontSize: '11px', color: '#c4c8d4', margin: '4px 0 0 0', lineHeight: '1.6' }}>
                                {selectedTxn.notes}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons based on status */}
                          {selectedTxn.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                type="button" 
                                onClick={() => handleApprovePayment(selectedTxn.id)}
                                className={styles.printLabelActionBtn}
                                style={{ flexGrow: 2, height: '42px', padding: 0 }}
                              >
                                {AdminIcons.check(12)} تایید و ثبت تراکنش موفق
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleRejectPayment(selectedTxn.id)}
                                style={{ flexGrow: 1, background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                {AdminIcons.close(12)} رد رسید
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => alert('صدور فایل PDF برای این تراکنش هنوز پیاده‌سازی نشده است.')}
                              className={styles.printLabelActionBtn}
                            >
                              {AdminIcons.download(12)} دانلود فاکتور و رسید تراکنش (PDF)
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* MODAL: ADD PAYMENT OVERLAY */}
                {isAddPaymentOpen && (
                  <div className={styles.modalOverlay} onClick={() => setIsAddPaymentOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ width: '480px', maxWidth: '90%' }}>
                      <div className={styles.modalHeader}>
                        <h2>{AdminIcons.plus(16)} ثبت و ایجاد سند پرداخت جدید</h2>
                        <button className={styles.modalCloseBtn} onClick={() => setIsAddPaymentOpen(false)}>×</button>
                      </div>
                      
                      <form onSubmit={handleAddPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className={styles.formGroup}>
                            <label>نوع تراکنش:</label>
                            <select 
                              value={newPaymentForm.type} 
                              disabled
                              className={styles.inputField}
                            >
                              <option value="دریافتی">دریافتی (ورودی)</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>دسته بندی:</label>
                            <select 
                              value={newPaymentForm.category} 
                              disabled
                              className={styles.inputField}
                            >
                              <option value="سفارشات">سفارشات مشتری</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className={styles.formGroup}>
                            <label>مبلغ تراکنش (تومان):</label>
                            <input 
                              type="text"
                              disabled
                              placeholder="از مبلغ نهایی سفارش محاسبه می‌شود"
                              value={newPaymentForm.amount} 
                              className={styles.inputField}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>روش پرداخت:</label>
                            <select 
                              value={newPaymentForm.method} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, method: e.target.value })}
                              className={styles.inputField}
                            >
                              <option value="ONLINE" disabled>درگاه بانکی</option>
                              <option value="CARD">کارت به کارت</option>
                              <option value="BANK_TRANSFER">حواله بانکی</option>
                              <option value="POS">کارتخوان</option>
                              <option value="CASH">نقدی</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className={styles.formGroup}>
                            <label>نام مشتری / شرح هزینه:</label>
                            <input 
                              type="text" 
                              disabled
                              placeholder="از سفارش دریافت می‌شود"
                              value={newPaymentForm.recipient} 
                              className={styles.inputField}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>شماره سفارش مرجع:</label>
                            <input 
                              type="text" 
                              required
                              placeholder="مثال: DK-1254"
                              value={newPaymentForm.orderId} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, orderId: e.target.value })}
                              className={styles.inputField}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className={styles.formGroup}>
                            <label>کد مرجع بانکی (REF):</label>
                            <input 
                              type="text" 
                              placeholder="مثال: REF-752145" 
                              value={newPaymentForm.reference} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, reference: e.target.value })}
                              className={styles.inputField}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>درگاه / حساب مقصد:</label>
                            <input 
                              type="text" 
                              placeholder="مثال: درگاه سامان" 
                              value={newPaymentForm.account} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, account: e.target.value })}
                              className={styles.inputField}
                            />
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label>نام کالا / جزئیات خرید:</label>
                          <input 
                            type="text" 
                              disabled
                              placeholder="از اقلام سفارش دریافت می‌شود"
                            value={newPaymentForm.productName} 
                            className={styles.inputField}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>توضیحات و یادداشت تراکنش:</label>
                          <textarea 
                            rows="2"
                            placeholder="وارد کردن توضیحات تراکنش..." 
                            value={newPaymentForm.notes} 
                            onChange={(e) => setNewPaymentForm({ ...newPaymentForm, notes: e.target.value })}
                            className={styles.inputField}
                            style={{ resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="submit" className={styles.addOrderBtn} style={{ flexGrow: 2 }}>ثبت نهایی و ثبت سند</button>
                          <button type="button" onClick={() => setIsAddPaymentOpen(false)} className={styles.advFilterBtn} style={{ flexGrow: 1 }}>انصراف</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL: BALANCES BREAKDOWN */}
                {isBalanceModalOpen && (
                  <div className={styles.modalOverlay} onClick={() => setIsBalanceModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ width: '400px', maxWidth: '90%' }}>
                      <div className={styles.modalHeader}>
                        <h2>{AdminIcons.lock(16)} تفکیک موجودی و وضعیت حساب‌ها</h2>
                        <button className={styles.modalCloseBtn} onClick={() => setIsBalanceModalOpen(false)}>×</button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                        {(stats.balances?.length ? stats.balances : [{ account: 'بدون تراکنش ثبت‌شده', amount: 0 }]).map(balance => (
                          <div key={balance.account} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{AdminIcons.bank(14)} {balance.account}</span>
                            <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>{Number(balance.amount).toLocaleString('fa-IR')} تومان</span>
                          </div>
                        ))}

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>مجموع موجودی صندوق‌ها:</span>
                          <span style={{ fontSize: '16px', fontWeight: '900', color: '#ff9d00', fontFamily: 'var(--font-vazirmatn)' }}>
                            {displayBalance.toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                        
                        <button type="button" onClick={() => setIsBalanceModalOpen(false)} className={styles.advFilterBtn} style={{ marginTop: '10px', width: '100%' }}>بستن پنجره</button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
}

export default function PaymentsPage() {
  return (
    <AdminShell activeTab="payments">
      <PaymentsContent />
    </AdminShell>
  );
}
