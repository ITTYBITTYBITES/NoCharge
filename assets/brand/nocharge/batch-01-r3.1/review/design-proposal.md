# NoCharge · Batch 01 · R3.1 theme-adaptive icon proposals

**Scope:** exactly ten versioned supplemental category/section SVG proposals.\
**Status:** awaiting explicit asset-level review · none approved · none integrated.\
**Relationship to R3:** same approved-for-development visual direction and same ten purposes; R3's original SVGs and review files remain untouched. R3.1 revises color semantics only.

## Why R3.1 exists

The local V2 site has a light `#f7f6ef` appearance and is now being made theme-aware. R3's fixed `#9a9a9a` and `#12b66a` lines work on NoCharge's live dark background (`#121212`), but reach only 2.60:1 and 2.45:1 on the actual V2 light background. Theme adaptation is therefore a genuine accessibility requirement, not an extra art direction.

R3.1 retains each R3 icon's 24 × 24 geometry and subject. Neutral detail now follows `currentColor`; green detail uses `--nocharge-icon-accent`; the small knockout fills in NC07/NC10 use `--nocharge-icon-surface`. The canvas remains transparent. No theme-specific duplicate artwork is proposed.

## Asset register and rationale

| ID | Proposal | Intended use | Why this is a genuine, distinct gap |
|---|---|---|---|
| NC01-R3.1 | Daily puzzle | Date-seeded Daily page heading / daily-puzzle collection marker | Daily has no reusable section marker. The calendar/date mark is not puzzle art or a cover replacement. |
| NC02-R3.1 | Memory games | Beside the shared Memory genre label | Paired cards and diamonds echo the real category while the Memory Match cover stays game-specific. |
| NC03-R3.1 | Word games | Beside shared Word genre labels | Blank connected tiles denote the category without embedded letters or copied cover art. |
| NC04-R3.1 | Tile puzzles | Beside the existing tile-puzzle genre label | A small grid/move cue represents the category, not a replacement Color Flip or game scene. |
| NC05-R3.1 | Logic puzzles | Beside Logic labels across grid games | A sparse grid with one active cell spans Sudoku/Nonogram/Beacon Lattice without numbers. |
| NC06-R3.1 | Card games | Beside the Cards genre label | A blank fan is a compact group marker, not a Klondike/FreeCell board. |
| NC07-R3.1 | Board games | Beside the Board-games genre label | General intersections and stones distinguish the group without favoring one game. |
| NC08-R3.1 | Pass & Play | Beside the real one-device collection/mode | Two tokens and handoff describe the interaction without people or a default controller motif. |
| NC09-R3.1 | Guides section | Aggregate Guides heading only | The section lacks a reusable mark; existing per-game glyphs are not replaced. |
| NC10-R3.1 | Tools section | Aggregate Tools heading only | The section lacks a reusable mark; the artwork does not depict or invent a specific tool UI. |

Broad V2 destination glyphs already exist for Arcade, App Experiences, Tools, Guides, Discover, and Shop. The light/dark setting itself uses inline functional interface glyphs. The route audit found no eleventh art asset justified for Batch 01.

## Theme behavior and contrast

| Theme | Surrounding line color | Accent token | Surface token | Contrast on audited canvas |
|---|---|---|---|---|
| Light | `currentColor` → `#20252b` | `#0f7d47` | local `--paper` / `--paper-strong` | Accent 4.79:1 on `#f7f6ef`; line 14.24:1 |
| Dark | `currentColor` → `#e0e0e0` | `#12b66a` | local `--paper` / `--paper-strong` | Accent 7.07:1 on `#121212`; line 14.19:1 |

`currentColor` and the two CSS custom properties require inline SVG or an SVG sprite/component so they inherit from the themed document. The SVGs contain no background rectangle. Where a knockout surface is used, set `--nocharge-icon-surface` to the actual containing surface (`--paper` or `--paper-strong`); the source fallback is for a standalone light preview, not a substitute for theme setup.

Example usage after approval (illustrative only; **not implemented**):

```css
.category-icon {
  color: var(--ink);
  --nocharge-icon-accent: #0f7d47;
  --nocharge-icon-surface: var(--paper-strong);
}
[data-theme="dark"] .category-icon {
  --nocharge-icon-accent: #12b66a;
}
```

## Deliverable contents and status

- `source/` — ten editable 24 × 24 SVGs.
- `optimized/` — one minified derivative per source; derivatives are not extra assets.
- `review/contact-sheet.png` — one overview comparing light and dark renderings.
- `review/individual-previews.html` and `review/previews/` — each proposal shown separately in both themes; preview PNGs are review materials, not additional production artwork.
- `review/theme-adaptation-audit.md`, this proposal, and `review/README.md` — rationale, usage limits, dimensions, and status.
- The shared `assets/manifest.csv` records every R3.1 source and its derivative path. Every record says pending review and not integrated.

The only change from R3's original silhouettes is semantic SVG color inheritance and metadata. Existing brand art and all rejected or pending history are preserved. No R3.1 file is approved or integrated by this proposal.
