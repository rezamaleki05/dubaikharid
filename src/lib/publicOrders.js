import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client';
import { normalizeCustomerPhone } from '@/lib/adminCustomers';
import { calculateProductPricing } from '@/lib/pricing';
import { prisma } from '@/lib/prisma';
import { resolveAuthoritativeProductCartLines } from '@/lib/productCartService';
import { buildProductVariantOrderItemSnapshot } from '@/lib/productVariantOrderItemService';
import { createFutureIranStockVariantOrder } from '@/lib/productVariantOrderTransactionService';
import { getPricingSettings, getSettings } from '@/lib/settings';
import { getOrderItemSource, getWarehouseAvailableQuantity, getWarehouseUnitPriceToman } from '@/lib/warehouseSales';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYMENT_METHODS = new Set(['CARD', 'ONLINE']);

export class PublicOrderError extends Error {
  constructor(message, status = 400, code = 'INVALID_ORDER', details = null) {
    super(message);
    this.name = 'PublicOrderError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function text(value, maximum, { required = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) throw new PublicOrderError('اطلاعات الزامی سفارش کامل نیست.');
    return null;
  }
  if (typeof value !== 'string') throw new PublicOrderError('اطلاعات متنی سفارش معتبر نیست.');
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maximum) throw new PublicOrderError('اطلاعات متنی سفارش معتبر نیست.');
  return cleaned || null;
}

function quantity(value) {
  const parsed = Number(value ?? 1);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 20) throw new PublicOrderError('تعداد کالا معتبر نیست.');
  return parsed;
}

function parseCustomer(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PublicOrderError('اطلاعات مشتری معتبر نیست.');
  const allowed = new Set(['name', 'phone', 'email', 'address']);
  if (Object.keys(body).some(key => !allowed.has(key))) throw new PublicOrderError('فیلد غیرمجاز در اطلاعات مشتری وجود دارد.');
  const name = text(body.name, 160, { required: true });
  const phone = text(body.phone, 40, { required: true });
  const normalizedPhone = normalizeCustomerPhone(phone);
  const email = text(body.email, 320)?.toLowerCase() || null;
  const address = text(body.address, 1000, { required: true });
  if (!normalizedPhone) throw new PublicOrderError('شماره موبایل معتبر نیست.');
  if (email && !EMAIL_PATTERN.test(email)) throw new PublicOrderError('ایمیل معتبر نیست.');
  return { name, phone, normalizedPhone, email, address };
}

export function validatePublicOrderInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PublicOrderError('بدنه درخواست معتبر نیست.');
  const allowed = new Set(['customer', 'items', 'paymentMethod', 'notes']);
  if (Object.keys(body).some(key => !allowed.has(key))) throw new PublicOrderError('فیلد غیرمجاز در سفارش وجود دارد.');
  const customer = parseCustomer(body.customer);
  const notes = text(body.notes, 4000);
  if (!PAYMENT_METHODS.has(body.paymentMethod)) throw new PublicOrderError('روش پرداخت معتبر نیست.');
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) throw new PublicOrderError('اقلام سفارش معتبر نیستند.');
  const items = body.items.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new PublicOrderError('قلم سفارش معتبر نیست.');
    const itemAllowed = new Set(['productId', 'productVariantId', 'laptopId', 'warehouseItemId', 'quantity', 'selectedColor', 'selectedSize']);
    if (Object.keys(item).some(key => !itemAllowed.has(key))) throw new PublicOrderError('فیلد غیرمجاز در قلم سفارش وجود دارد.');
    const productId = text(item.productId, 160);
    const productVariantId = text(item.productVariantId, 160);
    const laptopId = text(item.laptopId, 160);
    const warehouseItemId = text(item.warehouseItemId, 160);
    if (!getOrderItemSource({ productId, laptopId, warehouseItemId })) throw new PublicOrderError('هر قلم سفارش باید دقیقاً یک منبع کالا داشته باشد.');
    const itemQuantity = quantity(item.quantity);
    if (laptopId && itemQuantity !== 1) throw new PublicOrderError('هر لپ‌تاپ استوک یک واحد مستقل است.');
    return {
      productId,
      productVariantId,
      laptopId,
      warehouseItemId,
      quantity: itemQuantity,
      selectedColor: text(item.selectedColor, 120),
      selectedSize: text(item.selectedSize, 120),
    };
  });
  const hasLaptop = items.some(item => item.laptopId);
  const hasProduct = items.some(item => item.productId);
  const hasWarehouse = items.some(item => item.warehouseItemId);
  if ([hasLaptop, hasProduct, hasWarehouse].filter(Boolean).length !== 1) {
    throw new PublicOrderError('کالاهای خارجی، موجودی انبار و لپ‌تاپ باید در سفارش‌های جدا ثبت شوند.');
  }
  if (hasLaptop && new Set(items.map(item => item.laptopId)).size !== items.length) {
    throw new PublicOrderError('هر لپ‌تاپ استوک فقط یک‌بار قابل ثبت است.');
  }
  if (hasProduct) {
    const totals = new Map();
    for (const item of items) {
      const identity = `${item.productId}:${item.productVariantId || ''}:${item.selectedColor || ''}:${item.selectedSize || ''}`;
      totals.set(identity, (totals.get(identity) || 0) + item.quantity);
    }
    if ([...totals.values()].some(total => total > 20)) throw new PublicOrderError('حداکثر تعداد مجاز هر کالا ۲۰ عدد است.');
  }
  if (hasWarehouse) {
    const totals = new Map();
    for (const item of items) totals.set(item.warehouseItemId, (totals.get(item.warehouseItemId) || 0) + item.quantity);
    if ([...totals.values()].some(total => total > 20)) throw new PublicOrderError('حداکثر تعداد مجاز هر کالای انبار ۲۰ عدد است.');
  }
  return {
    customer,
    items,
    paymentMethod: body.paymentMethod,
    notes,
    type: hasLaptop ? 'LAPTOP_STOCK' : hasWarehouse ? 'WAREHOUSE_STOCK' : 'CATALOG_PRODUCT',
  };
}

async function resolveCustomer(tx, customer, authenticatedCustomerId = null) {
  if (authenticatedCustomerId) {
    const authenticated = await tx.customer.findUnique({ where: { id: authenticatedCustomerId } });
    if (!authenticated || !['active', 'vip'].includes(authenticated.status)) {
      throw new PublicOrderError('حساب کاربری برای ثبت سفارش معتبر نیست.', 401, 'CUSTOMER_UNAUTHORIZED');
    }
    return authenticated;
  }
  const existing = await tx.customer.findUnique({ where: { normalizedPhone: customer.normalizedPhone } });
  if (existing) {
    return tx.customer.update({
      where: { id: existing.id },
      data: {
        name: customer.name,
        phone: customer.phone,
        ...(!existing.email && customer.email ? { email: customer.email } : {}),
      },
    });
  }
  return tx.customer.create({
    data: {
      name: customer.name,
      phone: customer.phone,
      normalizedPhone: customer.normalizedPhone,
      email: customer.email,
      group: 'سایت',
      status: 'active',
    },
  });
}

function orderCode() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `DK-${day}-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

function replayLineKey(item) {
  if (item.laptopId) return `L:${item.laptopId}:${item.quantity}`;
  if (item.warehouseItemId) return `W:${item.warehouseItemId}:${item.quantity}`;
  return `P:${item.productId}:${item.productVariantId || ''}:${item.quantity}`;
}

function assertPublicOrderReplay(order, parsed, productLines) {
  const expectedItems = parsed.type === 'CATALOG_PRODUCT'
    ? productLines.map(item => ({
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      }))
    : parsed.items;
  const expectedKeys = expectedItems.map(replayLineKey).sort();
  const currentKeys = (order.items || []).map(replayLineKey).sort();
  const compatible = order.type === parsed.type
    && order.customerPhoneSnapshot === parsed.customer.normalizedPhone
    && order.payments?.length === 1
    && order.payments[0].method === parsed.paymentMethod
    && expectedKeys.length === currentKeys.length
    && expectedKeys.every((key, index) => key === currentKeys[index]);
  if (!compatible) {
    throw new PublicOrderError(
      'شناسه یکتای سفارش قبلاً برای درخواست دیگری استفاده شده است.',
      409,
      'ORDER_IDEMPOTENCY_KEY_CONFLICT',
    );
  }
}

export async function createPublicOrder(input, idempotencyKey, { authenticatedCustomerId = null } = {}) {
  const parsed = validatePublicOrderInput(input);
  const { values: paymentSettings } = await getSettings(['cardPaymentEnabled', 'onlinePaymentEnabled']);
  if (parsed.paymentMethod === 'ONLINE' && paymentSettings.onlinePaymentEnabled !== true) {
    throw new PublicOrderError('درگاه پرداخت آنلاین هنوز فعال نیست.', 409, 'PAYMENT_METHOD_DISABLED');
  }
  if (parsed.paymentMethod === 'CARD' && paymentSettings.cardPaymentEnabled !== true) {
    throw new PublicOrderError('پرداخت کارت‌به‌کارت در حال حاضر فعال نیست.', 409, 'PAYMENT_METHOD_DISABLED');
  }
  const productInputLines = parsed.type === 'CATALOG_PRODUCT'
    ? parsed.items.map(item => ({
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        requestKey: null,
      }))
    : [];
  let resolvedProductLines = [];
  let pricingSettings = null;
  if (productInputLines.length) {
    try {
      resolvedProductLines = await resolveAuthoritativeProductCartLines(prisma, productInputLines);
      const unavailableProduct = resolvedProductLines.find(item => !item.available);
      if (unavailableProduct) {
        throw new PublicOrderError(
          unavailableProduct.code === 'INVENTORY_NOT_INITIALIZED'
            ? 'موجودی این تنوع هنوز مقداردهی نشده است.'
            : 'موجودی این تنوع برای تعداد درخواستی کافی نیست.',
          409,
          unavailableProduct.code || 'PRODUCT_UNAVAILABLE',
          { items: [{ id: unavailableProduct.productId, productVariantId: unavailableProduct.productVariantId, code: unavailableProduct.code }] },
        );
      }
      const supplyModes = new Set(resolvedProductLines.map(item => item.supplyMode));
      if (supplyModes.size !== 1) {
        throw new PublicOrderError(
          'محصولات با روش‌های تأمین متفاوت باید جداگانه سفارش داده شوند.',
          409,
          'MIXED_FULFILLMENT',
        );
      }
      if (resolvedProductLines[0].supplyMode === 'IRAN_STOCK') {
        return await createFutureIranStockVariantOrder(prisma, {
          orderCode: null,
          orderCodeFactory: orderCode,
          idempotencyKey,
          reservationGroupKey: `checkout:${idempotencyKey}`,
          lines: resolvedProductLines.map(item => ({
            productId: item.productId,
            variantId: item.productVariantId,
            quantity: item.quantity,
          })),
          customerNameSnapshot: parsed.customer.name,
          customerPhoneSnapshot: parsed.customer.normalizedPhone,
          customerEmailSnapshot: parsed.customer.email,
          deliveryAddress: parsed.customer.address,
          notes: parsed.notes,
          paymentMethod: parsed.paymentMethod,
          customerResolver: tx => resolveCustomer(tx, parsed.customer, authenticatedCustomerId),
        });
      }
      pricingSettings = await getPricingSettings();
    } catch (error) {
      if (error instanceof PublicOrderError) throw error;
      if (error?.code && error?.status) {
        throw new PublicOrderError(error.message, error.status, error.code, error.details || null);
      }
      if (error?.code === 'P2034') {
        throw new PublicOrderError('موجودی هم‌زمان تغییر کرد؛ دوباره تلاش کنید.', 409, 'CONCURRENT_UPDATE');
      }
      throw error;
    }
  }

  try {
    return await prisma.$transaction(async tx => {
      const prior = await tx.order.findUnique({ where: { idempotencyKey }, include: { items: true, payments: true } });
      if (prior) {
        assertPublicOrderReplay(prior, parsed, resolvedProductLines);
        return { order: prior, created: false };
      }

      const customer = await resolveCustomer(tx, parsed.customer, authenticatedCustomerId);
      let totalAed = null;
      let totalToman = 0;
      let productSubtotalToman = 0;
      let shippingCostToman = 0;
      let orderItems;
      let productRows = [];
      let laptopRows = [];
      let warehouseRows = [];

      if (parsed.type === 'LAPTOP_STOCK') {
        laptopRows = await tx.laptop.findMany({ where: { id: { in: parsed.items.map(item => item.laptopId) }, archivedAt: null } });
        if (laptopRows.length !== parsed.items.length) {
          const found = new Set(laptopRows.map(item => item.id));
          throw new PublicOrderError('یکی از لپ‌تاپ‌ها پیدا نشد.', 404, 'ITEM_NOT_FOUND', { items: parsed.items.filter(item => !found.has(item.laptopId)).map(item => ({ id: item.laptopId, code: 'ITEM_NOT_FOUND', message: 'لپ‌تاپ پیدا نشد.' })) });
        }
        const byId = new Map(laptopRows.map(item => [item.id, item]));
        orderItems = parsed.items.map(item => {
          const laptop = byId.get(item.laptopId);
          if (laptop.status !== 'AVAILABLE' || laptop.reservedOrderId) throw new PublicOrderError('این لپ‌تاپ دیگر قابل سفارش نیست.', 409, 'OUT_OF_STOCK', { items: [{ id: laptop.id, code: 'OUT_OF_STOCK', message: 'لپ‌تاپ دیگر قابل سفارش نیست.' }] });
          if (!laptop.priceToman || laptop.priceToman.lessThanOrEqualTo(0)) throw new PublicOrderError('قیمت نهایی لپ‌تاپ ثبت نشده است.', 409, 'PRICE_MISSING', { items: [{ id: laptop.id, code: 'PRICE_MISSING', message: 'قیمت نهایی لپ‌تاپ ثبت نشده است.' }] });
          totalToman += Number(laptop.priceToman);
          productSubtotalToman += Number(laptop.priceToman);
          return { name: laptop.name, quantity: 1, priceToman: Number(laptop.priceToman), laptopId: laptop.id, selectedColor: item.selectedColor, selectedSize: item.selectedSize, weight: laptop.weightKg ? Number(laptop.weightKg) : null };
        });
      } else if (parsed.type === 'WAREHOUSE_STOCK') {
        warehouseRows = await tx.warehouseItem.findMany({
          where: { id: { in: parsed.items.map(item => item.warehouseItemId) }, isPublished: true, isArchived: false },
        });
        if (warehouseRows.length !== new Set(parsed.items.map(item => item.warehouseItemId)).size) {
          const found = new Set(warehouseRows.map(item => item.id));
          throw new PublicOrderError('یکی از کالاهای انبار پیدا نشد یا منتشر نشده است.', 404, 'ITEM_NOT_FOUND', {
            items: parsed.items.filter(item => !found.has(item.warehouseItemId)).map(item => ({ id: item.warehouseItemId, code: 'ITEM_NOT_FOUND', message: 'کالای انبار پیدا نشد.' })),
          });
        }
        const byId = new Map(warehouseRows.map(item => [item.id, item]));
        orderItems = parsed.items.map(item => {
          const warehouse = byId.get(item.warehouseItemId);
          const available = getWarehouseAvailableQuantity(warehouse);
          if (available < item.quantity) throw new PublicOrderError('موجودی یکی از کالاهای انبار کافی نیست.', 409, 'OUT_OF_STOCK', { items: [{ id: warehouse.id, code: 'OUT_OF_STOCK', message: 'موجودی کالا کافی نیست.' }] });
          const unitPrice = getWarehouseUnitPriceToman(warehouse);
          totalToman += unitPrice * item.quantity;
          productSubtotalToman += unitPrice * item.quantity;
          return { name: warehouse.name, quantity: item.quantity, priceToman: unitPrice, warehouseItemId: warehouse.id, selectedColor: item.selectedColor, selectedSize: item.selectedSize };
        });
      } else {
        const currentProductLines = await resolveAuthoritativeProductCartLines(tx, productInputLines, { settings: pricingSettings });
        if (currentProductLines.some(item => item.supplyMode !== 'EXTERNAL_DUBAI')) {
          throw new PublicOrderError(
            'روش تأمین محصول هنگام ثبت سفارش تغییر کرده است.',
            409,
            'SUPPLY_MODE_CHANGED',
          );
        }
        productRows = await tx.product.findMany({
          where: { id: { in: currentProductLines.map(item => item.productId) } },
          include: { warehouseItem: true },
        });
        const subtotalAed = currentProductLines.reduce(
          (sum, item) => sum + Number(item.pricing.discountedBasePrice) * item.quantity,
          0,
        );
        const totalWeight = currentProductLines.reduce(
          (sum, item) => sum + Number(item.weight) * item.quantity,
          0,
        );
        const pricing = calculateProductPricing({ priceAed: subtotalAed, weight: totalWeight }, pricingSettings);
        totalAed = pricing.totalAed;
        totalToman = pricing.totalToman;
        productSubtotalToman = Math.round(subtotalAed * pricing.exchangeRate);
        shippingCostToman = Math.round(pricing.shippingAed * pricing.exchangeRate);
        orderItems = [];
        for (const item of currentProductLines) {
          orderItems.push(await buildProductVariantOrderItemSnapshot(tx, {
            productId: item.productId,
            variantId: item.productVariantId,
            quantity: item.quantity,
            pricingContext: { settings: pricingSettings },
          }));
        }
      }

      const order = await tx.order.create({
        data: {
          orderCode: orderCode(),
          idempotencyKey,
          type: parsed.type,
          pricingStatus: 'CONFIRMED',
          customerId: customer.id,
          status: 'pending',
          totalAed,
          totalToman,
          notes: parsed.notes,
          customerNameSnapshot: parsed.customer.name,
          customerPhoneSnapshot: parsed.customer.normalizedPhone,
          customerEmailSnapshot: parsed.customer.email,
          deliveryAddress: parsed.customer.address,
          exchangeRate: pricingSettings ? new Prisma.Decimal(String(pricingSettings.aedRate)) : null,
          commissionPercent: pricingSettings ? new Prisma.Decimal(String(pricingSettings.commissionPercent)) : null,
          shippingPerKgAed: pricingSettings ? new Prisma.Decimal(String(pricingSettings.shippingPerKgAed)) : null,
          productSubtotalToman: new Prisma.Decimal(String(Math.round(productSubtotalToman))),
          shippingCostToman: new Prisma.Decimal(String(Math.round(shippingCostToman))),
          items: { create: orderItems },
          payments: { create: { amount: new Prisma.Decimal(String(Math.round(totalToman))), currency: 'TOMAN', method: parsed.paymentMethod, type: 'INCOME', category: 'سفارشات', status: 'pending' } },
        },
        include: { payments: true },
      });

      for (const laptop of laptopRows) {
        const reserved = await tx.laptop.updateMany({ where: { id: laptop.id, status: 'AVAILABLE', reservedOrderId: null }, data: { status: 'RESERVED', reservedOrderId: order.id } });
        if (reserved.count !== 1) throw new PublicOrderError('این لپ‌تاپ هم‌زمان توسط مشتری دیگری رزرو شد.', 409, 'OUT_OF_STOCK');
      }

      for (const item of parsed.items.filter(item => item.warehouseItemId)) {
        const warehouse = warehouseRows.find(row => row.id === item.warehouseItemId);
        const result = await tx.warehouseItem.updateMany({
          where: {
            id: warehouse.id,
            stock: warehouse.stock,
            reserved: warehouse.reserved,
            isPublished: true,
            isArchived: false,
          },
          data: { reserved: { increment: item.quantity } },
        });
        if (result.count !== 1) throw new PublicOrderError('موجودی هم‌زمان تغییر کرد؛ دوباره تلاش کنید.', 409, 'CONCURRENT_UPDATE');
        await tx.inventoryMovement.create({ data: {
          warehouseItemId: warehouse.id,
          type: 'ORDER_RESERVATION',
          quantityChange: 0,
          quantityBefore: warehouse.stock,
          quantityAfter: warehouse.stock,
          reservedBefore: warehouse.reserved,
          reservedAfter: warehouse.reserved + item.quantity,
          reason: `رزرو فروش مستقیم برای سفارش ${order.orderCode}`,
          orderId: order.id,
        } });
        warehouse.reserved += item.quantity;
      }

      const requestedByProduct = new Map();
      for (const item of parsed.items.filter(item => item.productId)) {
        requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) || 0) + item.quantity);
      }
      for (const [productId, requestedQuantity] of requestedByProduct) {
        const warehouse = productRows.find(product => product.id === productId)?.warehouseItem;
        if (!warehouse) continue;
        if (warehouse.isArchived || warehouse.stock - warehouse.reserved < requestedQuantity) throw new PublicOrderError('موجودی یکی از کالاها کافی نیست.', 409, 'OUT_OF_STOCK', { items: [{ id: productId, code: 'OUT_OF_STOCK', message: 'موجودی کالا کافی نیست.' }] });
        const updated = await tx.warehouseItem.update({ where: { id: warehouse.id }, data: { reserved: { increment: requestedQuantity } } });
        await tx.inventoryMovement.create({ data: { warehouseItemId: warehouse.id, type: 'ORDER_RESERVATION', quantityChange: 0, quantityBefore: warehouse.stock, quantityAfter: warehouse.stock, reservedBefore: warehouse.reserved, reservedAfter: updated.reserved, reason: `رزرو برای سفارش ${order.orderCode}`, orderId: order.id } });
      }
      return { order, created: true };
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof PublicOrderError) throw error;
    if (error?.code && error?.status) {
      throw new PublicOrderError(error.message, error.status, error.code, error.details || null);
    }
    if (error?.code === 'P2002') {
      const prior = await prisma.order.findUnique({ where: { idempotencyKey }, include: { items: true, payments: true } });
      if (prior) {
        assertPublicOrderReplay(prior, parsed, resolvedProductLines);
        return { order: prior, created: false };
      }
      throw new PublicOrderError('شماره سفارش تکراری شد؛ دوباره تلاش کنید.', 409, 'ORDER_CODE_CONFLICT');
    }
    if (error?.code === 'P2034') throw new PublicOrderError('موجودی هم‌زمان تغییر کرد؛ دوباره تلاش کنید.', 409, 'CONCURRENT_UPDATE');
    throw error;
  }
}

export function serializePublicOrder(order) {
  return {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    type: order.type,
    pricingStatus: order.pricingStatus,
    totalToman: order.totalToman,
    paymentStatus: order.payments?.[0]?.status || 'pending',
    paymentMethod: order.payments?.[0]?.method || null,
    paymentAvailable: false,
  };
}
