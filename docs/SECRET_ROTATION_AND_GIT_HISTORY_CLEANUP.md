# Secret Rotation and Git History Cleanup

Prepared: 2026-08-22
Scope: P0-1 repository secret hygiene only

## Current evidence

- `.env` and `.env.local` were tracked in commit `16f069fc2f7cd7a21ed6d012f86a88c7db840cae`.
- Each file appears in one commit in the currently reachable local history.
- `.next` and `node_modules` also appear in that commit.
- The current repository has no configured Git remote. This does **not** prove that the commit was never copied, pushed, or shared.
- Removing a secret from the index or rewriting Git history does not make the old credential safe. Rotate credentials first.

## Immediate rotation checklist

### 1. Neon/PostgreSQL

1. In Neon, create a new database role/password or rotate the exposed role credential.
2. Obtain both forms for that new credential:
   - pooled runtime URL for `DATABASE_URL`;
   - matching direct URL for `DIRECT_URL` and migrations.
3. Update Development, Preview, and Production separately. Preview must not silently use Production credentials.
4. Deploy a Preview build and verify `/api/health` and `/api/health/ready`.
5. Run `npx prisma migrate status` against the intended environment; do not reset the database.
6. Deploy Production and repeat health/readiness checks.
7. Revoke the old database role/password only after every runtime and migration runner uses the new credential.

`DATABASE_URL` was present in tracked env files and must be rotated. `DIRECT_URL` was not found in those tracked files, but it must be updated if it uses the same Neon role.

### 2. Session signing secrets

Generate two independent high-entropy values locally, for example:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Assign one to `ADMIN_SESSION_SECRET` and the other to `NEXTAUTH_SECRET`. Do not reuse a value between environments or between admin/customer authentication.

Update Vercel and local secure env storage, then redeploy. Existing admin and customer sessions will become invalid and users must sign in again. The current code verifies tokens with the configured secret on every request and does not require old tokens to remain valid.

### 3. Google OAuth

- A Google client ID literal exists in UI defaults. Client IDs are public identifiers and do not require rotation solely for being visible.
- No Google client secret was found in the tracked env variable-name inventory or source scan.
- If the currently used Google client secret was ever stored in either historical env file outside this reachable history, rotate it in Google Cloud and update `GOOGLE_CLIENT_SECRET`.
- Keep `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` configured together.
- Verify the NextAuth callback URL for each intended environment, commonly `${NEXTAUTH_URL}/api/auth/callback/google`.

### 4. Storage and payments

- No Blob/storage write token variable was found.
- No payment private-key or webhook-secret variable was found.
- If either integration is added later, keep write/private tokens server-only and add placeholder names—not values—to `.env.example`.

### 5. Bootstrap credentials

`ADMIN_SEED_PASSWORD` is optional and server-only. After creating the initial administrator, remove bootstrap credentials from runtime environments. If a real seed password was ever committed or shared, replace it and rotate the corresponding administrator password.

## Vercel environment matrix

| Variable | Production | Preview | Development |
|---|---|---|---|
| `DATABASE_URL` | New pooled production credential | Separate pooled preview credential | Separate dev credential |
| `DIRECT_URL` | Matching direct production credential for migration runner | Matching preview direct credential | Matching dev direct credential |
| `ADMIN_SESSION_SECRET` | New unique secret | Different unique secret | Different local secret |
| `NEXTAUTH_SECRET` | New unique secret | Different unique secret | Different local secret |
| `NEXTAUTH_URL` | Production HTTPS origin | Exact preview/test origin | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_URL` | Canonical production HTTPS origin | Canonical production origin for SEO policy | Local or canonical URL for the intended test |
| `GOOGLE_CLIENT_ID` | Optional production OAuth client | Prefer separate preview OAuth client | Local OAuth client |
| `GOOGLE_CLIENT_SECRET` | Optional paired production secret | Separate preview secret | Local secret |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Remove after controlled bootstrap | Normally absent | Optional only for intentional setup |

Never place database URLs, session secrets, OAuth client secrets, seed passwords, storage tokens, or payment secrets under a `NEXT_PUBLIC_` name.

## Reviewed Git history cleanup procedure

Do not run this procedure until credentials have been rotated and the working tree has been safely preserved. `git filter-repo` rewrites commit IDs and requires coordination with every collaborator.

### A. Prepare safely

1. Make a verified offline backup of the complete repository directory.
2. Store local `.env` and `.env.local` only in an approved secret manager or encrypted backup; never put them in a patch, archive intended for sharing, or commit.
3. Review and preserve all unrelated uncommitted user work.
4. Confirm every collaborator is ready to discard old clones after the rewrite.
5. Install `git-filter-repo` from its trusted upstream/package manager and verify the executable.

### B. Rewrite the local history

From a clean, disposable clone or reviewed backup clone, remove secrets and the large generated trees in one rewrite:

```bash
git filter-repo \
  --path .env \
  --path .env.local \
  --path .next \
  --path node_modules \
  --path .DS_Store \
  --path-glob '*/.DS_Store' \
  --invert-paths \
  --force
```

The generated paths account for roughly 30,338 files and 913 MB in the current HEAD tree, so removing them from history should materially reduce repository size.

### C. Verify the rewrite

```bash
git rev-list --all -- .env .env.local
git rev-list --all -- .next node_modules
git log --all -- .env .env.local
git ls-files .env .env.local
git ls-files '.next/**' 'node_modules/**'
```

All commands above should return no matching path. Also rerun a secret scanner before publishing the rewritten repository.

After verifying the backup and rewrite, local unreachable objects can be pruned:

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

These commands permanently discard local recovery objects; run them only after the rewritten repository and backup have been verified.

### D. Publish only after coordination

The repository currently has no remote configured. If an authoritative remote is later confirmed and the rewrite is approved:

```bash
git push --force --all origin
git push --force --tags origin
```

- Protect/temporarily coordinate branch rules as needed.
- Tell collaborators to make a separate backup of unique work and then fresh-clone the rewritten repository.
- Do not merge histories from an old clone back into the cleaned repository.
- Rotate credentials even if the force push succeeds; forks, caches, CI logs, and old clones may retain the original commit.

## Post-rotation verification

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
npm run predeploy:check
npm run lint
npm run build
DEPLOYMENT_URL=https://YOUR-DEPLOYMENT.example npm run postdeploy:check
```

Do not add real values to source code to satisfy these checks.
