export const ADMIN_INVENTORY_STATUSES = Object.freeze([
  'IN_STOCK',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'UNINITIALIZED',
  'RESERVED',
  'ATTENTION',
]);

export const ADMIN_INVENTORY_SORTS = Object.freeze([
  'attention',
  'available_asc',
  'available_desc',
  'stock_desc',
  'reserved_desc',
  'updated_desc',
  'product_asc',
]);

export const ADMIN_INVENTORY_ADJUSTMENT_REASONS = Object.freeze({
  NEW_PURCHASE: 'خرید جدید',
  COUNT_CORRECTION: 'اصلاح شمارش',
  RETURNED: 'مرجوعی',
  DAMAGED: 'آسیب‌دیده',
  MANUAL_CORRECTION: 'اصلاح دستی',
  STOCK_TRANSFER: 'انتقال موجودی',
});

const ADJUSTMENT_MODES = new Set(['ADD', 'REMOVE', 'SET']);

export function deriveAdminInventoryStatus(inventory) {
  if (!inventory) return 'UNINITIALIZED';
  const available = Number(inventory.stock) - Number(inventory.reserved);
  if (available <= 0) return 'OUT_OF_STOCK';
  if (available <= Number(inventory.minStock)) return 'LOW_STOCK';
  return 'IN_STOCK';
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizedText(value, maximum) {
  if (value === null || value === undefined || value === '') return { value: null };
  if (typeof value !== 'string') return { error: 'مقدار متنی معتبر نیست.' };
  const text = value.trim();
  if (!text) return { value: null };
  if (text.length > maximum) return { error: 'مقدار متنی بیش از حد مجاز است.' };
  return { value: text };
}

export function validateAdminInventoryAdjustment(body) {
  const allowed = new Set(['mode', 'value', 'reasonCode', 'note', 'idempotencyKey']);
  if (!isPlainObject(body) || Object.keys(body).some(key => !allowed.has(key))) {
    return { error: 'بدنه درخواست تنظیم موجودی معتبر نیست.' };
  }
  if (!ADJUSTMENT_MODES.has(body.mode)) return { error: 'روش تنظیم موجودی معتبر نیست.' };
  if (!Number.isSafeInteger(body.value) || body.value < (body.mode === 'SET' ? 0 : 1)) {
    return { error: body.mode === 'SET' ? 'موجودی نهایی باید عدد صحیح نامنفی باشد.' : 'تعداد تغییر باید عدد صحیح بزرگ‌تر از صفر باشد.' };
  }
  if (!Object.hasOwn(ADMIN_INVENTORY_ADJUSTMENT_REASONS, body.reasonCode)) {
    return { error: 'دلیل تغییر موجودی الزامی است.' };
  }
  const note = normalizedText(body.note, 500);
  if (note.error) return note;
  const key = normalizedText(body.idempotencyKey, 160);
  if (key.error || !key.value) return { error: 'کلید تکرارناپذیری معتبر نیست.' };
  return { data: { mode: body.mode, value: body.value, reasonCode: body.reasonCode, note: note.value, idempotencyKey: key.value } };
}

export function validateAdminInventoryConfiguration(body) {
  const allowed = new Set(['minStock', 'location']);
  if (!isPlainObject(body) || Object.keys(body).some(key => !allowed.has(key)) || Object.keys(body).length === 0) {
    return { error: 'بدنه درخواست تنظیمات معتبر نیست.' };
  }
  const data = {};
  if (Object.hasOwn(body, 'minStock')) {
    if (!Number.isSafeInteger(body.minStock) || body.minStock < 0) return { error: 'حداقل موجودی باید عدد صحیح نامنفی باشد.' };
    data.minStock = body.minStock;
  }
  if (Object.hasOwn(body, 'location')) {
    const location = normalizedText(body.location, 200);
    if (location.error) return { error: 'محل نگهداری معتبر نیست.' };
    data.location = location.value;
  }
  return { data };
}

export function buildAdminInventoryMovementReason(reasonCode, note) {
  const label = ADMIN_INVENTORY_ADJUSTMENT_REASONS[reasonCode];
  return note ? `${label} — ${note}` : label;
}
