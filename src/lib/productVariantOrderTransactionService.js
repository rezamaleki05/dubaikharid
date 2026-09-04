import 'server-only';

import { Prisma } from '@/generated/prisma/client';
import {
  reserveProductInventoryLinesInTransaction,
  runSerializableWithRetry,
} from '@/lib/productInventoryService';
import { attachProductInventoryReservationToOrderItem } from '@/lib/productInventoryOrderLinkService';
import { ProductVariantOrderItemError } from '@/lib/productVariantOrderItemDomain';
import { buildProductVariantOrderItemSnapshot } from '@/lib/productVariantOrderItemService';

const MAX_ORDER_LINES = 30;
const MAX_TOMAN_SNAPSHOT = 999_999_999_999_999_999n;

function requiredKey(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 160) {
    throw new ProductVariantOrderItemError(`${label} معتبر نیست.`, 400, 'INVALID_ORDER_IDENTIFIER');
  }
  return value.trim();
}

function validateLines(lines) {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > MAX_ORDER_LINES) {
    throw new ProductVariantOrderItemError('اقلام سفارش تنوع معتبر نیستند.', 400, 'INVALID_ORDER_LINES');
  }
  const variants = new Set();
  return lines.map(line => {
    const productId = requiredKey(line?.productId, 'شناسه محصول');
    const variantId = requiredKey(line?.variantId, 'شناسه تنوع');
    if (!Number.isSafeInteger(line?.quantity) || line.quantity < 1 || line.quantity > 1_000) {
      throw new ProductVariantOrderItemError('تعداد قلم سفارش معتبر نیست.', 400, 'INVALID_QUANTITY');
    }
    if (variants.has(variantId)) {
      throw new ProductVariantOrderItemError('هر تنوع فقط یک بار در سفارش مجاز است.', 400, 'DUPLICATE_VARIANT');
    }
    variants.add(variantId);
    return { productId, variantId, quantity: line.quantity };
  });
}

function orderInclude() {
  return {
    items: { include: { inventoryReservation: true } },
    productInventoryReservations: {
      include: { orderItem: { select: { productVariantId: true } } },
    },
  };
}

function assertIdempotentReplay(order, { orderCode, reservationGroupKey, lines }) {
  const itemsByVariant = new Map(order.items.map(item => [item.productVariantId, item]));
  const reservationsByVariant = new Map(order.productInventoryReservations.map(reservation => [
    reservation.orderItem?.productVariantId,
    reservation,
  ]));
  const compatible = order.type === 'IRAN_STOCK_PRODUCT'
    && order.orderCode === orderCode
    && order.items.length === lines.length
    && order.productInventoryReservations.length === lines.length
    && lines.every(line => {
      const item = itemsByVariant.get(line.variantId);
      const reservation = reservationsByVariant.get(line.variantId);
      return item?.productId === line.productId
        && item?.quantity === line.quantity
        && reservation?.reservationKey === `${reservationGroupKey}:${line.variantId}`
        && reservation?.quantity === line.quantity;
    });
  if (!compatible) {
    throw new ProductVariantOrderItemError(
      'کلید تکرارناپذیری سفارش قبلاً برای درخواست دیگری استفاده شده است.',
      409,
      'ORDER_IDEMPOTENCY_KEY_CONFLICT',
    );
  }
}

export async function createFutureIranStockVariantOrder(
  client,
  {
    orderCode,
    idempotencyKey,
    reservationGroupKey,
    lines,
    expiresAt = null,
    customerId = null,
    customerNameSnapshot = null,
    customerPhoneSnapshot = null,
    customerEmailSnapshot = null,
    deliveryAddress = null,
    notes = null,
    adminId = null,
  },
) {
  const normalizedOrderCode = requiredKey(orderCode, 'شماره سفارش');
  const normalizedIdempotencyKey = requiredKey(idempotencyKey, 'کلید تکرارناپذیری سفارش');
  const normalizedReservationGroupKey = requiredKey(reservationGroupKey, 'کلید گروه رزرو');
  const normalizedLines = validateLines(lines);

  return runSerializableWithRetry(client, async tx => {
    const prior = await tx.order.findUnique({
      where: { idempotencyKey: normalizedIdempotencyKey },
      include: orderInclude(),
    });
    if (prior) {
      assertIdempotentReplay(prior, {
        orderCode: normalizedOrderCode,
        reservationGroupKey: normalizedReservationGroupKey,
        lines: normalizedLines,
      });
      return { order: prior, reservations: prior.productInventoryReservations, created: false };
    }

    const itemSnapshots = [];
    for (const line of normalizedLines) {
      const snapshot = await buildProductVariantOrderItemSnapshot(tx, line);
      if (snapshot.supplyModeSnapshot !== 'IRAN_STOCK') {
        throw new ProductVariantOrderItemError(
          'این تراکنش فقط برای تنوع محصول موجود در ایران است.',
          409,
          'MIXED_SUPPLY_MODE',
        );
      }
      itemSnapshots.push(snapshot);
    }

    await reserveProductInventoryLinesInTransaction(tx, {
      lines: normalizedLines.map(line => ({
        variantId: line.variantId,
        quantity: line.quantity,
        reservationKey: `${normalizedReservationGroupKey}:${line.variantId}`,
      })),
      expiresAt,
      adminId,
    });

    const totalToman = itemSnapshots.reduce(
      (sum, item) => sum + BigInt(item.finalUnitPriceTomanSnapshot.toFixed(0)) * BigInt(item.quantity),
      0n,
    );
    if (totalToman <= 0n || totalToman > MAX_TOMAN_SNAPSHOT || totalToman > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new ProductVariantOrderItemError('جمع مبلغ سفارش خارج از محدوده امن است.', 409, 'ORDER_TOTAL_OUT_OF_RANGE');
    }

    const created = await tx.order.create({
      data: {
        orderCode: normalizedOrderCode,
        idempotencyKey: normalizedIdempotencyKey,
        type: 'IRAN_STOCK_PRODUCT',
        pricingStatus: 'CONFIRMED',
        customerId,
        customerNameSnapshot,
        customerPhoneSnapshot,
        customerEmailSnapshot,
        deliveryAddress,
        notes,
        status: 'pending',
        totalAed: null,
        totalToman: Number(totalToman),
        productSubtotalToman: new Prisma.Decimal(totalToman.toString()),
        shippingCostToman: new Prisma.Decimal(0),
        items: { create: itemSnapshots },
      },
      include: { items: true },
    });
    const itemByVariant = new Map(created.items.map(item => [item.productVariantId, item]));
    for (const line of normalizedLines) {
      const orderItem = itemByVariant.get(line.variantId);
      await attachProductInventoryReservationToOrderItem(tx, {
        reservationKey: `${normalizedReservationGroupKey}:${line.variantId}`,
        orderItemId: orderItem.id,
      });
    }
    const order = await tx.order.findUnique({ where: { id: created.id }, include: orderInclude() });
    return { order, reservations: order.productInventoryReservations, created: true };
  }, { retryUnique: true, timeout: 20_000 });
}
