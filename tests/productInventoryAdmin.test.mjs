import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ADMIN_INVENTORY_ADJUSTMENT_REASONS,
  buildAdminInventoryMovementReason,
  deriveAdminInventoryStatus,
  validateAdminInventoryAdjustment,
  validateAdminInventoryConfiguration,
} from '../src/lib/adminProductInventoryDomain.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const service = read('src/lib/adminProductInventoryService.js');
const page = read('src/app/admin/inventory/page.js');
const styles = read('src/app/admin/inventory/Inventory.module.css');
const listRoute = read('src/app/api/admin/inventory/route.js');
const mutationRoutes = [
  'src/app/api/admin/inventory/[variantId]/route.js',
  'src/app/api/admin/inventory/[variantId]/adjust/route.js',
  'src/app/api/admin/inventory/[variantId]/history/route.js',
].map(read).join('\n');
const schema = read('prisma/schema.prisma');

test('inventory status derives from available stock rather than physical stock alone', () => {
  assert.equal(deriveAdminInventoryStatus({ stock: 10, reserved: 2, minStock: 3 }), 'IN_STOCK');
  assert.equal(deriveAdminInventoryStatus({ stock: 5, reserved: 3, minStock: 2 }), 'LOW_STOCK');
  assert.equal(deriveAdminInventoryStatus({ stock: 2, reserved: 2, minStock: 0 }), 'OUT_OF_STOCK');
  assert.equal(deriveAdminInventoryStatus(null), 'UNINITIALIZED');
});

test('adjustment validation accepts controlled add, remove, and set modes', () => {
  for (const mode of ['ADD', 'REMOVE', 'SET']) {
    const result = validateAdminInventoryAdjustment({ mode, value: mode === 'SET' ? 0 : 2, reasonCode: 'COUNT_CORRECTION', note: ' count ', idempotencyKey: `key:${mode}` });
    assert.equal(result.error, undefined);
    assert.equal(result.data.note, 'count');
  }
});

test('adjustment requires a positive quantity except nonnegative set target', () => {
  assert.ok(validateAdminInventoryAdjustment({ mode: 'ADD', value: 0, reasonCode: 'NEW_PURCHASE', idempotencyKey: 'a' }).error);
  assert.ok(validateAdminInventoryAdjustment({ mode: 'REMOVE', value: -1, reasonCode: 'DAMAGED', idempotencyKey: 'b' }).error);
  assert.ok(validateAdminInventoryAdjustment({ mode: 'SET', value: -1, reasonCode: 'COUNT_CORRECTION', idempotencyKey: 'c' }).error);
});

test('adjustment reason is controlled and required', () => {
  assert.deepEqual(Object.keys(ADMIN_INVENTORY_ADJUSTMENT_REASONS), ['NEW_PURCHASE', 'COUNT_CORRECTION', 'RETURNED', 'DAMAGED', 'MANUAL_CORRECTION', 'STOCK_TRANSFER']);
  assert.ok(validateAdminInventoryAdjustment({ mode: 'ADD', value: 1, reasonCode: 'ARBITRARY', idempotencyKey: 'x' }).error);
  assert.equal(buildAdminInventoryMovementReason('COUNT_CORRECTION', 'Physical count'), 'اصلاح شمارش — Physical count');
});

test('adjustment rejects unknown fields and missing idempotency', () => {
  assert.ok(validateAdminInventoryAdjustment({ mode: 'ADD', value: 1, reasonCode: 'NEW_PURCHASE', reserved: 0, idempotencyKey: 'x' }).error);
  assert.ok(validateAdminInventoryAdjustment({ mode: 'ADD', value: 1, reasonCode: 'NEW_PURCHASE' }).error);
});

test('minimum stock and location configuration is normalized independently', () => {
  assert.deepEqual(validateAdminInventoryConfiguration({ minStock: 5, location: ' Shelf A ' }).data, { minStock: 5, location: 'Shelf A' });
  assert.deepEqual(validateAdminInventoryConfiguration({ location: '   ' }).data, { location: null });
  assert.ok(validateAdminInventoryConfiguration({ minStock: -1 }).error);
});

test('configuration endpoint cannot accept physical or reserved counters', () => {
  assert.ok(validateAdminInventoryConfiguration({ stock: 5 }).error);
  assert.ok(validateAdminInventoryConfiguration({ reserved: 2 }).error);
});

test('listing is restricted to IRAN_STOCK and excludes external supply', () => {
  assert.match(service, /p\."supplyMode" = 'IRAN_STOCK'/);
  assert.match(service, /PRODUCT_INVENTORY_NOT_APPLICABLE/);
  assert.doesNotMatch(page, /EXTERNAL_DUBAI/);
});

test('listing search covers bilingual names, SKU, and canonical option labels', () => {
  for (const field of ['nameFa', 'nameEn', 'sku', 'labelFa', 'labelEn']) assert.match(service, new RegExp(field));
  assert.match(service, /ProductVariantOption/);
  assert.doesNotMatch(service, /selectedColor|selectedSize/);
});

test('row serializer uses canonical options and the central cover resolver', () => {
  assert.match(service, /getProductCoverImage/);
  assert.match(service, /row\.attributeOption\.labelFa/);
  assert.match(service, /variantLabel/);
  assert.match(service, /images:[\s\S]*?take: 1/);
});

test('server pagination supports only bounded 25 or 50 row pages', () => {
  assert.match(service, /\[25, 50\]\.includes\(limit\)/);
  assert.match(service, /LIMIT \$\{filters\.limit\} OFFSET \$\{offset\}/);
  assert.match(page, /25/);
  assert.match(page, /50/);
});

test('default attention sorting is deterministic', () => {
  assert.match(service, /WHEN i\."id" IS NULL THEN 0/);
  assert.match(service, /WHEN \(i\."stock" - i\."reserved"\) <= 0 THEN 1/);
  assert.match(service, /v\."id" ASC/);
});

test('set physical stock calculates delta on the server from current stock', () => {
  assert.match(service, /input\.value - variant\.inventory\.stock/);
  assert.doesNotMatch(page, /currentStock/);
});

test('stock mutations reuse the authoritative Phase 2E transaction function', () => {
  assert.match(service, /adjustProductInventoryStockInTransaction/);
  assert.match(service, /runSerializableWithRetry/);
  assert.doesNotMatch(service, /productInventory\.update\([\s\S]*?stock:/);
});

test('idempotency verifies replay semantics before returning current state', () => {
  assert.match(service, /productInventoryMovement\.findUnique\(\{ where: \{ idempotencyKey/);
  assert.match(service, /replay\.stockAfter === input\.value/);
  assert.match(service, /IDEMPOTENCY_KEY_CONFLICT/);
});

test('configuration update creates no physical movement', () => {
  const start = service.indexOf('export async function updateAdminProductInventoryConfiguration');
  const end = service.indexOf('export async function adjustAdminProductInventory');
  const block = service.slice(start, end);
  assert.match(block, /productInventory\.update/);
  assert.doesNotMatch(block, /productInventoryMovement/);
});

test('history is read-only and separates movements from reservations', () => {
  assert.match(service, /getAdminProductInventoryHistory/);
  assert.match(service, /productInventoryMovement\.findMany/);
  assert.match(service, /productInventoryReservation\.findMany/);
  assert.doesNotMatch(mutationRoutes, /releaseProductInventoryReservation/);
});

test('history dialog resolves the fetch response before parsing it', () => {
  assert.match(page, /fetch\(`\/api\/admin\/inventory\/\$\{encodeURIComponent\(row\.productVariantId\)\}\/history`[\s\S]*?\.then\(readApi\)/);
  assert.match(page, /historyRequest\.current \|\|=/);
  assert.doesNotMatch(page, /readApi\(fetch\(/);
});

test('all inventory Admin routes enforce existing Product RBAC', () => {
  assert.match(listRoute, /PRODUCTS_VIEW/);
  assert.match(mutationRoutes, /PRODUCTS_VIEW/);
  assert.match(mutationRoutes, /PRODUCTS_EDIT/);
  assert.doesNotMatch(`${listRoute}\n${mutationRoutes}`, /WAREHOUSE_|LAPTOPS_/);
});

test('adjustment and configuration actions are audit logged without session data', () => {
  assert.match(mutationRoutes, /PRODUCT_INVENTORY_ADJUSTED/);
  assert.match(mutationRoutes, /PRODUCT_INVENTORY_CONFIGURATION_UPDATED/);
  assert.match(mutationRoutes, /productVariantId/);
  assert.doesNotMatch(mutationRoutes, /cookie|session|DATABASE_URL|DIRECT_URL/);
});

test('responsive inventory changes tables to cards without page overflow', () => {
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(styles, /\.tableWrap \{ display: none; \}/);
  assert.match(styles, /\.mobileList \{ display: grid; \}/);
  assert.match(styles, /@media \(max-width: 430px\)/);
  assert.match(styles, /overflow-wrap: anywhere/);
  assert.match(page, /className=\{styles\.card\}/);
});

test('Phase 2J needs no schema migration or redundant inventory status field', () => {
  const inventoryModel = schema.slice(schema.indexOf('model ProductInventory {'), schema.indexOf('model ProductInventoryReservation {'));
  for (const field of ['stock', 'reserved', 'minStock', 'location']) assert.match(inventoryModel, new RegExp(`\\b${field}\\b`));
  assert.doesNotMatch(inventoryModel, /^\s*status\s+/m);
});
