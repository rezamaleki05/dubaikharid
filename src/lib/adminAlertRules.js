export const ACTIONABLE_ORDER_STATUSES = Object.freeze(['pending', 'pricing']);
export const ACTIONABLE_PURCHASE_REQUEST_STATUSES = Object.freeze(['pending']);
export const ACTIONABLE_SHIPMENT_STATUSES = Object.freeze(['PENDING', 'READY', 'FAILED']);

export function normalizeAlertCount(value) {
  const count = Number(value);
  return Number.isSafeInteger(count) && count > 0 ? count : 0;
}

export function buildAdminAlertCounts(raw = {}) {
  const counts = {
    orders: normalizeAlertCount(raw.orders),
    purchaseRequests: normalizeAlertCount(raw.purchaseRequests),
    payments: normalizeAlertCount(raw.payments),
    inventory: normalizeAlertCount(raw.inventory),
    shipments: normalizeAlertCount(raw.shipments),
  };
  return { ...counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
}

export function shouldRenderAdminBadge(count) {
  return normalizeAlertCount(count) > 0;
}

export function buildAdminAlertItems(counts) {
  return [
    { key: 'purchaseRequests', label: 'درخواست خرید جدید', description: 'درخواست منتظر بررسی و قیمت‌گذاری', href: '/admin/leads?status=pending' },
    { key: 'orders', label: 'سفارش جدید', description: 'سفارش نیازمند بررسی مدیر', href: '/admin/orders?status=pending' },
    { key: 'payments', label: 'پرداخت در انتظار بررسی', description: 'رسید یا واریز بانکی نیازمند بررسی', href: '/admin/payments?status=pending' },
    { key: 'shipments', label: 'ارسال نیازمند اقدام', description: 'مرسوله آماده اقدام یا دارای مشکل', href: '/admin/shipments' },
    { key: 'inventory', label: 'موجودی نیازمند اقدام', description: 'تنوع محصول با موجودی قابل‌فروش کمتر یا مساوی حداقل', href: '/admin/inventory' },
  ].flatMap(item => counts[item.key] > 0 ? [{ ...item, count: counts[item.key] }] : []);
}
