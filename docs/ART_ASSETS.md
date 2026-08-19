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

These original AI-assisted editorial illustrations are concept art, not gameplay captures. They use a shared 1600×900 source/published canvas, WebP primary and JPEG fallback, and stay below the 150 KB WebP / 300 KB JPEG target. No rejected variants or temporary PNG review files are published.

| Asset | Purpose and routes | Formats / sizes | Alt-text decision |
| --- | --- | --- | --- |
| `editorial-art/quiet-arcade` | Platform article card and header: What Quiet Arcade means at NoCharge | WebP 21.3 KB, JPEG 46.8 KB | Informative: “Abstract arcade board with open paths and a softly lit tile.” |
| `editorial-art/local-scores` | Platform article card and header: How NoCharge saves scores without an account | WebP 19.4 KB, JPEG 51.5 KB | Informative: “Layered paths and a single glowing tile contained within a dark board.” |
| `editorial-art/more-ways` | Platform article card and header: Designing browser games for more ways to play | WebP 44.8 KB, JPEG 101.9 KB | Informative: “A geometric game board approached by keyboard, pointer, and touch motifs.” |
| `editorial-art/testing` | Platform article card and header: How NoCharge tests browser games | WebP 37.8 KB, JPEG 88.9 KB | Informative: “Abstract testing shapes, alignment guides, and a magnifying form.” |
| `editorial-art/collections` | Collections index | WebP generated from 1600×900 source, JPEG fallback | Informative: “Several colorful paths converge on a small central arcade.” |
| `editorial-art/help` | Help page | WebP generated from 1600×900 source, JPEG fallback | Informative: “Abstract controls and return paths surround a compact game board.” |

Generated with the Arena image-generation tool from deliberate per-concept prompts, then resized/encoded with Sharp. Article titles and surrounding copy remain the source of meaning; images contain no essential text. All assets are editorial illustrations, never labeled as gameplay or used for screenshot provenance. Existing mounted-DOM gameplay screenshots were not changed.
