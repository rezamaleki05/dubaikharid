# Production runbook

## Deployment fails

1. Keep the previous Production deployment serving traffic.
2. Inspect Vercel build/function logs without copying secrets or customer payloads.
3. Check environment scope, Prisma generation, and build output.
4. Fix in a new Preview and promote only after verification.
5. Do not alter the database merely to make a build pass.

## Migration fails

1. Stop rollout. Do not run reset, force-reset, db push, or edit an applied migration.
2. Run `npx prisma migrate status` against the exact target.
3. Inspect failed migration and Neon state.
4. Choose an idempotent forward fix or provider-assisted recovery.
5. Restore only after confirming the recovery point and validating it in isolation.

## Database unavailable

1. Check Neon status, compute state, connection usage, and pooled/direct URL scopes.
2. Check `/api/health` (liveness) and `/api/health/ready` (database readiness).
3. Verify Vercel `fra1` functions can reach Neon `eu-central-1`.
4. Do not serve fabricated orders, prices, payments, or tracking data as fallback.

## Bad release

1. Determine whether the release applied a schema migration.
2. If schema remains backward compatible, use Vercel rollback/promote for the previous artifact.
3. If incompatible, isolate the release and prepare a forward fix; do not blindly roll back code.
4. Run smoke tests and inspect logs after recovery.

## Secret leaked

1. Revoke/rotate at the provider immediately.
2. Update the correctly scoped Vercel variable and redeploy.
3. Rotate database, OAuth, payment, or webhook credentials as applicable.
4. If auth secrets leaked, rotate them and invalidate affected sessions.
5. Remove committed material from Git history through an approved cleanup; `.gitignore` alone is insufficient.
6. Review access logs and record exposure duration.

## Elevated errors or cost

- Check Vercel errors, duration, invocations, and bandwidth.
- Check Neon connections, slow queries, storage, and compute activity.
- Investigate public scraping, search, sitemap traffic, repeated dashboard aggregates, and future uploads.
- Apply WAF/shared rate limiting before raising function/database limits.
- Plain Vercel logs have limited retention/correlation. Evaluate Sentry, Axiom, or a log drain before launch; none is configured today.

Keep operator contacts, provider ownership, deployment IDs, migration names, incident timestamps, and recovery decisions in a private operational system, not this repository.

