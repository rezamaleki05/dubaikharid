# Mobile RTL cost example hotfix

2026-10-21. Baseline: `2cdac40d5a7cf3786416f9b0fc818ad90a470000`.

The three cells each had a 130px minimum width. At a 320px viewport the
390px table exceeded its 288px region. The document did not overflow, but
the isolated table required horizontal scrolling to read every column.

Only CostEstimateExample opts into stacked rows at widths up to 600px.
The same server-rendered table retains its caption, column/row scopes and
explicit accessibility roles. Visible mobile labels reuse evidence.columns;
they are hidden from the accessible names to avoid repeated announcements.
No values, formulas, settings, metadata or links were changed.

## Built-page browser checks

| Viewport | Document client/scroll width | Table width | Presentation |
| --- | --- | --- | --- |
| 320 | 312 / 312 | 288 | stacked |
| 360 | 352 / 352 | 328 | stacked |
| 375 | 367 / 367 | 343 | stacked |
| 384 | 376 / 376 | 352 | stacked |
| 390 | 382 / 382 | 358 | stacked |
| 412 | 404 / 404 | 380 | stacked |
| 430 | 422 / 422 | 398 | stacked |
| 768 | 760 / 760 | 728 | table |
| 1440 | 1432 / 1432 | 1180 | table |

The browser reserves 8px for its vertical scrollbar. No body-cell overflow
at any tested width. Full-page geometry found only the closed offscreen
navigation and visually hidden table headers outside bounds on narrow
screens; no additional visible content overflow. No global clipping added.
All three tablet/desktop column widths exactly match the baseline.
Screenshots visually inspected at 360, 384, 412 and 430px.

Mobile accessibility snapshot retains table, columnheader, rowheader and
cell relationships. Raw HTTP HTML contains all six table rows without JS.
Title, description, canonical, H1, JSON-LD, internal links and all original
cell values compare identically with Production before the change.

Validation: 65 focused organic-growth/SEO/catalog/Homepage-CWV/IndexNow tests
passed. Lint: zero errors, 48 pre-existing warnings. Next production build
and integrated TypeScript passed. git diff --check passed.

Local build/server use the existing read-only PostgreSQL connection wrapper;
Telegram sending and upload credentials are disabled. No migration, seed,
business-data write, main update, analytics or Homepage change is included.
