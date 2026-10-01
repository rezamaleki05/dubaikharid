export const AED_INTERVAL_PRESETS = Object.freeze([1, 3, 6, 12, 24]);
export const AED_MIN_INTERVAL_HOURS = 1;
export const AED_MAX_INTERVAL_HOURS = 720;

export function normalizeAedIntervalHours(value) {
  const legacy = { '1hr': 1, '3hr': 3, daily: 24, '30min': 1 };
  const numeric = legacy[value] ?? Number(value);
  return Number.isFinite(numeric) && Number.isInteger(numeric) && numeric >= AED_MIN_INTERVAL_HOURS && numeric <= AED_MAX_INTERVAL_HOURS ? numeric : null;
}

export function nextAedUpdateAt(lastSuccessfulUpdate, intervalHours) {
  const hours = normalizeAedIntervalHours(intervalHours);
  if (!hours || !lastSuccessfulUpdate) return null;
  const last = new Date(lastSuccessfulUpdate);
  if (Number.isNaN(last.getTime())) return null;
  return new Date(last.getTime() + hours * 60 * 60 * 1000);
}

export function isAedUpdateDue({ mode, lastSuccessfulUpdate, intervalHours, now = new Date() }) {
  if (mode !== 'auto') return false;
  const next = nextAedUpdateAt(lastSuccessfulUpdate, intervalHours);
  return !next || next.getTime() <= now.getTime();
}

export function parseBonbastAedPayload(payload) {
  const raw = payload?.aed1;
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const marketRate = Number(String(raw).replaceAll(',', '').trim());
  if (!Number.isFinite(marketRate)) return null;
  const finalRate = Math.round(marketRate + 600);
  return finalRate >= 1_000 && finalRate <= 100_000_000 ? finalRate : null;
}

export function successfulAedRateSettings(rate, now = new Date()) {
  const timestamp = now.toISOString();
  return { aed_toman_rate: String(rate), aedLastUpdate: timestamp, aedLastSuccessfulUpdate: timestamp, aedFetchStatus: 'success', aedLastFetchError: '' };
}

export function failedAedRateSettings(error) {
  return { aedFetchStatus: 'error', aedLastFetchError: String(error || 'Unknown rate source error.').slice(0, 500) };
}
