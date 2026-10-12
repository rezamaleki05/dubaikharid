import 'server-only';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { logAdminActivity } from '@/lib/adminActivity';
import { createTelegramClient } from '@/lib/telegram/client';
import { LEAD_SETTING_KEYS, leadConfiguration } from './domain.js';
import { createOwnerLeadNotifier, scheduleNewLead } from './delivery.js';
import { createWhatsappLeadClient } from './whatsapp.js';
import { persistedLeadEvent } from './events.js';

async function settings() { return (await getSettings(LEAD_SETTING_KEYS)).values; }
export async function getOwnerLeadConfiguration() { return leadConfiguration(await settings(), process.env); }
function telegram() { return createTelegramClient({ token: process.env.TELEGRAM_BOT_TOKEN?.trim() }); }
function whatsapp() { return createWhatsappLeadClient({ token: process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim(),
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID, version: process.env.WHATSAPP_GRAPH_API_VERSION }); }
export async function notifyOwnerOfLead(event) {
  return createOwnerLeadNotifier({ getSettings: settings, env: process.env, telegram: telegram(), whatsapp: whatsapp(),
    recordOutcome: async result => {
      if (Object.values(result).some(value => value.status === 'FAILED')) console.warn('LEAD_OWNER_NOTIFICATION', result);
      await logAdminActivity({ action: 'LEAD_OWNER_NOTIFICATION', metadata: result });
    },
  })(event);
}
function siteOrigin() {
  try { const u = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dubaikharid.shop');
    if (['http:', 'https:'].includes(u.protocol) && !u.username && !u.password) return u.origin;
  } catch {}
  return 'https://www.dubaikharid.shop';
}
async function notifyPersistedLead(type, id) {
  const origin = siteOrigin();
  if (type === 'purchase_request') {
    const row = await prisma.purchaseRequest.findUnique({ where: { id }, include: { customer: true } });
    if (!row) return;
    await notifyOwnerOfLead(persistedLeadEvent(type, row, origin));
  } else {
    const row = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!row) return;
    await notifyOwnerOfLead(persistedLeadEvent(type, row, origin));
  }
}
export function scheduleOwnerLeadNotification(event) {
  return scheduleNewLead(event, { after, run: notifyPersistedLead,
    onFailure: () => console.warn('LEAD_NOTIFICATION_UNAVAILABLE') });
}
export async function ownerLeadTestAction(provider, action) {
  const configuration = await getOwnerLeadConfiguration();
  if (configuration[provider].code) return { status: 'SKIPPED', code: configuration[provider].code };
  if (action === 'verify' && provider === 'telegram') return telegram().verifyPrivateChat(configuration.telegram.chatId);
  const notifier = createOwnerLeadNotifier({ getSettings: async () => ({ ...await settings(),
    telegramLeadsEnabled: provider === 'telegram', whatsappLeadsEnabled: provider === 'whatsapp' }),
    env: process.env, telegram: telegram(), whatsapp: whatsapp() });
  return (await notifier({ type: 'test', message: 'آزمایش اعلان خصوصی مالک؛ بدون اطلاعات مشتری', createdAt: new Date().toISOString() }))[provider];
}
