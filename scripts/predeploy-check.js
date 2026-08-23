const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

loadEnvConfig(process.cwd());

const target = process.env.DEPLOY_ENV || process.env.VERCEL_ENV || 'development';
const production = target === 'production';
const errors = [];
const warnings = [];

function current(name) {
  const raw = process.env[name];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

function requireVariable(name, { minLength = 1 } = {}) {
  const raw = current(name);
  if (!raw) errors.push(`${name} is missing.`);
  else if (raw.length < minLength) errors.push(`${name} must contain at least ${minLength} characters.`);
  return raw;
}

function parseUrl(name, raw, protocols) {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!protocols.includes(parsed.protocol)) errors.push(`${name} uses an unsupported protocol.`);
    return parsed;
  } catch {
    errors.push(`${name} is not a valid absolute URL.`);
    return null;
  }
}

const databaseUrl = requireVariable('DATABASE_URL');
const directUrl = production ? requireVariable('DIRECT_URL') : current('DIRECT_URL');
const nextAuthSecret = requireVariable('NEXTAUTH_SECRET', { minLength: 32 });
const adminSecret = requireVariable('ADMIN_SESSION_SECRET', { minLength: 32 });
const nextAuthUrl = requireVariable('NEXTAUTH_URL');
const siteUrl = requireVariable('NEXT_PUBLIC_SITE_URL');

const database = parseUrl('DATABASE_URL', databaseUrl, ['postgres:', 'postgresql:']);
const direct = parseUrl('DIRECT_URL', directUrl, ['postgres:', 'postgresql:']);
const auth = parseUrl('NEXTAUTH_URL', nextAuthUrl, ['http:', 'https:']);
const site = parseUrl('NEXT_PUBLIC_SITE_URL', siteUrl, ['http:', 'https:']);

if (production && auth?.protocol !== 'https:') errors.push('NEXTAUTH_URL must use HTTPS in production.');
if (production && site?.protocol !== 'https:') errors.push('NEXT_PUBLIC_SITE_URL must use HTTPS in production.');
if (production && site?.hostname.endsWith('.vercel.app')) errors.push('Production canonical URL must not use a vercel.app hostname.');
if (nextAuthSecret && adminSecret && nextAuthSecret === adminSecret) errors.push('NEXTAUTH_SECRET and ADMIN_SESSION_SECRET must be different.');

if (database && !/pooler/i.test(database.hostname)) {
  warnings.push('DATABASE_URL does not look like a Neon pooled endpoint; verify serverless connection limits.');
}
if (database && database.searchParams.get('sslmode') !== 'verify-full') {
  warnings.push('DATABASE_URL should explicitly use sslmode=verify-full after provider compatibility testing.');
}
if (direct && /pooler/i.test(direct.hostname)) {
  errors.push('DIRECT_URL points to a pooled endpoint; use the matching Neon direct endpoint for migrations.');
}
if (direct && direct.searchParams.get('sslmode') !== 'verify-full') {
  warnings.push('DIRECT_URL should explicitly use sslmode=verify-full after provider compatibility testing.');
}

const googleId = current('GOOGLE_CLIENT_ID');
const googleSecret = current('GOOGLE_CLIENT_SECRET');
if (Boolean(googleId) !== Boolean(googleSecret)) errors.push('Configure both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither.');

async function main() {
  if (errors.length) throw new Error(errors.join('\n'));

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10_000,
    query_timeout: 15_000,
    allowExitOnIdle: true,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    await prisma.$queryRaw`SELECT 1`;
    const requiredSettings = ['aed_toman_rate', 'commissionPercent', 'shipping_cost_per_kg', 'minWeightClass', 'roundingMethod'];
    const settingCount = await prisma.setting.count({ where: { key: { in: requiredSettings } } });
    if (settingCount !== requiredSettings.length) {
      errors.push('One or more critical financial Settings are missing. Run the read-only diagnostics for details.');
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  if (warnings.length) warnings.forEach(message => console.warn(`WARNING: ${message}`));
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Predeploy checks passed for ${target}. No data was changed.`);
}

main().catch(error => {
  console.error(`Predeploy check failed:\n${error.message}`);
  process.exitCode = 1;
});
