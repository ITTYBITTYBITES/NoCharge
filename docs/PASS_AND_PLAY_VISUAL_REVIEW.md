# Pass & Play visual review

Reviewed 2026-08-22 against the production build with optional services denied, from the capture block in
`tests/e2e/pass-play-captures.spec.ts` (34 images, `pr-visual-captures` artifact, short retention). Screenshots
are not committed to Git. Every gameplay image is an actual mounted-DOM capture produced by driving the real game
through Playwright — no manual rasterization anywhere in this family.

## What the capture block covers

| Surface | Captures |
|---|---|
| Six game pages, desktop 1440×1000 | `desktop-{slug}-handoff` (initial handoff) and `desktop-{slug}-midplay` (real moves played) |
| Shared handoff close-up | `desktop-handoff-names` — Match mode with edited names Ada/Grace and a live tally |
| Pass the Picture shared surface | `desktop-pass-the-picture-midplay-shared` — the drawing visible through the translucent handoff, plus the finished-picture end screen |
| Arcade | `desktop-arcade-both-sections`, `mobile-arcade-both-sections`, `mobile-320-arcade-both-sections` (full page, both sections and anchor nav) |
| Homepage | `desktop-home-pass-and-play` (full page — Arcade grid above, Pass & Play section below, Guides/Articles after) |
| Collection and article | `desktop-collection-pass-and-play`, `desktop-article-pass-and-play` |
| My Arcade | `desktop-my-arcade-passplay-empty` (empty state) and `desktop-my-arcade-both-sections-populated` (solo cards + three Pass & Play records) |
| Reflow and motion | `mobile-320-*` set, `zoom-200-four-in-a-row-handoff` (200%-equivalent viewport), `reduced-motion-reversi` |

## Review method and findings

The reviewer opening these images in CI should confirm the points below; each is also backed by an automated
check in `tests/e2e/pass-and-play.spec.ts` or a quantitative image pass run on the artifacts (dimensions,
non-blankness, viewport-width integrity for full-page mobile shots):

- **Handoff screen.** One consistent component across all six games: kicker "Pass &amp; Play", "Pass to {name}"
  heading, optional context and tally, two name inputs, and a large Continue button. Focus lands on Continue
  (asserted in e2e), and the dialog is announced politely.
- **Coverage vs. shared visibility.** The five competitive games' handoffs use the opaque backdrop
  (`desktop-*-handoff`, mean luminance ≈ 29 in the quantitative pass); Pass the Picture's handoff is measurably
  brighter (≈ 32) because its cream canvas shows through the translucent shared backdrop — the intended
  `keepVisible` behavior, captured in `desktop-pass-the-picture-midplay-shared`.
- **Boards.** Tic-Tac-Toe cells render at ≥ 64 px (asserted in e2e); the 4×4 and 6×6 Dots &amp; Boxes boards keep
  their dot lattice inside the viewport at 390 px, with the 6×6 board scrolling horizontally inside its own
  container at 320 px rather than overflowing the page (mobile full-page captures are exactly 320 px wide).
  Reversi shows four legal-move markers on the opening board; Last Token shows labeled Take buttons per pile.
- **Section integration.** The arcade page shows the unchanged solo section above the new "Two players, one
  device." section; the homepage shows the Arcade grid above Pass &amp; Play; My Arcade shows the solo dashboard
  above "Shared on this device" with the exact empty-state and record rows.
- **Motion and zoom.** `reduced-motion-reversi` and `zoom-200-four-in-a-row-handoff` were captured under
  `prefers-reduced-motion: reduce` and a 200%-equivalent viewport; the e2e suite additionally asserts that no
  falling-disc animation exists for reduced-motion players and that every game page reflows without horizontal
  overflow at 320 px.
- **No dark patterns.** No capture contains a timer, penalty, streak, leaderboard, or forced-progression
  surface; the automated dark-pattern scan on My Arcade covers the new section.

Findings requiring correction: none at capture time. Captures supplement, and do not replace, manual device and
assistive-technology review (see `docs/MANUAL_ACCESSIBILITY_CHECKLIST.md`).
