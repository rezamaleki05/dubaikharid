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

const statuses = await importSource('../src/lib/orderStatuses.js');
const pricing = await importSource('../src/lib/pricing.js');
const schema = await source('../prisma/schema.prisma');
const ordersPage = await source('../src/app/admin/orders/page.js');
const orderRoute = await source('../src/app/api/admin/orders/[id]/route.js');
const purchaseRoute = await source('../src/app/api/admin/purchase-requests/[id]/route.js');
const purchaseConversion = await source('../src/lib/purchaseRequestOrders.js');
const purchasePayRoute = await source('../src/app/api/account/purchase-requests/[id]/pay/route.js');
const customerAccount = await source('../src/lib/customerAccount.js');
const profile = await source('../src/app/profile/page.js');
const extraction = await source('../src/app/api/fetch-product/route.js');
const publicOrders = await source('../src/lib/publicOrders.js');
const adminOrders = await source('../src/lib/adminOrders.js');

test('1. order dropdown values exactly match the Prisma OrderStatus enum', () => {
  const enumBody = schema.match(/enum OrderStatus\s*\{([^}]+)\}/)?.[1] || '';
  const prismaValues = enumBody.split(/\s+/).filter(Boolean);
  assert.deepEqual(statuses.ORDER_STATUSES, prismaValues);
});

test('2. impossible transitions are omitted while current and valid transitions remain', () => {
  assert.deepEqual(statuses.getAvailableOrderStatusOptions('shipped').map(item => item.value), ['shipped', 'delivered']);
  assert.deepEqual(statuses.getAvailableOrderStatusOptions('pending').map(item => item.value), ['pending', 'paid', 'cancelled']);
  assert.deepEqual(statuses.getAvailableOrderStatusOptions('pricing').map(item => item.value), ['pricing', 'paid', 'cancelled']);
  assert.equal(statuses.canTransitionOrder('delivered', 'pending'), false);
  assert.equal(statuses.canTransitionOrder('pending', 'pricing'), false);
  assert.equal(statuses.canTransitionOrder('pending', 'processing'), false);
  assert.equal(statuses.canTransitionOrder('pending', 'cancelled'), true);
  assert.equal(statuses.canTransitionOrder('paid', 'purchased'), false);
  assert.equal(statuses.canTransitionOrder('processing', 'warehouse_dubai'), false);
  assert.equal(statuses.canTransitionOrder('paid', 'processing'), true);
  assert.equal(statuses.canTransitionOrder('processing', 'purchased'), true);
  assert.equal(statuses.canTransitionOrder('purchased', 'warehouse_dubai'), true);
});

test('3. admin order PATCH validates statuses and persists through lifecycle transaction', () => {
  assert.match(orderRoute, /ORDER_STATUS_SET\.has\(body\.status\)/);
  assert.match(orderRoute, /prisma\.\$transaction/);
  assert.match(orderRoute, /updateOrderLifecycle/);
});

test('4. order UI uses the shared status map, refreshes successful changes, and resyncs failures', () => {
  assert.match(ordersPage, /getAvailableOrderStatusOptions\(selectedLead\.status\)/);
  assert.match(ordersPage, /current\.map\(order => order\.id === leadId \? payload : order\)/);
  assert.match(ordersPage, /setRefreshToken\(current => current \+ 1\)/);
  assert.match(ordersPage, /role="alert"/);
});

test('4a. order summary groups use only the approved real status sets', () => {
  assert.match(ordersPage, /key: 'needs_action'.*statuses: \['pending', 'pricing'\]/);
  assert.match(ordersPage, /key: 'in_progress'.*statuses: \['paid', 'processing', 'purchased', 'warehouse_dubai', 'shipped'\]/);
  assert.match(ordersPage, /key: 'completed'.*statuses: \['delivered'\]/);
  assert.doesNotMatch(ordersPage.match(/const SUMMARY_GROUPS[\s\S]*?\n\]\);/)?.[0] || '', /cancelled/);
});

test('4b. next actions reuse lifecycle transitions and cancellation visibility matches server rules', () => {
  assert.doesNotMatch(ordersPage, /nextStatus: 'pricing'/);
  assert.match(ordersPage, /function getOrderNextAction\(order\)/);
  assert.match(ordersPage, /label: paymentIsPending[\s\S]*?'بررسی پرداخت'/);
  assert.match(ordersPage, /href: paymentIsPending \? ADMIN_ROUTES\.payments/);
  assert.match(ordersPage, /warehouse_dubai: \{ label: 'آماده ارسال', kind: 'shipment', permission: ADMIN_PERMISSIONS\.SHIPMENTS_VIEW/);
  assert.match(ordersPage, /shipped: \{ label: 'پیگیری تحویل', kind: 'link', href: ADMIN_ROUTES\.shipments/);
  const cancellableBlock = ordersPage.match(/const CANCELLABLE_ORDER_STATUSES = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '';
  assert.match(cancellableBlock, /'warehouse_dubai'/);
  assert.doesNotMatch(cancellableBlock, /'shipped'|'delivered'|'cancelled'/);
});

test('5. server pricing accepts confirmed AED and weight overrides and calculates from settings', () => {
  const quote = pricing.resolvePurchaseRequestPricing(
    { priceAed: 120, weight: 1.2 },
    { aedRate: 20000, commissionPercent: 10, shippingPerKgAed: 40, minWeightClass: 0.5, roundingMethod: 'ceil' },
  );
  assert.equal(quote.priceAed, 120);
  assert.equal(quote.weight, 1.2);
  assert.equal(quote.shippingAed, 80);
  assert.equal(quote.commissionAed, 12);
  assert.equal(quote.finalToman, 4_240_000);
});

test('6. optional final override is explicit and remains server-normalized', () => {
  const quote = pricing.resolvePurchaseRequestPricing(
    { priceAed: 120, weight: 1.2, finalToman: 4_100_000.4 },
    { aedRate: 20000, commissionPercent: 10, shippingPerKgAed: 40, minWeightClass: 0.5, roundingMethod: 'ceil' },
  );
  assert.equal(quote.calculatedFinalToman, 4_240_000);
  assert.equal(quote.finalToman, 4_100_000);
  assert.equal(quote.hasFinalOverride, true);
});

test('7. pricing action calculates on the server and atomically saves price_tagged', () => {
  assert.match(purchaseRoute, /getPricingSettings\(\)/);
  assert.match(purchaseRoute, /resolvePurchaseRequestPricing/);
  assert.match(purchaseRoute, /finalToman: pricing\.finalToman, status: 'price_tagged'/);
  assert.match(purchaseRoute, /isolationLevel: 'Serializable'/);
});

test('8. pending requests cannot pay and customer payment availability requires a saved final', () => {
  assert.match(purchaseConversion, /\['price_tagged', 'approved'\]\.includes\(current\.status\)/);
  assert.doesNotMatch(purchaseConversion, /allowUnpricedStatus/);
  assert.match(customerAccount, /pricingAvailable: Number\(item\.finalToman \|\| 0\) > 0/);
  assert.match(profile, /قیمت نهایی در حال بررسی است/);
});

test('9. payment conversion uses stored server values rather than client-submitted totals', () => {
  assert.match(purchaseConversion, /current\.finalToman/);
  assert.match(purchasePayRoute, /convertPurchaseRequestInTransaction\(tx, current\)/);
  assert.doesNotMatch(purchasePayRoute, /request\.json\(/);
});

test('10. extraction failure remains compatible with later manual pricing', () => {
  assert.match(extraction, /priceAed/);
  assert.match(purchaseRoute, /body\.action === 'price'/);
  assert.match(purchaseRoute, /priceAed: body\.priceAed/);
});

test('11. catalog, laptop-stock, and warehouse-stock checkouts create confirmed-price pending Orders', () => {
  assert.match(publicOrders, /type: hasLaptop \? 'LAPTOP_STOCK' : hasWarehouse \? 'WAREHOUSE_STOCK' : 'CATALOG_PRODUCT'/);
  assert.match(publicOrders, /pricingStatus: 'CONFIRMED',[\s\S]*?status: 'pending'/);
  assert.match(publicOrders, /payments: \{ create: \{[\s\S]*?status: 'pending'/);
});

test('12. paid lifecycle transition still requires successful payments covering the full total', () => {
  assert.match(adminOrders, /nextStatus === 'paid'/);
  assert.match(adminOrders, /payment\.status === 'success'/);
  assert.match(adminOrders, /paid < Number\(current\.totalToman\)/);
  assert.match(adminOrders, /PAYMENT_REQUIRED/);
});

test('13. priced Purchase Requests convert to pending unless explicitly using the existing markPaid path', () => {
  assert.match(purchaseConversion, /FINAL_PRICE_REQUIRED/);
  assert.match(purchaseConversion, /\['price_tagged', 'approved'\]\.includes\(current\.status\)/);
  assert.match(purchaseConversion, /pricingStatus: 'CONFIRMED'/);
  assert.match(purchaseConversion, /status: markPaid \? 'paid' : 'pending'/);
  assert.doesNotMatch(purchaseConversion, /status: markPaid \? 'paid' : 'pricing'/);
});

test('14. legacy pricing Orders retain only paid and cancellation recovery paths', () => {
  assert.equal(statuses.canTransitionOrder('pricing', 'paid'), true);
  assert.equal(statuses.canTransitionOrder('pricing', 'cancelled'), true);
  assert.equal(statuses.canTransitionOrder('pricing', 'processing'), false);
});

test('15. Admin Orders pending action delegates payment review instead of entering pricing', () => {
  assert.match(ordersPage, /order\?\.status === 'pending' \|\| order\?\.status === 'pricing'/);
  assert.match(ordersPage, /ADMIN_PERMISSIONS\.PAYMENTS_VIEW/);
  assert.match(ordersPage, /در انتظار تکمیل پرداخت/);
  assert.doesNotMatch(ordersPage, /سفارش را وارد مرحله قیمت‌گذاری کنید/);
});

test('16. Profile Order UI no longer treats PurchaseRequest price_tagged as an Order status', () => {
  const orderTimeline = profile.match(/const DETAILED_STEPS = \[[\s\S]*?\n\];/)?.[0] || '';
  assert.doesNotMatch(orderTimeline, /price_tagged/);
  assert.doesNotMatch(profile, /o\.status === 'price_tagged'/);
  assert.doesNotMatch(profile, /latestOrder\.status === 'price_tagged'/);
  assert.doesNotMatch(profile, /orders\.filter\([^\n]*price_tagged/);
  assert.match(profile, /req\.status === 'price_tagged'/);
});
