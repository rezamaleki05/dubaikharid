'use client';

import React, { useEffect, useState } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell, { useAdminShellData } from '@/components/admin/AdminShell';

const INITIAL_PAYMENTS_SEED = [];
const INITIAL_LEADS_SEED = [];

function FinancialReportsContent() {
  const { leads: sharedLeads } = useAdminShellData();
  const leads = Array.isArray(sharedLeads) ? sharedLeads : INITIAL_LEADS_SEED;
  const [payments, setPayments] = useState([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('dubaiKharidPayments') || '[]');
      setPayments(Array.isArray(parsed) ? parsed : INITIAL_PAYMENTS_SEED);
    } catch {
      setPayments(INITIAL_PAYMENTS_SEED);
    }
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

  return (
    <>
      {(() => {
            const allPayments = getMergedPayments();

            // Overall statistics calculated dynamically
            const successfulIncomes = allPayments.filter(p => p.type === 'دریافتی' && p.status === 'success');
            const totalIncomes = successfulIncomes.reduce((sum, p) => sum + Math.abs(p.amount), 0);
            const totalOutgoings = allPayments.filter(p => p.type === 'پرداختی').reduce((sum, p) => sum + Math.abs(p.amount), 0);
            const netProfit = totalIncomes - totalOutgoings;
            const averageOrderVal = successfulIncomes.length > 0 ? Math.round(totalIncomes / successfulIncomes.length) : 0;

            // Shetab gateway share calculation
            const onlineIncome = successfulIncomes.filter(p => p.method === 'درگاه بانکی' || p.method === 'درگاه آنلاین').reduce((sum, p) => sum + Math.abs(p.amount), 0);
            const shetabShare = totalIncomes > 0 ? (onlineIncome / totalIncomes) * 100 : 0;

            // Expense breakdown dynamic calculation
            const expensePayments = allPayments.filter(p => p.type === 'پرداختی');
            const totalExp = expensePayments.reduce((sum, p) => sum + Math.abs(p.amount), 0);

            const supplyAmt = expensePayments.filter(p =>
              p.notes?.includes('خرید') || p.notes?.includes('تامین') || p.notes?.includes('کالا') || p.notes?.includes('لپتاپ') || p.notes?.includes('محصول') ||
              p.productName?.includes('خرید') || p.productName?.includes('تامین') || p.productName?.includes('کالا') || p.productName?.includes('لپتاپ')
            ).reduce((sum, p) => sum + Math.abs(p.amount), 0);

            const cargoAmt = expensePayments.filter(p =>
              p.notes?.includes('حمل') || p.notes?.includes('ترخیص') || p.notes?.includes('کارگو') || p.notes?.includes('ارسال') || p.notes?.includes('پست') ||
              p.productName?.includes('حمل') || p.productName?.includes('ترخیص') || p.productName?.includes('کارگو') || p.productName?.includes('ارسال')
            ).reduce((sum, p) => sum + Math.abs(p.amount), 0);

            const promoAmt = expensePayments.filter(p =>
              p.notes?.includes('تبلیغات') || p.notes?.includes('مارکتینگ') || p.notes?.includes('گوگل') || p.notes?.includes('اینستاگرام') ||
              p.productName?.includes('تبلیغات') || p.productName?.includes('مارکتینگ')
            ).reduce((sum, p) => sum + Math.abs(p.amount), 0);

            const officeAmt = totalExp - (supplyAmt + cargoAmt + promoAmt);

            const supplyPct = totalExp > 0 ? (supplyAmt / totalExp) * 100 : 0;
            const cargoPct = totalExp > 0 ? (cargoAmt / totalExp) * 100 : 0;
            const promoPct = totalExp > 0 ? (promoAmt / totalExp) * 100 : 0;
            const officePct = totalExp > 0 ? (officeAmt / totalExp) * 100 : 0;

            const grossMargin = totalIncomes > 0 ? (netProfit / totalIncomes) * 100 : 0;

            // Persian Date month-based grouping
            const getJalaliMonthName = (monthNum) => {
              const months = [
                'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
              ];
              return months[monthNum - 1] || '';
            };

            const getJalaliDateParts = (dStr) => {
              if (!dStr) return null;
              if (dStr.includes('/') && !dStr.includes('T')) {
                const parts = dStr.split(' ')[0].split('/');
                if (parts.length === 3) {
                  return {
                    y: parseInt(parts[0]),
                    m: parseInt(parts[1]),
                    d: parseInt(parts[2])
                  };
                }
              }
              try {
                const date = new Date(dStr);
                if (isNaN(date.getTime())) return null;
                const jalaliStr = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric'
                }).format(date);
                const parts = jalaliStr.split('/');
                if (parts.length === 3) {
                  return {
                    y: parseInt(parts[0]),
                    m: parseInt(parts[1]),
                    d: parseInt(parts[2])
                  };
                }
              } catch (e) {}
              return null;
            };

            const currentParts = getJalaliDateParts(new Date().toISOString()) || { y: 1403, m: 3, d: 15 };
            const curY = currentParts.y;
            const curM = currentParts.m;

            const monthsList = [];
            for (let i = 3; i >= 0; i--) {
              let m = curM - i;
              let y = curY;
              if (m <= 0) {
                m += 12;
                y -= 1;
              }
              monthsList.push({ y, m, name: `${getJalaliMonthName(m)} ${y}` });
            }

            const monthlyData = monthsList.map(item => {
              const monthPayments = allPayments.filter(p => {
                const parts = getJalaliDateParts(p.date || p.dateShipped);
                return parts && parts.y === item.y && parts.m === item.m;
              });

              const inc = monthPayments.filter(p => p.type === 'دریافتی' && p.status === 'success').reduce((sum, p) => sum + Math.abs(p.amount), 0);
              const exp = monthPayments.filter(p => p.type === 'پرداختی').reduce((sum, p) => sum + Math.abs(p.amount), 0);
              return {
                ...item,
                income: inc,
                expense: exp,
                profit: inc - exp
              };
            });

            // Trend visualization dataset (use fallback mock dataset if completely empty)
            const hasData = monthlyData.some(d => d.income > 0 || d.expense > 0);
            const finalMonthlyData = monthlyData;

            const maxVal = Math.max(
              ...finalMonthlyData.map(d => Math.max(d.income, d.expense)),
              10000000
            );

            const scaleY = (val) => {
              const share = val / maxVal;
              return 150 - (share * 120);
            };

            const getBarHeight = (val) => {
              const share = val / maxVal;
              return share * 120;
            };

            return (
              <div className={styles.finReportsResponsivePage}>
                {/* Header Title Row */}
                <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
                  <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#f87820', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.chart(28)}</span>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>گزارشات مالی</h1>
                      <p style={{ fontSize: '11.5px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>بررسی تراز مالی، سود ناخالص، هزینه‌های جاری و مخارج حمل و نقل</p>
                    </div>
                  </div>

                  <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => alert(`گزارش عملکرد مالی دوره ${monthsList[3].name} به صورت فایل PDF دانلود گردید.`)}
                      className={styles.advFilterBtn}
                      style={{ padding: '10px 15px', color: '#fff' }}
                    >
                      {AdminIcons.download(12)} خروجی PDF گزارش
                    </button>
                    <button
                      type="button"
                      onClick={() => window.location.assign('/admin/payments')}
                      className={styles.advFilterBtn}
                      style={{ padding: '10px 15px', color: '#fff' }}
                    >
                      {AdminIcons.card(12)} لیست تراکنش‌ها
                    </button>
                  </div>
                </div>

                {/* 4 financial KPI cards */}
                <div className={styles.finReportsMetricsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div className={styles.finReportsMetricCard}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>مجموع ورودی مالی (دریافتی)</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-vazirmatn)' }}>
                        {totalIncomes.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9px', color: '#10b981', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                        {shetabShare.toFixed(1)}٪ سهم درگاه شتاب
                      </span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#10b981' }}>{AdminIcons.trendingUp(24)}</span>
                  </div>

                  <div className={styles.finReportsMetricCard}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>کل هزینه‌های پرداختی (خروجی)</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#ef4444', fontFamily: 'var(--font-vazirmatn)' }}>
                        {totalOutgoings.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9px', color: '#ef4444', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                        {cargoPct.toFixed(1)}٪ بابت ترخیص و گمرک
                      </span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#ef4444' }}>{AdminIcons.trendingDown(24)}</span>
                  </div>

                  <div className={styles.finReportsMetricCard}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>سود خالص کل دوره</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6', fontFamily: 'var(--font-vazirmatn)' }}>
                        {netProfit.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9px', color: netProfit >= 0 ? '#10b981' : '#ef4444', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                        حاشیه سود خالص: {grossMargin.toFixed(1)}٪ {netProfit >= 0 ? '+' : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#f59e0b' }}>{AdminIcons.dollar(24)}</span>
                  </div>

                  <div className={styles.finReportsMetricCard}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>میانگین ارزش هر سفارش</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#ff9d00', fontFamily: 'var(--font-vazirmatn)' }}>
                        {averageOrderVal.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9px', color: '#8b92a5', display: 'block', marginTop: '4px' }}>محاسبه بر اساس کل خریدارها</span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#3b82f6' }}>{AdminIcons.cart(24)}</span>
                  </div>
                </div>

                {/* SVG Visual Charts Grid */}
                <div className={styles.finReportsGrid}>

                  {/* Monthly Trend bar chart */}
                  <div className={styles.finChartCard}>
                    <h3 className={styles.finChartTitle}>{AdminIcons.chart(16)} نمودار روند مقایسه‌ای جریان مالی ماهانه</h3>

                    <div style={{ height: '220px', position: 'relative' }}>
                      <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="40" y1="30" x2="390" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="70" x2="390" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="110" x2="390" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="150" x2="390" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                        {/* Y axis labels */}
                        <text x="5" y="34" fill="#6c7284" fontSize="8">{(maxVal / 1000000).toFixed(0)}M</text>
                        <text x="5" y="74" fill="#6c7284" fontSize="8">{((maxVal * 2/3) / 1000000).toFixed(0)}M</text>
                        <text x="5" y="114" fill="#6c7284" fontSize="8">{((maxVal * 1/3) / 1000000).toFixed(0)}M</text>
                        <text x="5" y="154" fill="#6c7284" fontSize="8">0</text>

                        {/* Month 1 */}
                        <rect x="70" y={scaleY(finalMonthlyData[0].income)} width="16" height={getBarHeight(finalMonthlyData[0].income)} fill="#10b981" rx="2" />
                        <rect x="90" y={scaleY(finalMonthlyData[0].expense)} width="16" height={getBarHeight(finalMonthlyData[0].expense)} fill="#ef4444" rx="2" />

                        {/* Month 2 */}
                        <rect x="150" y={scaleY(finalMonthlyData[1].income)} width="16" height={getBarHeight(finalMonthlyData[1].income)} fill="#10b981" rx="2" />
                        <rect x="170" y={scaleY(finalMonthlyData[1].expense)} width="16" height={getBarHeight(finalMonthlyData[1].expense)} fill="#ef4444" rx="2" />

                        {/* Month 3 */}
                        <rect x="230" y={scaleY(finalMonthlyData[2].income)} width="16" height={getBarHeight(finalMonthlyData[2].income)} fill="#10b981" rx="2" />
                        <rect x="250" y={scaleY(finalMonthlyData[2].expense)} width="16" height={getBarHeight(finalMonthlyData[2].expense)} fill="#ef4444" rx="2" />

                        {/* Month 4 */}
                        <rect x="310" y={scaleY(finalMonthlyData[3].income)} width="16" height={getBarHeight(finalMonthlyData[3].income)} fill="#10b981" rx="2" />
                        <rect x="330" y={scaleY(finalMonthlyData[3].expense)} width="16" height={getBarHeight(finalMonthlyData[3].expense)} fill="#ef4444" rx="2" />

                        {/* Profit trend line overlay */}
                        <path d={`M 88 ${scaleY(finalMonthlyData[0].profit)} L 168 ${scaleY(finalMonthlyData[1].profit)} L 248 ${scaleY(finalMonthlyData[2].profit)} L 328 ${scaleY(finalMonthlyData[3].profit)}`} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="88" cy={scaleY(finalMonthlyData[0].profit)} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx="168" cy={scaleY(finalMonthlyData[1].profit)} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx="248" cy={scaleY(finalMonthlyData[2].profit)} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx="328" cy={scaleY(finalMonthlyData[3].profit)} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                      </svg>
                    </div>

                    {/* X axis labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', paddingLeft: '40px', marginTop: '8px', fontSize: '10px', color: '#8b92a5' }}>
                      <span>{finalMonthlyData[0].name}</span>
                      <span>{finalMonthlyData[1].name}</span>
                      <span>{finalMonthlyData[2].name}</span>
                      <span>{finalMonthlyData[3].name}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#c4c8d4' }}>
                        <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }} /> دریافتی
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#c4c8d4' }}>
                        <span style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '2px' }} /> پرداختی
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#c4c8d4' }}>
                        <span style={{ width: '10px', height: '2px', backgroundColor: '#3b82f6', display: 'inline-block' }} /> خط سود خالص
                      </span>
                    </div>
                  </div>

                  {/* Expense categories breakdown */}
                  <div className={styles.finChartCard}>
                    <h3 className={styles.finChartTitle}>{AdminIcons.bag(16)} تفکیک مخارج کارگو و شرکت</h3>

                    <div className={styles.finBreakdownList}>
                      {/* Cost 1 */}
                      <div className={styles.finBreakdownItem}>
                        <div className={styles.finBreakdownHeader}>
                          <span className={styles.finBreakdownName}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f87820' }} /> تامین کالا و خرید
                          </span>
                          <span className={styles.finBreakdownVal}>{supplyPct.toFixed(0)}٪</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div className={styles.progressBarFill} style={{ width: `${supplyPct}%`, backgroundColor: '#f87820' }} />
                        </div>
                      </div>

                      {/* Cost 2 */}
                      <div className={styles.finBreakdownItem}>
                        <div className={styles.finBreakdownHeader}>
                          <span className={styles.finBreakdownName}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} /> حمل و نقل و ترخیص (کارگو)
                          </span>
                          <span className={styles.finBreakdownVal}>{cargoPct.toFixed(0)}٪</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div className={styles.progressBarFill} style={{ width: `${cargoPct}%`, backgroundColor: '#10b981' }} />
                        </div>
                      </div>

                      {/* Cost 3 */}
                      <div className={styles.finBreakdownItem}>
                        <div className={styles.finBreakdownHeader}>
                          <span className={styles.finBreakdownName}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} /> ملزومات اداری و دفتری
                          </span>
                          <span className={styles.finBreakdownVal}>{officePct.toFixed(0)}٪</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div className={styles.progressBarFill} style={{ width: `${officePct}%`, backgroundColor: '#3b82f6' }} />
                        </div>
                      </div>

                      {/* Cost 4 */}
                      <div className={styles.finBreakdownItem}>
                        <div className={styles.finBreakdownHeader}>
                          <span className={styles.finBreakdownName}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }} /> تبلیغات و مارکتینگ
                          </span>
                          <span className={styles.finBreakdownVal}>{promoPct.toFixed(0)}٪</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div className={styles.progressBarFill} style={{ width: `${promoPct}%`, backgroundColor: '#a855f7' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Periodic Summary Table */}
                <div style={{ marginTop: '24px', background: '#11131a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>تراز عملکرد دوره‌های مالی</h3>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          <th>دوره مالی</th>
                          <th>مجموع ورودی (دریافتی)</th>
                          <th>مجموع خروجی (پرداختی)</th>
                          <th>سود ناخالص</th>
                          <th>وضعیت دوره</th>
                          <th>گزارشات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...monthlyData].reverse().map((mItem, idx) => {
                          const isCurrent = idx === 0;
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: 'bold', color: '#fff' }}>{mItem.name} {isCurrent ? '(جاری)' : ''}</td>
                              <td style={{ color: '#10b981', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>
                                {mItem.income.toLocaleString('fa-IR')} تومان
                              </td>
                              <td style={{ color: '#ef4444', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>
                                {mItem.expense.toLocaleString('fa-IR')} تومان
                              </td>
                              <td style={{ color: mItem.profit >= 0 ? '#3b82f6' : '#ef4444', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>
                                {mItem.profit.toLocaleString('fa-IR')} تومان
                              </td>
                              <td>
                                <span style={{
                                  backgroundColor: isCurrent ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                  color: isCurrent ? '#f59e0b' : '#10b981',
                                  fontSize: '9px',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {isCurrent ? 'در حال محاسبه' : 'بسته شده'}
                                </span>
                              </td>
                              <td>
                                <span onClick={() => alert(`گزارش کامل ${mItem.name} دانلود شد.`)} className={styles.downloadActionLink} style={{ fontSize: '11.5px' }}>
                                  {AdminIcons.download(11)} دانلود گزارش (CSV)
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            );
          })()}
    </>
  );
}

export default function FinancialReportsPage() {
  return (
    <AdminShell activeTab="financial_reports">
      <FinancialReportsContent />
    </AdminShell>
  );
}
