import { randomUUID } from 'node:crypto';
import { TelegramError, safeTelegramError } from './domain.js';

export const TELEGRAM_LEASE_MS = 120_000;
export function createPublicationDelivery({ db, getConfiguration, getProductPost, getClient, now = () => new Date() }) {
  const records = db.telegramPublication;
  async function read(productId) {
    // A terminated worker may have posted. Never automatically replay its claim.
    await records.updateMany({ where: { productId, status: 'PENDING', lockedAt: { lt: new Date(now().getTime() - TELEGRAM_LEASE_MS) } },
      data: { status: 'FAILED', uncertain: true, lastError: 'TELEGRAM_DELIVERY_UNCERTAIN', lockedAt: null, claimToken: null } });
    return records.findUnique({ where: { productId } });
  }
  async function deliver(productId, { automatic = false, confirmRepost = false, expectedAttemptCount = 0 } = {}) {
    const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
    if (!product || product.status !== 'active') throw new TelegramError('PRODUCT_NOT_PUBLISHED');
    let row = await read(productId);
    if (automatic && (!row || row.status !== 'PENDING' || row.lockedAt)) return row;
    const config = await getConfiguration();
    if (!automatic && config.code) throw new TelegramError(config.code);
    if (!row) {
      row = await records.upsert({ where: { productId }, create: { productId, destination: config.channel || '' }, update: {} });
    }
    if (row.lockedAt) return row;
    if (!automatic && row.attemptCount !== expectedAttemptCount) throw new TelegramError('TELEGRAM_STALE_REQUEST');
    if (!automatic && (row.sentAt || row.uncertain) && !confirmRepost) throw new TelegramError('TELEGRAM_CONFIRM_REQUIRED');
    if (row.retryAfter && new Date(row.retryAfter) > now()) throw new TelegramError('TELEGRAM_RATE_LIMITED');
    const claimToken = randomUUID();
    const claim = await records.updateMany({
      where: { id: row.id, attemptCount: row.attemptCount, lockedAt: null, status: row.status },
      data: { status: 'PENDING', lockedAt: now(), claimToken, attemptCount: { increment: 1 }, lastError: null, retryAfter: null,
        ...(!automatic ? { destination: config.channel } : {}) },
    });
    if (!claim.count) return read(productId);
    const destination = automatic ? row.destination : config.channel;
    try {
      if (config.code) throw new TelegramError(config.code);
      if (automatic && !config.autoPublish) throw new TelegramError('TELEGRAM_AUTO_PUBLISH_DISABLED');
      if (automatic && destination !== config.channel) throw new TelegramError('TELEGRAM_DESTINATION_CHANGED');
      // Re-read public data after the claim; hidden products cannot be sent.
      const post = await getProductPost(productId);
      if (!post) throw new TelegramError('PRODUCT_NOT_PUBLISHED');
      const sent = await getClient().sendProductPost(destination, post);
      if (!sent?.message_id || sent.chat?.id == null) throw new TelegramError('TELEGRAM_DELIVERY_UNCERTAIN', { uncertain: true });
      try {
        await records.updateMany({ where: { id: row.id, claimToken }, data: {
          status: 'SENT', telegramMessageId: String(sent.message_id), telegramChatId: String(sent.chat.id),
          sentAt: now(), lockedAt: null, claimToken: null, uncertain: false, lastError: null,
        } });
      } catch { throw new TelegramError('TELEGRAM_STORAGE_FAILED', { uncertain: true }); }
    } catch (error) {
      const safe = safeTelegramError(error);
      await records.updateMany({ where: { id: row.id, claimToken }, data: {
        status: 'FAILED', lastError: safe.code, uncertain: safe.uncertain || row.uncertain,
        retryAfter: safe.retryAfter ? new Date(now().getTime() + safe.retryAfter * 1000) : null,
        lockedAt: null, claimToken: null,
      } });
    }
    return read(productId);
  }
  return { read, deliver };
}
