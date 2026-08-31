import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

async function importLaptopValidation() {
  const contents = (await source('../src/lib/adminLaptops.js'))
    .replace("import 'server-only';", '')
    .replace(
      "import { Prisma } from '@/generated/prisma/client';",
      `const Prisma = {
        Decimal: class Decimal {
          constructor(value) {
            this.value = Number(value);
          }

          isNegative() {
            return this.value < 0;
          }

          greaterThan(value) {
            return this.value > Number(value);
          }
        },
      };`,
    );
  return import(`data:text/javascript;base64,${Buffer.from(contents).toString('base64')}`);
}

const adminLaptops = await importLaptopValidation();
const schema = await source('../prisma/schema.prisma');
const laptopMigration = await source('../prisma/migrations/20260819000100_laptops_database/migration.sql');
const adminLaptopPage = await source('../src/app/admin/laptops/page.js');
const productDetailPage = await source('../src/app/product/[id]/page.js');

const requiredLaptopFields = Object.freeze({
  brand: 'Dell',
  model: 'Latitude 7440',
  cpu: 'Intel Core i7',
  ram: '16',
  storageSize: '512',
  storageType: 'GB SSD',
  buyingPrice: '1200',
  sellingPrice: '48000000',
});

test('Laptop manufacture year and battery health columns are already nullable without a follow-up migration', () => {
  assert.match(schema, /manufactureYear\s+Int\?/);
  assert.match(schema, /batteryHealth\s+Int\?/);
  assert.match(laptopMigration, /ADD COLUMN "manufactureYear" INTEGER/);
  assert.match(laptopMigration, /ADD COLUMN "batteryHealth" INTEGER/);
});

test('empty optional Laptop numeric fields normalize to null instead of zero', () => {
  for (const empty of ['', '   ', null]) {
    const result = adminLaptops.validateLaptopPayload({ manufactureYear: empty, batteryHealth: empty }, { partial: true });
    assert.deepEqual(result, { data: { manufactureYear: null, batteryHealth: null } });
  }
});

test('Laptop create validation accepts optional values independently, together, or omitted', () => {
  const cases = [
    [{ manufactureYear: '2022', batteryHealth: '92' }, { manufactureYear: 2022, batteryHealth: 92 }],
    [{ manufactureYear: '2022' }, { manufactureYear: 2022 }],
    [{ batteryHealth: '92' }, { batteryHealth: 92 }],
    [{}, {}],
    [{ manufactureYear: '', batteryHealth: '' }, { manufactureYear: null, batteryHealth: null }],
  ];

  for (const [optionalInput, expected] of cases) {
    const result = adminLaptops.validateLaptopPayload({ ...requiredLaptopFields, ...optionalInput });
    assert.equal(result.error, undefined);
    for (const [key, value] of Object.entries(expected)) assert.equal(result.data[key], value);
    if (!Object.hasOwn(expected, 'manufactureYear')) assert.equal(Object.hasOwn(result.data, 'manufactureYear'), false);
    if (!Object.hasOwn(expected, 'batteryHealth')) assert.equal(Object.hasOwn(result.data, 'batteryHealth'), false);
  }
});

test('Laptop edit validation leaves existing optional values unchanged when fields are omitted', () => {
  const result = adminLaptops.validateLaptopPayload({ color: 'Silver' }, { partial: true });
  assert.deepEqual(result, { data: { color: 'Silver' } });
  assert.equal(Object.hasOwn(result.data, 'manufactureYear'), false);
  assert.equal(Object.hasOwn(result.data, 'batteryHealth'), false);
});

test('Laptop battery health is restricted to 0 through 100 and year never falls back to zero', () => {
  assert.match(adminLaptops.validateLaptopPayload({ batteryHealth: -1 }, { partial: true }).error, /سلامت باتری/);
  assert.match(adminLaptops.validateLaptopPayload({ batteryHealth: 101 }, { partial: true }).error, /سلامت باتری/);
  assert.match(adminLaptops.validateLaptopPayload({ manufactureYear: 0 }, { partial: true }).error, /سال ساخت/);
});

test('Admin form marks both fields optional and aligns battery constraints with server validation', () => {
  const yearBlock = adminLaptopPage.match(/<label>سال ساخت<\/label>[\s\S]*?className=\{styles\.inputField\}/)?.[0] || '';
  const batteryBlock = adminLaptopPage.match(/<label>سلامت باتری - ٪<\/label>[\s\S]*?className=\{styles\.inputField\}/)?.[0] || '';
  assert.doesNotMatch(yearBlock, /requiredStar|required/);
  assert.match(batteryBlock, /min="0"/);
  assert.match(batteryBlock, /max="100"/);
  assert.doesNotMatch(batteryBlock, /required/);
});

test('Public Laptop detail hides absent year and battery health without misleading fallback text', () => {
  assert.match(productDetailPage, /\{laptopSpecs\.manufactureYear && \(/);
  assert.match(productDetailPage, /\{laptopSpecs\.batteryHealth && \(/);
  assert.doesNotMatch(productDetailPage, /laptopSpecs\.batteryHealth \|\| 'نامشخص'/);
  assert.match(productDetailPage, /prod\.manufactureYear \?\? null/);
  assert.match(productDetailPage, /prod\.batteryHealth == null \? null/);
});
