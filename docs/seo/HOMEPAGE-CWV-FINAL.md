# Focused Homepage CWV pass

Baseline Production `0fab3743e8696bc844922ef2ec0b425dbbc12aee`.
Only two runtime files change: the timing of the existing theme bootstrap in
RootLayout, and the priority markup for the existing responsive Hero asset.
No CSS, content, crop, quality, metadata, analytics or business behavior changes.

## Evidence and fix

The exact mobile LCP is the decorative Hero img inside `.bgImage`, rendered
412×436px at the 412px Lighthouse viewport. Its WebP candidate is 750px wide,
61,204 resource bytes in the recorded baseline (the separate 1080px test is
108,944 bytes). There is one responsive preload, initially discoverable in HTML,
but it lacks explicit high priority. Resource discovery/load delay dominates
the current trace; final painting itself takes approximately 50ms. A fresh
Production run gave LCP 2.96s, versus the earlier 4.38s sample, demonstrating
ordinary server/network variance. Do not equate the two samples with field CWV.

Use one explicit responsive image preload with `fetchPriority=high`, generated
from the same getImageProps input as the existing Image. The img is eager/high
priority; remove Next's separate preload prop to avoid competing duplicate
preloads. Source, sizes, quality 90, cover crop and center 20% remain unchanged.

Raw LayoutShift attribution identifies the dominant 0.121811 event: Calculator
visible bounds change from [0,667,412,156] to [0,623,412,200]. That 44px movement
matches the brand placeholder's dark mobile frame 128px changing to light 84px.
The Next beforeInteractive component queues the theme code rather than executing
it synchronously in the parser at head arrival. Run the **same unchanged** tiny
bootstrap in an inline head script before body/CSS-dependent paint. This selects
the stored/system theme before the frame is laid out; no new preference/default
is introduced. Root is shared, but this is not a theme redesign or app refactor.

Secondary shift: late brand logo width changes move cards horizontally by about
39px, contributing ~0.00265. Existing final strip height is already reserved.
No further width/crop/image changes are justified for this tiny remaining score.
Hero dimensions, font stack, font weights and all final styles remain unchanged.

## Pre-deployment gate

Same warmed local server origin, same Lighthouse 13.5.0 mobile simulated profile,
fresh automated Chrome profiles before/after: LCP 4.88s→3.84s; CLS
0.121811→0.002649. TBT 0→14.5ms (still low). This local paired test is an
implementation gate, not a substitute for Production measurements. Initial
cold-server local measurements are kept separately and not mixed into the pair.
Candidate priorityHinted/requestDiscoverable/eagerlyLoaded checks all pass.
At 390px, 430px and desktop the final Hero/H1/brand/Calculator dimensions and
screenshots retain the original appearance; minor subpixel timing differences
and moving marquee position are not design changes.

Full tests, theme preference permutations, exact Homepage freeze, image policy,
analytics guards, lint, Prisma and build remain gates. The existing frozen
digest is retained; a separate exact snippet exception file reverses only this
reviewed timing/priority patch before the earlier approved exceptions.

No migration, seed, Production data mutation, environment change, Telegram
request, Clarity configuration change or full IndexNow submission is required.
Local database access is forced read-only. Final Production trace, metrics and
safety checks belong in the release report; do not claim field CWV gains.
