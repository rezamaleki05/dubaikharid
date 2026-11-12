const root = process.cwd();
require(root + "/node_modules/@next/env").loadEnvConfig(root, false, {
  info() {},
  error() {},
});
const { Client } = require("pg");
(async () => {
  const u = new URL(process.env.DIRECT_URL || process.env.DATABASE_URL);
  if (
    !u.hostname.startsWith("ep-small-block-as5dj8mo") ||
    u.pathname != "/neondb"
  )
    throw Error("Unexpected Production endpoint");
  u.searchParams.set("options", "-c default_transaction_read_only=on");
  const c = new Client({
    connectionString: u.href,
    connectionTimeoutMillis: 15000,
  });
  try {
    await c.connect();
    await c.query("BEGIN READ ONLY");
    console.log(
      JSON.stringify(
        (
          await c.query(
            `SELECT current_database() AS database,current_setting('transaction_read_only') AS readonly,(SELECT count(*)::int FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) AS applied,(SELECT count(*)::int FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL) AS failed`,
          )
        ).rows,
      ),
    );
    await c.query("ROLLBACK");
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
