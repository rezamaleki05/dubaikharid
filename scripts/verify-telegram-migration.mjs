// Explicitly disposable localhost PostgreSQL only. Never loads .env files.
// TELEGRAM_QA_DATABASE_URL=postgresql://qa@127.0.0.1:55449/telegram_forward node scripts/verify-telegram-migration.mjs
import assert from 'node:assert/strict';
import { readdir, mkdtemp, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import pg from 'pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { createPublicationDelivery } from '../src/lib/telegram/delivery.js';
import { TelegramError } from '../src/lib/telegram/domain.js';
const url = new URL(process.env.TELEGRAM_QA_DATABASE_URL || '');
assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && /^\/telegram_\w+$/.test(url.pathname), 'Disposable localhost telegram_* database required');
const adminUrl = new URL(url); adminUrl.pathname = '/postgres';
const admin = new pg.Client({ connectionString: adminUrl.href }); await admin.connect();
// Fails safely if the database exists. No existing database is dropped or reset.
await admin.query(`CREATE DATABASE "${url.pathname.slice(1)}"`); await admin.end();
const sql = new pg.Client({ connectionString: url.href }); await sql.connect();
const migrations = (await readdir('prisma/migrations')).filter(name => /^\d/.test(name)).sort();
const release = migrations.splice(26);
assert.deepEqual(release, ['20261005000100_telegram_publication_foundation', '20261009000100_laptop_model_identity']);
const temporary = await mkdtemp(join(tmpdir(), 'telegram-forward-'));
const migrationPath = join(temporary, 'migrations'); await mkdir(migrationPath);
await copyFile('prisma/migrations/migration_lock.toml', join(migrationPath, 'migration_lock.toml'));
async function copyMigration(name) {
  await mkdir(join(migrationPath, name));
  await copyFile(`prisma/migrations/${name}/migration.sql`, join(migrationPath, name, 'migration.sql'));
}
for (const name of migrations) await copyMigration(name);
const require = createRequire(import.meta.url);
const configPath = join(temporary, 'prisma.config.mjs');
await writeFile(configPath, `import { defineConfig } from ${JSON.stringify(pathToFileURL(require.resolve('prisma/config')).href)}; export default defineConfig({ schema: ${JSON.stringify(join(process.cwd(), 'prisma/schema.prisma'))}, migrations: {path: ${JSON.stringify(migrationPath)}}, datasource: {url: ${JSON.stringify(url.href)}} });`);
function deploy() {
  const result = spawnSync(process.execPath, [join(process.cwd(), 'node_modules/prisma/build/index.js'), 'migrate', 'deploy', '--config', configPath], { encoding: 'utf8', env: {...process.env, DATABASE_URL: url.href, DIRECT_URL: url.href} });
  assert.equal(result.status, 0, result.stderr + result.stdout);
}
deploy();
assert.equal((await sql.query('SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')).rows[0].count, '26');
async function product(id, status = 'hidden') {
  await sql.query('INSERT INTO "Product" (id,name,"nameFa","nameEn",slug,status,"updatedAt") VALUES ($1,$1,$1,$1,$1,$2,NOW())', [id, status]);
}
async function setting(key, value) {
  await sql.query('INSERT INTO "Setting" (id,key,value,"updatedAt") VALUES ($1,$1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2', [key, value]);
}
await product('historic-active', 'active'); await product('historic-hidden');
await setting('supportWhatsapp', '+971527556964'); await setting('aedRate', '20000');
const before = (await sql.query('SELECT * FROM "Setting" ORDER BY key')).rows;
const productsBefore = (await sql.query('SELECT to_jsonb(p) AS data FROM "Product" p ORDER BY id')).rows;
const tables = (await sql.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('Product','_prisma_migrations') ORDER BY tablename")).rows;
async function unrelatedSnapshot() {
  const values = {};
  for (const {tablename} of tables) values[tablename] = (await sql.query(`SELECT to_jsonb(t) AS data FROM "${tablename}" t ORDER BY to_jsonb(t)::text`)).rows;
  return values;
}
const unrelatedBefore = await unrelatedSnapshot();
for (const name of release) await copyMigration(name); deploy();
assert.equal((await sql.query('SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')).rows[0].count, '28');
assert.deepEqual((await sql.query('SELECT to_jsonb(p) - \'telegramFirstPublishedAt\' AS data FROM "Product" p ORDER BY id')).rows, productsBefore);
const unrelatedAfter = await unrelatedSnapshot();
for (const [table, fields] of Object.entries({ Laptop: ['series', 'displayNameFa', 'displayNameEn', 'previousModelSlugs'], LaptopModel: ['series', 'exactModel'] })) {
  for (const {data} of unrelatedAfter[table]) for (const field of fields) { assert.equal(data[field], null); delete data[field]; }
}
assert.deepEqual(unrelatedAfter, unrelatedBefore);
assert.deepEqual((await sql.query('SELECT * FROM "Setting" ORDER BY key')).rows, before);
assert.equal((await sql.query('SELECT count(*) FROM "TelegramPublication"')).rows[0].count, '0');
assert.ok((await sql.query('SELECT "telegramFirstPublishedAt" FROM "Product" WHERE id=$1', ['historic-active'])).rows[0].telegramFirstPublishedAt);
await setting('telegramEnabled', 'true'); await setting('telegramAutoPublishProducts', 'true'); await setting('telegramChannel', '@shoptest');
await sql.query('UPDATE "Product" SET status=$1 WHERE id=$2', ['hidden', 'historic-active']);
await sql.query('UPDATE "Product" SET status=$1 WHERE id=$2', ['active', 'historic-active']);
assert.equal((await sql.query('SELECT count(*) FROM "TelegramPublication"')).rows[0].count, '0');
await sql.query('UPDATE "Product" SET status=$1 WHERE id=$2', ['active', 'historic-hidden']);
await product('new-active', 'active');
await product('concurrent');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href }) });
await Promise.all(Array.from({ length: 12 }, () => db.product.update({ where: { id: 'concurrent' }, data: { status: 'active' } })));
assert.equal(await db.telegramPublication.count(), 3);
await db.product.update({ where: { id: 'concurrent' }, data: { description: 'edited' } });
let calls = 0;
const coordinator = createPublicationDelivery({ db, getConfiguration: async () => ({ code: null, channel: '@shoptest', autoPublish: true }), getProductPost: async () => ({ text: 'mock' }), getClient: () => ({ sendProductPost: async () => { calls++; return { message_id: 1, chat: { id: -1001234 } }; } }) });
await Promise.all(Array.from({ length: 20 }, () => coordinator.deliver('concurrent', { automatic: true })));
assert.equal(calls, 1); assert.equal((await coordinator.read('concurrent')).attemptCount, 1);
await db.product.update({ where: { id: 'concurrent' }, data: { status: 'hidden' } });
await db.product.update({ where: { id: 'concurrent' }, data: { status: 'active' } });
await coordinator.deliver('concurrent', { automatic: true }); assert.equal(calls, 1);
await assert.rejects(coordinator.deliver('concurrent', { expectedAttemptCount: 1 }), { code: 'TELEGRAM_CONFIRM_REQUIRED' });
await coordinator.deliver('concurrent', { expectedAttemptCount: 1, confirmRepost: true }); assert.equal(calls, 2);
const failed = createPublicationDelivery({ db, getConfiguration: async () => ({ code: null, channel: '@shoptest', autoPublish: true }), getProductPost: async () => ({}), getClient: () => ({ sendProductPost: async () => { throw new TelegramError('TELEGRAM_FORBIDDEN'); } }) });
await failed.deliver('new-active', { automatic: true });
assert.equal((await failed.read('new-active')).status, 'FAILED');
assert.equal((await db.product.findUnique({ where: { id: 'new-active' } })).status, 'active');
await coordinator.deliver('new-active', { expectedAttemptCount: 1 }); assert.equal((await coordinator.read('new-active')).status, 'SENT');
await setting('telegramEnabled', 'false'); await product('disabled-active', 'active');
await setting('telegramEnabled', 'true');
await db.product.update({ where: { id: 'disabled-active' }, data: { status: 'hidden' } });
await db.product.update({ where: { id: 'disabled-active' }, data: { status: 'active' } });
assert.equal(await db.telegramPublication.findUnique({ where: { productId: 'disabled-active' } }), null);
await setting('telegramAutoPublishProducts', 'false'); await product('manual-only', 'active');
assert.equal(await db.telegramPublication.findUnique({ where: { productId: 'manual-only' } }), null);
await coordinator.deliver('manual-only'); assert.equal((await coordinator.read('manual-only')).status, 'SENT');
await setting('telegramAutoPublishProducts', 'true');
await sql.query('BEGIN'); await product('rolled-back', 'active'); await sql.query('ROLLBACK');
assert.equal(await db.telegramPublication.findUnique({ where: { productId: 'rolled-back' } }), null);
// Force an outbox storage error without altering or removing its durable data.
await sql.query('ALTER TABLE "TelegramPublication" RENAME TO "TelegramPublication_offline"');
await product('storage-failure', 'active');
assert.equal((await db.product.findUnique({ where: { id: 'storage-failure' } })).status, 'active');
await sql.query('ALTER TABLE "TelegramPublication_offline" RENAME TO "TelegramPublication"');
assert.equal((await sql.query("SELECT count(*) FROM pg_trigger WHERE tgname LIKE 'telegram_%' AND NOT tgisinternal")).rows[0].count, '2');
await db.$disconnect(); await sql.end();
console.log('PASS: normal migrate deploy 26→28; existing Product business fields and every unrelated table unchanged; existing-schema forward migration, historical suppression, first transition, concurrent activation/claim, republish, manual/retry, disabled modes, transaction rollback, outbox storage failure isolation; two triggers present.');
