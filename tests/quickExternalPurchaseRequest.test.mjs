import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

const home = await source('../src/app/page.js');
const calculator = await source('../src/components/Calculator.js');
const quickModal = await source('../src/components/QuickPurchaseRequestModal.js');
const checkout = await source('../src/components/CheckoutModal.js');
const requestRoute = await source('../src/app/api/purchase-requests/route.js');
const adminPricingRoute = await source('../src/app/api/admin/purchase-requests/[id]/route.js');
const conversion = await source('../src/lib/purchaseRequestOrders.js');
const paymentStart = await source('../src/app/api/account/purchase-requests/[id]/pay/route.js');
const publicOrders = await source('../src/lib/publicOrders.js');

test('1. quick external inquiry opens its dedicated request modal, not CheckoutModal', () => {
  assert.match(home, /setQuickRequestData\(orderData\)/);
  assert.match(home, /<QuickPurchaseRequestModal/);
  assert.match(home, /Array\.isArray\(orderData\.items\) && orderData\.items\.length > 0/);
});

test('2. quick external inquiry submits only to the PurchaseRequest endpoint', () => {
  assert.match(quickModal, /fetch\('\/api\/purchase-requests'/);
  assert.doesNotMatch(quickModal, /fetch\('\/api\/orders'/);
});

test('3. initial request creation creates PurchaseRequest but no Order or Payment', () => {
  assert.match(requestRoute, /tx\.purchaseRequest\.create/);
  assert.doesNotMatch(requestRoute, /tx\.order\.create|tx\.payment\.create|payments:\s*\{\s*create:/s);
});

test('4. quick modal contains no payment-method, bank-card, IBAN, or receipt workflow', () => {
  assert.doesNotMatch(quickModal, /ManualPaymentPanel|BankAccount|paymentCards|انتخاب روش پرداخت|شماره شبا|آپلود رسید/);
});

test('5. estimated amount is labeled provisional and is never submitted as finalToman', () => {
  assert.match(calculator, /برآورد اولیه/);
  assert.match(quickModal, /مبلغ نهایی پس از بررسی کارشناسان دبی خرید اعلام می‌شود/);
  const submittedBody = quickModal.match(/body: JSON\.stringify\(\{([\s\S]*?)\n\s*\}\),/)?.[1] || '';
  assert.doesNotMatch(submittedBody, /finalToman|paymentMethod/);
  assert.match(requestRoute, /finalToman: null, status: 'pending'/);
});

test('6. an unpriced PurchaseRequest cannot enter payment conversion', () => {
  assert.match(conversion, /if \(!Number\.isFinite\(finalToman\) \|\| finalToman <= 0\) throw new Error\('FINAL_PRICE_REQUIRED'\)/);
  assert.match(conversion, /\['price_tagged', 'approved'\]\.includes\(current\.status\)/);
});

test('7. an Admin-priced request reuses the existing safe payment flow later', () => {
  assert.match(adminPricingRoute, /finalToman: pricing\.finalToman, status: 'price_tagged'/);
  assert.match(paymentStart, /convertPurchaseRequestInTransaction\(tx, current\)/);
  assert.match(conversion, /payments: \{ create:/);
});

test('8. final payable amount comes from the server-saved PurchaseRequest value', () => {
  assert.match(conversion, /current\.finalToman/);
  assert.doesNotMatch(paymentStart, /request\.json\(/);
});

test('9. normal catalog checkout still creates an Order and pending Payment', () => {
  assert.match(checkout, /isCatalogOrder/);
  assert.match(checkout, /isLaptopOrder \|\| isWarehouseOrder \|\| isCatalogOrder \? '\/api\/orders'/);
  assert.match(publicOrders, /tx\.order\.create/);
  assert.match(publicOrders, /payments:\s*\{\s*create:/s);
});

test('10. laptop checkout remains on the existing normal Order path', () => {
  assert.match(checkout, /const isLaptopOrder/);
  assert.match(checkout, /item\.laptopId \|\| item\.product_type === 'laptop_stock'/);
  assert.match(checkout, /endpoint === '\/api\/orders'/);
});

test('11. quick request submission preserves the existing idempotency contract', () => {
  assert.match(quickModal, /idempotencyKeyRef\.current \|\|= crypto\.randomUUID\(\)/);
  assert.match(quickModal, /'Idempotency-Key': idempotencyKeyRef\.current/);
  assert.match(requestRoute, /tx\.purchaseRequest\.findUnique\(\{ where: \{ idempotencyKey \} \}\)/);
  assert.match(requestRoute, /P2002/);
});
