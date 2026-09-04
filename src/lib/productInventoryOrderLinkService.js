import 'server-only';

import { ProductInventoryError } from '@/lib/productInventoryDomain';

function conflict(message, code) {
  return new ProductInventoryError(message, 409, code);
}

export async function attachProductInventoryReservationToOrderItem(
  tx,
  { reservationKey, orderItemId },
) {
  if (typeof reservationKey !== 'string' || !reservationKey.trim() || typeof orderItemId !== 'string' || !orderItemId.trim()) {
    throw new ProductInventoryError('شناسه رزرو یا قلم سفارش معتبر نیست.');
  }
  const [reservation, orderItem] = await Promise.all([
    tx.productInventoryReservation.findUnique({
      where: { reservationKey: reservationKey.trim() },
      include: { inventory: { select: { variantId: true } } },
    }),
    tx.orderItem.findUnique({
      where: { id: orderItemId.trim() },
      select: {
        id: true,
        orderId: true,
        quantity: true,
        productVariantId: true,
        sourceKind: true,
        supplyModeSnapshot: true,
        order: { select: { type: true } },
      },
    }),
  ]);
  if (!reservation) throw conflict('رزرو موجودی پیدا نشد.', 'PRODUCT_INVENTORY_RESERVATION_NOT_FOUND');
  if (!orderItem) throw conflict('قلم سفارش پیدا نشد.', 'ORDER_ITEM_NOT_FOUND');
  if (reservation.orderId || reservation.orderItemId) {
    if (reservation.orderId === orderItem.orderId && reservation.orderItemId === orderItem.id) return reservation;
    throw conflict('رزرو موجودی قبلاً به قلم سفارش دیگری متصل شده است.', 'RESERVATION_ALREADY_LINKED');
  }
  if (reservation.status !== 'ACTIVE') {
    throw conflict('فقط رزرو فعال را می‌توان به قلم سفارش متصل کرد.', 'RESERVATION_NOT_ACTIVE');
  }
  if (orderItem.order.type !== 'IRAN_STOCK_PRODUCT'
    || orderItem.sourceKind !== 'PRODUCT_VARIANT'
    || orderItem.supplyModeSnapshot !== 'IRAN_STOCK') {
    throw conflict('رزرو موجودی فقط به قلم تنوع محصول موجود در ایران متصل می‌شود.', 'ORDER_ITEM_NOT_IRAN_VARIANT');
  }
  if (reservation.inventory.variantId !== orderItem.productVariantId) {
    throw conflict('تنوع رزرو با تنوع قلم سفارش یکسان نیست.', 'RESERVATION_VARIANT_MISMATCH');
  }
  if (reservation.quantity !== orderItem.quantity) {
    throw conflict('تعداد رزرو باید دقیقاً با تعداد قلم سفارش برابر باشد.', 'RESERVATION_QUANTITY_MISMATCH');
  }
  const linked = await tx.productInventoryReservation.updateMany({
    where: { id: reservation.id, orderId: null, orderItemId: null },
    data: { orderId: orderItem.orderId, orderItemId: orderItem.id },
  });
  if (linked.count !== 1) {
    const current = await tx.productInventoryReservation.findUnique({ where: { id: reservation.id } });
    if (current?.orderId === orderItem.orderId && current?.orderItemId === orderItem.id) return current;
    throw conflict('اتصال رزرو هم‌زمان تغییر کرد؛ دوباره تلاش کنید.', 'RESERVATION_LINK_CONCURRENT_UPDATE');
  }
  return tx.productInventoryReservation.findUnique({ where: { id: reservation.id } });
}
