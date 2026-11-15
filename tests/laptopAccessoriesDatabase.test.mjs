import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

const url = process.env.ACCESSORY_TEST_DATABASE_URL;
test('isolated accessory outbox separation, constraints and rollback', { skip: !url }, async () => {
  const parsed = new URL(url);
  assert.ok([
    'ep-divine-band-askp3a2z.c-4.eu-central-1.aws.neon.tech',
    'ep-divine-band-askp3a2z-pooler.c-4.eu-central-1.aws.neon.tech',
  ].includes(parsed.hostname), 'Only the explicitly isolated Preview branch is allowed');
  assert.equal(parsed.pathname, '/neondb');
  const c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20000, query_timeout: 20000 });
  await c.connect();
  const prefix = `qa-accessory-${Date.now()}`;
  const settingsFingerprint = async () => (await c.query('SELECT md5(string_agg(row_to_json(s)::text,\'\' ORDER BY key)) AS hash FROM "Setting" s')).rows[0].hash;
  const before = await settingsFingerprint();
  try {
    await c.query('BEGIN');
    assert.equal((await c.query('SELECT count(*)::int n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')).rows[0].n, 31);
    const setting = (key, value) => c.query('INSERT INTO "Setting" (id,key,value,"updatedAt") VALUES ($1,$2,$3,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value', [prefix + key, key, value]);
    await setting('telegramEnabled', 'true');
    await setting('telegramAutoPublishProducts', 'false');
    await setting('telegramAutoPublishLaptopAccessories', 'false');
    await setting('telegramChannel', '@isolated-preview-no-network');
    const createProduct = async (suffix, accessory) => {
      const id = prefix + suffix;
      await c.query('INSERT INTO "Product" (id,name,"nameFa","nameEn",slug,status,"supplyMode","updatedAt") VALUES ($1,\'Preview\',\'پیش‌نمایش\',\'Preview\',$1,\'hidden\',\'IRAN_STOCK\',now())', [id]);
      if (accessory) await c.query('INSERT INTO "LaptopAccessoryProfile" ("productId","categorySlug","updatedAt") VALUES ($1,\'battery\',now())', [id]);
      return id;
    };
    const publish = id => c.query('UPDATE "Product" SET status=\'active\' WHERE id=$1', [id]);
    const publications = async id => (await c.query('SELECT count(*)::int n FROM "TelegramPublication" WHERE "productId"=$1', [id])).rows[0].n;
    const initiallyOff = await createProduct('-initially-off', true);
    await publish(initiallyOff);
    assert.equal(await publications(initiallyOff), 0, 'Accessory defaults OFF');
    await setting('telegramAutoPublishLaptopAccessories', 'true');
    await publish(initiallyOff);
    assert.equal(await publications(initiallyOff), 0, 'Enabling the flag must not backfill a prior publication');
    const accessory = await createProduct('-accessory', true);
    await publish(accessory);
    assert.equal(await publications(accessory), 1, 'Separate accessory flag enqueues once');
    await c.query('UPDATE "Product" SET description=\'Preview edit\' WHERE id=$1', [accessory]);
    await publish(accessory);
    assert.equal(await publications(accessory), 1, 'Edit and publication replay cannot duplicate');
    const ordinary = await createProduct('-ordinary', false);
    await publish(ordinary);
    assert.equal(await publications(ordinary), 0, 'Accessory flag cannot publish ordinary Product');
    await setting('telegramAutoPublishProducts', 'true');
    await setting('telegramAutoPublishLaptopAccessories', 'false');
    await publish(ordinary);
    assert.equal(await publications(ordinary), 0, 'No historical ordinary Product backfill');
    const freshOrdinary = await createProduct('-ordinary-fresh', false);
    await publish(freshOrdinary);
    assert.equal(await publications(freshOrdinary), 1);
    const off = await createProduct('-off', true);
    await publish(off);
    assert.equal(await publications(off), 0, 'Product flag cannot publish accessory');
    const variant = prefix + '-variant';
    await c.query('INSERT INTO "ProductVariant" (id,"productId","optionSignature","updatedAt") VALUES ($1,$2,\'qa\',now())', [variant, accessory]);
    await c.query('INSERT INTO "LaptopAccessoryOfferDetail" ("variantId",authenticity,condition) VALUES ($1,\'ORIGINAL\',\'USED\')', [variant]);
    const unknown = (await c.query('SELECT "healthPercent","cycleCount" FROM "LaptopAccessoryOfferDetail" WHERE "variantId"=$1', [variant])).rows[0];
    assert.deepEqual(unknown, { healthPercent: null, cycleCount: null });
    await c.query('SAVEPOINT invalid_health');
    await assert.rejects(c.query('UPDATE "LaptopAccessoryOfferDetail" SET "healthPercent"=101 WHERE "variantId"=$1', [variant]), e => e.code === '23514');
    await c.query('ROLLBACK TO SAVEPOINT invalid_health');
    const model = (await c.query('SELECT id FROM "LaptopModel" LIMIT 1')).rows[0].id;
    await c.query('INSERT INTO "LaptopAccessoryCompatibility" ("productId","laptopModelId") VALUES ($1,$2)', [accessory, model]);
    await c.query('SAVEPOINT duplicate_model');
    await assert.rejects(c.query('INSERT INTO "LaptopAccessoryCompatibility" ("productId","laptopModelId") VALUES ($1,$2)', [accessory, model]), e => e.code === '23505');
    await c.query('ROLLBACK TO SAVEPOINT duplicate_model');
  } finally {
    await c.query('ROLLBACK');
    assert.equal(await settingsFingerprint(), before, 'All temporary settings rolled back byte-for-byte');
    assert.equal((await c.query('SELECT count(*)::int n FROM "Product" WHERE id LIKE $1', [prefix + '%'])).rows[0].n, 0);
    await c.end();
  }
});

test('isolated catalog replay preserves all existing system rows', { skip: !url }, async () => {
  assert.match(new URL(url).hostname, /^ep-divine-band-askp3a2z(?:-pooler)?\.c-4\.eu-central-1\.aws\.neon\.tech$/);
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const { PrismaClient } = require('../src/generated/prisma/client.js');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const { configureAccessoryCatalog } = await import('../src/lib/laptopAccessoryCatalogConfig.js');
  const pool = new pg.Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 30000, query_timeout: 30000 });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  const fingerprint = async tx => {
    const hashes = {};
    for (const table of ['CatalogAttribute', 'AttributeOption', 'CategoryAttribute', 'Category', 'Setting']) {
      hashes[table] = await tx.$queryRawUnsafe(`SELECT count(*)::int n,md5(string_agg(row_to_json(t)::text,'' ORDER BY id)) hash FROM "${table}" t`);
    }
    return hashes;
  };
  try {
    await db.$transaction(async tx => {
      const before = await fingerprint(tx);
      await configureAccessoryCatalog(tx, { dryRun: false });
      assert.deepEqual(await fingerprint(tx), before);
      await configureAccessoryCatalog(tx, { dryRun: false });
      assert.deepEqual(await fingerprint(tx), before);
      assert.equal((await tx.setting.findUnique({ where: { key: 'telegramAutoPublishLaptopAccessories' } })).value, 'false');
    }, { isolationLevel: 'Serializable', timeout: 120000, maxWait: 30000 });
  } finally {
    await db.$disconnect();
    await pool.end();
  }
});
