import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

async function importSource(path) {
  const contents = await source(path);
  return import(`data:text/javascript;base64,${Buffer.from(contents).toString('base64')}`);
}

const warehouseSales = await importSource('../src/lib/warehouseSales.js');
const laptopCatalog = await importSource('../src/lib/laptopCatalog.js');
const schema = await source('../prisma/schema.prisma');
const migration = await source('../prisma/migrations/20260830000200_warehouse_direct_sales/migration.sql');
const publicWarehouse = await source('../src/lib/publicWarehouse.js');
const publicOrders = await source('../src/lib/publicOrders.js');
const adminOrders = await source('../src/lib/adminOrders.js');
const shipmentCreateRoute = await source('../src/app/api/admin/shipments/route.js');
const shipmentUpdateRoute = await source('../src/app/api/admin/shipments/[id]/route.js');
const adminWarehouse = await source('../src/lib/adminWarehouse.js');
const laptopCatalogRoute = await source('../src/app/api/admin/laptop-catalog/route.js');
const adminLaptopPage = await source('../src/app/admin/laptops/page.js');
const laptopRoute = await source('../src/app/api/laptops/route.js');
const laptopDetailRoute = await source('../src/app/api/laptops/[id]/route.js');
const productDetailPage = await source('../src/app/product/[id]/page.js');
const warehouseGallery = await importSource('../src/lib/warehouseGallery.js');
const galleryMigration = await source('../prisma/migrations/20260830000300_warehouse_item_gallery/migration.sql');
const warehouseDetailPage = await source('../src/app/warehouse/[slug]/page.js');

test('warehouse publication is explicit and public reads exclude unpublished or archived records', () => {
  assert.match(schema, /isPublished\s+Boolean\s+@default\(false\)/);
  assert.match(publicWarehouse, /isPublished: true, isArchived: false/);
  assert.match(adminWarehouse, /assertPublishableWarehouseItem/);
});

test('warehouse direct orders use Toman price without AED pricing or external shipping', () => {
  assert.equal(warehouseSales.getWarehouseUnitPriceToman({ price: 2_000_000, hasDiscount: true, discountPercent: 10 }), 1_800_000);
  const branch = publicOrders.match(/else if \(parsed\.type === 'WAREHOUSE_STOCK'\)[\s\S]*?\n      \} else \{/)?.[0] || '';
  assert.match(branch, /getWarehouseUnitPriceToman/);
  assert.doesNotMatch(branch, /calculateProductPricing|getPricingSettings|shippingAed|priceAed/);
  assert.match(publicOrders, /shippingCostToman = 0/);
  assert.match(publicWarehouse, /priceToman: item\.price,[\s\S]*?finalPriceToman: salePrice/);
});

test('warehouse reservation rejects insufficient stock and models cancellation and fulfillment safely', () => {
  assert.deepEqual(warehouseSales.reserveWarehouseQuantity({ stock: 5, reserved: 2 }, 3), { stock: 5, reserved: 5 });
  assert.equal(warehouseSales.reserveWarehouseQuantity({ stock: 5, reserved: 2 }, 4), null);
  assert.deepEqual(warehouseSales.releaseWarehouseQuantity({ stock: 5, reserved: 3 }, 2), { stock: 5, reserved: 1 });
  assert.deepEqual(warehouseSales.fulfillWarehouseQuantity({ stock: 5, reserved: 3 }, 3), { stock: 2, reserved: 0 });
  assert.equal(warehouseSales.fulfillWarehouseQuantity({ stock: 2, reserved: 1 }, 2), null);
  assert.match(adminOrders, /ORDER_RELEASE/);
  assert.match(adminOrders, /ORDER_FULFILLMENT/);
  assert.match(shipmentCreateRoute, /fulfillOrderWarehouseReservations\(tx, order\.id/);
  assert.match(shipmentUpdateRoute, /fulfillOrderWarehouseReservations\(tx, current\.order\.id/);
});

test('warehouse order reservation prevents concurrent overselling with compare-and-swap in a serializable transaction', () => {
  assert.match(publicOrders, /isolationLevel: 'Serializable'/);
  assert.match(publicOrders, /tx\.warehouseItem\.updateMany/);
  assert.match(publicOrders, /stock: warehouse\.stock,[\s\S]*?reserved: warehouse\.reserved/);
  assert.match(publicOrders, /result\.count !== 1/);
});

test('zero warehouse stock remains a visible unavailable item rather than being deleted', () => {
  assert.equal(warehouseSales.getWarehouseAvailableQuantity({ stock: 0, reserved: 0 }), 0);
  assert.equal(warehouseSales.getWarehouseAvailableQuantity({ stock: 4, reserved: 4 }), 0);
  assert.doesNotMatch(publicWarehouse, /stock:\s*\{\s*gt:/);
});

test('Product and Laptop order branches remain explicit and separate from Warehouse pricing', () => {
  assert.match(publicOrders, /parsed\.type === 'LAPTOP_STOCK'/);
  assert.match(publicOrders, /parsed\.type === 'WAREHOUSE_STOCK'/);
  assert.match(publicOrders, /type: hasLaptop \? 'LAPTOP_STOCK' : hasWarehouse \? 'WAREHOUSE_STOCK' : 'CATALOG_PRODUCT'/);
  assert.match(publicOrders, /const pricingSettings = parsed\.type === 'CATALOG_PRODUCT' \? await getPricingSettings\(\) : null/);
});

test('every new OrderItem source must resolve to exactly one catalog type', () => {
  assert.equal(warehouseSales.getOrderItemSource({ productId: 'p1' }), 'product');
  assert.equal(warehouseSales.getOrderItemSource({ laptopId: 'l1' }), 'laptop');
  assert.equal(warehouseSales.getOrderItemSource({ warehouseItemId: 'w1' }), 'warehouse');
  assert.equal(warehouseSales.getOrderItemSource({ productId: 'p1', warehouseItemId: 'w1' }), null);
  assert.equal(warehouseSales.getOrderItemSource({}), null);
  assert.match(schema, /warehouseItemId\s+String\?/);
});

test('Laptop brands and models are database-backed and fashion brands are excluded by capability', () => {
  assert.match(schema, /supportsLaptop\s+Boolean\s+@default\(false\)/);
  assert.match(laptopCatalogRoute, /where: \{ supportsLaptop: true \}/);
  assert.match(laptopCatalogRoute, /laptopModels:/);
  assert.match(adminLaptopPage, /fetch\('\/api\/admin\/laptop-catalog'\)/);
  assert.doesNotMatch(adminLaptopPage, /DEFAULT_BRANDS_SEED|Balenciaga|Burberry|Cartier|Aldo/);
});

test('duplicate Laptop unit preserves reusable specs, including present optional values, but clears unique and lifecycle fields', () => {
  const duplicate = laptopCatalog.duplicateLaptopForm({ id: 'l1', serial: 'SERIAL', internalSku: 'SKU', stockStatus: 'sold', dateEntered: '2026-08-30', model: 'XPS', ram: '16', manufactureYear: '2022', batteryHealth: '91' });
  assert.equal(duplicate.id, undefined);
  assert.equal(duplicate.serial, '');
  assert.equal(duplicate.internalSku, '');
  assert.equal(duplicate.stockStatus, 'available');
  assert.equal(duplicate.dateEntered, '');
  assert.equal(duplicate.model, 'XPS');
  assert.equal(duplicate.ram, '16');
  assert.equal(duplicate.manufactureYear, '2022');
  assert.equal(duplicate.batteryHealth, '91');

  const withoutOptionalValues = laptopCatalog.duplicateLaptopForm({ id: 'l2', model: 'Latitude' });
  assert.equal(Object.hasOwn(withoutOptionalValues, 'manufactureYear'), false);
  assert.equal(Object.hasOwn(withoutOptionalValues, 'batteryHealth'), false);
});

test('Laptop availability is derived from independent AVAILABLE units in each spec group', () => {
  const units = [
    { id: '1', brand: 'Dell', model: 'XPS', cpu: 'i7', ram: '16', storage: '512', gpu: 'Iris', status: 'AVAILABLE' },
    { id: '2', brand: 'Dell', model: 'XPS', cpu: 'i7', ram: '16', storage: '512', gpu: 'Iris', status: 'AVAILABLE' },
    { id: '3', brand: 'Dell', model: 'XPS', cpu: 'i7', ram: '16', storage: '512', gpu: 'Iris', status: 'SOLD' },
  ];
  const counts = laptopCatalog.countAvailableLaptopGroups(units);
  assert.equal(counts.get(laptopCatalog.laptopSpecGroupKey(units[0])), 2);
  assert.equal(
    laptopCatalog.laptopSpecGroupKey({ ...units[0], manufactureYear: 2024, batteryHealth: 100 }),
    laptopCatalog.laptopSpecGroupKey({ ...units[0], manufactureYear: null, batteryHealth: null }),
  );
  assert.match(laptopRoute, /availableCount/);
  assert.match(laptopRoute, /status: 'AVAILABLE'/);
  assert.match(laptopDetailRoute, /where: \{ id, archivedAt: null \}/);
  assert.match(productDetailPage, /product\.inStock === false \? 'ناموجود' : 'افزودن به سبد خرید'/);
});

test('migration is additive and preserves existing Product, Laptop, and Order data', () => {
  assert.match(migration, /ADD COLUMN "warehouseItemId" TEXT/);
  assert.match(migration, /ADD COLUMN "supportsLaptop" BOOLEAN NOT NULL DEFAULT false/);
  assert.doesNotMatch(migration, /^\s*(?:DROP|TRUNCATE|DELETE)\b/im);
});

test('warehouse gallery normalizes ordering, primary cover, duplicates, and legacy fallback', () => {
  const result = warehouseGallery.validateWarehouseImages([
    { url: 'https://cdn.example.com/one.jpg', isPrimary: false },
    { url: 'https://cdn.example.com/two.jpg', isPrimary: false },
    { url: 'https://cdn.example.com/one.jpg', isPrimary: false },
  ]);
  assert.equal(result.value.length, 2);
  assert.equal(result.value[0].isPrimary, true);
  assert.deepEqual(result.value.map(image => image.sortOrder), [0, 1]);
  assert.match(warehouseGallery.validateWarehouseImages([
    { url: 'data:image/png;base64,AAAA', isPrimary: true },
  ]).error, /آدرس تصویر/);
  assert.equal(warehouseGallery.getWarehouseCoverImage({ id: 'w1', image: '/legacy.jpg' }), '/legacy.jpg');
});

test('warehouse gallery migration is additive, ordered, and cascades only gallery rows', () => {
  assert.match(schema, /model WarehouseItemImage/);
  assert.match(schema, /images\s+WarehouseItemImage\[\]/);
  assert.match(galleryMigration, /CREATE TABLE "WarehouseItemImage"/);
  assert.match(galleryMigration, /ON DELETE CASCADE/);
  assert.match(galleryMigration, /WHERE "isPrimary" = true/);
  assert.doesNotMatch(galleryMigration, /^\s*(?:DROP|TRUNCATE|DELETE|UPDATE)\b/im);
});

test('warehouse public detail provides a selectable gallery while catalog cards keep one cover', () => {
  assert.match(publicWarehouse, /images:/);
  assert.match(publicWarehouse, /getWarehouseCoverImage/);
  assert.match(warehouseDetailPage, /setSelectedImage/);
  assert.match(warehouseDetailPage, /thumbnailButton/);
});
