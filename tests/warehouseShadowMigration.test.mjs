import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  WAREHOUSE_SHADOW_PRODUCT_STATUS,
  buildWarehouseShadowExpected,
  buildWarehouseShadowPlan,
  runWarehouseShadowMigration,
  summarizeWarehouseShadowPlan,
  warehouseShadowSourceKey,
} from '../src/lib/warehouseShadowMigration.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');

function source(overrides = {}) {
  return {
    id: 'warehouse-1',
    name: 'کفش تست',
    publicNameEn: 'Test Shoe',
    description: 'Description',
    brandId: 'brand-1',
    brand: { id: 'brand-1', name: 'Brand' },
    categoryId: 'category-1',
    category: { id: 'category-1', name: 'Shoes' },
    sku: 'WH-001',
    price: 6_500_000,
    stock: 5,
    reserved: 0,
    minStock: 2,
    location: 'A-1',
    image: 'https://cdn.example.com/cover.jpg',
    images: [],
    gender: 'women',
    isBestSeller: false,
    hasDiscount: false,
    discountPercent: 0,
    productId: null,
    product: null,
    ...overrides,
  };
}

test('simple Warehouse item maps to one hidden IRAN_STOCK default Variant and exact inventory', () => {
  const result = buildWarehouseShadowExpected(source());
  assert.equal(result.errors, undefined);
  assert.equal(result.expected.product.supplyMode, 'IRAN_STOCK');
  assert.equal(result.expected.product.status, WAREHOUSE_SHADOW_PRODUCT_STATUS);
  assert.equal(result.expected.variant.optionSignature, '__default__');
  assert.equal(result.expected.variant.isActive, false);
  assert.deepEqual(result.expected.inventory, { stock: 5, reserved: 0, minStock: 2, location: 'A-1' });
  assert.equal(result.expected.parity.available, 5);
});

test('reserved quantity is copied as a counter without creating Product reservations', () => {
  const result = buildWarehouseShadowExpected(source({ stock: 5, reserved: 2 }));
  assert.deepEqual(result.expected.inventory, { stock: 5, reserved: 2, minStock: 2, location: 'A-1' });
  assert.equal(result.expected.parity.available, 3);
  const implementation = read('src/lib/warehouseShadowMigration.js');
  assert.doesNotMatch(implementation, /productInventoryReservation\.create/);
});

test('direct Toman price and discount preserve authoritative final-price parity', () => {
  const result = buildWarehouseShadowExpected(source({ price: 6_500_000, hasDiscount: true, discountPercent: 20 }));
  assert.equal(result.expected.product.priceToman, '6500000');
  assert.equal(result.expected.product.priceAed, null);
  assert.equal(result.expected.parity.finalPriceToman, 5_200_000);
});

test('gallery maps the same URLs, order, and primary semantics without Blob ownership', () => {
  const result = buildWarehouseShadowExpected(source({ images: [
    { id: 'i2', url: 'https://cdn.example.com/two.jpg', sortOrder: 1, isPrimary: false },
    { id: 'i1', url: 'https://cdn.example.com/one.jpg', sortOrder: 0, isPrimary: true },
    { id: 'i3', url: 'https://cdn.example.com/three.jpg', sortOrder: 2, isPrimary: false },
  ] }));
  assert.deepEqual(result.expected.images.map(image => image.url), [
    'https://cdn.example.com/one.jpg',
    'https://cdn.example.com/two.jpg',
    'https://cdn.example.com/three.jpg',
  ]);
  assert.deepEqual(result.expected.images.map(image => image.isPrimary), [true, false, false]);
  assert.ok(result.expected.images.every(image => image.blobPathname === null));
});

test('invalid inventory is a controlled conflict and never normalized', () => {
  const result = buildWarehouseShadowExpected(source({ stock: 1, reserved: 2 }));
  assert.equal(result.errors.some(error => error.code === 'STOCK_BELOW_RESERVED'), true);
});

test('missing exact Category or Brand is a conflict rather than a guessed mapping', () => {
  const result = buildWarehouseShadowExpected(source({ categoryId: null, category: null, brandId: null, brand: null }));
  assert.deepEqual(result.errors.map(error => error.code), ['MISSING_CATEGORY', 'MISSING_BRAND']);
});

test('Laptop-like Warehouse records remain explicitly out of scope', () => {
  const laptop = buildWarehouseShadowExpected(source({ name: 'Dell Latitude Laptop', categoryKey: 'electronics' }));
  assert.equal(laptop.errors.some(error => error.code === 'LAPTOP_OUT_OF_SCOPE'), true);
  const accessory = buildWarehouseShadowExpected(source({ name: 'Dell Laptop Charger', categoryKey: 'electronics' }));
  assert.equal(accessory.errors, undefined);
});

test('existing unrelated Warehouse Product link and duplicate SKU are reported', () => {
  const linked = source({ productId: 'legacy-product', product: { id: 'legacy-product', sourceUrlKey: null } });
  const linkedPlan = buildWarehouseShadowPlan({ sources: [linked] });
  assert.equal(linkedPlan.conflicts[0].code, 'SOURCE_ALREADY_LINKED');

  const duplicatePlan = buildWarehouseShadowPlan({
    sources: [source()],
    skuOwners: [{ id: 'variant-existing', productId: 'product-existing', sku: 'wh-001' }],
  });
  assert.equal(duplicatePlan.conflicts[0].code, 'DUPLICATE_SKU');
});

test('dry run reports exact planned counts and performs no transaction or mutation', async () => {
  let transactionCalls = 0;
  const client = {
    warehouseItem: { findMany: async () => [source({ images: [
      { id: 'i1', url: 'https://cdn.example.com/one.jpg', sortOrder: 0, isPrimary: true },
      { id: 'i2', url: 'https://cdn.example.com/two.jpg', sortOrder: 1, isPrimary: false },
      { id: 'i3', url: 'https://cdn.example.com/three.jpg', sortOrder: 2, isPrimary: false },
    ] })] },
    product: { findMany: async () => [] },
    productVariant: { findMany: async () => [] },
    $transaction: async () => { transactionCalls += 1; },
  };
  const result = await runWarehouseShadowMigration(client, { dryRun: true });
  assert.equal(transactionCalls, 0);
  assert.deepEqual(result.preflight, {
    warehouseItemsScanned: 1,
    eligibleItems: 1,
    alreadyMigrated: 0,
    conflicts: 0,
    productsToCreate: 1,
    variantsToCreate: 1,
    inventoriesToCreate: 1,
    imagesToCreate: 3,
    skippedItems: 0,
    conflictDetails: [],
  });
  assert.deepEqual(result.created, { products: 0, variants: 0, inventories: 0, images: 0 });
});

test('migration ownership marker is deterministic and source-specific', () => {
  assert.equal(warehouseShadowSourceKey('warehouse-1'), 'warehouse-shadow:warehouse-1');
  assert.notEqual(warehouseShadowSourceKey('warehouse-1'), warehouseShadowSourceKey('warehouse-2'));
});

test('an equivalent migration-owned target is reported as already migrated on rerun', () => {
  const warehouse = source();
  const { expected } = buildWarehouseShadowExpected(warehouse);
  const target = {
    id: 'shadow-product-1',
    ...expected.product,
    priceToman: { toFixed: () => expected.product.priceToman },
    images: expected.images.map((image, index) => ({ id: `product-image-${index}`, ...image })),
    variants: [{
      id: 'shadow-variant-1',
      productId: 'shadow-product-1',
      ...expected.variant,
      options: [],
      inventory: {
        id: 'shadow-inventory-1',
        variantId: 'shadow-variant-1',
        ...expected.inventory,
        reservations: [],
        movements: [],
      },
    }],
  };
  warehouse.productId = target.id;
  warehouse.product = target;
  const plan = buildWarehouseShadowPlan({
    sources: [warehouse],
    targets: [target],
    skuOwners: [{ id: 'shadow-variant-1', productId: target.id, sku: expected.variant.sku }],
  });
  assert.equal(plan.create.length, 0);
  assert.equal(plan.conflicts.length, 0);
  assert.deepEqual(plan.alreadyMigrated, [{
    warehouseItemId: warehouse.id,
    productId: target.id,
    sourceKey: warehouseShadowSourceKey(warehouse.id),
  }]);
});

test('drift in a migration-owned target is reported instead of silently overwritten', () => {
  const warehouse = source();
  const { expected } = buildWarehouseShadowExpected(warehouse);
  const target = {
    id: 'shadow-product-1',
    ...expected.product,
    nameFa: 'changed after migration',
    priceToman: { toFixed: () => expected.product.priceToman },
    images: [],
    variants: [],
  };
  warehouse.productId = target.id;
  warehouse.product = target;
  const plan = buildWarehouseShadowPlan({ sources: [warehouse], targets: [target] });
  assert.equal(plan.conflicts[0].code, 'ALREADY_MIGRATED_MISMATCH');
  assert.equal(plan.create.length, 0);
});

test('summaries distinguish eligible, already-migrated, conflicts, and skipped records', () => {
  const summary = summarizeWarehouseShadowPlan({
    sources: [source(), source({ id: 'warehouse-2' }), source({ id: 'warehouse-3' })],
    create: [{ expected: { images: [{}, {}] } }],
    alreadyMigrated: [{}],
    conflicts: [{ warehouseItemId: 'warehouse-3', code: 'CONFLICT' }],
  });
  assert.deepEqual(summary, {
    warehouseItemsScanned: 3,
    eligibleItems: 2,
    alreadyMigrated: 1,
    conflicts: 1,
    productsToCreate: 1,
    variantsToCreate: 1,
    inventoriesToCreate: 1,
    imagesToCreate: 2,
    skippedItems: 1,
    conflictDetails: [{ warehouseItemId: 'warehouse-3', code: 'CONFLICT' }],
  });
});

test('multiple conflict reasons on one source count as one skipped Warehouse item', () => {
  const plan = buildWarehouseShadowPlan({
    sources: [source({ brandId: null, brand: null, categoryId: null, category: null })],
  });
  const summary = summarizeWarehouseShadowPlan(plan);
  assert.equal(plan.conflicts.length, 2);
  assert.equal(summary.conflicts, 1);
  assert.equal(summary.skippedItems, 1);
});

test('script is explicit-only, endpoint guarded, and package lifecycle never runs it automatically', () => {
  const script = read('scripts/migrate-warehouse-to-products.mjs');
  const packageJson = JSON.parse(read('package.json'));
  assert.match(script, /--dry-run/);
  assert.match(script, /--apply/);
  assert.match(script, /--expect-db-endpoint/);
  assert.match(script, /Database endpoint mismatch/);
  assert.equal(packageJson.scripts['migrate:warehouse-to-products'], 'node scripts/migrate-warehouse-to-products.mjs');
  for (const lifecycle of ['dev', 'build', 'start', 'postinstall']) {
    assert.doesNotMatch(packageJson.scripts[lifecycle], /migrate:warehouse-to-products/);
  }
});

test('implementation preserves legacy Warehouse and historical Order architecture', () => {
  const implementation = read('src/lib/warehouseShadowMigration.js');
  const schema = read('prisma/schema.prisma');
  assert.doesNotMatch(implementation, /warehouseItem\.(delete|deleteMany)/);
  assert.doesNotMatch(implementation, /order(Item)?\.(update|delete|create)/i);
  assert.match(schema, /warehouseItemId\s+String\?/);
  assert.match(schema, /WAREHOUSE_STOCK/);
  assert.match(implementation, /status: WAREHOUSE_SHADOW_PRODUCT_STATUS/);
  assert.match(implementation, /isolationLevel: 'Serializable', maxWait: 10_000, timeout: 60_000/);
});
