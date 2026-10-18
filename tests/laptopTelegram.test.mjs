import test from 'node:test';
import assert from 'node:assert/strict';
import { createLaptopPublicationDelivery, TELEGRAM_LEASE_MS } from '../src/lib/telegram/laptopDelivery.js';
import { TelegramError } from '../src/lib/telegram/domain.js';
import { buildTelegramLaptopPost } from '../src/lib/telegram/laptopMessage.js';
const product={id:'laptop-test',brand:'Dell',series:'Precision',model:'5530',priceToman:'110000000',displayNameFa:'لپ تاپ استوک دل پرسیژن 5530',displayNameEn:'Dell Precision 5530',cpu:'Core i7',ram:'16GB',storage:'512GB SSD'};
const buildTelegramProductPost=buildTelegramLaptopPost;
const configuration={code:null,channel:'@shoptest',autoPublish:true};
const success={result:{message_id:77,chat:{id:-100123456789}}};
function harness({ initial = null, config = configuration, failure = null } = {}) {
  let row = initial && { id: 'record', laptopId: product.id, destination: '@shoptest', status: 'PENDING', attemptCount: 0, lockedAt: null, uncertain: false, ...initial };
  let published = true, clock = new Date('2026-10-05T00:00:00Z'), sends = 0;
  const matches = (where) => row && Object.entries(where).every(([key, value]) => value?.lt ? row[key] != null && new Date(row[key]) < value.lt : row[key] === value);
  const db = { laptop: { findUnique: async () => ({ ...product, status: published ? 'AVAILABLE' : 'INACTIVE' }) }, laptopTelegramPublication: {
    findUnique: async () => row && { ...row },
    upsert: async ({ create }) => { row ||= { id: 'record', status: 'PENDING', attemptCount: 0, lockedAt: null, uncertain: false, ...create }; return { ...row }; },
    updateMany: async ({ where, data }) => { if (!matches(where)) return { count: 0 }; row = { ...row, ...data, attemptCount: data.attemptCount ? row.attemptCount + data.attemptCount.increment : row.attemptCount }; return { count: 1 }; },
  } };
  const delivery = createLaptopPublicationDelivery({ db, getConfiguration: async () => config, getProductPost: async () => published ? buildTelegramProductPost(product) : null, getClient: () => ({ sendProductPost: async () => { sends++; if (failure) throw failure; return success.result; } }), now: () => clock });
  return { delivery, db, get row() { return row; }, get sends() { return sends; }, hide: () => { published = false; }, advance: ms => { clock = new Date(clock.getTime() + ms); }, recover: () => { failure = null; } };
}

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
test('failure leaves Laptop active; explicit retry reuses row and increments count', async () => {
  const h = harness({ initial: {}, failure: new TelegramError('TELEGRAM_FORBIDDEN') });
  await h.delivery.deliver(product.id, { automatic: true });
  assert.equal(h.row.status, 'FAILED'); assert.equal((await h.db.laptop.findUnique()).status, 'AVAILABLE');
  h.recover(); await h.delivery.deliver(product.id, { expectedAttemptCount: 1 });
  assert.equal(h.row.id, 'record'); assert.equal(h.row.attemptCount, 2); assert.equal(h.row.status, 'SENT');
});
test('manual send supports historical Laptops, repeat requires confirmation and stale request cannot repost', async () => {
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

test('Laptop Telegram uses bilingual identity, canonical URL, exact Toman, cover and optional display specs',()=>{
 const p=buildTelegramLaptopPost({...product,images:['https://example.com/cover.jpg','https://example.com/other.jpg'],isTouchscreen:false,displayResolution:'2560×1600'});
 assert.equal(p.url,'https://www.dubaikharid.shop/laptops/dell-precision-5530');
 assert.ok(p.text.includes('\n'));assert.ok(!p.text.includes('\\n'));assert.equal(p.photo,'https://example.com/cover.jpg');assert.match(p.text,/Dell Precision 5530/);assert.match(p.text,/۱۱۰٬۰۰۰٬۰۰۰/);assert.match(p.text,/صفحه لمسی: ندارد/);assert.match(p.text,/2560×1600/);
 const unknown=buildTelegramLaptopPost(product);assert.doesNotMatch(unknown.text,/صفحه لمسی|undefined|null/);
});

test('Laptop and Product auto toggles are independent, and Lead destination is ignored',async()=>{
 const {laptopTelegramConfiguration}=await import('../src/lib/telegram/laptopDomain.js');
 const env={VERCEL_ENV:'production',TELEGRAM_BOT_TOKEN:'mock-only'};
 for(const laptops of [true,false])for(const products of [true,false]){
 const c=laptopTelegramConfiguration({telegramEnabled:true,telegramChannel:'@shoptest',telegramLeadChatId:'-100999999999',telegramAutoPublishLaptops:laptops,telegramAutoPublishProducts:products},env);
 assert.equal(c.channel,'@shoptest');assert.equal(c.autoPublish,laptops);assert.equal(c.code,null);
 }
});
