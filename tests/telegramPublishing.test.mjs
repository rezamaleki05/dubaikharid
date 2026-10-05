import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createPublicationDelivery, TELEGRAM_LEASE_MS } from '../src/lib/telegram/delivery.js';
import { telegramConfiguration, normalizeTelegramChannel, TelegramError } from '../src/lib/telegram/domain.js';
import { buildTelegramProductPost, telegramExcerpt, escapeTelegramHtml } from '../src/lib/telegram/message.js';
import { defaultSettings, validateSettingValue, PUBLIC_SETTING_KEYS } from '../src/lib/settingsSchema.js';

// Only the server-only build sentinel is removed. All real client code runs against a mock transport.
const clientSource = readFileSync('src/lib/telegram/client.js', 'utf8').replace("import 'server-only';", '').replace("'./domain.js'", JSON.stringify(pathToFileURL(process.cwd() + '/src/lib/telegram/domain.js').href));
const { createTelegramClient } = await import('data:text/javascript;base64,' + Buffer.from(clientSource).toString('base64'));
const enabled = { telegramEnabled: true, telegramAutoPublishProducts: true, telegramChannel: '@shoptest' };
const env = { VERCEL_ENV: 'production', TELEGRAM_BOT_TOKEN: 'fake-unit-test-secret' };
const configuration = telegramConfiguration(enabled, env);
const product = { id: 'product-123', nameFa: 'کفش فارسی', brand: 'نایک', description: 'توضیحات محصول', supplyMode: 'EXTERNAL_DUBAI', cardPricing: { minimumFinalPriceToman: '250000', varies: true } };
function mockFetch(replies) {
  const calls = [];
  return { calls, fetchImpl: async (url, options) => {
    calls.push({ method: url.split('/').at(-1), body: JSON.parse(options.body) });
    const response = replies.shift();
    if (response instanceof Error) throw response;
    if (!response) throw new Error('Unexpected network call');
    return { ok: response.ok, status: response.error_code || 200, json: async () => response };
  } };
}
const success = { ok: true, result: { message_id: 77, chat: { id: -100123456789 } } };
function harness({ initial = null, config = configuration, failure = null } = {}) {
  let row = initial && { id: 'record', productId: product.id, destination: '@shoptest', status: 'PENDING', attemptCount: 0, lockedAt: null, uncertain: false, ...initial };
  let published = true, clock = new Date('2026-10-05T00:00:00Z'), sends = 0;
  const matches = (where) => row && Object.entries(where).every(([key, value]) => value?.lt ? row[key] != null && new Date(row[key]) < value.lt : row[key] === value);
  const db = { product: { findUnique: async () => ({ id: product.id, status: published ? 'active' : 'hidden' }) }, telegramPublication: {
    findUnique: async () => row && { ...row },
    upsert: async ({ create }) => { row ||= { id: 'record', status: 'PENDING', attemptCount: 0, lockedAt: null, uncertain: false, ...create }; return { ...row }; },
    updateMany: async ({ where, data }) => { if (!matches(where)) return { count: 0 }; row = { ...row, ...data, attemptCount: data.attemptCount ? row.attemptCount + data.attemptCount.increment : row.attemptCount }; return { count: 1 }; },
  } };
  const delivery = createPublicationDelivery({ db, getConfiguration: async () => config, getProductPost: async () => published ? buildTelegramProductPost(product) : null, getClient: () => ({ sendProductPost: async () => { sends++; if (failure) throw failure; return success.result; } }), now: () => clock });
  return { delivery, db, get row() { return row; }, get sends() { return sends; }, hide: () => { published = false; }, advance: ms => { clock = new Date(clock.getTime() + ms); }, recover: () => { failure = null; } };
}

test('Telegram settings default off, normalize valid channels, reject invalid values and stay private', () => {
  assert.equal(defaultSettings(['telegramEnabled']).telegramEnabled, false);
  assert.equal(normalizeTelegramChannel(' @ShopTest '), '@shoptest');
  assert.equal(normalizeTelegramChannel('-100123456789'), '-100123456789');
  for (const invalid of ['https://t.me/shoptest', '@a', '1234567', '@x<script>', {}, null]) assert.equal(normalizeTelegramChannel(invalid), null);
  assert.ok(validateSettingValue('telegramChannel', 'bad').error);
  assert.equal(validateSettingValue('telegramChannel', '@ShopTest').value, '@shoptest');
  assert.ok(validateSettingValue('TELEGRAM_BOT_TOKEN', 'secret').error);
  for (const key of ['telegramEnabled', 'telegramChannel', 'telegramAutoPublishProducts']) assert.ok(!PUBLIC_SETTING_KEYS.includes(key));
});
test('disabled, missing token, invalid destination, manual-only, and isolated environment guards', () => {
  assert.equal(telegramConfiguration({}, env).code, 'TELEGRAM_DISABLED');
  assert.equal(telegramConfiguration(enabled, { VERCEL_ENV: 'production' }).code, 'TELEGRAM_NOT_CONFIGURED');
  assert.equal(telegramConfiguration({ ...enabled, telegramChannel: 'bad' }, env).code, 'TELEGRAM_INVALID_CHANNEL');
  assert.equal(telegramConfiguration({ ...enabled, telegramAutoPublishProducts: false }, env).autoPublish, false);
  for (const VERCEL_ENV of ['preview', 'development', undefined]) {
    assert.equal(telegramConfiguration(enabled, { ...env, VERCEL_ENV, TELEGRAM_ALLOW_SEND: 'true' }).code, 'TELEGRAM_ENVIRONMENT_BLOCKED');
    const c = telegramConfiguration(enabled, { ...env, VERCEL_ENV, TELEGRAM_ALLOW_SEND: 'true', TELEGRAM_TEST_CHANNEL: '@isolatedtest' });
    assert.equal(c.channel, '@isolatedtest'); assert.equal(c.code, null);
  }
  assert.equal(telegramConfiguration(enabled, { ...env, TELEGRAM_ALLOW_SEND: 'false' }).code, 'TELEGRAM_ENVIRONMENT_BLOCKED');
  assert.ok(!JSON.stringify(configuration).includes(env.TELEGRAM_BOT_TOKEN));
});
test('Persian message, website price summary, canonical id URL and inline CTA', () => {
  const post = buildTelegramProductPost(product);
  assert.match(post.text, /کفش فارسی/); assert.match(post.text, /برند: نایک/); assert.match(post.text, /از ۲۵۰٬۰۰۰ تومان/); assert.match(post.text, /خرید از دبی/);
  assert.equal(post.url, 'https://www.dubaikharid.shop/product/product-123');
  assert.equal(post.reply_markup.inline_keyboard[0][0].url, post.url);
  assert.equal(post.reply_markup.inline_keyboard[0][0].text, 'مشاهده محصول');
  assert.equal(post.photo, null);
  assert.match(buildTelegramProductPost({ ...product, supplyMode: 'IRAN_STOCK', cardPricing: null }).text, /موجود در ایران/);
});
test('escaping, grapheme-safe truncation and captions fit 1024 parsed UTF-16 units', () => {
  assert.equal(escapeTelegramHtml('<&>"'), '&lt;&amp;&gt;&quot;');
  assert.equal(telegramExcerpt('سلام 👩‍👩‍👧‍👦 پایان', 10), 'سلام …');
  const post = buildTelegramProductPost({ ...product, nameFa: '<script>bad</script>' + '&'.repeat(300), brand: '&'.repeat(200), description: ('فارسی 👩‍👩‍👧‍👦 &<> ').repeat(300) });
  assert.doesNotMatch(post.text, /<script>/);
  assert.ok(post.text.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replace(/<\/?b>/g, '').length <= 1024);
  assert.ok(!post.text.includes('\ufffd'));
});
test('same gallery resolver selects primary image; invalid/no images use text', () => {
  assert.equal(buildTelegramProductPost({ ...product, images: [{ id: 'a', url: '/first.jpg', sortOrder: 0 }, { id: 'b', url: '/primary.jpg', sortOrder: 9, isPrimary: true }] }).photo, 'https://www.dubaikharid.shop/primary.jpg');
  for (const image of [null, 'data:image/png;base64,x', 'http://insecure.test/a.jpg', '/images/product-placeholder.svg']) assert.equal(buildTelegramProductPost({ ...product, image }).photo, null);
});
test('photo rejection falls back to text exactly once', async () => {
  const transport = mockFetch([{ ok: false, error_code: 400, description: 'fake-unit-test-secret' }, success]);
  await createTelegramClient({ token: env.TELEGRAM_BOT_TOKEN, ...transport }).sendProductPost('@shoptest', { ...buildTelegramProductPost(product), photo: 'https://example.test/a.jpg' });
  assert.deepEqual(transport.calls.map(c => c.method), ['sendPhoto', 'sendMessage']);
});
test('timeouts, forbidden, authentication, rate limit and server failures never retry photo blindly or leak secret', async () => {
  for (const reply of [new Error('https://api.telegram.org/botfake-unit-test-secret/sendPhoto'), { ok: false, error_code: 401 }, { ok: false, error_code: 403 }, { ok: false, error_code: 429, parameters: { retry_after: 30 } }, { ok: false, error_code: 503 }]) {
    const transport = mockFetch([reply]);
    await assert.rejects(createTelegramClient({ token: env.TELEGRAM_BOT_TOKEN, ...transport }).sendProductPost('@shoptest', { photo: 'https://example.test/a.jpg' }), error => { assert.ok(!JSON.stringify(error).includes(env.TELEGRAM_BOT_TOKEN)); return true; });
    assert.equal(transport.calls.length, 1);
  }
});
test('connection test checks membership without sending; explicit test message is clearly labeled', async () => {
  const transport = mockFetch([{ ok: true, result: { id: 1 } }, { ok: true, result: { id: -10, type: 'channel' } }, { ok: true, result: { status: 'administrator', can_post_messages: true } }, success]);
  const client = createTelegramClient({ token: 'fake', ...transport });
  assert.equal((await client.testConnection('@shoptest')).canPost, true);
  assert.deepEqual(transport.calls.map(c => c.method), ['getMe', 'getChat', 'getChatMember']);
  await client.sendTestMessage('@shoptest');
  assert.match(transport.calls.at(-1).body.text, /DubaiKharid Telegram Test/);
});
test('automatic worker sends pending once despite concurrent requests, edits, and republishing', async () => {
  const h = harness({ initial: {} });
  await Promise.all(Array.from({ length: 20 }, () => h.delivery.deliver(product.id, { automatic: true })));
  assert.equal(h.sends, 1); assert.equal(h.row.status, 'SENT'); assert.equal(h.row.attemptCount, 1);
  await h.delivery.deliver(product.id, { automatic: true });
  assert.equal(h.sends, 1);
});
test('no automatic historical backfill and no network when disabled or auto disabled', async () => {
  const h = harness(); await h.delivery.deliver(product.id, { automatic: true }); assert.equal(h.row, null); assert.equal(h.sends, 0);
  for (const config of [{ ...configuration, code: 'TELEGRAM_DISABLED' }, { ...configuration, autoPublish: false }]) {
    const disabled = harness({ initial: {}, config }); await disabled.delivery.deliver(product.id, { automatic: true }); assert.equal(disabled.sends, 0); assert.equal(disabled.row.status, 'FAILED');
  }
});
test('failure leaves Product active; explicit retry reuses row and increments count', async () => {
  const h = harness({ initial: {}, failure: new TelegramError('TELEGRAM_FORBIDDEN') });
  await h.delivery.deliver(product.id, { automatic: true });
  assert.equal(h.row.status, 'FAILED'); assert.equal((await h.db.product.findUnique()).status, 'active');
  h.recover(); await h.delivery.deliver(product.id, { expectedAttemptCount: 1 });
  assert.equal(h.row.id, 'record'); assert.equal(h.row.attemptCount, 2); assert.equal(h.row.status, 'SENT');
});
test('manual send supports historical Products, repeat requires confirmation and stale request cannot repost', async () => {
  const h = harness(); await h.delivery.deliver(product.id); assert.equal(h.row.status, 'SENT');
  await assert.rejects(h.delivery.deliver(product.id, { expectedAttemptCount: 1 }), { code: 'TELEGRAM_CONFIRM_REQUIRED' });
  await h.delivery.deliver(product.id, { expectedAttemptCount: 1, confirmRepost: true });
  await assert.rejects(h.delivery.deliver(product.id, { expectedAttemptCount: 1, confirmRepost: true }), { code: 'TELEGRAM_STALE_REQUEST' });
  assert.equal(h.sends, 2);
});
test('timeout and abandoned claims become uncertain and require explicit confirmation', async () => {
  const h = harness({ initial: { lockedAt: new Date('2026-10-05T00:00:00Z'), claimToken: 'old', attemptCount: 1 } });
  h.advance(TELEGRAM_LEASE_MS + 1); await h.delivery.read(product.id);
  assert.equal(h.row.status, 'FAILED'); assert.equal(h.row.uncertain, true);
  await assert.rejects(h.delivery.deliver(product.id, { expectedAttemptCount: 1 }), { code: 'TELEGRAM_CONFIRM_REQUIRED' });
  await h.delivery.deliver(product.id, { expectedAttemptCount: 1, confirmRepost: true }); assert.equal(h.row.status, 'SENT');
});
test('hidden product blocked, destination changes blocked automatically and retry_after respected', async () => {
  const hidden = harness(); hidden.hide(); await assert.rejects(hidden.delivery.deliver(product.id), { code: 'PRODUCT_NOT_PUBLISHED' });
  const changed = harness({ initial: { destination: '@previous' } }); await changed.delivery.deliver(product.id, { automatic: true }); assert.equal(changed.row.lastError, 'TELEGRAM_DESTINATION_CHANGED'); assert.equal(changed.sends, 0);
  const rate = harness({ initial: {}, failure: new TelegramError('TELEGRAM_RATE_LIMITED', { retryAfter: 60 }) });
  await rate.delivery.deliver(product.id, { automatic: true });
  await assert.rejects(rate.delivery.deliver(product.id, { expectedAttemptCount: 1 }), { code: 'TELEGRAM_RATE_LIMITED' });
  rate.advance(60001); rate.recover(); await rate.delivery.deliver(product.id, { expectedAttemptCount: 1 }); assert.equal(rate.row.status, 'SENT');
});
test('Telegram management authorization runs before any service call for anonymous and read-only admins', async () => {
  for (const file of ['src/app/api/admin/telegram/route.js', 'src/app/api/admin/products/[id]/telegram/route.js']) {
    for (const status of [401, 403]) {
      globalThis.__telegramRouteAuthorization = async () => ({ response: new Response('blocked', { status }) });
      const source = readFileSync(file, 'utf8').replace(/import[\s\S]*?from ['"][^'"]+['"];\n/g, '')
        + '\n';
      const prelude = `const authorizeAdminApiRequest = globalThis.__telegramRouteAuthorization; const ADMIN_PERMISSIONS = {}; const NextResponse = {json: () => {throw new Error('Unexpected service access');}};`;
      const route = await import('data:text/javascript;base64,' + Buffer.from(prelude + source).toString('base64') + '#' + file + status);
      for (const method of ['GET', 'POST']) assert.equal((await route[method](new Request('http://localhost/'), { params: Promise.resolve({ id: product.id }) })).status, status);
    }
  }
});

test('malformed Telegram responses and transport errors are uncertain, sanitized, and never retried automatically', async () => {
  for (const body of [null, 'invalid', {}, { result: null }]) {
    const client = createTelegramClient({ token: 'fake-secret', fetchImpl: async () => ({ ok: true, json: async () => body }) });
    await assert.rejects(client.sendProductPost('@shoptest', { photo: 'https://example.test/a.jpg' }), { code: 'TELEGRAM_DELIVERY_UNCERTAIN', uncertain: true });
  }
  const h = harness({ initial: {}, failure: new TelegramError('TELEGRAM_DELIVERY_UNCERTAIN', { uncertain: true }) });
  await h.delivery.deliver(product.id, { automatic: true });
  assert.equal(h.row.uncertain, true); assert.equal(h.row.lastError, 'TELEGRAM_DELIVERY_UNCERTAIN');
  await assert.rejects(h.delivery.deliver(product.id, { expectedAttemptCount: 1 }), { code: 'TELEGRAM_CONFIRM_REQUIRED' });
});
