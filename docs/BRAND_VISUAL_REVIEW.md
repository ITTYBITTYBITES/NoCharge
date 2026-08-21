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
| 11 | `11-default-social-card.jpg` | Rendered file | 1200×630 | PASS — text inside safe zones (deterministic composition) | none | — |
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
