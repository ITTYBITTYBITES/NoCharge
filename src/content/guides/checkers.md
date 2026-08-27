---
title: "Checkers guide"
description: "English draughts rules, the mandatory-capture rule, kings, the simple capture variant, and the local match record."
game: checkers
readTime: 5
updated: '2026-08-27'
order: 26
featured: false
---

## Rules

- **Board:** 8×8, pieces on dark squares, 12 per side. Dark (Player 1) moves first.
- **Men:** step one diagonal forward to an empty square.
- **Kings:** move one diagonal in any direction. Captured on promotion? No — kings appear when a man reaches the opponent's back row. A king moves like a man but in all four diagonals; NoCharge has no flying kings (a king does not slide multiple squares).
- **Capture:** jumping an adjacent enemy over an empty landing is *mandatory* when any jump exists. A capture chain of multiple jumps continues with the same piece and the same turn until no more jumps exist.
- **Win:** you capture all the opponent's pieces or leave them with no legal move.

## Variant, stated exactly

NoCharge plays English draughts with the **simple capture rule**: when multiple jumps exist, the player may take any legal one; the game does not enforce "must take the longest sequence". Some tournament and informal variants enforce the longest chain — NoCharge does not claim to implement those.

## Controls

| Action | Pointer / touch | Keyboard | Notes |
|---|---|---|---|
| Select your piece | Tap your piece | Enter | Legal destinations highlight green |
| Move / jump | Tap a green square | Arrow to it, Enter | Captures mandatory |
| Multi-jump | Keep tapping green squares | Enter with the same piece | Turn stays until chain ends |
| New game | Play again | Toolbar shortcut | Fresh 12-vs-12 board |

## Quiet tactics

1. **Count jumps before you move.** A forced capture can move your piece into a worse square; "must capture" is a rule, not a suggestion.
2. **Keep pieces in pairs.** A lone piece is easier to fork than a pair that supports each other.
3. **Trade when ahead in count.** Simpler endgames reward the player with more material.
4. **Push for promotion first.** A king changes the game; the guide calls this a heuristic, not a guarantee.

## What NoCharge records

One most-recent match record per game under `nocharge:passplay:match:checkers`: mode, result, score, date. No move history, no names.

## Accessibility and limits

Board cells announce row, column, piece type, and color; mandatory captures are announced in the status line before any move. Arrow navigation uses the row-major grid, which the guide notes is an approximation of the diagonal movement lines. NoCharge makes no claim about strategy skill or brain training; the variant section is the contract.

## Next step

Play one game with a friend. For an open-board five-in-a-row contrast, see [Gomoku](/games/gomoku/).
