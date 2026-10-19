# Phase 3C analytics audit and owner actions

Branch-only implementation, based on 898ea2630a3436b1e8256551e56b37b0ea627091. No account configuration or Production deployment performed.

## Evidence and limits

Owner-supplied GSC sample: 32 clicks / 448 impressions; خرید مستقیم از دبی 8 clicks / 32 impressions, approximately 25% CTR, position 8.12; سفارش از دبی position 13.25; خرید از دبی position 23.27. GSC period unspecified. These are first-party observations, not market search volumes or a rank guarantee.

Owner-supplied GA4 last 90 days: 230 sessions (Direct 88, AI Assistant 55, Organic 52, Referral 35). Organic: 25 active users, 40 engaged sessions, 76.92% engagement. AI: 49 active users, 40 engaged sessions, 72.73% engagement; source chatgpt.com / ai-assistant. AI landing /buy-from-dubai: 12 sessions, 83.33% engagement, 98.75 seconds average engagement/session, three WhatsApp click events. AI total five WhatsApp click events; sitewide eleven. Events are not unique leads or sales. Admin/owner activity contaminates the sample; do not extrapolate customer conversion rates. Zero configured Key Events and missing Search Console link are owner-supplied, not independently inspected account state.

## Collection architecture

Before: root GoogleAnalytics loaded whenever the public measurement ID/environment switch allowed it, including Admin; commerce used third-party sendGAEvent and customer amounts could fall back to AED source cost. There was no authoritative successful-request event.

After: PublicAnalytics permits HTTPS apex/www public Production pages only. Admin/API, localhost, development, previews and webdriver sessions are excluded; browser-local QA opt-out is available via localStorage key `dubaikharid_analytics_opt_out` = `1` or `window.__DUBAIKHARID_QA__` = true. Owner visits to public Production remain indistinguishable from customer visits unless opted out; IP filtering alone is not relied upon. Environment and hostname checks are both required. History and same-tab Admin navigation set Google's ga-disable flag before navigation, including when the tag was previously loaded. Server authorization is unchanged.

Manual page_view is deduplicated per pathname. Queries/hash are excluded; page titles are generic page types, referrer is origin-only. This sacrifices query-level analytics intentionally. Public acquisition remains available through ordinary referrer/session handling, but campaign query attribution is not promised under this sanitization policy. No new credentials, property or tracking destination.

Google documents the [ga-disable mechanism](https://developers.google.com/tag-platform/security/guides/privacy). Browser mocks cover guards and payloads; local browser confirms no tag. No live Production GA beacons were generated to test this undeployed implementation.

## Event semantics

| Event | Trigger / meaning | Decision |
|---|---|---|
| whatsapp_click | Existing footer, manual-payment and profile-support CTA interactions | Secondary intent Key Event; safe placement + pathname/page type only; no phone, URL or message |
| form_start / form_submit | No custom repository implementation found; observed events may be Enhanced Measurement | Not proof of backend persistence; do not mark primary conversion |
| lead_created | Only after successful response and returned persisted request in quick request, checkout request, Product inquiry and profile request | Recommended primary Key Event; fixed form_name + lead_type, no lead ID in transmitted payload; bounded local dedupe storage |
| view_item | Public Product/Laptop detail observation | Funnel only |
| add_to_cart / remove_from_cart | Actual cart operation | Funnel only |
| view_cart | Cart observation | Funnel only |
| begin_checkout | Checkout interaction | Funnel only; request success tracked separately |
| purchase | Existing server-confirmed paid order with transaction ID and browser dedupe | Retained, never fabricated for request/WhatsApp; client delivery is not guaranteed server-side accounting |

Commerce uses catalog identity/name, option, positive quantity and authoritative customer Toman price where available. GA4 uses ISO 4217 IRR: Toman × 10, a denomination conversion, not FX conversion. No AED source cost fallback. Already-final prices are not discounted twice. Unknown/external/varying prices omit monetary fields rather than invent revenue. Some cart snapshots lack a final price; monetary funnel coverage is intentionally incomplete. [Google event reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events).

PII: app-controlled payloads strip query/hash, raw referrer and arbitrary extra fields; requests do not send names, phone, email, free text or persisted lead IDs. Catalog names/IDs are public catalog data. Existing commerce transaction IDs remain internal order identifiers. Automatic Google collection is a separate account control described below. Do not claim complete PII protection until that control is reviewed.

Zero GA purchases does not establish zero real sales: leads, offline follow-up and WhatsApp are separate business paths. Do not sum WhatsApp clicks and lead_created as unique customers; attribution and dedupe across devices remain limited.

## Owner actions BEFORE any later deployment

1. In the correct GA4 property: Admin → Data collection and modification → Data streams → select the existing web stream → Enhanced Measurement gear. Disable history-based page changes (the new app emits SPA page_view), form interactions, outbound clicks and site search. Review remaining automatic measurements for private values; disabling the whole feature is an alternative with coverage tradeoffs. Do not create a second Google tag or measurement ID. Save only after owner authorization. Manual `send_page_view:false` does not disable Enhanced Measurement history events: [Google pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views), [Enhanced Measurement](https://support.google.com/analytics/answer/9216061).
2. Coordinate deployment with that configuration; use an owner-approved controlled customer flow and DebugView/Realtime afterward to check one page_view per public pathname, no Admin hits (including public→Admin→public), one successful lead_created, no failed-submit lead event, no PII, no outbound wa.me payload and correct IRR values. This has NOT been live-tested in this phase. Realtime under opt-out cannot verify tracking; use a deliberate authorized test session only.
3. Admin → Data display → Events → Recent events: after collection begins, star lead_created as a Key Event; star whatsapp_click as secondary intent. If unavailable in Recent events, use Create event → enter the existing event name → Mark as key event, without defining an extra matching event that duplicates it. UI may instead expose Admin → Key events → New key event. Requires appropriate Marketer/Editor permission. Retain per-event counting for business submissions; interpret WhatsApp separately. Do not mark page_view, scroll, form_start, view_item, add_to_cart or begin_checkout as primary conversions. Existing form_submit remains diagnostic. [Google Key Events steps](https://support.google.com/analytics/answer/13128484?hl=en).
4. Add a release annotation to analysis: old AED-based monetary events and new IRR are not directly comparable. Reporting Toman = IRR / 10. Review property reporting currency separately; do not use unsupported IRT or change currency without owner decision.
5. Link Search Console: GA4 Admin → Product links → Search Console Links → Link → Choose accounts → choose verified Search Console property → Confirm → Next → choose matching web stream → Next → review → Submit. Requires GA4 Editor and Search Console verified owner. Verify host/property scope against the host discrepancy below first. [Google linking instructions](https://support.google.com/analytics/answer/10737381?hl=en).
6. Review accounts.google.com and vercel.com referrals against legitimate customer journeys. Do not automatically exclude them. If validated unwanted referrals: Admin → Data streams → web stream → Configure tag settings → Show all → List unwanted referrals → add narrowly scoped conditions. [Google referral guidance](https://support.google.com/analytics/answer/10327750?hl=en-uk). Existing contaminated history cannot be repaired by deploying guards; annotate and compare a clean post-release period.

## Technical SEO audit

Public read-only HTTP audit on 19 October 2026: HTTP apex 308 to HTTPS apex; HTTPS apex 307 to HTTPS WWW; HTTP WWW 308 to HTTPS WWW; HTTPS WWW 200. Frozen root canonical points to HTTPS apex. This is a verified redirect/canonical inconsistency, not evidence of two currently independent indexable hosts. No redirect, domain setting or canonical changed. Owner should decide a separate safe host plan after reviewing Search Console and deployed configuration; Homepage freeze takes precedence here.

/admin serves login HTTP 200 without authentication, not private data. Branch explicitly sets noindex, nofollow, nocache; retains auth and robots/sitemap exclusion. Noindex must be crawl-observable; robots blocking alone does not remove an already indexed URL. Search Console removal is a separate owner action if needed. No authenticated Production session used.

Current Production /women?sub=shoes returned 200 without the new facet header. Approved foundation already adds category query X-Robots-Tag noindex, follow, clean canonical policy; preserved here. Valid Store/Brand page N is self-canonical; invalid/out-of-range pagination notFound; filters/search/sort do not create new indexable landing pages. Dedicated category routes own genuine distinct intent. Do not index every wording/filter combination.

## QA scope

Local browser at loopback with an unreachable fake database; no migration, seed or database connection. Static procedural guide checked at 1440/768/390 widths with no horizontal overflow, stable tablet screenshot after responsive drawer transition. Temu and all three retained guides checked for headings and layout; Homepage H1 inspected and frozen source hashes tested. Local catalog/Settings use fallback or fail without a database, so this is not a new live catalog/database integration test. Production endpoints were read only for host/SEO audit. Build and pure regression suite results are recorded in the final report.
