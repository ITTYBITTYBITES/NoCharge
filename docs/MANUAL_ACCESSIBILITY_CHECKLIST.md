# Manual accessibility owner checklist

This handoff records checks automation cannot complete. It does not claim certification. Mark an item complete only after a person performs it and records date, tester, browser/device, pages, result, and issue links.

## 1. Automated checks completed by the repository suite

- [x] Chromium Playwright interaction checks for all seventeen games (eleven solo plus the six Pass &amp; Play games, their shared handoff screen, and their bounded local records), shared lifecycle, Recently Played, My Arcade, collections, and platform articles
- [x] Axe scans against the maintained public route matrix
- [x] Keyboard interaction checks for representative game and platform paths, including keyboard-only runs of the five keyboard-operable Pass &amp; Play games (Pass the Picture's pointer-only drawing is documented on its page and in the platform article)
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
7. My Arcade in four states: nothing saved, one game played, all four games with saved results, and local storage blocked

For every sequence, confirm one H1, logical headings, visible focus, readable status feedback, no horizontal overflow, and no advertisement/consent layer covering controls.

### Keyboard only

- [ ] Date: ______ Tester: ______ Browser/device: ______
  - Complete navigation and one meaningful action in each game without a pointer.
  - Pause/resume, restart, mute, and full-screen/immersive controls; return focus after exit.
  - Reach Recently Played and collection cards in a sensible order.
  - On My Arcade, reach every Continue, Play, and Guide link, open and cancel the clear confirmation, and confirm focus returns to the trigger.
  - Result/findings/issues: ______

### My Arcade local states

- [ ] Date: ______ Tester: ______ Browser/device: ______
  - Load `/my-arcade/` with nothing saved and confirm the loading line is replaced once, that no Recently Played heading appears, and that no completion percentage or zero-filled table is shown.
  - Play one game, return, and confirm the Continue playing entry, its date wording, and that reloading the dashboard does not reorder or re-stamp anything.
  - With all four games populated, confirm each card states its own metric with a text label rather than an icon or colour alone.
  - Block site data in browser settings and confirm the storage-unavailable explanation appears with every game link still usable.
  - Result/findings/issues: ______

### 200% browser zoom

- [ ] Date: ______ Tester: ______ Browser/device: ______
  - Run the core routes at 200% zoom; confirm reflow, no clipped controls or horizontal page scrolling, readable articles, cards, consent UI, Privacy status, and My Arcade metric groups.
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
  - Check visible focus, selected/disabled states, Memory cards, Word tiles/path, labeled Color Flip state, Beacon gap/exact/overlap labels, My Arcade metric labels and clear confirmation, links, buttons, and consent layers.
  - Result/findings/issues: ______

### NVDA + Chrome and Firefox

- [ ] Chrome date/tester/version: ______ Result/issues: ______
- [ ] Firefox date/tester/version: ______ Result/issues: ______
  - In each browser, navigate landmarks/headings; operate one full or representative game loop per game; verify selected state, scores/status, pause announcements, Recently Played order, My Arcade metric labels and its clear-result live region, collection reasons, article metadata, and Privacy clear status.

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
