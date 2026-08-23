import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client';
import { normalizeCustomerPhone } from '@/lib/adminCustomers';
import { calculateProductPricing } from '@/lib/pricing';
import { prisma } from '@/lib/prisma';
import { getPricingSettings } from '@/lib/settings';

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
    const itemAllowed = new Set(['productId', 'laptopId', 'quantity', 'selectedColor', 'selectedSize']);
    if (Object.keys(item).some(key => !itemAllowed.has(key))) throw new PublicOrderError('فیلد غیرمجاز در قلم سفارش وجود دارد.');
    const productId = text(item.productId, 160);
    const laptopId = text(item.laptopId, 160);
    if (Boolean(productId) === Boolean(laptopId)) throw new PublicOrderError('مرجع کالای سفارش معتبر نیست.');
    const itemQuantity = quantity(item.quantity);
    if (laptopId && itemQuantity !== 1) throw new PublicOrderError('هر لپ‌تاپ استوک یک واحد مستقل است.');
    return {
      productId,
      laptopId,
      quantity: itemQuantity,
      selectedColor: text(item.selectedColor, 120),
      selectedSize: text(item.selectedSize, 120),
    };
  });
  const hasLaptop = items.some(item => item.laptopId);
  const hasProduct = items.some(item => item.productId);
  if (hasLaptop && hasProduct) throw new PublicOrderError('لپ‌تاپ استوک و کالای معمولی باید در سفارش‌های جدا ثبت شوند.');
  if (hasLaptop && new Set(items.map(item => item.laptopId)).size !== items.length) {
    throw new PublicOrderError('هر لپ‌تاپ استوک فقط یک‌بار قابل ثبت است.');
  }
  if (hasProduct) {
    const totals = new Map();
    for (const item of items) totals.set(item.productId, (totals.get(item.productId) || 0) + item.quantity);
    if ([...totals.values()].some(total => total > 20)) throw new PublicOrderError('حداکثر تعداد مجاز هر کالا ۲۰ عدد است.');
  }
  return { customer, items, paymentMethod: body.paymentMethod, notes, type: hasLaptop ? 'LAPTOP_STOCK' : 'CATALOG_PRODUCT' };
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

export async function createPublicOrder(input, idempotencyKey, { authenticatedCustomerId = null } = {}) {
  const parsed = validatePublicOrderInput(input);
  const pricingSettings = parsed.type === 'CATALOG_PRODUCT' ? await getPricingSettings() : null;

  try {
    return await prisma.$transaction(async tx => {
      const prior = await tx.order.findUnique({ where: { idempotencyKey }, include: { payments: true } });
      if (prior) return { order: prior, created: false };

      const customer = await resolveCustomer(tx, parsed.customer, authenticatedCustomerId);
      let totalAed = null;
      let totalToman = 0;
      let productSubtotalToman = 0;
      let shippingCostToman = 0;
      let orderItems;
      let productRows = [];
      let laptopRows = [];

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
      } else {
        productRows = await tx.product.findMany({ where: { id: { in: parsed.items.map(item => item.productId) }, status: 'active' }, include: { warehouseItem: true } });
        if (productRows.length !== new Set(parsed.items.map(item => item.productId)).size) {
          const found = new Set(productRows.map(item => item.id));
          throw new PublicOrderError('یکی از کالاها پیدا نشد یا غیرفعال است.', 404, 'ITEM_NOT_FOUND', { items: parsed.items.filter(item => !found.has(item.productId)).map(item => ({ id: item.productId, code: 'ITEM_NOT_FOUND', message: 'کالا پیدا نشد یا غیرفعال است.' })) });
        }
        const byId = new Map(productRows.map(item => [item.id, item]));
        const subtotalAed = parsed.items.reduce((sum, item) => {
          const product = byId.get(item.productId);
          return sum + Number(product.priceAed) * (product.hasDiscount ? 1 - product.discountPercent / 100 : 1) * item.quantity;
        }, 0);
        const totalWeight = parsed.items.reduce((sum, item) => sum + byId.get(item.productId).weight * item.quantity, 0);
        const pricing = calculateProductPricing({ priceAed: subtotalAed, weight: totalWeight }, pricingSettings);
        totalAed = pricing.totalAed;
        totalToman = pricing.totalToman;
        productSubtotalToman = Math.round(subtotalAed * pricing.exchangeRate);
        shippingCostToman = Math.round(pricing.shippingAed * pricing.exchangeRate);
        orderItems = parsed.items.map(item => {
          const product = byId.get(item.productId);
          const unitAed = Number(product.priceAed) * (product.hasDiscount ? 1 - product.discountPercent / 100 : 1);
          return { name: product.name, quantity: item.quantity, priceAed: unitAed, priceToman: Math.round(unitAed * pricing.exchangeRate), productId: product.id, selectedColor: item.selectedColor, selectedSize: item.selectedSize, weight: product.weight };
        });
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
    if (error?.code === 'P2002') {
      const prior = await prisma.order.findUnique({ where: { idempotencyKey }, include: { payments: true } });
      if (prior) return { order: prior, created: false };
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
