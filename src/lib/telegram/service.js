import 'server-only';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSettings, getPricingSettings } from '@/lib/settings';
import { PUBLIC_PRODUCT_SELECT, publicProductCardPriceSummary, serializePublicProduct } from '@/lib/publicCatalog';
import { TELEGRAM_SETTING_KEYS, telegramConfiguration, TelegramError, safeTelegramError, TELEGRAM_ERRORS } from './domain.js';
import { buildTelegramProductPost } from './message.js';
import { createTelegramClient } from './client.js';
import { createPublicationDelivery } from './delivery.js';

export async function getTelegramConfiguration() {
  const { values } = await getSettings(TELEGRAM_SETTING_KEYS);
  return telegramConfiguration(values, process.env);
}
function client() { return createTelegramClient({ token: process.env.TELEGRAM_BOT_TOKEN?.trim() }); }
async function productPost(id) {
  const product = await prisma.product.findFirst({ where: { id, status: 'active' }, select: PUBLIC_PRODUCT_SELECT });
  if (!product) return null;
  let pricing = null;
  // Unconfigured pricing omits price instead of exposing costs or inventing a quote.
  try {
    const settings = product.supplyMode === 'EXTERNAL_DUBAI' ? await getPricingSettings() : null;
    pricing = publicProductCardPriceSummary(product, settings);
  } catch {}
  return buildTelegramProductPost({ ...serializePublicProduct(product), cardPricing: pricing });
}
const delivery = createPublicationDelivery({ db: prisma, getConfiguration: getTelegramConfiguration, getProductPost: productPost, getClient: client });
export function scheduleTelegramPublication(productId) {
  try {
    after(async () => {
      try { await delivery.deliver(productId, { automatic: true }); }
      catch { console.warn('TELEGRAM_DELIVERY_DEFERRED: inspect Product delivery status'); }
    });
  } catch { console.warn('TELEGRAM_DELIVERY_DEFERRED: inspect Product delivery status'); }
}
export function serializeTelegramPublication(row) {
  if (!row) return null;
  return { id: row.id, destination: row.destination, status: row.status, attemptCount: row.attemptCount,
    telegramMessageId: row.telegramMessageId, telegramChatId: row.telegramChatId, sentAt: row.sentAt,
    updatedAt: row.updatedAt, retryAfter: row.retryAfter, uncertain: row.uncertain,
    lastError: row.lastError ? (TELEGRAM_ERRORS[row.lastError] || TELEGRAM_ERRORS.TELEGRAM_UNAVAILABLE) : null,
  };
}
export async function telegramProductStatus(id) {
  const product = await prisma.product.findUnique({ where: { id }, select: { status: true } });
  if (!product) throw new TelegramError('PRODUCT_NOT_PUBLISHED');
  return { publication: serializeTelegramPublication(await delivery.read(id)), published: product.status === 'active', configuration: await getTelegramConfiguration() };
}
export async function sendProductToTelegram(id, input) {
  return serializeTelegramPublication(await delivery.deliver(id, input));
}
export async function telegramConnectionAction(action) {
  const configuration = await getTelegramConfiguration();
  if (configuration.code) throw new TelegramError(configuration.code);
  if (action === 'test-message') {
    const result = await client().sendTestMessage(configuration.channel);
    return { sent: true, messageId: String(result.message_id) };
  }
  return client().testConnection(configuration.channel);
}
export function telegramApiFailure(error) {
  const safe = safeTelegramError(error);
  return { error: safe.message, code: safe.code };
}
