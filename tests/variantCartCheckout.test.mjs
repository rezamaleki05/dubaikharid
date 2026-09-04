import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  cartItemKey,
  normalizeCartItem,
  parseCartStorage,
  resolverPayload,
} from '../src/lib/clientCollectionState.js';
import {
  publicVariantAxes,
  resolveProductCartLineFromData,
  resolveProductCartVariantFromData,
} from '../src/lib/productCartDomain.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const cartRoute = read('src/app/api/cart/resolve/route.js');
const publicOrders = read('src/lib/publicOrders.js');
const transactionService = read('src/lib/productVariantOrderTransactionService.js');
const inventoryService = read('src/lib/productInventoryService.js');
const adminOrders = read('src/lib/adminOrders.js');
const shipmentRoute = read('src/app/api/admin/shipments/[id]/route.js');
const publicCatalog = read('src/lib/publicCatalog.js');
const cartContext = read('src/context/CartContext.js');
const cartPage = read('src/app/cart/page.js');
const checkoutModal = read('src/components/CheckoutModal.js');
const warehouseSales = read('src/lib/warehouseSales.js');
const adminLaptops = read('src/lib/adminLaptops.js');
const purchaseRequests = [
  read('src/lib/adminPurchaseRequests.js'),
  read('src/lib/purchaseRequestOrders.js'),
  read('src/app/api/purchase-requests/route.js'),
].join('\n');

const option = (attributeCode, optionCode, labelFa, labelEn, sortOrder) => ({
  attributeId: `attribute-${attributeCode}`,
  attributeOptionId: `option-${optionCode}`,
  attribute: {
    id: `attribute-${attributeCode}`,
    code: attributeCode,
    nameFa: attributeCode === 'color' ? 'رنگ' : 'سایز اروپا',
    nameEn: attributeCode === 'color' ? 'Color' : 'EU Size',
    sortOrder,
  },
  attributeOption: {
    id: `option-${optionCode}`,
    code: optionCode,
    labelFa,
    labelEn,
    sortOrder: 1,
    swatchHex: attributeCode === 'color' ? '#000000' : null,
  },
});

const variant = (id, size, inventory = { stock: 2, reserved: 0 }) => ({
  id,
  productId: 'product-shoe',
  sku: `SKU-${size}`,
  optionSignature: `color=black|eu_size=${size}`,
  isDefault: false,
  isActive: true,
  priceAedOverride: null,
  priceTomanOverride: null,
  discountPercentOverride: null,
  weightOverride: null,
  inventory,
  options: [option('eu_size', size, size, size, 2), option('color', 'black', 'مشکی', 'Black', 1)],
});

const iranProduct = {
  id: 'product-shoe',
  nameFa: 'کفش تست',
  nameEn: 'Test Shoe',
  supplyMode: 'IRAN_STOCK',
  priceAed: null,
  priceToman: '2000000',
  weight: 1,
  hasDiscount: true,
  discountPercent: 20,
  variantAxisCount: 2,
  variants: [variant('variant-41', '41'), variant('variant-42', '42')],
  brand: { name: 'Test', faName: 'تست' },
  category: { name: 'Shoes' },
  store: null,
  image: '/shoe.jpg',
  originalLink: null,
  warehouseItem: null,
};

const settings = {
  aedRate: 20000,
  commissionPercent: 10,
  shippingPerKgAed: 40,
  minWeightClass: 1,
  roundingMethod: 'ceil',
};

const resolveLine = (product, line) => resolveProductCartLineFromData({
  product,
  line: { quantity: 1, requestKey: 'legacy-key', ...line },
  settings: product.supplyMode === 'EXTERNAL_DUBAI' ? settings : null,
});

test('Product cart identity separates variants of the same Product', () => {
  assert.equal(cartItemKey({ type: 'PRODUCT', id: 'p1', productVariantId: 'v1' }), 'PRODUCT:p1:v1');
  assert.equal(cartItemKey({ type: 'PRODUCT', id: 'p1', productVariantId: 'v2' }), 'PRODUCT:p1:v2');
});

test('duplicate ProductVariant storage entries aggregate quantity', () => {
  const raw = JSON.stringify([
    { type: 'PRODUCT', productId: 'p1', productVariantId: 'v1', quantity: 1 },
    { type: 'PRODUCT', productId: 'p1', productVariantId: 'v1', quantity: 2 },
  ]);
  const [item] = parseCartStorage(raw);
  assert.equal(item.key, 'PRODUCT:p1:v1');
  assert.equal(item.quantity, 3);
});

test('new resolver payload contains identity and quantity only', () => {
  const item = normalizeCartItem({ type: 'PRODUCT', productId: 'p1', productVariantId: 'v1', quantity: 2, price: 1, selectedColor: 'fake' });
  assert.deepEqual(resolverPayload([item]), [{ type: 'PRODUCT', productId: 'p1', productVariantId: 'v1', quantity: 2 }]);
});

test('exact active Variant resolves authoritative labels, price, and inventory', () => {
  const result = resolveLine(iranProduct, { productVariantId: 'variant-42' });
  assert.equal(result.productVariantId, 'variant-42');
  assert.equal(result.priceToman, '2000000');
  assert.equal(result.discountPercent, 20);
  assert.equal(result.pricing.finalPriceToman, '1600000');
  assert.deepEqual(result.inventory, { available: 2, inStock: true });
  assert.deepEqual(result.variant.options.map(row => row.optionCode), ['black', '42']);
});

test('fake client pricing is not part of Product cart identity or resolver input', () => {
  const result = resolveLine(iranProduct, { productVariantId: 'variant-42', priceToman: '1', discountPercent: 99 });
  assert.equal(result.pricing.finalPriceToman, '1600000');
  assert.doesNotMatch(cartRoute, /item\.price|clientPrice|finalPriceFromClient/);
});

test('wrong Product/Variant and inactive Variant are controlled', () => {
  assert.throws(
    () => resolveProductCartVariantFromData({ product: iranProduct, productVariantId: 'other-variant' }),
    error => error.code === 'VARIANT_PRODUCT_MISMATCH',
  );
  const product = { ...iranProduct, variants: [{ ...iranProduct.variants[0], isActive: false }] };
  assert.throws(
    () => resolveProductCartVariantFromData({ product, productVariantId: 'variant-41' }),
    error => error.code === 'VARIANT_INACTIVE',
  );
});

test('missing Variant for a real variant Product is never guessed', () => {
  assert.throws(
    () => resolveProductCartVariantFromData({ product: iranProduct }),
    error => error.code === 'VARIANT_SELECTION_REQUIRED',
  );
});

test('default-only Product safely auto-resolves without fake options', () => {
  const defaultVariant = {
    ...variant('variant-default', '42'),
    optionSignature: '__default__',
    isDefault: true,
    options: [],
  };
  const product = { ...iranProduct, variantAxisCount: 0, variants: [defaultVariant] };
  const result = resolveLine(product, {});
  assert.equal(result.productVariantId, 'variant-default');
  assert.deepEqual(result.variant.options, []);
  assert.equal(result.selectedColor, null);
  assert.equal(result.selectedSize, null);
});

test('legacy color and size map only when exactly one Variant matches', () => {
  assert.equal(resolveLine(iranProduct, { selectedColor: 'مشکی', selectedSize: '42' }).productVariantId, 'variant-42');
  assert.throws(
    () => resolveLine(iranProduct, { selectedColor: 'مشکی' }),
    error => error.code === 'VARIANT_SELECTION_REQUIRED',
  );
});

test('Iran inventory availability covers requested quantity, zero stock, and missing initialization', () => {
  assert.equal(resolveLine(iranProduct, { productVariantId: 'variant-42', quantity: 2 }).available, true);
  assert.equal(resolveLine(iranProduct, { productVariantId: 'variant-42', quantity: 3 }).code, 'INSUFFICIENT_STOCK');
  const zero = { ...iranProduct, variants: [variant('variant-zero', '40', { stock: 0, reserved: 0 })] };
  assert.equal(resolveLine(zero, { productVariantId: 'variant-zero' }).inventory.inStock, false);
  const missing = { ...iranProduct, variants: [variant('variant-missing', '40', null)] };
  assert.equal(resolveLine(missing, { productVariantId: 'variant-missing' }).code, 'INVENTORY_NOT_INITIALIZED');
});

test('Iran variant price and discount overrides preserve null inheritance and explicit 0%', () => {
  const overridden = {
    ...iranProduct,
    variants: [{ ...iranProduct.variants[0], priceTomanOverride: '2200000', discountPercentOverride: 0 }],
  };
  const result = resolveLine(overridden, { productVariantId: 'variant-41' });
  assert.equal(result.priceToman, '2200000');
  assert.equal(result.discountPercent, 0);
  assert.equal(result.pricing.finalPriceToman, '2200000');
});

test('external Variant uses AED, weight, and discount overrides without ProductInventory', () => {
  const externalVariant = {
    ...iranProduct.variants[0],
    inventory: null,
    priceAedOverride: '120.00',
    weightOverride: 2.5,
    discountPercentOverride: 0,
  };
  const external = { ...iranProduct, supplyMode: 'EXTERNAL_DUBAI', priceAed: '100.00', priceToman: null, variants: [externalVariant] };
  const result = resolveLine(external, { productVariantId: externalVariant.id });
  assert.equal(result.priceAed, 120);
  assert.equal(result.weight, 2.5);
  assert.equal(result.discountPercent, 0);
  assert.equal(result.inventory, null);
});

test('public Product API exposes selector foundation without separate URLs', () => {
  assert.match(publicCatalog, /variantAxes/);
  assert.match(publicCatalog, /publicVariantOptions/);
  assert.match(publicCatalog, /pricing: line\.pricing/);
  assert.match(publicCatalog, /inventory: line\.inventory/);
  assert.doesNotMatch(publicCatalog, /variantUrl|variantSlug/);
  assert.equal(publicVariantAxes(iranProduct.variants).length, 2);
});

test('Iran checkout reuses the Phase 2F atomic helper and creates Payment in the same Order write', () => {
  assert.match(publicOrders, /createFutureIranStockVariantOrder/);
  assert.match(publicOrders, /customerResolver: tx => resolveCustomer/);
  assert.match(publicOrders, /paymentMethod: parsed\.paymentMethod/);
  assert.match(transactionService, /items: \{ create: itemSnapshots \}/);
  assert.match(transactionService, /payments: \{[\s\S]*?create:/);
  assert.match(transactionService, /amount: new Prisma\.Decimal\(totalToman\.toString\(\)\)/);
});

test('Iran checkout snapshots exact Variant and revalidates inventory inside serializable transaction', () => {
  assert.match(publicOrders, /productVariantId: item\.productVariantId/);
  assert.match(transactionService, /buildProductVariantOrderItemSnapshot/);
  assert.match(transactionService, /reserveProductInventoryLinesInTransaction/);
  assert.match(inventoryService, /isolationLevel: 'Serializable'/);
  assert.match(transactionService, /type: 'IRAN_STOCK_PRODUCT'/);
});

test('cancellation releases active Product reservations exactly once', () => {
  assert.match(adminOrders, /productInventoryReservations: \{ select:/);
  assert.match(adminOrders, /item\.status === 'ACTIVE'/);
  assert.match(adminOrders, /targetStatus: 'RELEASED'/);
  assert.match(inventoryService, /if \(reservation\.status === targetStatus\) return/);
});

test('shipment fulfillment decrements Product stock exactly once and payment success does not', () => {
  assert.match(shipmentRoute, /fulfillOrderInventoryReservations/);
  assert.match(adminOrders, /targetStatus: 'FULFILLED'/);
  assert.match(inventoryService, /stockAfter = isRelease \? current\.stock : current\.stock - reservation\.quantity/);
  assert.doesNotMatch(read('src/lib/adminPayments.js'), /fulfillProductInventory|ORDER_FULFILLMENT/);
});

test('checkout idempotency reuses exact replay and rejects conflicting replay', () => {
  assert.match(transactionService, /function assertIdempotentReplay/);
  assert.match(transactionService, /ORDER_IDEMPOTENCY_KEY_CONFLICT/);
  assert.match(transactionService, /order\.payments\.length === 1/);
  assert.match(publicOrders, /function assertPublicOrderReplay/);
});

test('atomic multi-line and concurrent checkout reuse Phase 2E compare-and-swap behavior', () => {
  assert.match(transactionService, /reserveProductInventoryLinesInTransaction\(tx/);
  assert.match(inventoryService, /productInventory\.updateMany/);
  assert.match(inventoryService, /throw concurrentUpdate\(\)/);
  assert.match(transactionService, /retryUnique: true, timeout: 20_000/);
});

test('mixed Product supply modes require separate checkout groups', () => {
  assert.match(publicOrders, /supplyModes\.size !== 1/);
  assert.match(publicOrders, /MIXED_FULFILLMENT/);
  assert.match(cartPage, /PRODUCT:\$\{item\.supplyMode \|\| 'UNRESOLVED'\}/);
});

test('Cart UI carries Variant identity and renders authoritative option labels without redesign', () => {
  assert.match(checkoutModal, /productVariantId: item\.productVariantId/);
  assert.match(cartContext, /item\.productVariantId !== authoritative\.productVariantId/);
  assert.match(cartPage, /item\.variant\.options\.map/);
  assert.doesNotMatch(cartPage, /variant selector|variantSelector/i);
});

test('Warehouse, Laptop, and PurchaseRequest architectures remain independent', () => {
  assert.doesNotMatch(warehouseSales, /ProductCart|productVariantId/);
  assert.doesNotMatch(adminLaptops, /ProductCart|productVariantId/);
  assert.doesNotMatch(purchaseRequests, /ProductCart|productVariantId|IRAN_STOCK_PRODUCT/);
});

test('Phase 2G requires no migration and preserves Phase 2F as the latest migration', () => {
  const migrations = readdirSync(join(root, 'prisma/migrations')).filter(name => /^\d/.test(name)).sort();
  assert.equal(migrations.at(-1), '20260904000100_orderitem_variant_compatibility');
});
