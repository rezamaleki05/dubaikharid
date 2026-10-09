import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const migrationName = '20260929000100_reconcile_payment_shipment_schema';
const migration = read(`prisma/migrations/${migrationName}/migration.sql`);
const categoryAttributeMigration = read('prisma/migrations/20260902000100_category_attribute_foundation/migration.sql');
const schema = read('prisma/schema.prisma');

test('reconciliation migration contains only the three reviewed drift corrections', () => {
  const normalized = migration.replace(/\s+/g, ' ').trim();
  assert.equal(
    normalized,
    'ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_fkey"; '
      + 'ALTER TABLE "Payment" ALTER COLUMN "updatedAt" DROP DEFAULT; '
      + 'ALTER TABLE "Shipment" ALTER COLUMN "dateUpdated" DROP DEFAULT; '
      + 'ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" '
      + 'FOREIGN KEY ("orderId") REFERENCES "Order"("id") '
      + 'ON DELETE RESTRICT ON UPDATE CASCADE;',
  );
});

test('authoritative Prisma schema expects restrictive Payment order deletion', () => {
  const payment = schema.slice(schema.indexOf('model Payment {'), schema.indexOf('model BankAccount {'));
  assert.match(payment, /orderId\s+String\?/);
  assert.match(payment, /order\s+Order\?\s+@relation\(fields: \[orderId\], references: \[id\], onDelete: Restrict\)/);
});

test('authoritative Prisma updatedAt fields have no database default', () => {
  const payment = schema.slice(schema.indexOf('model Payment {'), schema.indexOf('model BankAccount {'));
  const shipment = schema.slice(schema.indexOf('model Shipment {'), schema.indexOf('model Brand {'));
  assert.match(payment, /updatedAt\s+DateTime\s+@updatedAt/);
  assert.doesNotMatch(payment, /updatedAt[^\n]*@default/);
  assert.match(shipment, /updatedAt\s+DateTime\s+@updatedAt\s+@map\("dateUpdated"\)/);
  assert.doesNotMatch(shipment, /updatedAt[^\n]*@default/);
});

test('reconciliation runs after every existing release migration', () => {
  const migrations = readdirSync(join(root, 'prisma/migrations'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  assert.ok(migrations.includes(migrationName));
  assert.deepEqual(migrations.filter(name => name > migrationName), [
    '20261005000100_telegram_publication_foundation',
    '20261009000100_laptop_model_identity',
  ]);
  for (const releaseMigration of [
    '20260902000100_category_attribute_foundation',
    '20260902000200_product_variant_foundation',
    '20260902000300_product_supply_pricing',
    '20260903000100_product_variant_inventory',
    '20260904000100_orderitem_variant_compatibility',
    '20260920000100_product_multi_image_gallery',
  ]) {
    assert.ok(migrations.indexOf(releaseMigration) < migrations.indexOf(migrationName));
  }
});

test('release migrations do not modify the reconciled Payment or Shipment definitions', () => {
  const releaseSql = [
    '20260902000100_category_attribute_foundation',
    '20260902000200_product_variant_foundation',
    '20260902000300_product_supply_pricing',
    '20260903000100_product_variant_inventory',
    '20260904000100_orderitem_variant_compatibility',
    '20260920000100_product_multi_image_gallery',
  ].map(name => read(`prisma/migrations/${name}/migration.sql`)).join('\n');

  assert.doesNotMatch(releaseSql, /ALTER TABLE "Payment"/);
  assert.doesNotMatch(releaseSql, /ALTER TABLE "Shipment"/);
});

test('ProductAttributeValue unique index maps to PostgreSQL truncated identifier', () => {
  const productAttributeValue = schema.slice(
    schema.indexOf('model ProductAttributeValue {'),
    schema.indexOf('model ProductVariant {'),
  );

  assert.match(
    productAttributeValue,
    /@@unique\(\[productId, categoryAttributeId, attributeOptionId\], map: "ProductAttributeValue_productId_categoryAttributeId_attributeOp"\)/,
  );
  assert.match(
    categoryAttributeMigration,
    /CREATE UNIQUE INDEX "ProductAttributeValue_productId_categoryAttributeId_attributeOptionId_key"\s+ON "ProductAttributeValue"\("productId", "categoryAttributeId", "attributeOptionId"\);/,
  );
});
