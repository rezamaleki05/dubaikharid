# Public behavior analytics

Phase 3F adds Microsoft Clarity independently of GA4. No Homepage copy, H1,
metadata, canonical, primary host, database schema or Telegram code changes.

## Configuration

Reuse the owner account's Dubai kharid project for `https://dubaikharid.shop/`.
Set **Production only** `NEXT_PUBLIC_CLARITY_PROJECT_ID` to the verified project
ID. It is a public identifier, not a credential. IDs must be 6–32 lowercase
alphanumeric characters. Missing/invalid IDs disable the integration. The
server also requires NODE_ENV/VERCEL_ENV Production and the configured apex URL.
The browser requires HTTPS apex; WWW, Preview, localhost and automated tests
cannot initialize. No SDK dependency is added.

Clarity project settings: **Strict** text masking, **Cookies OFF**, bot detection
ON. The app additionally queues Consent V2 with both storage types denied before
loading the SDK. No consent is invented, no Google integration is linked and GA4
consent/events remain unchanged. Cookieless observations have limited journey
continuity: recordings are not joined into multi-page sessions. A future
consent-management feature would need a separate reviewed scope; this phase
does not add a consent banner or change Homepage UI.

## Route and navigation protection

Explicit public paths cover Homepage, normal categories, Product, Laptop,
Store, Brand, Guide, About, buying guide and canonical search. All private or
unknown routes are denied, including Admin/API, login, account/profile, cart,
checkout/payment, tracking, wishlist and retired Warehouse routes. Query-bearing
URLs and arbitrary fragments are excluded because search, order and free-text
parameters can contain PII. The fixed Homepage `#calculator` fragment is safe.
Canonical `/search` is eligible, but `/search?q=...` is intentionally not.
Sensitive/query-bearing referrers also prevent initialization. This is a
conservative capture boundary, not a change to search/SEO routes or GA4 policy.

An idle callback (2.5s timeout; 1.5s fallback timer) loads one async SDK after
hydration. It does not block SSR, image markup or initial navigation. A
document-scoped singleton prevents duplicate initialization across React
remounts and public SPA transitions. One finite non-PII tag, `page_type`, is
updated without sending raw URLs, query text, names or user identifiers as tags.
There are no identify calls, custom lead events or GA4 calls in this integration.

Capture-phase guards run before the SDK. Public-to-private/query navigation
stops the SDK and uses a full document navigation rather than letting the same
recording follow private client-rendered pages. History/back/forward are guarded
too. After a privacy stop, the SDK never restarts within that document. Opening
an excluded/external clicked URL stops capture even for another tab, so clicked
URL parameters cannot become another PII channel. Navigation still works;
WhatsApp and authoritative lead_created GA4 semantics remain unchanged.

## Form privacy

The SSR body has `data-clarity-mask="true"`, so personalized Header text,
customer reviews and future DOM content remain text-masked. There are no unmask
attributes. Microsoft masks input/dropdown values in every masking mode.
Additional explicit masks protect:

- Quick purchase request dialog: name, phone, address, notes and success code.
- Checkout dialog: name, phone, address, notes, payment/order result.
- Product inquiry and review forms: names, phone, notes and free text.
- Profile request form: explicit mask, with the entire route excluded anyway.

Quick request and checkout dialogs additionally carry a sensitive marker. A
MutationObserver installed before the SDK stops recording when they open,
before the SDK's DOM observer can capture user-supplied external URL attributes
or payment/result details. Existing input masking and the body mask remain
defense in depth. The app records public interaction leading toward the form,
not the raw submission process or its sensitive result. GA4 remains the source
for completed leads. No fake Production lead is needed for this QA.

Existing owner analytics opt-out and a Clarity-specific local storage opt-out
are respected. `navigator.webdriver` and the existing QA flag suppress SDK load;
never bypass these guards to manufacture dashboard data.

## Security, checks and operating limits

Only `https://www.clarity.ms/tag/<verified-id>` is injected, async and with no
referrer on its request. The SDK manages its own Microsoft collection endpoint.
No CSP exists in this repository/live baseline, so no policy relaxation or
wildcard permissions were introduced. If a CSP is later added, audit the exact
vendor origins then rather than weakening unrelated security headers now.

Tests inject a fake browser and never contact Clarity. They cover environment,
route/PII URL guards, consent, masking, idle/singleton startup, private transitions,
sensitive-dialog observation and existing GA4 isolation. Production build,
integrated TypeScript, full tests, lint and Prisma validation/generation are
required before an exact clean Git deployment. No migration or seed is needed.

Live QA should inspect SDK requests on public pages and their absence on direct
private pages, plus privacy transitions without submitting any forms. Do not
fabricate sessions or claim empty dashboard data means a broken installation.
After real traffic: compare mobile dead/rage clicks and scroll reach by
page_type for Product, Laptop and buying-guide pages; correlate aggregate
friction with existing GA4 whatsapp_click/lead_created counts. Do not promise
full cross-page funnels in cookieless mode. Real-user performance and replay
usefulness should be assessed after traffic, not inferred solely from a build.

References: [client API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api),
[masking](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking),
[Consent V2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2),
[URL and cookie FAQ](https://learn.microsoft.com/en-us/clarity/faq).
