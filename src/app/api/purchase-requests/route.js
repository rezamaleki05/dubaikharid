import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { logAdminActivity } from '@/lib/adminActivity';
import { normalizeCustomerPhone } from '@/lib/adminCustomers';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { normalizeProductSourceUrl } from '@/lib/externalUrls';
import { prisma } from '@/lib/prisma';
import { publicRequestGuard, readIdempotencyKey } from '@/lib/publicRequestGuard';

function clean(value, maximum, required = false) {
  if (value === null || value === undefined || value === '') return required ? null : '';
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return (!result && required) || result.length > maximum ? null : result;
}

function requestCode() {
  return `REQ-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

export async function POST(request) {
  const guard = publicRequestGuard(request);
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const idempotencyKey = readIdempotencyKey(request);
  if (!idempotencyKey) return NextResponse.json({ error: 'شناسه یکتای درخواست معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { body = null; }
  const authenticatedCustomer = await getCurrentCustomer();
  const allowed = new Set(['customer', 'productUrl', 'productName', 'sourceStore', 'priceAed', 'weight', 'quantity', 'notes']);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.has(key))) {
    return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  }
  const customerBody = body.customer;
  if (!customerBody || typeof customerBody !== 'object' || Array.isArray(customerBody) || Object.keys(customerBody).some(key => !['name', 'phone', 'email', 'address'].includes(key))) {
    return NextResponse.json({ error: 'اطلاعات مشتری معتبر نیست.' }, { status: 400 });
  }
  const name = clean(customerBody.name, 160, true);
  const phone = clean(customerBody.phone, 40, true);
  const normalizedPhone = normalizeCustomerPhone(phone || '');
  const email = clean(customerBody.email, 320)?.toLowerCase() || null;
  const address = clean(customerBody.address, 1000) || null;
  const productName = clean(body.productName, 300, true);
  const productUrl = normalizeProductSourceUrl(body.productUrl);
  const sourceStore = clean(body.sourceStore, 160) || null;
  const notes = clean(body.notes, 4000) || null;
  const priceAed = Number(body.priceAed);
  const weight = Number(body.weight);
  const quantity = Number(body.quantity ?? 1);
  if (!name || !normalizedPhone || !productName || !productUrl || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20 || !Number.isFinite(priceAed) || priceAed < 0 || !Number.isFinite(weight) || weight < 0 || weight > 10000) {
    return NextResponse.json({ error: 'اطلاعات درخواست خرید معتبر نیست.' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const prior = await tx.purchaseRequest.findUnique({ where: { idempotencyKey } });
      if (prior) return { record: prior, created: false };
      let customer = authenticatedCustomer
        ? await tx.customer.findUnique({ where: { id: authenticatedCustomer.id } })
        : await tx.customer.findUnique({ where: { normalizedPhone } });
      if (!customer) {
        customer = await tx.customer.create({ data: { name, phone, normalizedPhone, email, group: 'سایت', status: 'active' } });
      } else if (!authenticatedCustomer) {
        customer = await tx.customer.update({ where: { id: customer.id }, data: { name, phone, ...(!customer.email && email ? { email } : {}) } });
      }
      const record = await tx.purchaseRequest.create({
        data: { customerId: customer.id, productUrl, productName, sourceStore, priceAed, weight, finalToman: null, status: 'pending', note: notes, requestCode: requestCode(), idempotencyKey, quantity, deliveryAddress: address },
      });
      return { record, created: true };
    }, { isolationLevel: 'Serializable' });
    if (result.created) await logAdminActivity({ action: 'PURCHASE_REQUEST_CREATED', entityType: 'PurchaseRequest', entityId: result.record.id, metadata: { requestCode: result.record.requestCode, customerId: result.record.customerId }, request });
    return NextResponse.json({ data: { id: result.record.id, requestCode: result.record.requestCode, status: result.record.status, pricingStatus: 'ESTIMATED', finalToman: result.record.finalToman } }, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error?.code === 'P2002') {
      const prior = await prisma.purchaseRequest.findUnique({ where: { idempotencyKey } });
      if (prior) return NextResponse.json({ data: { id: prior.id, requestCode: prior.requestCode, status: prior.status, pricingStatus: 'ESTIMATED', finalToman: prior.finalToman } }, { status: 200 });
    }
    console.error('Error creating purchase request:', error);
    return NextResponse.json({ error: 'ثبت درخواست خرید با خطا مواجه شد.' }, { status: 500 });
  }
}
