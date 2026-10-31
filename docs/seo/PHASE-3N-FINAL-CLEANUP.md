# Phase 3N — final cleanup and LCP investigation

## Accepted closeout — 2026-10-31

**SEO FOUNDATION = COMPLETE**
**MODE = MONITORING & GROWTH**
**OFF-PAGE OUTREACH = DEFERRED BY OWNER**

GSC and Bing sitemap registration both succeeded with **35 discovered URLs** each. No confirmed P0 defects. Production remains healthy at `abfc974f49fda656bdada9ff94ea156d8faa8e4f`; no application change or deployment is justified.

Homepage LCP: **MONITOR — unresolved lab paint-delay variance; no proven code defect and no deployment justified.** This is an accepted monitoring item, not a foundation-completion blocker, a proven code regression or a claim of field CWV success. Earlier investigation/approval recommendations below are historical and superseded by this closeout.

Next weekly review: **2026-11-07**; next completed 28-day measurement review: **2026-11-28**. Continue weekly technical/discovery monitoring, monthly public-route conversion/content measurement and quarterly CWV/content-gap review. No external automation or outreach is authorized.

2026-10-31, Asia/Dubai. **OFF-PAGE OUTREACH = DEFERRED BY OWNER.**

## Outcome

Sitemap registration is complete in both existing search properties. Each reports success and 35 discovered URLs. No duplicate property, ownership or permission change. No sitemap/source-code change. No manual indexing requests or bulk IndexNow submission.

**NO CODE FIX JUSTIFIED.** Slow lab painting reproduces, but the exact cause has not been isolated to a stable application defect. Do not conflate this conclusion with good LCP or a field CWV pass. The owner has accepted the unresolved paint-delay item as MONITOR; zero P0 defects confirmed. No deployment required on current evidence. No immediate owner account action is required.

## Sitemap evidence

- Existing canonical `https://dubaikharid.shop/sitemap.xml`: HTTP 200, valid XML, 35 unique HTTPS apex URLs, no query/private routes or retained hidden QA Product. All 35 fetched URLs ultimately returned 200; transient local connection timeouts succeeded on retry.
- GSC existing Domain property `sc-domain:dubaikharid.shop`: absent before action, submitted exactly once. Submitted/last read **Oct 31, 2026**. An initial transient “Couldn't fetch” changed to **Sitemap processed successfully**, **35 discovered pages**, 0 videos; no final error/warning displayed. No second submission.
- Bing existing apex property: absent before action, submitted exactly once. Final **Success**, **35 discovered URLs**, **0 errors, 0 warnings**. Dashboard submit/crawl date displays **10/30/2026**; action occurred Oct 31 Asia/Dubai (retain dashboard timezone difference, do not relabel it).
- Screenshot proof: `phase3n/gsc-sitemap.png` and `phase3n/bing-sitemap.png` in the task evidence folder outside Git.

| Representative URL | Sitemap | HTTP | Indexable / canonical | Incoming sitemap-page links |
|---|---|---|---|---:|
| /buy-from-dubai | YES | 200 | YES / exact apex | 34 |
| /sports-shoes | YES | 200 | YES / exact apex | 6 |
| /brands/adidas | YES | 200 | YES / exact apex | 2 |
| /guides/stock-laptop-checklist | YES | 200 | YES / exact apex | 2 |

Link counts include global navigation/footer and are not all contextual. Sitemap discovery is not proof that these individual URLs are indexed; monitor normal processing after submission. All have one matching canonical and no noindex header/meta in the live sample. Adidas remains legitimate and empty; hidden QA Product is not exposed.

## Comparable measurements

Lighthouse **13.5.0**, HeadlessChrome **156.0.0.0**, fresh Chrome profiles and browser cache for each run. Mobile viewport **412×823**, DPR **1.75**, simulated network RTT **150ms**, throughput **1638.4Kbps**, CPU slowdown **4×**. Same exact Production deployment for all runs. No user agent or automation guard bypass. The first sandbox Chrome attempts failed before measurement and are excluded; only successful complete reports count.

Primary cohort: five runs with `--headless --no-sandbox`. Separate diagnostic cohort: five runs with additional `--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows`. Do not pool cohorts or treat the second as post-fix; no code changed.

| Cohort/run | LCP ms | FCP ms | TTFB ms | Load delay ms | Load duration ms | Render delay ms | CLS | TBT ms | Transfer bytes | Requests | Cache document/Hero |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| home/1 | 2890.4 | 1390.4 | 174.4 | 799.0 | 66.8 | 83.5 | 0.002 | 10 | 1129315 | 78 | MISS/HIT |
| home/2 | 3466.4 | 1366.4 | 203.5 | 836.6 | 67.8 | 58.0 | 0.002 | 0 | 1126288 | 74 | MISS/HIT |
| home/3 | 2874.5 | 1374.5 | 260.4 | 411.7 | 79.8 | 52.3 | 0.002 | 7.5 | 1144807 | 75 | MISS/HIT |
| home/4 | 6250.3 | 1375.3 | 164.3 | 321.0 | 79.7 | 1890.8 | 0.000 | 28 | 1130184 | 75 | MISS/HIT |
| home/5 | 6308.8 | 1358.8 | 227.3 | 190.4 | 108.5 | 1997.5 | 0.000 | 6 | 1130829 | 75 | MISS/HIT |
| diagnostic/1 | 6246.2 | 1371.2 | 220.7 | 310.5 | 87.0 | 1973.0 | 0.000 | 27 | 1131033 | 75 | MISS/HIT |
| diagnostic/2 | 6252.6 | 1377.6 | 171.6 | 298.8 | 76.3 | 1949.2 | 0.000 | 14 | 1128060 | 75 | MISS/HIT |
| diagnostic/3 | 6324.9 | 1374.9 | 160.2 | 346.2 | 74.4 | 1860.4 | 0.000 | 0 | 1130006 | 75 | MISS/HIT |
| diagnostic/4 | 6314.9 | 1364.9 | 182.7 | 213.4 | 111.4 | 2001.8 | 0.000 | 0 | 1129122 | 75 | MISS/HIT |
| diagnostic/5 | 6257.5 | 1455.7 | 265.8 | 188.2 | 88.2 | 2019.0 | 0.000 | 11.5 | 1129017 | 75 | MISS/HIT |

Primary LCP minimum/median/maximum **2.874s / 3.466s / 6.309s**. Median observed TTFB **203.543ms**, load delay **411.674ms**, duration **79.705ms**, render delay **83.547ms**. Diagnostic LCP min/median/max **6.246s / 6.258s / 6.325s**.

Lighthouse subparts are observed trace timings while reported LCP/FCP use simulation; do not sum the observed subparts to explain the simulated LCP. Median render delay hides a bimodal result: primary first three 52–84ms versus last two 1891–1998ms. Primary FCP simulated range 1.359–1.390s. Primary CLS maximum 0.001884; median TBT 7.5ms. Full precision, resource URLs and per-run values are retained in measurements.csv and raw reports outside Git.

## Hero and previous fix verification

Exact LCP element in all ten reports:
`main.page-module___8aEwW__mainContent > section.Hero-module__ZARIfG__hero > div.Hero-module__ZARIfG__bgImage > img`

Bounds **412×436px**. Asset in all runs:
`https://dubaikharid.shop/_next/image?url=%2Fimages%2FheaderBG%20.png&w=750&q=90&dpl=dpl_D3usCcCYorfuTc9QeTsGTbSMQxMS`

- **One actual Hero request in every run**, 750px candidate, **image/webp**, **61,204 resource bytes** (61,470 transferred including overhead in primary run 1); HTTP 200, CDN HIT. No original multi-megabyte PNG request. PNG appears only as optimizer source parameter.
- Responsive `sizes=100vw` and matching srcset remain. Image eager/high; request priority High. Lighthouse discoverable/high-priority/eager checks all pass.
- Live markup contains **two identical responsive preload links**, one hoisted in HEAD and one in SECTION. They coalesce into the same request in all ten traces. Thus the earlier “one preload” description is not literally accurate for current markup, but no duplicate network load or measured harm was found. Do not remove markup speculatively.
- Computed Hero CSS background is `none`; actual optimized img remains. No CSS-background regression.
- Original theme bootstrap remains inline in HEAD before BODY; no delayed theme bootstrap replacement. Low CLS provides no evidence of the previous large brand-strip height jump. Design and theme semantics unchanged.
- Historical 1.85s best remains a prior lab sample, not a paired current baseline or field result. The prior documented preloading/theme fixes are still present. These measurements neither reproduce a universal 1.85s nor establish a specific code regression since that sample.

## Network, caching and third parties

Homepage HTML is dynamic: `private, no-cache, no-store, max-age=0, must-revalidate`, age 0, Vercel MISS; served through bom1 to fra1 in the sample. No server-render wall-time header was exposed, so do not label all document wait as Vercel function execution. Primary first header byte was only 164–260ms. Header completion/body streaming varied, producing observed image discovery/load delay 190–837ms. This is not sufficient evidence to change authentication-dependent caching architecture.

Hero CDN is HIT in every run, age roughly 943k seconds; `public, max-age=0, must-revalidate`, `Vary: Accept`. Optimizer cold transformation is ruled out for these samples. Representative immutable static CSS is CDN HIT with `public,max-age=31536000,immutable`. No purge, cache setting or environment change.

Slow primary runs downloaded Hero and critical CSS by roughly 0.53–0.56s but recorded first contentful paint around 2.46–2.52s observed. Raw main-thread tasks did not show a matching multi-second blocking task. Explicit Chrome background protections did not remove the delay. Browser paint scheduling/test-environment variance is a hypothesis, **not a proven root cause**. Normal network/streaming variability also exists; it does not explain all slow painting. No evidence supports blaming a cold image optimizer, duplicate request or high TTFB for the slow cohort.

GA4/Clarity SDK requests are absent from automated Lighthouse runs because existing Production automation exclusions work. Consequently these scripts cannot cause the observed delay in those traces, but their exclusion prevents claiming zero real-user cost. A separate normal in-app page read confirmed async GA4 loaded after hydration and Clarity queued at idle: Hero request about 496ms; GA4 about 581ms; Clarity about 585ms, async. This desktop diagnostic is not a comparable mobile causal experiment. No scripts disabled, no exclusion bypass, no fake lead/customer event. Only ordinary page-view collection occurred. Raw analytics collection identifiers were removed from retained timing evidence.

## Fix gate and remaining work

1. Slow painting reproduces: YES.
2. Exact stable code cause identified: **NO**.
3. Measurable fix established: **NO**.
4. Visual and SEO preservation: YES, because no source change.

Therefore **NO CODE FIX JUSTIFIED**, no commit, build or deployment. Further work is a focused renderer/paint investigation, ideally paired with an independent controlled browser/host trace or sufficient real-user field data. Do not disable analytics, rewrite Hero, change caching architecture or alter Homepage semantics without causal evidence. Keep this as an accepted MONITOR item; do not disguise it as a field pass or a resolved performance regression.

## Final safety

Production SHA remains `abfc974f49fda656bdada9ff94ea156d8faa8e4f`, existing deployment `dpl_D3usCcCYorfuTc9QeTsGTbSMQxMS` READY; apex aliases unchanged. Both health endpoints 200, ok/ready.

Explicit read-only transaction on expected neondb confirms **30 applied migrations, 0 failed**, rolled back without mutation. No migration/seed, Product/Laptop/Setting mutation, Telegram change/request, GA4/Clarity configuration or semantics change. Only the two specifically authorized sitemap registrations changed account configuration. No Google ownership/access change.

Local HEAD/remote release remain `31892b08a80d888ad0948f55ae3c4ca997f473db`; origin/main remains `9422d4f8ee004da3c5f2b45b34ceb264a8b032a4`. Existing Phase 3L/3M documentation preserved. Phase 3N changes only this report and dated addenda in the requested review/maintenance files; documentation-only commit/push authorized by the owner at closeout. Worktree intentionally dirty with documentation. No outreach or automation created.

No code changed: full build, Prisma generation and deployment checks were not unnecessarily repeated. XML, all 35 sitemap URL responses, canonical/private filters, measurement completeness and documentation diff checks passed.

Final verdict: **DUBAIKHARID SEO FOUNDATION COMPLETE — MONITORING & GROWTH MODE**
