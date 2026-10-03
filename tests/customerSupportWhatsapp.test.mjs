import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  DEFAULT_SUPPORT_WHATSAPP,
  buildSupportWhatsappUrl,
  normalizeSupportWhatsappNumber,
  resolveSupportWhatsappNumber,
} from '../src/lib/supportWhatsapp.js';
import * as settingsSchema from '../src/lib/settingsSchema.js';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

const [profilePage, adminSettingsPage, adminSettingsRoute, publicSettingsRoute, footer, manualPayments] = await Promise.all([
  read('../src/app/profile/page.js'),
  read('../src/app/admin/settings/page.js'),
  read('../src/app/api/admin/settings/route.js'),
  read('../src/app/api/settings/public/route.js'),
  read('../src/components/Footer.js'),
  read('../src/lib/manualPayments.js'),
]);

function createMemorySettingsStore() {
  const records = new Map();
  const setting = {
    async findMany({ where }) {
      return where.key.in.flatMap(key => records.has(key) ? [{ key, value: records.get(key) }] : []);
    },
    async upsert({ where, create, update }) {
      const value = records.has(where.key) ? update.value : create.value;
      records.set(where.key, value);
      return { key: where.key, value };
    },
  };
  return {
    records,
    prisma: {
      setting,
      async $transaction(callback) {
        return callback({ setting });
      },
    },
  };
}

async function importSettingsWith(memoryPrisma) {
  globalThis.__customerSupportSettingsPrisma = memoryPrisma;
  globalThis.__customerSupportSettingsSchema = settingsSchema;
  const contents = (await read('../src/lib/settings.js'))
    .replace("import 'server-only';", '')
    .replace("import { prisma } from '@/lib/prisma';", 'const prisma = globalThis.__customerSupportSettingsPrisma;')
    .replace(
      /import \{[\s\S]*?\} from '@\/lib\/settingsSchema';/,
      `const {
        FINANCIAL_SETTING_KEYS,
        PUBLIC_SETTING_KEYS,
        SETTING_DEFINITIONS,
        SETTING_KEYS,
        defaultSettings,
        deserializeSettingValue,
        serializeSettingValue,
        validateSettingValue,
      } = globalThis.__customerSupportSettingsSchema;`,
    )
    .replace("import { calculateProductPricing } from '@/lib/pricing';", 'const calculateProductPricing = () => null;');
  return import(`data:text/javascript;base64,${Buffer.from(contents).toString('base64')}#${Date.now()}-${Math.random()}`);
}

test('default customer-support WhatsApp resolves to the approved canonical number', () => {
  assert.equal(DEFAULT_SUPPORT_WHATSAPP, '+971527556964');
  assert.equal(settingsSchema.defaultSettings(['supportWhatsapp']).supportWhatsapp, '+971527556964');
});

test('formatted international support numbers normalize to canonical E.164 form', () => {
  assert.equal(normalizeSupportWhatsappNumber('+971 52 755 6964'), '+971527556964');
  assert.equal(normalizeSupportWhatsappNumber('971-52-755-6964'), '+971527556964');
});

test('digits-only and localized-digit support numbers normalize correctly', () => {
  assert.equal(normalizeSupportWhatsappNumber('971527556964'), '+971527556964');
  assert.equal(normalizeSupportWhatsappNumber('۹۷۱۵۲۷۵۵۶۹۶۴'), '+971527556964');
});

test('support WhatsApp URL contains digits only after wa.me', () => {
  assert.equal(buildSupportWhatsappUrl('+971 52 755 6964'), 'https://wa.me/971527556964');
});

test('Admin contact settings expose and submit the dedicated protected support field', () => {
  assert.match(adminSettingsPage, /label="شماره واتساپ پشتیبانی"/);
  assert.match(adminSettingsPage, /supportWhatsapp: siteSettings\.supportWhatsapp/);
  assert.match(adminSettingsRoute, /ADMIN_PERMISSIONS\.SETTINGS_EDIT/);
  assert.match(publicSettingsRoute, /getPublicSettings/);
});

test('Admin save stores canonical data and reload returns the persisted value', async () => {
  const store = createMemorySettingsStore();
  const settings = await importSettingsWith(store.prisma);
  const parsed = settings.validateSettingsInput({ supportWhatsapp: '+971 52 755 6964' });
  assert.deepEqual(parsed, { values: { supportWhatsapp: '+971527556964' } });
  await settings.updateSettings(parsed.values);
  assert.equal(store.records.get('supportWhatsapp'), '+971527556964');
  const reloaded = await settings.getSettings(['supportWhatsapp']);
  assert.equal(reloaded.values.supportWhatsapp, '+971527556964');
});

test('changing the persisted setting changes the Profile URL without changing code', async () => {
  const store = createMemorySettingsStore();
  const settings = await importSettingsWith(store.prisma);
  const parsed = settings.validateSettingsInput({ supportWhatsapp: '+44 20 7946 0958' });
  await settings.updateSettings(parsed.values);
  const reloaded = await settings.getSettings(['supportWhatsapp']);
  assert.equal(buildSupportWhatsappUrl(reloaded.values.supportWhatsapp), 'https://wa.me/442079460958');
  assert.match(profilePage, /buildSupportWhatsappUrl\(settings\.supportWhatsapp\)/);
  assert.match(profilePage, /href=\{supportWhatsappUrl\}/);
});

test('invalid and empty support numbers are rejected by settings validation', () => {
  for (const value of ['', '   ', 'not-a-phone', '+12', '+971/52/755/6964']) {
    assert.ok(settingsSchema.validateSettingValue('supportWhatsapp', value).error);
  }
});

test('missing or malformed persisted support values use the safe approved fallback', () => {
  assert.equal(resolveSupportWhatsappNumber(undefined), '+971527556964');
  assert.equal(resolveSupportWhatsappNumber('invalid'), '+971527556964');
  assert.equal(buildSupportWhatsappUrl(null), 'https://wa.me/971527556964');
});

test('the old Profile literal is removed while unrelated WhatsApp flows remain untouched', () => {
  assert.doesNotMatch(profilePage, /wa\.me\/971501234567/);
  assert.match(footer, /settings\.whatsapp/);
  assert.match(manualPayments, /getSettings\(\['cardPaymentEnabled', 'onlinePaymentEnabled', 'whatsapp'\]\)/);
  assert.equal(settingsSchema.defaultSettings(['whatsapp']).whatsapp, '+971501234567');
});
