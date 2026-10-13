import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { formatLeadTimestamp } from '../src/lib/leadNotifications/timestamp.js';
import { buildLeadTelegramMessage } from '../src/lib/leadNotifications/message.js';
import { createLeadNotifier } from '../src/lib/leadNotifications/delivery.js';

const instant = '2026-10-13T21:51:00Z';
const expected = 'شمسی: ۲۲ مهر ۱۴۰۵\nمیلادی: ۱۴ اکتبر ۲۰۲۶\nساعت: ۰۱:۵۱ دبی';
test('same UTC instant renders Jalali, Gregorian and Dubai 24-hour time', () => {
  assert.equal(formatLeadTimestamp(instant), expected);
  assert.equal(formatLeadTimestamp('2026-10-14T01:51:00+04:00'), expected);
  const stored = new Date(instant);
  assert.equal(formatLeadTimestamp(stored), expected);
  assert.equal(stored.getTime(), Date.parse(instant));
});
test('Dubai midnight rolls date forward and renders 00:00, never 24:00', () => {
  assert.equal(formatLeadTimestamp('2026-10-13T20:00:00Z'), 'شمسی: ۲۲ مهر ۱۴۰۵\nمیلادی: ۱۴ اکتبر ۲۰۲۶\nساعت: ۰۰:۰۰ دبی');
  assert.equal(formatLeadTimestamp('2026-10-13T19:59:00Z'), 'شمسی: ۲۱ مهر ۱۴۰۵\nمیلادی: ۱۳ اکتبر ۲۰۲۶\nساعت: ۲۳:۵۹ دبی');
});
test('missing, invalid, HTML and zone-less timestamps are omitted', () => {
  for (const value of [undefined, null, '', 'bad', '<b>2026</b>', '2026-10-14T01:51:00', new Date(NaN), '2026-99-99T00:00:00Z']) {
    assert.equal(formatLeadTimestamp(value), '');
    const message = buildLeadTelegramMessage({ type: 'order', createdAt: value });
    assert.ok(!message.text.includes('زمان ثبت:')); assert.ok(!message.text.includes('Invalid Date'));
  }
});
test('host timezones cannot change the Dubai timestamp', () => {
  const url = pathToFileURL(process.cwd() + '/src/lib/leadNotifications/timestamp.js').href;
  for (const TZ of ['UTC', 'America/Los_Angeles', 'Asia/Tehran']) {
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', 'import {formatLeadTimestamp} from ' + JSON.stringify(url) + '; process.stdout.write(formatLeadTimestamp(' + JSON.stringify(instant) + '));'], { env: { ...process.env, TZ }, encoding: 'utf8' });
    assert.equal(child.status, 0); assert.equal(child.stdout, expected);
  }
});
for (const type of ['purchase_request', 'order', 'test']) test(type + ' message contains one safe dual-date block without raw ISO/UTC', () => {
  const message = buildLeadTelegramMessage({ type, customerName: '<b>A&B</b>', createdAt: instant });
  assert.ok(message.text.includes('🕒 <b>زمان ثبت:</b>\n' + expected));
  assert.equal(message.text.match(/زمان ثبت:/g).length, 1);
  assert.ok(!message.text.includes(instant)); assert.ok(!message.text.includes('Z')); assert.ok(!message.text.includes('UTC'));
  assert.ok(message.text.includes('&lt;b&gt;A&amp;B&lt;/b&gt;')); assert.equal(message.parse_mode, 'HTML');
});
test('mocked lead delivery retains its configured destination and localized timestamp', async () => {
  const sent = [];
  const notify = createLeadNotifier({ getSettings: async () => ({ telegramLeadEnabled: true, telegramLeadChatId: '-100123456789', telegramChannel: '@dubaikharid' }),
    env: { VERCEL_ENV: 'production', TELEGRAM_ALLOW_SEND: 'true', TELEGRAM_BOT_TOKEN: 'mock' },
    telegram: { sendLeadGroup: async (id, message) => sent.push({ id, message }) } });
  assert.equal((await notify({ type: 'order', createdAt: instant })).status, 'ACCEPTED');
  assert.equal(sent.length, 1); assert.equal(sent[0].id, '-100123456789');
  assert.ok(sent[0].message.text.includes(expected)); assert.ok(!JSON.stringify(sent).includes('@dubaikharid'));
});
test('localized date block preserves Telegram length bounds for escaped hostile fields', () => {
  const value = '<&"'.repeat(2000);
  const message = buildLeadTelegramMessage({ type: 'order', createdAt: instant,
    customerName: value, phone: value, email: value, product: value, orderId: value,
    estimatedAmount: value, amountAed: value, message: value, source: value,
    productUrl: 'https://example.test/' + 'a'.repeat(570), adminUrl: 'https://example.test/' + 'b'.repeat(570) });
  assert.ok(message.text.length <= 4096);
  assert.ok(message.text.includes(expected));
});
