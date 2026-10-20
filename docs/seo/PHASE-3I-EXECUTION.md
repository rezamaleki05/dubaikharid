# Phase 3I — P0/P1 content and internal linking release

Date: 2026-10-20 (Asia/Dubai). Starting Production SHA: `7f274ffd9bdd5fff8b188ee93d8e50d62d9c3dae`. Branch: `codex/p0-p1-organic-growth`.

## Selected scope and evidence

The Phase3H research remains the historical evidence record. Its37clicks/464impressions,54-day available history and small samples do not establish rankings for the edited non-Homepage pages: disclosed landing-page activity was concentrated on Homepage. These are appropriate existing destinations for the measured query intents, not a claim that each destination already holds the reported query position.

| Action | Query / primary intent | Existing URL | Evidence / business purpose | Overlap control |
|---|---|---|---|---|
|P0 C01|سفارش از دبی; procedure/cost|`/buy-from-dubai`|GSC query11.4position/5impressions; historical AI12landing sessions; clarify exact link→review→quote.|Service/how-to; no Homepage head-intent rewrite.|
|P0 C02|سایت خرید کفش از دبی; shoe choice|`/sports-shoes`|GSC query8position/3impressions; source/code/sizing guidance.|One clean shoe destination; existing facets remain noindex.|
|P1 C03|Amazon selected offer|`/stores/amazon`|Phase3H store SERPs; seller vs shipper and option/cost distinctions.|One Amazon route.|
|P1 C04|Noon UAE ordering|`/stores/noon`|Phase3H store coverage; compare seller/country/bundle.|One Noon route.|
|P1 C05|Namshi sizing/order|`/stores/namshi`|Phase3H store coverage; explain two Persian spellings and actual size standard.|One route for نامشی/نمشی.|
|P1 C06|SHEIN SKU/size/order|`/brands/shein`|Phase3H store coverage; exact SKU/options/personal discounts.|No second SHEIN landing.|
|P1 C07|Nike source/style code|`/brands/nike`|Phase3H source/model opportunity; full style code/group/size.|Brand owns Nike; collection owns general shoes.|
|P1 C09|Temu country/eligibility|`/guides/temu-ordering`|Phase3H conditional purchasing intent; country/currency/offer limitations.|Existing guide retained; no duplicate Store route.|
|P1 C12|Stock inspection criteria|`/guides/stock-laptop-checklist`|Phase3H evidence gap; distinguish checks, recorded facts and unknowns.|Inspection guide; no invented tests or new generic glossary.|
|P1 C13|Stock inventory selection|`/stock-laptops`|Phase3H retail pillar; real model links and selection context.|List owns inventory, model owns exact identity, guide owns inspection.|

Two P0 actions and eight P1 content actions are selected. No new route or Laptop guide; the existing inspection asset has higher P1 confidence than the three P2 guide proposals.

## Implementation

- Existing pricing function and current financial settings render an explicitly educational200AED/1.2kg example at request time. Assumed inputs are not a real Product/quote. Missing settings produce an explanation without invented numeric rates. Pricing code and settings are unchanged.
- Three source-specific Store checklists, two Brand checklists and two added Temu direct answers. The three existing Store intros/answers remain differentiated; navigation now uses relevant source-specific destinations.
- Shoe guidance, breadcrumbs and source/sizing/cost links are server-authored within the existing catalog. Request-time rendering prevents a static search-param fallback from hiding guidance in the rendered response. Catalog scope/filter/pricing/cart behavior is unchanged. Shoe title/description align with model/size intent; canonical remains `/sports-shoes`.
- Laptop checklist adds six inspection-criteria rows explicitly labelled **not a completed test report**. Stock list adds workload/display cautions, inspection link and SSR links derived only from real public model groups.
- No fake Product, inventory, benchmark, reviewer, inspection result, shipping promise, official partnership or customer statistic.
- Existing visible FAQ schema on the ordering page is unchanged and still matches its existing visible FAQs. New content uses semantic headings/tables, no new FAQ/HowTo/Review/AggregateRating schema. Shoe BreadcrumbList added. No new sitemap URLs.
- Existing IndexNow URL eligibility/change paths and publish hooks remain intact; no submission, resubmission or Google indexing request is part of this phase.

## Adidas boundary

Explicit READ ONLY Production check: no Adidas Store or Brand row. The Brand page resolves a public catalog row, so an entry in `brandGuides` alone cannot create a legitimate public page. `/brands/adidas` remains404; no phantom entity/fallback page, Store seed, Product or inventory was created.

Required separate owner approval: confirm legitimate Adidas UAE purchasing support and authorize creating exactly one real catalog entity through existing protected Admin service, with approved name, official source URL, public visibility/route and optional image. Review whether Brand or Store is appropriate in that catalog; do not create both merely to rank. A Store route follows `/stores/{id}`; a Brand route follows `/brands/{id}`. No such Production write is authorized or performed here.

## Intent / backlink boundary

Homepage source and dependencies remain byte-for-byte frozen against the existing manifest/exceptions. Commercial broad intent and H1 remain خرید مستقیم از دبی / خرید مستقیم از دبی و ارسال به ایران. Ordering guide owns procedure/cost; store pages own exact source details; shoe facets remain navigation/noindex; Laptop model and unit identity rules are unchanged.

No outreach, placements or backlink purchase. The improved cost methodology and inspection checklist can support prospect qualification, but the latter is a **criteria asset**, not original measured inspection research. A future pitch must not describe it as completed testing. Quantified backlink/keyword intersections still require legitimately entitled data access.

## Validation record

- Focused SEO/content/canonical/facet/Homepage/IndexNow checks:65PASS.
- Full suite:682total,675PASS,0FAIL,7existingSKIP.
- Prisma validate and generate PASS; no schema/migration change.
- Lint:0errors,48existingwarnings.
- Next production webpack build and integrated TypeScript PASS. A missing local auth secret was resolved with a process-only random secret; no application auth shim or Production environment change.
- Local server used verified Production endpoint with forced read-only PostgreSQL connections; all sends/upload credentials disabled in that process only. Initial pooled connection timeout was resolved using the already configured direct endpoint; no application DB behavior changed.
- Local HTTP checks: selected pages, representative Product/Laptop, both shoe facet states HTTP200 and apex canonical; Adidas404 retained. Guidance exists in SSR HTML; facets return `X-Robots-Tag: noindex, follow`.
- Responsive browser review at390,768,1440px for service/store/shoe/inspection/list templates; no document-level horizontal overflow. Tables can scroll within keyboard-focusable labelled regions. Existing light/dark theme behavior preserved.
- Fresh pre-release Homepage mobile LAB smoke: LCP2.279s,CLS0.00265. Prior approved run1.850s/0.0116 remains historical; compare against a fresh same-method post-release run, not field CWV.

Release/source SHA and final live verification are recorded in the subsequent execution-log update; Phase3H evidence is retained unchanged except explicit status columns/append-only execution notes.
