# Phase 3H — competitor, keyword and authority research

Research date: 20 October 2026, Asia/Dubai. Production/source reference: `7f274ffd9bdd5fff8b188ee93d8e50d62d9c3dae`. Research only; no implementation, commit, push, deployment, submissions or outreach.

## Decision

Prioritize the existing ordering guide, shoe collection, store pages and Laptop pillar. Protect the Homepage: primary intent **خرید مستقیم از دبی**, H1 **خرید مستقیم از دبی و ارسال به ایران**. DubaiKharid / دبی خرید is an independent multi-store Dubai/UAE purchasing service: customers provide a Product URL and the service checks and handles the purchase where legally and operationally supported. Stores are examples, not service boundaries.

The strategy is actionable, but the full competitor backlink and keyword intersection is incomplete. Ahrefs login succeeded; the free account blocks unverified-domain Site Explorer and paid Competitive Analysis. No verification, Google authorization, subscription or account settings were changed. GSC supplies real first-party data; public SERPs and pages support content opportunities, not fabricated keyword volumes, KD or complete competitor rankings.

## Evidence and limits

- Authenticated GSC Domain property `sc-domain:dubaikharid.shop`, Web (text-based), exported CSV through its existing UI. Files in [phase3h-evidence](phase3h-evidence/). Three-month selector exposes only **2026-08-25–2026-10-17**, 54 days of available records; a complete 90-day history is unavailable. Do not pad missing history with zeros.
- Comparison UI: current **2026-09-20–2026-10-17**; prior available **2026-08-25–2026-09-19**, only 26 days, despite the UI label “Previous 28 days.” Percent changes are descriptive and not a perfectly balanced experiment. GSC timestamps/reporting boundaries are not Dubai local-day event timestamps.
- GA4 Windsor.ai read-only connector, correct DubaiKharid property `551798888`; requested 2026-07-20–2026-10-17, first returned activity August 27. No configuration changes. Historic Admin/owner contamination remains material.
- Live Google desktop Persian SERPs, signed-in account, Dubai/UAE location, October 20. **Personalized/localized observations**, not neutral Iran-wide ranks. Position counts below count ordinary result blocks, exclude AI citations/video groups, and are approximate snapshots. Google AI Overview observed on core query; no persistent AI citation claim.
- Live Bing core SERP observed separately. Web search connector expanded cluster discovery; its result order is **not** presented as Google/Bing position. Irrelevant semantic matches, app listings and promotional Reddit self-posts were filtered out.
- Public sitemap: 34 URLs; 33 initial HTTP200, one timeout subsequently HTTP200. HTML audit saved as [PUBLIC-PAGE-AUDIT.csv](phase3h-evidence/PUBLIC-PAGE-AUDIT.csv). Sitemap presence/self-canonical/no noindex means technically eligible, not proof of Google indexing. Word counts are whitespace estimates **including navigation/footer**, not a target word count.
- Bing Webmaster existing apex site was readable; Home reported processing/up to48h, own Backlinks “No data available.” A competitor comparison lookup returned no data; no sitemap/indexing submission or configuration action. A direct performance view did not yield a usable report. No Bing baseline fabricated.
- Public primary pages and source routes were inspected. Competitor structured-data types are presence checks, not validation or rich-result guarantees. No raw licensed third-party exports stored.

## First-party organic baseline

| Metric | Available three-month report | Latest period | Prior available period |
|---|---:|---:|---:|
| Clicks |37|24|13|
| Impressions |464|244|220|
| CTR |7.97% (UI8%)|9.84%|5.91%|
| Average position |8.0 rounded UI|7.1 rounded UI|8.9 rounded UI|

Clicks +84.6%, impressions +10.9%, CTR +3.93 percentage points, but prior period is truncated and counts are small. Do not attribute historical changes to releases deployed October20.

| Query | Clicks | Impressions | Position | Latest vs prior interpretation |
|---|---:|---:|---:|---|
|خرید مستقیم از دبی|8|34|7.88|3 vs5 clicks;20 vs14 impressions;7.40 vs8.57 position. More visibility but lower CTR15% vs35.71%; mixed, not an unqualified win.|
|سفارش از دبی|1|5|11.40|1 vs0 clicks;3 vs2 impressions;8 vs16.5 position; directional improvement only.|
|سایت خرید کفش از دبی|1|3|8.00|1 vs0 clicks;2 vs1 impressions;7.5 vs9; tiny sample.|
|خرید از دبی|0|11|23.27|8 vs3 impressions;21 vs29.33; small directional improvement.|
|خرید از امارات|0|1|2.00|One impression; not an actionable rank proof.|
|خرید از سایت های امارات|0|1|74.00|No latest-period row with impressions; not a position4–30 quick win.|

All13 disclosed queries total only **10 clicks/95 impressions**, vs37/464 property totals. GSC privacy omissions prevent a complete branded/non-branded split. No exact DubaiKharid brand query is visible; disclosed relevant non-brand queries account for10 clicks/55 impressions, while seven deprioritized/other-brand phrases account for0/40. **27 clicks/369 impressions are not query-attributable in this export**; do not call them branded or non-branded.

Raw position cohorts: ten queries at4–15; one at11–20 (سفارش از دبی); one at21–30 (خرید از دبی). After removing seven explicitly deprioritized/other-brand phrases, **three relevant candidates at4–30**, of which two at4–15. These are candidates, not guaranteed quick wins. Core phrase is frozen; shoe and ordering pages need query→page confirmation before editing.

Declines: core phrase clicks5→3 despite rank improvement; لباس دبی impressions9→4; قیمت لباس در دبی4→1; لباس دبی زنانه7→0 and مردانه3→0. Missing impressions do not imply position0. Do not chase these deprioritized clothing terms or competitors’ brand terms. No statistically reliable declining commercial-query trend established.

Landing pages: apex Homepage36 clicks/392 impressions; WWW Homepage1/65; legacy WWW `/women?sub=shoes`0/6; legacy WWW `/admin`0/1. Latest period apex Homepage24/244; no other page has reported impressions. Historical WWW records do not prove current duplicate indexing; live canonical alignment already exists. Private Admin impression is historical: check coverage later, do not change removal/robots settings in this phase.

Device split: Mobile30 clicks/413 impressions (81.1% of clicks,89.0% of impressions); Desktop7/50; Tablet0/1. Country split: Iran29/419, UAE8/33, US0/3, UK0/2, Afghanistan0/2, Netherlands0/2, Germany0/1, Turkey0/1, Bulgaria0/1. Iran and mobile dominate measured discovery.

GA4:215 sessions total — Direct84, AI Assistant55, Organic Search41, Referral35. Latest/prior28-day organic29/12; AI18/37. Organic landing breakdown: `/`34, Admin routes5, `(not set)`1, historical Product1. AI: Homepage43, `/buy-from-dubai`12. Eleven `whatsapp_click` events: AI5, Organic2, Direct3, Referral1; no `lead_created` row returned for this historical interval. Missing event rows do not prove broken current collection. These events are not unique customers or sales. Historic Admin traffic must be segmented analytically, not deleted or reconfigured here.

## Primary competitors — ten domains

| Domain / role | Observed query and ranking URL | Approximate observed position | Why it matters / format / depth / CTA / links / answer evidence |
|---|---|---|---|
|malltina.com — direct service + publisher|[UAE hub](https://malltina.com/asia/uae), خرید مستقیم از دبی; Amazon UAE|Google1 core;3 Amazon; Bing4 core|Strongest core snapshot; dedicated service hub plus SHEIN/Noon/Namshi magazine guides. Google core AI Overview cited it. Local fetch redirect-loop: full depth/schema/CTA not independently inspected; no invented authority score.|
|iranicard.ir — direct service + publisher|[Amazon UAE](https://www.iranicard.ir/payments/shopping/amazon/amazon-ae/), خرید از آمازون امارات; [UAE service](https://www.iranicard.ir/payments/shopping/emirates/)|Google2 Amazon;4 core|Strongest inspected store/service conversion format: calculator, steps, seller/options, cost table, purchase CTA. ~4560 whole-page words includes repeated terms/navigation. WebPage/Breadcrumb/FAQ schema; broad related-store links. Digiato link independently verified.|
|azdubai.ir — direct service|[Homepage](https://azdubai.ir/), [SHEIN](https://azdubai.ir/shein-uae/), [Adidas](https://azdubai.ir/adidas-uae/)|Google3 core;5 Amazon;1 SHEIN;2 Noon/Nike/Adidas;1 Namshi;2 Temu;Bing1 core|Most consistent observed Persian store coverage. Store navigation, category clusters, FAQs, quote/chat CTAs and ordered steps. Homepage~2816 words;SHEIN~4903 including chrome. SHEIN FAQ/Article/Breadcrumb schema. Do not copy unsupported delivery/authenticity claims or generic brand-history padding.|
|mozono.ir — direct service|[Homepage](https://mozono.ir/), خرید از آمازون امارات|Google4 Amazon|Amazon-focused service/product catalog; ~2420 whole-page words; WebSite/Organization schema. Quote/order and product navigation. Amazon positioning is competitor-specific, not DubaiKharid’s whole entity.|
|kavantamin.com — direct service + publisher|[Noon](https://kavantamin.com/online-shop/noon-uae/), [UAE](https://kavantamin.com/online-shop/uae/)|Google6 Noon,3 Namshi guide;Bing3 core|Dedicated foreign-store pages and magazine pathway. Live SERP coverage verified; page fetch failed, so schema/depth/internal CTA details unavailable.|
|orfume.ir — direct niche service|[Adidas](https://orfume.ir/buy-adidas-dubai/), Adidas and perfume/wearable queries|Web-search lead result for Adidas; Google Adidas top6 did not show it; no Google rank claimed|~1116 whole-page words, article/FAQ/service/breadcrumb schema. Product/brand and guide cross-links; ordering CTA; short source/size/process answers. Do not infer strong rankings from schema count.|
|nomoras.com — direct niche service|[Dubai service](https://nomoras.com/kharid-az-dubai/), shoes/bags/beauty clusters|Found in web-search core/category samples; Google rank unmeasured|~1168 whole-page words; procedural headings, FAQ/breadcrumb schema; Product vs request-item CTA; category and source/authenticity links. Useful intent split; competitor delivery claims are not DubaiKharid policy.|
|raitop.ir — specialist direct Laptop|[Workstations](https://raitop.ir/usertypes/workstations/), لپ تاپ ورک استیشن استوک|Google1 workstation snapshot|Strongest observed workstation result: real inventory, workload/CPU/RAM/GPU/display filters, model cards, warranty/info links, chat/cart CTAs. Page showed72 listed items. Shahrsakhtafzar PR backlink verified; authority score unavailable.|
|dokmeha.com — specialist direct Laptop|[Workstation collection](https://www.dokmeha.com/product-category/laptop/laptop-user-category/laptop-workstation/), multi-model Precision/ZBook query|Web-search connector lead result; Google rank unmeasured|CollectionPage/Breadcrumb schema; extensive model/spec/condition cards, filters, category/brand links, purchase CTAs;~13117 whole-page words largely inventory/navigation. Exact units matter more than matching word count.|
|qeshmoff.com — specialist direct Laptop|[Stock collection](https://qeshmoff.com/shop/stock), لپ تاپ استوک|Web-search result3; Google rank unmeasured|~3949 whole-page words; Collection/ItemList/FAQ/Breadcrumb schema; stock-vs-used answers, genuine inventory and model links/cart CTA. Retail-pillar content benchmark.|

Approximate positions are not market-share/traffic/DR estimates. No numeric difficulty or authority values available. All fetched competitor-copy summaries are brief original observations; retain source URLs for reinspection.

## Secondary set — sixteen, kept separate by role

Direct/adjacent: `uaepc.com` (UAE B2B wholesale expertise, not same retail intent), `rinotek.com`, `stockland.ir`, `stokala.com`, `avvalstock.com`, `laptopsara.com`, `celestonlineshop.com`, `dubaichicshop.com`, `gatekala.ir`, `sepahanhamrah.com`, `iraniandubai.com` (freight adjacency).

Publisher/content: `shahrsakhtafzar.com` (original buying guide plus separately labelled PR), `techtip.ir`, `it-planet.ir`, `mehrparvaz.com`, `sepex.net`. Secondary does not mean every domain ranks across all clusters.

Marketplace/store domains: Amazon.ae, Noon.com, Namshi.com, Nike.ae, Adidas.ae, SHEIN and Temu own navigational/product intent; Torob/Sheypoor appear for Laptop comparison/listing intent. Do not include all as direct service rivals. Forum/UGC: Reddit model comparisons and Instagram sellers appeared, but self-promotional spam and follower counts were excluded from authority evidence; no forum-seeding recommendation.

## Current store coverage and decision

All HTTP200 routes below were in the live sitemap, self-canonical and without noindex. None has an individual landing-page impression/click row in the GSC export; this is **not proof they are unindexed**. Shared schema includes Organization/WebSite and BreadcrumbList. Store/brand answers are visible headings/text, not FAQ rich-result entitlement.

| Cluster | Existing route / depth estimate | Answer coverage | Recommendation / specific missing differentiation |
|---|---|---|---|
|SHEIN|`/brands/shein`,569 words|4 answers; code/size/price/eligibility; category links and quote CTA|EXPAND with one checked SKU example, discount/return caveats, sizing photos; keep route.|
|Nike|`/brands/nike`,491|2 answers; style-code/sizing; shoe guide link; quote CTA|EXPAND legitimate source/code/offer comparison; never claim official representation.|
|Temu|`/guides/temu-ordering`,514|4 answers;country/currency/eligibility;service/comparison links|KEEP + EXPAND eligibility worked example; do not promise universal UAE availability or add duplicate landing now.|
|Adidas|`/brands/adidas` **404**, absent sitemap|Approved source guide exists in `commerceGuides.js`, but unavailable publicly|NEW PAGE in a future authorized phase through legitimate existing catalog architecture; no fabricated Brand/Product rows.|
|Amazon UAE|`/stores/amazon`,521|3 answers; seller/shipper/cost; calculator CTA|EXPAND with one exact-offer landed-cost example and policy-source links.|
|Noon|`/stores/noon`,466|2 answers; selected UAE offer;calculator CTA|EXPAND seller/option and return-review examples; link comparison guide.|
|Namshi|`/stores/namshi`,464|2 answers; size/return;calculator CTA|EXPAND both Persian spellings on same URL, exact size standards and order example.|

Main architecture is already sound: no mass store-page creation. Incoming-link sample: comparison guide6 distinct sitemap pages, sizing5, store pages2 each, Temu1, stock-checklist1, `/buy-from-dubai`33 (mostly shared/global). Counts are observed HTML-page links, not PageRank; an outgoing footer link repeated33 times does not substitute for contextual discovery.

## Category and Laptop gaps

| Topic | Best near-term format | Intent / boundary |
|---|---|---|
|Original shoes/sneakers|EXPAND `/sports-shoes` + existing sizing guide|Collection owns خرید; guide owns how-to/size. GSC evidence supports this first.|
|Bags|EXPAND `/bags-accessories` + actual model pages|Model/material/size/source evidence; do not create another generic bags route.|
|Clothing|Existing `/clothing`; SHEIN store page for store intent|No architecture around لباس دبی variants.|
|Perfume|Buying/source/transport section in `/beauty-health`; later collection conditional on genuine range|Do not promise shipping eligibility or authenticity from batch code alone.|
|Cosmetics/skincare|Existing beauty collection + source/expiry checklist|No treatment claims or thin generic skincare articles.|
|Legal supplements|Eligibility-first support section, P3|Operational/legal review before content expansion; no blanket legality/availability claims.|
|Smartwatches/health wearables|Existing `/electronics` + exact Product pages; compatibility guide later|Confirm `/watches` scope before mixing wristwatches and smartwatches; subscription/region distinctions.|
|Laptop Stock|EXPAND `/stock-laptops` retail pillar + existing checklist|Exact available unit, condition, display/battery evidence, Toman price.|
|Workstations|Substantive section within pillar first; one workload-selection guide|Separate engineering/editing requirements from broad brand hype.|
|Exact Products/models|Existing canonical `/product/{id}` and `/laptops/{slug}`|Actual variants/units; no generated model pages without legitimate inventory.|

Laptop topology: `/stock-laptops` → exact Precision5530/7510/5510, Latitude5580 and ZBook15G3 pages → relevant checklist; checklist → list + applicable model pages. A future workload-selection guide links actual configurations for engineering/editing; a Precision-vs-ZBook guide compares exact generations, not whole brands; one display guide covers FHD/4K/touch/battery/scaling. Lenovo ThinkPad/P-series remains conditional on real inventory. Existing definition/checklist should absorb stock-vs-used questions rather than another thin glossary page.

## /buy-from-dubai audit

Live H1 **راهنمای سفارش از سایت‌های امارات**; title **راهنمای سفارش از سایت‌های امارات و محاسبه هزینه**; apex self-canonical; initial HTML has workflow, pricing assumptions, shipping/eligibility,7 FAQs and direct quote CTAs. FAQPage and breadcrumbs present. Approx1021 whole-page words. It already has multi-store entity clarity and appropriate limitations. GSC supplies no individual landing-page row; current ranking unknown. GA4 AI Assistant12 landing sessions is genuine historical signal, not proof of an AI citation or conversions.

EXPAND, not rewrite: use a dated, consented or explicitly illustrative cost walkthrough with inputs/fees/weight/currency and final-quote caveat; add a concise “what cannot be confirmed until review” block; explain request→review→confirmation with links to policies and stores. Keep immediate request CTA. Link from related store answers and existing guides, and use as outreach destination for process questions. Homepage remains commercial head intent; do not restore this page’s old “خرید مستقیم از دبی” H1, which still appears in a stale search-connector snapshot.

## AEO, GEO and SERP opportunities

Sixteen answer opportunities; format and owner page:

1. چگونه از دبی خرید کنیم؟ — direct4-step answer, `/buy-from-dubai`.
2. هزینه نهایی شامل چیست؟ — worked example/table, same page.
3. هزینه حمل چگونه تعیین می‌شود؟ — weight/assumption answer, shipping section.
4. زمان تحویل چه موقع تأیید می‌شود؟ — process/policy section; no invented days.
5. اگر فروشگاه در فهرست نبود چه؟ — short eligibility answer, same page.
6. چه کالاهایی قابل سفارش نیستند؟ — review/limitations section, no universal legal list without current official verification.
7. چطور فروشنده/منبع رسمی را بررسی کنیم؟ — source checklist, store/comparison pages.
8. فروشنده و ارسال‌کننده Amazon چه فرقی دارند؟ — Amazon answer.
9. چرا قیمت پیشنهادهای Noon متفاوت است؟ — Noon answer.
10. برای SHEIN چه کد/سایزی لازم است؟ — SHEIN answer.
11. نمشی/نامشی چه استاندارد سایزی دارد؟ — Namshi answer.
12. کشور/ارز Temu چرا مهم است؟ — Temu guide.
13. طول پا/کد کفش چگونه ثبت می‌شود؟ — illustrated sizing guide.
14. اندازه/جنس/کد کیف چگونه تطبیق داده می‌شود؟ — bags collection/model support.
15. اصالت/انقضا و شرایط حمل عطر/آرایشی چگونه بررسی می‌شود؟ — beauty support section; avoid medical assurances.
16. استوک، ورک‌استیشن،4K و لمسی برای چه کسی مناسب‌اند؟ — checklist plus substantive future workload/display guides.

Featured snippets/PAA are opportunities, not observed ownership. Prefer short accurate answers followed by evidence, comparisons and clear next step; no FAQ-schema spam. Google discontinued FAQ rich results starting May7,2026; current official documentation redirects to the updates page. Keep useful visible answers, but do not budget for FAQ rich-result traffic. Product and breadcrumb eligibility belongs genuine Product/model detail with valid price/availability; do not create fake ratings. Real high-quality source/variant images support image search. Merchant surfaces require separate eligibility/feed/account review; do not claim every cross-border service offer qualifies.

Observed core Google AI Overview cited Malltina, Iranicard and AZDubai; DubaiKharid appeared as an ordinary result but was not identified among captured citations. Action: make exact process facts easy to quote, maintain reviewer/date/source information, publish original inspection/quote methodology, and link supporting evidence. No special AI schema or guaranteed inclusion. GA4 AI55 sessions/5 WhatsApp events show a useful referral segment but not prompt-level attribution.

Trust/GEO priorities: verifiable About/operator/reviewer identity; authentic policies/contact; first-party annotated inspection images; dated cost methodology with assumptions; original store comparison and usable printable checklists; aggregate statistics only from sufficient consented/anonymized real records with denominator/date/sample limitations. Never invent partnerships, offices, licensing, review scores or first-party success rates.

## Backlink baseline and gap confidence

GSC External links **0**, top linked pages/sites/text all “No data”; internal links3 to Homepage. Bing own backlinks “No data.” This is search-engine reporting coverage, not a complete web census. DR, total web backlinks/referring domains, dofollow share, top anchors/strongest domains, new/lost links, sitewide/irrelevant/spam patterns remain **UNAVAILABLE**. No suspicious-domain accusation or disavow recommendation is warranted.

Two public source pages have verified competitor links and no DubaiKharid link **on those fetched pages**: Digiato→Iranicard; Shahrsakhtafzar→Raitop. This verifies link examples, not that those domains never link DubaiKharid elsewhere. Both are explicitly promotional/PR examples. Full domain-set subtraction for **each of ten competitors** remains unavailable; do not label the eight remaining prospect/mention/conditional rows in BACKLINK-GAP.csv as measured backlink gaps. See [OFFPAGE-STRATEGY.md](OFFPAGE-STRATEGY.md).

## Intent separation / internal-link plan

| Potential conflict | Target separation and linking action for future implementation |
|---|---|
|Homepage vs `/buy-from-dubai`|Homepage broad commercial intent; guide procedure/cost/eligibility. Preserve Homepage unchanged. Contextual guide→calculator, store→guide links.|
|Store pages vs generic guide|Store pages own seller/country/options for that source; guide owns service workflow. No keyword-variation duplicates.|
|`/sports-shoes` vs `/women?sub=shoes` and `/men`|Choose main indexable shoe collection for broad commercial intent; filtered discovery should follow existing canonical rules. Check GSC URL-level evidence before proposing changes.|
|Collection vs sizing/authenticity guides|Category owns available purchasing options; guide owns how-to evidence; exact model page owns exact Product query.|
|`/stock-laptops` vs `/laptops/{slug}`|List owns inventory-wide stock/workstation intent; model page exact model with actual units. No duplicate model/unit URL competing head pages.|
|Future workload vs checklist|Checklist inspection/condition; workload guide software needs; display guide panel choice; avoid repeated generic stock introductions.|

Implementation plan (not executed): existing `/buy-from-dubai`→each source page, comparison, sizing and checklist; each source answer→relevant category+one practical guide+request CTA; categories→real Products and relevant guidance; Products→source Brand and category; Laptop detail→list+checklist. Add contextual links into currently weak Temu/checklist pages. Keep Homepage navigation unmodified and uncluttered.

## Prioritization and next data action

[KEYWORD-GAP.csv](KEYWORD-GAP.csv):48 query opportunities — P0=2,P1=27,P2=17,P3=2. Each carries intent, business value, qualitative feasibility, conversion intent, authority requirement, effort, route, new-page flag and cannibalization risk. These are **query/content opportunities**, not48 verified competitor-only ranking gaps. Volume/KD unavailable throughout. HIGH/MEDIUM/LOW are editorial judgments, not numeric traffic forecasts.

P0: ordering-guide and shoe-collection opportunities grounded in relevant GSC samples. P1: store depth, Adidas route, stock pillar, model/inspection evidence. P2: substantive comparison/display/workload and conditional categories. P3: legal supplements and inventory-absent ThinkPad; deprioritized clothing/other-brand queries are excluded.

Only remaining account/data action: a legitimately entitled competitor-capable Ahrefs/equivalent report is required for full keyword/rank/referring-domain intersections. Existing free Ahrefs may verify the owned site in a **separately authorized** phase, but that alone does not unlock competitor analysis. No owner manual collection requested where available tools worked. No paid purchase recommended as mandatory for the first content work; execute measured P0/P1 while collecting data.

Safety: changes limited to research documents/evidence under `docs/seo`. No Production/Homepage/code/canonical/sitemap/GA4/Clarity/Search Console/Bing settings/Telegram/DB/migration/seed/Vercel/main changes; no outreach, IndexNow or fake leads.


## Official interpretation sources

- [Google AI features](https://developers.google.com/search/docs/appearance/ai-features): normal SEO/indexing eligibility, no special AI markup or guaranteed citations.
- [Google documentation updates](https://developers.google.com/search/updates): FAQ rich-result removal/deprecation in2026. Existing FAQ schema presence is not a rich-result opportunity.
- [Google link-spam policy](https://developers.google.com/search/docs/essentials/spam-policies#link-spam): paid links must be qualified; no automated/link-network campaigns.
- [GSC Links report](https://support.google.com/webmasters/answer/9049606): sampled reporting, not a complete backlink census.

## Competitor backlink-intersection coverage

| Primary competitor | Public referring-source example | Complete linked-to-them/not-to-us domain intersection |
|---|---|---|
|malltina.com|TechRasa report mention only; clickable backlink not verified|UNAVAILABLE|
|iranicard.ir|Digiato link verified on inspected promoted page|UNAVAILABLE|
|azdubai.ir|No independently verified referring-domain sample in this pass|UNAVAILABLE|
|mozono.ir|No independently verified referring-domain sample in this pass|UNAVAILABLE|
|kavantamin.com|No independently verified referring-domain sample in this pass|UNAVAILABLE|
|orfume.ir|No independently verified referring-domain sample in this pass|UNAVAILABLE|
|nomoras.com|No independently verified referring-domain sample in this pass|UNAVAILABLE|
|raitop.ir|Shahrsakhtafzar link verified on inspected PR page|UNAVAILABLE|
|dokmeha.com|No independently verified referring-domain sample in this pass|UNAVAILABLE|
|qeshmoff.com|No independently verified referring-domain sample in this pass|UNAVAILABLE|


## Phase 3I execution log — 2026-10-20

Content/source commit: `9cf087d3f28e71accae12cd2c559701827b807f5`. Two P0 and eight selected P1 content actions IMPLEMENTED; see [PHASE-3I-EXECUTION.md](PHASE-3I-EXECUTION.md) and status/URL/SHA/date columns in CONTENT-GAP.csv and KEYWORD-GAP.csv. The original Phase3H evidence and remaining backlog are retained. No backlink placement or outreach was performed. Adidas remains pending explicit catalog-write approval; no fake entity was created. Source content completion is not a claim of ranking/conversion gains.
