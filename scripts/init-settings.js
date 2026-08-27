require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const missingOnlyDefaults = [
  ['siteName', 'دبی خرید'],
  ['siteUrl', 'dubaikharid.shop'],
  ['siteLogoUrl', '/images/logo dubai kharid.png'],
  ['faviconUrl', '/favicon.ico'],
  ['adminName', 'مدیر سایت'],
  ['adminEmail', 'admin@dubaykharid.ir'],
  ['adminPhone', '021-88001234'],
  ['timezone', 'Asia/Tehran'],
  ['supportPhone', '۰۹۱۷۶۱۶۸۳۸۱'],
  ['supportEmail', 'support@dubaykharid.ir'],
  ['telegramId', '@dubaykharid'],
  ['whatsapp', '+971501234567'],
  ['instagramId', '@dubaykharid'],
  ['dubaiAddress', 'امارات، دبی، بیزینس بی، ساختمان ۱۲ بی اسکور'],
  ['iranAddress', 'شیراز، شهرک گلستان، خیابان گل آرا'],
  ['address', 'دبی، امارات متحده عربی'],
  ['workingHours', 'شنبه تا پنجشنبه ۹ تا ۱۸'],
  ['minOrderAed', '500'],
  ['commissionPercent', '25'],
  ['minWeightClass', '1'],
  ['roundingMethod', 'ceil'],
  ['shippingBaseRate', '1200000'],
  ['shippingPerKg', '350000'],
  ['freeShippingThreshold', '80000000'],
  ['maintenanceMode', 'false'],
  ['allowRegistration', 'true'],
  ['autoNotify', 'true'],
  ['notifyNewOrder', 'true'],
  ['notifyPayment', 'true'],
  ['notifyShipment', 'true'],
  ['aedLastUpdate', 'ثبت نشده'],
  ['aedUpdateMode', 'manual'],
  ['aedAutoUpdate', 'false'],
  ['aedUpdateInterval', '1hr'],
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const result = await prisma.setting.createMany({
      data: missingOnlyDefaults.map(([key, value]) => ({ key, value })),
      skipDuplicates: true,
    });
    console.log(`Settings initialization complete. Added ${result.count} missing keys; existing values were preserved.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
