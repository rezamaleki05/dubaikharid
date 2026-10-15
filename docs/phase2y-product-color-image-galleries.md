# Product color galleries (Phase 2Y)

## Architecture and compatibility

Base: `b240b397eb140d751aa10f77880859f5ea4cc6f0`.
Branch: `codex/product-color-image-galleries`.

Previously ProductImage was one ordered Product gallery with one primary image. Variants use CatalogAttribute/AttributeOption and ProductVariantOption; `inputType: COLOR` is the semantic color identity, independent of attribute codes and translated labels. The detail page had thumbnails but no lightbox. Cart, catalog cards, SEO and Telegram use the centralized Product cover resolver.

ProductImage now has nullable `colorOptionId`, referencing the real AttributeOption ID. NULL means shared; existing rows are not rewritten. The additive migration adds the relation/index and replaces the product-wide partial cover index with shared/color-scoped partial unique indexes. It runs atomically. Option deletion is restricted while images reference it, preventing silent reassignment to the shared gallery.

The first configured variant axis of semantic type COLOR owns galleries. This matches existing axis ordering; size and all other axes do not affect the gallery. Categories normally have one color axis. No mapping uses names, filenames, swatch guesses or Color+Size combinations.

The configuration API accepts optional `colorGalleries: [{colorOptionId, images}]` alongside the unchanged shared `images` payload. Each gallery permits ten images with independent order and cover. Image IDs remain bound to their original Product/gallery/storage identity; moving an existing row to another gallery is rejected. Entering a URL explicitly in another gallery creates a separate association, without silently moving the original.

Older clients omitting colorGalleries preserve all existing color galleries. Galleries omitted from the array also remain intact; submitting an explicitly empty gallery removes its image associations. Category/option validation and all existing Admin authorization and serializable Product/variant/inventory safeguards remain in force.

## Removal and storage

Removing a color from the sellable matrix retains its images for Admin review. The Admin editor shows a “برای بازبینی” gallery; public detail excludes it until the color becomes active again. This also handles a color added and removed before the first save. A new gallery must belong to the category's real COLOR axis; a previously persisted gallery may remain reviewable after configuration changes.

Removing a dedicated image removes its ProductImage association but deliberately retains the Blob. Removing an entire color does not delete image rows or storage. Shared-image removal preserves the existing reference-checked post-commit Blob cleanup behavior. New uploads use the existing protected Product upload API and Vercel Blob provider; there is no new storage provider.

## Public behavior

A selected color with images uses only its dedicated gallery; otherwise it uses shared images, then the existing legacy/placeholder fallback. Gallery identity is the stable selected color option ID, so color changes immediately reset to cover and close/reset the lightbox. Size-only changes preserve the selected image and gallery instance. The native modal lightbox shares the same current items, supports arrows, Escape, focus restoration and reduced-motion preferences.

The existing selection flow starts configurable Products with no selected variant; that behavior remains unchanged, so the initial gallery is shared. Any selected color resolves its cover synchronously. No artificial default variant or automatic selection was introduced.

Cards, SEO, inventory covers, cart thumbnails and Telegram Product posts explicitly retain shared/canonical imagery. Only detail loads dedicated galleries. URLs, metadata, sitemap, pricing, cart identities, stock rules, Laptop and Lead notification code are unchanged.

## Verification

- 30 focused color-gallery/upload tests; 439 affected tests across 29 files; existing gallery and variant tests retained.
- Full suite: 535 passing, zero failed.
- Actual authenticated localhost API: create/save/reopen, order and cover round-trip, unauthorized mutation rejection, invalid/non-color option rejection, duplicate/cross-gallery identity rejection, old-client preservation, safe image association removal, removed-color review/public exclusion.
- Actual cart API: Black/41 and White/41 retain exact variant IDs, independent prices, canonical thumbnail; quantity six correctly fails against stock five. No reservation/order is created by resolution.
- Actual local database snapshots preserve Orders, OrderItems, Laptops, WarehouseItems, Settings and TelegramPublication; gallery-only edits preserve inventory counters and variant identity.
- Fresh full replay (29 migrations), forward baseline 28→29, and Prisma diff: ZERO DRIFT. Forward replay compares every business row and proves legacy ProductImage/order/inventory preservation.
- Admin visual QA: 1440/768/430/390, Light and Dark, no horizontal page/dialog overflow. Mobile cover/reorder saved and reopened correctly. Browser file chooser accepted two PNGs and displayed two previews in the correct color gallery; previews discarded without saving.
- Public visual/interaction QA: 390/430/768; Black 4 / White 3 / Red shared 2, Black 39→41 preserves active image, switching back resets cover. Lightbox current source, navigation, Escape and responsive bounds verified.
- Live external Blob writes were not performed. Upload handler tests execute the actual route with only the auth/storage/framework transport boundaries mocked; repeated file upload identities, provider options, type validation and authorization pass.
- Browser automation stalled around the final cart confirmation; authoritative cart behavior was verified through the working local application API. This is not reported as a completed browser cart-drawer check.
- Prisma validate/generate, optimized Next build and integrated TypeScript pass. Lint: zero errors, 50 existing warnings. `git diff --check` passes.

No Production database access/mutation, migration, seed, deployment, messaging request or environment update was performed. origin/main remains `9422d4f8ee004da3c5f2b45b34ceb264a8b032a4`.

## Reproduce isolated QA

Never use the repository's Production `.env.local` database for QA. Every command must explicitly override DATABASE_URL and DIRECT_URL with a disposable localhost database. Disable Telegram/WhatsApp sending and clear Blob credentials before starting the app.

1. Set `COLOR_GALLERY_QA_DATABASE_URL=postgresql://USER@127.0.0.1:PORT/gallery_UNIQUE_PREFIX` and run `node scripts/qa-product-color-gallery-migrations.mjs`. It creates fresh and forward databases and fails if either already exists.
2. Set COLOR_GALLERY_QA_DATABASE_URL to the new `_fresh` database. Set COLOR_GALLERY_QA_EMAIL to an `@example.test` address and COLOR_GALLERY_QA_PASSWORD to a disposable password (12+ characters). Run `node scripts/qa-product-color-gallery-fixture.mjs` against that empty database.
3. Start the local app using that database for both DATABASE_URL and DIRECT_URL; provide local session secrets and local site URLs, `TELEGRAM_ALLOW_SEND=false`, `WHATSAPP_ALLOW_SEND=false`, and empty messaging/Blob credentials.
4. Set COLOR_GALLERY_QA_ORIGIN to that localhost app and run `node scripts/qa-product-color-galleries.mjs`. The script exercises the actual protected configuration and public/cart APIs and checks database snapshots. It writes only synthetic local data.
5. Run `node --test tests/*.test.mjs`, Prisma validate/generate, build, lint and diff check. Visually inspect using the returned sample Product ID and local QA login.
6. Remove the generated `public/__qa_phase2y` assets after browser QA; they are synthetic and must not be committed or deployed.
