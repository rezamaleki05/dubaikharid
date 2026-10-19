import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { INDEXNOW_ORIGIN as origin, canonicalIndexNowUrl, indexNowConfiguration, indexNowKeyResponse, createIndexNowClient, changedPublicUrls, scheduleIndexNowComparison } from '../src/lib/indexnowDomain.js';
import { createIndexNowStateReader } from '../src/lib/indexnowPublication.js';
const env = { VERCEL_ENV: 'production', NEXT_PUBLIC_SITE_URL: origin, INDEXNOW_KEY: '0123456789abcdef0123456789abcdef' };
const quiet = { warn() {} };
const url = origin + '/product/p1';
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('IndexNow accepts only canonical HTTPS apex public route families', () => {
  for (const path of ['/', '/buy-from-dubai', '/stores/amazon', '/brands/nike', '/product/p1', '/laptops/dell-5530', '/guides/temu-ordering', '/women']) assert.equal(canonicalIndexNowUrl(origin + path), origin + path);
  for (const value of ['https://www.dubaikharid.shop/', 'http://dubaikharid.shop/', 'http://localhost:3000/', 'https://preview.vercel.app/', origin + '/admin', origin + '/admin/settings', origin + '/api/orders', origin + '/login', origin + '/profile', origin + '/cart', origin + '/wishlist', origin + '/tracking', origin + '/payment', origin + '/unknown', origin + '/women?sub=shoes', origin + '/product/p1#x', origin + '/product/p1/', origin + '/product/a%2fb', origin + '/product/a%252fb', origin + '/product/../../about', origin + '/product/%zz', 'https://u:p@dubaikharid.shop/', 'https://dubaikharid.shop:443/']) assert.equal(canonicalIndexNowUrl(value), null, value);
});
test('Production environment, exact apex site configuration and valid key all required', () => {
  assert.ok(indexNowConfiguration(env));
  for (const VERCEL_ENV of ['preview', 'development', 'test', undefined]) assert.equal(indexNowConfiguration({ ...env, VERCEL_ENV }), null);
  for (const INDEXNOW_KEY of ['', 'short', 'bad key', '../key.txt']) assert.equal(indexNowConfiguration({ ...env, INDEXNOW_KEY }), null);
  assert.equal(indexNowConfiguration({ ...env, NEXT_PUBLIC_SITE_URL: 'https://www.dubaikharid.shop' }), null);
});
test('root key verification is exact UTF8 text, non-indexable, absent on previews and wrong hosts', async () => {
  const response = indexNowKeyResponse(origin + '/indexnow.txt', 'indexnow.txt', env);
  assert.equal(response.status, 200); assert.equal(await response.text(), env.INDEXNOW_KEY); assert.match(response.headers.get('content-type'), /text\/plain; charset=utf-8/); assert.match(response.headers.get('x-robots-tag'), /noindex/);
  for (const [u, filename, config] of [[origin + '/bad.txt', 'bad.txt', env], ['https://www.dubaikharid.shop/indexnow.txt', 'indexnow.txt', env], [origin + '/indexnow.txt', 'indexnow.txt', { ...env, VERCEL_ENV: 'preview' }]]) assert.equal(indexNowKeyResponse(u, filename, config).status, 404);
  assert.match(await read('src/app/indexnow.txt/route.js'), /indexNowKeyResponse\(request.url, 'indexnow.txt'\)/);
});
test('bulk request dedupes, uses fixed endpoint/apex/keyLocation and suppresses recent repeats', async () => {
  const requests = []; let tick = 0;
  const client = createIndexNowClient({ env, now: () => tick, logger: quiet, fetchImpl: async (endpoint, input) => { requests.push({ endpoint, ...input }); return { status: 200 }; } });
  assert.deepEqual(await client.submit([url, url, origin + '/laptops/dell-5530']), { ok: true, status: 200, count: 2, code: 'ACCEPTED' });
  const payload = JSON.parse(requests[0].body); assert.equal(requests[0].endpoint, 'https://api.indexnow.org/indexnow'); assert.equal(payload.host, 'dubaikharid.shop'); assert.equal(payload.keyLocation, origin + '/indexnow.txt'); assert.equal(payload.urlList.length, 2);
  assert.equal((await client.submit([url])).count, 0); tick = 300001; assert.equal((await client.submit([url])).count, 1);
});
test('invalid mixed batches reject entirely and disabled environments never contact external service', async () => {
  let calls = 0; const fetchImpl = async () => { calls++; return { status: 200 }; };
  assert.equal((await createIndexNowClient({ env, fetchImpl }).submit([url, origin + '/admin'])).code, 'INVALID_URLS');
  assert.equal((await createIndexNowClient({ env: { ...env, VERCEL_ENV: 'preview' }, fetchImpl }).submit([url])).code, 'DISABLED'); assert.equal(calls, 0);
});
test('IndexNow 202 is accepted pending key validation, not a ranking/indexing claim', async () => {
  assert.equal((await createIndexNowClient({ env, fetchImpl: async () => ({ status: 202 }) }).submit([url])).code, 'KEY_VALIDATION_PENDING');
});
test('HTTP rejection/network timeout do not throw or poison retry dedupe', async () => {
  let fail = true;
  const client = createIndexNowClient({ env, logger: quiet, fetchImpl: async () => ({ status: fail ? 429 : 200 }) });
  assert.equal((await client.submit([url])).ok, false); fail = false; assert.equal((await client.submit([url])).ok, true);
  const timed = createIndexNowClient({ env, logger: quiet, timeoutMs: 5, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('timeout')))) });
  assert.equal((await timed.submit([url])).code, 'UNAVAILABLE');
});
test('overlapping in-flight submissions do not duplicate URLs in one worker', async () => {
  let resolve; const client = createIndexNowClient({ env, fetchImpl: () => new Promise(done => { resolve = done; }) });
  const first = client.submit([url]); assert.equal((await client.submit([url])).count, 0); resolve({ status: 200 }); await first;
});
test('meaningful public changes only: timestamps/private projection absence and hidden URL removals do not submit', () => {
  const before = { [url]: { name: 'Bag', updatedAt: 'old', price: '100' } };
  assert.deepEqual(changedPublicUrls(before, { [url]: { name: 'Bag', updatedAt: 'new', price: '100' } }), []);
  assert.deepEqual(changedPublicUrls(before, { [url]: { name: 'Bag', price: '120' } }), [url]); assert.deepEqual(changedPublicUrls(before, {}), []);
});
test('scheduling, read and delivery errors cannot change original publish success', async () => {
  for (const failure of ['schedule', 'read', 'send']) {
    let callback;
    assert.doesNotThrow(() => scheduleIndexNowComparison({ before: { pages: {} }, defer: task => { if (failure === 'schedule') throw Error(); callback = task; }, readAfter: async () => { if (failure === 'read') throw Error(); return { pages: { [url]: { name: 'Bag' } } }; }, submit: async () => { if (failure === 'send') throw Error(); }, logger: quiet }));
    if (callback) await assert.doesNotReject(callback());
  }
});
test('Product publication/update uses existing public projection and skips hidden or unchanged records', async () => {
  let product = null;
  const reader = createIndexNowStateReader({ readProduct: async () => product });
  const before = await reader('product', 'p1'); product = { id: 'p1', name: 'Bag', price: '10' }; const published = await reader('product', 'p1'); assert.deepEqual(changedPublicUrls(before.pages, published.pages), [url]);
  product = { ...product, price: '20' }; assert.deepEqual(changedPublicUrls(published.pages, (await reader('product', 'p1')).pages), [url]);
  product = null; assert.deepEqual(changedPublicUrls(published.pages, (await reader('product', 'p1')).pages), []);
});
test('Laptop first availability/spec update sends actual model slug, not unit ID or inactive historical units', async () => {
  let groups = []; const reader = createIndexNowStateReader({ readLaptopGroups: async () => groups });
  const before = await reader('laptop', null); groups = [{ slug: 'dell-5530', name: 'Dell', units: [{ id: 'unit1', cpu: 'i7' }] }]; const published = await reader('laptop', 'unit1'); assert.deepEqual(changedPublicUrls(before.pages, published.pages), [origin + '/laptops/dell-5530']);
  groups[0] = { ...groups[0], units: [{ id: 'unit1', cpu: 'i9' }] }; assert.deepEqual(changedPublicUrls(published.pages, (await reader('laptop', 'unit1')).pages), [origin + '/laptops/dell-5530']);
});
test('Store changes and only visible indexable Brand changes eligible; private-only fields ignored', async () => {
  let row = { name: 'Brand', img: '/a.png', showInBrandDirectory: false, _count: { products: 0 } };
  const reader = createIndexNowStateReader({ readEntity: async () => row, brandGuides: { nike: { title: 'Nike' } }, storeAnswers: {} });
  assert.deepEqual((await reader('brand', 'nike')).pages, {}); row = { ...row, showInBrandDirectory: true }; const before = await reader('brand', 'nike'); assert.equal(Object.keys(before.pages).length, 1);
  row = { ...row, privateNote: 'internal', updatedAt: 'new' }; assert.deepEqual(changedPublicUrls(before.pages, (await reader('brand', 'nike')).pages), []);
  const store = await reader('store', 'amazon'); row = { ...row, desc: 'Public description' }; assert.deepEqual(changedPublicUrls(store.pages, (await reader('store', 'amazon')).pages), [origin + '/stores/amazon']);
});
test('Admin hooks occur on authorized mutation handlers, never GET, settings, analytics or Telegram actions', async () => {
  for (const path of ['products/route.js', 'products/[id]/route.js', 'products/[id]/configuration/route.js', 'products/[id]/pricing/route.js', 'products/[id]/variants/route.js', 'product-variants/[id]/route.js', 'product-variants/[id]/options/route.js', 'laptops/route.js', 'laptops/[id]/route.js', 'stores/route.js', 'stores/[id]/route.js', 'brands/route.js', 'brands/[id]/route.js']) {
    const source = await read('src/app/api/admin/' + path); assert.match(source, /scheduleIndexNowChange\(/, path);
    const get = source.match(/export async function GET[\s\S]*?(?=export async function|$)/)?.[0] || ''; assert.doesNotMatch(get, /scheduleIndexNowChange\(|captureIndexNowState\(/, path);
    assert.ok(source.indexOf('authorizeAdminApiRequest') < source.lastIndexOf('scheduleIndexNowChange('));
  }
  for (const path of ['src/app/api/admin/settings/route.js', 'src/app/api/admin/products/[id]/telegram/route.js', 'src/app/api/admin/laptops/[id]/telegram/route.js']) assert.doesNotMatch(await read(path), /scheduleIndexNowChange/);
});
test('content release command is explicit, validates live canonical/noindex/key and never runs on builds', async () => {
  const script = await read('scripts/indexnow-submit.mjs'); for (const token of ['--changed-from', '--from-sitemap', '--send', 'DRY_RUN_VERIFIED', '--receipt', 'Canonical mismatch', 'Noindex', 'Key verification failed']) assert.ok(script.includes(token));
  assert.doesNotMatch(await read('package.json'), /indexnow-submit/); assert.doesNotMatch(await read('src/app/layout.js'), /indexnow/i);
});

test('versioned guide/store/brand updates plan only changed live content, never all URLs each deployment', async () => {
  const { changedIndexNowContent } = await import('../src/lib/indexnowContent.js');
  const previous = { guides: { a: { title: 'A' } }, brandGuides: { nike: { title: 'Old' } }, storeAnswers: {} };
  const current = { guides: { a: { title: 'New' }, b: { title: 'B' } }, brandGuides: { nike: { title: 'New' }, adidas: { title: 'New' } }, storeAnswers: {} };
  const liveUrls = [origin + '/brands/nike', origin + '/product/p1', origin + '/admin'];
  assert.deepEqual(changedIndexNowContent({ previous, current, liveUrls }), [origin + '/guides/a', origin + '/guides/b', origin + '/brands/nike']);
  assert.deepEqual(changedIndexNowContent({ previous: current, current, liveUrls, files: ['src/lib/indexnow.js'] }), []);
});
