import 'server-only';

export const ORDER_STATUSES = Object.freeze([
  'pending',
  'pricing',
  'paid',
  'processing',
  'purchased',
  'warehouse_dubai',
  'shipped',
  'delivered',
  'cancelled',
]);

export const ORDER_STATUS_SET = new Set(ORDER_STATUSES);

export const adminOrderInclude = Object.freeze({
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      city: true,
    },
  },
  items: {
    select: {
      id: true,
      name: true,
      quantity: true,
      priceAed: true,
      priceToman: true,
    },
  },
  payments: {
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      reference: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  },
  shipment: {
    select: {
      id: true,
      method: true,
      status: true,
      trackingCode: true,
      dateShipped: true,
      dateUpdated: true,
    },
  },
});

function normalizePaymentMethod(method) {
  const value = String(method || '').toUpperCase();
  if (value === 'ONLINE') return 'gateway';
  return value ? 'card' : null;
}

export function serializeAdminOrder(order) {
  const payment = order.payments?.find(item => item.status === 'success') || order.payments?.[0] || null;
  const successfulPaymentTotal = order.payments?.filter(item => item.status === 'success').reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  const isFullyPaid = Boolean(order.totalToman) && successfulPaymentTotal >= Number(order.totalToman);
  const productSubtotalToman = order.items?.reduce(
    (sum, item) => sum + (Number(item.priceToman) || 0) * (Number(item.quantity) || 0),
    0,
  ) || 0;

  return {
    id: order.id,
    orderCode: order.orderCode,
    customerId: order.customerId,
    customerName: order.customer?.name || '',
    phone: order.customer?.phone || '',
    email: order.customer?.email || '',
    address: order.customer?.city || '',
    status: order.status,
    totalAed: order.totalAed,
    totalToman: order.totalToman,
    notes: order.notes,
    adminNotes: order.adminNotes,
    date: order.createdAt,
    updatedAt: order.updatedAt,
    productName: order.items?.map(item => item.name).filter(Boolean).join(' + ') || '',
    items: order.items || [],
    priceDetails: {
      product: productSubtotalToman,
      shipping: 0,
      commission: Math.max(0, (Number(order.totalToman) || 0) - productSubtotalToman),
    },
    paymentMethod: normalizePaymentMethod(payment?.method),
    paymentStatus: isFullyPaid ? 'paid' : 'pending',
    trackingNum: payment?.reference || order.shipment?.trackingCode || '',
    payment: payment ? {
      id: payment.id,
      amount: Number(payment.amount),
      method: payment.method,
      status: payment.status,
      reference: payment.reference,
    } : null,
    shipment: order.shipment || null,
  };
}
