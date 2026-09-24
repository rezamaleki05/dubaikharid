'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import styles from './Inventory.module.css';

const EMPTY_METRICS = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, reserved: 0, uninitialized: 0, attention: 0 };
const EMPTY_FILTERS = { brands: [], categories: [], products: [], locations: [] };
const STATUS_LABELS = {
  IN_STOCK: 'موجود', LOW_STOCK: 'کم‌موجود', OUT_OF_STOCK: 'ناموجود', UNINITIALIZED: 'تنظیم نشده',
};
const STATUS_CLASSES = { IN_STOCK: styles.inStock, LOW_STOCK: styles.lowStock, OUT_OF_STOCK: styles.outOfStock, UNINITIALIZED: styles.uninitialized };
const REASONS = [
  ['NEW_PURCHASE', 'خرید جدید'], ['COUNT_CORRECTION', 'اصلاح شمارش'], ['RETURNED', 'مرجوعی'],
  ['DAMAGED', 'آسیب‌دیده'], ['MANUAL_CORRECTION', 'اصلاح دستی'], ['STOCK_TRANSFER', 'انتقال موجودی'],
];
const MOVEMENT_LABELS = {
  STOCK_IN: 'ورود موجودی', STOCK_OUT: 'خروج موجودی', ADJUSTMENT: 'اصلاح موجودی',
  ORDER_RESERVATION: 'رزرو سفارش', ORDER_RELEASE: 'آزادسازی رزرو', ORDER_FULFILLMENT: 'نهایی‌سازی سفارش', RETURN: 'مرجوعی',
};
const RESERVATION_LABELS = { ACTIVE: 'فعال', RELEASED: 'آزادشده', FULFILLED: 'نهایی‌شده' };

function movementDeltaLabel(item) {
  if (item.stockAfter !== item.stockBefore) {
    const delta = item.stockAfter - item.stockBefore;
    return delta > 0 ? `+${delta}` : String(delta);
  }
  const reservedDelta = item.reservedAfter - item.reservedBefore;
  if (reservedDelta) return `R ${reservedDelta > 0 ? '+' : ''}${reservedDelta}`;
  return '—';
}

async function readApi(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'عملیات موجودی انجام نشد.');
  return payload;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function StatusBadge({ row }) {
  return <div><span className={`${styles.status} ${STATUS_CLASSES[row.status]}`}>{STATUS_LABELS[row.status]}</span>{row.reserved && <span className={styles.reserveFlag}>رزرو فعال</span>}</div>;
}

function ProductIdentity({ row }) {
  return <div className={styles.productCell}>
    {row.coverImage
      ? <>
        {/* Product images can be approved external URLs, so a broad next/image allowlist is intentionally avoided. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.thumb} src={row.coverImage} alt="" width="42" height="42" />
      </>
      : <span className={`${styles.thumb} ${styles.thumbFallback}`} aria-hidden="true">◇</span>}
    <div className={styles.productText}><strong>{row.productNameFa || row.productNameEn}</strong><span>{row.productNameEn || '—'}</span></div>
  </div>;
}

function RowActions({ row, canEdit, openDialog }) {
  return <div className={styles.actions}>
    {row.inventory ? <>
      {canEdit && <button type="button" className={styles.primaryAction} disabled={!row.isActive} onClick={() => openDialog('adjust', row)}>تنظیم موجودی</button>}
      {canEdit && <button type="button" className={styles.action} onClick={() => openDialog('config', row)}>تنظیمات</button>}
      <button type="button" className={styles.action} onClick={() => openDialog('history', row)}>تاریخچه</button>
    </> : canEdit ? <button type="button" className={styles.primaryAction} disabled={!row.isActive} onClick={() => openDialog('initialize', row)}>مقداردهی موجودی</button> : null}
  </div>;
}

function InventoryDialog({ state, onClose, onSaved }) {
  const row = state?.row;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);
  const [historyTab, setHistoryTab] = useState('movements');
  const historyRequest = useRef(null);
  const [form, setForm] = useState(() => state?.type === 'adjust'
    ? { mode: 'ADD', value: '', reasonCode: 'NEW_PURCHASE', note: '', idempotencyKey: crypto.randomUUID() }
    : state?.type === 'config'
      ? { minStock: String(row.inventory.minStock), location: row.inventory.location || '' }
      : { stock: '0', minStock: '0', location: '' });

  useEffect(() => {
    if (state?.type !== 'history') return;
    let active = true;
    historyRequest.current ||= fetch(`/api/admin/inventory/${encodeURIComponent(row.productVariantId)}/history`, { cache: 'no-store' })
      .then(readApi);
    historyRequest.current
      .then(payload => { if (active) setHistory(payload); })
      .catch(cause => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [row?.productVariantId, state?.type]);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (state.type === 'adjust') {
        await readApi(await fetch(`/api/admin/inventory/${encodeURIComponent(row.productVariantId)}/adjust`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, value: Number(form.value) }),
        }));
      } else if (state.type === 'config') {
        await readApi(await fetch(`/api/admin/inventory/${encodeURIComponent(row.productVariantId)}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ minStock: Number(form.minStock), location: form.location }),
        }));
      } else {
        await readApi(await fetch(`/api/admin/product-variants/${encodeURIComponent(row.productVariantId)}/inventory`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: Number(form.stock), minStock: Number(form.minStock), location: form.location }),
        }));
      }
      await onSaved();
      onClose();
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  const title = state.type === 'adjust' ? 'تنظیم موجودی فیزیکی' : state.type === 'config' ? 'تنظیمات نگهداری' : state.type === 'initialize' ? 'مقداردهی موجودی' : 'تاریخچه موجودی';
  return <div className={styles.overlay} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`${styles.dialog} ${state.type === 'history' ? styles.dialogWide : ''}`} role="dialog" aria-modal="true" aria-labelledby="inventory-dialog-title">
      <header className={styles.dialogHeader}><div><h2 id="inventory-dialog-title">{title}</h2><p>{row.productNameFa} · {row.variantLabel}</p></div><button type="button" className={styles.close} onClick={onClose} aria-label="بستن">×</button></header>
      <div className={styles.dialogBody}>
        {row.inventory && state.type !== 'config' && <div className={styles.currentStrip}>
          <div><span>موجودی فیزیکی</span><strong>{row.inventory.stock}</strong></div>
          <div><span>رزرو</span><strong>{row.inventory.reserved}</strong></div>
          <div><span>قابل فروش</span><strong>{row.inventory.available}</strong></div>
        </div>}
        {error && <p className={styles.formError} role="alert">{error}</p>}
        {state.type === 'history' ? <>
          <div className={styles.tabs} role="tablist">
            <button type="button" className={`${styles.tab} ${historyTab === 'movements' ? styles.tabActive : ''}`} onClick={() => setHistoryTab('movements')}>حرکت‌ها ({history?.movements?.length || 0})</button>
            <button type="button" className={`${styles.tab} ${historyTab === 'reservations' ? styles.tabActive : ''}`} onClick={() => setHistoryTab('reservations')}>رزروها ({history?.reservations?.length || 0})</button>
          </div>
          {!history && !error ? <div className={styles.loading}>در حال دریافت تاریخچه…</div> : historyTab === 'movements' ? <div className={styles.historyList}>
            {history?.movements?.map(item => <div className={styles.historyItem} key={item.id}>
              <div><span className={styles.historyType}>{MOVEMENT_LABELS[item.type] || item.type}</span><div className={styles.historyMeta}>{formatDate(item.createdAt)}</div></div>
              <div className={styles.historyMeta}>{item.stockBefore} → {item.stockAfter} · رزرو {item.reservedBefore} → {item.reservedAfter}<br />{item.reason || 'بدون توضیح'}{item.admin?.email ? ` · ${item.admin.email}` : ''}{item.order?.orderCode ? ` · سفارش ${item.order.orderCode}` : ''}</div>
              <strong className={`${styles.historyDelta} ${item.stockAfter > item.stockBefore || item.reservedAfter > item.reservedBefore ? styles.positive : item.stockAfter < item.stockBefore || item.reservedAfter < item.reservedBefore ? styles.negative : ''}`}>{movementDeltaLabel(item)}</strong>
            </div>)}
            {history && !history.movements.length && <div className={styles.empty}>حرکتی ثبت نشده است.</div>}
          </div> : <div className={styles.historyList}>
            {history?.reservations?.map(item => <div className={styles.historyItem} key={item.id}>
              <div><span className={styles.historyType}>{RESERVATION_LABELS[item.status] || item.status}</span><div className={styles.historyMeta}>{formatDate(item.createdAt)}</div></div>
              <div className={styles.historyMeta}>{item.order?.orderCode ? `سفارش ${item.order.orderCode}` : item.reservationKey}<br />انقضا: {formatDate(item.expiresAt)}</div><strong className={styles.historyDelta}>{item.quantity}</strong>
            </div>)}
            {history && !history.reservations.length && <div className={styles.empty}>رزروی ثبت نشده است.</div>}
          </div>}
        </> : <form className={styles.form} onSubmit={submit}>
          {state.type === 'adjust' && <>
            <div className={styles.formRow}><label>روش تنظیم<select value={form.mode} onChange={event => setForm({ ...form, mode: event.target.value })}><option value="ADD">افزایش موجودی</option><option value="REMOVE">کاهش موجودی</option><option value="SET">تعیین موجودی فیزیکی</option></select></label><label>{form.mode === 'SET' ? 'موجودی نهایی' : 'تعداد'}<input type="number" min={form.mode === 'SET' ? 0 : 1} step="1" required value={form.value} onChange={event => setForm({ ...form, value: event.target.value })} /></label></div>
            <label>دلیل تغییر<select value={form.reasonCode} onChange={event => setForm({ ...form, reasonCode: event.target.value })}>{REASONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>یادداشت مدیر (اختیاری)<textarea maxLength="500" value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} placeholder="مثال: شمارش فیزیکی امروز" /></label>
            <p className={styles.hint}>موجودی رزروشده فقط از چرخه سفارش تغییر می‌کند. تنظیم موجودی کمتر از رزرو رد می‌شود.</p>
          </>}
          {state.type === 'config' && <div className={styles.formRow}><label>حداقل موجودی<input type="number" min="0" step="1" required value={form.minStock} onChange={event => setForm({ ...form, minStock: event.target.value })} /></label><label>محل نگهداری<input maxLength="200" value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} placeholder="انبار ۱ / قفسه B" /></label></div>}
          {state.type === 'initialize' && <><div className={styles.formRow}><label>موجودی اولیه<input type="number" min="0" step="1" required value={form.stock} onChange={event => setForm({ ...form, stock: event.target.value })} /></label><label>حداقل موجودی<input type="number" min="0" step="1" required value={form.minStock} onChange={event => setForm({ ...form, minStock: event.target.value })} /></label></div><label>محل نگهداری<input maxLength="200" value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} /></label></>}
          <div className={styles.dialogFooter}><button type="button" className={styles.action} onClick={onClose}>انصراف</button><button type="submit" className={styles.primaryAction} disabled={busy}>{busy ? 'در حال ثبت…' : 'ثبت ایمن'}</button></div>
        </form>}
      </div>
    </section>
  </div>;
}

export default function AdminInventoryPage() {
  const { can } = useAdminAccess();
  const canEdit = can(ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  const [rows, setRows] = useState([]);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTERS);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', categoryId: '', brandId: '', status: '', location: '', productId: '', sort: 'attention', limit: '25' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: filters.limit, sort: filters.sort });
    Object.entries(filters).forEach(([key, value]) => { if (!['limit', 'sort'].includes(key) && value) params.set(key, value); });
    return params.toString();
  }, [filters, page]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const payload = await readApi(await fetch(`/api/admin/inventory?${query}`, { cache: 'no-store' }));
      setRows(payload.data || []); setMetrics(payload.metrics || EMPTY_METRICS); setFilterOptions(payload.filters || EMPTY_FILTERS); setPagination(payload.pagination);
    } catch (cause) { setError(cause.message); setRows([]); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { const timer = setTimeout(load, 220); return () => clearTimeout(timer); }, [load]);
  const updateFilter = (key, value) => { setPage(1); setFilters(current => ({ ...current, [key]: value })); };
  const openDialog = (type, row) => setDialog({ type, row, key: `${type}:${row.productVariantId}` });

  const metricItems = [
    ['total', 'کل تنوع‌ها', metrics.total, '', ''],
    ['IN_STOCK', 'موجود', metrics.inStock, styles.metricGood, 'IN_STOCK'],
    ['LOW_STOCK', 'کم‌موجود', metrics.lowStock, styles.metricWarning, 'LOW_STOCK'],
    ['OUT_OF_STOCK', 'ناموجود', metrics.outOfStock, styles.metricDanger, 'OUT_OF_STOCK'],
    ['reserved', 'دارای رزرو', metrics.reserved, styles.metricReserved, 'RESERVED'],
    ['attention', 'نیازمند توجه', metrics.attention, styles.metricWarning, 'ATTENTION'],
  ];

  return <AdminShell activeTab="inventory">
    <main className={styles.page}>
      <header className={styles.heading}><div><p className={styles.eyebrow}>PRODUCT OPERATIONS</p><h1>موجودی محصولات</h1><p>نمای مرکزی موجودی تنوع‌های موجود در ایران</p></div><span className={styles.liveMark}>متصل به موجودی عملیاتی</span></header>
      <section className={styles.metrics} aria-label="خلاصه موجودی">{metricItems.map(([key, label, value, tone, status]) => <button type="button" key={key} className={`${styles.metric} ${tone} ${filters.status === status && status ? styles.metricActive : ''}`} onClick={() => updateFilter('status', status)}><span>{label}</span><strong>{value}</strong></button>)}</section>
      <section className={styles.filters} aria-label="فیلترهای موجودی">
        <input className={styles.search} value={filters.search} onChange={event => updateFilter('search', event.target.value)} placeholder="جستجوی نام فارسی/انگلیسی، SKU یا گزینه تنوع…" />
        <select className={styles.field} value={filters.status} onChange={event => updateFilter('status', event.target.value)}><option value="">همه وضعیت‌ها</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}<option value="RESERVED">دارای رزرو</option><option value="ATTENTION">نیازمند توجه</option></select>
        <select className={styles.field} value={filters.categoryId} onChange={event => updateFilter('categoryId', event.target.value)}><option value="">همه دسته‌ها</option>{filterOptions.categories.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
        <select className={styles.field} value={filters.brandId} onChange={event => updateFilter('brandId', event.target.value)}><option value="">همه برندها</option>{filterOptions.brands.map(item => <option value={item.id} key={item.id}>{item.faName || item.name}</option>)}</select>
        <select className={styles.field} value={filters.productId} onChange={event => updateFilter('productId', event.target.value)}><option value="">همه محصولات</option>{filterOptions.products.map(item => <option value={item.id} key={item.id}>{item.nameFa || item.nameEn}</option>)}</select>
        <select className={styles.field} value={filters.location} onChange={event => updateFilter('location', event.target.value)}><option value="">همه محل‌ها</option>{filterOptions.locations.map(item => <option value={item} key={item}>{item}</option>)}</select>
        <select className={styles.field} value={filters.sort} onChange={event => updateFilter('sort', event.target.value)}><option value="attention">نیازمند توجه</option><option value="available_asc">قابل فروش: کم به زیاد</option><option value="available_desc">قابل فروش: زیاد به کم</option><option value="stock_desc">موجودی فیزیکی</option><option value="reserved_desc">رزرو</option><option value="updated_desc">آخرین تغییر</option><option value="product_asc">نام محصول</option></select>
      </section>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <section className={styles.listFrame}>
        {loading ? <div className={styles.loading}>در حال بازیابی موجودی…</div> : rows.length ? <>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>محصول</th><th>تنوع</th><th>SKU</th><th>دسته</th><th>برند</th><th>فیزیکی</th><th>رزرو</th><th>قابل فروش</th><th>حداقل</th><th>وضعیت</th><th>محل</th><th>به‌روزرسانی</th><th>عملیات</th></tr></thead><tbody>{rows.map(row => <tr key={row.productVariantId}><td><ProductIdentity row={row} /></td><td className={styles.variant}>{row.variantLabel}</td><td dir="ltr" className={styles.muted}>{row.sku || '—'}</td><td>{row.category?.name || '—'}</td><td>{row.brand?.faName || row.brand?.name || '—'}</td><td className={styles.number}>{row.inventory?.stock ?? '—'}</td><td className={`${styles.number} ${styles.reservedNumber}`}>{row.inventory?.reserved ?? '—'}</td><td className={styles.number}>{row.inventory?.available ?? '—'}</td><td className={styles.number}>{row.inventory?.minStock ?? '—'}</td><td><StatusBadge row={row} /></td><td>{row.inventory?.location || '—'}</td><td className={styles.muted}>{formatDate(row.inventory?.updatedAt)}</td><td><RowActions row={row} canEdit={canEdit} openDialog={openDialog} /></td></tr>)}</tbody></table></div>
          <div className={styles.mobileList}>{rows.map(row => <article className={styles.card} key={row.productVariantId}><div className={styles.cardTop}><ProductIdentity row={row} /><StatusBadge row={row} /></div><p className={styles.cardVariant}>{row.variantLabel} <span className={styles.muted} dir="ltr">· {row.sku || 'SKU —'}</span></p><div className={styles.cardNumbers}><div><span>فیزیکی</span><strong>{row.inventory?.stock ?? '—'}</strong></div><div><span>رزرو</span><strong>{row.inventory?.reserved ?? '—'}</strong></div><div><span>قابل فروش</span><strong>{row.inventory?.available ?? '—'}</strong></div><div><span>حداقل</span><strong>{row.inventory?.minStock ?? '—'}</strong></div></div><div className={styles.cardMeta}><span>{row.category?.name || 'بدون دسته'} · {row.brand?.faName || row.brand?.name || 'بدون برند'}</span><span>{row.inventory?.location || 'محل ثبت نشده'}</span></div><RowActions row={row} canEdit={canEdit} openDialog={openDialog} /></article>)}</div>
        </> : <div className={styles.empty}>تنوعی با این فیلترها پیدا نشد.</div>}
        <footer className={styles.pagination}><span>{pagination.total} تنوع · صفحه {pagination.page} از {pagination.totalPages}</span><div className={styles.paginationControls}><select className={styles.field} value={filters.limit} onChange={event => updateFilter('limit', event.target.value)} aria-label="تعداد ردیف"><option value="25">۲۵ ردیف</option><option value="50">۵۰ ردیف</option></select><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}>قبلی</button><button type="button" disabled={page >= pagination.totalPages || loading} onClick={() => setPage(value => value + 1)}>بعدی</button></div></footer>
      </section>
      {dialog && <InventoryDialog key={dialog.key} state={dialog} onClose={() => setDialog(null)} onSaved={load} />}
    </main>
  </AdminShell>;
}
