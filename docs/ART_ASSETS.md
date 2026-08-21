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

## Quiet Setup illustration family (2026-08-21)

Five AI-assisted concepts were generated in batches of no more than five images and inspected for malformed hardware, pseudo-text, logos, misleading UI, and commercial product resemblance. They are original editorial illustrations—not product photos, Amazon Program Content, logos, or gameplay screenshots. Source prompts specified the Quiet Arcade family, charcoal foundations, muted teal/amber/blue/coral accents, geometric forms, coherent abstract hardware, negative space, and prohibited words, branding, shopping motifs, fake UI, and product packaging. Responsive derivatives were produced with ImageMagick. The initially generated screens-and-stands concept had an overly light foundation; its neutral background was corrected to charcoal during local derivative production, then the temporary source was removed.

| Asset | Routes | 800 WebP / JPEG | 1200 WebP / JPEG | 1600 WebP / JPEG | Alt decision |
|---|---|---:|---:|---:|---|
| `hero` | Setup index and “What Quiet Setup means” | 7,708 / 18,509 B | 12,632 / 41,077 B | 16,922 / 67,970 B | `alt=""`; adjacent headings and prose convey the concept |
| `keyboards` | Compact layout and quiet switches articles/cards | 33,392 / 61,266 B | 59,356 / 115,812 B | 69,838 / 163,297 B | `alt=""`; adjacent headings and prose convey the concept |
| `pointing` | Input-method article/card | 12,052 / 24,301 B | 20,864 / 47,199 B | 25,952 / 69,905 B | `alt=""`; adjacent headings and prose convey the concept |
| `screens-stands` | Stand and browser-zoom articles/cards | 4,470 / 13,410 B | 7,760 / 25,155 B | 12,038 / 37,826 B | `alt=""`; adjacent headings and prose convey the concept |
| `puzzles-desk` | Offline puzzle and low-noise desk articles/cards | 23,844 / 41,289 B | 39,336 / 76,973 B | 48,400 / 109,936 B | `alt=""`; adjacent headings and prose convey the concept |

All files are under `public/setup-art/` at 800×450, 1200×675, and 1600×900 in WebP primary and JPEG fallback formats. Temporary generation sources and rejected variants are not committed. The setup index social preview uses descriptive metadata because it stands outside an adjacent visible heading; in-page images remain decorative. Existing mounted-DOM gameplay screenshots are unchanged.
