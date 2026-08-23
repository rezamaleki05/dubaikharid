const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10_000,
    query_timeout: 15_000,
    allowExitOnIdle: true,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const criticalSettingKeys = ['aed_toman_rate', 'commissionPercent', 'shipping_cost_per_kg', 'minWeightClass', 'roundingMethod'];
    const [
      duplicateCustomers,
      ordersWithoutItems,
      invalidOrderTotals,
      orphanIncomePayments,
      shipmentsWithoutOrders,
      invalidWarehouseStock,
      warehouseOverReserved,
      soldLaptopsWithoutSale,
      settings,
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM (SELECT "normalizedPhone" FROM "Customer" WHERE "normalizedPhone" IS NOT NULL GROUP BY "normalizedPhone" HAVING COUNT(*) > 1) duplicates`,
      prisma.order.count({ where: { items: { none: {} } } }),
      prisma.order.count({ where: { OR: [{ totalAed: { lt: 0 } }, { totalToman: { lt: 0 } }] } }),
      prisma.payment.count({ where: { type: 'INCOME', orderId: null } }),
      prisma.shipment.count({ where: { orderId: null } }),
      prisma.warehouseItem.count({ where: { OR: [{ stock: { lt: 0 } }, { reserved: { lt: 0 } }] } }),
      prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "WarehouseItem" WHERE "reserved" > "stock"`,
      prisma.laptop.count({ where: { status: 'SOLD', orderItems: { none: {} } } }),
      prisma.setting.findMany({ where: { key: { in: criticalSettingKeys } }, select: { key: true } }),
    ]);

    const existingSettings = new Set(settings.map(row => row.key));
    const result = {
      duplicateCustomers: duplicateCustomers[0]?.count || 0,
      ordersWithoutItems,
      invalidOrderTotals,
      orphanIncomePayments,
      shipmentsWithoutOrders,
      invalidWarehouseStock,
      warehouseOverReserved: warehouseOverReserved[0]?.count || 0,
      soldLaptopsWithoutSale,
      missingCriticalSettings: criticalSettingKeys.filter(key => !existingSettings.has(key)),
    };

    console.log(JSON.stringify(result, null, 2));
    console.log('Data integrity diagnostics completed. No data was changed.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(error => {
  console.error(`Data integrity diagnostics failed: ${error.message}`);
  process.exitCode = 1;
});
