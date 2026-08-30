import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const names = await import('../src/lib/productNames.js');

test('product creation requires trimmed Persian and English names', () => {
  assert.match(names.validateProductNames({ nameEn: 'Nike Air Max 270' }).error, /نام فارسی/);
  assert.match(names.validateProductNames({ nameFa: 'نایک ایر مکس' }).error, /نام انگلیسی/);
  assert.match(names.validateProductNames({ nameFa: '   ', nameEn: 'Nike Air Max 270' }).error, /نام فارسی/);
  assert.match(names.validateProductNames({ nameFa: 'نایک ایر مکس', nameEn: '   ' }).error, /نام انگلیسی/);
  assert.deepEqual(
    names.validateProductNames({ nameFa: '  نایک ایر مکس  ', nameEn: '  Nike Air Max 270  ' }).data,
    { nameFa: 'نایک ایر مکس', nameEn: 'Nike Air Max 270' },
  );
});

test('partial product updates validate only supplied names', () => {
  assert.deepEqual(names.validateProductNames({ nameFa: 'نام تازه' }, { partial: true }).data, { nameFa: 'نام تازه' });
  assert.deepEqual(names.validateProductNames({ nameEn: 'New name' }, { partial: true }).data, { nameEn: 'New name' });
  assert.match(names.validateProductNames({ nameEn: '   ' }, { partial: true }).error, /نام انگلیسی/);
});

test('API compatibility keeps name as a Persian display alias', () => {
  assert.deepEqual(names.productNameApiFields({ nameFa: 'نام فارسی', nameEn: 'Official Name' }), {
    name: 'نام فارسی',
    nameFa: 'نام فارسی',
    nameEn: 'Official Name',
  });
});

test('catalog search queries both bilingual product fields', async () => {
  const source = await read('src/lib/publicCatalog.js');
  assert.match(source, /nameFa:\s*\{ contains: search, mode: 'insensitive' \}/);
  assert.match(source, /nameEn:\s*\{ contains: search, mode: 'insensitive' \}/);
});

test('admin create/edit forms submit both required names', async () => {
  const source = await read('src/app/admin/products/page.js');
  assert.match(source, /نام فارسی محصول \*/);
  assert.match(source, /نام انگلیسی \/ نام اصلی محصول \*/);
  assert.match(source, /nameFa: addProductManualForm\.nameFa, nameEn: addProductManualForm\.nameEn/);
  assert.match(source, /nameFa: editProductForm\.nameFa, nameEn: editProductForm\.nameEn/);
});

test('storefront detail renders Persian primary and English secondary names safely', async () => {
  const source = await read('src/app/product/[id]/page.js');
  assert.match(source, /<h1 className=\{styles\.productName\}>\{product\.name\}<\/h1>/);
  assert.match(source, /className=\{styles\.productNameEn\} dir="ltr" lang="en"/);
});

test('cart, order snapshot, warehouse and GA4 receive the Persian compatibility name', async () => {
  const [cart, orders, warehouse, analytics] = await Promise.all([
    read('src/app/api/cart/resolve/route.js'),
    read('src/lib/publicOrders.js'),
    read('src/lib/adminWarehouse.js'),
    read('src/lib/analytics.js'),
  ]);
  assert.match(cart, /name: product\.nameFa/);
  assert.match(orders, /return \{ name: product\.nameFa/);
  assert.match(warehouse, /name: item\.product\.nameFa/);
  assert.match(analytics, /source\.name \|\| source\.productName/);
});

test('migration is guarded against unexpected Product data and adds no English description', async () => {
  const [migration, schema] = await Promise.all([
    read('prisma/migrations/20260830000100_bilingual_product_names/migration.sql'),
    read('prisma/schema.prisma'),
  ]);
  assert.match(migration, /IF EXISTS \(SELECT 1 FROM "Product" LIMIT 1\)/);
  assert.match(migration, /DROP COLUMN "name"/);
  assert.match(migration, /ADD COLUMN "nameFa" TEXT NOT NULL/);
  assert.match(migration, /ADD COLUMN "nameEn" TEXT NOT NULL/);
  assert.doesNotMatch(schema, /descriptionEn/);
});

test('external title is exposed only as an English-name suggestion', async () => {
  const [route, form] = await Promise.all([
    read('src/app/api/fetch-product/route.js'),
    read('src/app/admin/products/page.js'),
  ]);
  assert.match(route, /nameEn: cleanTitleStr/);
  assert.match(form, /nameFa: '',\s*nameEn: product\.nameEn \|\| product\.title \|\| ''/);
});
