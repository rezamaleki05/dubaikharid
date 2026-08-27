import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = async path => readFile(new URL(path, import.meta.url), 'utf8');

const storage = new Map();
globalThis.window = {
  dataLayer: [],
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
  },
};
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-65ETTKMWRB';

const analyticsSource = (await source('../src/lib/analytics.js')).replace(
  "import { sendGAEvent } from '@next/third-parties/google';",
  'const sendGAEvent = (...args) => window.dataLayer.push(args);',
);
const analytics = await import(`data:text/javascript;base64,${Buffer.from(analyticsSource).toString('base64')}`);

function lastEvent() {
  return window.dataLayer.at(-1);
}

test('recommended ecommerce helpers emit storefront-safe GA4 item payloads in AED', () => {
  window.dataLayer.length = 0;
  const product = {
    id: 'product-1',
    name: 'Test Product',
    brand: 'Test Brand',
    category: 'Test Category',
    priceAed: 100,
    discountPercent: 10,
    quantity: 2,
  };

  assert.equal(analytics.trackViewItem(product), true);
  assert.deepEqual(lastEvent(), ['event', 'view_item', {
    currency: 'AED',
    value: 180,
    items: [{
      item_id: 'product-1', item_name: 'Test Product', item_brand: 'Test Brand',
      item_category: 'Test Category', price: 90, quantity: 2,
    }],
  }]);

  assert.equal(analytics.trackAddToCart(product, 1), true);
  assert.equal(lastEvent()[1], 'add_to_cart');
  assert.equal(analytics.trackRemoveFromCart(product, 1), true);
  assert.equal(lastEvent()[1], 'remove_from_cart');
  assert.equal(analytics.trackViewCart([product]), true);
  assert.equal(lastEvent()[1], 'view_cart');
  assert.equal(analytics.trackBeginCheckout([product]), true);
  assert.equal(lastEvent()[1], 'begin_checkout');
});

test('purchase requires a locally initiated order and a server-confirmed paid state, then fires once', () => {
  window.dataLayer.length = 0;
  storage.clear();
  const paidOrder = {
    id: 'DK-1001',
    orderCode: 'DK-1001',
    transactionId: 'BANK-REFERENCE-1',
    paymentStatus: 'paid',
    customerName: 'must-not-be-sent',
    phone: 'must-not-be-sent',
    items: [{ productId: 'product-1', name: 'Test Product', priceAed: 50, quantity: 2 }],
  };

  assert.equal(analytics.trackPurchaseOnce(paidOrder), false);
  assert.equal(window.dataLayer.length, 0);
  assert.equal(analytics.markPurchasePending('DK-1001'), true);
  assert.equal(analytics.trackPurchaseOnce({ ...paidOrder, paymentStatus: 'pending' }), false);
  assert.equal(analytics.trackPurchaseOnce(paidOrder), true);
  assert.equal(analytics.trackPurchaseOnce(paidOrder), false);
  assert.equal(window.dataLayer.length, 1);

  const event = lastEvent();
  assert.equal(event[1], 'purchase');
  assert.equal(event[2].transaction_id, 'DK-1001');
  assert.equal(event[2].currency, 'AED');
  assert.equal(event[2].value, 100);
  assert.doesNotMatch(JSON.stringify(event[2]), /customerName|phone|email|address/i);
});

test('WhatsApp event sends placement only and no destination or customer data', () => {
  window.dataLayer.length = 0;
  assert.equal(analytics.trackWhatsAppClick('footer'), true);
  assert.deepEqual(lastEvent(), ['event', 'whatsapp_click', { link_location: 'footer' }]);
});

test('real UI triggers use the centralized helper without adding another GA tag', async () => {
  const [layout, product, cart, checkout, cartContext, profile, footer, manualPayment] = await Promise.all([
    source('../src/app/layout.js'),
    source('../src/app/product/[id]/page.js'),
    source('../src/app/cart/page.js'),
    source('../src/components/CheckoutModal.js'),
    source('../src/context/CartContext.js'),
    source('../src/app/profile/page.js'),
    source('../src/components/Footer.js'),
    source('../src/components/payment/ManualPaymentPanel.js'),
  ]);

  assert.equal((layout.match(/<GoogleAnalytics/g) || []).length, 1);
  assert.match(product, /trackViewItem\(product\)/);
  assert.match(cart, /trackViewCart\(cartItems\)/);
  assert.match(checkout, /trackBeginCheckout\(checkoutItems\)/);
  assert.match(checkout, /if \(isOrder\) markPurchasePending\(code\)/);
  assert.match(cartContext, /trackAddToCart/);
  assert.match(cartContext, /trackRemoveFromCart/);
  assert.match(profile, /paymentStatus === 'paid'/);
  assert.match(profile, /trackPurchaseOnce/);
  assert.match(footer, /trackWhatsAppClick\('footer'\)/);
  assert.match(manualPayment, /trackWhatsAppClick\('manual_payment'\)/);
});
