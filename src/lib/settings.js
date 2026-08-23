import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  FINANCIAL_SETTING_KEYS,
  PUBLIC_SETTING_KEYS,
  SETTING_DEFINITIONS,
  SETTING_KEYS,
  defaultSettings,
  deserializeSettingValue,
  serializeSettingValue,
  validateSettingValue,
} from '@/lib/settingsSchema';
import { calculateProductPricing } from '@/lib/pricing';

export class SettingsConfigurationError extends Error {
  constructor(keys) {
    super(`Missing required settings: ${keys.join(', ')}`);
    this.name = 'SettingsConfigurationError';
    this.keys = keys;
  }
}

export function validateSettingsInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'بدنه درخواست معتبر نیست.' };
  }
  const keys = Object.keys(body);
  if (!keys.length) return { error: 'تغییری ارسال نشده است.' };
  if (keys.some(key => !SETTING_DEFINITIONS[key])) {
    return { error: 'کلید غیرمجاز در درخواست وجود دارد.' };
  }
  const values = {};
  for (const key of keys) {
    const parsed = validateSettingValue(key, body[key]);
    if (parsed.error) return { error: parsed.error, field: key };
    values[key] = parsed.value;
  }
  if (values.aedAutoUpdate === true || values.aedUpdateMode === 'auto') {
    return { error: 'بروزرسانی خودکار نرخ در این مرحله فعال نیست.', field: 'aedUpdateMode' };
  }
  return { values };
}

export async function getSettings(keys = SETTING_KEYS, { requireFinancial = false } = {}) {
  const selectedKeys = [...new Set(keys)].filter(key => SETTING_DEFINITIONS[key]);
  const rows = await prisma.setting.findMany({
    where: { key: { in: selectedKeys.map(key => SETTING_DEFINITIONS[key].dbKey) } },
  });
  const rowByKey = new Map(rows.map(row => [row.key, row]));
  const missingFinancial = selectedKeys.filter(
    key => FINANCIAL_SETTING_KEYS.includes(key) && !rowByKey.has(SETTING_DEFINITIONS[key].dbKey),
  );
  if (requireFinancial && missingFinancial.length) throw new SettingsConfigurationError(missingFinancial);

  const values = defaultSettings(selectedKeys);
  for (const key of missingFinancial) values[key] = '';
  for (const key of selectedKeys) {
    const row = rowByKey.get(SETTING_DEFINITIONS[key].dbKey);
    if (row) values[key] = deserializeSettingValue(key, row.value);
  }
  return { values, missingFinancial };
}

export async function getPublicSettings() {
  return getSettings(PUBLIC_SETTING_KEYS);
}

export async function getPricingSettings() {
  const { values } = await getSettings(FINANCIAL_SETTING_KEYS, { requireFinancial: true });
  return values;
}

export async function calculateAuthoritativeProductPricing(input) {
  return calculateProductPricing(input, await getPricingSettings());
}

export async function updateSettings(values) {
  const keys = Object.keys(values);
  return prisma.$transaction(async tx => {
    const existing = await tx.setting.findMany({
      where: { key: { in: keys.map(key => SETTING_DEFINITIONS[key].dbKey) } },
    });
    const existingByKey = new Map(existing.map(row => [row.key, row.value]));
    await Promise.all(keys.map(key => {
      const dbKey = SETTING_DEFINITIONS[key].dbKey;
      const value = serializeSettingValue(values[key]);
      return tx.setting.upsert({
        where: { key: dbKey },
        create: { key: dbKey, value },
        update: { value },
      });
    }));
    return {
      previous: Object.fromEntries(keys.map(key => {
        const raw = existingByKey.get(SETTING_DEFINITIONS[key].dbKey);
        return [key, raw === undefined ? null : deserializeSettingValue(key, raw)];
      })),
      current: values,
    };
  });
}
