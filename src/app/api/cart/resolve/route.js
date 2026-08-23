import { NextResponse } from 'next/server';
import { cartItemKey, CART_ITEM_TYPES, MAX_PRODUCT_QUANTITY } from '@/lib/clientCollectionState';
import { prisma } from '@/lib/prisma';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

function cleanText(value, maximum, { required = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) throw new Error('INVALID_INPUT');
    return null;
  }
  if (typeof value !== 'string') throw new Error('INVALID_INPUT');
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maximum) throw new Error('INVALID_INPUT');
  return cleaned || null;
}

function parseItems(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => key !== 'items')) {
    throw new Error('INVALID_INPUT');
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100) throw new Error('INVALID_INPUT');
  return body.items.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('INVALID_INPUT');
    const allowed = new Set(['type', 'id', 'quantity', 'selectedColor', 'selectedSize']);
    if (Object.keys(item).some(key => !allowed.has(key)) || !CART_ITEM_TYPES.has(item.type)) throw new Error('INVALID_INPUT');
    const quantity = item.quantity === undefined ? 1 : Number(item.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_PRODUCT_QUANTITY || (item.type === 'LAPTOP' && quantity !== 1)) {
      throw new Error('INVALID_INPUT');
    }
    const parsed = {
      type: item.type,
      id: cleanText(item.id, 160, { required: true }),
      quantity,
      selectedColor: cleanText(item.selectedColor, 120),
      selectedSize: cleanText(item.selectedSize, 120),
    };
    return { ...parsed, key: cartItemKey(parsed) };
  });
}

export async function POST(request) {
  const guard = publicRequestGuard(request, { limit: 60 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  let body;
  try { body = await request.json(); } catch { body = null; }

  try {
    const items = parseItems(body);
    const productIds = [...new Set(items.filter(item => item.type === 'PRODUCT').map(item => item.id))];
    const laptopIds = [...new Set(items.filter(item => item.type === 'LAPTOP').map(item => item.id))];
    const [products, laptops] = await Promise.all([
      productIds.length ? prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true, name: true, priceAed: true, weight: true, originalLink: true, image: true,
          discountPercent: true, hasDiscount: true, status: true,
          brand: { select: { name: true, faName: true } },
          store: { select: { name: true } },
          warehouseItem: { select: { stock: true, reserved: true, isArchived: true } },
        },
      }) : [],
      laptopIds.length ? prisma.laptop.findMany({
        where: { id: { in: laptopIds } },
        select: {
          id: true, name: true, brand: true, model: true, cpu: true, ram: true, storage: true,
          priceToman: true, weightKg: true, image: true, status: true, archivedAt: true, reservedOrderId: true,
        },
      }) : [],
    ]);
    const productsById = new Map(products.map(product => [product.id, product]));
    const laptopsById = new Map(laptops.map(laptop => [laptop.id, laptop]));
    const requestedByProduct = new Map();
    for (const item of items.filter(candidate => candidate.type === 'PRODUCT')) {
      requestedByProduct.set(item.id, (requestedByProduct.get(item.id) || 0) + item.quantity);
    }

    const resolved = items.map(item => {
      if (item.type === 'EXTERNAL_PRODUCT') {
        return { ...item, available: true, authoritative: false };
      }
      if (item.type === 'PRODUCT') {
        const product = productsById.get(item.id);
        if (!product) return { ...item, available: false, authoritative: true, code: 'NOT_FOUND' };
        const warehouseAvailable = !product.warehouseItem
          || (!product.warehouseItem.isArchived && product.warehouseItem.stock - product.warehouseItem.reserved >= requestedByProduct.get(item.id));
        return {
          ...item,
          available: product.status === 'active' && warehouseAvailable,
          authoritative: true,
          code: product.status !== 'active' ? 'INACTIVE' : warehouseAvailable ? null : 'OUT_OF_STOCK',
          name: product.name,
          brand: product.brand?.faName || product.brand?.name || '',
          store: product.store?.name || '',
          image: product.image || '',
          originalLink: product.originalLink || '',
          priceAed: Number(product.priceAed),
          weight: product.weight,
          discountPercent: product.hasDiscount ? product.discountPercent : 0,
          productId: product.id,
        };
      }
      const laptop = laptopsById.get(item.id);
      if (!laptop) return { ...item, available: false, authoritative: true, code: 'NOT_FOUND' };
      const available = laptop.status === 'AVAILABLE' && !laptop.archivedAt && !laptop.reservedOrderId && Number(laptop.priceToman) > 0;
      return {
        ...item,
        available,
        authoritative: true,
        code: available ? null : laptop.status === 'AVAILABLE' && !laptop.priceToman ? 'PRICE_MISSING' : 'OUT_OF_STOCK',
        name: laptop.name,
        brand: laptop.brand || '',
        spec: [laptop.model, laptop.cpu, laptop.ram, laptop.storage].filter(Boolean).join(' | '),
        image: laptop.image || '',
        priceToman: laptop.priceToman ? Number(laptop.priceToman) : null,
        weight: laptop.weightKg ? Number(laptop.weightKg) : null,
        laptopId: laptop.id,
      };
    });

    return NextResponse.json({ data: { items: resolved } });
  } catch (error) {
    if (error?.message === 'INVALID_INPUT') return NextResponse.json({ error: 'اقلام درخواست معتبر نیستند.' }, { status: 400 });
    console.error('Error resolving cart items:', error);
    return NextResponse.json({ error: 'به‌روزرسانی اطلاعات کالاها انجام نشد.' }, { status: 500 });
  }
}
