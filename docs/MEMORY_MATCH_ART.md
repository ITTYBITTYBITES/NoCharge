# Memory Match artwork package

The Memory Match pilot uses original vector-defined artwork following the Quiet Arcade direction in [`ART_DIRECTION.md`](./ART_DIRECTION.md).

## Rebuilding the raster exports

The editable source is [`scripts/generate-memory-match-art.mjs`](../scripts/generate-memory-match-art.mjs). It keeps the illustration and gameplay-preview compositions as SVG strings until export. After installing dependencies, regenerate all cover, guide, social, fallback, and gameplay-preview raster files with:

```sh
npm run art:memory
```

`icon.svg` and `controls-diagram.svg` remain directly editable vector files.

## Asset inventory

Dimensions and file sizes were measured from the committed files after the final export.

| Asset | Dimensions | Size | Budget |
| --- | ---: | ---: | ---: |
| `icon.svg` | Vector, 96×96 view box | 1.5 KB | 20 KB |
| `cover-square.webp` | 800×800 | 7.1 KB | 90 KB |
| `cover-square.jpg` | 800×800 | 10.8 KB | 90 KB |
| `cover-landscape.webp` | 1280×720 | 8.4 KB | 130 KB |
| `cover-landscape.jpg` | 1280×720 | 12.8 KB | 130 KB |
| `social-card.webp` | 1200×630 | 8.0 KB | 160 KB |
| `social-card.jpg` | 1200×630 | 12.5 KB | 160 KB |
| `guide-header.webp` | 1280×640 | 8.2 KB | 130 KB |
| `guide-header.jpg` | 1280×640 | 13.4 KB | 130 KB |
| `screenshot-mobile.webp` | 720×1280 | 19.0 KB | 140 KB |
| `screenshot-desktop.webp` | 1440×900 | 20.8 KB | 180 KB |
| `controls-diagram.svg` | Vector, 960×520 view box | 3.7 KB | 20 KB |

## PR visual review

The before/after captures in `docs/pr-7/` use the game page at desktop (1440×1000) and mobile (390×844) viewports. The after captures are generated from this branch; the before captures use the current production baseline.

The review verifies:

- **Crop:** desktop uses the full 16:9 landscape cover; mobile swaps to the square cover. Both use `object-fit: cover` inside an explicitly reserved ratio.
- **Focus:** keyboard focus remains visible on the game controls and cards; game logic and focus management are unchanged.
- **Layout shift:** all artwork and guide-preview images reserve dimensions or an explicit responsive aspect ratio before loading.
- **Consent overlay:** the existing consent panel remains above page artwork, retains its controls, and does not become obscured by the new header composition.
