import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { getDefaultActiveBankAccount, serializeBankAccount } from '@/lib/bankAccounts';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { getCustomerSessionSecret } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';

const ISSUER = 'dubai-kharid-manual-payment';
const AUDIENCE = 'dubai-kharid-receipt-upload';

function signingKey() {
  return new TextEncoder().encode(getCustomerSessionSecret());
}

export async function issueReceiptCapability({ orderId, paymentId, customerId }) {
  return new SignJWT({ orderId, paymentId, customerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(paymentId)
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(signingKey());
}

export async function verifyReceiptCapability(token) {
  if (typeof token !== 'string' || !token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { issuer: ISSUER, audience: AUDIENCE });
    if (typeof payload.orderId !== 'string' || typeof payload.paymentId !== 'string' || typeof payload.customerId !== 'string') return null;
    return { orderId: payload.orderId, paymentId: payload.paymentId, customerId: payload.customerId };
  } catch {
    return null;
  }
}

function bearerToken(request) {
  const authorization = request?.headers?.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

export async function authorizeCustomerPaymentRequest(request, payment) {
  const customer = await getCurrentCustomer();
  if (customer?.id && payment.order?.customerId === customer.id) return { customer, capability: null };
  const capability = await verifyReceiptCapability(bearerToken(request));
  if (capability && capability.paymentId === payment.id && capability.orderId === payment.orderId
    && capability.customerId === payment.order?.customerId) return { customer: null, capability };
  return null;
}

export function serializeCustomerPayment(payment) {
  return {
    id: payment.id,
    method: payment.method,
    status: payment.status,
    amount: Number(payment.amount),
    hasReceipt: Boolean(payment.receiptBlobPathname),
    receiptOriginalName: payment.receiptOriginalName || null,
    receiptMimeType: payment.receiptMimeType || null,
    receiptSizeBytes: payment.receiptSizeBytes || null,
    receiptSubmittedAt: payment.receiptSubmittedAt || null,
    rejectionReason: payment.rejectionReason || null,
    receiptUrl: payment.receiptBlobPathname ? `/api/payments/${encodeURIComponent(payment.id)}/receipt` : null,
  };
}

export async function getManualPaymentConfiguration() {
  const [{ values }, account] = await Promise.all([
    getSettings(['cardPaymentEnabled', 'onlinePaymentEnabled', 'whatsapp']),
    getDefaultActiveBankAccount(),
  ]);
  return {
    cardPaymentEnabled: values.cardPaymentEnabled === true,
    onlinePaymentEnabled: values.onlinePaymentEnabled === true,
    whatsapp: values.whatsapp || '',
    bankAccount: account ? serializeBankAccount(account) : null,
  };
}

export async function buildManualPaymentAccess(order, { includeCapability = false } = {}) {
  const payment = order.payments?.find(item => item.method === 'CARD' && !['refunded'].includes(item.status)) || null;
  if (!payment || !order.customerId || order.status === 'cancelled') return null;
  const configuration = await getManualPaymentConfiguration();
  return {
    payment: serializeCustomerPayment(payment),
    bankAccount: configuration.cardPaymentEnabled ? configuration.bankAccount : null,
    cardPaymentEnabled: configuration.cardPaymentEnabled,
    onlinePaymentEnabled: configuration.onlinePaymentEnabled,
    whatsapp: configuration.whatsapp,
    uploadToken: includeCapability
      ? await issueReceiptCapability({ orderId: order.id, paymentId: payment.id, customerId: order.customerId })
      : null,
  };
}

export async function getOwnedOrderForManualPayment(orderIdentifier, customerId) {
  return prisma.order.findFirst({
    where: { customerId, OR: [{ id: orderIdentifier }, { orderCode: orderIdentifier }] },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  });
}
