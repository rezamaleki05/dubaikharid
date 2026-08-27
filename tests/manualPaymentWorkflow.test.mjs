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

const receiptValidation = await importSource('../src/lib/paymentReceiptValidation.js');
const checkout = await source('../src/components/CheckoutModal.js');
const publicOrders = await source('../src/lib/publicOrders.js');
const ordersRoute = await source('../src/app/api/orders/route.js');
const banks = await source('../src/lib/bankAccounts.js');
const bankCard = await source('../src/components/payment/BankCard.js');
const receiptRoute = await source('../src/app/api/payments/[id]/receipt/route.js');
const adminReceiptRoute = await source('../src/app/api/admin/payments/[id]/receipt/route.js');
const receiptStorage = await source('../src/lib/paymentReceiptStorage.js');
const adminPaymentRoute = await source('../src/app/api/admin/payments/[id]/route.js');
const adminPaymentsService = await source('../src/lib/adminPayments.js');
const adminPaymentsPage = await source('../src/app/admin/payments/page.js');
const adminAlerts = await source('../src/lib/adminAlerts.js');
const paymentConfirmation = await importSource('../src/lib/paymentConfirmation.js');
const purchaseConversion = await source('../src/lib/purchaseRequestOrders.js');
const purchasePayRoute = await source('../src/app/api/account/purchase-requests/[id]/pay/route.js');
const profile = await source('../src/app/profile/page.js');
const account = await source('../src/lib/customerAccount.js');
const migration = await source('../prisma/migrations/20260825000200_manual_payment_receipts/migration.sql');

test('1. ONLINE is visibly disabled in checkout', () => {
  assert.match(checkout, /درگاه پرداخت آنلاین شتاب/);
  assert.match(checkout, /به.?زودی/);
  assert.match(checkout, /aria-disabled=\{settings\.onlinePaymentEnabled !== true\}/);
});

test('2. server rejects ONLINE while feature flag is disabled', () => {
  assert.match(publicOrders, /parsed\.paymentMethod === 'ONLINE' && paymentSettings\.onlinePaymentEnabled !== true/);
});

test('3. CARD order creation preserves idempotency', () => {
  assert.match(publicOrders, /idempotencyKey/);
  assert.match(publicOrders, /isolationLevel: 'Serializable'/);
});

test('4. CARD pending payment is nested in the single order creation', () => {
  assert.match(publicOrders, /payments:\s*\{\s*create:/s);
  assert.match(publicOrders, /status: 'pending'/);
});

test('5. checkout keeps the created CARD result for the instruction step', () => {
  assert.match(checkout, /setManualPayment\(result\.data\.manualPayment/);
  assert.match(checkout, /completedResultRef\.current/);
});

test('6. active default bank is deterministically selected', () => {
  assert.match(banks, /where: \{ isActive: true \}/);
  assert.match(banks, /\{ isDefault: 'desc' \}/);
});

test('7. inactive bank accounts cannot be returned to customers', () => {
  assert.doesNotMatch(banks.match(/getDefaultActiveBankAccount[\s\S]*$/)?.[0] || '', /where: \{\}/);
  assert.match(banks, /where: \{ isActive: true \}/);
});

test('8. card copy strips decorative spaces and hyphens', () => {
  assert.match(bankCard, /replace\(\/\[\\s-\]\/g, ''\)/);
  assert.match(bankCard, /copy\(account\.cardNumber/);
});

test('9. IBAN copy uses the clean underlying IBAN', () => {
  assert.match(bankCard, /copy\(account\.iban/);
});

test('10. receipt upload checks payment ownership or scoped capability', () => {
  assert.match(receiptRoute, /authorizeCustomerPaymentRequest\(request, payment\)/);
});

test('11. receipt access rejects non-owners', () => {
  assert.match(receiptRoute, /authorizeCustomerPaymentRequest\(request, payment\).*Unauthorized.*401/s);
});

test('12. receipt storage is private and admin access is permission protected', () => {
  assert.match(receiptStorage, /access: 'private'/);
  assert.match(adminReceiptRoute, /ADMIN_PERMISSIONS\.PAYMENTS_VIEW/);
});

test('13. unsupported MIME is rejected', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff]);
  assert.match(receiptValidation.validatePaymentReceipt({ type: 'image/gif', size: 3, bytes: jpeg }).error, /فرمت/);
});

test('14. magic-byte mismatch is rejected', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff]);
  assert.match(receiptValidation.validatePaymentReceipt({ type: 'image/png', size: 3, bytes: jpeg }).error, /مطابقت/);
});

test('15. oversized receipt is rejected', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff]);
  assert.match(receiptValidation.validatePaymentReceipt({ type: 'image/jpeg', size: receiptValidation.PAYMENT_RECEIPT_MAX_BYTES + 1, bytes: jpeg }).error, /۴ مگابایت/);
});

test('16. receipt upload returns Payment to pending, never success', () => {
  assert.match(receiptRoute, /status: 'pending'/);
  assert.doesNotMatch(receiptRoute, /status: 'success'/);
});

test('17. approval reuses the existing successful-payment side-effect transaction', () => {
  assert.match(adminPaymentRoute, /applySuccessfulPaymentOrderEffects/);
  assert.match(adminPaymentRoute, /isolationLevel: 'Serializable'/);
});

test('18. rejection requires and stores a customer-visible reason', () => {
  assert.match(adminPaymentRoute, /ثبت دلیل رد رسید الزامی است/);
  assert.match(adminPaymentRoute, /rejectionReason: body\.status === 'failed'/);
});

test('19. re-upload updates the same Payment and clears rejection state', () => {
  assert.match(receiptRoute, /tx\.payment\.update\(\{\s*where: \{ id: payment\.id \}/s);
  assert.match(receiptRoute, /rejectionReason: null/);
});

test('20. unpriced PurchaseRequest does not expose a payment action', () => {
  assert.match(profile, /قیمت نهایی در حال بررسی است/);
  assert.match(profile, /req\.pricingAvailable/);
  assert.match(account, /pricingAvailable: Number\(item\.finalToman \|\| 0\) > 0/);
});

test('21. priced PurchaseRequest uses real finalToman from account data', () => {
  assert.match(account, /finalToman/);
  assert.match(profile, /fmtToman\(req\.totalToman\)/);
});

test('22. PurchaseRequest conversion is guarded by its unique order relation', () => {
  assert.match(purchaseConversion, /if \(current\.order\) return current/);
  assert.match(purchasePayRoute, /P2002/);
});

test('23. conversion creates Order and CARD pending Payment transactionally', () => {
  assert.match(purchaseConversion, /tx\.order\.create/);
  assert.match(purchaseConversion, /method: 'CARD'/);
  assert.match(purchaseConversion, /status: markPaid \? 'success' : 'pending'/);
});

test('24. customer profile consumes server-backed PurchaseRequest and Payment fields', () => {
  assert.match(account, /serializeCustomerRequest/);
  assert.match(account, /receiptSubmittedAt/);
  assert.match(profile, /OrderPaymentPanel/);
});

test('25. migration is additive and preserves existing payment/order data', () => {
  assert.match(migration, /ALTER TABLE "Payment"\s+ADD COLUMN/);
  assert.match(migration, /CREATE TABLE "BankAccount"/);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE|DELETE)\b/i);
});

test('26. CARD receipt approval accepts receipt mode only when a receipt exists', () => {
  assert.equal(paymentConfirmation.getPaymentConfirmationError({ method: 'CARD', hasReceipt: true, confirmationMode: 'receipt', notes: '' }), null);
  assert.equal(paymentConfirmation.getPaymentConfirmationError({ method: 'CARD', hasReceipt: false, confirmationMode: 'receipt', notes: '' }), 'RECEIPT_REQUIRED');
});

test('27. CARD manual confirmation requires no receipt and a non-empty verification note', () => {
  assert.equal(paymentConfirmation.getPaymentConfirmationError({ method: 'CARD', hasReceipt: false, confirmationMode: 'manual', notes: '  واریز بانکی تأیید شد  ' }), null);
  assert.equal(paymentConfirmation.getPaymentConfirmationError({ method: 'CARD', hasReceipt: false, confirmationMode: 'manual', notes: '   ' }), 'MANUAL_NOTE_REQUIRED');
  assert.equal(paymentConfirmation.getPaymentConfirmationError({ method: 'CARD', hasReceipt: false, confirmationMode: 'manual', notes: 'x'.repeat(1001) }), 'MANUAL_NOTE_TOO_LONG');
  assert.equal(paymentConfirmation.getPaymentConfirmationError({ method: 'CARD', hasReceipt: true, confirmationMode: 'manual', notes: 'تأیید شد' }), 'INVALID_CONFIRMATION_MODE');
});

test('28. ONLINE manual confirmation remains rejected by the gateway protection', () => {
  assert.equal(paymentConfirmation.getPaymentConfirmationError({ method: 'ONLINE', hasReceipt: false, confirmationMode: 'manual', notes: 'تأیید شد' }), 'UNTRUSTED_GATEWAY');
  assert.match(adminPaymentRoute, /UNTRUSTED_GATEWAY/);
});

test('29. manual confirmation keeps exact amount, cancelled-order, permission, and side-effect protections', () => {
  assert.match(adminPaymentRoute, /authorizeAdminApiRequest\(request, ADMIN_PERMISSIONS\.PAYMENTS_EDIT\)/);
  assert.match(adminPaymentRoute, /paid\.plus\(current\.amount\)\.equals\(expected\)/);
  assert.match(adminPaymentRoute, /AMOUNT_MISMATCH/);
  assert.match(adminPaymentRoute, /applySuccessfulPaymentOrderEffects\(tx, current\.orderId\)/);
  assert.match(adminPaymentRoute, /isolationLevel: 'Serializable'/);
  assert.match(adminPaymentsService, /order\.status === 'cancelled'.*ORDER_CANCELLED/);
  assert.match(adminPaymentsService, /\['pending', 'pricing'\]\.includes\(order\.status\).*status: 'paid'/);
  assert.match(adminPaymentsService, /status: 'RESERVED'.*status: 'SOLD'.*soldAt: new Date\(\)/);
});

test('30. activity logs distinguish receipt and manual confirmations without storing a new schema field', () => {
  assert.match(adminPaymentRoute, /confirmationMode: result\.confirmationMode \|\| null/);
  assert.match(adminPaymentRoute, /PAYMENT_MARKED_PAID/);
  assert.match(adminPaymentRoute, /ORDER_STATUS_CHANGED/);
});

test('31. Admin UI separates receipt review from deliberate manual confirmation', () => {
  assert.match(adminPaymentsPage, /handleApprovePayment\(selectedTxn\.id, 'receipt'\)/);
  assert.match(adminPaymentsPage, /تأیید رسید/);
  assert.match(adminPaymentsPage, /رد رسید/);
  assert.match(adminPaymentsPage, /تأیید دستی پرداخت/);
  assert.match(adminPaymentsPage, /confirmationMode: 'manual', notes/);
  assert.match(adminPaymentsPage, /یادداشت بررسی بانکی/);
});

test('32. pending CARD payments without receipts remain actionable in Admin alerts', () => {
  assert.match(adminAlerts, /payment\.count\(\{ where: \{ status: 'pending' \} \}\)/);
  assert.doesNotMatch(adminAlerts, /receiptBlobPathname: \{ not: null \}/);
});
