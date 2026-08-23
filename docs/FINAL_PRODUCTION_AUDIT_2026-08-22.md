# DubaiKharid — Final Production Audit

Date: 2026-08-22  
Scope: full-project audit, end-to-end QA, production readiness, and small safe fixes only  
Verdict: **NOT READY FOR PRODUCTION**

## 1. Executive summary

The server-backed admin core is substantially stronger than the public storefront. Admin authentication, RBAC, Orders, Customers, Products, Warehouse, Payments, Shipments, Settings, Dashboard, and Financial Reports are connected to Prisma/PostgreSQL and the production build succeeds. A read-only database integrity scan found no current relational or stock anomalies.

Production release is still blocked by three issues:

1. `.env` and `.env.local` are tracked by Git. Any credentials ever committed must be treated as exposed, removed from Git history/index, and rotated.
2. Several public catalog/search/category paths still use empty static arrays plus legacy `localStorage`, so admin-created database products do not reliably appear in the storefront.
3. Customer addresses, reviews, and support tickets are not server-backed. Demo content was removed during this audit, but the missing backend functionality remains.

Additional P1 issues include weak taxonomy validation, a missing real payment gateway, a product-not-found page returning HTTP 200, in-memory-only public rate limiting, and incomplete paid-order cancellation/refund semantics.

## 2. Verification results

| Check | Result |
|---|---|
| `npx prisma validate` | PASS |
| `npx prisma generate` | PASS |
| `npx prisma migrate status` | PASS — 13 migrations, schema up to date |
| `npm run data:diagnostics` | PASS — read-only, no data changed |
| `npm run lint` | PASS — 0 errors, 60 image-optimization warnings |
| `npm run build` | PASS — Next.js 16.2.6 production build |
| `npm run predeploy:check` | FAIL — `NEXT_PUBLIC_SITE_URL` missing in the current environment |
| Home runtime | HTTP 200 |
| Unauthenticated `/admin/dashboard` | HTTP 307 to `/admin` |
| Unauthenticated `/api/admin/orders` | HTTP 401 |
| Unauthenticated `/api/account/me` | HTTP 401 |
| Invalid tracking request | HTTP 400 |
| Missing product/laptop API record | HTTP 404 |
| Missing product page | HTTP 200 — incorrect; should be 404 |

Database diagnostics returned zero for duplicate customers, orders without items, invalid order totals, orphan income payments, shipments without orders, invalid stock, over-reserved stock, and sold laptops without a sale. No critical setting was missing from the database.

Browser QA covered the home page plus `/buy-from-dubai`, `/brands`, `/stock-laptops`, `/men`, `/women`, `/kids`, `/bags-accessories`, search, tracking, login, cart, wishlist, and a missing product. At a 1280×720 desktop viewport there was no horizontal document overflow, no broken image after the fixes, and no browser console error. The available browser harness did not expose viewport emulation, so tablet/mobile were reviewed statically but were not fully visually certified in this run.

## 3. Fixes made during this audit

- Removed the calculator's fabricated fallback products, prices, weights, brands, and mock Gucci image.
- Preserved real extracted product metadata when price extraction fails, while leaving price blank for manual entry.
- Added a public rate guard to `/api/fetch-product`.
- Removed seeded fake reviews and random “verified purchase” assignment; known seeded records are cleaned from existing browser storage.
- Removed fake laptop specifications, battery health, warranty, accessories, and hardware-test results.
- Removed seeded customer addresses and the seeded answered support ticket.
- Removed the simulated five-second support reply and stopped claiming that an unconnected ticket was submitted.
- Disabled the misleading local “factory restore” behavior in database-backed admin settings.
- Replaced fabricated 82/8/10 order financial splits with stored order snapshots and truthful zero fallback.
- Removed fake customer photos, generated Gmail addresses, generic Amazon labels, and Unsplash product fallbacks from admin order/request views.
- Stopped assigning stock-photo images to newly created brands and stores.
- Added a truthful empty image state for database laptops without images.
- Cleared all ESLint errors without changing the visual design; generated Prisma code and the non-runtime backup file are excluded from lint.

Files touched by these audit fixes:

- `eslint.config.mjs`
- `src/components/Calculator.js`
- `src/components/ProductSlider.js`
- `src/app/api/fetch-product/route.js`
- `src/app/product/[id]/page.js`
- `src/app/profile/page.js`
- `src/app/admin/settings/page.js`
- `src/lib/adminOrders.js`
- `src/app/admin/orders/page.js`
- `src/app/admin/leads/page.js`
- `src/app/admin/brands/page.js`
- `src/app/admin/stores/page.js`
- `src/app/bags-accessories/page.js`
- `src/app/men/page.js`
- `src/app/women/page.js`
- `src/app/kids/page.js`
- `src/app/other-products/page.js`
- `src/app/sale/page.js`
- `src/app/search/page.js`

## 4. Prioritized findings

### P0 — production blockers

#### P0-1: secrets and generated output are tracked by Git

- `.env` and `.env.local` are tracked.
- 568 `.next` files and 29,520 `node_modules` files are tracked.
- `.gitignore` is now reasonable, but ignore rules do not untrack existing history.
- Required action: rotate database/session/OAuth secrets, remove env files from the index and history using a reviewed procedure, and remove generated directories from the index. Do not deploy before rotation.

#### P0-2: public product discovery is not database-backed end to end

- `src/data/products.js` exports empty catalogs and merges legacy browser storage.
- Men, women, kids, bags/accessories, other products, sale, best sellers, search, and `ProductSlider` depend partly or entirely on those client catalogs.
- There is no paginated public products-list API; only `/api/products/[id]` exists.
- Result: an active Product created in admin may exist in PostgreSQL but remain absent from public category/search pages.
- Required action: create a server-backed public catalog query/API and migrate each public listing page; then remove product-related legacy localStorage.

#### P0-3: customer-owned content is not durable

- Addresses remain in per-browser localStorage.
- Reviews remain localStorage-only, with no authentication, moderation, database persistence, or purchase verification.
- Support tickets have no database model/API. Fake submission/reply behavior was disabled, so the form now honestly reports that the service is not connected.
- Required action: add Address, Review, and SupportTicket persistence/authorization or remove those features from production until implemented.

### P1 — must fix soon

1. `/product/does-not-exist` returns HTTP 200. Server layout should call `notFound()` for every missing DB record after legacy product fallbacks are removed.
2. `/brands` and public search still maintain hardcoded/localStorage brand and store catalogs, duplicating the database source of truth.
3. Admin Brand, Store, and Category APIs need stricter schemas: trimmed maximum lengths, exact allowlists, URL validation, image size/type limits, and consistent 409 handling.
4. Brand/store/warehouse/settings images are persisted as data URLs in PostgreSQL. Use object storage such as Vercel Blob and store only validated URLs.
5. Public throttling is in-memory and per-instance. Use a shared rate-limit store for horizontally scaled production deployments.
6. There is no real payment gateway/webhook. Online payment is correctly rejected rather than faked, but checkout is manual only.
7. Cancelling an already-paid order does not constitute a refund workflow, and a sold laptop is not automatically restored. Define and implement transactional refund/restock policy.
8. Product and Order money fields mix `Float` and `Decimal`. Convert authoritative financial fields to Decimal in a dedicated, tested migration.
9. `Customer.email` is not unique. Credentials normalize and protect phone identity, and OAuth rejects ambiguous matches, but normalized email uniqueness should be designed and migrated safely.
10. `NEXT_PUBLIC_SITE_URL` is missing in the current environment, causing `predeploy:check` to fail and risking wrong canonical/NextAuth URLs.
11. Google OAuth is disabled unless both Google environment variables exist; Apple login is not implemented. The admin settings screen contains stale simulated OAuth presentation and should reflect actual server configuration.
12. No runtime evidence was available for Neon backup/PITR, preview-vs-production database isolation, alerts, error tracking, or centralized audit-log retention.
13. Public product scraping is limited to Amazon.ae, Noon, and Namshi and can still fail due to retailer anti-bot changes. SSRF/redirect/size/timeout protections are good; failure must remain a manual-price path.

### P2 — quality and technical debt

1. Lint has 60 `no-img-element` warnings. Prioritize hero/product/catalog images for `next/image`, correct sizes, and stable placeholders.
2. Root layout is force-dynamic because it loads settings on every request, which reduces cacheability. Consider tagged cache/revalidation for public settings.
3. Public listing pages duplicate filtering/sorting/localStorage code and should share one typed catalog layer.
4. Search uses a hardcoded brand database and routes results back to `/brands` instead of canonical `/brands/[id]` pages.
5. Financial historical-completeness flags are hardcoded false despite snapshot fields. Calculate completeness from actual records.
6. `OrderItem.orderId` and common PurchaseRequest query fields may benefit from measured indexes.
7. Some warehouse constraints were added `NOT VALID`; current data passes diagnostics, but constraints should be explicitly validated in a safe maintenance migration.
8. There are no automated unit/integration tests in the package scripts. Current verification is build, lint, diagnostics, API probes, and browser smoke testing.
9. The home H1 visually concatenates two spans without whitespace in text extraction (`دبیو`); add accessible whitespace if screen-reader output confirms the issue.
10. Mobile/tablet visual regression tests are missing.

## 5. Authentication and authorization audit

### Admin

- Separate HS256 admin JWT with issuer, audience, expiration, HttpOnly cookie, SameSite=Lax, and Secure in production.
- Every protected request reloads the AdminUser and requires ACTIVE status, so disabled admins lose access even before token expiry.
- Proxy protects `/admin/*` and `/api/admin/*`; login/logout are the intended public exceptions.
- Every audited admin API calls backend authorization; UI gates are not the security boundary.
- Permission mapping is consistent for orders, customers, products, laptops, warehouse, payments, shipments, settings, reports, activity logs, and admin-user management.
- Activity logs cover authentication and core mutations with safe metadata.
- Remaining risk: login throttling is process-local, and “logout other devices” in Settings is only presentation and does not revoke sessions.

### Customer

- NextAuth JWT sessions use a separate secret.
- Credentials passwords use bcrypt; Google is optional and requires both environment variables.
- Customer status and `sessionVersion` are checked, supporting account/session invalidation.
- Account orders are scoped by authenticated customer ID.
- Tracking requires order code plus normalized phone and returns a minimized view.
- No browser localStorage is used as an authentication authority.

## 6. API and route inventory

The build exposes 46 page routes and 52 route handlers.

Admin API groups (all protected except auth login/logout): activity logs/events, admin users, brands, categories, customers, dashboard, financial reports, laptops, orders, payments, purchase requests, settings, shipments, stores, and warehouse/adjustments/notes.

Customer/public API groups: NextAuth, registration, account profile/password/orders, cart resolution, AED lookup, protected external product extraction, health/readiness, laptop list/detail, product detail, order creation/tracking, purchase request creation/cancellation, and public settings.

HTTP handling is generally consistent: 400 validation, 401 unauthenticated, 403 permission, 404 missing record, 409 conflict, and sanitized 500 responses. Core Orders, Payments, Shipments, Products, Laptops, Warehouse, and Customers use explicit validation/allowlists; taxonomy CRUD is the notable weak area.

## 7. Core business-flow audit

### Orders and inventory

- Public order creation requires an idempotency key and uses a Serializable Prisma transaction.
- Product/laptop identity, active/available state, pricing settings, and totals are revalidated server-side.
- Laptop reservation uses a conditional write and prevents double sale.
- Warehouse availability and reservations are checked transactionally.
- Cancellation releases active reservations; duplicate status calls avoid duplicate side effects.
- Remaining gap: paid cancellation/refund/restock policy.

### Payments

- Database-backed manual payment records; no fake payment success.
- Successful payment can transactionally move eligible orders to paid and mark reserved laptops sold.
- Refund states are persisted, but end-to-end customer refund and stock restoration policy is incomplete.
- No verified payment gateway/webhook exists.

### Shipments

- Database-backed Shipment with a unique `orderId`, so the current business model supports one shipment per order.
- Tracking code can be null; random tracking codes are not generated.
- Status transitions, shipped/delivered timestamps, order synchronization, and audit logs are server-controlled and transactional.
- Carrier is validated text; tracking URLs allow HTTP/HTTPS only.
- No courier API/webhook exists; updates are manual.

### Dashboard and finance

- Dashboard and financial reports query PostgreSQL.
- Financial cards/series are derived from orders, successful/refunded payments, and expenses rather than random values.
- Stored product/shipping snapshots are now used for admin order breakdowns.
- Historical completeness reporting and Float-to-Decimal normalization remain.

## 8. Prisma and migration safety

- PostgreSQL/Neon datasource and Prisma 7 client validate successfully.
- 13 migrations are present and deployed; no reset or destructive command was run.
- Core relationships exist between customers, orders, items, products/laptops, warehouse, payments, and shipments.
- Current integrity scan is clean.
- Backup/restore documentation exists (`DATABASE_BACKUP.md`, `PRODUCTION_RUNBOOK.md`), but actual provider backup/PITR status cannot be proven from repository code.

## 9. SEO/AEO/GEO audit

- Root and major public pages have Persian titles/descriptions, canonical URLs, Open Graph/Twitter metadata, and RTL/language declarations.
- `/buy-from-dubai` owns the primary “خرید مستقیم از دبی” intent and includes a clear H1, FAQ content, BreadcrumbList, and FAQPage JSON-LD.
- Product, brand, and store routes generate database-backed metadata and structured data.
- Sitemap excludes admin/account/API routes and adds active products, available laptops, stores, and brands.
- Preview deployments disallow indexing and production robots excludes admin/API/profile/payment.
- Thin/localStorage category pages are intentionally noindex, which is correct until they become database-backed.
- Remaining defects: missing-product HTTP 200, canonical correctness depends on the missing `NEXT_PUBLIC_SITE_URL`, and some sitemap category URLs lead to thin catalogs.

## 10. Performance, accessibility, and UX

- Production build succeeds and the tested desktop pages have no document-level horizontal overflow.
- Desktop home had no broken images or console errors after fixes.
- Pagination exists on high-volume admin entities and account history.
- 63 raw `<img>` usages were found before fixes; lint still reports 60 optimization warnings.
- Important images need intrinsic dimensions/`next/image`; empty-image database records need consistent placeholders across all catalogs.
- Keyboard/focus/ARIA coverage is partial. Header menu behavior and form labels are generally present, but a dedicated screen-reader and keyboard-only pass is still needed.
- Mobile CSS exists, but automated 390/768 viewport visual regression is required before release.

## 11. Deployment and environment audit

Expected server variables:

- `DATABASE_URL`
- `DIRECT_URL` for migration/administrative database access
- `ADMIN_SESSION_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL` (the only intentional public variable)
- optional paired `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- optional admin seed credentials for controlled setup only

No sensitive value was found under a `NEXT_PUBLIC_*` name. However, tracked env files are an immediate secret-management incident. Vercel/Neon environment separation, actual production domain mapping, backup/PITR, and alerting must be verified in provider dashboards.

## 12. File classification

### KEEP

- `src/lib/adminAuth.js`, customer auth modules, authorization/permission modules
- Prisma schema/migrations and database-backed core service modules
- deployment/backup/SEO/runbook documentation
- health/readiness, sitemap, robots, metadata, JSON-LD helpers

### REFACTOR

- `src/data/products.js` and all public catalog/search consumers
- `src/app/brands/page.js`
- customer address/review/support UI and persistence
- taxonomy CRUD validation
- image upload/storage and raw image rendering
- admin settings security/OAuth/session presentation
- money fields and historical reporting completeness

### REMOVE FROM REPOSITORY/RUNTIME

- tracked `.env`, `.env.local` after secrets are rotated
- tracked `.next/**`, `node_modules/**`, `.DS_Store`
- `admin_original_backup.js` after confirming it is not needed; it contains obsolete mock/localStorage admin behavior
- obsolete diagnostic/restore scripts and generated lint output after owner review

### UNKNOWN — owner decision required

- `analyze_missing.js`, `diagnose.js`, `inject_states.js`, `restore_missing.js`, `eslint-output.json`
- any historical localStorage data that may represent real customer-entered content; do not bulk-delete without a migration/export decision

## 13. Recommended release order

1. Rotate and clean all tracked secrets/generated artifacts; verify Git history and Vercel envs.
2. Set and validate `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`, DATABASE/DIRECT URLs per environment.
3. Move public catalog, brand/store discovery, and search to PostgreSQL.
4. Implement or remove customer Address/Review/SupportTicket features.
5. Add strict Brand/Store/Category validation and object-storage uploads.
6. Define paid cancellation/refund/restock behavior and implement it transactionally.
7. Add shared rate limiting and production observability.
8. Fix missing-product 404 and complete image/accessibility/mobile QA.
9. Run Prisma validate/generate/status, diagnostics, lint, build, preview smoke tests, then a controlled production deployment.

## 14. Final readiness statement

The database-backed admin and transactional commerce core are in good condition, and the current code compiles cleanly. The repository is **not yet safe to ship to production** because secret hygiene and storefront/customer data ownership are unresolved. After the three P0 items and the listed P1 release controls are completed and verified in an isolated preview environment, the project can move to a production go/no-go review.
