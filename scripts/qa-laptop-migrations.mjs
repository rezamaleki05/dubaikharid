// Disposable localhost databases only. Never loads application .env files.
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
const require = createRequire(import.meta.url);
const root = process.cwd();
const base = process.env.LAPTOP_QA_DATABASE_URL;
if (!base) throw new Error('Set LAPTOP_QA_DATABASE_URL to a disposable localhost PostgreSQL database.');
const parsed = new URL(base);
assert.ok(['127.0.0.1', 'localhost'].includes(parsed.hostname));
assert.match(parsed.pathname, /^\/laptop_[a-z0-9_]+$/);
const migration = '20261009000100_laptop_model_identity';
const temp = mkdtempSync(join(tmpdir(), 'laptop-migrations-'));
const all = readdirSync(join(root, 'prisma/migrations')).filter(name => /^\d/.test(name)).sort();
const release = ['20261005000100_telegram_publication_foundation', migration];
assert.equal(all.length, 28);
assert.deepEqual(all.slice(26), release);
const env = url => ({ ...process.env, DATABASE_URL: url, DIRECT_URL: url });
function prisma(args, url) {
  const result = spawnSync(process.execPath, [join(root, 'node_modules/prisma/build/index.js'), ...args], { cwd: root, env: env(url), encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  console.log(result.stdout.trim());
}
async function connect(url) { const client = new pg.Client({ connectionString: url }); await client.connect(); return client; }
async function snapshot(client) {
  const tables = (await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations' ORDER BY tablename`)).rows;
  const result = {};
  for (const { tablename } of tables) result[tablename] = (await client.query(`SELECT to_jsonb(t) AS row FROM "${tablename.replaceAll('"','""')}" t ORDER BY to_jsonb(t)::text`)).rows.map(({ row }) => row);
  return result;
}
const adminUrl = new URL(base); adminUrl.pathname = '/postgres';
const admin = await connect(adminUrl.toString());
try {
  for (const suffix of ['fresh', 'forward']) {
    const url = new URL(base); url.pathname += `_${suffix}`;
    const dbName = url.pathname.slice(1);
    // CREATE intentionally fails if the named database already exists.
    await admin.query(`CREATE DATABASE "${dbName}"`);
    if (suffix === 'fresh') {
      prisma(['migrate', 'deploy'], url.toString());
    } else {
      const chain = join(temp, 'migrations'); mkdirSync(chain);
      cpSync(join(root, 'prisma/migrations/migration_lock.toml'), join(chain, 'migration_lock.toml'));
      for (const name of all.slice(0, 26)) cpSync(join(root, 'prisma/migrations', name), join(chain, name), { recursive: true });
      const config = join(temp, 'prisma.config.mjs');
      writeFileSync(config, `import { defineConfig } from ${JSON.stringify(pathToFileURL(require.resolve('prisma/config')).href)}; export default defineConfig({schema:${JSON.stringify(join(root,'prisma/schema.prisma'))},migrations:{path:${JSON.stringify(chain)}},datasource:{url:process.env.DIRECT_URL}});`);
      prisma(['migrate', 'deploy', '--config', config], url.toString());
      const client = await connect(url.toString());
      try {
        await client.query(`INSERT INTO "Laptop" (id,name,brand,model,cpu,ram,storage,screen,"priceToman","updatedAt") VALUES ('qa-legacy','لپ‌تاپ استوک Dell مدل Precision','Dell','Precision','Intel Core i7','32','512 GB SSD','15.6',48000000,NOW())`);
        await client.query(`INSERT INTO "Product" (id,name,"nameFa","nameEn",slug,"updatedAt") VALUES ('qa-product','QA','QA','QA','qa-product',NOW())`);
        await client.query(`INSERT INTO "Order" (id,"orderCode","customerNameSnapshot","customerPhoneSnapshot",status,"totalToman","updatedAt") VALUES ('qa-order','QA-ORDER','QA','000','pending',100,NOW())`);
        await client.query(`INSERT INTO "WarehouseItem" (id,name,price,stock,"updatedAt") VALUES ('qa-warehouse','QA',100,2,NOW())`);
        const before = await snapshot(client);
        for (const name of release) cpSync(join(root, 'prisma/migrations', name), join(chain, name), { recursive: true });
        prisma(['migrate', 'deploy', '--config', config], url.toString());
        const after = await snapshot(client);
        assert.deepEqual(after.TelegramPublication, []); delete after.TelegramPublication;
        for (const row of after.Product) {
          assert.equal(row.telegramFirstPublishedAt, row.status === 'active' ? row.createdAt : null);
          delete row.telegramFirstPublishedAt;
        }
        for (const row of after.Laptop) for (const field of ['series','displayNameFa','displayNameEn','previousModelSlugs']) { assert.equal(row[field], null); delete row[field]; }
        for (const row of after.LaptopModel) for (const field of ['series','exactModel']) { assert.equal(row[field], null); delete row[field]; }
        assert.deepEqual(after, before);
        console.log('Forward snapshot: all existing business fields unchanged; Laptop additions NULL; historical Products not enqueued.');
      } finally { await client.end(); }
    }
    const audit = await connect(url.toString());
    try {
      assert.equal(Number((await audit.query('SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')).rows[0].count), 28);
      assert.deepEqual((await audit.query("SELECT tgname FROM pg_trigger WHERE tgname LIKE 'telegram_%' AND NOT tgisinternal ORDER BY tgname")).rows.map(row => row.tgname), ['telegram_enqueue_first_publish', 'telegram_mark_first_publish']);
      assert.deepEqual((await audit.query("SELECT proname FROM pg_proc WHERE proname LIKE 'telegram_%' ORDER BY proname")).rows.map(row => row.proname), ['telegram_enqueue_first_publish', 'telegram_mark_first_publish']);
    } finally { await audit.end(); }
    prisma(['migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code'], url.toString());
    console.log(`${suffix.toUpperCase()}: PASS / ZERO DRIFT (${dbName})`);
  }
} finally { await admin.end(); }
