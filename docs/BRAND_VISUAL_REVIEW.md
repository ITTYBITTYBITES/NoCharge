# Brand visual review (2026-08-21)

This review records the brand milestone's visual evidence. Two methods are
used:

1. **Deterministic inspection** (`node scripts/inspect-favicons.mjs`): the
   mark is rendered at every relevant size and through simulated platform
   masks, then measured pixel-by-pixel (ink, doorway gap, door stroke, tile
   solidity, mask-safe margins). These checks run without a browser.
2. **Opt-in browser captures** (inside `tests/e2e/pr-captures.spec.ts`,
   `CAPTURE_PR=1`): the 19 review screens listed below are captured on hosted
   stable Chrome by the existing PR workflow and uploaded to the
   `pr-visual-captures` artifact (7-day retention) under
   `brand/*.jpg`. Each capture is accompanied by a DOM measurement (viewport,
   header height, overflow) recorded in `brand/review-metrics.json` inside the
   artifact. Zoom states use the project's established equivalent-CSS-pixel
   viewport technique (a 1280×1024 screen divided by the zoom factor).

Inspection method note: review here is performed programmatically (pixel and
DOM measurements with exact numbers) rather than by physical-device testing;
no physical-device testing was performed and none is claimed. The full
capture set is not committed to the repository.

The browser-capture rows below are verified two ways in CI: the capture suite
asserts the invariants (header height 40–100 px, brand box ≤ 48 px, no
horizontal overflow) at the moment each screenshot is taken, so a green run
on hosted stable Chrome is itself the per-row PASS; and every state's exact
DOM numbers are written to `brand/review-metrics.json` inside the artifact.
Asset-level rows (favicon sizes, maskable masks, monochrome, logo variants)
carry exact pixel measurements produced by `scripts/inspect-favicons.mjs`.
Per-pixel eyeballing of the browser screenshots is additionally available to
the owner in the `pr-visual-captures` artifact (7-day retention); this
session could not visually view or fetch the artifact blob, so no
hand-verified pixel claim is made beyond the measured rows.

## 0. Pre-merge re-review (2026-08-21, merge session)

Before merging, every review question was re-asked against the committed
files with a pixel-margin audit (`artifacts/ci-artifact/deep-inspect.mjs`,
scratch, not committed):

- **16 px favicon**: gutter between the tile columns reads as a 2 px seam at
  luminance 70 between tile 122 and background 18 (ΔL 52 on both sides —
  maximum separability for a 4-unit gutter at this scale); the doorway is a
  3–4 px pure-background opening with a clearly separated 2 px frame stroke
  (94–122 vs 18). Verdict: legible, no simplified variant required.
- **32 px favicon**: 2 px gutters, 7 px of door ink across the doorway row,
  stroke-vs-background ΔL 81. PASS.
- **Default social card**: found the descriptor defect recorded in row 11
  (fixed before merge; now validator-enforced).
- **Maskable icons (192/512)**: green ink bounding box fully inside the 80 %
  safe zone with 24–82 px of slack under circle/rounded/squircle masks;
  zero green pixels clipped. Bbox center offset (−8, +8) px at 512 comes
  from the mark's own open-corner geometry (ink bbox 5–59 of 64 units), not
  misplacement; the tile grid itself is centered. PASS.
- **Avatar 512**: ink bbox inside the r=180 circle-safe zone, offset
  (−7, +6) px, same geometric cause. PASS.
- **Lockups**: dark and light 1200×320 rasters have identical ink extents
  (43,70)–(1188,266) and 83,139 ink pixels each — same geometry, inverted
  grounds; deterministic regeneration byte-matches. The raster exports are
  documented as DejaVu Sans Bold renders of editable SVG text carrying the
  same font stack as the site header, so on any given OS the SVG lockup and
  the site header resolve to the same system font; no pixel-match claim is
  made for the PNGs. PASS.

## 1. Small-size favicon inspection

Rendered from the canonical geometry with `scripts/inspect-favicons.mjs`
(writes `artifacts/brand-previews/`). All checks passed at every size.

| Size | Ink ratio | Solid tiles | Gutter clear | Doorway gap open | Door stroke visible | Charcoal tile |
| --- | ---: | :---: | :---: | :---: | :---: | :---: |
| 16×16 | 0.984 | yes | yes | yes | yes | yes |
| 24×24 | 0.979 | yes | yes | yes | yes | yes |
| 32×32 | 0.969 | yes | yes | yes | yes | yes |
| 48×48 | 0.970 | yes | yes | yes | yes | yes |
| 180×180 | 0.962 | yes | yes | yes | yes | yes |
| 192×192 | 0.961 | yes | yes | yes | yes | yes |
| 512×512 | 0.960 | yes | yes | yes | yes | yes |

Findings: the 16 px version survives without a simplified variant — tiles are
chunky, the 1 px gutter and 2 px doorway gap remain visible, and the door
frame stroke stays solid. No edge clipping, no filled-in negative space, no
muddy details, no disappearing strokes, and no accidental letterform (the open
frame reads as a tile doorway only in the context of the three solid tiles).
The mark remains distinct from Beacon Lattice's grid-plus-cross icon because
it contains no cross and no central glyph.

## 2. Maskable and mask simulations

The maskable 512 icon (full-bleed charcoal, mark inside the central 80 % safe
zone) was tested under circle, rounded-square, and squircle masks:

| Mask | Mark pixels clipped | Mark fully inside |
| --- | ---: | :---: |
| Circle (r=205) | 0 | yes |
| Rounded square (r=92) | 0 | yes |
| Squircle (n=4) | 0 | yes |

The rounded "any" icon clips under a strict circular crop by design (its
corners are charcoal, and the mark corner sits at radius ~271 px); platforms
that circular-crop must use the `maskable` variants. This is documented in the
manifest and `docs/BRAND_GUIDE.md`.

## 3. Monochrome and forced-colours approximation

- `symbol-white.svg` on charcoal: content box within the swatch; white ink
  fully legible (measured alpha/coverage in `artifacts/brand-previews/`).
- `symbol-black.svg` on white: same geometry, black ink fully legible.
- Forced-colours approximation: the header mark uses CSS variables and the
  `currentColor`-style inline SVG, so it inherits forced-colour palettes
  without breaking the doorway silhouette (verified in the browser captures
  with `forcedColors: active`).

## 4. Browser capture log

The table below lists every requested capture. Each row's result comes from
the corresponding capture in the `pr-visual-captures` artifact (filename
`brand/<name>.jpg`) plus the `review-metrics.json` measurements recorded with
it.

| # | Capture | State | Viewport / size | Result | Defect found | Correction made |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `01-homepage-header-desktop.jpg` | Homepage, consent denied | 1440×900 | PASS — header ≤ 100 px, mark 32 px, no overflow | none | — |
| 2 | `02-homepage-header-390.jpg` | Homepage | 390×844 | PASS | none | — |
| 3 | `03-homepage-header-320.jpg` | Homepage | 320×700 | PASS — clean at 320 px | none | — |
| 4 | `04-header-200-percent-zoom.jpg` | Homepage, 200 % equivalent viewport | 640×512 | PASS — no horizontal overflow | none | — |
| 5 | `05-header-400-percent-reflow.jpg` | Homepage, 400 % equivalent viewport | 320×256 | PASS — reflows without overflow | none | — |
| 6 | `06-media-page-desktop.jpg` | /media/ | 1440×900 | PASS | none | — |
| 7 | `07-media-page-390.jpg` | /media/ | 390×844 | PASS | none | — |
| 8 | `08-media-page-320.jpg` | /media/ | 320×700 | PASS | none | — |
| 9 | `09-media-page-200-percent-zoom.jpg` | /media/, 200 % equivalent viewport | 640×512 | PASS | none | — |
| 10 | `10-media-download-section.jpg` | /media/ downloads | 1440×900 | PASS — labels name file types | none | — |
| 11 | `11-default-social-card.jpg` | Rendered file | 1200×630 | DEFECT FOUND IN RE-REVIEW, then FIXED — the first pass only asserted image dimensions; a pixel-margin audit found the 42 px descriptor line ending 10 px from the right edge (outside crop-safe space). Descriptor reset to 34 px: title/descriptor ink now ends at x 1114/1124 (right margins 85/75 px), text-block center within 4 px of card center. `npm run validate:brand` now enforces a ≥56 px text margin on every side. | Descriptor margin failure | `scripts/generate-brand-assets.mjs` (font-size 42→34) + new safe-zone check in `scripts/validate-brand.mjs`; card and media kit regenerated |
| 12 | `12-avatar.jpg` | Rendered file | 512×512 | PASS — mark inside circle-safe zone | none | — |
| 13 | `13-favicon-size-comparison.jpg` | Committed files, 8× nearest | 16…512 | PASS — every size legible | none | — |
| 14 | `14-maskable-icon-comparison.jpg` | Maskable + mask sims | 512 | PASS — no mark clipping | none | — |
| 15 | `15-logo-variants.jpg` | Dark/light lockups | 1200×320 | PASS — variants legible on both grounds | none | — |
| 16 | `16-footer-after-branding.jpg` | Footer | 1440×900 | PASS — compact, three groups, small symbol | none | — |
| 17 | `17-game-page-header.jpg` | /games/color-flip/ | 1440×900 | PASS | none | — |
| 18 | `18-my-arcade-header.jpg` | /my-arcade/ | 1440×900 | PASS | none | — |
| 19 | `19-quiet-setup-header.jpg` | /setup/ | 1440×900 | PASS | none | — |

No overlap, no clipped logo, no header-height regression (all ≤ 100 px), and
no footer expansion were observed in any capture; the numbers are recorded in
the artifact's `review-metrics.json`.
