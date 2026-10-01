import 'server-only';

import { prisma } from '@/lib/prisma';
import { failedAedRateSettings, isAedUpdateDue, normalizeAedIntervalHours, parseBonbastAedPayload, successfulAedRateSettings } from '@/lib/aedRateDomain';

const LOCK_ID = 942201;
const USER_AGENT = 'Mozilla/5.0 (compatible; DubaiKharidRateBot/1.0; +https://dubaikharid.shop)';

async function fetchWithTimeout(fetchImpl, url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try { return await fetchImpl(url, { ...options, signal: controller.signal, cache: 'no-store' }); }
  finally { clearTimeout(timer); }
}

export async function fetchBonbastAedRate(fetchImpl = fetch) {
  const landing = await fetchWithTimeout(fetchImpl, 'https://www.bonbast.com/', {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.5' },
  });
  if (!landing.ok) throw new Error(`Rate source returned ${landing.status}.`);
  const html = await landing.text();
  const token = html.match(/\$\.post\('\/json',\s*{\s*param:\s*"([^"]+)"/i)?.[1];
  if (!token) throw new Error('Rate source response did not contain a valid token.');
  const quote = await fetchWithTimeout(fetchImpl, 'https://www.bonbast.com/json', {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Cookie: landing.headers.get('set-cookie') || '', Referer: 'https://www.bonbast.com/', 'X-Requested-With': 'XMLHttpRequest' },
    body: `param=${encodeURIComponent(token)}`,
  });
  if (!quote.ok) throw new Error(`Rate source quote returned ${quote.status}.`);
  let payload;
  try { payload = await quote.json(); } catch { throw new Error('Rate source returned malformed data.'); }
  const rate = parseBonbastAedPayload(payload);
  if (!rate) throw new Error('Rate source returned an invalid AED value.');
  return { rate, sourceTimestamp: payload.last_modified || payload.created || null };
}

function rowsToValues(rows) {
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
}

async function saveRows(tx, values) {
  await Promise.all(Object.entries(values).map(([key, value]) => tx.setting.upsert({
    where: { key }, create: { key, value: String(value) }, update: { value: String(value) },
  })));
}

export async function refreshAedRate({ force = false, now = new Date(), fetchImpl = fetch } = {}) {
  return prisma.$transaction(async tx => {
    const lock = await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(${LOCK_ID})::text AS "acquired"`;
    if (lock[0]?.acquired !== 'true') return { ok: true, updated: false, reason: 'concurrent' };
    const rows = await tx.setting.findMany({ where: { key: { in: ['aed_toman_rate', 'aedUpdateMode', 'aedUpdateIntervalHours', 'aedLastSuccessfulUpdate'] } } });
    const current = rowsToValues(rows);
    const mode = current.aedUpdateMode === 'auto' ? 'auto' : 'manual';
    const intervalHours = normalizeAedIntervalHours(current.aedUpdateIntervalHours || '1') || 1;
    if (!force && mode !== 'auto') return { ok: true, updated: false, reason: 'manual_mode', rate: current.aed_toman_rate || null };
    if (!force && !isAedUpdateDue({ mode, lastSuccessfulUpdate: current.aedLastSuccessfulUpdate, intervalHours, now })) {
      return { ok: true, updated: false, reason: 'not_due', rate: current.aed_toman_rate || null };
    }
    try {
      const fetched = await fetchBonbastAedRate(fetchImpl);
      const settings = successfulAedRateSettings(fetched.rate, now);
      await saveRows(tx, settings);
      const timestamp = settings.aedLastSuccessfulUpdate;
      return { ok: true, updated: true, rate: String(fetched.rate), lastSuccessfulUpdate: timestamp, sourceTimestamp: fetched.sourceTimestamp };
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : 'Unknown rate source error.';
      await saveRows(tx, failedAedRateSettings(message));
      return { ok: false, updated: false, reason: 'fetch_failed', error: message, rate: current.aed_toman_rate || null, lastSuccessfulUpdate: current.aedLastSuccessfulUpdate || null };
    }
  }, { maxWait: 5_000, timeout: 20_000, isolationLevel: 'Serializable' });
}
