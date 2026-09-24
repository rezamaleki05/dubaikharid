import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  CART_ITEM_TYPES,
  normalizeCartItem,
  normalizeWishlistItem,
  parseCartStorage,
  resolverPayload,
} from '../src/lib/clientCollectionState.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const schema = read('prisma/schema.prisma');
const packageJson = JSON.parse(read('package.json'));
const header = read('src/components/Header.js');
const footer = read('src/components/Footer.js');
const adminSidebar = read('src/components/admin/AdminSidebar.js');
const adminNavigation = read('src/config/adminNavigation.js');
const cartRoute = read('src/app/api/cart/resolve/route.js');
const checkout = read('src/components/CheckoutModal.js');
const publicOrders = read('src/lib/publicOrders.js');
const productCart = read('src/lib/productCartDomain.js');
const productCartService = read('src/lib/productCartService.js');
const catalog = read('src/lib/publicCatalog.js');
const search = read('src/app/search/page.js');
const sitemap = read('src/app/sitemap.js');
const inventoryPage = read('src/app/admin/inventory/page.js');

test('public Warehouse routes are retired with one permanent redirect target', () => {
  for (const route of ['src/app/warehouse/page.js', 'src/app/warehouse/[slug]/page.js']) {
    const source = read(route);
    assert.match(source, /permanentRedirect\('\/'\)/);
    assert.doesNotMatch(source, /prisma|fetch\(|warehouseItem/);
  }
  assert.equal(existsSync(join(root, 'src/app/warehouse/[slug]/layout.js')), false);
  assert.equal(existsSync(join(root, 'src/app/api/warehouse/route.js')), false);
  assert.equal(existsSync(join(root, 'src/app/api/warehouse/[id]/route.js')), false);
});

test('public navigation no longer advertises Warehouse or Ready Stock', () => {
  assert.doesNotMatch(`${header}\n${footer}`, /href="\/warehouse"|موجودی آماده|Ready Stock/i);
});

test('Warehouse Admin navigation and active management routes are removed', () => {
  assert.doesNotMatch(`${adminSidebar}\n${adminNavigation}`, /ADMIN_ROUTES\.warehouse|\/admin\/warehouse|WAREHOUSE_(?:VIEW|EDIT)/);
  assert.equal(existsSync(join(root, 'src/app/admin/warehouse/page.js')), false);
  assert.equal(existsSync(join(root, 'src/app/api/admin/warehouse/route.js')), false);
  assert.match(adminSidebar, /ADMIN_ROUTES\.inventory/);
});

test('legacy Warehouse cart identities are discarded instead of migrated', () => {
  assert.equal(CART_ITEM_TYPES.has('WAREHOUSE'), false);
  assert.equal(normalizeCartItem({ type: 'WAREHOUSE', id: 'legacy', quantity: 1 }), null);
  assert.equal(normalizeCartItem({ warehouseItemId: 'legacy', quantity: 1 }), null);
  assert.equal(normalizeWishlistItem({ product_type: 'warehouse_stock', id: 'legacy' }), null);
  assert.deepEqual(parseCartStorage(JSON.stringify([{ type: 'WAREHOUSE', id: 'legacy', quantity: 1 }])), []);
  assert.deepEqual(resolverPayload([{ type: 'PRODUCT', id: 'p1', productVariantId: 'v1', quantity: 1 }]), [{ type: 'PRODUCT', productId: 'p1', productVariantId: 'v1', quantity: 1 }]);
});

test('cart resolver loads Product and Laptop only', () => {
  assert.match(cartRoute, /resolvePublicProductCartLines/);
  assert.match(cartRoute, /prisma\.laptop\.findMany/);
  assert.doesNotMatch(cartRoute, /warehouseItem|WAREHOUSE|warehouseCutover/);
});

test('checkout and public order input cannot create Warehouse orders', () => {
  assert.doesNotMatch(checkout, /warehouseItemId|warehouse_stock|isWarehouseOrder/);
  assert.doesNotMatch(publicOrders, /warehouseItemId|WAREHOUSE_STOCK|warehouseItem\.|findWarehouseCutoverMappings/);
  assert.match(publicOrders, /type: hasLaptop \? 'LAPTOP_STOCK' : 'CATALOG_PRODUCT'/);
});

test('Product availability has no legacy Warehouse coupling', () => {
  assert.doesNotMatch(productCart, /warehouseItem/);
  assert.doesNotMatch(productCartService, /warehouseItem/);
  assert.match(productCart, /product\.supplyMode === 'IRAN_STOCK'/);
});

test('IRAN_STOCK and EXTERNAL_DUBAI share the normal Product category query', () => {
  assert.match(catalog, /category:/);
  assert.match(catalog, /supplyMode: true/);
  assert.doesNotMatch(catalog, /category:[\s\S]{0,160}supplyMode:\s*'IRAN_STOCK'/);
});

test('search and sitemap discover Products and Laptop models without Warehouse records', () => {
  assert.match(search, /productResults/);
  assert.match(search, /laptopModels/);
  assert.doesNotMatch(search, /warehouse/i);
  assert.match(sitemap, /prisma\.product\.findMany/);
  assert.match(sitemap, /getPublicLaptopModelGroups/);
  assert.doesNotMatch(sitemap, /\/warehouse|warehouseItem/i);
});

test('Phase 2J Product Inventory remains the normal stock administration system', () => {
  assert.match(inventoryPage, /Product Variant Inventory|ProductInventory|موجودی تنوع|مدیریت موجودی/i);
  assert.match(read('src/lib/adminAlerts.js'), /"ProductInventory"/);
  assert.match(read('src/lib/adminAlertRules.js'), /href: '\/admin\/inventory'/);
});

test('Phase 2K operational migration and cutover tooling is removed', () => {
  assert.equal(packageJson.scripts['migrate:warehouse-to-products'], undefined);
  assert.equal(packageJson.scripts['cutover:warehouse-to-products'], undefined);
  for (const path of [
    'scripts/migrate-warehouse-to-products.mjs',
    'scripts/cutover-warehouse-to-products.mjs',
    'src/lib/warehouseShadowMigration.js',
    'src/lib/warehouseProductCutover.js',
  ]) assert.equal(existsSync(join(root, path)), false);
});

test('Prisma retains non-destructive Warehouse and historical order compatibility', () => {
  assert.match(schema, /model WarehouseItem \{/);
  assert.match(schema, /model WarehouseItemImage \{/);
  assert.match(schema, /WAREHOUSE_STOCK/);
  assert.match(schema, /warehouseItemId\s+String\?/);
});

test('Laptop and PurchaseRequest public architecture remains present', () => {
  assert.equal(existsSync(join(root, 'src/app/stock-laptops/page.js')), true);
  assert.equal(existsSync(join(root, 'src/app/api/purchase-requests/route.js')), true);
  assert.match(schema, /model Laptop \{/);
  assert.match(schema, /model PurchaseRequest \{/);
});
