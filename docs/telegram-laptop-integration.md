# Telegram + Laptop integration release candidate

Base: `9422d4f8ee004da3c5f2b45b34ceb264a8b032a4`.
Sources: Telegram `a1c3bf2c90752e9ec0593797c441dd08f09db923`, then Laptop `3e5cf064bca64abec3dcd4bc7389a0a7cbbbe174`.

The only cherry-pick conflict was the final migration-order assertion in `tests/schemaDriftReconciliation.test.mjs`. It now requires both release migrations in timestamp order. Neither migration was edited. The two localhost-only migration QA helpers now verify the combined release, including the nullable Laptop additions when comparing old rows.

## Migration and deployment boundary

The chain contains 28 migrations: the existing 26, `20261005000100_telegram_publication_foundation`, then `20261009000100_laptop_model_identity`. Apply both through normal migration deployment before switching to the new application in a separately approved rollout. No seed is needed.

Laptop adds nullable `series`, `displayNameFa`, `displayNameEn`, `previousModelSlugs`; LaptopModel adds nullable `series`, `exactModel`. No legacy identities are guessed or rewritten.

Telegram adds its durable publication table, enum, indexes/foreign key, Product first-publication marker, and two trigger functions/triggers. Existing active Products receive only the new marker from their original creation date. No historical publication rows are enqueued and old business fields/updatedAt remain unchanged. Existing hidden Products have no reconstructable historical visibility; their next first activation follows the approved Phase 2S behavior. There is no bulk backfill.

The old app remains compatible with the additive schema when Telegram is disabled. The combined new app requires all 28 migrations.

## Inert rollout configuration

- `telegramEnabled` and `telegramAutoPublishProducts` default to false.
- `TELEGRAM_ALLOW_SEND=false` blocks all Telegram calls, including explicit tests.
- A bot token is not required for builds or an inert deployment.
- No connection test or test message runs automatically.
- Enabling real delivery requires a separate owner-approved configuration and live bot/channel permission check.
- Failed/uncertain delivery requires Admin recovery; no autonomous queue sweeper is introduced.

## Integration verification

Disposable PostgreSQL only: fresh 28-migration replay and baseline 26→28 upgrade passed with zero Prisma drift. Both Telegram triggers and functions were checked separately. Snapshot comparisons preserve all existing Product, Laptop, Order, Warehouse and unrelated business data. Existing active Products have zero publication backfill; legacy Dell/Precision keeps null new identity fields.

Real database tests with a mocked Telegram client cover first publish, 12 concurrent activations, 20 concurrent delivery claims, duplicate suppression, explicit repost, manual retry, disabled modes, transaction rollback, and outbox/network failure isolation. No real Telegram or external Blob request was made.

Protected local HTTP checks cover Dell Precision 5570, MSI without Series, Lenovo ThinkPad P53, legacy Dell/Precision, gallery/primary ordering, status/availability, hardware tests, accessories, arrival date and internal SKU. Dell 5520/5570/7550 remain distinct; public pages, canonical/search/sitemap and an unambiguous 308 redirect pass.

Browser smoke matrix: light/dark at 1440px and 390px for Settings → Telegram, Product → Telegram panel, Add/Edit Laptop, public Product, Laptop Stock, exact Laptop group and legacy group. No document horizontal overflow. UI remains in the existing design system.

Final suites: Telegram 16, Laptop/SEO 76, affected Product/Admin/catalog/commerce 267, full suite 466 passing. Prisma validation/generation, production build with integrated TypeScript, and diff checks pass. Lint has zero errors and 50 existing warnings. QA runs use an empty Telegram token, explicit send kill switch, and localhost database overrides. Production data, credentials, environment, deployment, main and source feature branches are outside this integration's mutations.
