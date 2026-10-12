import { leadConfiguration, safeLeadCode } from './domain.js';
import { buildLeadTelegramMessage } from './message.js';
export function createLeadNotifier({ getSettings, env, telegram, recordOutcome = async () => {} }) {
  return async function notifyLead(event) {
    let result;
    try {
      const configuration = leadConfiguration(await getSettings(), env);
      if (configuration.code) result = { status: 'SKIPPED', code: configuration.code };
      else { await telegram.sendLeadGroup(configuration.chatId, buildLeadTelegramMessage(event)); result = { status: 'ACCEPTED', code: null }; }
    } catch (error) { result = { status: 'FAILED', code: safeLeadCode(error) }; }
    try { await recordOutcome(result); } catch {}
    return result;
  };
}
export function scheduleNewLead({ created, type, id }, { after, run, onFailure = () => {} }) {
  if (!created || !['purchase_request', 'order'].includes(type) || !id) return false;
  const failed = () => { try { onFailure(); } catch {} };
  try { after(async () => { try { await run(type, id); } catch { failed(); } }); return true; }
  catch { failed(); return false; }
}
