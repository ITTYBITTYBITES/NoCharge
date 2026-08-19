# Platform maturity PR captures

These are review captures from the production build with optional services denied. They show the actual shared toolbar, pause overlay, fullscreen viewport, public trust pages, and article pages at desktop and mobile widths.

## Editorial governance and local discovery (2026-08-19)

For pull requests, CI runs the `CAPTURE_PR=1` Playwright capture test with stable hosted Chrome and uploads `pr-17-visual-captures` for seven days. It produces desktop (1440×1000), mobile (390×844), narrow mobile (320×760), and 200% zoom captures. The set covers the homepage with Recently Played empty and populated, Arcade with Recently Played populated, the platform article index and testing article, the Collections index, all four collection routes, Privacy after Clear Game Data, plus focused homepage and keyboard-collection views at 320px and 200% zoom.

The run seeds only local game IDs/timestamps, stubs Google endpoints, never clicks an advertisement, and reuses current real artwork. Review for horizontal overflow, clear headings/focus, artwork crops, consent layering, mobile readability, and bottom-banner separation. Automated captures supplement rather than replace manual device and assistive-technology review.

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
