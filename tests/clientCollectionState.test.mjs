import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const source = await readFile(new URL('../src/lib/clientCollectionState.js', import.meta.url), 'utf8');
const stateModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const {
  CART_STORAGE_KEY,
  WISHLIST_STORAGE_KEY,
  normalizeCartItem,
  parseCartStorage,
  parseWishlistStorage,
  resolverPayload,
} = stateModule;

test('uses one explicit versioned key per guest collection', () => {
  assert.equal(CART_STORAGE_KEY, 'dubaikharid_cart_v1');
  assert.equal(WISHLIST_STORAGE_KEY, 'dubaikharid_wishlist_v1');
});

test('corrupt or unexpected storage is recovered safely', () => {
  assert.deepEqual(parseCartStorage('{broken'), []);
  assert.deepEqual(parseWishlistStorage('{"items":[]}'), []);
});

test('legacy full objects become minimal normalized cart entries', () => {
  const [item] = parseCartStorage(JSON.stringify([{
    id: 'product-1', productId: 'product-1', product_type: 'iran_inventory',
    name: 'کالا', priceAed: 50, internalSecret: 'must-not-survive', quantity: 2,
  }]));
  assert.equal(item.type, 'PRODUCT');
  assert.equal(item.id, 'product-1');
  assert.equal(item.quantity, 2);
  assert.equal(item.internalSecret, undefined);
  assert.equal(item.snapshot.internalSecret, undefined);
});

test('product quantities merge and clamp while laptops remain unique quantity one', () => {
  const productItems = parseCartStorage(JSON.stringify([
    { productId: 'p1', quantity: 15 },
    { productId: 'p1', quantity: 15 },
  ]));
  assert.equal(productItems.length, 1);
  assert.equal(productItems[0].quantity, 20);

  const laptopItems = parseCartStorage(JSON.stringify([
    { laptopId: 'l1', quantity: 1, color: 'مشکی' },
    { laptopId: 'l1', quantity: 1, color: 'نقره‌ای' },
  ]));
  assert.equal(laptopItems.length, 1);
  assert.equal(laptopItems[0].quantity, 1);
});

test('resolver payload strips display snapshots, price and status', () => {
  const item = normalizeCartItem({ productId: 'p1', quantity: 2, name: 'کالا', priceAed: 99, status: 'active' });
  assert.deepEqual(resolverPayload([item]), [{ type: 'PRODUCT', productId: 'p1', quantity: 2 }]);
});
