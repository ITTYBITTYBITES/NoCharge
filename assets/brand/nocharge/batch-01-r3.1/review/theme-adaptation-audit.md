# NoCharge Batch 01 R3.1 · theme-adaptation audit

**Observed:** 2026-11-16 · audit of the actual `/home/user/nocharge-v2` React/Vite/TypeScript site and the existing R3 proposals.\
**Status:** review rationale only. The ten R3 originals are unchanged; R3.1 is awaiting explicit asset-level review and is not integrated.

## Finding: R3's shapes are sufficient; its fixed colors are not

The ten R3 subjects still cover the real Daily, Memory, Word, Tile puzzles, Logic puzzles, Card games, Board games, Pass & Play, Guides, and Tools labels. The V2 site already has inline `DestinationGlyph` marks for its broad destinations (including App Experiences, Discover, and Shop); the header's System/Light/Dark control uses small inline functional SVGs. The audit found **no additional section icon that merits a new asset** for Batch 01.

R3 was drawn with fixed live-dark colors `#9a9a9a` and `#12b66a`. On the actual V2 light page background `#f7f6ef`, their contrast is only **2.60:1** and **2.45:1** respectively—below the 3:1 WCAG non-text contrast threshold for meaningful graphic marks. On the live dark canvas `#121212`, the same colors are **6.66:1** and **7.07:1**. The design direction is sound, but the fixed palette does not adapt to the existing V2 light appearance.

## R3.1 change, deliberately limited

R3.1 is a **versioned color-semantics revision** of the same ten R3 drawings. It retains the viewBox, dimensions, silhouettes, subject meanings, transparent canvas, rounded line language, and intended size. Only the SVG color semantics, unique accessibility IDs, and explanatory descriptions are revised:

- Neutral strokes use `currentColor`, inherited from the surrounding V2 text/icon color.
- Accent strokes/fills use `var(--nocharge-icon-accent, #0f7d47)`. The local light theme can provide accessible deep green `#0f7d47`; dark mode can provide the live NoCharge green `#12b66a`.
- Existing small negative-space/slider centers use `var(--nocharge-icon-surface, #fffefa)` so the surface knockout can match the local panel/page instead of being baked to charcoal.
- There is no canvas rectangle, new mark, alternate concept, tile, glow, or image backdrop.

At those audited pairings, `#0f7d47` on `#f7f6ef` is **4.79:1** and `#12b66a` on `#121212` is **7.07:1**. Preview sheets render inline SVG with matching theme variables. For later integration, these assets must be embedded inline or through a sprite/component; an external `<img src="...svg">` cannot inherit the page's CSS custom properties. No website integration has been performed.

## Ten purposes and preserved boundaries

1. Daily puzzle — marker beside the existing date-seeded Daily heading; not puzzle artwork.
2. Memory games — shared genre marker; not the Memory Match cover.
3. Word games — shared genre marker with blank tiles; no letters or replacement covers.
4. Tile puzzles — category marker; no game-specific tile scene.
5. Logic puzzles — category marker with no numbers; existing game art retained.
6. Card games — blank card fan; not a Klondike or FreeCell layout.
7. Board games — general board marker; not a specific game's board.
8. Pass & Play — existing one-device collection/mode; no people or default controller motif.
9. Guides — aggregate section marker; per-game guide glyphs remain untouched.
10. Tools — aggregate section marker; no fake utility UI.

The live NoCharge logo/wordmark, favicon/PWA family, social-sharing art, all game covers, site-specific artwork, and the R1/R2/R3 history are outside this revision and remain unchanged. R1 and R2 remain rejected. R3 originals remain awaiting review and are not overwritten. R3.1 is **awaiting explicit asset-level review; none approved; none integrated**.

## Review files

- `design-proposal.md` — purpose, reasons, and usage notes for all ten.
- `contact-sheet-source.html` — self-contained inline SVG review source with light/dark comparison.
- `contact-sheet.png` — rendered overview.
- `individual-previews.html` — separate card per asset with both theme treatments and file details.
- `previews/` — ten individual PNG comparison previews (review-only files).
- `../source/` — ten editable SVGs.
- `../optimized/` — ten minified, lossless SVG derivatives.
- `README.md` — batch inventory, dimensions, formats, theme behavior, rationale, and truthful approval/integration state.

No theme-direction or route/feature change is represented as individual asset approval. Stop here for review; do not integrate these icons or start a later production batch without explicit approval.
