# Bing and IndexNow operations

Phase 3E starts from Production 2a3027f14b61ea9df98118013255997fdf85edad. No Homepage, GA4, Google Search Console, Merchant Center, Telegram, host-policy or Prisma schema changes. No business rows are required for setup/testing.

## Key and protocol

One public Vercel **Production-only Config** value, `INDEXNOW_KEY`, is required (8–128 hexadecimal characters; generated key is 32 hex characters). It is a verification token, not a private business credential. Do not put unrelated credentials in it. Production must also retain `NEXT_PUBLIC_SITE_URL=https://dubaikharid.shop` and VERCEL_ENV=production.

Verification endpoint: **https://dubaikharid.shop/indexnow.txt**. It returns exactly the configured UTF-8 key with text/plain, nosniff and noindex headers; unsupported hosts, missing/invalid key and preview/dev return 404. The fixed root filename avoids a broad dynamic route intercepting ordinary pages. Every submission includes this exact root-level `keyLocation`; this is the documented alternative-location protocol, covering the host's public URLs. It is not added to sitemap.

Endpoint: `https://api.indexnow.org/indexnow`, POST JSON containing host, key, keyLocation and urlList. HTTP 200 means received, not indexed/ranked; 202 means received with key validation pending. Requests are shared among participating engines. [Official IndexNow protocol](https://www.indexnow.org/documentation).

No public submission endpoint exists. URL input is controlled by authenticated Admin mutations or the operator release tool. The verifier itself only returns the key; reading it never triggers submission.

## Public-only validation

Fixed HTTPS apex origin; exact allowed static landing paths and Product/Laptop/Store/Brand/guide families. Reject WWW, localhost, Preview, credentials, ports, query/hash, malformed/normalized traversal, encoded separators, private paths, arbitrary routes and trailing detail slashes. A mixed invalid batch is rejected in full. Core limit 500; controlled release tool limit 200, with live 200/self-canonical/noindex checks before sending. Dynamic route pattern alone is not proof of publication; automatic snapshots use actual public projections, and operator lists verify HTML.

## Automatic mutation hooks

Authenticated Admin handlers capture public state before persistence and schedule comparison after successful writes via Next `after`. Nothing is sent on normal GET, page render, analytics, login, currency refresh, Telegram-only routes or every DB write. Scheduler, projection and network errors are caught; a failed IndexNow request cannot turn a successful publish into an error response.

- Product create: schedule only its actual canonical ID URL if public projection exists. Main PATCH, pricing, combined configuration/galleries, variants/options/deactivation compare public projections; timestamp-only/internal changes skip. Hiding a Product does not submit its hidden URL.
- Laptop create/PATCH/archive: compare actual available public model groups, not private physical-unit URLs or historical inactive units. Model slug collisions and group quantity/spec changes use the same existing grouping rules. Private serial/cost/notes are not in the selected public projection. Unit ordering is normalized for fingerprint comparison; updatedAt/createdAt are ignored. Only current public groups whose output changed are submitted; no backfill.
- Store create/update: only actual record URL and changed public name/description/image; no-op changes skip.
- Brand create/update: requires real visible Brand and either curated guide or public Product count, matching existing noindex policy. Hidden/empty non-curated Brands do not submit.
- Admin inventory initialization/adjustment: compare parent public Product projection. An internal-only change with identical public output skips; a change to actual customer-visible availability/quantity may submit. No hooks in stock history, inventory configuration with no public output, customer cart/order activity, or internal Settings.

Public snapshots are transient, never stored in DB or sent to IndexNow. Only canonical URLs are transmitted. Lifecycle hooks are unit/mock verified and deployed; no real Product/Laptop was changed solely to exercise them.

## Dedupe, failures and limitations

Remove duplicates inside each batch. A bounded 500-entry per-worker memory cache suppresses accepted URLs for five minutes; an in-flight set coalesces overlapping requests. This is lightweight best-effort dedupe, not a distributed durable queue. Cold starts/other workers may submit the same genuinely changed URL. Failures are not cached as success; a later legitimate change can retry. No automatic full-site retries, scheduled resubmission or durable job infrastructure. Timeout is five seconds, redirects disabled; logs contain only fixed codes/status/count, not key, private records or arbitrary error text.

Capture failure means skip the optional notification, not fail the Admin action. Serverless duration/process failure can lose a notification; sitemap remains the normal crawl-discovery fallback. No guarantee of indexing, ranking, AI citation or delivery exactly once.

## Code-managed content (no guide CMS exists)

Guides are literal versioned entries in `src/lib/commerceGuides.js`, not DB pages. After a reviewed content release is READY, use the explicit release command to select only changed guide entries, live changed Store/Brand profiles or templates, and mapped procedural/About page edits. Unchanged deployments select no URLs. Removed, unlisted or noindex pages are excluded. This command can be called by the owner release workflow; **it is not automatically run on every build/deploy**, and no public-page render sends notifications.

```
# After confirming deployed SHA, provide the same Production key privately to the process.
# Set VERCEL_ENV=production and retain the apex site URL. Do not overwrite .env.local.
node scripts/indexnow-submit.mjs --changed-from <trusted-full-baseline-SHA> --output /tmp/changed-public-urls.json
# Review URL count and category breakdown. Then send once with a new receipt path:
node scripts/indexnow-submit.mjs --urls-file /tmp/changed-public-urls.json --send --receipt /tmp/content-release-indexnow-receipt.json
```

Other intentionally changed static landing pages may be provided in a reviewed `{"urls":[...]}` manifest to the same tool. Do not submit the whole site merely because a dependency/build changed.

## One-time controlled initial submission

```
node scripts/indexnow-submit.mjs --from-sitemap --output /tmp/indexnow-initial-urls.json
# Inspect printed count, breakdown and URLs; stop if unexpectedly large/unsafe.
node scripts/indexnow-submit.mjs --urls-file /tmp/indexnow-initial-urls.json --send --receipt /tmp/indexnow-initial-receipt.json
```

The dry run reads the existing sitemap and validates every live URL without sending IndexNow. No second sitemap. Sending also fetches the public key endpoint and checks exact content before POST. A receipt is reserved using exclusive creation before sending; reusing that receipt path stops accidental repetition. If a request times out, delivery is uncertain: inspect the receipt before any separately reviewed retry. 202 does not justify repeatedly resending the full list.

## Bing account handoff

Prefer existing apex site; never create a duplicate WWW property. Sign in at https://www.bing.com/webmasters/ . If not already present, choose Import from Google Search Console, authorize only required access as owner, select existing verified dubaikharid.shop Domain property and apex site, then confirm import. Do not create a new Google property or change its settings. Confirm https://dubaikharid.shop/sitemap.xml is present; submit once if absent. Record Bing verification method, sitemap status and crawl/index status; newly imported sites can remain pending processing. Import consent/account actions require usable authenticated UI; a blank/inaccessible dashboard is not proof of verification.

Robots should return 200, allow Bingbot/public routes and keep Admin/private paths disallowed. Check existing sitemap, apex canonicals and selected public pages. Do not change host preference, Google/GA settings or submit fake business content. IndexNow setup is independent of Bing UI availability.
