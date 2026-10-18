# Phase3A — Official Brand source and exact Product URL

Base: verified READY Production deployment `dpl_22s6mF2RVCJnZtbtwp2MwyFU7rHa`, SHA `1778697bcccf830869152eeb95d9f4c56d6cc983`. Branch: `codex/fix-official-brand-source-product-url`. Main is not the release baseline.

## Audit and root cause

Brand homepage already lives in `Brand.url`. Product source reference already lives in `Product.originalLink`; `Product.sourceUrlKey` is a globally unique canonical deduplication key. Store selection uses `Product.storeId` and `Store.url` as fallback. Source mode is an existing editor concept inferred from Store ID / original link, not a Prisma source-type column.

The editor's Official Brand branch had no editable exact-link input and always submitted the selected Brand homepage as `originalLink`. Thus a second Product from the same Brand tried to claim the same globally unique source key. Configuration save mapped this Product URL unique violation to a generic “Product or variant duplicate” error. Prisma7 PostgreSQL adapter constraint fields are nested under `meta.driverAdapterError.cause.constraint.fields`, which the old target-only error mapping did not read.

Real variant identity is unchanged: `buildProductVariantSignature` sorts attributeCode/optionCode pairs; the DB uniquely constrains `(productId,optionSignature)`. Source type, homepage and source URL never belonged to this signature. This fix does not relax true variant uniqueness.

## Final behavior

- The Official Brand editor displays an independently editable Persian/English Exact Product URL field, with the Brand homepage as read-only context.
- Exact input takes precedence. The existing fallback representation is retained when exact input is blank: Official Brand saves the homepage reference so existing source-mode inference/public link behavior works without a new schema column. On reopen a recognized Brand-homepage reference displays an empty exact field, not a fabricated Product-specific link.
- Recognized Brand/Store homepage references get a NULL sourceUrlKey because they are shared fallbacks. Real exact listing URLs retain global Product deduplication. No existing rows are bulk rewritten or backfilled.
- `originalLink` stores the safe parsed URL including its path, meaningful query ordering/parameters and fragment. Existing dedupe canonicalization remains on `sourceUrlKey` (tracking removal/query sorting), independently of the displayed/persisted reference.
- Partial legacy CRUD and full configuration transactions both apply shared source-key preparation. A source metadata change does not replace existing variant IDs or touch their option signatures.
- Source switching retains the exact URL, clears incompatible Store ownership when switching to Brand, and never changes variant selections. None mode still clears sourcing references as before.
- Safe HTTP/HTTPS URL validation rejects credentials, obvious invalid/private destinations and unsafe schemes as before. Official-domain/subdomain comparison is a warning, not a fragile country-domain block.
- Product URL collisions receive a Product source URL error. SKU and Product identity errors remain distinct; actual duplicate combinations remain rejected.
- External source links were already intentionally customer-visible. No new public source exposure was introduced. Canonical/OG/schema/sitemap/Telegram CTA remain first-party DubaiKharid URLs.

No migration is needed. Schema and all30 migration files are unchanged. Laptop, Product/Lead Telegram transports, pricing, image gallery and inventory algorithms are unchanged.

## Validation

`node --test tests/productSourceMetadata.test.mjs` covers exact path/query/SKU preservation, fallback, official/store/none transitions, domain warnings, invalid URLs, four store families and unchanged variant signatures.

`tests/productSourceRoundTrip.test.mjs` is opt-in real local HTTP/database integration. It requires a **disposable** `phase3a_local` DB on `127.0.0.1:55455` and a local app at `http://localhost:3109`, with only synthetic fixtures. It truncates local Product fixture data and refuses other hosts/ports/database names. Never point it at shared or Production data.

The integration uses synthetic Adidas/Brand homepage and Galaxy6 with Black/White ×41/42, inventory, shared/color images and a mock persisted SENT publication. It exercises authenticated API create/read/edit, source switches with stable IDs, identical galleries/inventory/pricing/Telegram state, shared-homepage saves, exact URL conflicts, real duplicate variants, invalid URLs, legacy CRUD and actual public metadata output. No Telegram transport or real Blob upload is used.

Browser QA used the same isolated fixture through normal Admin login: exact Adidas URL save/reopen and Official→Store→Official save/reopen, then desktop1440/tablet768/mobile390 visual inspection. Temporary QA illustrations are removed before commit. The local server and database are stopped and removed after validation.

Production database/data/settings/environment/main are outside this change. No Production deploy, migration, seed, data write or Telegram request is authorized in this phase.
