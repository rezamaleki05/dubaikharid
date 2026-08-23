# Database backup and recovery

## Current status

The application uses Neon PostgreSQL. This repository cannot prove which Neon plan, backup retention, point-in-time restore window, or branch protection is enabled. Confirm these in Neon before treating the database as recoverable.

No backup is created automatically by this repository, and no Production data was downloaded during this audit.

## Recommended protection

- Use separate Neon branches/databases for Production, Preview, and Development.
- Enable the available backup/PITR capability for Production and record its retention window.
- Before migrations that drop/rewrite data or add strict constraints, create a named Neon branch/snapshot when available.
- Periodically restore into an isolated staging branch. A backup is not verified until restoration is tested.
- Monitor storage growth, compute availability, active connections, and slow queries.

## Pre-migration checkpoint

1. Confirm the target hostname/database and environment.
2. Confirm backup/PITR coverage and latest recovery point.
3. Create a Neon branch/snapshot when supported.
4. Review SQL for `DROP`, rewrites, `NOT NULL`, unique constraints, and enum changes.
5. Run `npx prisma migrate status`.
6. Apply with `npx prisma migrate deploy` only.
7. Verify migration status, `/api/health/ready`, and critical reads.
8. Deploy/promote compatible application code.

## Optional logical backup

From a trusted operator machine, an encrypted logical backup may be created without committing credentials:

```bash
pg_dump --format=custom --no-owner --no-privileges "$DIRECT_URL" --file=dubai-kharid-YYYYMMDD.dump
```

Store the dump outside Git in encrypted, access-controlled storage with a retention policy. Do not copy Production customer data into developer or Preview environments without an approved data-handling process.

## Restore procedure

1. Stop the affected rollout; keep the last known application deployment available.
2. Restore via Neon PITR/branching when available, or restore a logical dump into a new isolated database.
3. Point a staging deployment at the recovered database.
4. Run migration status, read-only diagnostics, readiness, and critical user-flow tests.
5. Compare schema compatibility with the intended application version.
6. Promote/switch Production only after explicit operator approval.
7. Record recovery point, possible data-loss window, and follow-up work.

Never restore over the only Production database as the first troubleshooting step.

## Rollback model

Prisma cannot safely generate automatic down migrations for every change. Prefer a forward-fix migration. Roll back application code only when the applied schema remains backward compatible. Database restore is an emergency action after impact/recovery analysis, not a routine deploy rollback.

