# Phase 3G technical SEO and performance

Baseline Production: `3aed9fadaf4f00fac08a73c877effaceb995f79a`.
Public sitemap, SSR, metadata and JSON-LD were crawled before changes; public
links discovered in hydrated Homepage navigation were also included. Private
routes are shallow unauthenticated boundary checks, never an account crawl.
Nonexistent pagination is an intentional 404 probe, not a broken internal link.

Four mobile Lighthouse lab runs identified image transfer as the dominant
problem: Homepage 64 / LCP 23.97s / CLS .191; Product 78 / LCP 5.51s / CLS 0;
Laptop 73 / LCP 11.29s / CLS 0; buying guide 91 / LCP 3.33s / CLS 0. TBT was
1–20ms. These are single-run simulated mobile results, not field INP or CrUX.
The official PageSpeed API returned a shared quota-exceeded response; no field
pass/fail is inferred. Follow-up Production lab measurements belong in the
release report, with the same tool/version/settings and cache caveats.

## Reviewed changes

- Existing decorative Hero source/crop/layout retained, delivered with Next
  responsive Image, quality 90, same cover/center 20%, and preload. The redundant
  raw CSS download is removed. No H1, text, CTA, metadata or section-order edits.
- Existing blurred Calculator background uses the same asset through Next's
  optimizer at high quality. No pixel asset is replaced or AI-regenerated.
- Homepage cards use responsive first-party image sources, lazy loading and
  async decoding. Unknown external store images retain their original URLs.
- Public Product/Laptop galleries use responsive screen/thumb delivery. DOM
  dimensions are not invented; proportional image resizing and existing CSS
  preserve aspect ratio. Full-resolution original zoom images load only after
  opening the lightbox; navigation/focus/selected identity remain intact.
- Exact first-party Blob hostname only; no broad external-store proxy or signed
  query URLs. Quality allowlist is 75/90. No private caching, wildcard hosts,
  local-IP access or security-header relaxation is introduced.
- Brand discovery reserves its measured existing strip height (light mobile
  84px, light desktop 104px; corresponding existing dark dimensions), avoiding
  insertion above the Calculator after hydration. No logo/text/order changes.
- Remove unused remote Inter stylesheet import behind locally hosted Vazirmatn.
  Keep existing typography, weights, font stack and display strategy.

`phase3g-performance-exceptions.json` lists the exact reviewed nonvisual changes
to protected Homepage dependencies. The freeze test reverses only those exact
snippets before checking the original frozen digest. It does not re-baseline
copy/layout or permit arbitrary changes to protected files.

## Safety and validation

No database schema/migration, business data, pricing, GA4, Clarity, IndexNow,
Telegram, canonical host, main branch or environment changes are needed.
Lighthouse automated profiles disable app analytics via the existing webdriver
guards. Real browser script-cost checks are separate and do not submit forms.
Local candidate QA uses forced read-only DB connections and disables outbound
business delivery and Production analytics. No seeds or migrations run.

Focused tests cover image URL trust boundaries, LCP hints, responsive delivery,
full-resolution zoom deferral, layout reservation and font import removal. Full
SEO/Product/Laptop/analytics tests and the original Homepage digest remain gates.
Re-run the public crawl and equivalent mobile lab checks after READY. Do not
claim field CWV improvement or guaranteed rich-result display from lab tests.

Public schema retains real authoritative Toman prices converted to ISO IRR by
10, current availability and original canonical image/URL identifiers. Do not
invent review ratings, GTIN, shipping or return policy merely to silence optional
warnings. A Google Rich Results Test service error is recorded separately from
local JSON syntax/required-property validation, not called a schema failure.
