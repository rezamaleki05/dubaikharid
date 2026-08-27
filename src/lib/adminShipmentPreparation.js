function getResponsePayload(response) {
  return response.json().catch(() => ({}));
}

async function findShipmentForOrder(order, fetcher) {
  const params = new URLSearchParams({
    page: '1',
    limit: '100',
    search: String(order.orderCode || ''),
  });
  const response = await fetcher(`/api/admin/shipments?${params.toString()}`, { cache: 'no-store' });
  const payload = await getResponsePayload(response);
  if (!response.ok) throw new Error(payload.error || 'دریافت اطلاعات مرسوله با خطا مواجه شد.');
  return Array.isArray(payload.data)
    ? payload.data.find(shipment => shipment?.orderId === order.id) || null
    : null;
}

export async function ensureOrderShipment({ order, canCreate, fetcher }) {
  if (!order?.id || typeof fetcher !== 'function') {
    throw new Error('اطلاعات سفارش برای ثبت مرسوله معتبر نیست.');
  }
  if (order.shipment?.id) return { shipment: order.shipment, created: false };

  const existing = await findShipmentForOrder(order, fetcher);
  if (existing) return { shipment: existing, created: false };
  if (!canCreate) throw new Error('شما دسترسی ثبت مرسوله جدید را ندارید.');

  const response = await fetcher('/api/admin/shipments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: order.id }),
  });
  const payload = await getResponsePayload(response);
  if (response.ok && payload?.id) return { shipment: payload, created: true };

  if (response.status === 409) {
    const concurrentShipment = await findShipmentForOrder(order, fetcher);
    if (concurrentShipment) return { shipment: concurrentShipment, created: false };
  }
  throw new Error(payload.error || 'ثبت مرسوله با خطا مواجه شد.');
}

export function getShipmentAdminHref(shipmentId, basePath = '/admin/shipments') {
  return `${basePath}?shipmentId=${encodeURIComponent(String(shipmentId || ''))}`;
}
