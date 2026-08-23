require('dotenv').config({ path: '.env.local' });

const { hash } = require('bcryptjs');
const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required.');
  }

  if (password.length < 12) {
    throw new Error('ADMIN_SEED_PASSWORD must contain at least 12 characters.');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const existing = await prisma.adminUser.findUnique({ where: { email } });

    if (existing) {
      console.log(`Admin user ${email} already exists; no credentials were changed.`);
      return;
    }

    await prisma.adminUser.create({
      data: {
        email,
        passwordHash: await hash(password, 12),
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    console.log(`Initial SUPER_ADMIN ${email} created.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
