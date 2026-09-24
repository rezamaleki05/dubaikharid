import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { buildWarehouseShadowExpected, warehouseShadowSourceKey } from '../src/lib/warehouseShadowMigration.js';
import {
  WAREHOUSE_CUTOVER_ROLLBACK_POLICY,
  buildWarehouseCutoverCandidate,
  buildWarehouseCutoverPlan,
  getWarehouseCutoverMappingFromData,
  runWarehouseProductCutover,
  summarizeWarehouseCutoverPlan,
} from '../src/lib/warehouseProductCutover.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');

function source(overrides = {}) {
  const warehouse = {
    id: 'warehouse-cutover-1',
    name: 'کفش کات‌اور',
    publicNameEn: 'Cutover Shoe',
    description: 'Cutover fixture',
    brandId: 'brand-1',
    brand: { id: 'brand-1', name: 'Brand', faName: 'برند' },
    categoryId: 'category-1',
    category: { id: 'category-1', name: 'Shoes', query: 'shoes' },
    categoryKey: 'shoes',
    sku: 'CUTOVER-001',
    price: 6_500_000,
    stock: 5,
    reserved: 0,
    minStock: 2,
    location: 'A-1',
    image: 'https://cdn.example.com/cover.jpg',
    images: [{ id: 'wi-1', url: 'https://cdn.example.com/cover.jpg', sortOrder: 0, isPrimary: true }],
    gender: 'women',
    isBestSeller: false,
    hasDiscount: false,
    discountPercent: 0,
    isPublished: true,
    isArchived: false,
    publishedAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-02T00:00:00.000Z'),
    orderItems: [],
    movements: [],
    productId: null,
    product: null,
    ...overrides,
  };
  if (overrides.product === undefined) {
    const built = buildWarehouseShadowExpected(warehouse);
    assert.equal(built.errors, undefined);
    const expected = built.expected;
    warehouse.productId = 'product-cutover-1';
    warehouse.product = {
      id: warehouse.productId,
      ...expected.product,
      images: expected.images.map((image, index) => ({ id: `pi-${index}`, createdAt: new Date(), ...image })),
      variants: [{
        id: 'variant-cutover-1',
        productId: warehouse.productId,
        createdAt: new Date(),
        ...expected.variant,
        options: [],
        inventory: {
          id: 'inventory-cutover-1',
          variantId: 'variant-cutover-1',
          ...expected.inventory,
          reservations: [],
          movements: [],
        },
        _count: { orderItems: 0 },
      }],
      _count: { orderItems: 0 },
    };
  }
  return warehouse;
}

test('eligible shadow produces an exact active Product/Variant and 5/0 inventory plan', () => {
  const result = buildWarehouseCutoverCandidate(source(), { skuOwners: [] });
  assert.equal(result.blocked, undefined);
  assert.equal(result.eligible.expected.product.status, 'active');
  assert.equal(result.eligible.expected.variant.isActive, true);
  assert.deepEqual(result.eligible.expected.inventory, { stock: 5, reserved: 0, minStock: 2, location: 'A-1' });
});

test('active Warehouse reservation blocks cutover without partial activation', () => {
  const warehouse = source({ reserved: 2 });
  warehouse.product.variants[0].inventory.reserved = 2;
  const result = buildWarehouseCutoverCandidate(warehouse);
  assert.equal(result.blocked[0].code, 'ACTIVE_WAREHOUSE_RESERVATION');
});

test('unresolved non-terminal Warehouse Order blocks even when reserved is zero', () => {
  const warehouse = source({
    orderItems: [{ id: 'oi-1', orderId: 'order-1', order: { id: 'order-1', type: 'WAREHOUSE_STOCK', status: 'pending', orderCode: 'W-1' } }],
  });
  const result = buildWarehouseCutoverCandidate(warehouse);
  assert.equal(result.blocked[0].code, 'IN_FLIGHT_WAREHOUSE_ORDER');
});

test('completed/cancelled or explicitly released legacy Orders do not block', () => {
  const completed = source({
    orderItems: [{ id: 'oi-1', orderId: 'order-1', order: { id: 'order-1', type: 'WAREHOUSE_STOCK', status: 'delivered', orderCode: 'W-1' } }],
  });
  assert.ok(buildWarehouseCutoverCandidate(completed).eligible);
  const released = source({
    orderItems: [{ id: 'oi-2', orderId: 'order-2', order: { id: 'order-2', type: 'WAREHOUSE_STOCK', status: 'pending', orderCode: 'W-2' } }],
    movements: [{ orderId: 'order-2', type: 'ORDER_RELEASE' }],
  });
  assert.ok(buildWarehouseCutoverCandidate(released).eligible);
});

test('stock drift is reconciled to latest Warehouse stock before activation', () => {
  const warehouse = source();
  warehouse.stock = 7;
  const result = buildWarehouseCutoverCandidate(warehouse);
  assert.equal(result.eligible.expected.inventory.stock, 7);
  assert.ok(result.eligible.reconciliationFields.includes('inventory.stock'));
});

test('latest Warehouse price and discount become authoritative with exact parity', () => {
  const warehouse = source();
  warehouse.price = 8_000_000;
  warehouse.hasDiscount = true;
  warehouse.discountPercent = 25;
  const result = buildWarehouseCutoverCandidate(warehouse);
  assert.equal(result.eligible.expected.product.priceToman, '8000000');
  assert.equal(result.eligible.expected.parity.finalPriceToman, 6_000_000);
  assert.ok(result.eligible.reconciliationFields.includes('product.priceToman'));
});

test('gallery drift preserves latest order/primary and never claims Blob ownership', () => {
  const warehouse = source();
  warehouse.images = [
    { id: 'wi-2', url: 'https://cdn.example.com/two.jpg', sortOrder: 1, isPrimary: false },
    { id: 'wi-1', url: 'https://cdn.example.com/one.jpg', sortOrder: 0, isPrimary: true },
  ];
  warehouse.image = 'https://cdn.example.com/one.jpg';
  const result = buildWarehouseCutoverCandidate(warehouse);
  assert.deepEqual(result.eligible.expected.images.map(image => image.url), [
    'https://cdn.example.com/one.jpg',
    'https://cdn.example.com/two.jpg',
  ]);
  assert.ok(result.eligible.expected.images.every(image => image.blobPathname === null));
  assert.ok(result.eligible.reconciliationFields.includes('product.images'));
});

test('ownership, supply, default Variant, inventory, and SKU conflicts are controlled blockers', () => {
  const ownership = source();
  ownership.product.sourceUrlKey = 'warehouse-shadow:other';
  assert.equal(buildWarehouseCutoverCandidate(ownership).blocked[0].code, 'SOURCE_LINK_MISMATCH');

  const supply = source();
  supply.product.supplyMode = 'EXTERNAL_DUBAI';
  assert.equal(buildWarehouseCutoverCandidate(supply).blocked[0].code, 'INVALID_SUPPLY_MODE');

  const variant = source();
  variant.product.variants.push({ ...variant.product.variants[0], id: 'variant-2' });
  assert.equal(buildWarehouseCutoverCandidate(variant).blocked[0].code, 'DEFAULT_VARIANT_MISMATCH');

  const inventory = source();
  inventory.product.variants[0].inventory = null;
  assert.equal(buildWarehouseCutoverCandidate(inventory).blocked[0].code, 'SHADOW_INVENTORY_MISSING');

  const sku = source();
  assert.equal(buildWarehouseCutoverCandidate(sku, { skuOwners: [{ id: 'variant-other', sku: 'cutover-001' }] }).blocked[0].code, 'DUPLICATE_SKU');
});

test('Product-side activity blocks authority switching', () => {
  const warehouse = source();
  warehouse.product.variants[0].inventory.reservations = [{ id: 'reservation-1' }];
  assert.equal(buildWarehouseCutoverCandidate(warehouse).blocked[0].code, 'SHADOW_PRODUCT_ACTIVITY');
});

test('fully cut-over state is idempotently recognized', () => {
  const warehouse = source({ isPublished: false });
  warehouse.product.status = 'active';
  warehouse.product.variants[0].isActive = true;
  assert.deepEqual(getWarehouseCutoverMappingFromData(warehouse), {
    warehouseItemId: warehouse.id,
    productId: warehouse.product.id,
    productVariantId: warehouse.product.variants[0].id,
  });
  assert.ok(buildWarehouseCutoverCandidate(warehouse).alreadyCutOver);
});

test('partial active-Product/published-Warehouse state is never silently repaired', () => {
  const warehouse = source();
  warehouse.product.status = 'active';
  warehouse.product.variants[0].isActive = true;
  assert.equal(buildWarehouseCutoverCandidate(warehouse).blocked[0].code, 'CUTOVER_STATE_MISMATCH');
});

test('dry run reports eligibility, blockers, reconciliation, and performs no transaction', async () => {
  let transactionCalls = 0;
  const eligible = source();
  eligible.stock = 7;
  const blocked = source({ id: 'warehouse-cutover-2', reserved: 2 });
  blocked.product.variants[0].inventory.reserved = 2;
  const client = {
    warehouseItem: { findMany: async () => [eligible, blocked] },
    productVariant: { findMany: async () => [] },
    $transaction: async () => { transactionCalls += 1; },
  };
  const result = await runWarehouseProductCutover(client, { dryRun: true });
  assert.equal(transactionCalls, 0);
  assert.equal(result.preflight.eligible, 1);
  assert.equal(result.preflight.blockedReservations, 1);
  assert.equal(result.preflight.reconciliationRequired, 1);
  assert.equal(result.preflight.wouldActivate, 1);
  assert.equal(result.preflight.wouldDepublishWarehouse, 1);
});

test('summary counts each blocked source once', () => {
  const summary = summarizeWarehouseCutoverPlan({
    sources: [{}, {}, {}],
    eligible: [{ reconciliationFields: ['inventory.stock'], warehouseItemId: 'one' }],
    alreadyCutOver: [{}],
    blocked: [
      { warehouseItemId: 'blocked', code: 'ACTIVE_WAREHOUSE_RESERVATION' },
      { warehouseItemId: 'blocked', code: 'SECOND_REASON' },
    ],
  });
  assert.equal(summary.conflicts, 1);
  assert.equal(summary.blockedReservations, 1);
  assert.equal(summary.reconciliationRequired, 1);
});

test('legacy Cart and Checkout normalize only fully cut-over Warehouse identities', () => {
  const cartRoute = read('src/app/api/cart/resolve/route.js');
  const cartContext = read('src/context/CartContext.js');
  const orders = read('src/lib/publicOrders.js');
  assert.match(cartRoute, /getWarehouseCutoverMappingFromData/);
  assert.match(cartRoute, /productVariantId: mapping\.productVariantId/);
  assert.match(cartContext, /item\.type !== authoritative\.type/);
  assert.match(orders, /findWarehouseCutoverMappings/);
  assert.match(orders, /type: 'CATALOG_PRODUCT'/);
  assert.match(orders, /createFutureIranStockVariantOrder/);
  assert.match(orders, /WAREHOUSE_CART_MIGRATION_REQUIRED/);
});

test('legacy public Warehouse URL permanently redirects to canonical Product URL', () => {
  const layout = read('src/app/warehouse/[slug]/layout.js');
  assert.match(layout, /permanentRedirect/);
  assert.match(layout, /\/product\/\$\{encodeURIComponent\(mapping\.productId\)\}/);
});

test('Warehouse Admin blocks cut-over mutations while keeping uncutover behavior scoped', () => {
  const service = read('src/lib/adminWarehouse.js');
  const page = read('src/app/admin/warehouse/page.js');
  assert.match(service, /WAREHOUSE_ITEM_CUT_OVER/);
  assert.match(service, /assertWarehouseCutoverMutable\(current\)/);
  assert.match(page, /منتقل‌شده به محصول/);
  assert.match(page, /selectedProduct\.cutover\?\.locked/);
  assert.doesNotMatch(service, /WAREHOUSE_ITEM_CUT_OVER[\s\S]*createWarehouseItem/);
});

test('cutover implementation is serializable, audit-safe, and preserves historical architecture', () => {
  const implementation = read('src/lib/warehouseProductCutover.js');
  const schema = read('prisma/schema.prisma');
  assert.match(implementation, /isolationLevel: 'Serializable'/);
  assert.match(implementation, /productInventoryMovement\.create/);
  assert.match(implementation, /isPublished: false/);
  assert.doesNotMatch(implementation, /warehouseItem\.(delete|deleteMany)/);
  assert.doesNotMatch(implementation, /order(Item)?\.(update|delete|create)/i);
  assert.match(schema, /WAREHOUSE_STOCK/);
  assert.match(schema, /IRAN_STOCK_PRODUCT/);
});

test('script is explicit, endpoint-guarded, absent from lifecycle hooks, and rollback is deny-by-default', () => {
  const script = read('scripts/cutover-warehouse-to-products.mjs');
  const packageJson = JSON.parse(read('package.json'));
  assert.match(script, /--dry-run/);
  assert.match(script, /--apply/);
  assert.match(script, /--warehouse-item/);
  assert.match(script, /Database endpoint mismatch/);
  assert.equal(packageJson.scripts['cutover:warehouse-to-products'], 'node scripts/cutover-warehouse-to-products.mjs');
  for (const lifecycle of ['dev', 'build', 'start', 'postinstall']) {
    assert.doesNotMatch(packageJson.scripts[lifecycle], /cutover:warehouse-to-products/);
  }
  assert.equal(WAREHOUSE_CUTOVER_ROLLBACK_POLICY.automated, false);
  assert.equal(WAREHOUSE_CUTOVER_ROLLBACK_POLICY.requirements.length, 4);
  assert.equal(warehouseShadowSourceKey('warehouse-cutover-1'), 'warehouse-shadow:warehouse-cutover-1');
});

test('no schema migration or Laptop/PurchaseRequest implementation is introduced', () => {
  const status = read('src/lib/warehouseProductCutover.js');
  assert.doesNotMatch(status, /\bLaptop\b|PurchaseRequest/);
  assert.doesNotMatch(read('prisma/schema.prisma'), /WarehouseCutover|CutoverStatus/);
});
