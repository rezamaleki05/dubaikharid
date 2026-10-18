# Phase 2Z — Laptop Stock

## Release boundary

Base: `9359fef75ccd7ac414ac76a50ec6675ef567f875`, confirmed on the READY Vercel Production deployment `dpl_J86EKXCt67QrmhEs1pvjCug8Nxhw` before branching. Branch: `codex/laptop-stock-complete-fix`. Main is not the release base.

No Production deploy, migration, data write, environment edit, or Telegram send belongs to this phase. The retained hidden Product QA artifact from Phase 2Y is outside this work.

## Audit and root causes

- `ProductSlider` hardcoded `/product/${id}` for homepage Laptop units. `/stock-laptops` used model-group `/laptops/${slug}` links. The Product client fetched Laptop data first, creating a second detail implementation. The Product SEO resolver already prioritizes actual Products, so the new server-side Laptop redirect cannot hijack a normal Product ID.
- The canonical Laptop page used only `group.image`; unit cards also used one `<img>`. The Product-style fallback likewise rendered a single image for non-catalog items. The dedicated Laptop upload component already uploaded each file, persisted an ordered JSON URL array, and moved the cover to index zero. The API did not discard the array. No duplicate image table or storage architecture was needed.
- `displayNameFa`, `displayNameEn`, Series/Exact Model and previous-slug history already existed. These are retained. Known Persian identity suggestions are improved without overwriting tracked manual names.
- Existing `screen` is screen size. No structured touchscreen or display-resolution field existed. Nullable additions preserve unknown historical values.
- TelegramPublication has a required Product foreign key. Product-only first-publication triggers and delivery explain why Laptop changes produced no intent. A separate LaptopTelegramPublication preserves ownership and leaves Product/Lead delivery unchanged.

## Implementation

All catalog links use `laptopPath`, generated from identity or the resolved collision-safe model slug. Legacy `/product/{LaptopId}` and unambiguous previous model slugs return 308. Only eligible AVAILABLE, priced, unarchived, unreserved units enter public model groups.

One Laptop route renders bilingual identity, one H1, price/availability, populated specs, and an image DTO gallery. The reused gallery contains no entity persistence or ProductVariant logic. JSON images keep their Admin order; the canonical cover drives cards, SEO and Laptop Telegram. One-image layouts omit the thumbnail strip.

Laptop canonical and structured-data URLs explicitly use `https://www.dubaikharid.shop/laptops/{slug}`. Public eligible groups are index/follow; missing, hidden and unavailable identities are not exposed as indexable pages. Metadata and descriptions use stored values. No reviews, ratings, GTIN or MPN are invented. AggregateOffer prices use IRR (Toman × 10); public and Telegram prices remain the stored Toman amount.

`isTouchscreen Boolean?` and `displayResolution String?` are validated and round-trip through Admin and public DTOs. The control is unknown/yes/no; resolution is independent of screen size. No existing value is backfilled.

## Telegram semantics

- `telegramAutoPublishLaptops` defaults false and is separate from Product auto-publishing. It reads only the catalog `telegramChannel`; Lead destinations are never read.
- Migration 30 adds an isolated outbox with PENDING/SENT/FAILED state, claim token, lease, attempt count, retry-after and uncertain-delivery flags.
- New eligible first-publication intents are recorded transactionally by exception-isolated SQL triggers. A publication marker prevents edits, availability toggles, image/price/spec changes from reposting. Only units created after migration 30 completed are eligible for automatic intent creation; historical units remain manually sendable without fabricated sent state.
- The delivery worker atomically claims a pending attempt, rechecks public eligibility, and will not automatically replay stale/uncertain claims. Manual retries/reposts require current attempt counts and explicit confirmation where delivery may have happened.
- Laptop save commits independently of network delivery; scheduling and transport failures are isolated. No periodic historical sweep is introduced.
- The message uses bilingual names, optional known specs, canonical cover, canonical URL and the same stored Toman selling price. No independent AED conversion.

## Validation and reproduction

- Unit/regression suite: `node --test tests/*.test.mjs`.
- Database trigger integration: `LAPTOP_TEST_DATABASE_URL=postgresql://...@127.0.0.1:55454/phase2z_forward node --test tests/laptopPublicationDatabase.test.mjs`. The test rejects remote databases and rolls back the whole test transaction.
- Local HTTP integration: `LAPTOP_HTTP_TEST_ORIGIN=http://localhost:3108 node --test tests/laptopHttp.test.mjs`, using the isolated representative fixtures.
- Reproducible migration harness: `LAPTOP_QA_DATABASE_URL=postgresql://...@127.0.0.1:55454/laptop_unique_name node scripts/qa-laptop-stock-complete.mjs`. Never point it at Production. Fresh and forward database names must not exist beforehand.
- An additional isolated rehearsal restored the retained pre-release backup into a 29-migration local DB, applied 30, compared all 33 business-table fingerprints, checked historical NULL additions, and confirmed zero Prisma drift.
- Browser QA uses synthetic local 5530 and 7510 fixtures and four temporary, explicitly labelled gallery illustrations, never Production data. Tested desktop/mobile widths 1440/768/430/390, light/dark, bilingual SEO, thumbnails, selected-image lightbox navigation and Admin field/cover/order save/reopen. Upload validation and mock storage/Telegram transports are exercised by the existing and new test suites. No live Production Blob upload is part of this phase.

Migration: `20261018000100_laptop_stock_complete`. Apply only during a separately approved rollout, before deploying this code. Production remains at 29 until that approval.
