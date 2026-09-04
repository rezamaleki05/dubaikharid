import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildProductVariantOrderItemSnapshotFromData,
  serializeOrderItemSnapshot,
} from '../src/lib/productVariantOrderItemDomain.js';
import { resolveProductVariantPriceFromData } from '../src/lib/productSupplyPricingDomain.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const schema = read('prisma/schema.prisma');
const migration = read('prisma/migrations/20260904000100_orderitem_variant_compatibility/migration.sql');
const snapshotService = read('src/lib/productVariantOrderItemService.js');
const transactionService = read('src/lib/productVariantOrderTransactionService.js');
const linkService = read('src/lib/productInventoryOrderLinkService.js');
const inventoryService = read('src/lib/productInventoryService.js');
const publicOrders = read('src/lib/publicOrders.js');
const cartRoute = read('src/app/api/cart/resolve/route.js');
const warehouseSales = read('src/lib/warehouseSales.js');
const adminLaptops = read('src/lib/adminLaptops.js');
const adminOrders = read('src/lib/adminOrders.js');
const customerAccount = read('src/lib/customerAccount.js');

const iranProduct = {
  id: 'product-calvin-klein',
  nameFa: 'کتانی کلوین کلاین',
  nameEn: 'Calvin Klein Trainers',
  supplyMode: 'IRAN_STOCK',
  priceAed: null,
  priceToman: '2000000',
  weight: 1,
  hasDiscount: true,
  discountPercent: 20,
};

const black42Variant = {
  id: 'variant-black-42',
  productId: iranProduct.id,
  sku: 'CK-BLK-42',
  optionSignature: 'color=black|eu_size=42',
  isActive: true,
  priceAedOverride: null,
  priceTomanOverride: null,
  discountPercentOverride: null,
  weightOverride: null,
  options: [
    {
      attribute: { code: 'eu_size', nameFa: 'سایز اروپا', nameEn: 'EU Size', sortOrder: 2 },
      attributeOption: { code: '42', labelFa: '42', labelEn: '42', sortOrder: 1 },
    },
    {
      attribute: { code: 'color', nameFa: 'رنگ', nameEn: 'Color', sortOrder: 1 },
      attributeOption: { code: 'black', labelFa: 'مشکی', labelEn: 'Black', sortOrder: 1 },
    },
  ],
};

function buildSnapshot(product = iranProduct, variant = black42Variant, quantity = 1) {
  const pricing = resolveProductVariantPriceFromData({ product, variant });
  return buildProductVariantOrderItemSnapshotFromData({ product, variant, pricing, quantity });
}

test('schema adds nullable variant-aware OrderItem snapshots without replacing historical fields', () => {
  for (const field of [
    'productVariantId', 'sourceKind', 'supplyModeSnapshot', 'selectedOptionsSnapshot',
    'productNameFaSnapshot', 'productNameEnSnapshot', 'skuSnapshot',
    'unitPriceAedSnapshot', 'unitPriceTomanSnapshot', 'discountPercentSnapshot',
    'finalUnitPriceTomanSnapshot',
  ]) assert.match(schema, new RegExp(`${field}\\s+`));
  for (const legacyField of ['name', 'priceAed', 'priceToman', 'productId', 'laptopId', 'warehouseItemId', 'selectedColor', 'selectedSize', 'weight']) {
    assert.match(schema, new RegExp(`${legacyField}\\s+`));
  }
  assert.match(schema, /productVariantId\s+String\?/);
  assert.match(schema, /selectedOptionsSnapshot\s+Json\?/);
});

test('source discriminator and Iran-stock OrderType are additive and explicit', () => {
  assert.match(schema, /enum OrderItemSourceKind \{\s*PRODUCT_VARIANT\s*LAPTOP_UNIT\s*LEGACY_WAREHOUSE\s*MANUAL\s*LEGACY_PRODUCT\s*\}/s);
  assert.match(schema, /enum OrderType \{[\s\S]*?IRAN_STOCK_PRODUCT[\s\S]*?\}/);
  assert.match(migration, /ALTER TYPE "OrderType" ADD VALUE IF NOT EXISTS 'IRAN_STOCK_PRODUCT'/);
});

test('Phase 2F migration is one expand-only compatibility migration', () => {
  assert.match(migration, /ALTER TABLE "OrderItem"[\s\S]*?ADD COLUMN "productVariantId" TEXT/);
  assert.match(migration, /ALTER TABLE "ProductInventoryReservation"[\s\S]*?ADD COLUMN "orderId" TEXT[\s\S]*?ADD COLUMN "orderItemId" TEXT/);
  assert.doesNotMatch(migration, /^\s*(?:DROP|DELETE|TRUNCATE|UPDATE)\b/im);
  assert.doesNotMatch(migration, /ALTER TABLE "(?:WarehouseItem|Laptop|Payment|Shipment|PurchaseRequest)"/);
  assert.doesNotMatch(migration, /SET NOT NULL|RENAME (?:COLUMN|TABLE)/i);
});

test('Black / 42 snapshot preserves exact variant, names, SKU, supply mode and quantity', () => {
  const snapshot = buildSnapshot(iranProduct, black42Variant, 2);
  assert.equal(snapshot.productId, iranProduct.id);
  assert.equal(snapshot.productVariantId, black42Variant.id);
  assert.equal(snapshot.supplyModeSnapshot, 'IRAN_STOCK');
  assert.equal(snapshot.productNameFaSnapshot, iranProduct.nameFa);
  assert.equal(snapshot.productNameEnSnapshot, iranProduct.nameEn);
  assert.equal(snapshot.skuSnapshot, 'CK-BLK-42');
  assert.equal(snapshot.quantity, 2);
  assert.equal(snapshot.sourceKind, 'PRODUCT_VARIANT');
});

test('selected options snapshot is canonical and stores stable codes plus both historical labels', () => {
  assert.deepEqual(buildSnapshot().selectedOptionsSnapshot, [
    { attributeCode: 'color', attributeNameFa: 'رنگ', attributeNameEn: 'Color', optionCode: 'black', labelFa: 'مشکی', labelEn: 'Black' },
    { attributeCode: 'eu_size', attributeNameFa: 'سایز اروپا', attributeNameEn: 'EU Size', optionCode: '42', labelFa: '42', labelEn: '42' },
  ]);
});

test('legacy color and size are populated only from recognized canonical attributes', () => {
  const snapshot = buildSnapshot();
  assert.equal(snapshot.selectedColor, 'مشکی');
  assert.equal(snapshot.selectedSize, '42');
  assert.deepEqual(buildSnapshot(iranProduct, { ...black42Variant, options: [] }).selectedOptionsSnapshot, []);
});

test('default variant snapshots an empty option array without fake color or size', () => {
  const variant = {
    ...black42Variant,
    id: 'variant-default',
    optionSignature: '__default__',
    sku: null,
    options: [],
  };
  const snapshot = buildSnapshot(iranProduct, variant);
  assert.equal(snapshot.productVariantId, 'variant-default');
  assert.deepEqual(snapshot.selectedOptionsSnapshot, []);
  assert.equal(snapshot.selectedColor, null);
  assert.equal(snapshot.selectedSize, null);
});

test('wrong-product and inactive variants are controlled rejections', () => {
  const pricing = resolveProductVariantPriceFromData({ product: iranProduct, variant: black42Variant });
  assert.throws(
    () => buildProductVariantOrderItemSnapshotFromData({ product: { ...iranProduct, id: 'other' }, variant: black42Variant, pricing, quantity: 1 }),
    error => error.code === 'VARIANT_PRODUCT_MISMATCH',
  );
  assert.throws(
    () => buildProductVariantOrderItemSnapshotFromData({ product: iranProduct, variant: { ...black42Variant, isActive: false }, pricing, quantity: 1 }),
    error => error.code === 'VARIANT_INACTIVE',
  );
});

test('Iran pricing snapshots authoritative base, discount and final unit Toman', () => {
  const snapshot = buildSnapshot();
  assert.equal(snapshot.unitPriceAedSnapshot, null);
  assert.equal(snapshot.unitPriceTomanSnapshot, '2000000');
  assert.equal(snapshot.discountPercentSnapshot, 20);
  assert.equal(snapshot.finalUnitPriceTomanSnapshot, '1600000');
});

test('variant price/discount overrides, including explicit 0%, remain authoritative', () => {
  const variant = { ...black42Variant, priceTomanOverride: '2200000', discountPercentOverride: 0 };
  const snapshot = buildSnapshot(iranProduct, variant);
  assert.equal(snapshot.unitPriceTomanSnapshot, '2200000');
  assert.equal(snapshot.discountPercentSnapshot, 0);
  assert.equal(snapshot.finalUnitPriceTomanSnapshot, '2200000');
});

test('external pricing snapshot reuses Phase 2D authority and records Decimal-ready values', () => {
  const product = { ...iranProduct, supplyMode: 'EXTERNAL_DUBAI', priceAed: '100.00', priceToman: null, hasDiscount: true, discountPercent: 10 };
  const variant = { ...black42Variant, priceAedOverride: '120.00', priceTomanOverride: null };
  const settings = { aedRate: 20000, commissionPercent: 10, shippingPerKgAed: 40, minWeightClass: 1, roundingMethod: 'ceil' };
  const pricing = resolveProductVariantPriceFromData({ product, variant, settings });
  const snapshot = buildProductVariantOrderItemSnapshotFromData({ product, variant, pricing, quantity: 1 });
  assert.equal(snapshot.unitPriceAedSnapshot, '120.00');
  assert.equal(snapshot.unitPriceTomanSnapshot, null);
  assert.equal(snapshot.discountPercentSnapshot, 10);
  assert.equal(snapshot.finalUnitPriceTomanSnapshot, '3176000');
});

test('server builder loads Product/Variant/options and never accepts a client final price', () => {
  assert.match(snapshotService, /productVariant\.findUnique/);
  assert.match(snapshotService, /resolveAuthoritativeProductVariantPrice/);
  assert.match(snapshotService, /attributeOption:[\s\S]*?labelFa:[\s\S]*?labelEn:/);
  assert.doesNotMatch(snapshotService, /clientPrice|finalPriceFromClient|body\.price/);
});

test('snapshot values stay historical after source names, labels and SKU change', () => {
  const product = structuredClone(iranProduct);
  const variant = structuredClone(black42Variant);
  const snapshot = buildSnapshot(product, variant);
  product.nameFa = 'نام جدید';
  product.nameEn = 'New name';
  variant.sku = 'NEW-SKU';
  variant.options[1].attributeOption.labelFa = 'سیاه';
  assert.equal(snapshot.productNameFaSnapshot, 'کتانی کلوین کلاین');
  assert.equal(snapshot.productNameEnSnapshot, 'Calvin Klein Trainers');
  assert.equal(snapshot.skuSnapshot, 'CK-BLK-42');
  assert.equal(snapshot.selectedOptionsSnapshot[0].labelFa, 'مشکی');
});

test('historical serializer reads old null rows and derives variant names only from snapshots', () => {
  const old = serializeOrderItemSnapshot({
    id: 'legacy', name: 'Old item', selectedOptionsSnapshot: null,
    unitPriceAedSnapshot: null, unitPriceTomanSnapshot: null, finalUnitPriceTomanSnapshot: null,
  });
  assert.equal(old.name, 'Old item');
  assert.equal(old.selectedOptionsSnapshot, null);
  assert.equal(old.variantNameFaSnapshot, null);
  const current = serializeOrderItemSnapshot(buildSnapshot());
  assert.equal(current.variantNameFaSnapshot, 'مشکی / 42');
  assert.equal(current.variantNameEnSnapshot, 'Black / 42');
});

test('Admin and customer readers expose optional snapshots without loading mutable option labels', () => {
  assert.match(adminOrders, /serializeOrderItemSnapshot/);
  assert.match(adminOrders, /selectedOptionsSnapshot: true/);
  assert.match(customerAccount, /serializeOrderItemSnapshot/);
  assert.doesNotMatch(adminOrders, /attributeOption|CatalogAttribute/);
  assert.doesNotMatch(customerAccount, /attributeOption|CatalogAttribute/);
});

test('reservation relation is nullable, one-to-one per OrderItem, and linked with strict validation', () => {
  assert.match(schema, /orderItemId\s+String\?\s+@unique/);
  assert.match(schema, /inventoryReservation\s+ProductInventoryReservation\?/);
  assert.match(linkService, /reservation\.inventory\.variantId !== orderItem\.productVariantId/);
  assert.match(linkService, /reservation\.quantity !== orderItem\.quantity/);
  assert.match(linkService, /RESERVATION_VARIANT_MISMATCH/);
  assert.match(linkService, /RESERVATION_QUANTITY_MISMATCH/);
  assert.match(linkService, /reservation\.status !== 'ACTIVE'/);
  assert.match(linkService, /orderItem\.order\.type !== 'IRAN_STOCK_PRODUCT'/);
});

test('future Iran transaction validates, reserves, creates, then links in one serializable retry boundary', () => {
  const validateAt = transactionService.indexOf('buildProductVariantOrderItemSnapshot');
  const reserveAt = transactionService.indexOf('reserveProductInventoryLinesInTransaction(tx');
  const createAt = transactionService.indexOf('tx.order.create');
  const linkAt = transactionService.indexOf('attachProductInventoryReservationToOrderItem(tx');
  assert.ok(validateAt < reserveAt && reserveAt < createAt && createAt < linkAt);
  assert.match(transactionService, /runSerializableWithRetry/);
  assert.match(transactionService, /timeout: 20_000/);
  assert.match(inventoryService, /isolationLevel: 'Serializable'/);
  assert.match(transactionService, /type: 'IRAN_STOCK_PRODUCT'/);
  assert.doesNotMatch(transactionService, /WAREHOUSE_STOCK|LAPTOP_STOCK/);
});

test('atomic future transaction reuses the Phase 2E in-transaction multi-line reservation primitive', () => {
  assert.match(inventoryService, /export async function reserveProductInventoryLinesInTransaction/);
  assert.match(transactionService, /reserveProductInventoryLinesInTransaction/);
  assert.doesNotMatch(transactionService, /productInventory\.update|productInventoryMovement\.create|productInventoryReservation\.create/);
});

test('future transaction replay is accepted only for the same Order, lines and reservation group', () => {
  assert.match(transactionService, /function assertIdempotentReplay/);
  assert.match(transactionService, /order\.orderCode === orderCode/);
  assert.match(transactionService, /reservation\?\.reservationKey === `\$\{reservationGroupKey\}:\$\{line\.variantId\}`/);
  assert.match(transactionService, /ORDER_IDEMPOTENCY_KEY_CONFLICT/);
});

test('public Cart and Checkout remain variant-unaware and keep the Iran guard', () => {
  assert.match(publicOrders, /IRAN_STOCK_NOT_READY/);
  assert.match(cartRoute, /IRAN_STOCK_NOT_READY/);
  assert.doesNotMatch(publicOrders, /createFutureIranStockVariantOrder|productVariantId|selectedOptionsSnapshot/);
  assert.doesNotMatch(cartRoute, /createFutureIranStockVariantOrder|productVariantId|selectedOptionsSnapshot/);
});

test('Warehouse, Laptop, Payment and Shipment architecture remains outside the Phase 2F migration', () => {
  assert.doesNotMatch(warehouseSales, /ProductInventoryReservation|OrderItemSourceKind/);
  assert.doesNotMatch(adminLaptops, /ProductInventoryReservation|OrderItemSourceKind/);
  assert.doesNotMatch(migration, /ALTER TABLE "(?:WarehouseItem|Laptop|Payment|Shipment|PurchaseRequest)"/);
  assert.doesNotMatch(transactionService, /payment\.|shipment\.|warehouseItem|laptop/);
});
