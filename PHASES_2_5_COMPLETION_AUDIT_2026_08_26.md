# Phases 2–5 Completion Audit

**Audit date:** 2026-08-26 (America/New_York)  
**Audited branch:** `arena/01a040a4-nocharge`  
**Scope:** Phase 2 FAQ rollout, Phase 3 tools and ambient audio, Phase 4 vertical game artwork, Phase 5 Quiet Setup expansion, and the deferred tests/documentation/CI integration pass.

## Executive status

The phase commits contained the intended feature surfaces, but the work was not complete when this audit began. The latest three main-branch deploy runs had failed in `astro check`, browser tests were conditionally bypassed, validators still expected 30 or 140 setup articles, and several feature claims did not match the implementation.

The integration pass repaired the reproducible defects, updated source-of-truth validation, and restored the normal unskipped browser gate. Local non-browser verification is green. The final GitHub Chrome run is the remaining automated confirmation because the sandbox could not download Chromium from Playwright's CDN.

## Verified current inventory

| Item | Current value |
|---|---:|
| Built HTML pages | 298 |
| Main sitemap URLs | 294 |
| Dedicated setup sitemap URLs | 211 (index + 210 articles) |
| Games | 17 |
| Game guides | 17 |
| Articles | 26 |
| Curated collections | 6 |
| Quiet Setup articles | 210 |
| Quiet Setup primary topics | 7, exactly 30 articles each |
| Changelog entries | 12 anchors on one noindex page |
| FAQPage routes | 250 |
| Visible schema-matched FAQ pairs | 1,144 |
| Game pin assets | 34 (17 JPEG + 17 WebP) |
| Setup pin assets | 46 (23 JPEG + 23 WebP) |

## Phase 2 — visible FAQ and structured data

### Found incomplete

- Game, guide, and Help pages duplicated their FAQ copy: visible answers were shortened versions of different JSON-LD answers.
- Some answers made inaccurate broad claims about keyboard support, local-storage keys, clearing consent, offline loading, and affiliate coverage.
- Contact emitted FAQPage structured data without visible matching questions.
- A guide's Markdown FAQ and route-level FAQ both used `id="faq"`.

### Completed

- Setup, game, guide, Help, Contact, and Tool routes now use one question/answer data source for visible markup and FAQPage JSON-LD.
- Answers now describe game-specific controls, browser-local storage boundaries, no-service-worker limitations, optional affiliate links, and separate analytics/Google consent accurately.
- `scripts/validate-faq-schema.mjs` inspects the built site and requires every schema question and answer to exist in visible page text.
- Current result: 250 FAQPage routes and 1,144 matched visible pairs.

## Phase 3 — tools and ambient audio

### Found incomplete

- All three tool pages introduced TypeScript errors, causing the Phase 3, 4, and 5 deploy jobs to fail before build.
- The Discovery Wheel imported the content collection but ignored it in favor of a hand-maintained duplicate list.
- An impossible filter silently returned unrelated fallback games.
- Several pages exposed implementation/SEO language to readers and made unsupported offline or behavior claims.
- Lofi and drone set their active state after invoking schedulers; both schedulers returned immediately, so musical audio never began.
- Musical gain was applied twice, the documented drone filter was absent, and the shared ambient choice was not saved.
- Turning effects off also stopped ambient despite public copy saying that effects and ambient were separate.

### Completed

- Tool scripts are fully typed and null-safe.
- Discovery data is generated from all 17 published game entries; filters do not silently ignore a no-match combination.
- Tool copy now explains user behavior and limitations instead of search-engine implementation.
- Lofi schedules generated pentatonic notes on a 52 BPM grid; drone starts two detuned oscillators through a 600 Hz low-pass with a recurring swell.
- Musical and noise paths use consistent master-volume routing and cleanup.
- The game shell validates and persists all ten ambient choices.
- Effects on/off controls effects only; master mute controls effects and ambient.
- The mixer stops on hidden/pagehide and restores only a texture that had been playing before a visibility change.
- `tests/e2e/tools.spec.ts` adds five browser tests for collection-driven discovery, no-match handling, ten textures, ambient persistence, zoom calculation, and axe scans.

## Phase 4 — vertical game artwork and metadata

### Found incomplete

- The 34 pin files existed, but the generator named in the commit did not.
- No CI-stable regeneration path existed.
- Game structured data did not include the vertical image as an ImageObject.
- Pass & Play game schema incorrectly used `SinglePlayer`.

### Completed

- Added deterministic `scripts/generate-game-pins.mjs` using each canonical square cover.
- Regenerated and dimension-checked all JPEG/WebP pins at 1000×1500.
- `npm run check:game-pins` fails on generated drift.
- Game pages emit square, landscape, and vertical Open Graph images plus a representative ImageObject.
- VideoGame `playMode` now distinguishes shared-device games from solo games.
- Asset validation checks all setup and game pins and their budgets.

## Phase 5 — 210 Quiet Setup articles and discovery content

### Found incomplete

- The 70 added articles were 320–342 body words, despite the phase claiming 350+.
- Fourteen of fifteen substantive sentences in each file were duplicated across all 70 articles.
- Generic keyboard/mouse/stand advice appeared in unrelated lighting, paper-puzzle, audio, and cable articles.
- Forty of the 70 files repeated the same paid destination twice; additional duplicate destinations existed in 25 earlier setup files.
- Several paid searches did not match the article subject.
- The files used a future `2026-08-27` publication date in the site's New York timezone.
- Public pages and validators still said 20 per topic, 30 total, 140 total, or expected 31 setup sitemap URLs.
- The new “no charge games” article and collection described keyword targeting, ranking, and AdSense word-count tactics to readers.

### Completed

- Rewrote all 70 Phase 5 articles with title-specific factors, measurements, tradeoffs, evidence limits, no-purchase tests, and two same-library links.
- Each Phase 5 article has at least 350 body words, a comparison table, a Bottom Line opening, and no duplicate paid URL.
- Paid links are now relevant broad comparisons; settings-only articles carry no paid destination.
- Deduplicated paid destinations in the 25 affected earlier articles.
- Corrected Phase 5 publication/review dates to 2026-08-26 local time.
- `scripts/audit-content-quality.mjs` enforces the Phase 5 depth/cross-link/table contract and paid-link consistency across the full setup collection.
- Rewrote the article and collection around verifiable free-access, local-storage, advertising, and affiliate boundaries without exposing SEO tactics.
- Updated visible counts to 30 per topic and 210 total.

## Deferred integration and CI work completed

- Setup feed, setup sitemap, and setup article validators now derive published slugs from `src/content/setup` through `scripts/setup-content-utils.mjs` rather than hard-coded counts.
- Main sitemap now includes Contact and all Tool routes and excludes noindex My Arcade, noindex Changelog, the noindex Privacy Policy alias, and 404.
- Privacy Policy emits one canonical URL through a supported `canonicalPath` prop.
- The build gate now runs HTML, internal-link, sitemap, structured-data, FAQ visibility, asset, setup, feed, brand, and metadata validation.
- The check gate now runs content quality, deterministic pin drift, 412 unit tests, and Astro diagnostics.
- Updated Playwright assertions for 26 articles, 6 collections, 210 setup articles, and 211 setup sitemap URLs.
- Added compatible transitive overrides for the stale LHCI dependency tree; `npm audit` reports zero vulnerabilities and `lhci --version` still runs.
- Updated README and content-accuracy ownership records. Historical audits are explicitly marked as superseded snapshots.
- The final commits contain no `[skip e2e]` or `[skip checks]` token, so the existing workflow executes the browser gate.

## Validation evidence

| Command/check | Result |
|---|---|
| `npm audit --audit-level=moderate` | 0 vulnerabilities |
| `npm run audit:content` | 210 setup articles pass |
| `npm run check:game-pins` | 17 game packages regenerate without drift |
| `npm run test:unit` | 412 passed in 36 files |
| `astro check` | 0 errors, 0 warnings, 0 hints |
| `npm run build` | 298 pages built |
| HTML validation | Pass |
| Internal links | 298 HTML files pass |
| Main sitemap | 294 public URLs pass |
| Setup sitemap | Index + 210 published articles pass |
| Structured data / unique metadata | Pass |
| FAQ visibility/schema | 250 routes, 1,144 pairs pass |
| Asset budget and dimensions | Pass, including 80 vertical pin files |
| Quiet Setup affiliate/build validation | 210 articles, 284 paid links pass without merchant requests |
| Setup/general feeds | 210 + 12 items pass |
| Brand and social metadata | 298 pages pass |
| Playwright collection | 481 tests in 34 files |
| Full Chrome execution | 474 passed, 7 intentionally skipped; the full browser/accessibility gate is green |
| PR visual-capture gate | 3 passed, 1 failed on the pre-existing 100px mobile-header ceiling; compact-header fix applied and final capture rerun pending |

## Browser regression follow-up

The second unskipped Chrome run completed 465 tests and identified eight integration failures rather than product-runtime failures:

- two remaining pre-Phase-5 count assertions expected 25 articles instead of 26;
- one editorial-art assertion still required empty alt text after the descriptive-alt rollout;
- the new platform article's comparison table overflowed at 320 CSS pixels;
- six 210-card geometry cases used an O(n²) browser-query loop and exceeded the old 30-second test timeout (one passed on retry).

The count and alt assertions now match the published collections, article prose tables have a bounded keyboard-scrollable region, and setup-card geometry is collected in one browser evaluation rather than thousands of repeated queries. That reduced the next full run from 20.0 to 9.6 minutes and cleared all six geometry cases.

The third run passed 472 tests and left two narrow findings: the new collection table needed the same bounded mobile table treatment, and one updated alt-text assertion used a different word order from the rendered title. Both were fixed. The fourth run passed 473 tests and isolated one final overflow: long iframe sample code on the Ambient Mixer preserved an intrinsic preformatted width at 320 CSS pixels. Global prose code blocks now wrap long embed lines within their content column. The fifth run reduced that overflow from 856px to 28px and identified the remaining intrinsic width on the Ambient select. All Tool form-grid children and controls now explicitly use bounded widths.

The sixth run passed the complete browser/accessibility gate: 474 passed and 7 intentionally skipped capture-only cases. Its separate PR-capture step passed three capture groups, then found that the four-link mobile header was 130.4px tall at 390px against the established 100px maximum. At 480px and below, the visible wordmark now yields to the still-labeled brand symbol, while the four 44px navigation targets remain on one row. A final capture rerun remains the gate.

## Work that remains outside phases 2–5

These are owner/environment checks, not incomplete implementation in this phase:

1. Confirm the final GitHub Chrome run is green and review its PR screenshots.
2. Perform physical iOS Safari and Android Chrome testing.
3. Perform VoiceOver, TalkBack, NVDA, or JAWS manual testing from the maintained checklist.
4. Apply and verify the documented HTTP response headers at the hosting edge.
5. Continue the monthly manual affiliate-destination and editorial-accuracy review; automated tests intentionally do not request Amazon.
