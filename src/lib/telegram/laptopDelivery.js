import { randomUUID } from 'node:crypto';
import { isSellableLaptopUnit } from '../laptopSeoDomain.js';
import { TelegramError, safeTelegramError } from './domain.js';

export const TELEGRAM_LEASE_MS = 120_000;
export function createLaptopPublicationDelivery({ db, getConfiguration, getProductPost, getClient, now = () => new Date() }) {
  const records = db.laptopTelegramPublication;
  async function read(laptopId) {
    // A terminated worker may have posted. Never automatically replay its claim.
    await records.updateMany({ where: { laptopId, status: 'PENDING', lockedAt: { lt: new Date(now().getTime() - TELEGRAM_LEASE_MS) } },
      data: { status: 'FAILED', uncertain: true, lastError: 'TELEGRAM_DELIVERY_UNCERTAIN', lockedAt: null, claimToken: null } });
    return records.findUnique({ where: { laptopId } });
  }
  async function deliver(laptopId, { automatic = false, confirmRepost = false, expectedAttemptCount = 0 } = {}) {
    const product = await db.laptop.findUnique({ where: { id: laptopId }, select: { id: true, status: true, archivedAt: true, reservedOrderId: true, brand: true, model: true, series: true, priceToman: true } });
    if (!isSellableLaptopUnit(product)) throw new TelegramError('PRODUCT_NOT_PUBLISHED');
    let row = await read(laptopId);
    if (automatic && (!row || row.status !== 'PENDING' || row.lockedAt)) return row;
    const config = await getConfiguration();
    if (!automatic && config.code) throw new TelegramError(config.code);
    if (!row) {
      row = await records.upsert({ where: { laptopId }, create: { laptopId, destination: config.channel || '' }, update: {} });
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
    if (!claim.count) return read(laptopId);
    const destination = automatic ? row.destination : config.channel;
    try {
      if (config.code) throw new TelegramError(config.code);
      if (automatic && !config.autoPublish) throw new TelegramError('TELEGRAM_AUTO_PUBLISH_DISABLED');
      if (automatic && destination !== config.channel) throw new TelegramError('TELEGRAM_DESTINATION_CHANGED');
      // Re-read public data after the claim; hidden products cannot be sent.
      const post = await getProductPost(laptopId);
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
    return read(laptopId);
  }
  return { read, deliver };
}
