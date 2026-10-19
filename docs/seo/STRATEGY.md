# DubaiKharid SEO / AEO / GEO foundation

Owner review draft — 19 October 2026, Asia/Dubai. Base: `a1018916c30dac77e021295aa6efbd041572e49f`. No Production release in this phase.

## Guardrails and evidence

Homepage owns **خرید مستقیم از دبی**. Its source, Hero, CSS, shared Header/Footer, root metadata/layout and Context providers are frozen by SHA-256 in `homepage-freeze.json`. Nothing is added to its copy, layout, typography, navigation or animation. No ranking promise is made.

Owner-supplied GSC observations: خرید مستقیم از دبی 8 clicks / 32 impressions; سایت خرید کفش از دبی 1 / 3; خرید از دبی 11 impressions; سفارش از دبی 4; خرید از امارات 1; خرید از سایت های امارات 1. Period, country, device and average position were not supplied. These are site observations, **not market search volumes**. All global volumes are unavailable. The reported page-one ranking is owner evidence, not an independently measured rank.

`MASTER-KEYWORD-MAP.csv` maps 146 supplied phrases/questions to intent owners. Existing URL means a route, not proof of inventory. New guides exist only in this branch. No Product/model page should exist without a real record. Adidas has no current public Brand record; its prepared content profile is dormant until a legitimate record exists. No Production record was added. Brand directory visibility remains the owner-controlled gate.

## Audit and decisions

| Severity | Finding | Evidence / decision |
|---|---|---|
| P0 | No verified Homepage indexability emergency | Public root: 200, one exact H1, expected title/canonical, index/follow. Frozen. |
| P1 | Product visible content waits for client fetch | Server entry now gets the same public Product service used by API; existing client owns interactions. Authoritative initial snapshot removes loading-only HTML and duplicate initial fetch. Hidden/missing Products remain notFound; slug aliases permanently redirect to ID URL. |
| P1 | Store/Brand page N canonicalizes to page one | Pure collection policy now gives valid page N its own canonical. Facets are noindex, tracking is omitted, invalid page values return notFound. |
| P1 | Nonexistent pagination is an indexable empty 200 | Live `/stores/amazon?page=9999` confirmed 200 before work; branch uses actual catalog totalPages to return notFound. Empty first-page service guides remain useful, not fake inventory. |
| P1 | Known useful Store guides absent from sitemap without stock | Existing Amazon/Noon/Namshi service pages with substantive answers are discoverable even with no Product rows. Curated SHEIN/Nike/Adidas profiles require visible existing Brand records. Generic empty Brands remain noindex and excluded. |
| P1 | Catalog facet permutations have no explicit noindex header | Explicit category-path query rules add X-Robots-Tag for sub/sort/brand/brands/category/q only. Root and detail URLs are excluded. Store/Brand pagination uses metadata, not this header. |
| P2 | Zero-review Product displays five-star average | Now displays a dash; no fabricated Review/AggregateRating schema added. |
| P2 | Robots private base paths are not explicit | Base admin/profile coverage added while preserving current descendant rules and public assets. Private route noindex remains. |
| P2 | Core guide duplicates Homepage head term | Recorded prior H1/title and preserved body; procedural guide now owns site-ordering/cost intent and links to three practical guides. Root unchanged. |
| P2 | www and apex both serve 200 with apex canonical | Existing behavior. **No host redirect or Homepage canonical change**; owner decision and migration plan required before normalization. |
| P2 | Broad category pages rely on client catalog loading | Existing H1/metadata present; Product detail SSR fixed now. Evaluate separate server catalog work with real category inventory and pagination before larger refactor. |
| P2 | Some desired verticals lack inventory and operational proof | Perfume, supplements and dedicated health wearables remain plans, not invented commercial landing pages. No speculative Product pages. |
| P2 | Physical warehouse routes redirect to Homepage | Existing permanent legacy behavior retained. Review historical link/value evidence before any change. |
| P2 | Core Web Vitals field data unavailable | No CrUX/GSC CWV export supplied; no LCP/CLS/INP pass claimed. Product SSR and fixed Brand-logo dimensions are concrete technical changes, not proof of field scores. Hero untouched. |
| P3 | No full acquisition attribution / AI mention baseline | Implement measurement process below; no new tracking credentials or scripts. |

Missing entities return 404/noindex through Next notFound. Streaming responses can carry noindex even when status is committed early; verify representative production URLs after any later release. Public external sources stay sourcing metadata. Product canonical, OG URL, structured Product URL and Telegram CTA remain first-party. Laptop model identity, available-unit rules, schema and pricing remain unchanged.

## Architecture and content ownership

- `/`: purchase-from-Dubai head intent, frozen.
- `/buy-from-dubai`: procedural order workflow, cost inputs, shipping factors and limitations.
- `/stores/amazon`, `/stores/noon`, `/stores/namshi`: separate seller/variant/size/source-order intents; no duplicate alias landings.
- `/brands/shein`: one SHEIN guide for all spelling/region variations, with apparel sizing and request completeness. No assertion of guaranteed acceptance or official affiliation.
- `/brands/nike`: model/style-code, standard/group and source identity. Adidas equivalent is prepared but gated by a real Brand record. Michael Kors remains its real ID-based route; Product details own Parker and Amara exact identity.
- `/sports-shoes`, `/bags-accessories`, `/clothing`, `/beauty-health`, `/watches`: existing commercial collections, not one page per keyword. Sports shoes cannot fully own dress-shoe queries without relevant stock/content; watches cannot imply every health wearable is stocked.
- `/stock-laptops`: broad stocked Laptop intent. `/laptops/{slug}`: actual available model. Model names/specs never fabricated.
- `/product/{id}`: real Persian/English Product identity and legitimate style number. No broad Dubai stuffing in every title.
- `/guides/uae-store-comparison`, `/guides/shoe-sizing`, `/guides/stock-laptop-checklist`: three distinct decision tasks, not mass generated articles.

Design: restrained Persian editorial layout, existing Vazirmatn and theme variables, numbered question sections, readable measure and generous whitespace. DFII: impact 4 + fit 4 + feasibility 4 + performance 4 − consistency risk 2 = 14. No new animation, font, 3D or Homepage style. Guide → commercial parent → actual Product is the internal-link path. New content is server rendered. Visible breadcrumbs and JSON-LD agree; each template has one H1. No new FAQPage, reviews, GTIN/MPN, endorsements, author identities or fake dates.

## AEO and GEO editorial standards

Question H2 immediately followed by 2–4 direct factual sentences; expand only where it helps a buying decision. Answers explain input requirements, missing information and confirmation steps. Existing visible FAQ is retained; no FAQ rich-result promise. Google's current AI guidance says ordinary indexability and helpful content remain the foundation; no special AI text file or special schema is required. [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

Information gain should come from actual workflows: precise link plus selected seller/color/size; initial estimate versus confirmed price; source price, exchange rate, commission and weight-based transport; real model-versus-unit differences. Never expose private operational identifiers, credentials or internal stock costs. Citation eligibility is not citation certainty. Record answer-engine citations with query, date, locale and cited URL; do not infer a ranking factor from anecdotes.

Trust: About already describes an independent Persian-language service; global Organization/WebSite identity is already consistent with DubaiKharid/دبی خرید. No invented licenses, partnership, locations or years added. About's internal implementation wording, policy completeness and contact facts should be reviewed by the owner. Obtain actual cancellation/returns boundaries, inspection evidence, payment/refund timing and support escalation before publishing policy promises. Keep policy drafting separate from legal advice. Supplement content needs lawful source/category and actual shipping eligibility confirmation; no prescription/prohibited/unsafe product targeting or health claims.

## Research notes (not a rank census)

Discovery used Persian shopping queries on 19 October 2026. Results vary by locale, time and personalization; no exact competitor ranking/traffic claim.

[Padoon SHEIN landing](https://padoonuae.ir/buy-from-shein/) combines a purchase request form with shopping navigation. [Kadooyab Amazon page](https://kadooyab.com/amazon) emphasizes product information and cost estimation. The useful gap for DubaiKharid is a concise, verifiable description of what to send, seller/variant ambiguity, and what the estimate does not confirm—not copying their prose or guarantees. Their business claims were not independently verified.

Pagination is self-canonical rather than canonical-to-first under [Google ecommerce pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading). Facets should not multiply indexable intent; see [Google facet guidance](https://developers.google.com/crawling/docs/faceted-navigation). Helpful content must serve people and provide original value; see [Google people-first guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## Measurement workflow

1. Export GSC Web performance monthly, retaining query/page/date/country/device/search appearance; keep unrounded counts. Compare rolling 28 days to preceding 28, and year-over-year when available. Preserve query privacy omissions; do not treat missing rows as zero.
2. Filter Homepage exact URL + خرید مستقیم از دبی separately from all Dubai/UAE phrases. Freeze targeting; investigate sustained changes before proposing edits. Clicks/32 alone do not justify rewriting a winner.
3. Group Dubai/UAE, SHEIN, Amazon, Noon, Namshi, Nike/Adidas, Shoes, Bags, Clothing, Perfume, Beauty, Supplements, Wearables, Laptops and real Products. Track clicks, impressions, CTR=clicks/impressions, average position, landing page and indexed coverage. Zero impressions => CTR unavailable.
4. Only consider CTR tests for pages with sufficient repeated impressions and matching intent. Change one route/template element, date the intervention, and compare country/device and position cohorts; avoid attributing seasonality to a title edit.
5. Use URL Inspection and Rich Results Test after a separately approved release. Review canonical selection, hidden-record exclusion, invalid pagination, mobile rendering and actual field CWV. Never bulk-request indexation of faceted URLs.
6. Track qualified inquiries/orders through existing analytics only after validating consent/attribution. No credentials, analytics settings or tracking code changed here.
7. AI visibility: monthly fixed prompt panel for order process, store comparison, sizing and Laptop selection; record engine/version/locale/date, source URL and answer accuracy. GSC AI-feature traffic is included in Web reporting, not an independent attribution guarantee. [Google measurement notes](https://developers.google.com/search/docs/appearance/ai-features).

## Content and owner approval queue

| Wave | Asset | Value / prerequisite |
|---|---|---|
| Now, branch only | Three implemented guides + existing rich Store/Brand routes | Owner factual/tone review before release; no invented stock. |
| 1 | Real buying-cost worked example | Owner provides anonymized actual quote, date, allowed public cost components and confirmation outcome. |
| 1 | Returns/cancellation/payment/support pages | Owner-approved actual policy text; no invented deadlines. |
| 1 | Shoe commercial collection breadth | Real relevant stock + size/category taxonomy; avoid sports/dress conflation. |
| 2 | Perfume authenticity/shipping guide | Authorized sourcing proof and actual packaging/transport limits before commercial page. |
| 2 | Beauty/skincare sourcing guide | Product labels, shades, ingredient/source evidence; no medical efficacy claims. |
| 2 | Wearables comparison | Real stocked model specs; no invented health accuracy claims. |
| 3 | Mainstream sports nutrition | Lawful product eligibility, sourcing and transport evidence; owner review before publication. |
| Ongoing | Real Product/model detail enhancements | Genuine style codes/specs/cover photos and factual inspection evidence. |

## Off-page plan and risk policy

No outreach, links purchased, placements, accounts or messages in this phase.

**LOW RISK — recommended:** earn editorial citations for genuinely useful comparison/sizing/inspection resources; answer relevant editorial requests with verifiable expertise; request accurate factual business mentions from genuine existing partners; maintain consistent public business identity on legitimate relevant directories; publish first-party anonymized buying examples; contribute expert explanations with editorial discretion. Screenshots or evidence must exclude private customer details. Links remain the publisher's editorial decision.

**MEDIUM RISK — review separately:** paid sponsorship/native advertising or compensated partnerships require transparent disclosure and appropriate link qualification. Not a routine organic ranking tactic; no action authorized here.

**HIGH RISK — reject:** PBNs, bulk backlink packages, fake press releases/sites, mass directories, automated/forum/comment spam, fake reviews, hacked links and paid sitewide footer links. No normal implementation recommendation.

Digital PR targets: relevant Iranian ecommerce/fashion/technology editors, legitimate UAE shopping resources and Laptop/IT publications with a real audience. Evaluate topical fit, editorial standards, accuracy, referral usefulness and disclosure—not invented authority scores. Use the store checklist, real calculator methodology, sizing workflow and actual Laptop inspection case studies as linkable assets. Consistent DubaiKharid/دبی خرید mentions matter as factual identity; no promised AI citation uplift.

## Top 20 next actions

1. Owner-review this branch and the actual Persian answers.
2. Review Product SSR/gallery/cart behavior with legitimate data in a later approved release QA.
3. Approve deployment separately; no release here.
4. Capture a dated GSC export with page/country/device and preserve Homepage baseline.
5. Validate changed URLs with URL Inspection after release.
6. Confirm Google-selected canonical remains unchanged for Homepage.
7. Verify page-N self-canonical and impossible-page noindex/404 after release.
8. Submit/check updated sitemap in existing Search Console account after release.
9. Validate rich Store/Brand discovery without fabricating inventory.
10. Add legitimate Adidas Brand data only when owner intends to offer it; no orphan links meanwhile.
11. Expand real shoe assortment/taxonomy before targeting dress-shoe queries broadly.
12. Supply one anonymized actual cost calculation example.
13. Approve accurate returns/cancellation policy and support path.
14. Verify About/contact/address claims against owner records.
15. Obtain CrUX/GSC CWV data and prioritize measured non-Homepage bottlenecks.
16. Evaluate server-rendered category pagination in a dedicated catalog task.
17. Publish real perfume/beauty sourcing guidance only with evidence.
18. Build a real wearable comparison only for available models.
19. Run monthly consistent AI citation/accuracy observations.
20. Earn relevant editorial citations with evidence-backed assets; no link buying.

## Phase 3C review addendum

The sections above record Phase 3B at its original evidence date. Phase 3C updates the map to 160 rows, clarifies multi-store ordering and adds a conditional Temu guide while preserving the three prior guides and all Homepage visible content/metadata. Root analytics wiring is the sole frozen-layout exception; hash tests normalize that exact replacement. See [content review](PHASE-3C-CONTENT-REVIEW.md) and [analytics owner plan](PHASE-3C-ANALYTICS-OWNER-PLAN.md) for current supplied metrics, production-only tracking guards, host audit correction, prerequisites and limitations. The current host observation supersedes the earlier audit table's both-hosts-200 observation; no host configuration was changed.
