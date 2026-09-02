export const PRODUCT_INVENTORY_RESERVATION_STATUSES = Object.freeze(['ACTIVE', 'RELEASED', 'FULFILLED']);
export const MAX_PRODUCT_INVENTORY_LINES = 100;

export class ProductInventoryError extends Error {
  constructor(message, status = 400, code = 'PRODUCT_INVENTORY_INVALID') {
    super(message);
    this.name = 'ProductInventoryError';
    this.status = status;
    this.code = code;
  }
}

function strictObject(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'بدنه درخواست معتبر نیست.';
  return Object.keys(body).some(key => !allowed.has(key)) ? 'فیلد غیرمجاز در درخواست وجود دارد.' : null;
}

function requiredInteger(value, { label, min = 0, allowZero = true }) {
  if (!Number.isSafeInteger(value) || value < min || (!allowZero && value === 0)) {
    return { error: `${label} باید عدد صحیح ${allowZero ? 'نامنفی' : 'بزرگ‌تر از صفر'} باشد.` };
  }
  return { value };
}

function requiredKey(value, label) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > 160) return { error: `${label} معتبر نیست.` };
  return { value: normalized };
}

export function validateProductInventoryKey(value, label = 'شناسه') {
  return requiredKey(value, label);
}

function optionalText(value, label, maxLength = 500) {
  if (value === null || value === undefined || value === '') return { value: null };
  if (typeof value !== 'string') return { error: `${label} معتبر نیست.` };
  const normalized = value.trim();
  if (!normalized) return { value: null };
  if (normalized.length > maxLength) return { error: `${label} بیش از حد طولانی است.` };
  return { value: normalized };
}

function optionalDate(value) {
  if (value === null || value === undefined || value === '') return { value: null };
  if (typeof value !== 'string') return { error: 'زمان انقضا معتبر نیست.' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { error: 'زمان انقضا معتبر نیست.' };
  return { value: date };
}

export function deriveProductInventoryState(inventory) {
  if (!inventory) return null;
  const stock = Number(inventory.stock);
  const reserved = Number(inventory.reserved);
  const minStock = Number(inventory.minStock);
  const available = stock - reserved;
  return {
    stock,
    reserved,
    available,
    minStock,
    lowStock: available <= minStock,
    location: inventory.location ?? null,
  };
}

export function validateInitializeProductInventoryPayload(body) {
  const shapeError = strictObject(body, new Set(['stock', 'minStock', 'location']));
  if (shapeError) return { error: shapeError };
  const stock = requiredInteger(body.stock, { label: 'موجودی اولیه' });
  if (stock.error) return stock;
  const minStock = requiredInteger(body.minStock ?? 0, { label: 'حداقل موجودی' });
  if (minStock.error) return minStock;
  const location = optionalText(body.location, 'محل نگهداری', 200);
  if (location.error) return location;
  return { data: { stock: stock.value, minStock: minStock.value, location: location.value } };
}

export function validateAdjustProductInventoryPayload(body) {
  const shapeError = strictObject(body, new Set(['delta', 'reason', 'idempotencyKey']));
  if (shapeError) return { error: shapeError };
  const delta = requiredInteger(Math.abs(body?.delta), { label: 'تغییر موجودی', allowZero: false, min: 1 });
  if (!Number.isSafeInteger(body?.delta) || body.delta === 0 || delta.error) {
    return { error: 'تغییر موجودی باید عدد صحیح غیرصفر باشد.' };
  }
  const reason = optionalText(body.reason, 'دلیل تغییر');
  if (reason.error) return reason;
  const idempotencyKey = requiredKey(body.idempotencyKey, 'کلید تکرارناپذیری');
  if (idempotencyKey.error) return idempotencyKey;
  return { data: { delta: body.delta, reason: reason.value, idempotencyKey: idempotencyKey.value } };
}

export function validateReserveProductInventoryPayload(body) {
  const shapeError = strictObject(body, new Set(['variantId', 'quantity', 'reservationKey', 'expiresAt']));
  if (shapeError) return { error: shapeError };
  const variantId = requiredKey(body.variantId, 'شناسه تنوع');
  if (variantId.error) return variantId;
  const quantity = requiredInteger(body.quantity, { label: 'تعداد', min: 1, allowZero: false });
  if (quantity.error) return quantity;
  const reservationKey = requiredKey(body.reservationKey, 'کلید رزرو');
  if (reservationKey.error) return reservationKey;
  const expiresAt = optionalDate(body.expiresAt);
  if (expiresAt.error) return expiresAt;
  return { data: { variantId: variantId.value, quantity: quantity.value, reservationKey: reservationKey.value, expiresAt: expiresAt.value } };
}

export function validateReserveProductInventoryLinesPayload(body) {
  const shapeError = strictObject(body, new Set(['groupKey', 'lines', 'expiresAt']));
  if (shapeError) return { error: shapeError };
  const groupKey = requiredKey(body.groupKey, 'کلید گروه رزرو');
  if (groupKey.error) return groupKey;
  if (!Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > MAX_PRODUCT_INVENTORY_LINES) {
    return { error: `بین ۱ تا ${MAX_PRODUCT_INVENTORY_LINES} ردیف رزرو لازم است.` };
  }
  const seen = new Set();
  const lines = [];
  for (const line of body.lines) {
    const lineShapeError = strictObject(line, new Set(['variantId', 'quantity']));
    if (lineShapeError) return { error: lineShapeError };
    const variantId = requiredKey(line.variantId, 'شناسه تنوع');
    if (variantId.error) return variantId;
    if (seen.has(variantId.value)) return { error: 'هر تنوع فقط یک بار می‌تواند در گروه رزرو باشد.' };
    seen.add(variantId.value);
    const quantity = requiredInteger(line.quantity, { label: 'تعداد', min: 1, allowZero: false });
    if (quantity.error) return quantity;
    lines.push({
      variantId: variantId.value,
      quantity: quantity.value,
      reservationKey: `${groupKey.value}:${variantId.value}`,
    });
  }
  const expiresAt = optionalDate(body.expiresAt);
  if (expiresAt.error) return expiresAt;
  return { data: { groupKey: groupKey.value, lines, expiresAt: expiresAt.value } };
}

export function validateReturnProductInventoryPayload(body) {
  const shapeError = strictObject(body, new Set(['quantity', 'reason', 'idempotencyKey']));
  if (shapeError) return { error: shapeError };
  const quantity = requiredInteger(body.quantity, { label: 'تعداد مرجوعی', min: 1, allowZero: false });
  if (quantity.error) return quantity;
  const reason = optionalText(body.reason, 'دلیل مرجوعی');
  if (reason.error) return reason;
  const idempotencyKey = requiredKey(body.idempotencyKey, 'کلید تکرارناپذیری');
  if (idempotencyKey.error) return idempotencyKey;
  return { data: { quantity: quantity.value, reason: reason.value, idempotencyKey: idempotencyKey.value } };
}
