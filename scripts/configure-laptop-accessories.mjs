import { configureAccessoryCatalog } from "../src/lib/laptopAccessoryCatalogConfig.js";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
// Dry-run is the default and never opens a database connection.
if (!process.argv.includes("--apply")) {
  console.log(JSON.stringify(await configureAccessoryCatalog(null), null, 2));
} else {
  const file = process.argv.find((x) => x.startsWith("--env-file="))?.slice(11);
  const expected = process.argv
    .find((x) => x.startsWith("--expected-host="))
    ?.slice(16);
  const target = process.argv
    .find((x) => x.startsWith("--environment="))
    ?.slice(14);
  if (!file || !expected || !["preview", "production"].includes(target))
    throw Error(
      "Explicit --env-file, --expected-host and --environment are required",
    );
  const vars = parse(readFileSync(file));
  const url = new URL(vars.DIRECT_URL || vars.DATABASE_URL);
  if (url.hostname !== expected || url.pathname != "/neondb")
    throw Error("Database identity mismatch");
  if (
    target === "preview" &&
    url.hostname.startsWith("ep-small-block-as5dj8mo")
  )
    throw Error("Production is forbidden for Preview setup");
  if (
    target === "production" &&
    !url.hostname.startsWith("ep-small-block-as5dj8mo")
  )
    throw Error("Unexpected Production endpoint");
  const { PrismaClient } = await import("../src/generated/prisma/client.js");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: url.href,
    max: 1,
    connectionTimeoutMillis: 30000,
    query_timeout: 60000,
  });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const result = await db.$transaction(
      (tx) => configureAccessoryCatalog(tx, { dryRun: false }),
      { isolationLevel: "Serializable", maxWait: 30000, timeout: 120000 },
    );
    console.log(JSON.stringify(result));
  } finally {
    await db.$disconnect();
    await pool.end();
  }
}
