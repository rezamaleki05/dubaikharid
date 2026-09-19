import dotenv from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  databaseEndpointIdentity,
  installStandardCatalogPresets,
} from '../src/lib/standardCatalogPresetService.js';

function usage() {
  return [
    'Usage:',
    '  npm run seed:catalog-presets -- --dry-run --expect-db-endpoint=<endpoint> [--env-file=<path>]',
    '  npm run seed:catalog-presets -- --apply --expect-db-endpoint=<endpoint> [--env-file=<path>]',
  ].join('\n');
}

function parseArguments(argv) {
  const result = { apply: false, dryRun: false, envFile: '.env.local', expectedEndpoint: '' };
  for (const argument of argv) {
    if (argument === '--apply') result.apply = true;
    else if (argument === '--dry-run') result.dryRun = true;
    else if (argument.startsWith('--env-file=')) result.envFile = argument.slice('--env-file='.length);
    else if (argument.startsWith('--expect-db-endpoint=')) {
      result.expectedEndpoint = argument.slice('--expect-db-endpoint='.length);
    } else if (argument === '--help' || argument === '-h') {
      result.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}\n${usage()}`);
    }
  }
  if (result.help) return result;
  if (result.apply === result.dryRun) {
    throw new Error(`Choose exactly one of --apply or --dry-run.\n${usage()}`);
  }
  if (!/^ep-[a-z0-9-]+$/i.test(result.expectedEndpoint)) {
    throw new Error(`--expect-db-endpoint is required and must be an endpoint identity.\n${usage()}`);
  }
  return result;
}

function publicReport(endpoint, result) {
  return {
    endpoint,
    dryRun: result.dryRun,
    created: result.created,
    preflight: {
      willCreate: result.preflight.willCreate,
      willReuse: result.preflight.willReuse,
      preservedConflicts: result.preflight.preservedConflicts,
      conflicts: result.preflight.conflicts,
    },
    ...(result.final ? {
      final: {
        willCreate: result.final.willCreate,
        willReuse: result.final.willReuse,
        preservedConflicts: result.final.preservedConflicts,
        conflicts: result.final.conflicts,
      },
    } : {}),
  };
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  dotenv.config({ path: args.envFile });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const endpoint = databaseEndpointIdentity(process.env.DATABASE_URL);
  if (endpoint !== args.expectedEndpoint) {
    throw new Error(`Database endpoint mismatch: expected ${args.expectedEndpoint}, received ${endpoint}.`);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    query_timeout: 30_000,
    allowExitOnIdle: true,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const result = await installStandardCatalogPresets(prisma, { dryRun: args.dryRun });
    console.log(JSON.stringify(publicReport(endpoint, result), null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(error => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
