# Platform maturity PR captures

These are review captures from the production build with optional services denied. They show the actual shared toolbar, pause overlay, fullscreen viewport, public trust pages, and article pages at desktop and mobile widths.

## Pass & Play (2026-08-22)

The Pass &amp; Play capture block (`tests/e2e/pass-play-captures.spec.ts`, same opt-in `CAPTURE_PR=1` suite) uploads
into `pr-visual-captures` with the existing short retention. It covers all six games as **actual mounted-DOM
gameplay captures** — handoff state and a mid-play state reached through real moves — plus a named-handoff
close-up; the arcade page's two sections and anchor nav at 1440, 390, and 320 px; the homepage Pass &amp; Play
section; the Pass &amp; Play collection and platform article; My Arcade's both-sections empty and populated states;
the 200%-equivalent reflow; and a reduced-motion Reversi board. Local values used are invented fixtures. Findings
are recorded in [`PASS_AND_PLAY_VISUAL_REVIEW.md`](./PASS_AND_PLAY_VISUAL_REVIEW.md). Screenshots are not
committed to Git.

## My Arcade (2026-08-21)

The capture block for `/my-arcade/` runs in the same opt-in `CAPTURE_PR=1` suite and uploads into the same
`pr-visual-captures` artifact with seven-day retention. It covers the empty dashboard at 1440×900, 390×844 and
320×700; the empty dashboard at the 200%-equivalent viewport; one recently played game; multiple recently played
games; all four summary cards with representative valid local data at desktop and 390 px; the 400%-equivalent reflow;
Privacy clearing before and after; the Arcade entry point; the populated homepage Recently Played entry point; and
the storage-unavailable state.

Local values used in the captures are invented fixtures written by the test, never a real visitor's storage. The
block clicks no advertisement and no Amazon link. Findings from opening each image are recorded in
[`MY_ARCADE_VISUAL_REVIEW.md`](./MY_ARCADE_VISUAL_REVIEW.md). Screenshots are not committed to Git.

### Quiet Setup visual repair (2026-08-21)

The Quiet Setup capture block now runs the full reviewed matrix and uploads it as `pr-visual-captures` with short retention: the index at 1440×900, 1024×768, 768×1024, 390×844, 360×800 and 320×700, plus 200%- and 400%-equivalent viewports, reduced motion and forced colors; every one of the eight articles at 1440×900, 390×844, 320×700 and the 200% equivalent; close-ups of the affiliate disclosure, the paid recommendation block, the topic cards, a setup card and the footer/consent boundary at desktop and 320 px; the `/articles/`, `/help/`, `/advertising/` and `/privacy/` entry points; and the platform article whose hero picture was mis-styled, at 360 px, mobile and desktop.

Browser zoom is captured as an equivalent CSS-pixel viewport (a 1280×1024 screen divided by the zoom factor) rather than with the CSS `zoom` property, because media queries ignore `zoom` and would produce a scaled desktop layout instead of the reflow under review. Findings from opening each image are logged in [`QUIET_SETUP_VISUAL_REVIEW.md`](./QUIET_SETUP_VISUAL_REVIEW.md). Screenshots are not committed to Git.

## Editorial governance and local discovery (2026-08-19)

The intended durable CI artifact name is `pr-visual-captures`. The checked-in workflow currently still emits the legacy `pr-17-visual-captures`; changing workflow files requires GitHub App `workflows` permission, which is unavailable to this session.

For pull requests, CI runs the `CAPTURE_PR=1` Playwright capture test with stable hosted Chrome and uploads `pr-17-visual-captures` for seven days until the workflow permission is granted. It produces desktop (1440×1000), mobile (390×844), narrow mobile (320×760), and 200% zoom captures. The set covers the homepage with Recently Played empty and populated, Arcade with Recently Played populated, the platform article index and testing article, the Collections index, all four collection routes, Privacy after Clear Game Data, plus focused homepage and keyboard-collection views at 320px and 200% zoom.

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

### Brand identity and media presence (2026-08-21)

The same `CAPTURE_PR=1` suite now also captures the brand review set into
`pr-visual-captures/brand/` (7-day retention): homepage headers at 1440×900,
390×844 and 320×700; the 200%- and 400%-equivalent header reflows; the
`/media/` page at 1440×900, 390×844, 320×700 and the 200%-equivalent
viewport; the media download section; the rendered default social card and
avatar; deterministic favicon-size, maskable and logo-variant comparison
sheets; the footer after branding; and headers on a game page, My Arcade and
Quiet Setup. DOM measurements (viewport, header height, overflow) accompany
each capture in `brand/review-metrics.json`.

The brand captures never click an advertisement or an Amazon link, never
contact a social platform, and use only committed assets. Findings from
opening each image are recorded in
[`BRAND_VISUAL_REVIEW.md`](./BRAND_VISUAL_REVIEW.md). Screenshots are not
committed to Git.
