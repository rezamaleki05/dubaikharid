# DubaiKharid deployment guide

## Architecture

- Next.js App Router on Vercel with Node.js route handlers.
- Prisma 7 with `@prisma/adapter-pg` and PostgreSQL.
- Neon runtime traffic uses pooled `DATABASE_URL`; Prisma CLI migrations use direct `DIRECT_URL` through `prisma.config.ts`.
- The observed Neon endpoint is in AWS `eu-central-1`; Vercel is pinned to `fra1` in `vercel.json` to reduce database latency.
- Product images are currently URL/data references in PostgreSQL or static assets. Vercel Blob is not installed and no runtime upload-to-disk flow exists.
- There is no configured payment gateway, courier webhook, Apple Sign-In, cron, queue, or external observability service.

## Environment variables

| Variable | Classification | Production | Preview | Development |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Server secret | Neon production pooled URL | Separate preview/staging pooled URL | Local/dev pooled URL |
| `DIRECT_URL` | Server secret | Matching production direct URL; migration runner only | Matching preview direct URL if migrations are tested | Matching dev direct URL |
| `NEXTAUTH_SECRET` | Server secret | Unique production value, 32+ chars | Unique preview value | Unique local value |
| `ADMIN_SESSION_SECRET` | Server secret | Unique production value, 32+ chars | Unique preview value | Unique local value |
| `NEXTAUTH_URL` | Server config | Canonical HTTPS URL | Exact preview URL | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_URL` | Public config | Canonical HTTPS URL | Keep canonical production URL for SEO | Canonical URL or localhost for metadata testing |
| `GOOGLE_CLIENT_ID` | Server config | Optional production OAuth client | Separate preview OAuth client | Local OAuth client |
| `GOOGLE_CLIENT_SECRET` | Server secret | Required only with client ID | Separate preview secret | Local secret |
| `ADMIN_SEED_EMAIL` | One-time server config | Temporary bootstrap only | Separate Preview identity | Local bootstrap only |
| `ADMIN_SEED_PASSWORD` | One-time server secret | Temporary bootstrap only, then remove | Separate Preview value | Local bootstrap only |
| `VERCEL_ENV` | Vercel system config | Injected as `production` | Injected as `preview` | Injected by Vercel tooling |

Only `NEXT_PUBLIC_SITE_URL` is intentionally browser-visible. Never expose database URLs, session secrets, OAuth secrets, payment secrets, or Blob write tokens with a `NEXT_PUBLIC_` prefix.

## Environment separation

Use independent Neon databases or branches:

- `production`: Production Vercel environment only.
- `preview` or `staging`: Vercel Preview, integration tests, and QA.
- `development`: local development.

Preview must never receive Production database URLs, auth secrets, admin credentials, or webhook credentials. Preview responses send `X-Robots-Tag: noindex`, robots disallows crawling, and the sitemap is empty.

## Before deploy

1. Pull the intended commit and review the working tree.
2. Confirm the Vercel target and Neon branch by hostname/database name without printing credentials.
3. Verify Preview and Production variable scopes in Vercel.
4. Confirm Neon backup/PITR availability and create a branch/snapshot before risky migration work.
5. Inspect every pending `prisma/migrations/*/migration.sql` file.
6. Prefer additive, backward-compatible schema changes.
7. Run:

   ```bash
   npm ci
   npx prisma validate
   npx prisma generate
   npx prisma migrate status
   npm run predeploy:check
   npm run data:diagnostics
   npm run lint
   npm run build
   ```

8. Verify OAuth and external service modes. Apple and a real payment gateway are currently disabled/not implemented.
9. Confirm critical Settings have explicitly approved values: AED rate, commission, shipping per kg, minimum weight, and rounding method.

## Migration and release order

Never run `prisma migrate reset`, `prisma migrate dev`, `prisma db push`, or a demo seed against Production.

1. Validate the exact Production target and backup checkpoint.
2. Run `npx prisma migrate status` with Production-scoped credentials.
3. Apply only committed migrations with `npx prisma migrate deploy` from a controlled migration job.
4. Verify migration status and database readiness.
5. Deploy or promote the tested application artifact.
6. Run smoke tests and inspect logs.

Do not run production migrations from Preview builds. Use expand/migrate/contract releases: add compatible schema first, deploy code using it second, and remove legacy schema in a later release.

The historical laptop migration `20260819000100_laptops_database` drops old `stock` and `isActive` columns. Do not edit it if applied. Any environment that has not applied it must be backed up and checked for legacy data before deployment.

## Vercel deployment

Git integration is preferred. A safe custom Preview CI sequence is:

```bash
vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"
vercel deploy --prebuilt --token="$VERCEL_TOKEN"
```

After Preview verification, run the controlled Production migration, then promote the same tested artifact. Pin the Vercel CLI version in CI. Never commit `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID`.

## OAuth, callbacks, payments, and webhooks

- NextAuth callback: `${NEXTAUTH_URL}/api/auth/callback/google`.
- Use separate Google OAuth clients/callbacks for Production and Preview. Google login stays disabled when both Google variables are absent; partial configuration fails validation.
- Apple authentication is not implemented.
- A real payment gateway/webhook is not implemented. Manual payment records are not gateway settlement.
- No courier webhook exists; shipment updates are authenticated admin operations.
- Future webhooks must use a stable HTTPS URL, environment-specific secret, and signature verification.

## Runtime safety and scaling

- Prisma uses one singleton per warm instance, a small pool (`max: 5`), 10-second connection timeout, and 15-second query timeout.
- Use `sslmode=verify-full` on Neon URLs after testing the provider-issued connection strings. The currently configured local URL uses `sslmode=require`, which the installed `pg` version treats as verify-full today but warns will change semantics in a future major release.
- Core order, payment, shipment, inventory, and laptop workflows use Prisma transactions compatible with the PostgreSQL pooled runtime connection.
- Sitemap queries select minimal columns and safely fall back to static entries if the database is unavailable.
- External product extraction has a domain allowlist, SSRF checks, redirect limit, 2 MB limit, and 6-second abort. Anti-bot pages can still make serverless scraping unreliable.
- In-memory rate limits are per instance, not globally authoritative. Add shared Redis/Upstash rate limiting or Vercel WAF rules before high traffic.
- There are no `setInterval` jobs. Future exchange-rate sync/cleanup must use Vercel Cron or Queues.
- Keep financial exports paginated; introduce streaming/background jobs if datasets become large.

## Files, Blob, CORS, and security

- No Vercel Blob package/token is used. There is no persistent runtime filesystem write. Future uploads must be authorized server-side and old Blob deletion must occur only after reference checks.
- Same-origin APIs do not send permissive wildcard CORS headers.
- Production cookies are `Secure`; Production and callbacks must use HTTPS.
- Expected headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and Production HSTS.
- `.env`, `.env.local`, `.next`, dumps, and archives are ignored. If an env file was committed, remove it from the Git index/history through an approved cleanup and rotate affected secrets. Adding `.gitignore` alone is not remediation.
- Never commit `node_modules`, build output, DB dumps, customer exports, certificates, or backup archives.

## Smoke tests

Start with `DEPLOYMENT_URL=https://... npm run postdeploy:check`, then verify:

1. Homepage and Buy From Dubai landing page.
2. Product page and laptop listing/detail.
3. Customer registration/login with dedicated test data.
4. Cart and checkout/order creation with an idempotency key and non-production data.
5. Order tracking.
6. Admin login, Dashboard, Orders, Customers, Payments, Shipments, Warehouse, and Settings.
7. `/robots.txt`, `/sitemap.xml`, `/api/health`, and `/api/health/ready`.
8. Security headers and Vercel error logs.

Never create a real payment or destructive transaction in a Production smoke test.

## Domain strategy

The current canonical host is `https://dubaykharid.ir`. Assign it to the Production Vercel project and verify HTTPS. After ownership is confirmed, configure `www` as a permanent redirect to the canonical non-`www` host in Vercel/DNS. DNS is intentionally not changed by repository code.
