'use client';

import React, { useEffect, useState } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';

const EMPTY_REPORT = Object.freeze({
  summary: {
    netRevenue: '0', netExpenses: '0', netCashFlow: '0', averageOrderValue: '0',
    onlineShare: 0, netMargin: 0,
  },
  expenses: {
    supply: { percentage: 0 }, cargo: { percentage: 0 },
    promotion: { percentage: 0 }, office: { percentage: 0 },
  },
  monthly: Array.from({ length: 4 }, (_, index) => ({ key: String(index), name: 'بدون داده', netRevenue: '0', netExpenses: '0', netCashFlow: '0' })),
});

function formatAmount(value) {
  try { return BigInt(String(value || '0')).toLocaleString('fa-IR'); } catch { return '۰'; }
}

function chartNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function downloadMonthCsv(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  const endDate = new Date(next.getTime() - 86_400_000).toISOString().slice(0, 10);
  window.location.assign(`/api/admin/financial-reports?startDate=${monthKey}-01&endDate=${endDate}&format=csv`);
}

function FinancialReportsContent() {
  const [report, setReport] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/financial-reports', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'دریافت گزارش مالی ناموفق بود.');
        setReport(body);
      })
      .catch(fetchError => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) return <div className={styles.cardPanel} style={{ padding: '24px', color: '#8b92a5' }}>در حال بارگذاری گزارش مالی...</div>;
  if (error) return <div className={styles.cardPanel} style={{ padding: '24px', color: '#ef4444' }}>{error}</div>;

  return (
    <>
      {(() => {
            const totalIncomes = report.summary.netRevenue;
            const totalOutgoings = report.summary.netExpenses;
            const netProfit = report.summary.netCashFlow;
            const averageOrderVal = report.summary.averageOrderValue;
            const shetabShare = report.summary.onlineShare;
            const supplyPct = report.expenses.supply.percentage;
            const cargoPct = report.expenses.cargo.percentage;
            const promoPct = report.expenses.promotion.percentage;
            const officePct = report.expenses.office.percentage;
            const grossMargin = report.summary.netMargin;
            const monthlyData = report.monthly.map(item => ({
              ...item,
              income: chartNumber(item.netRevenue),
              expense: chartNumber(item.netExpenses),
              profit: chartNumber(item.netCashFlow),
            }));
            const finalMonthlyData = monthlyData;

            const maxVal = Math.max(
              ...finalMonthlyData.map(d => Math.max(d.income, d.expense)),
              1
            );

            const scaleY = (val) => {
              const share = Math.max(0, Math.min(1, val / maxVal));
              return 150 - (share * 120);
            };

            const getBarHeight = (val) => {
              const share = Math.max(0, Math.min(1, val / maxVal));
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
                      onClick={() => window.print()} 
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
                        {formatAmount(totalIncomes)}
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
                        {formatAmount(totalOutgoings)}
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
                        {formatAmount(netProfit)}
                      </span>
                      <span style={{ fontSize: '9px', color: BigInt(netProfit || '0') >= 0n ? '#10b981' : '#ef4444', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                        حاشیه سود خالص: {grossMargin.toFixed(1)}٪ {BigInt(netProfit || '0') >= 0n ? '+' : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#f59e0b' }}>{AdminIcons.dollar(24)}</span>
                  </div>

                  <div className={styles.finReportsMetricCard}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>میانگین ارزش هر سفارش</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#ff9d00', fontFamily: 'var(--font-vazirmatn)' }}>
                        {formatAmount(averageOrderVal)}
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
                                {formatAmount(mItem.netRevenue)} تومان
                              </td>
                              <td style={{ color: '#ef4444', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>
                                {formatAmount(mItem.netExpenses)} تومان
                              </td>
                              <td style={{ color: BigInt(mItem.netCashFlow || '0') >= 0n ? '#3b82f6' : '#ef4444', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>
                                {formatAmount(mItem.netCashFlow)} تومان
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
                                <span onClick={() => downloadMonthCsv(mItem.key)} className={styles.downloadActionLink} style={{ fontSize: '11.5px' }}>
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
