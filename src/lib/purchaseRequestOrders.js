import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client';

function orderCode() {
  return `DK-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

export async function convertPurchaseRequestInTransaction(tx, current, { overrides = {}, markPaid = false, confirmedById = null } = {}) {
  const requestData = overrides;
  if (current.order) return current;
  const finalToman = Number(requestData.finalToman ?? current.finalToman);
  const priceAed = Number(requestData.priceAed ?? current.priceAed ?? 0);
  const weight = Number(requestData.weight ?? current.weight ?? 0);
  if (!Number.isFinite(finalToman) || finalToman <= 0) throw new Error('FINAL_PRICE_REQUIRED');
  if (!['price_tagged', 'approved'].includes(current.status)) throw new Error('REQUEST_NOT_PAYABLE');
  const order = await tx.order.create({
    data: {
      orderCode: orderCode(),
      type: 'EXTERNAL_PURCHASE',
      pricingStatus: 'CONFIRMED',
      purchaseRequestId: current.id,
      customerId: current.customerId,
      customerNameSnapshot: current.customer?.name,
      customerPhoneSnapshot: current.customer?.normalizedPhone,
      customerEmailSnapshot: current.customer?.email,
      deliveryAddress: current.deliveryAddress,
      status: markPaid ? 'paid' : 'pricing',
      totalAed: priceAed,
      totalToman: finalToman,
      notes: current.note,
      productSubtotalToman: new Prisma.Decimal(String(Math.round(finalToman))),
      items: { create: { name: current.productName || 'سفارش خرید خارجی', quantity: current.quantity, priceAed: priceAed || null, priceToman: finalToman / current.quantity, weight } },
      payments: { create: { amount: new Prisma.Decimal(String(Math.round(finalToman))), currency: 'TOMAN', method: 'CARD', type: 'INCOME', category: 'سفارشات', status: markPaid ? 'success' : 'pending', paidAt: markPaid ? new Date() : null, confirmedById: markPaid ? confirmedById : null } },
    },
  });
  await tx.purchaseRequest.update({ where: { id: current.id }, data: { ...requestData, status: 'converted' } });
  return tx.purchaseRequest.findUnique({ where: { id: current.id }, include: { customer: true, order: { include: { payments: true } } } });
}
