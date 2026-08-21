# Quiet Setup visual review (post-#20 repair)

This is the defect log for the Quiet Setup visual-repair milestone. Every entry
below was found by capturing the **actual rendered DOM** from a mounted
headless Chromium session against the production build (`npm run build` +
`astro preview`), opening each screenshot, and reading
`getBoundingClientRect()` geometry — not by trusting the pre-existing
`scrollWidth <= clientWidth` assertions, which passed throughout.

## How the audit was run

| Item | Value |
| --- | --- |
| Build under test | `npm run build` output of `main` at merge commit `b0ac3bf` |
| Server | `astro preview` on `localhost:4321` |
| Browser | Headless Chromium 149 (Chrome for Testing build), one page per viewport |
| Routes | `/setup/`, all eight Setup article routes, `/articles/`, `/help/`, `/advertising/`, `/privacy/` |
| Index viewports | 1440×900, 1024×768, 768×1024, 390×844, 360×800, 320×700, 200%, 400%, reduced motion, forced colors |
| Article viewports | 1440×900, 390×844, 320×700, 200% |
| Consent | A stored "keep analytics off" decision seeded before load; every Google and Amazon endpoint blocked at the network layer |
| Captures | `artifacts/audit-before/` and `artifacts/audit-after/` (132 PNGs each, git-ignored) plus the CI artifact `pr-visual-captures` |

Two honest caveats:

- The sandbox has no Inter webfont, so captures fall back to DejaVu Sans, which
  is *wider* than Inter. Overlap and overflow findings are therefore
  conservative; typography colour and weight in the captures are not
  pixel-identical to production.
- No manual testing on a physical device or with a screen reader was performed
  for this milestone. The only real-device evidence is the owner's Chrome on
  Android screenshot that reported defect **D1** below.

## Browser zoom emulation

`document.documentElement.style.zoom` is **not** used as the pass/fail gate.
Media queries are evaluated against the viewport and are unaffected by the CSS
`zoom` property, so `zoom: 4` renders a *scaled desktop layout* rather than a
reflow — measured on `/setup/`, the `min-width: 52rem` two-column `.method`
and hero rules stayed active inside a 288 px column and produced 149 px of
phantom overflow. Reflow is therefore asserted and captured at the equivalent
CSS-pixel viewport (1280×1024 ÷ 2 = 640×512 for 200%, ÷ 4 = 320×256 for 400%),
where the breakpoints really fire. A CSS-`zoom` 200% assertion is retained in
`tests/e2e/quiet-setup.spec.ts` unchanged.

---

## Defects found and corrected

### D1 — Article hero `<picture>` rendered ~4000 px tall and painted over the ad region and footer

| Field | Value |
| --- | --- |
| Route | `/articles/<slug>/` (all platform/game articles; reported by the owner on `/articles/designing-browser-games-for-more-ways-to-play/`) |
| Viewport | Every width; catastrophic at 360×800 |
| Element | `picture.article-editorial-art` |
| Observed | Hero picture measured **340 × 3995 px** instead of 340 × 191. `.site-main` had `scrollHeight` 7799 vs `height` 5081, so ~2014 px of article prose was laid out *below* the shell and painted on top of the reserved advertisement region and the whole footer. The owner's device screenshot shows body copy and footer navigation occupying the same pixels. |
| Root cause | `.article-editorial-art` set `width`, `aspect-ratio` and `overflow` but **not `display: block`**. `<picture>` is inline by default, so a non-replaced inline box ignores all three; the descendant rule `.article-editorial-art img { height: 100% }` then resolved its percentage against the stretched `.article-page` grid item instead of the picture frame. Every other `<picture>` on the site (`.article-card__art`, `.collections-art`, `.help-art`, `.setup-artwork`) already declares `display: block` — this one was the sole omission. |
| Correction | Added `display: block` to `.article-editorial-art` in `src/pages/articles/[slug].astro`, with a comment recording why it is mandatory. |
| Verification | Hero now 340 × 191 (16:9); `documentElement.scrollHeight === .site-shell` height; `main.scrollHeight === main.height`. Captures `platform-article-hero-360.jpg`, `platform-article-hero-mobile.jpg`, `platform-article-hero-desktop.jpg`. A regression assertion (`hero.width / hero.height ≈ 16/9` and `display !== 'inline'`) is in `tests/e2e/quiet-setup-geometry.spec.ts`. |

### D2 — Topic counts summed secondary tags and implied dedicated guides

| Field | Value |
| --- | --- |
| Route | `/setup/` |
| Viewport | All |
| Element | `.topic-grid` count line |
| Observed | Keyboards 4, Pointing devices 3, Screens and stands 3, Desk and comfort 7, Offline puzzles 2 — a total of 19 "launch guides in the feed" for a section containing eight articles. Only one article is primarily about desk and comfort at launch, yet the card advertised seven. |
| Root cause | `articles.filter(a => a.data.topics.includes(id)).length` counted every secondary tag in each article's `topics` array. |
| Correction | New `src/lib/setup-topics.ts` counts each published article once under its single primary `topic` and formats it plainly. Displayed counts are now **Keyboards 2 guides, Pointing devices 1 guide, Screens and stands 2 guides, Desk and comfort 2 guides, Offline puzzles 1 guide** (total 8). |
| Verification | `src/lib/setup-topics.test.ts` derives the counts from the committed markdown frontmatter and asserts singular/plural wording; `tests/e2e/quiet-setup-geometry.spec.ts` derives them from the rendered cards and asserts the string, plus that the phrase "launch guides in the feed" is gone. Capture `quiet-setup-topic-cards.jpg`. |

### D3 — Full-card pseudo-element link overlay covered the badges and dates

| Field | Value |
| --- | --- |
| Route | `/setup/` |
| Viewport | All |
| Element | `.setup-card h3 a::after { position: absolute; inset: 0 }` over `.setup-card { position: relative }` |
| Observed | The invisible overlay spanned the whole card, so `elementFromPoint` at the centre of the evidence badge and of the published/reviewed dates resolved to the card link. Disclosure metadata behaved as a click target, text selection inside the card was captured by the link, and the real target was ambiguous. |
| Root cause | Stretched-link pattern applied to the entire card, including non-interactive semantic content. |
| Correction | Overlay removed. The card title is the single honest link; the card responds to `:has(a:hover)` and `:focus-within` so the affordance is still visible without faking a clickable badge. |
| Verification | Geometry suite asserts that the chip and date centres do **not** resolve to an `<a>` and that each card exposes exactly one link. |

### D4 — Card clipped its own focus ring

| Field | Value |
| --- | --- |
| Route | `/setup/` |
| Viewport | All |
| Element | `.setup-card { overflow: hidden }` |
| Observed | `overflow: hidden` existed only to clip the artwork to the card's rounded corners, but it also cropped the title link's focus outline at the card edge. |
| Root cause | Corner rounding implemented by clipping the container rather than by rounding the artwork. |
| Correction | `overflow: hidden` removed; `SetupArtwork` gained a `card` variant that rounds only its own top corners and drops its redundant full border (which also removed a visible panel-inside-a-panel seam). |
| Verification | Geometry suite fails if any `[data-setup-card]` computes `overflow: hidden`, if `scrollHeight > clientHeight`, or if the focused outline box leaves the document width. |

### D5 — Paid recommendation terms ran into their descriptions

| Field | Value |
| --- | --- |
| Route | Five affiliate Setup articles |
| Viewport | 1440×900 (tight) and 360–390 px (severe) |
| Element | `.paid-recommendation dl div` |
| Observed | `grid-template-columns: 6rem 1fr; gap: .5rem`. "Limitations" exactly filled the 96 px label column, leaving ~6–10 px before its value; "Why this link" wrapped to two lines while its single-line value sat beside it. At 390 px the two-column layout was still active and squeezed the value into a ~215 px column of near-single-word lines. |
| Root cause | Fixed 6 rem label track, an 8 px gap, and a stacking breakpoint of only 24 rem (384 px). |
| Correction | Terms now stack above descriptions by default; the two-column form is opt-in from **34 rem** and uses `minmax(7rem, max-content) minmax(0, 1fr)` with a `0.35rem 1.5rem` gap. Row spacing between the three groups raised to `0.85rem`. `minmax(0, 1fr)` is used deliberately so a fixed minimum can never force horizontal overflow in a narrow container. |
| Verification | Geometry suite asserts zero term/value overlap, a ≥ 12 px column gap and a ≥ 200 px value column in the wide layout, and stacked order in the narrow layout, at 1440 / 390 / 320 px on every affiliate article. Captures `quiet-setup-paid-recommendation-closeup-desktop.jpg`, `…-320.jpg`. |

### D6 — Article metadata mixed dates and badges on one wrapping flex line

| Field | Value |
| --- | --- |
| Route | All eight Setup articles |
| Viewport | 320–768 px |
| Element | `.article-meta` |
| Observed | Dates, the evidence pill and the paid-link pill shared one `flex-wrap` row with a `.5rem` row gap, so a wrapped date could land immediately beside a chip border and the chips could sit with only 8 px between them. |
| Root cause | One flex container for two different kinds of metadata. |
| Correction | Split into `.article-meta__dates` and `.article-meta__labels` on separate grid rows, `0.6rem` apart; chips use a `0.5rem 0.6rem` gap. |
| Verification | Geometry suite checks date↔date, badge↔badge and date↔badge pairs on every article at three widths. |

### D7 — Evidence and paid pills wrapped badly and sat too close

| Field | Value |
| --- | --- |
| Route | `/setup/` and all articles |
| Viewport | 320–390 px, 200% |
| Element | `.evidence-label`, `.paid-indicator`, `.setup-card__labels` |
| Observed | 999 px pill radius broke visually as soon as "Evidence: Editorial research" wrapped; `gap: .45rem` gave a thin band between the two chips. |
| Correction | Both chips are now `0.55rem`-radius chips with `line-height: 1.35`, `max-width: 100%` and `overflow-wrap: break-word`; container gap raised to `0.5rem 0.6rem`. Font size raised slightly (0.73 → 0.76 rem); no text was shrunk anywhere in this milestone. |
| Verification | Badge-pair overlap assertions at six viewports; captures `quiet-setup-card-closeup-desktop.jpg`, `quiet-setup-card-closeup-320.jpg`. |

### D8 — Five fixed topic columns and a two-column feed grid became unusable slivers

| Field | Value |
| --- | --- |
| Route | `/setup/` |
| Viewport | 1024×768 and 200% |
| Element | `.topic-grid`, `.feed-grid` |
| Observed | `grid-template-columns: repeat(5, 1fr)` from 52 rem gave ~9 rem topic columns at 1024 px; the feed grid stayed two-up in a 200%-zoom column. |
| Correction | `repeat(auto-fit, minmax(min(13rem, 100%), 1fr))` and `repeat(auto-fit, minmax(min(19rem, 100%), 1fr))`. The `min(…, 100%)` guard is what stops the track's fixed minimum from overflowing a narrow container. |
| Verification | Geometry suite asserts a single card column at the 200% equivalent viewport and a ≥ 272 px card width plus ≥ 200 px description column at every viewport. |

### D9 — Mobile hero consumed most of the first viewport

| Field | Value |
| --- | --- |
| Route | `/setup/` |
| Viewport | 390×844, 360×800 |
| Element | `.setup-hero` |
| Observed | Eyebrow + title + lede + actions + full-bleed 16:9 artwork ended at ~700 px of an 844 px viewport, leaving no real content on the first screen. |
| Correction | Tighter hero gaps, no hero top padding below 52 rem, and the hero artwork capped at `24rem` and centred on narrow screens (16:9 preserved). The affiliate disclosure is now visible on the first mobile screen. |
| Verification | Capture `quiet-setup-index-390x844.jpg`; hero block now ends at ~660 px (≈56% of the viewport). |

### D10 — Bottom article navigation used `space-between` with no wrap gap

| Field | Value |
| --- | --- |
| Route | All eight Setup articles |
| Viewport | ≤ 390 px |
| Element | `.article-next` |
| Observed | The two links were pushed flush to opposite edges and, once wrapped, stacked with only a `0.7rem` gap and no horizontal separation logic. |
| Correction | Wrapping row with an explicit `0.75rem 2rem` gap; `justify-content: space-between` applies only from 40 rem. Focus outlines added. |
| Verification | Geometry suite asserts no overlap between `.article-next` links on every article at three widths. |

### D11 — Every article body ran the full 52 rem column

| Field | Value |
| --- | --- |
| Route | All eight Setup articles |
| Viewport | ≥ 1024 px |
| Element | `.setup-prose` |
| Observed | Body copy measured the full 832 px article column — well past a comfortable reading measure. |
| Correction | `.setup-prose { max-width: 42rem }`. Body text size was not reduced. |

### D12 — Affiliate disclosure read as an alert

| Field | Value |
| --- | --- |
| Route | Five affiliate Setup articles and `/setup/` |
| Element | `.affiliate-disclosure`, `.setup-disclosure` |
| Observed | A 2 px amber box on a saturated amber-brown fill reads as a warning banner, and the amber was doing most of the signalling work. |
| Correction | Neutral dark panel with a single 4 px amber left rule and a 1 px border; the meaning is carried by the bold "Affiliate disclosure:" prefix and the required Amazon statement. Visually distinct from the neutral fixed consent panel, and from any error styling. Position, wording and order are unchanged: the disclosure still renders before the first paid link. |
| Verification | Geometry suite asserts the disclosure's bottom edge is above the first paid link, that it does not intersect the hero, prose or paid-links section, that both paragraphs stay inside the panel, and that text keeps ≥ 8 px from the border — at 1440 / 390 / 320 px on all five affiliate articles. Captures `quiet-setup-disclosure-closeup-desktop.jpg`, `…-320.jpg`. |

### D13 — Adjacent cards repeated the same illustration

See [Artwork](#artwork) below and `docs/ART_ASSETS.md`.

### D14 — Consent panel obscured the index disclosure in the very first capture

| Field | Value |
| --- | --- |
| Route | `/setup/` |
| Observed | The first (undismissed) capture pass showed the fixed consent dialog covering the right half of the index affiliate disclosure. |
| Assessment | **Not a product defect.** The consent panel is a deliberate fixed dialog shown until a choice is stored, and it behaves the same on every route. All subsequent captures seed a stored "keep analytics off" decision. Recorded here so the finding is not silently dropped. |

---

## Artwork

All five published concepts were inspected at full 1600×900, at card crop, at
article hero size, at 390 px, at 320 px, and lightened for shadow detail. **All
five had concrete defects and were regenerated.** Three additional concepts
were generated to end adjacent duplicate artwork. Details, batch sizes,
rejection reasons and final file sizes are in
[`docs/ART_ASSETS.md`](./ART_ASSETS.md).

The previous documentation claimed the screens-and-stands concept was repaired
by "correcting its neutral background to charcoal during local derivative
production". That is not a repair: the source drawing itself contained
disconnected stand geometry. It was regenerated at the source for this
milestone, and no background repainting or compositing happens in
`scripts/build-setup-art.mjs`.

---

## Checks that passed with no correction required

Reviewed at every captured viewport, with no change made:

- One `<h1>` per Setup route; breadcrumbs present and correct on all nine.
- Canonicals use HTTPS and the apex host on all nine routes.
- `/setup/feed.xml` contains exactly eight items in reverse-chronological order.
- `/sitemap-setup.xml` contains `/setup/` plus exactly eight article routes, no duplicates and no drafts.
- No `[data-ad-banner]` region on any Setup route; game routes keep theirs.
- Amazon tag remains `nocharge-20` on all six links; all keep `rel="sponsored nofollow"`, the `(paid link)` label and same-tab behaviour.
- Quiet Setup entry points on `/articles/`, `/help/`, `/advertising/` and `/privacy/` render correctly at desktop and mobile; the outbound-Amazon privacy explanation and the advertising disclosure are intact.
- No unreadable single-word columns, no `overflow: hidden` clipping, no content outside a card or panel at any captured viewport after the fixes.
- Reduced motion and forced colors: no automatic motion, and every chip, panel and disclosure keeps a `CanvasText` border in forced-colors mode.

## Remaining manual owner review

- Confirm the repaired `/articles/<slug>/` hero on a physical Android device — this milestone reproduced and fixed the defect in a headless browser only.
- Screen-reader confirmation that the removal of the full-card overlay reads as intended.
- The `desk-noise` concept is acceptable but its coiled cable visually crosses the keyboard; a further source regeneration is queued and is cosmetic only.
