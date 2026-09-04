import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  deriveProductInventoryState,
  validateAdjustProductInventoryPayload,
  validateInitializeProductInventoryPayload,
  validateReserveProductInventoryLinesPayload,
  validateReserveProductInventoryPayload,
  validateReturnProductInventoryPayload,
} from '../src/lib/productInventoryDomain.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const schema = read('prisma/schema.prisma');
const migration = read('prisma/migrations/20260903000100_product_variant_inventory/migration.sql');
const service = read('src/lib/productInventoryService.js');
const variantService = read('src/lib/adminProductVariantService.js');
const pricingService = read('src/lib/productSupplyPricingService.js');
const publicOrders = read('src/lib/publicOrders.js');
const cartRoute = read('src/app/api/cart/resolve/route.js');
const warehouseSales = read('src/lib/warehouseSales.js');
const adminLaptops = read('src/lib/adminLaptops.js');
const routes = [
  'src/app/api/admin/product-variants/[id]/inventory/route.js',
  'src/app/api/admin/product-inventory/[id]/adjust/route.js',
  'src/app/api/admin/product-inventory/[id]/return/route.js',
  'src/app/api/admin/product-inventory/[id]/movements/route.js',
  'src/app/api/admin/product-inventory/[id]/reservations/route.js',
  'src/app/api/admin/product-inventory/reserve/route.js',
  'src/app/api/admin/product-inventory/reservations/[reservationKey]/release/route.js',
  'src/app/api/admin/product-inventory/reservations/[reservationKey]/fulfill/route.js',
  'src/app/api/admin/product-inventory/release-expired/route.js',
].map(read).join('\n');

test('inventory counters derive available and low-stock without storing available', () => {
  assert.deepEqual(deriveProductInventoryState({ stock: 5, reserved: 2, minStock: 3, location: 'A-1' }), {
    stock: 5,
    reserved: 2,
    available: 3,
    minStock: 3,
    lowStock: true,
    location: 'A-1',
  });
  assert.doesNotMatch(schema, /^\s*available\s+/m);
});

test('initialize validation accepts zero stock and rejects invalid or negative counters', () => {
  assert.deepEqual(validateInitializeProductInventoryPayload({ stock: 0, minStock: 0, location: '  A-1  ' }).data, {
    stock: 0,
    minStock: 0,
    location: 'A-1',
  });
  assert.ok(validateInitializeProductInventoryPayload({ stock: -1 }).error);
  assert.ok(validateInitializeProductInventoryPayload({ stock: 1.5 }).error);
  assert.ok(validateInitializeProductInventoryPayload({ stock: 1, minStock: -1 }).error);
});

test('adjustment validation requires a signed nonzero integer and idempotency key', () => {
  assert.deepEqual(validateAdjustProductInventoryPayload({ delta: -3, reason: ' count ', idempotencyKey: ' adjust:1 ' }).data, {
    delta: -3,
    reason: 'count',
    idempotencyKey: 'adjust:1',
  });
  assert.ok(validateAdjustProductInventoryPayload({ delta: 0, idempotencyKey: 'adjust:2' }).error);
  assert.ok(validateAdjustProductInventoryPayload({ delta: 1.2, idempotencyKey: 'adjust:3' }).error);
  assert.ok(validateAdjustProductInventoryPayload({ delta: 1 }).error);
});

test('single reservation requires positive integer quantity and deterministic key', () => {
  const valid = validateReserveProductInventoryPayload({
    variantId: 'variant-a',
    quantity: 2,
    reservationKey: 'qa:reserve:a',
    expiresAt: '2026-09-03T12:00:00.000Z',
  });
  assert.equal(valid.data.quantity, 2);
  assert.equal(valid.data.expiresAt.toISOString(), '2026-09-03T12:00:00.000Z');
  assert.ok(validateReserveProductInventoryPayload({ variantId: 'a', quantity: 0, reservationKey: 'x' }).error);
  assert.ok(validateReserveProductInventoryPayload({ variantId: 'a', quantity: 1 }).error);
});

test('multi-line reservation derives stable per-variant keys and rejects duplicate variants', () => {
  const valid = validateReserveProductInventoryLinesPayload({
    groupKey: 'checkout:1',
    lines: [{ variantId: 'b', quantity: 2 }, { variantId: 'a', quantity: 1 }],
  });
  assert.deepEqual(valid.data.lines, [
    { variantId: 'b', quantity: 2, reservationKey: 'checkout:1:b' },
    { variantId: 'a', quantity: 1, reservationKey: 'checkout:1:a' },
  ]);
  assert.ok(validateReserveProductInventoryLinesPayload({
    groupKey: 'checkout:2',
    lines: [{ variantId: 'a', quantity: 1 }, { variantId: 'a', quantity: 1 }],
  }).error);
});

test('return validation requires positive quantity and an idempotency key', () => {
  assert.deepEqual(validateReturnProductInventoryPayload({ quantity: 2, reason: '', idempotencyKey: 'return:1' }).data, {
    quantity: 2,
    reason: null,
    idempotencyKey: 'return:1',
  });
  assert.ok(validateReturnProductInventoryPayload({ quantity: -1, idempotencyKey: 'return:2' }).error);
});

test('schema has one inventory row per exact ProductVariant and explicit lifecycle models', () => {
  assert.match(schema, /model ProductInventory \{/);
  assert.match(schema, /variantId\s+String\s+@unique/);
  assert.match(schema, /variant\s+ProductVariant\s+@relation/);
  assert.match(schema, /model ProductInventoryReservation \{/);
  assert.match(schema, /reservationKey\s+String\s+@unique/);
  assert.match(schema, /model ProductInventoryMovement \{/);
  assert.match(schema, /idempotencyKey\s+String\s+@unique/);
});

test('reservation and movement enums cover all required lifecycle states', () => {
  assert.match(schema, /enum ProductInventoryReservationStatus \{\s*ACTIVE\s*RELEASED\s*FULFILLED\s*\}/s);
  for (const type of ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'ORDER_RESERVATION', 'ORDER_RELEASE', 'ORDER_FULFILLMENT', 'RETURN']) {
    assert.match(schema, new RegExp(`\\b${type}\\b`));
  }
});

test('migration adds exactly three inventory tables with database checks', () => {
  assert.equal((migration.match(/CREATE TABLE/g) || []).length, 3);
  assert.match(migration, /ProductInventory_stock_nonnegative/);
  assert.match(migration, /ProductInventory_reserved_within_stock/);
  assert.match(migration, /ProductInventoryReservation_quantity_positive/);
  assert.match(migration, /ProductInventoryMovement_counters_nonnegative/);
});

test('migration is additive and leaves existing business schemas untouched', () => {
  assert.doesNotMatch(migration, /^\s*(?:DROP|DELETE|TRUNCATE|UPDATE)\b/im);
  assert.doesNotMatch(migration, /ALTER TABLE "(?:Product|ProductVariant|Warehouse|Laptop|Cart|Order|OrderItem)"/);
  assert.doesNotMatch(migration, /REFERENCES "(?:Order|OrderItem)"/);
});

test('inventory management rejects EXTERNAL_DUBAI and inactive variants', () => {
  assert.match(service, /supplyMode !== 'IRAN_STOCK'/g);
  assert.match(service, /PRODUCT_INVENTORY_NOT_APPLICABLE/g);
  assert.match(service, /VARIANT_INACTIVE/g);
});

test('inventory initialization conflicts instead of resetting an existing row', () => {
  assert.match(service, /PRODUCT_INVENTORY_EXISTS/g);
  assert.match(service, /productInventory\.findUnique\(\{ where: \{ variantId \}/);
  assert.doesNotMatch(service, /productInventory\.upsert/);
});

test('all stock mutations use serializable transactions and compare-and-swap', () => {
  assert.match(service, /isolationLevel: 'Serializable'/);
  assert.match(service, /MAX_SERIALIZABLE_RETRIES = 3/);
  assert.match(service, /code === 'P2034'/);
  assert.match(service, /originalCode === '40001'/);
  assert.match(service, /updateMany\(\{[\s\S]*?stock: current\.stock, reserved: current\.reserved/);
  assert.match(service, /changed\.count !== 1/);
});

test('reservation checks availability before an atomic reserved increment', () => {
  assert.match(service, /current\.stock - current\.reserved < line\.quantity/);
  assert.match(service, /reservedAfter = current\.reserved \+ line\.quantity/);
  assert.match(service, /type: 'ORDER_RESERVATION'/);
  assert.match(service, /idempotencyKey: `reserve:\$\{line\.reservationKey\}`/);
});

test('multi-line reservations sort inventory IDs and run in one transaction', () => {
  assert.match(service, /sort\(\(left, right\) => left\.inventory\.id\.localeCompare\(right\.inventory\.id\)\)/);
  const functionStart = service.indexOf('export async function reserveProductInventoryLines');
  const releaseStart = service.indexOf('async function transitionReservation');
  const block = service.slice(functionStart, releaseStart);
  assert.equal((block.match(/runSerializableWithRetry/g) || []).length, 1);
});

test('reservation replay, release, and fulfillment are idempotent', () => {
  assert.match(service, /reservation\.status === targetStatus/);
  assert.match(service, /status: 'ACTIVE'/);
  assert.match(service, /idempotencyKey: `\$\{isRelease \? 'release' : 'fulfill'\}:\$\{key\}`/);
  assert.match(service, /RESERVATION_KEY_CONFLICT/);
});

test('release preserves stock while fulfillment decrements stock and reserved', () => {
  assert.match(service, /stockAfter = isRelease \? current\.stock : current\.stock - reservation\.quantity/);
  assert.match(service, /reservedAfter = current\.reserved - reservation\.quantity/);
  assert.match(service, /isRelease \? 'ORDER_RELEASE' : 'ORDER_FULFILLMENT'/);
});

test('return increments stock without mutating reservation history', () => {
  assert.match(service, /export async function returnProductInventory/);
  assert.match(service, /stockAfter = current\.stock \+ quantity/);
  assert.match(service, /type: 'RETURN'/);
  assert.doesNotMatch(service, /productInventoryReservation\.delete|productInventoryMovement\.delete/);
});

test('expiry releases only active reservations due at the supplied time', () => {
  assert.match(service, /status: 'ACTIVE',[\s\S]*?expiresAt: \{ lte: now \}/);
  assert.match(service, /reservationKey: \{ in: reservationKeys \}/);
  assert.match(service, /releaseProductInventoryReservation/);
  assert.doesNotMatch(service, /cron|schedule/i);
});

test('variant deactivation and option identity changes have inventory safeguards', () => {
  assert.match(variantService, /VARIANT_ACTIVE_RESERVATION/);
  assert.match(variantService, /status: 'ACTIVE'/);
  assert.match(variantService, /VARIANT_INVENTORY_IDENTITY_LOCKED/);
  assert.match(variantService, /select: \{ id: true, productId: true, isDefault: true, inventory:/);
});

test('IRAN to EXTERNAL switch is blocked while inventory is reserved or active', () => {
  assert.match(pricingService, /current\.supplyMode === 'IRAN_STOCK'/);
  assert.match(pricingService, /next\.supplyMode === 'EXTERNAL_DUBAI'/);
  assert.match(pricingService, /inventory\?\.reserved/);
  assert.match(pricingService, /PRODUCT_INVENTORY_RESERVATION_ACTIVE/);
});

test('all inventory APIs use Product RBAC and await dynamic params', () => {
  assert.match(routes, /PRODUCTS_VIEW/);
  assert.match(routes, /PRODUCTS_EDIT/g);
  assert.match(routes, /authorizeAdminApiRequest/g);
  assert.match(routes, /await params/g);
  assert.doesNotMatch(routes, /WAREHOUSE_EDIT|LAPTOPS_EDIT/);
});

test('customer IRAN_STOCK checkout reuses the atomic reservation foundation', () => {
  assert.match(publicOrders, /createFutureIranStockVariantOrder/);
  assert.match(publicOrders, /MIXED_FULFILLMENT/);
  assert.match(cartRoute, /resolvePublicProductCartLines/);
  assert.doesNotMatch(cartRoute, /productInventory\.(?:create|update|delete)/);
});

test('Warehouse and Laptop lifecycles remain independent from ProductInventory', () => {
  assert.doesNotMatch(warehouseSales, /ProductInventory|productInventory|ProductVariant/);
  assert.doesNotMatch(adminLaptops, /ProductInventory|productInventory|ProductVariant/);
  assert.doesNotMatch(migration, /"WarehouseItem"|"Laptop"|ALTER TABLE "InventoryMovement"/);
});
