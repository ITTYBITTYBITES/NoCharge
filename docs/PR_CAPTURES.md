# Platform maturity PR captures

These are review captures from the production build with optional services denied. They show the actual shared toolbar, pause overlay, fullscreen viewport, public trust pages, and article pages at desktop and mobile widths.

## Editorial governance and local discovery (2026-08-19)

For pull requests, CI runs the `CAPTURE_PR=1` Playwright capture test with stable hosted Chrome and uploads `pr-17-visual-captures` for seven days. It produces desktop (1440×1000), mobile (390×844), narrow mobile (320×760), and 200% zoom captures. The set covers the homepage with Recently Played empty and populated, Arcade with Recently Played populated, the platform article index and testing article, the Collections index, all four collection routes, Privacy after Clear Game Data, plus focused homepage and keyboard-collection views at 320px and 200% zoom.

The run seeds only local game IDs/timestamps, stubs Google endpoints, never clicks an advertisement, and reuses current real artwork. Automated captures supplement rather than replace manual device and assistive-technology review.

### PR #17 visual review

Reviewed on 2026-08-19 from exact-SHA CI run `32297596410`. The retained files are in [`pr-17-captures/`](./pr-17-captures/).

| Surface | Desktop | Mobile / zoom |
| --- | --- | --- |
| Homepage, empty | [Desktop](./pr-17-captures/desktop-home-recent-empty.jpg) | [Mobile](./pr-17-captures/mobile-home-recent-empty.jpg) |
| Homepage, populated | [Desktop](./pr-17-captures/desktop-home-recent-populated.jpg) | [320px](./pr-17-captures/mobile-320-home-recent-populated.jpg) · [200%](./pr-17-captures/zoom-200-home-recent-populated.jpg) |
| Arcade, populated | [Desktop](./pr-17-captures/desktop-arcade-recent-populated.jpg) | [Mobile](./pr-17-captures/mobile-arcade-recent-populated.jpg) |
| Article index / platform article | [Index](./pr-17-captures/desktop-articles.jpg) · [Article](./pr-17-captures/desktop-article-platform-testing.jpg) | [Index](./pr-17-captures/mobile-articles.jpg) · [Article](./pr-17-captures/mobile-article-platform-testing.jpg) |
| Collections | [Index](./pr-17-captures/desktop-collections.jpg) · [Keyboard](./pr-17-captures/desktop-collection-keyboard.jpg) · [Reduced pressure](./pr-17-captures/desktop-collection-reduced-pressure.jpg) · [No accounts](./pr-17-captures/desktop-collection-no-accounts.jpg) · [Short break](./pr-17-captures/desktop-collection-short-break.jpg) | [Index](./pr-17-captures/mobile-collections.jpg) · [320px](./pr-17-captures/mobile-320-collection-keyboard.jpg) · [200%](./pr-17-captures/zoom-200-collection-keyboard.jpg) |
| Privacy clear result | [Desktop](./pr-17-captures/desktop-privacy-clear-result.jpg) | [Mobile](./pr-17-captures/mobile-privacy-clear-result.jpg) |

Findings:

- Empty Recently Played is absent: no heading, blank panel, or artificial section gap remains.
- Populated Recently Played is clearly labeled and separate from the canonical game catalog. Each game appears once per section with matching artwork, title, genre, and session metadata.
- Cards remain contained at 390px and 320px. At 200% zoom the homepage and keyboard collection reflow into a readable single-column layout with visible controls and no clipped text.
- Collection names, inclusion methods, per-game reasons, and the deliberate three-game reduced-pressure distinction are understandable.
- The platform article offers Arcade, Privacy, Accessibility, About, and guide-library paths; it has no fake Play Game or game-specific guide CTA.
- Footer navigation wraps cleanly at narrow widths and 200% zoom.
- The Privacy result clearly confirms that scores, preferences, and Recently Played were cleared.
- The reserved Advertisement region remains in normal flow and visually separate from cards, article text, game controls, and the footer.
- No consent control or advertisement was used to seed Recently Played.

No visual product correction was required.

## Game controls and immersive viewport

### Memory Match

| Desktop normal | Desktop full screen |
| --- | --- |
| ![Memory Match normal desktop](./pr-captures/desktop-memory-match-normal.jpg) | ![Memory Match full screen desktop](./pr-captures/desktop-memory-match-fullscreen-or-immersive.jpg) |

| Mobile normal | Mobile full screen or immersive |
| --- | --- |
| ![Memory Match normal mobile](./pr-captures/mobile-memory-match-normal.jpg) | ![Memory Match full screen or immersive mobile](./pr-captures/mobile-memory-match-fullscreen-or-immersive.jpg) |

### Word Tile Rush

| Desktop normal | Desktop full screen |
| --- | --- |
| ![Word Tile Rush normal desktop](./pr-captures/desktop-word-tile-rush-normal.jpg) | ![Word Tile Rush full screen desktop](./pr-captures/desktop-word-tile-rush-fullscreen-or-immersive.jpg) |

| Mobile normal | Mobile full screen or immersive |
| --- | --- |
| ![Word Tile Rush normal mobile](./pr-captures/mobile-word-tile-rush-normal.jpg) | ![Word Tile Rush full screen or immersive mobile](./pr-captures/mobile-word-tile-rush-fullscreen-or-immersive.jpg) |

### Color Flip

| Desktop normal | Desktop full screen |
| --- | --- |
| ![Color Flip normal desktop](./pr-captures/desktop-color-flip-normal.jpg) | ![Color Flip full screen desktop](./pr-captures/desktop-color-flip-fullscreen-or-immersive.jpg) |

| Mobile normal | Mobile full screen or immersive |
| --- | --- |
| ![Color Flip normal mobile](./pr-captures/mobile-color-flip-normal.jpg) | ![Color Flip full screen or immersive mobile](./pr-captures/mobile-color-flip-fullscreen-or-immersive.jpg) |

### Beacon Lattice

Gameplay screenshots in `public/game-art/beacon-lattice/screenshot-*.webp` are captured from the mounted Long plus board with a mixed Gap / Exact / Overlap state.

### Pause overlay and shared toolbar

| Desktop | Mobile |
| --- | --- |
| ![Memory Match pause overlay desktop](./pr-captures/desktop-memory-match-pause-overlay.jpg) | ![Memory Match pause overlay mobile](./pr-captures/mobile-memory-match-pause-overlay.jpg) |

## Public trust and content pages

| Page | Desktop | Mobile |
| --- | --- | --- |
| About | ![About desktop](./pr-captures/desktop-about.jpg) | ![About mobile](./pr-captures/mobile-about.jpg) |
| Terms of Use | ![Terms desktop](./pr-captures/desktop-terms.jpg) | ![Terms mobile](./pr-captures/mobile-terms.jpg) |
| Advertising Disclosure | ![Advertising desktop](./pr-captures/desktop-advertising.jpg) | ![Advertising mobile](./pr-captures/mobile-advertising.jpg) |
| Changelog | ![Changelog desktop](./pr-captures/desktop-changelog.jpg) | ![Changelog mobile](./pr-captures/mobile-changelog.jpg) |
| Article index | ![Article index desktop](./pr-captures/desktop-articles.jpg) | ![Article index mobile](./pr-captures/mobile-articles.jpg) |
| Representative article | ![Article desktop](./pr-captures/desktop-article-memory-scan.jpg) | ![Article mobile](./pr-captures/mobile-article-memory-scan.jpg) |
