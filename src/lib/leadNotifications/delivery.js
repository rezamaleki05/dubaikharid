import { leadConfiguration, safeLeadCode } from './domain.js';
import { buildLeadTelegramMessage, buildLeadWhatsappParameters } from './message.js';

export function createOwnerLeadNotifier({ getSettings, env, telegram, whatsapp, recordOutcome = async () => {} }) {
  return async function notifyOwnerOfLead(event) {
    let configuration;
    try { configuration = leadConfiguration(await getSettings(), env); }
    catch {
      const result = { telegram: { status: 'FAILED', code: 'LEAD_NOTIFICATION_UNAVAILABLE' }, whatsapp: { status: 'FAILED', code: 'LEAD_NOTIFICATION_UNAVAILABLE' } };
      try { await recordOutcome(result); } catch {}
      return result;
    }
    async function deliver(provider, send) {
      if (configuration[provider].code) return { status: 'SKIPPED', code: configuration[provider].code };
      try { await send(); return { status: 'ACCEPTED', code: null }; }
      catch (error) { return { status: 'FAILED', code: safeLeadCode(error) }; }
    }
    const [telegramResult, whatsappResult] = await Promise.all([
      deliver('telegram', () => telegram.sendPrivateLead(configuration.telegram.chatId, buildLeadTelegramMessage(event))),
      deliver('whatsapp', () => whatsapp.sendTemplate(configuration.whatsapp, buildLeadWhatsappParameters(event))),
    ]);
    const result = { telegram: telegramResult, whatsapp: whatsappResult };
    // Only allowlisted status codes, never event content or provider error strings.
    try { await recordOutcome(result); } catch {}
    return result;
  };
}

export function scheduleNewLead({ created, type, id }, { after, run, onFailure = () => {} }) {
  if (!created || !['purchase_request', 'order'].includes(type) || !id) return false;
  try {
    after(async () => { try { await run(type, id); } catch { onFailure(); } });
    return true;
  } catch { onFailure(); return false; }
}
