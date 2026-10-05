# Telegram Product publishing

Phase 2S is implementation and isolated QA only. No Production configuration, migration, or deployment is part of this change.

## Product architecture and trigger

`Product.status === 'active'` is the real public visibility state. Add/edit uses the Product configurator and `/api/admin/products/configuration` or `/api/admin/products/[id]/configuration`; legacy Product POST/PATCH endpoints also support status changes. The configurator saves Product, gallery, active variants and IRAN_STOCK inventory in a serializable transaction. Brand and Category remain existing relations. Laptop Stock is separate and is never enqueued.

Migration `20261005000100_telegram_publication_foundation` adds:

- Nullable `Product.telegramFirstPublishedAt`.
- `TelegramPublicationStatus`: PENDING, SENT, FAILED.
- `TelegramPublication`, its primary key, unique Product ID, `(status, lockedAt)` index and cascading Product foreign key. It contains destination, message/chat IDs, attempts, sanitized error code, lease/claim token, retry time, uncertainty, created/updated/sent timestamps.
- Two PostgreSQL functions and triggers: `telegram_mark_first_publish` and `telegram_enqueue_first_publish`.

The before trigger records the first activation, including creation already active. The after trigger enqueues only that first activation when both enabled settings are true. The publication is part of the Product transaction; no network call occurs there. An exception subtransaction isolates outbox-storage errors from Product publishing. A fixed warning identifies that rare condition; the Admin can manually send the Product later.

Existing active rows receive only the new marker, using their existing `createdAt`. Business fields and `updatedAt` remain unchanged. No existing posts are enqueued. Existing hidden rows get their marker at their next first activation after rollout. Since pre-integration hidden Products have no publication history, their earlier historical visibility cannot be reconstructed. Products first activated while disabled consume their marker and require manual sending later.

The migration is additive, keeps all old columns and does not change existing migrations. The old deployed app can safely stay on its current 26 migrations. During a separately approved rollout, apply migration 27 before switching traffic to this new Prisma client. The old app can also continue running after the additive migration with Telegram settings disabled. The new app must not run against a 26-migration database.

## Delivery and recovery

After the successful Product commit, mutation routes use Next `after()` to process its pending record. An atomic conditional update claims the record using status, attempt count and a random claim token. One record per Product is stronger than Product/channel uniqueness and prevents accidental automatic duplication after channel changes. Edits cannot enqueue a second event; sent/failed events are never automatically retried. Manual requests include the displayed expected attempt count to reject stale repeated clicks.

Automatic attempts recheck enabled/auto settings, environment, destination and current public Product state. Manual sending can create the record for historical Products or Products published while disabled. Attempts increment on claim; retry updates the same row. The Admin action can resume an unclaimed pending event after a process interruption. There is no scheduled queue sweeper in this foundation: operational recovery uses Product edit → Telegram → refresh/retry.

Telegram has no idempotency key on sendMessage/sendPhoto. Exactly-once delivery across a network timeout and process/database failure cannot be guaranteed. Network/5xx/malformed responses and stale claims are **uncertain**, never blindly retried. Claims older than two minutes become FAILED/uncertain on status inspection. Admin must inspect the channel and explicitly acknowledge possible duplication. A previous successful publication always requires confirmation to repost. A stale request cannot reuse an earlier confirmation/attempt number. Success clears uncertainty; a subsequent definite failure preserves prior uncertainty.

A successful Telegram response followed by failed result persistence is also uncertain. If storage remains unavailable, the claim stays pending until the stale-claim recovery path. Product publication is independent in every case. No claim is automatically re-sent while held. Hiding a Product before the final public-data read prevents the send; a hide racing an already issued Telegram request cannot recall it.

## Secret, settings and environment

`TELEGRAM_BOT_TOKEN` exists only in the server environment and server-only client. No token field is accepted by Settings; no token is returned, stored, logged or rendered. Telegram response descriptions and transport errors are discarded. Only allowlisted error codes are stored; the API maps them to safe Persian messages. Do not enable HTTP request tracing that records Telegram URLs, because Telegram embeds tokens in its API path.

Three nonsecret generic Settings use the existing protected Settings validation/update/audit path: `telegramEnabled` (default false), `telegramAutoPublishProducts` (default false), and `telegramChannel` (default empty). The dedicated Save sends only these three keys. Contact settings, AED configuration, and `supportWhatsapp` are independent. Channels accept a normalized lowercase `@username` or a negative numeric chat ID. Telegram settings are excluded from public Settings API keys.

Exact environment behavior:

| Environment | Sending rule |
| --- | --- |
| Any | `TELEGRAM_ALLOW_SEND=false` blocks all Telegram calls, including tests. |
| `VERCEL_ENV=production` | Enabled setting, server token and valid stored channel required. The allow variable may be absent or `true`; explicit `false` is the kill switch. Auto sending additionally requires the auto setting. |
| Preview/development/unset | Blocked by default, even if `NODE_ENV=production`. Both `TELEGRAM_ALLOW_SEND=true` and valid `TELEGRAM_TEST_CHANNEL` are required. All calls use the test channel, never the inherited stored Production channel. Use a separate test bot token. |

In an explicitly enabled isolated environment, set the stored channel to the same test channel for automatic events. A destination mismatch marks the event failed and requires a manual send. Never share a Production database with a writable Preview; the send guard does not isolate database writes.

## Message and client

The generator reuses public catalog selection/serialization, `publicProductCardPriceSummary`, and the gallery primary-image resolver. Variant availability and EXTERNAL_DUBAI/IRAN_STOCK pricing follow the website. Public minimum price uses “از” when prices vary; absent/unconfigured pricing uses the Product-page price prompt, never internal costs. The Persian message includes name, optional brand, price, supply mode, short description and an inline “مشاهده محصول” CTA.

The canonical id route is shared with SEO through `productPath`, using `https://www.dubaikharid.shop/product/{id}`. Slug aliases and Laptop canonicals remain unchanged. User text is stripped of HTML markup, grapheme-truncated, then HTML-escaped; bounded fields keep parsed captions below 1024 UTF-16 units. Primary HTTPS photos are preferred; absent, SVG or unusable images use text. Only a definite Telegram rejection permits one photo→text fallback; timeouts, rate limits, auth and 5xx errors do not.

Settings view/edit and Product view/edit use existing Admin RBAC. Connection testing performs getMe/getChat/getChatMember only; it checks bot membership and channel posting permission without publishing. The separately confirmed test-message action sends the fixed “DubaiKharid Telegram Test” label. Tests are never run automatically. Product manual send/retry/repost requires PRODUCTS_EDIT; tests/settings changes require SETTINGS_EDIT.

## Owner steps for a later controlled live rollout

1. Review this branch and approve a separate rollout. Keep Production unchanged until then.
2. Create a bot through BotFather and add it as channel administrator with posting permission. Store its token only in the server's Production secret configuration, never in Settings or chat.
3. Rehearse migration/build on an isolated database. For optional Preview live QA use an independent test bot, test channel and database, with both explicit environment guard variables above.
4. Back up the Production database, apply the additive migration through the normal controlled migration process, then deploy the reviewed commit. Leave Telegram Settings disabled during the switch. No seed is needed.
5. Set `VERCEL_ENV=production` through Vercel's normal runtime environment, configure the server token, and remove the `TELEGRAM_ALLOW_SEND=false` kill switch or set it to `true` in that approved deployment.
6. In Admin → Settings → Telegram, save the intended channel and enable Telegram with automatic publishing still off. Run “بررسی اتصال”. Optionally click and confirm the separate test message; remove that test post manually from the channel.
7. Manually send one agreed Product, verify photo/text, Persian price and canonical button in the real channel, then enable automatic Product publishing if desired.
8. Publish one new Product and verify SENT with one attempt. Monitor failed/pending Product states. For uncertain delivery inspect the channel before explicitly resending. Existing Products are never bulk backfilled.

## Repeatable QA

Normal automated tests make no live Telegram requests:

```sh
node --test tests/telegramPublishing.test.mjs
node --test tests/*.test.mjs
```

`scripts/verify-telegram-migration.mjs` requires `TELEGRAM_QA_DATABASE_URL` pointing to localhost and a new database named `telegram_*`. It refuses existing databases and never loads `.env`. It uses the normal Prisma migrate-deploy path to apply the 26-migration baseline, adds synthetic existing rows, then applies only migration 27. It compares every existing Product field and every unrelated table before/after, and checks triggers, concurrent publish/delivery claims, retries, transaction rollback, unchanged unrelated settings and outbox-storage failure isolation. It uses the real PostgreSQL server and generated Prisma client but a mocked Telegram client. No Production URLs or credentials belong in QA commands.

Fresh replay uses Prisma `migrate deploy` against a second empty disposable database. Drift checks use `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` for both databases; triggers/functions are checked separately because Prisma drift does not model them.

## Final Phase 2S verification record

- Focused Telegram suite: **16/16 passed**; affected Product/Admin/catalog/commerce suites: **204/204 passed**; full suite: **429/429 passed**.
- Prisma validate/generate: passed. Fresh database: all **27 migrations** applied. Baseline upgrade: normal `prisma migrate deploy` **26 → 27**, with existing Product business data and all unrelated tables unchanged. Both schema comparisons: **zero drift**. Both custom triggers checked separately.
- Real PostgreSQL concurrency: 12 concurrent activations and 20 competing delivery claims yielded one automatic post. Integration storage and mocked network failures left Products active.
- Local authenticated HTTP QA: first publish, edit, republish, manual send, retry, stale/uncertain confirmation, sanitized 400/401/403/429/503/network/malformed failures and anonymous 401 checks passed with intercepted Telegram transport.
- Browser QA: Settings and Product panel at **1280, 1440, 390, 430, 768px**, light/dark themes, no horizontal overflow. Not sent/Pending/Sent/Failed states inspected; inline confirmation/cancel and uncertain acknowledgement verified; mocked connection and explicit test-message success verified. No browser-native confirmation remains in these components.
- Production build and integrated TypeScript: passed. Full lint: **0 errors, 50 existing warnings**, none from new Telegram files. `git diff --check`: passed.
- No live Telegram request or Production credential was used. No Production DB, migration, seed, environment, deployment, or main-branch change was performed. Temporary transport mocks, local auth credentials, databases and UI fixtures are outside the repository and are not deployed.
- Real bot/channel permission and live delivery remain owner configuration checks, not results of mocked QA. The recovery model deliberately requires Admin action for failed or uncertain delivery; there is no autonomous queue sweeper.
