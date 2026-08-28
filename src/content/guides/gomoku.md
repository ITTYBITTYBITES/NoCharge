---
title: Gomoku guide
description: Free-style rules, why five-or-more wins, the two-player handoff, keyboard path, and the local match record.
game: gomoku
readTime: 5
updated: '2026-08-27'
order: 23
featured: false
---

## Rules

Two players alternate placing stones on a 15×15 grid. Black moves first. A player wins by placing five or more stones in an unbroken line — horizontal, vertical, or diagonal. If the board fills without a winner, the game is a draw.

**Variants stated plainly:** NoCharge uses free-style Gomoku. There is no overline restriction (six or seven in a row would still win), no captures, and no Renju-style opening or forbidden-move rules. If you expect tournament Renju, this is not that game; the guide says so rather than hiding the difference.

## Two players, one device

Gomoku has no hidden information — every stone is visible to both players. Between turns the shared handoff screen names the next player over a translucent board, then the game continues. No player names or turn timings are stored; only the match result is saved.

## Controls

| Action | Pointer / touch | Keyboard | Notes |
|---|---|---|---|
| Place stone | Tap an empty intersection | Arrow keys move cursor, Enter / Space place | Roving tabindex, row/column labels |
| Pass device | Handoff screen | Continue button | No hidden info; board stays visible |
| New game | Play again | Toolbar shortcut | New board, same opening player |

## Strategy

1. **Build open lines, not closed ones.** `__XX_` threatens in two directions; `_XXX_` even more. A closed `XXX` with one end blocked is much weaker.
2. **Read one move ahead.** If you can win with `X`, you must block your opponent's `X` too. The classic beginner error is attacking when the opponent reaches four first.
3. **Play near the center.** Central stones participate in more lines (horizontal, vertical, both diagonals) than edge stones.
4. **Force double threats.** Any move that creates two simultaneous three-in-a-rows is usually winning; the guide calls this a pattern, not a guaranteed tactic.

## What NoCharge records

One most-recent match record per game under `nocharge:passplay:match:gomoku`: mode, result, score, and date. No history, no move list, no names.

## Accessibility and limits

The 15×15 grid announces each cell as row and column plus stone color; the result card restates the winner. Arrow-key navigation supports keyboard play. NoCharge makes no strategy claim beyond the examples above, and no claim about which version of Gomoku is "correct" — the variant is the contract.

## Next step

Play one game beside a friend. For hidden-information play, the [Pass & Play collection](/collections/pass-and-play/) shows what NoCharge ships today and what stays out of scope.
