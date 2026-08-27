---
title: "Large targets, low visual complexity"
description: "Games with generous tap targets and uncluttered boards: wide cells, few simultaneous rules, and no dense text-in-cell."
inclusionMethod: "Include a current game when its primary board targets are at least 44 CSS px on a 375 px viewport, the board has at most 7 columns of play area (or fewer than 16 distinct cells), and no cell requires reading a small digit or letter inside a dense grid to act."
reviewed: "2026-08-27"
order: 9
draft: false
games:
  - game: memory-match
    reason: "A 4×4 board puts each card at roughly 80 px on a 375 px screen — about nine times the 24 px minimum, with one symbol per card and no text."
  - game: tic-tac-toe
    reason: "Three columns of large squares at roughly 110 px each, one marker per cell, and no reading at all — the clearest board in the catalog."
  - game: four-in-a-row
    reason: "Seven wide columns at about 48 px each with chunky discs; the only decision is which column, so no per-cell detail competes for attention."
  - game: last-token
    reason: "Three piles, each a full-width button on a phone; the whole game is one row of three choices with a big count label."
  - game: color-flip
    reason: "Six large color tiles in the control area and a single falling target per move; turn-based mode keeps the same large tiles without the moving element."
  - game: reversi
    reason: "An 8×8 board at about 42 px per square with discs whose color and position are both large; legal-move highlighting uses border, not color alone."
  - game: dots-and-boxes
    reason: "Edges and boxes are about 45 px on a 375 px screen; the visual field is a clean grid with no in-cell content until a box is claimed."
  - game: pass-the-picture
    reason: "A full-width canvas and four large color buttons; nothing is read to act, and the canvas itself is the target."
---

The criterion is structural, not aesthetic: wide cells, small boards, no dense grids.

## Why this collection exists

Some sessions favor boards you can act on without reading or refocusing. These are the NoCharge games with the most generous geometry and the least per-cell detail — useful for low-vision reading preferences, shared-screen play, or simply a clear first try.

## How we decide inclusion

1. Primary targets are at least 44 × 44 CSS px on a 375 px viewport (measured from the game's stage sizing; WCAG 2.5.8 minimum is 24 px — these exceed it by design).
2. The board has at most 7 columns of play area or fewer than 16 distinct cells, so a glance captures the state.
3. No action requires decoding small text inside a cell (large letter grids, dense solitaire piles, and 9×9-style number boards are excluded).

Word Search and Mini Sudoku are therefore excluded even though they are touch-friendly: their 8×8 letter grid and 6×6 digit grid ask you to read inside the cell. They remain in the One-thumb mobile collection.

## What you will find in the grid

Each card states its measured target size and the specific board geometry. Game pages remain the place to verify exact controls; the collection is a starting point, not a measurement certificate.

## Limits

- Large targets are not the same as accessibility conformance; NoCharge's full accessibility position is in the [Accessibility Statement](/accessibility/).
- Sizes are computed from design stage math, not measured on every device; browser zoom and viewport changes alter actual pixel sizes.
- Simplicity is structural, not a claim about cognitive load for every person.

## Related reading

- One-thumb mobile
- Accessibility test matrix
- How NoCharge tests browser games

## Related collections

- Keyboard-friendly browser games
- Games for a short break
