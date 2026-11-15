# Laptop Accessories architecture

## Pre-implementation reuse plan — 2026-11-13

Starting clean documentation HEAD aa68f4d99048833cfbc7fdcd2bcee81e997fdd60. Vercel Production remains abfc974f49fda656bdada9ff94ea156d8faa8e4f, READY. Production migration baseline must be rechecked before any migration.

Product is the commercial identity. Add one accessory profile per Product and a relational join to existing LaptopModel. Keep Laptop physical units completely separate. ProductVariant represents authenticity/condition; its one-to-one detail contains optional category-aware health/testing/warranty facts. ProductVariantImage is independent of ProductImage.colorOptionId; shared galleries and existing color galleries retain their semantics.

Reuse ProductInventory and its serializable retry, conditional stock updates, reservations and movements. All accessory supply is IRAN_STOCK with explicit Toman overrides, never AED conversion. Reuse PRODUCT_VARIANT OrderItem snapshots and server-authoritative pricing; extend only safe selected-offer snapshots. Existing options must carry authenticity/condition as CatalogAttribute values.

Admin uses existing shell, permission authorization and activity logger. Add dedicated view/edit permissions for ADMIN/SUPER_ADMIN only. Reuse typography, spacing, colors and tables from Admin; no sidebar redesign. Public pages retain existing header/footer, image delivery and apex SEO. Design stance: restrained technical commerce, clear specification rows, accessible explicit offer labels, no decorative animation/3D. Existing fonts/colors/grid remain; adapt offer columns to one column on narrow mobile. Frontend-design skill applied within the user's stricter preservation scope.

Central public href resolver will distinguish accessory profiles from ordinary ID-based Product routes; propagate it to cards, cart, wishlist, search, sitemap, IndexNow and Telegram. Generic Product entry redirects to the accessory canonical. Generic catalog/admin defaults exclude accessories. Public projections must omit costs, Blob pathnames and Admin-only notes.

Dedicated Blob upload validates magic bytes, MIME, 10MB limit, UUID path and edit permission. No physical Blob deletion in this feature: deleting an association retains files, preventing removal from existing orders or other galleries.

Separate accessory Telegram auto-publish flag defaults false; generic publication must skip accessory profiles by default. No real Telegram request during QA. IndexNow only schedules canonical changes after successful commits and cannot fail the save.

Migration is additive only. Preview migration, data preservation and drift checks, authenticated visual QA, full regression/build gates, verified Production backup and pre/post fingerprints are mandatory before Production migration/deployment. No fake Production accessory rows.

## Access observation

The current Neon connector is bound to red-meadow-89718709, not DubaiKharid polished-bird-87924134. It explicitly rejects the intended project. No writes through that connection. Existing environment/Preview credentials must be verified independently; do not substitute Production for Preview.

## Release state — 2026-11-15

The four extension models, conditional outbox migration, secure Admin APIs, category-aware validation, catalog configuration script, dedicated Admin and public screens, centralized URLs, cart/order snapshots and safe public projections are implemented and deployed. The original Homepage frozen digest still passes after reversing only two exact approved exceptions (Laptop navigation and ProductSlider href resolver). No Hero, Homepage content, metadata, analytics or physical Laptop identity change.

Uploads use signed direct-to-Blob client upload to support 10MB without the Vercel request-body cap; the server verifies file size, MIME and magic bytes before association. The current implementation requires the existing BLOB_READ_WRITE_TOKEN for client token signing; an OIDC-only store will return a clear unavailable error. Verify actual Preview and Production Blob configuration before release. No secret was exported to establish this.

All 117 requested checklist fields and evidence limits are in RELEASE-REPORT.md. Preview migration, database/service/API tests, uploads and responsive QA passed; Production migration 31 and exact-SHA deployment are live and healthy. Only the final read-only Production Admin smoke check awaits owner sign-in. No fake Production accessory was created.

Wishlist display now sends an explicit wishlist intent to the existing resolver. Only accessory wishlist display selects a representative available offer; cart/checkout still require explicit offer identity and use authoritative prices. The original Homepage frozen digest remains, reversing only the exact authorized navigation, URL resolver and wishlist-only request intent exceptions.

Canonical accessory covers prefer the shared gallery, then the selected available offer gallery. Category technical fields display localized labels. Catalog configuration uses read-first create-if-missing operations in one serializable transaction, preserving all existing values and timestamps.
