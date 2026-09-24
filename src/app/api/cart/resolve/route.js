import { NextResponse } from 'next/server';
import { cartItemKey, CART_ITEM_TYPES, MAX_PRODUCT_QUANTITY } from '@/lib/clientCollectionState';
import { prisma } from '@/lib/prisma';
import { resolvePublicProductCartLines } from '@/lib/productCartService';
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
    const allowed = new Set(['type', 'id', 'productId', 'productVariantId', 'quantity', 'selectedColor', 'selectedSize']);
    if (Object.keys(item).some(key => !allowed.has(key)) || !CART_ITEM_TYPES.has(item.type)) throw new Error('INVALID_INPUT');
    const quantity = item.quantity === undefined ? 1 : Number(item.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_PRODUCT_QUANTITY || (item.type === 'LAPTOP' && quantity !== 1)) {
      throw new Error('INVALID_INPUT');
    }
    const legacyId = cleanText(item.id, 160);
    const productId = cleanText(item.productId, 160);
    if (item.type === 'PRODUCT' && legacyId && productId && legacyId !== productId) throw new Error('INVALID_INPUT');
    if (item.type !== 'PRODUCT' && (productId || item.productVariantId !== undefined)) throw new Error('INVALID_INPUT');
    const resolvedId = item.type === 'PRODUCT' ? productId || legacyId : legacyId;
    if (!resolvedId) throw new Error('INVALID_INPUT');
    const parsed = {
      type: item.type,
      id: resolvedId,
      productVariantId: item.type === 'PRODUCT' ? cleanText(item.productVariantId, 160) : null,
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
    const directProductLines = items.filter(item => item.type === 'PRODUCT').map(item => ({
      productId: item.id,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      requestKey: item.key,
    }));
    const laptopIds = [...new Set(items.filter(item => item.type === 'LAPTOP').map(item => item.id))];
    const [laptops, productResults] = await Promise.all([
      laptopIds.length ? prisma.laptop.findMany({
        where: { id: { in: laptopIds } },
        select: {
          id: true, name: true, brand: true, model: true, cpu: true, ram: true, storage: true,
          priceToman: true, weightKg: true, image: true, status: true, archivedAt: true, reservedOrderId: true,
        },
      }) : [],
      directProductLines.length ? resolvePublicProductCartLines(prisma, directProductLines) : [],
    ]);
    const normalizedProductResults = productResults.map(result => ({
          ...result,
          key: result.type === 'PRODUCT' && result.productVariantId
            ? cartItemKey({ type: 'PRODUCT', id: result.productId, productVariantId: result.productVariantId })
            : result.key,
        }));
    const productsByKey = new Map(normalizedProductResults.map(product => [product.requestKey, product]));
    const laptopsById = new Map(laptops.map(laptop => [laptop.id, laptop]));
    const resolved = items.map(item => {
      if (item.type === 'EXTERNAL_PRODUCT') {
        return { ...item, available: true, authoritative: false };
      }
      if (item.type === 'PRODUCT') {
        return productsByKey.get(item.key)
          || { ...item, available: false, authoritative: true, code: 'PRODUCT_UNAVAILABLE' };
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
