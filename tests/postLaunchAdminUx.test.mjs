import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  failedAedRateSettings,
  isAedUpdateDue,
  nextAedUpdateAt,
  normalizeAedIntervalHours,
  parseBonbastAedPayload,
  successfulAedRateSettings,
} from '../src/lib/aedRateDomain.js';
import { isJalaliLeapYear, normalizeJalaliDate, validateJalaliDate } from '../src/lib/jalaliDate.js';
import { validateSettingValue } from '../src/lib/settingsSchema.js';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const [laptopPage, laptopValidation, brandPage, brandRoute, publicBrands, productAdmin, productPage, publicCatalog, scheduler, schema, vercelConfig] = await Promise.all([
  read('../src/app/admin/laptops/page.js'), read('../src/lib/adminLaptops.js'), read('../src/app/admin/brands/page.js'), read('../src/app/api/admin/brands/[id]/route.js'), read('../src/app/brands/page.js'), read('../src/lib/adminProducts.js'), read('../src/app/product/[id]/page.js'), read('../src/lib/publicCatalog.js'), read('../src/lib/aedRateService.js'), read('../prisma/schema.prisma'), read('../vercel.json'),
]);

test('Jalali manual input normalizes Persian digits and rejects invalid dates', () => {
  assert.equal(normalizeJalaliDate('۱۴۰۵/۳/۲۰'), '1405/03/20');
  assert.equal(validateJalaliDate('1405/13/01'), 'تاریخ شمسی معتبر نیست؛ مثل ۱۴۰۵/۰۳/۲۰ وارد کنید.');
  assert.equal(normalizeJalaliDate('1404/12/30'), null);
  assert.equal(normalizeJalaliDate('1403/12/30'), '1403/12/30');
  assert.equal(isJalaliLeapYear(1403), true);
});

test('Laptop form starts without a default brand, provides autocomplete, numeric weight, and Jalali field', () => {
  assert.match(laptopPage, /brand: '', model: ''/);
  assert.doesNotMatch(laptopPage, /brand: 'Apple'/);
  assert.match(laptopPage, /placeholder="جستجوی برند/);
  assert.match(laptopPage, /type="number"[\s\S]*?max="99\.99"[\s\S]*?step="0\.01"[\s\S]*?value=\{laptopForm\.weight\}/);
  assert.match(laptopPage, /<JalaliDateField/);
  assert.match(laptopValidation, /normalizeJalaliDate\(dateEntered\)/);
});

test('AED interval presets, custom bounds, due calculation, and next update are deterministic', () => {
  for (const hours of [1, 3, 6, 12, 24, 48]) assert.equal(normalizeAedIntervalHours(String(hours)), hours);
  assert.equal(normalizeAedIntervalHours('0'), null);
  assert.equal(validateSettingValue('aedUpdateIntervalHours', '12').value, '12');
  assert.ok(validateSettingValue('aedUpdateIntervalHours', '0').error);
  const last = '2026-10-01T00:00:00.000Z';
  assert.equal(nextAedUpdateAt(last, 3).toISOString(), '2026-10-01T03:00:00.000Z');
  assert.equal(isAedUpdateDue({ mode: 'manual', lastSuccessfulUpdate: last, intervalHours: 1, now: new Date('2026-10-02') }), false);
  assert.equal(isAedUpdateDue({ mode: 'auto', lastSuccessfulUpdate: last, intervalHours: 3, now: new Date('2026-10-01T02:59:59Z') }), false);
  assert.equal(isAedUpdateDue({ mode: 'auto', lastSuccessfulUpdate: last, intervalHours: 3, now: new Date('2026-10-01T03:00:00Z') }), true);
});

test('AED parsing accepts valid data, rejects malformed data, and failure state never overwrites rate', () => {
  assert.equal(parseBonbastAedPayload({ aed1: '24,000' }), 24600);
  assert.equal(parseBonbastAedPayload({ aed1: '<html>' }), null);
  const success = successfulAedRateSettings(24600, new Date('2026-10-01T00:00:00Z'));
  assert.equal(success.aed_toman_rate, '24600');
  const failure = failedAedRateSettings('timeout');
  assert.equal(failure.aedFetchStatus, 'error');
  assert.equal(Object.hasOwn(failure, 'aed_toman_rate'), false);
  assert.equal(Object.hasOwn(failure, 'aedLastSuccessfulUpdate'), false);
});

test('scheduler uses lock, timeout, persisted mode/interval and supported hourly Vercel trigger', () => {
  assert.match(scheduler, /pg_try_advisory_xact_lock/);
  assert.match(scheduler, /8_000/);
  assert.match(scheduler, /aedUpdateMode/);
  assert.match(scheduler, /aedUpdateIntervalHours/);
  assert.deepEqual(JSON.parse(vercelConfig).crons, [{ path: '/api/cron/aed-rate', schedule: '0 * * * *' }]);
});

test('Brand edit lock is Prisma-compatible and Brand UX supports safe logo/category/optional website behavior', () => {
  assert.match(brandRoute, /pg_advisory_xact_lock\(742193\)::text/);
  assert.match(brandPage, /BrandCategoryMultiSelect/);
  assert.match(brandPage, /BrandLogoField/);
  assert.match(publicBrands, /brand\.url \? <a/);
  assert.doesNotMatch(publicBrands, /href=\{brand\.url \|\|/);
});

test('Product store relation is nullable and source/description public fallbacks are removed', () => {
  assert.match(schema, /storeId\s+String\?/);
  assert.match(productAdmin, /data\.storeId = storeId/);
  assert.doesNotMatch(productAdmin, /دسته‌بندی و فروشگاه معتبر الزامی/);
  assert.match(publicCatalog, /sourceType:/);
  assert.match(productPage, /product\.description\?\.trim\(\)/);
  assert.doesNotMatch(productPage, /اطلاعات کامل و جزئیات دقیق این محصول/);
  assert.match(productPage, /product\.sourceUrl \? <a/);
});
