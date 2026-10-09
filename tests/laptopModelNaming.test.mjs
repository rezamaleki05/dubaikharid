import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { emptyLaptopForm } from '../src/lib/laptopForm.js';
import { changeLaptopIdentity, laptopDisplayName, laptopIdentityName, suggestedLaptopNames, laptopCatalogOptions } from '../src/lib/laptopIdentity.js';
import { buildLaptopModelGroups, resolveLaptopModelSlug, searchLaptopModelGroups } from '../src/lib/laptopSeoDomain.js';
const require = createRequire(import.meta.url);
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const moduleSource = read('src/lib/adminLaptops.js').replace("import 'server-only';", '')
  .replace("import { Prisma } from '@/generated/prisma/client';", `import { Decimal } from ${JSON.stringify(pathToFileURL(require.resolve('@prisma/client/runtime/client')).href)}; const Prisma = { Decimal };`)
  .replace("'@/lib/jalaliDate'", JSON.stringify(new URL('../src/lib/jalaliDate.js', import.meta.url).href))
  .replace("'./laptopIdentity.js'", JSON.stringify(new URL('../src/lib/laptopIdentity.js', import.meta.url).href));
const { validateLaptopPayload, serializeLaptop, assertLaptopCatalogSelection } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
const base = { ...emptyLaptopForm(), cpu: 'Intel Core i7-12700H', ram: '32', storageSize: '512', storageType: 'GB SSD', screenSize: '15.6', buyingPrice: '1000', sellingPrice: '48000000' };
const unit = overrides => ({ id: 'unit', brand: 'Dell', series: 'Precision', model: '5570', status: 'AVAILABLE', priceToman: '48000000', updatedAt: new Date('2026-10-09'), ...overrides });
for (const field of ['brand','series','model','cpu','ram','storageSize','storageType','gpu','screenSize','manufactureYear','color','weight','batteryHealth','serial']) {
  test(`new Laptop ${field} has no device default`, () => assert.equal(emptyLaptopForm()[field], ''));
}
for (const [brand, series, model, name] of [['Dell','Precision','5570','Dell Precision 5570'],['MSI','','Katana 15 B13V','MSI Katana 15 B13V'],['Lenovo','ThinkPad','P53','Lenovo ThinkPad P53']]) {
  test(`${name} validates with optional Series and generated names`, () => {
    const result = validateLaptopPayload({ ...base, brand, series, model });
    assert.equal(result.error, undefined);
    assert.equal(result.data.displayNameEn, name);
    assert.equal(result.data.series, series || null);
    assert.equal(result.data.model, model);
  });
}
test('manual Persian/English names are trimmed, stored independently, and never replaced by identity edits', () => {
  const form = { ...base, brand: 'Dell', series: 'Precision', model: '5570', displayNameFa: 'لپ تاپ استوک دل پرسیژن 5570', displayNameEn: 'My deliberate label' };
  const result = validateLaptopPayload({ ...form, displayNameFa: ` ${form.displayNameFa} ` });
  assert.equal(result.data.displayNameFa, form.displayNameFa);
  assert.equal(result.data.displayNameEn, form.displayNameEn);
  const changed = changeLaptopIdentity(form, { brand: 'Lenovo' }, { displayNameFa: true, displayNameEn: true });
  assert.equal(changed.displayNameFa, form.displayNameFa);
  assert.equal(changed.displayNameEn, form.displayNameEn);
  assert.equal(changed.series, ''); assert.equal(changed.model, '');
  assert.equal(changed.ram, '32'); assert.equal(changed.storageSize, '512');
});
test('dirty-name tracking is independent for each language and preserves an intentionally cleared field', () => {
  const form = { brand: 'Dell', series: 'Precision', model: '5520', displayNameFa: '' };
  const result = changeLaptopIdentity(form, { model: '5570' }, { displayNameFa: true });
  assert.equal(result.displayNameFa, ''); assert.equal(result.displayNameEn, 'Dell Precision 5570');
});
test('Series change clears Model without erasing generic manual hardware fields', () => {
  const changed = changeLaptopIdentity({ ...base, brand: 'Dell', series: 'Precision', model: '5570', weight: '1.75' }, { series: 'Latitude' });
  assert.equal(changed.model, ''); assert.equal(changed.weight, '1.75'); assert.equal(changed.cpu, base.cpu);
});
test('automatic suggestions include optional Series and localized Brand without duplicate text', () => {
  assert.equal(suggestedLaptopNames({ brand: 'Dell', series: 'Precision', model: '5570' }, 'دل').displayNameFa, 'لپ تاپ استوک دل Precision 5570');
  assert.equal(laptopIdentityName({ brand: 'Dell', series: 'Precision', model: 'Dell Precision 5570' }), 'Dell Precision 5570');
});
test('catalog separates legacy families from exact models and scopes exact models to Series', () => {
  const brand = { laptopModels: [{ id: 'laptop-model-dell-precision', name: 'Precision' }, { id: 'a', name: 'Precision 5570', series: 'Precision', exactModel: '5570' }, { id: 'b', name: 'Latitude 7440', series: 'Latitude', exactModel: '7440' }] };
  assert.deepEqual(laptopCatalogOptions(brand, 'Precision'), { series: ['Precision', 'Latitude'], models: ['5570'] });
  assert.deepEqual(laptopCatalogOptions(brand).models, []);
});
test('catalog validation requires exact model and matching optional Series', async () => {
  let where;
  const client = { brand: { findFirst: async () => ({ id: 'dell' }) }, laptopModel: { findFirst: async args => { where = args.where; return { id: '5570' }; } } };
  await assertLaptopCatalogSelection(client, { brandName: 'Dell', modelName: '5570', series: 'Precision' });
  assert.equal(where.exactModel.equals, '5570'); assert.equal(where.series.equals, 'Precision');
  await assertLaptopCatalogSelection(client, { brandName: 'MSI', modelName: 'Katana 15 B13V' });
  assert.equal(where.series, null);
});
test('weight accepts positive decimal input and rejects zero or negative values', () => {
  for (const weight of ['1.24','1.75','2.35']) assert.equal(validateLaptopPayload({ weight }, { partial: true }).data.weightKg.toString(), weight);
  for (const weight of ['0','-1','NaN']) assert.ok(validateLaptopPayload({ weight }, { partial: true }).error);
});
test('required identity and hardware fields reject blank create values', () => {
  for (const field of ['brand','model','cpu','ram','storageSize','storageType','screenSize']) {
    assert.ok(validateLaptopPayload({ ...base, brand: 'Dell', model: '5570', [field]: ' ' }).error, field);
  }
});
test('legacy Dell Precision serializes and saves unchanged with no invented identity', () => {
  const legacy = unit({ series: null, model: 'Precision', name: 'لپ‌تاپ استوک Dell مدل Precision', cpu: 'Intel Core i7', ram: '32', storage: '512 GB SSD', screen: '15.6', weightKg: null, warrantyDays: null });
  const form = serializeLaptop(legacy).rawSpecs;
  assert.equal(form.series, ''); assert.equal(form.model, 'Precision'); assert.equal(form.displayNameEn, '');
  const result = validateLaptopPayload(form, { partial: true });
  assert.equal(result.error, undefined); assert.equal(result.data.series, null); assert.equal(result.data.model, 'Precision');
  assert.equal(Object.hasOwn(result.data, 'name'), false);
});
test('public names prefer explicit language then structured identity then legacy name', () => {
  assert.equal(laptopDisplayName({ brand: 'Dell', series: 'Precision', model: '5570', displayNameFa: 'نام فارسی', displayNameEn: 'English' }), 'نام فارسی');
  assert.equal(laptopDisplayName({ brand: 'MSI', model: 'Katana 15 B13V' }), 'MSI Katana 15 B13V');
  assert.equal(laptopDisplayName({ name: 'Legacy' }), 'Legacy');
});
test('5520, 5570, 7550 and MSI no-Series produce distinct exact grouped canonicals', () => {
  const groups = buildLaptopModelGroups(['5520','5570','7550'].map(model => unit({ id: model, model })).concat(unit({ id: 'msi', brand: 'MSI', series: null, model: 'Katana 15 B13V' })));
  assert.deepEqual(groups.map(group => group.slug), ['dell-precision-5520','dell-precision-5570','dell-precision-7550','msi-katana-15-b13v']);
  assert.equal(new Set(groups.map(group => group.identity)).size, 4);
});
test('legacy canonical wins while it exists; unique historical URL redirects to current identity', () => {
  const exact = unit({ previousModelSlugs: ['dell-precision'] });
  const groups = buildLaptopModelGroups([exact, unit({ id: 'legacy', series: null, model: 'Precision' })]);
  assert.equal(resolveLaptopModelSlug(groups, 'dell-precision').slug, 'dell-precision');
  const only = buildLaptopModelGroups([exact]);
  assert.equal(resolveLaptopModelSlug(only, 'dell-precision').slug, 'dell-precision-5570');
  assert.equal(resolveLaptopModelSlug(only, 'dell-precision-5570').slug, 'dell-precision-5570');
});
test('ambiguous historic slug never redirects to an arbitrary exact model', () => {
  const groups = buildLaptopModelGroups([unit({ previousModelSlugs: ['dell-precision'] }), unit({ id: '5520', model: '5520', previousModelSlugs: ['dell-precision'] })]);
  assert.equal(resolveLaptopModelSlug(groups, 'dell-precision'), null);
});
test('search includes both display names and exact identities without serial or SKU leakage', () => {
  const groups = buildLaptopModelGroups([unit({ displayNameFa: 'دل پرسیژن', displayNameEn: 'Dell Precision 5570', serialNumber: 'PRIVATE', internalSku: 'SECRET' })]);
  assert.equal(searchLaptopModelGroups(groups, 'پرسیژن').length, 1);
  assert.equal(searchLaptopModelGroups(groups, '5570').length, 1);
  assert.doesNotMatch(JSON.stringify(groups), /PRIVATE|SECRET/);
});
test('searchable controls keep create actions separate from selected values and mutations off blur', () => {
  const page = read('src/app/admin/laptops/page.js'); const combo = read('src/components/admin/laptops/LaptopCombobox.js');
  assert.match(combo, /role="combobox"/); assert.match(combo, /role="listbox"/);
  assert.match(page, /createLabel="\+ افزودن مدل جدید"/); assert.match(page, /placeholder="جستجو یا انتخاب مدل\.\.\."/);
  assert.match(page, /Intel Core i7-12700H/); assert.match(page, /NVIDIA RTX A1000/);
  assert.doesNotMatch(page, /Apple M2|Apple GPU 8-Core|Space Gray|\+custom/);
});
test('migration is nullable and additive without touching existing rows or unrelated tables', () => {
  const sql = read('prisma/migrations/20261009000100_laptop_model_identity/migration.sql');
  assert.doesNotMatch(sql, /\b(DROP|RENAME|UPDATE|DELETE|INSERT|NOT NULL)\b/);
  assert.equal((sql.match(/ADD COLUMN/g) || []).length, 6);
  assert.doesNotMatch(sql, /"Product"|"Order"|"WarehouseItem"/);
});
test('gallery ordering, primary image, technical tests, accessories and status survive identity edits', () => {
  const images=['/images/product-placeholder.svg','/images/placeholder.svg'];
  const data=validateLaptopPayload({ ...base,brand:'Dell',series:'Precision',model:'5570',images,hardwareTests:{keyboard:true},accessories:{charger:true},stockStatus:'reserved' }).data;
  assert.equal(data.image,images[0]); assert.deepEqual(data.images,images); assert.equal(data.hardwareTests.keyboard,true);assert.equal(data.accessories.charger,true);assert.equal(data.status,'RESERVED');
  const serialized=serializeLaptop({...data,id:'qa',weightKg:null,warrantyDays:null});
  assert.deepEqual(serialized.rawSpecs.images,images);assert.equal(serialized.rawSpecs.stockStatus,'reserved');assert.equal(serialized.rawSpecs.hardwareTests.keyboard,true);assert.equal(serialized.rawSpecs.accessories.charger,true);
});
