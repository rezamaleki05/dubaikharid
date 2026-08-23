# P0-1 Secret Hygiene Report

Date: 2026-08-22
Status: repository index cleanup complete; external rotations and optional history rewrite remain

## 1. Sensitive tracked files found

- `.env`
- `.env.local`

Both remain present on the local filesystem and are ignored. Neither remains in the current Git index.

No tracked database dump, customer export, private key, certificate, OAuth credential JSON, ZIP backup, or similar sensitive artifact remains in the current index based on filename scanning.

## 2. Generated tracked files found

Initial index audit found:

- `.next/**`: 568 indexed paths at audit time; HEAD contains 821 paths because some generated deletions were already staged.
- `node_modules/**`: 29,520 indexed paths at audit time; HEAD contains 29,517 paths, while three `.DS_Store` paths had separately been staged into the index.
- `.DS_Store`: four indexed paths at audit time; one exists in HEAD and three were index-only additions.

Current index after cleanup:

- `.env` / `.env.local`: 0
- `.next/**`: 0
- `node_modules/**`: 0
- `.DS_Store`: 0

The local `.next` and `node_modules` directories were preserved.

## 3. `.gitignore` changes

Existing rules already covered env files, dependencies, Next output, logs, dumps, ZIPs, coverage, test reports, Vercel metadata, and `.DS_Store` while explicitly allowing `.env.example`.

Added:

- `/dist/`
- `/build/`
- `/.cache/`

## 4. Files removed from the Git index

- `.env`
- `.env.local`
- all `.next/**`
- all `node_modules/**`
- every indexed `.DS_Store`

This used index-only removal. Local copies were not deleted.

There were 17 unrelated staged application/diagnostic changes before or alongside this operation. They were preserved and were not unstaged or altered by this cleanup.

## 5. Secret/config inventory

| Name | Classification | Finding/action |
|---|---|---|
| `DATABASE_URL` | ROTATE REQUIRED | Present by name in tracked env files; rotate Neon credential |
| `DIRECT_URL` | ROTATE/UPDATE WITH DB ROLE | Not found in tracked env names; update if it shares the rotated role |
| `ADMIN_SESSION_SECRET` | ROTATE REQUIRED | Present by name in tracked `.env.local`; invalidates admin sessions |
| `NEXTAUTH_SECRET` | ROTATE REQUIRED | Present by name in tracked env files; invalidates customer sessions |
| `NEXTAUTH_URL` | PUBLIC CONFIG | Re-enter per environment; no secret rotation |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC CONFIG | Only intentional `NEXT_PUBLIC_*` variable |
| `GOOGLE_CLIENT_ID` | OPTIONAL PUBLIC IDENTIFIER | Public client ID literal exists in UI defaults; not a secret |
| `GOOGLE_CLIENT_SECRET` | OPTIONAL / ROTATE IF PREVIOUSLY COMMITTED | Not detected in tracked env-name inventory or source |
| `ADMIN_SEED_EMAIL` | OPTIONAL BOOTSTRAP CONFIG | Remove from runtime after bootstrap |
| `ADMIN_SEED_PASSWORD` | OPTIONAL SECRET | Rotate/delete if a real value was ever shared or committed |
| `DEPLOY_ENV` | OPTIONAL TOOL CONFIG | Non-secret local predeploy override |
| `DEPLOYMENT_URL` | OPTIONAL TOOL CONFIG | Non-secret postdeploy target |
| `ALLOW_DESTRUCTIVE_DEV_SEED` | OPTIONAL SAFETY FLAG | Keep false except for an explicit disposable dev database |
| `VERCEL_ENV` | PLATFORM CONFIG | Supplied by Vercel |
| `NODE_ENV` | PLATFORM CONFIG | Non-secret runtime mode |

No `BLOB_READ_WRITE_TOKEN`, payment private key, or payment webhook secret variable was found.

## 6. Git history exposure

- `.env` history commits: 1
- `.env.local` history commits: 1
- first/latest reachable commit for both: `16f069fc2f7cd7a21ed6d012f86a88c7db840cae`
- `.next` history commits: 1
- `node_modules` history commits: 1
- configured Git remotes: none

The repository is currently local with no configured remote, but past sharing/publication cannot be proven. Treat exposed credentials as compromised.

History rewrite was **not** performed. Force push was **not** performed.

## 7. Repository size impact

- Generated paths in HEAD: approximately 30,338 files / 913 MB.
- Git object storage reported approximately 10.27 GiB loose objects plus 2.59 GiB packed objects at audit time.

Committing index cleanup reduces the current tree, but history stays large. A reviewed `git filter-repo` rewrite would materially reduce history size. The exact safe procedure is documented in `docs/SECRET_ROTATION_AND_GIT_HISTORY_CLEANUP.md`.

## 8. Source secret scan

- No high-confidence private key, common live/test API token, GitHub token, Slack token, Google API key, or hardcoded PostgreSQL connection string was found in application source after excluding generated dependencies, docs, examples, and local env files.
- A Google OAuth client ID literal exists in:
  - `src/context/SiteSettingsContext.js`
  - `src/app/admin/settings/page.js`
  - `admin_original_backup.js`
- Google client IDs are public identifiers; severity is informational. The stale UI default should eventually be removed in favor of actual server configuration.
- Generated Prisma runtime produced pattern false positives and was excluded from the source finding.

## 9. Client exposure

The only `NEXT_PUBLIC_*` name found is `NEXT_PUBLIC_SITE_URL`. It is public canonical configuration and does not contain a secret by design. No sensitive client-prefixed variable was found.

## 10. External rotation checklist

### Neon

1. Create/rotate the database credential.
2. update pooled `DATABASE_URL`;
3. update matching `DIRECT_URL`;
4. keep Production, Preview, and Development separate;
5. redeploy and check health/readiness;
6. revoke the old credential.

### Vercel

Update Production, Preview, and Development scopes independently for database URLs, session secrets, auth URL, canonical site URL, and optional paired Google OAuth values. Do not give Preview the Production database by default.

### Sessions

Rotate `ADMIN_SESSION_SECRET` and `NEXTAUTH_SECRET` to separate high-entropy values. Existing admin/customer sessions will become invalid, which is expected.

### OAuth/storage/payments

- Rotate Google client secret only if external evidence shows it was committed/shared; no such value was detected here.
- No storage token was detected.
- No payment secret was detected.

## 11. Validation results

- `npx prisma validate`: PASS
- `npm run lint`: PASS with 60 existing `next/image` warnings and zero errors
- `npm run build`: PASS
- No Prisma reset, schema mutation, production data mutation, history rewrite, or external credential rotation was performed.

## 12. Remaining P0-1 blockers

1. Rotate exposed Neon/database and session credentials externally.
2. Re-enter correct environment-scoped values in Vercel.
3. Review and commit the staged index removals together with `.gitignore` and `.env.example`.
4. Decide whether the repository was ever shared; if yes, coordinate and execute the documented history rewrite and fresh-clone process.
5. Remove/retain the 17 pre-existing staged files through a separate owner review; they were not part of this cleanup.

Stop point: P0-1 only. Public catalog/database migration was not started.
