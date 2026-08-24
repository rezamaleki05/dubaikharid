import 'server-only';

import { randomUUID } from 'node:crypto';
import { del, get, put } from '@vercel/blob';

export class ReceiptStorageConfigurationError extends Error {
  constructor() {
    super('Private payment receipt storage is not configured.');
    this.name = 'ReceiptStorageConfigurationError';
  }
}

function token() {
  const value = process.env.PAYMENT_RECEIPT_BLOB_READ_WRITE_TOKEN;
  if (typeof value !== 'string' || !value.trim()) throw new ReceiptStorageConfigurationError();
  return value.trim();
}

export async function storePrivatePaymentReceipt({ paymentId, bytes, contentType, extension }) {
  const pathname = `payment-receipts/${new Date().getUTCFullYear()}/${paymentId}/${randomUUID()}.${extension}`;
  return put(pathname, bytes, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType,
    token: token(),
  });
}

export async function readPrivatePaymentReceipt(pathname) {
  return get(pathname, { access: 'private', useCache: false, token: token() });
}

export async function deletePrivatePaymentReceipt(pathname) {
  if (!pathname) return;
  await del(pathname, { token: token() });
}
