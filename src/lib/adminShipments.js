import 'server-only';

export const SHIPMENT_STATUSES = Object.freeze([
  'PENDING',
  'READY',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
]);

export const SHIPMENT_STATUS_SET = new Set(SHIPMENT_STATUSES);

const SHIPMENT_TRANSITIONS = Object.freeze({
  PENDING: Object.freeze(['READY', 'CANCELLED']),
  READY: Object.freeze(['SHIPPED', 'CANCELLED']),
  SHIPPED: Object.freeze(['IN_TRANSIT', 'FAILED', 'CANCELLED']),
  IN_TRANSIT: Object.freeze(['OUT_FOR_DELIVERY', 'FAILED', 'CANCELLED']),
  OUT_FOR_DELIVERY: Object.freeze(['DELIVERED', 'FAILED', 'CANCELLED']),
  FAILED: Object.freeze(['READY', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'CANCELLED']),
  DELIVERED: Object.freeze([]),
  CANCELLED: Object.freeze([]),
});

const CREATE_FIELDS = new Set([
  'orderId',
  'status',
  'carrier',
  'trackingNumber',
  'trackingUrl',
  'shippingMethod',
  'notes',
]);

const UPDATE_FIELDS = new Set([
  'status',
  'carrier',
  'trackingNumber',
  'trackingUrl',
  'shippingMethod',
  'notes',
]);

export const adminShipmentInclude = Object.freeze({
  order: {
    select: {
      id: true,
      orderCode: true,
      status: true,
      totalToman: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          city: true,
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          priceToman: true,
        },
      },
    },
  },
});

function cleanRequiredString(value, maximum) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned && cleaned.length <= maximum ? cleaned : null;
}

function cleanOptionalString(value, maximum) {
  if (value === null || value === undefined || value === '') return { value: null };
  if (typeof value !== 'string') return { error: true };
  const cleaned = value.trim();
  if (!cleaned) return { value: null };
  return cleaned.length <= maximum ? { value: cleaned } : { error: true };
}

function cleanTrackingUrl(value) {
  const parsed = cleanOptionalString(value, 2048);
  if (parsed.error || !parsed.value) return parsed;
  try {
    const url = new URL(parsed.value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      return { error: true };
    }
    return { value: url.toString() };
  } catch {
    return { error: true };
  }
}

function parseCommonFields(body, data) {
  const mappings = [
    ['carrier', 'carrier', 160],
    ['trackingNumber', 'trackingCode', 160],
    ['shippingMethod', 'method', 80],
    ['notes', 'notes', 4000],
  ];
  for (const [input, output, maximum] of mappings) {
    if (!Object.hasOwn(body, input)) continue;
    const parsed = cleanOptionalString(body[input], maximum);
    if (parsed.error) return { error: `مقدار ${input} معتبر نیست.` };
    data[output] = parsed.value;
  }
  if (Object.hasOwn(body, 'trackingUrl')) {
    const parsed = cleanTrackingUrl(body.trackingUrl);
    if (parsed.error) return { error: 'لینک رهگیری معتبر نیست.' };
    data.trackingUrl = parsed.value;
  }
  return null;
}

export function isShipmentId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128;
}

export function getAllowedShipmentTransitions(status) {
  return SHIPMENT_TRANSITIONS[status] || [];
}

export function canTransitionShipment(previousStatus, nextStatus) {
  return previousStatus === nextStatus || getAllowedShipmentTransitions(previousStatus).includes(nextStatus);
}

export function parseShipmentCreateInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'بدنه درخواست معتبر نیست.' };
  }
  if (Object.keys(body).some(key => !CREATE_FIELDS.has(key))) {
    return { error: 'فیلد غیرمجاز در درخواست وجود دارد.' };
  }
  const orderId = cleanRequiredString(body.orderId, 128);
  if (!orderId) return { error: 'سفارش معتبر الزامی است.' };
  const status = body.status === undefined ? 'PENDING' : body.status;
  if (typeof status !== 'string' || !SHIPMENT_STATUS_SET.has(status) || status === 'CANCELLED') {
    return { error: 'وضعیت مرسوله معتبر نیست.' };
  }
  const data = { orderId, status };
  const commonError = parseCommonFields(body, data);
  if (commonError) return commonError;
  return { data };
}

export function parseShipmentUpdateInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'بدنه درخواست معتبر نیست.' };
  }
  if (Object.keys(body).some(key => !UPDATE_FIELDS.has(key))) {
    return { error: 'فیلد غیرمجاز در درخواست وجود دارد.' };
  }
  const data = {};
  if (Object.hasOwn(body, 'status')) {
    if (typeof body.status !== 'string' || !SHIPMENT_STATUS_SET.has(body.status)) {
      return { error: 'وضعیت مرسوله معتبر نیست.' };
    }
    data.status = body.status;
  }
  const commonError = parseCommonFields(body, data);
  if (commonError) return commonError;
  if (Object.keys(data).length === 0) return { error: 'تغییری ارسال نشده است.' };
  return { data };
}

export function shipmentTimestampData(current, nextStatus, now = new Date()) {
  const data = {};
  if (
    !current.shippedAt &&
    ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(nextStatus)
  ) {
    data.shippedAt = now;
  }
  if (!current.deliveredAt && nextStatus === 'DELIVERED') data.deliveredAt = now;
  return data;
}

export function orderStatusForShipment(status) {
  if (status === 'DELIVERED') return 'delivered';
  if (['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)) return 'shipped';
  return null;
}

export function serializeAdminShipment(shipment) {
  const order = shipment.order || null;
  const items = order?.items || [];
  return {
    id: shipment.id,
    orderId: shipment.orderId,
    orderCode: order?.orderCode || '',
    orderStatus: order?.status || null,
    recipient: shipment.recipient,
    phone: shipment.recipientPhone || '',
    address: shipment.deliveryAddress || '',
    method: shipment.method || '',
    shippingMethod: shipment.method || '',
    status: shipment.status,
    carrier: shipment.carrier || '',
    trackingCode: shipment.trackingCode || '',
    trackingNumber: shipment.trackingCode || '',
    awbCode: shipment.trackingCode || '',
    trackingUrl: shipment.trackingUrl || '',
    notes: shipment.notes || '',
    shippedAt: shipment.shippedAt?.toISOString() || null,
    dateShipped: shipment.shippedAt?.toISOString() || '',
    deliveredAt: shipment.deliveredAt?.toISOString() || null,
    createdAt: shipment.createdAt.toISOString(),
    updatedAt: shipment.updatedAt.toISOString(),
    dateUpdated: shipment.updatedAt.toISOString(),
    customerName: order?.customer?.name || shipment.recipient,
    customerPhone: order?.customer?.phone || shipment.recipientPhone || '',
    productName: items.map(item => item.name).filter(Boolean).join(' + '),
    productImg: '',
    cargoWeight: null,
    cargoValue: Number(order?.totalToman) || 0,
    shippingCost: 0,
    items,
    allowedTransitions: getAllowedShipmentTransitions(shipment.status),
  };
}
