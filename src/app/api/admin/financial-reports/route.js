import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { getFinancialReport, validateFinancialReportQuery } from '@/lib/adminReporting';

export const dynamic = 'force-dynamic';

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function financialCsv(report) {
  const dataRows = report.filters.startDate
    ? [[
        `${report.filters.startDate} تا ${report.filters.endDate}`,
        report.summary.grossRevenue,
        report.summary.refunds,
        report.summary.netRevenue,
        report.summary.netExpenses,
        report.summary.netCashFlow,
      ]]
    : report.monthly.map(row => [row.name, row.grossRevenue, row.refunds, row.netRevenue, row.netExpenses, row.netCashFlow]);
  const rows = [
    ['دوره مالی', 'درآمد ناخالص', 'بازپرداخت', 'درآمد خالص', 'هزینه خالص', 'جریان خالص مالی'],
    ...dataRows,
  ];
  return `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`;
}

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.FINANCIAL_REPORTS_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const allowed = new Set(['startDate', 'endDate', 'groupBy', 'format']);
  if ([...searchParams.keys()].some(key => !allowed.has(key))) {
    return NextResponse.json({ error: 'پارامتر گزارش معتبر نیست.' }, { status: 400 });
  }
  const format = searchParams.get('format') || 'json';
  if (!['json', 'csv'].includes(format)) {
    return NextResponse.json({ error: 'فرمت گزارش معتبر نیست.' }, { status: 400 });
  }
  const query = validateFinancialReportQuery(searchParams);
  if (query.error) return NextResponse.json({ error: query.error }, { status: 400 });

  try {
    const report = await getFinancialReport(query);
    if (format === 'csv') {
      return new Response(financialCsv(report), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="financial-report.csv"',
          'Cache-Control': 'private, no-store',
        },
      });
    }
    return NextResponse.json(report, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error?.message === 'INVALID_DATE_RANGE') {
      return NextResponse.json({ error: 'بازه تاریخ گزارش معتبر نیست.' }, { status: 400 });
    }
    console.error('Error fetching admin financial report:', error);
    return NextResponse.json({ error: 'دریافت گزارش مالی با خطا مواجه شد.' }, { status: 500 });
  }
}
