import 'server-only';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { TELEGRAM_SETTING_KEYS, TelegramError } from './domain.js';
import { laptopTelegramConfiguration } from './laptopDomain.js';
import { createTelegramClient } from './client.js';
import { createLaptopPublicationDelivery } from './laptopDelivery.js';
import { buildTelegramLaptopPost } from './laptopMessage.js';
import { getPublicLaptopModelForUnit } from '@/lib/publicLaptopSeo';
import { serializeTelegramPublication } from './service.js';
import { isSellableLaptopUnit } from '../laptopSeoDomain.js';
export async function getLaptopTelegramConfiguration() {
  const { values } = await getSettings([...TELEGRAM_SETTING_KEYS, 'telegramAutoPublishLaptops']);
  return laptopTelegramConfiguration(values, process.env);
}
const delivery = createLaptopPublicationDelivery({ db: prisma, getConfiguration: getLaptopTelegramConfiguration,
  getClient: () => createTelegramClient({ token: process.env.TELEGRAM_BOT_TOKEN?.trim() }),
  getProductPost: async id => {
    const group = await getPublicLaptopModelForUnit(id);
    const unit = group?.units.find(unit => unit.id === id);
    return unit ? buildTelegramLaptopPost({ ...unit, slug: group.slug }) : null;
  },
});
export function scheduleLaptopTelegramPublication(id) {
  try { after(async () => { try { await delivery.deliver(id, { automatic: true }); } catch { console.warn('LAPTOP_TELEGRAM_DELIVERY_DEFERRED'); } }); }
  catch { console.warn('LAPTOP_TELEGRAM_DELIVERY_DEFERRED'); }
}
export async function telegramLaptopStatus(id) {
  const laptop = await prisma.laptop.findUnique({ where: { id } });
  if (!laptop) throw new TelegramError('PRODUCT_NOT_PUBLISHED');
  return { publication: serializeTelegramPublication(await delivery.read(id)), published: isSellableLaptopUnit(laptop), configuration: await getLaptopTelegramConfiguration() };
}
export async function sendLaptopToTelegram(id, input) { return serializeTelegramPublication(await delivery.deliver(id, input)); }
