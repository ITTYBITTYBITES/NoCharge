# Manual accessibility owner checklist

This handoff records checks automation cannot complete. It does not claim certification. Mark an item complete only after a person performs it and records date, tester, browser/device, pages, result, and issue links.

## 1. Automated checks completed by the repository suite

- [x] Chromium Playwright interaction checks for four games, shared lifecycle, Recently Played, collections, and platform articles
- [x] Axe scans against the maintained public route matrix
- [x] Keyboard interaction checks for representative game and platform paths
- [x] HTML, headings, internal links, sitemap, structured data, and asset-budget validation
- [x] Consent-gated network checks with third-party endpoints stubbed and no ad clicks

Automation reduces risk. It does not prove assistive-technology compatibility, physical-device usability, or WCAG conformance.

## 2. Manual checks completed

None recorded as of 2026-08-19. No manual assistive-technology or physical-device checks are marked complete.

## 3. Owner test sequence still required

Use the same core route set for each applicable sequence:

1. Homepage with Recently Played empty, then populated after a meaningful action
2. Arcade with Recently Played populated
3. Memory Match, Word Tile Rush, Color Flip Visual and Turn-based modes, and Beacon Lattice
4. Articles index and one platform article
5. Collections index and every published collection
6. Privacy Clear Game Data, confirming Recently Played disappears while analytics consent remains unchanged

For every sequence, confirm one H1, logical headings, visible focus, readable status feedback, no horizontal overflow, and no advertisement/consent layer covering controls.

### Keyboard only

- [ ] Date: ______ Tester: ______ Browser/device: ______
  - Complete navigation and one meaningful action in each game without a pointer.
  - Pause/resume, restart, mute, and full-screen/immersive controls; return focus after exit.
  - Reach Recently Played and collection cards in a sensible order.
  - Result/findings/issues: ______

### 200% browser zoom

- [ ] Date: ______ Tester: ______ Browser/device: ______
  - Run the core routes at 200% zoom; confirm reflow, no clipped controls or horizontal page scrolling, readable articles, cards, consent UI, and Privacy status.
  - Result/findings/issues: ______

### Reduced motion

- [ ] Date: ______ Tester: ______ Browser/device: ______
  - Enable the OS/browser reduced-motion preference before loading; inspect navigation, card transitions, game feedback, pause overlays, and consent layers.
  - Confirm essential state is not communicated only through animation.
  - Result/findings/issues: ______

### Mobile touch

- [ ] Date: ______ Tester: ______ Physical device/browser: ______
  - Use touch for one meaningful action in all four games, including a Word Tile Rush path, Color Flip mode controls, and Beacon placement.
  - Check populated/empty Recently Played, every collection, a platform article, pause, restart, and Privacy clear.
  - Result/findings/issues: ______

### Windows High Contrast

- [ ] Date: ______ Tester: ______ Browser/device: ______
  - Check visible focus, selected/disabled states, Memory cards, Word tiles/path, labeled Color Flip state, Beacon gap/exact/overlap labels, links, buttons, and consent layers.
  - Result/findings/issues: ______

### NVDA + Chrome and Firefox

- [ ] Chrome date/tester/version: ______ Result/issues: ______
- [ ] Firefox date/tester/version: ______ Result/issues: ______
  - In each browser, navigate landmarks/headings; operate one full or representative game loop per game; verify selected state, scores/status, pause announcements, Recently Played order, collection reasons, article metadata, and Privacy clear status.

### VoiceOver + Safari and iOS

- [ ] macOS Safari date/tester/version: ______ Result/issues: ______
- [ ] iOS Safari date/tester/device: ______ Result/issues: ______
  - Use keyboard on macOS and touch/rotor on iOS. Test all four games, navigation, Recently Played, collections, platform article structure, consent layering, and Privacy clear.

### TalkBack + Android

- [ ] Date: ______ Tester/device/Chrome version: ______
  - Use swipe navigation and activation through the core routes. Confirm game controls and changing states have useful names, touch exploration does not require color/sound, and overlays do not strand focus.
  - Result/findings/issues: ______

### Optional additional coverage

- [ ] JAWS + Chrome — Date/tester/version/result/issues: ______
- [ ] Other physical browsers/devices — Details/result/issues: ______

## Recording results

For a pass, record what was exercised—not only “works.” For a failure, link an issue with route, exact steps, expected/actual result, assistive technology and version, browser, OS/device, and severity. Retest the issue before marking the sequence complete. WCAG 2.2 AA remains a target, not a certification.
