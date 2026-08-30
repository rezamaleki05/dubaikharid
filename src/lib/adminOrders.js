import 'server-only';
import { canTransitionOrder } from '@/lib/orderStatuses';
import { fulfillWarehouseQuantity, releaseWarehouseQuantity } from '@/lib/warehouseSales';

export { ORDER_STATUSES, ORDER_STATUS_SET } from '@/lib/orderStatuses';

export class OrderDomainError extends Error {
  constructor(message, status = 409, code = 'ORDER_CONFLICT') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

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
      productId: true,
      laptopId: true,
      warehouseItemId: true,
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
      carrier: true,
      trackingCode: true,
      trackingUrl: true,
      shippedAt: true,
      deliveredAt: true,
      updatedAt: true,
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
  const computedProductSubtotalToman = order.items?.reduce(
    (sum, item) => sum + (Number(item.priceToman) || 0) * (Number(item.quantity) || 0),
    0,
  ) || 0;
  const productSubtotalToman = order.productSubtotalToman == null
    ? computedProductSubtotalToman
    : Number(order.productSubtotalToman);
  const shippingCostToman = order.shippingCostToman == null ? 0 : Number(order.shippingCostToman);

  return {
    id: order.id,
    orderCode: order.orderCode,
    customerId: order.customerId,
    customerName: order.customer?.name || '',
    phone: order.customer?.phone || '',
    email: order.customer?.email || '',
    address: order.deliveryAddress || order.customer?.city || '',
    status: order.status,
    type: order.type,
    pricingStatus: order.pricingStatus,
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
      shipping: shippingCostToman,
      commission: Math.max(0, (Number(order.totalToman) || 0) - productSubtotalToman - shippingCostToman),
    },
    paymentMethod: normalizePaymentMethod(payment?.method),
    paymentStatus: isFullyPaid ? 'paid' : 'pending',
    trackingNum: order.shipment?.trackingCode || '',
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

export async function updateOrderLifecycle(tx, id, data) {
  const current = await tx.order.findUnique({
    where: { id },
    include: {
      payments: { select: { amount: true, status: true } },
      inventoryMovements: { where: { type: { in: ['ORDER_RESERVATION', 'ORDER_RELEASE', 'ORDER_FULFILLMENT'] } } },
    },
  });
  if (!current) throw new OrderDomainError('سفارش پیدا نشد.', 404, 'NOT_FOUND');
  const nextStatus = data.status || current.status;
  if (!canTransitionOrder(current.status, nextStatus)) throw new OrderDomainError('تغییر وضعیت سفارش مجاز نیست.', 409, 'INVALID_TRANSITION');
  if (nextStatus === 'paid' && current.status !== 'paid') {
    const paid = current.payments.filter(payment => payment.status === 'success').reduce((sum, payment) => sum + Number(payment.amount), 0);
    if (!current.totalToman || paid < Number(current.totalToman)) throw new OrderDomainError('بدون پرداخت تأییدشده نمی‌توان سفارش را پرداخت‌شده کرد.', 409, 'PAYMENT_REQUIRED');
  }

  if (nextStatus === 'cancelled' && current.status !== 'cancelled') {
    await tx.laptop.updateMany({ where: { reservedOrderId: id, status: 'RESERVED' }, data: { status: 'AVAILABLE', reservedOrderId: null } });
    const completedItems = new Set(current.inventoryMovements.filter(movement => ['ORDER_RELEASE', 'ORDER_FULFILLMENT'].includes(movement.type)).map(movement => movement.warehouseItemId));
    const reservations = new Map();
    for (const movement of current.inventoryMovements.filter(item => item.type === 'ORDER_RESERVATION' && !completedItems.has(item.warehouseItemId))) {
      const amount = Math.max(0, Number(movement.reservedAfter || 0) - Number(movement.reservedBefore || 0));
      reservations.set(movement.warehouseItemId, (reservations.get(movement.warehouseItemId) || 0) + amount);
    }
    for (const [warehouseItemId, amount] of reservations) {
      if (!amount) continue;
      const warehouse = await tx.warehouseItem.findUnique({ where: { id: warehouseItemId } });
      if (!warehouse) continue;
      const released = releaseWarehouseQuantity(warehouse, amount);
      if (!released) throw new OrderDomainError('موجودی رزروشده سفارش ناسازگار است.', 409, 'INVENTORY_CONFLICT');
      await tx.warehouseItem.update({ where: { id: warehouse.id }, data: { reserved: released.reserved } });
      await tx.inventoryMovement.create({ data: { warehouseItemId: warehouse.id, type: 'ORDER_RELEASE', quantityChange: 0, quantityBefore: warehouse.stock, quantityAfter: warehouse.stock, reservedBefore: warehouse.reserved, reservedAfter: released.reserved, reason: `آزادسازی رزرو سفارش ${current.orderCode}`, orderId: id } });
    }
  }

  if (nextStatus === 'shipped' && current.status !== 'shipped') await fulfillOrderWarehouseReservations(tx, id, current.orderCode);

  return tx.order.update({ where: { id }, data, include: adminOrderInclude });
}

export async function fulfillOrderWarehouseReservations(tx, orderId, knownOrderCode = null) {
  const [order, movements] = await Promise.all([
    knownOrderCode ? Promise.resolve({ orderCode: knownOrderCode }) : tx.order.findUnique({ where: { id: orderId }, select: { orderCode: true } }),
    tx.inventoryMovement.findMany({ where: { orderId, type: { in: ['ORDER_RESERVATION', 'ORDER_FULFILLMENT'] } } }),
  ]);
  const fulfilledItems = new Set(movements.filter(movement => movement.type === 'ORDER_FULFILLMENT').map(movement => movement.warehouseItemId));
  const reservations = new Map();
  for (const movement of movements.filter(item => item.type === 'ORDER_RESERVATION' && !fulfilledItems.has(item.warehouseItemId))) {
    const amount = Math.max(0, Number(movement.reservedAfter || 0) - Number(movement.reservedBefore || 0));
    reservations.set(movement.warehouseItemId, (reservations.get(movement.warehouseItemId) || 0) + amount);
  }
  for (const [warehouseItemId, amount] of reservations) {
    if (!amount) continue;
    const warehouse = await tx.warehouseItem.findUnique({ where: { id: warehouseItemId } });
    const fulfilled = fulfillWarehouseQuantity(warehouse, amount);
    if (!fulfilled) throw new OrderDomainError('موجودی رزروشده سفارش ناسازگار است.', 409, 'INVENTORY_CONFLICT');
    const updated = await tx.warehouseItem.update({ where: { id: warehouse.id }, data: { stock: { decrement: amount }, reserved: { decrement: amount } } });
    await tx.inventoryMovement.create({ data: { warehouseItemId: warehouse.id, type: 'ORDER_FULFILLMENT', quantityChange: -amount, quantityBefore: warehouse.stock, quantityAfter: updated.stock, reservedBefore: warehouse.reserved, reservedAfter: updated.reserved, reason: `خروج قطعی سفارش ${order?.orderCode || orderId}`, orderId } });
  }
}
