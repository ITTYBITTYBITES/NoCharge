# Batch 01 · R3.1 approved adaptive icons

**Version:** R3.1 theme-adaptive color revision of the ten R3 supplemental icons.\
**Assets:** 10 editable 24×24 SVG sources and 10 optimized derivatives.\
**Theme behavior:** transparent canvas; neutral strokes inherit `currentColor`; accents use `--nocharge-icon-accent`; negative-space centers use `--nocharge-icon-surface`.\
**Approval:** The user explicitly approved each R3.1 asset on 2026-11-16 for its manifest-listed target only. Approval does not authorize another use.\
**Integration:** NC09-R3.1 is rendered at the existing Guides hub heading and NC10-R3.1 at the existing Tools hub heading. The other eight approved game-related icons remain unrendered and untouched because their exact target slots are absent in V2.

## Preserved history and scope

R3 source artwork is unchanged in `../batch-01-r3/`. R1 and R2 remain rejected, preserved as history, and prohibited from reuse. R3.1 does not replace the NoCharge logo, favicon/PWA family, social image, game covers, or existing per-guide glyphs. Source and optimized artwork are retained unchanged; the typed V2 resolver imports the ten optimized files, while the site renders only the two approved icons whose matching V2 hub headings exist.

## Ten manifest-listed targets

| ID | Title | Manifest target | Current V2 rendering |
|---|---|---|---|
| NC01-R3.1 | Daily puzzle | Daily Puzzle section | Approved; not rendered (no matching V2 slot) |
| NC02-R3.1 | Memory games | Memory genre | Approved; not rendered; game-related target remains unmapped |
| NC03-R3.1 | Word games | Word-game genre | Approved; not rendered (no matching V2 slot) |
| NC04-R3.1 | Tile puzzles | Tile-puzzle genre | Approved; not rendered (no matching V2 slot) |
| NC05-R3.1 | Logic puzzles | Logic genre | Approved; not rendered (no matching V2 slot) |
| NC06-R3.1 | Card games | Cards genre | Approved; not rendered (no matching V2 slot) |
| NC07-R3.1 | Board games | Board-game genre | Approved; not rendered (no matching V2 slot) |
| NC08-R3.1 | Pass & Play | One-device mode | Approved; not rendered (no matching V2 slot) |
| NC09-R3.1 | Guides section | `/guides/` hub heading | Approved and integrated through `AdaptiveIcon` |
| NC10-R3.1 | Tools section | `/tools/` hub heading | Approved and integrated through `AdaptiveIcon` |

The eight non-hub icons keep their original semantic IDs, manifest rows, source/optimized SVG files, and target scope. Batch 02 is a separate set of ten tool-entry icons; it does not repurpose any Batch 01 target.

## Review materials

- `design-proposal.md` — purpose, adaptive color contract, and original design rationale.
- `theme-adaptation-audit.md` — contrast rationale for Light and Dark themes.
- `contact-sheet-source.html`, `contact-sheet.png` — overview of all ten proposals.
- `individual-previews.html` and `previews/` — separate theme comparisons; these are review images, not additional production artwork.

## Integration convention

`src/assets/iconIds.ts` is the semantic allowlist and `src/assets/assetRegistry.ts` maps IDs to locally imported optimized SVGs. `AdaptiveIcon` renders approved vectors inline so theme tokens inherit correctly. Keep a readable text label beside each decorative icon; do not add a new route or game target simply to consume an approved asset.
