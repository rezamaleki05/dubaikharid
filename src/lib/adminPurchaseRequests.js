import 'server-only';

export const PURCHASE_REQUEST_STATUSES = new Set(['pending', 'price_tagged', 'approved', 'converted', 'cancelled']);

export function serializeAdminPurchaseRequest(request) {
  return {
    id: request.id,
    requestCode: request.requestCode || request.id,
    customerId: request.customerId,
    customerName: request.customer?.name || '',
    phone: request.customer?.phone || '',
    email: request.customer?.email || '',
    address: request.deliveryAddress || '',
    productName: request.productName || '',
    originalUrl: request.productUrl,
    store: request.sourceStore || '',
    priceAed: request.priceAed || 0,
    weight: request.weight || 0,
    totalToman: request.finalToman || 0,
    qty: request.quantity,
    notes: request.note || '',
    status: request.status,
    paymentStatus: request.order?.payments?.some(payment => payment.status === 'success') ? 'paid' : 'pending',
    paymentMethod: request.order?.payments?.[0]?.method === 'ONLINE' ? 'gateway' : 'card',
    orderCode: request.order?.orderCode || null,
    date: request.createdAt,
    updatedAt: request.updatedAt,
    isRequest: true,
  };
}
