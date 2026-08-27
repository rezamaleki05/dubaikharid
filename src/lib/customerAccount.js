import 'server-only';

export function serializeCustomerOrder(order, customer) {
  const successfulPayment = order.payments?.find(payment => payment.status === 'success');
  const latestPayment = order.payments?.[0];
  return {
    id: order.orderCode,
    orderCode: order.orderCode,
    customerName: order.customerNameSnapshot || customer.name,
    phone: order.customerPhoneSnapshot || customer.phone,
    address: order.deliveryAddress || '',
    totalToman: order.totalToman || 0,
    status: order.status,
    pricingStatus: order.pricingStatus,
    paymentStatus: successfulPayment ? 'paid' : (latestPayment?.status || 'pending'),
    paymentMethod: latestPayment?.method === 'ONLINE' ? 'gateway' : 'card',
    transactionId: successfulPayment?.reference || null,
    payment: latestPayment ? {
      id: latestPayment.id,
      method: latestPayment.method,
      status: latestPayment.status,
      amount: Number(latestPayment.amount),
      hasReceipt: Boolean(latestPayment.receiptBlobPathname),
      receiptOriginalName: latestPayment.receiptOriginalName || null,
      receiptSubmittedAt: latestPayment.receiptSubmittedAt || null,
      rejectionReason: latestPayment.rejectionReason || null,
      receiptUrl: latestPayment.receiptBlobPathname ? `/api/payments/${encodeURIComponent(latestPayment.id)}/receipt` : null,
    } : null,
    date: order.createdAt,
    productName: order.items.map(item => item.name).join(' + '),
    items: order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      laptopId: item.laptopId,
      name: item.name,
      quantity: item.quantity,
      priceAed: item.priceAed,
      priceToman: item.priceToman,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    })),
    trackingNum: order.shipment?.trackingCode || '',
    shipment: order.shipment ? {
      status: order.shipment.status,
      carrier: order.shipment.carrier,
      trackingCode: order.shipment.trackingCode,
      trackingUrl: order.shipment.trackingUrl,
      shippedAt: order.shipment.shippedAt,
      deliveredAt: order.shipment.deliveredAt,
    } : null,
    isRequest: false,
  };
}

export function serializeCustomerRequest(item, customer) {
  const successfulPayment = item.order?.payments?.find(payment => payment.status === 'success');
  const latestPayment = item.order?.payments?.[0];
  return {
    id: item.id,
    requestCode: item.requestCode || item.id,
    customerName: customer.name,
    phone: customer.phone,
    address: item.deliveryAddress || '',
    totalToman: item.finalToman || 0,
    status: item.status,
    paymentStatus: successfulPayment ? 'paid' : 'pending',
    date: item.createdAt,
    productName: item.productName || '',
    originalUrl: item.productUrl,
    store: item.sourceStore || '',
    qty: item.quantity,
    details: item.note || '',
    orderCode: item.order?.orderCode || null,
    orderId: item.order?.id || null,
    pricingAvailable: Number(item.finalToman || 0) > 0 && ['price_tagged', 'approved'].includes(item.status) && !item.order,
    paymentMethod: latestPayment?.method === 'ONLINE' ? 'gateway' : latestPayment ? 'card' : null,
    payment: latestPayment ? {
      id: latestPayment.id,
      status: latestPayment.status,
      hasReceipt: Boolean(latestPayment.receiptBlobPathname),
      receiptSubmittedAt: latestPayment.receiptSubmittedAt || null,
      rejectionReason: latestPayment.rejectionReason || null,
    } : null,
    isRequest: true,
  };
}

export const customerOrderInclude = {
  items: true,
  payments: { orderBy: { createdAt: 'desc' } },
  shipment: true,
};
