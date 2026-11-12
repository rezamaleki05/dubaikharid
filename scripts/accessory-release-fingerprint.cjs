const root = process.cwd();
require(root + "/node_modules/@next/env").loadEnvConfig(root, false, {
  info() {},
  error() {},
});
const { Client } = require("pg");
(async () => {
  const expected = process.argv
    .find((x) => x.startsWith("--expected-host="))
    ?.slice(16);
  if (!expected) throw Error("Pass explicit --expected-host");
  const u = new URL(process.env.DIRECT_URL || process.env.DATABASE_URL);
  if (u.hostname !== expected || u.pathname != "/neondb")
    throw Error("Database identity mismatch");
  u.searchParams.set("options", "-c default_transaction_read_only=on");
  const c = new Client({
    connectionString: u.href,
    connectionTimeoutMillis: 15000,
  });
  try {
    await c.connect();
    await c.query("BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ");
    const result = {
      at: new Date().toISOString(),
      database: "neondb",
      tables: {},
    };
    result.migrations = (
      await c.query(
        `SELECT count(*) FILTER(WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::int applied,count(*) FILTER(WHERE finished_at IS NULL AND rolled_back_at IS NULL)::int failed FROM "_prisma_migrations"`,
      )
    ).rows[0];
    for (const table of [
      "Product",
      "ProductVariant",
      "ProductInventory",
      "Laptop",
      "LaptopModel",
      "Order",
      "OrderItem",
      "Payment",
      "Shipment",
      "TelegramPublication",
      "LaptopTelegramPublication",
      "Brand",
      "Category",
      "Setting",
    ]) {
      result.tables[table] = (
        await c.query(
          `SELECT count(*)::int AS count,md5(coalesce(string_agg(row_hash,'' ORDER BY row_hash),'')) AS fingerprint FROM (SELECT md5(row_to_json(t)::text) AS row_hash FROM "${table}" t) hashes`,
        )
      ).rows[0];
    }
    console.log(JSON.stringify(result, null, 2));
    await c.query("ROLLBACK");
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
