import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { clarityProjectId, isClarityEnvironment, isClarityLocation, clarityBrowserExcluded } from '../src/lib/clarityPolicy.js';
import { installPublicClarity } from '../src/lib/clarityRuntime.js';

const production = { VERCEL_ENV: 'production', NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://dubaikharid.shop', NEXT_PUBLIC_CLARITY_PROJECT_ID: 'example123' };
function browser(path = '/') {
  const listeners = {}, attributes = {}, scripts = [], idles = new Map(), assigned = [];
  let nextId = 0;
  const win = { location: new URL(`https://dubaikharid.shop${path}`), navigator: {}, localStorage: { getItem: () => null }, history: {},
    document: { referrer: '', body: { setAttribute: (key, value) => { attributes[key] = value; } },
      querySelector: () => null, createElement: () => ({ remove() { this.removed = true; } }),
      head: { appendChild: script => scripts.push(script) }, addEventListener: (name, fn) => { listeners[`document:${name}`] = fn; } },
    addEventListener: (name, fn) => { listeners[name] = fn; },
    requestIdleCallback: fn => { idles.set(++nextId, fn); return nextId; }, cancelIdleCallback: id => idles.delete(id),
  };
  const setLocation = url => { win.location = new URL(url, win.location); win.location.assign = url => assigned.push(url); win.location.reload = () => assigned.push('RELOAD'); };
  setLocation(win.location);
  for (const name of ['pushState', 'replaceState']) win.history[name] = (_state, _title, url) => setLocation(url);
  return { win, scripts, attributes, listeners, assigned, idle() { for (const [id, fn] of [...idles]) { idles.delete(id); fn(); } }, setLocation };
}
const install = b => installPublicClarity(b.win, { enabled: true, projectId: 'example123' });
const calls = b => (b.win.clarity?.q || []).map(args => [...args]);

test('environment requires actual Production, exact configured apex and valid project ID', () => {
  assert.equal(isClarityEnvironment(production), true);
  for (const patch of [{ VERCEL_ENV: 'preview' }, { VERCEL_ENV: 'development' }, { NODE_ENV: 'test' }, { NEXT_PUBLIC_CLARITY_PROJECT_ID: '' }, { NEXT_PUBLIC_SITE_URL: 'https://www.dubaikharid.shop' }]) {
    assert.equal(isClarityEnvironment({ ...production, ...patch }), false);
  }
  for (const id of [undefined, ' x123456', '12345', 'example/123', '<script>', 'UPPERCASE']) assert.equal(clarityProjectId(id), null);
});
test('public Homepage, canonical search and all requested public page families are eligible', () => {
  for (const path of ['/', '/#calculator', '/women', '/stock-laptops', '/product/cm123', '/laptops/dell-5580', '/stores/noon', '/brands/nike', '/guides/shoe-sizing', '/buy-from-dubai', '/search']) {
    assert.equal(isClarityLocation(new URL(`https://dubaikharid.shop${path}`)), true, path);
  }
});
test('private, sensitive, unknown, query-bearing, alternate-host and malformed routes never qualify', () => {
  for (const path of ['/admin', '/admin/dashboard', '/api/health', '/login', '/account', '/account/settings', '/profile', '/profile/orders', '/checkout', '/payment', '/cart', '/tracking', '/wishlist', '/warehouse', '/orders', '/unknown', '/search?q=private', '/?email=private', '/#private', '/product/a%2Fb']) {
    assert.equal(isClarityLocation(new URL(`https://dubaikharid.shop${path}`)), false, path);
  }
  for (const url of ['http://dubaikharid.shop/', 'https://www.dubaikharid.shop/', 'http://localhost:3105/', 'https://preview.vercel.app/', 'https://user:password@dubaikharid.shop/']) assert.equal(isClarityLocation(new URL(url)), false);
});
test('automated QA and owner opt-outs are excluded without any script request', () => {
  for (const configure of [b => { b.win.navigator.webdriver = true; }, b => { b.win.__DUBAIKHARID_QA__ = true; }, b => { b.win.localStorage.getItem = () => '1'; }, b => { b.win.localStorage.getItem = () => { throw Error(); }; }]) {
    const b = browser(); configure(b); assert.equal(clarityBrowserExcluded(b.win), true); assert.equal(install(b), null); b.idle(); assert.equal(b.scripts.length, 0);
  }
});
test('sensitive referrers prevent capture, including private routes and query data', () => {
  for (const referrer of ['https://dubaikharid.shop/profile', 'https://dubaikharid.shop/search?q=private', 'https://example.org/?email=private']) {
    const b = browser(); b.win.document.referrer = referrer; assert.equal(install(b), null); b.idle(); assert.equal(b.scripts.length, 0);
  }
});
test('direct private route has no initialization, SDK queue or pending script', () => {
  for (const path of ['/admin', '/profile', '/payment', '/tracking', '/login']) { const b = browser(path); const s = install(b); b.idle(); assert.equal(s.initialized, false); assert.equal(b.win.clarity, undefined); assert.equal(b.scripts.length, 0); }
});
test('idle initialization masks first, denies both storage types and sends only a finite page_type', () => {
  const b = browser('/product/cm123'); const s = install(b); assert.equal(s.initialized, false); assert.equal(b.scripts.length, 0); b.idle();
  assert.equal(b.attributes['data-clarity-mask'], 'true'); assert.equal(b.scripts.length, 1); assert.equal(b.scripts[0].async, true); assert.equal(b.scripts[0].src, 'https://www.clarity.ms/tag/example123');
  assert.deepEqual(calls(b), [['consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }], ['set', 'page_type', 'product']]);
  assert.equal(b.win.dataLayer, undefined); assert.equal(b.win.gtag, undefined);
});
test('React remount, repeated idle and public transitions do not duplicate SDK initialization', () => {
  const b = browser(); const first = install(b); assert.equal(install(b), first); b.idle(); install(b); b.idle();
  b.win.history.pushState({}, '', '/laptops/dell-5580'); b.win.history.replaceState({}, '', '/laptops/dell-5530');
  assert.equal(b.scripts.length, 1); assert.deepEqual(calls(b).filter(c => c[0] === 'set'), [['set', 'page_type', 'home'], ['set', 'page_type', 'laptop']]);
});
test('public-to-private programmatic history stops first and uses a fresh document without private pushState', () => {
  for (const method of ['pushState', 'replaceState']) { const b = browser(); const state = install(b); b.idle(); b.win.history[method]({}, '', '/profile');
    assert.equal(state.stopped, true); assert.equal(b.win.location.pathname, '/'); assert.deepEqual(b.assigned, ['https://dubaikharid.shop/profile']); assert.deepEqual(calls(b).at(-1), ['stop']); assert.equal(b.scripts[0].removed, true);
  }
});
test('private click before idle cancels startup before sensitive navigation', () => {
  const b = browser(); const state = install(b); let prevented = false, stopped = false;
  b.listeners['document:click']({ target: { closest: () => ({ href: 'https://dubaikharid.shop/admin', target: '', hasAttribute: () => false }) }, preventDefault() { prevented = true; }, stopImmediatePropagation() { stopped = true; } });
  b.idle(); assert.equal(prevented, true); assert.equal(stopped, true); assert.equal(state.stopped, true); assert.equal(b.scripts.length, 0); assert.equal(b.win.clarity, undefined);
});
test('back/forward privacy guard stops before private page rendering and reloads the document', () => {
  const b = browser(); const state = install(b); b.idle(); b.setLocation('/payment?order=private'); b.listeners.popstate();
  assert.equal(state.stopped, true); assert.deepEqual(b.assigned, ['RELOAD']); assert.deepEqual(calls(b).at(-1), ['stop']);
});
test('query navigation and script failures stop safely and cannot restart the SDK in that document', () => {
  const b = browser(); const state = install(b); b.idle(); b.win.history.pushState({}, '', '/search?q=private');
  assert.equal(state.stopped, true); assert.equal(b.win.location.pathname, '/'); b.win.history.pushState({}, '', '/women'); b.idle(); assert.equal(b.scripts.length, 1);
  const failure = browser(); const f = install(failure); failure.idle(); assert.doesNotThrow(() => failure.scripts[0].onerror()); assert.equal(f.stopped, true);
});
test('unexpected existing integration is not duplicated or overwritten', () => {
  const b = browser(); const existing = () => {}; b.win.clarity = existing; assert.equal(install(b), null); assert.equal(b.win.clarity, existing); b.idle(); assert.equal(b.scripts.length, 0);
});
test('sensitive dialog observer is registered before SDK load and stops before private URL attributes can be collected', () => {
  const b = browser(); let observe, disconnected = false, sensitive = false;
  b.win.MutationObserver = class { constructor(fn) { observe = fn; } observe() {} disconnect() { disconnected = true; } };
  b.win.document.querySelector = selector => selector.includes('sensitive') && sensitive ? {} : null;
  const state = install(b); assert.equal(typeof observe, 'function'); assert.equal(b.scripts.length, 0); b.idle();
  sensitive = true; observe(); assert.equal(state.stopped, true); assert.equal(disconnected, true); assert.deepEqual(calls(b).at(-1), ['stop']);
  const opened = browser(); opened.win.document.querySelector = selector => selector.includes('sensitive') ? {} : null; install(opened); opened.idle(); assert.equal(opened.scripts.length, 0);
});
test('external or private clicked URLs stop recording even when opening a separate tab', () => {
  for (const href of ['https://wa.me/971000000?text=private', 'https://dubaikharid.shop/payment?order=private']) {
    const b = browser(); const state = install(b); b.idle();
    b.listeners['document:click']({ target: { closest: () => ({ href, target: '_blank' }) } });
    assert.equal(state.stopped, true); assert.deepEqual(b.assigned, []); assert.deepEqual(calls(b).at(-1), ['stop']);
  }
});
test('SSR and four lead flows retain explicit masks; no unmask, identify, PII tags or GA hooks', async () => {
  const read = path => readFile(new URL(path, import.meta.url), 'utf8');
  const layout = await read('../src/app/layout.js'); assert.match(layout, /<body data-clarity-mask="true"/); assert.equal((layout.match(/<PublicClarity /g) || []).length, 1);
  for (const file of ['../src/components/QuickPurchaseRequestModal.js', '../src/components/CheckoutModal.js', '../src/app/product/[id]/ProductClient.js', '../src/app/profile/page.js']) assert.match(await read(file), /data-clarity-mask="true"/);
  const runtime = await read('../src/lib/clarityRuntime.js'); assert.doesNotMatch(runtime, /gtag|dataLayer|identify\s*\(|data-clarity-unmask/); assert.equal((runtime.match(/'set',/g) || []).length, 1);
});
