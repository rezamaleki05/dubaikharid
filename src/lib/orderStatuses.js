export const ORDER_STATUS_DEFINITIONS = Object.freeze([
  { value: 'pending', label: 'در انتظار بررسی', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'pricing', label: 'در حال قیمت‌گذاری', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { value: 'paid', label: 'پرداخت‌شده', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { value: 'processing', label: 'در حال پردازش', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'purchased', label: 'در روند دبی', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  { value: 'warehouse_dubai', label: 'انبار دبی', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { value: 'shipped', label: 'ارسال‌شده', color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
  { value: 'delivered', label: 'تحویل‌شده', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { value: 'cancelled', label: 'لغوشده', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
]);

export const ORDER_STATUSES = Object.freeze(ORDER_STATUS_DEFINITIONS.map(item => item.value));
export const ORDER_STATUS_SET = new Set(ORDER_STATUSES);
export const ORDER_STATUS_BY_VALUE = Object.freeze(Object.fromEntries(
  ORDER_STATUS_DEFINITIONS.map(item => [item.value, item]),
));

export const ORDER_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['paid', 'cancelled']),
  pricing: Object.freeze(['paid', 'cancelled']),
  paid: Object.freeze(['processing', 'cancelled']),
  processing: Object.freeze(['purchased', 'cancelled']),
  purchased: Object.freeze(['warehouse_dubai', 'cancelled']),
  warehouse_dubai: Object.freeze(['shipped', 'cancelled']),
  shipped: Object.freeze(['delivered']),
  delivered: Object.freeze([]),
  cancelled: Object.freeze([]),
});

export function canTransitionOrder(previous, next) {
  return previous === next || ORDER_TRANSITIONS[previous]?.includes(next) || false;
}

export function getOrderStatusMeta(status) {
  return ORDER_STATUS_BY_VALUE[status] || {
    value: status,
    label: status || 'نامشخص',
    color: '#9ca3af',
    bg: 'rgba(156,163,175,0.12)',
  };
}

export function getAvailableOrderStatusOptions(currentStatus) {
  const allowed = new Set([currentStatus, ...(ORDER_TRANSITIONS[currentStatus] || [])]);
  return ORDER_STATUS_DEFINITIONS.filter(item => allowed.has(item.value));
}
