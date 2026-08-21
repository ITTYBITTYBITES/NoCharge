# Game artwork inventory

All packages are original Quiet Arcade work. Raster covers are reproducible with `npm run art:memory`, `npm run art:word`, `npm run art:color`, and `npm run art:beacon`. `npm run art:beacon` writes covers and diagrams only and does not overwrite gameplay screenshots. Beacon Lattice `screenshot-desktop.webp` and `screenshot-mobile.webp` must be replaced with mounted-DOM captures via `npm run capture:beacon` before they are documented as gameplay rasters. JPEG social cards are used for Open Graph, Twitter, and structured data.

| Game / asset | Dimensions | Size |
| --- | ---: | ---: |
| memory-match / `controls-diagram.svg` | vector | 3.7 KB |
| memory-match / `cover-landscape.jpg` | 1280×720 | 12.8 KB |
| memory-match / `cover-landscape.webp` | 1280×720 | 8.4 KB |
| memory-match / `cover-square.jpg` | 800×800 | 10.8 KB |
| memory-match / `cover-square.webp` | 800×800 | 7.1 KB |
| memory-match / `guide-header.jpg` | 1280×640 | 13.4 KB |
| memory-match / `guide-header.webp` | 1280×640 | 8.2 KB |
| memory-match / `icon.svg` | vector | 1.5 KB |
| memory-match / `screenshot-desktop.webp` | 1440×900 | 20.8 KB |
| memory-match / `screenshot-mobile.webp` | 720×1280 | 19.0 KB |
| memory-match / `social-card.jpg` | 1200×630 | 12.5 KB |
| memory-match / `social-card.webp` | 1200×630 | 8.0 KB |
| word-tile-rush / `controls-diagram.svg` | vector | 1.5 KB |
| word-tile-rush / `cover-landscape.jpg` | 1280×720 | 25.9 KB |
| word-tile-rush / `cover-landscape.webp` | 1280×720 | 50.8 KB |
| word-tile-rush / `cover-square.jpg` | 800×800 | 17.5 KB |
| word-tile-rush / `cover-square.webp` | 800×800 | 43.9 KB |
| word-tile-rush / `guide-header.jpg` | 1280×640 | 24.9 KB |
| word-tile-rush / `guide-header.webp` | 1280×640 | 44.8 KB |
| word-tile-rush / `icon.svg` | vector | 0.3 KB |
| word-tile-rush / `scoring-diagram.svg` | vector | 1.5 KB |
| word-tile-rush / `screenshot-desktop.webp` | 1440×900 | 9.8 KB |
| word-tile-rush / `screenshot-mobile.webp` | 720×1280 | 12.3 KB |
| word-tile-rush / `social-card.jpg` | 1200×630 | 23.4 KB |
| word-tile-rush / `social-card.webp` | 1200×630 | 42.6 KB |
| word-tile-rush / `source.svg` | vector | 3.7 KB |
| color-flip / `controls-diagram.svg` | vector | 1.5 KB |
| color-flip / `cover-landscape.jpg` | 1280×720 | 22.0 KB |
| color-flip / `cover-landscape.webp` | 1280×720 | 53.6 KB |
| color-flip / `cover-square.jpg` | 800×800 | 15.5 KB |
| color-flip / `cover-square.webp` | 800×800 | 45.8 KB |
| color-flip / `guide-header.jpg` | 1280×640 | 20.9 KB |
| color-flip / `guide-header.webp` | 1280×640 | 46.9 KB |
| color-flip / `icon.svg` | vector | 0.3 KB |
| color-flip / `modes-diagram.svg` | vector | 1.5 KB |
| color-flip / `screenshot-desktop.webp` | 1440×900 | 13.3 KB |
| color-flip / `screenshot-mobile.webp` | 720×1280 | 15.7 KB |
| color-flip / `social-card.jpg` | 1200×630 | 20.7 KB |
| color-flip / `social-card.webp` | 1200×630 | 44.7 KB |
| color-flip / `source.svg` | vector | 2.8 KB |

| beacon-lattice / `controls-diagram.svg` | vector | 1.3 KB |
| beacon-lattice / `cover-landscape.jpg` | 1280×720 | 19.0 KB |
| beacon-lattice / `cover-landscape.webp` | 1280×720 | 37.1 KB |
| beacon-lattice / `cover-square.jpg` | 800×800 | 16.1 KB |
| beacon-lattice / `cover-square.webp` | 800×800 | 26.5 KB |
| beacon-lattice / `coverage-diagram.svg` | vector | 1.2 KB |
| beacon-lattice / `guide-header.jpg` | 1280×640 | 17.3 KB |
| beacon-lattice / `guide-header.webp` | 1280×640 | 30.3 KB |
| beacon-lattice / `icon.svg` | vector | 0.4 KB |
| beacon-lattice / `screenshot-desktop.webp` | 1440×900 | 29.2 KB |
| beacon-lattice / `screenshot-mobile.webp` | 720×1280 | 36.5 KB |
| beacon-lattice / `social-card.jpg` | 1200×630 | 17.3 KB |
| beacon-lattice / `social-card.webp` | 1200×630 | 27.7 KB |
| beacon-lattice / `source.svg` | vector | 2.4 KB |

The per-asset hard ceiling is 180 KB; all committed game assets remain below it. Homepage card artwork is lazy-loaded, while only the actual game or guide header LCP candidate is eager.

## Editorial illustration family (2026-08-19)

These original AI-assisted editorial illustrations are concept art, not gameplay captures. Each illustration preserves a 16:9 ratio and has three responsive widths. WebP is primary and JPEG is the fallback. Alt text is empty on all six because the adjacent title and copy carry the meaning; none adds information that requires a screen-reader description of abstract shapes.

| Asset | Routes | 800 WebP / JPEG | 1200 WebP / JPEG | 1600 WebP / JPEG | Alt decision |
| --- | --- | ---: | ---: | ---: | --- |
| `quiet-arcade` | Quiet Arcade platform article card/header | 9,978 / 15,765 B | 17,080 / 30,313 B | 24,536 / 46,820 B | `alt=""`; decorative reinforcement of title and description |
| `local-scores` | Local scores platform article card/header | 8,690 / 19,474 B | 14,064 / 35,091 B | 20,424 / 51,514 B | `alt=""`; adjacent copy explains local browser storage |
| `more-ways` | More ways to play platform article card/header | 19,376 / 33,911 B | 32,752 / 64,773 B | 49,944 / 101,805 B | `alt=""`; adjacent copy names the input methods |
| `testing` | Browser-game testing platform article card/header | 15,862 / 28,330 B | 25,850 / 54,884 B | 40,278 / 88,915 B | `alt=""`; adjacent copy explains the checks |
| `collections` | Collections index | 43,050 / 56,025 B | 68,006 / 99,829 B | 97,612 / 145,650 B | `alt=""`; heading and inclusion-method copy explain discovery |
| `help` | Help page | 20,368 / 34,715 B | 32,680 / 63,801 B | 47,322 / 97,276 B | `alt=""`; support headings and instructions carry the information |

All published files are under `public/editorial-art/` with names `{asset}-{800|1200|1600}.{webp|jpg}`. The asset validator checks dimensions, ratio, existence, file budgets, and rejects unexpected published editorial files. No rejected variants or temporary PNG review files are committed. Generated with the Arena image-generation tool and resized/encoded with Sharp. Existing mounted-DOM gameplay screenshots were not changed.

### Platform-article hero art direction (2026-08-21)

The four platform-article heroes (`quiet-arcade`, `local-scores`, `more-ways`,
`testing`) now mirror the game/guide hero treatment: a 16:9 responsive ladder
on larger screens and a dedicated **square (1:1) crop on phones** served
through `media="(max-width: 36rem)"`, matching `GameArtwork`'s
`mobileVariant="square"`. The square is cut from the full 900-pixel height of
the committed 1600×900 source, with the 900-pixel window centred on the column
of peak visual detail (all four subjects are near the horizontal centre).
Reproduce with `node scripts/build-editorial-art.mjs`.

| Asset | Square WebP / JPEG |
| --- | ---: |
| `quiet-arcade-square` | 15,854 / 42,012 B |
| `local-scores-square` | 11,766 / 45,875 B |
| `more-ways-square` | 24,594 / 75,893 B |
| `testing-square` | 18,938 / 60,196 B |

## Quiet Setup illustration family (regenerated 2026-08-21)

Every one of the five concepts published by PR #20 was inspected at full
1600×900, at card crop, at article-hero size, at 390 px, at 320 px, and
lightened for shadow detail. **All five had concrete drawing defects and were
regenerated at the source.** Three further concepts were added so that no two
adjacent cards in the feed grid show the same illustration.

The earlier note in this file claimed the screens-and-stands concept was fixed
by "correcting its neutral background to charcoal during local derivative
production". Repainting a background does not repair a malformed drawing, and
that claim is withdrawn. Derivative production now performs no compositing at
all: `scripts/build-setup-art.mjs` only normalises each reviewed source to a
true 16:9 frame and encodes the ladder.

### Why each concept was replaced

| Concept | Verdict | Defects found in the published version |
| --- | --- | --- |
| `hero` | Regenerated | The monitor was cut off by the top and right edges of the canvas; the composition was bottom-right weighted with a dead left third. |
| `keyboards` | Regenerated | Severe. Six keyboards, four of them clipped by the frame edges; the bottom compact board was malformed as two overlapping ghosted bodies with keys outside the case outline; an unexplained dark smudge on the amber board; no focal point, and an unreadable stripe pattern at card size. |
| `pointing` | Regenerated | The mouse was two conflicting overlapping shapes with a broken silhouette; background was near-black rather than charcoal, inconsistent with the family; subjects small and detail lost at card size. |
| `screens-stands` | Regenerated | Impossible stand geometry — base plates floated detached below the necks; the desk line was broken into disjoint segments; cables emerged from mid-air and ran off both frame edges; the top half was empty; no stand subject at all despite the topic. |
| `puzzles-desk` | Regenerated | Large bright cream page areas dominated the frame and clashed with the charcoal foundation; several puzzle grids read as unintended pseudo-text letterforms; drop-shadow style inconsistent with the rest of the family. |

### Concepts added to remove adjacent duplicates

Eight articles previously shared five concepts, and because the feed is ordered
by publication date the repeats landed **side by side in every grid row after
the first**: keyboards/keyboards, screens-stands/screens-stands and
puzzles-desk/puzzles-desk. Restrained alternatives were considered first —
reordering is not available because the feed is date-ordered, and a CSS framing
tint alone does not stop two identical images from reading as a duplicate. A
per-topic hairline tint *was* added as well, but three new concepts were the
honest fix.

| New concept | Article | Subject |
| --- | --- | --- |
| `switches` | Quiet keyboard switches explained | Three cutaway key switches with differing sound arcs |
| `zoom-display` | Browser zoom versus a larger display | Two screens: few large bars versus many small bars |
| `desk-noise` | A low-noise desk setup | Overhead desk mat, keyboard, pointer, coiled cable, one sound source |

`puzzles-desk` is now used only for the offline puzzle-book article, which its
subject actually depicts.

### Generation and inspection process

- Three generation batches of **5, 4 and 1** images. No batch exceeded five.
- Every result was opened and inspected before the next batch was requested.
- Rejected versions: `hero` v2 (subject too small in frame, screen rendered
  near-black) and `zoom-display` v1 (colour-saturated panels read as a fake
  wireframe UI). Neither was committed; both were regenerated and the rejects
  deleted.
- Reviewed sources live in the git-ignored `artifacts/art-src/` directory and
  are intentionally not committed. Only the 48 published derivatives ship.
- Reproduce the published files with
  `SETUP_ART_SOURCE=artifacts/art-src node scripts/build-setup-art.mjs`.

### Published files

All under `public/setup-art/`, named `{concept}-{800|1200|1600}.{webp|jpg}`, at
800×450, 1200×675 and 1600×900. WebP is primary, JPEG is the fallback.
`alt=""` on every in-page instance: each illustration is decorative
reinforcement, and the adjacent topic label, heading and description carry the
meaning. The Setup index social preview keeps descriptive metadata because it
appears without an adjacent visible heading.

| Asset | 800 WebP / JPEG | 1200 WebP / JPEG | 1600 WebP / JPEG |
| --- | ---: | ---: | ---: |
| `hero` | 5,396 / 12,844 B | 9,430 / 22,850 B | 13,376 / 33,340 B |
| `keyboards` | 12,376 / 32,596 B | 20,658 / 57,360 B | 27,596 / 82,347 B |
| `pointing` | 3,724 / 11,458 B | 6,244 / 19,921 B | 8,726 / 29,698 B |
| `screens-stands` | 7,318 / 16,897 B | 11,248 / 28,638 B | 15,290 / 41,050 B |
| `puzzles-desk` | 12,340 / 25,654 B | 21,176 / 45,562 B | 28,820 / 64,457 B |
| `switches` | 9,668 / 23,834 B | 15,518 / 39,774 B | 20,600 / 55,606 B |
| `zoom-display` | 4,248 / 22,626 B | 7,310 / 39,530 B | 10,648 / 52,250 B |
| `desk-noise` | 6,266 / 16,685 B | 10,686 / 29,496 B | 15,232 / 42,594 B |

48 files, 1,155,057 bytes total. Eight concepts now weigh less than the five
they replace: the previous `keyboards-1600.jpg` alone was 163,297 B against
82,347 B today. The asset validator checks every concept's existence,
dimensions, 16:9 ratio and byte budget, and now also **rejects any unexpected
file** published under `setup-art/`, so a rejected variant or a stale concept
cannot ship unnoticed.

### Responsive `sizes` decisions

Sources and frames are both 16:9, so `object-fit: cover` never actually crops
and no per-concept `object-position` is required; every concept is composed
with a margin on all four sides. The rule is retained only as a guard against
sub-pixel rounding.

| Usage | `sizes` | Reasoning |
| --- | --- | --- |
| Index hero | `(max-width: 52rem) min(calc(100vw - 2rem), 24rem), 42vw` | Mirrors the 24 rem mobile cap and the 42 vw desktop column, so a phone never requests the 1600 px asset. |
| Setup card | `(max-width: 47.99rem) calc(100vw - 2rem), (max-width: 70rem) calc(50vw - 2.4rem), 33rem` | Matches the `auto-fit`/`minmax(19rem)` grid: full width in one column, roughly half the viewport in two, and ~33 rem at the 72 rem shell maximum. |
| Article hero | `(max-width: 54rem) calc(100vw - 2rem), 52rem` | The article column is 52 rem. The previous default claimed 48 rem, so at 1440 px the browser was allowed to pick the 800 px file for an 832 px slot — a visibly soft hero. |

Browser-selected `currentSrc` is asserted for the mobile card, the desktop
card, the mobile article hero and the desktop article hero in
`tests/e2e/quiet-setup-geometry.spec.ts`. The assertions use bounded ranges
rather than one exact filename so a different device pixel ratio does not make
them brittle.

### Art direction preserved

Deep charcoal foundation; muted teal, amber, slate blue and coral; calm
geometric editorial illustration; clear silhouettes; comfortable negative
space. No embedded words, no Amazon branding, no recognisable branded products,
no photorealistic shopping imagery, no fake screenshots, no sale symbols,
prices, stars, carts, coins or rewards, and no medical or accessibility
symbolism used decoratively. Existing mounted-DOM gameplay screenshots and all
game artwork are unchanged.

## Brand identity package (2026-08-21)

The brand mark is a deliberately constructed SVG (see `docs/BRAND_GUIDE.md`):
four rounded tiles with the bottom-left tile open as a doorway. The canonical
source is `public/brand/nocharge-symbol.svg`; every favicon, PWA icon, social
asset, and press export is derived from it by `npm run art:brand`
(`scripts/generate-brand-assets.mjs`). The generator never touches game,
editorial, or Quiet Setup artwork and never creates gameplay screenshots.

| File | Dimensions / type | Size | Notes |
| --- | ---: | ---: | --- |
| `brand/nocharge-symbol.svg` | vector (64×64) | 1.5 KB | Canonical; `currentColor` mark |
| `brand/nocharge-symbol-black.svg` | vector | 0.5 KB | Monochrome, light backgrounds |
| `brand/nocharge-symbol-white.svg` | vector | 0.5 KB | Monochrome, dark backgrounds |
| `brand/nocharge-lockup-dark.svg` | vector (480×128) | 1.0 KB | Green symbol + light wordmark |
| `brand/nocharge-lockup-light.svg` | vector (480×128) | 1.0 KB | Deep-green symbol + dark wordmark |
| `brand/nocharge-symbol-512.png` | 512×512 PNG | 5.3 KB | Transparent press export |
| `brand/nocharge-lockup-dark-1200.png` | 1200×320 PNG | 18.7 KB | Transparent press export |
| `brand/nocharge-lockup-light-1200.png` | 1200×320 PNG | 18.6 KB | Transparent press export |
| `favicon.svg` | vector (64×64) | 0.7 KB | Charcoal tile + green mark |
| `favicon.ico` | ICO (16/32/48) | 2.1 KB | PNG-compressed entries |
| `favicon-16x16.png` / `-32x32.png` / `-48x48.png` | exact PNGs | 0.4 / 0.6 / 1.0 KB | — |
| `apple-touch-icon.png` | 180×180 PNG | 2.1 KB | Full-bleed square (iOS masks) |
| `icons/icon-192.png` / `icon-512.png` | 192 / 512 PNG | 2.5 / 6.7 KB | Rounded tile, `purpose: any` |
| `icons/icon-maskable-192.png` / `-512.png` | 192 / 512 PNG | 1.6 / 4.0 KB | Full-bleed; mark inside 80 % safe zone |
| `social/nocharge-default.jpg` / `.webp` | 1200×630 | 27.7 / 14.1 KB | Deterministic SVG composition |
| `social/nocharge-avatar-512.png` | 512×512 PNG | 5.4 KB | Rounded tile; mark inside circle-safe zone |
| `media/nocharge-media-kit.zip` | ZIP (15 files) | 194 KB | Built by `npm run kit:media` |

Text inside lockups and the social card is composed deterministically with the
documented system font stack (Inter → system UI → DejaVu Sans); raster
exports render with DejaVu Sans Bold. `scripts/validate-brand.mjs` enforces
dimensions, ICO entries, the maskable safe zone, manifest accuracy, and the
absence of invented social handles; `scripts/validate-media-kit.mjs` verifies
the archive contents byte-for-byte against the committed sources.

### Genuine gameplay screenshots (media kit)

Only `public/game-art/beacon-lattice/screenshot-desktop.webp` is a genuine
mounted-DOM capture (see `docs/BEACON_LATTICE_CAPTURE.md`), so it is the only
screenshot shipped in the media kit and shown on `/media/`. Memory Match,
Word Tile Rush, and Color Flip `screenshot-*.webp` files are generated
previews and are deliberately **not** published as gameplay anywhere in the
brand package.
