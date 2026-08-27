---
title: Nine Men's Morris guide
description: The 24-point mill rules, mill-stone protection, flying phase, blocked-player loss, keyboard path, and the local match record.
game: nine-mens-morris
readTime: 6
updated: '2026-08-27'
order: 24
featured: false
---

## Rules

**Setup.** The board has three concentric squares with corner and midpoint points — 24 points total in the classic layout. Each player has nine stones; Black (Player 1) starts.

**Placement phase.** Players alternate placing one stone on any empty point. Placing the third stone of a straight line (a mill) triggers a removal: you take one opponent stone off the board.

**Movement phase.** After all 18 stones are placed, players alternately move one of their stones to an adjacent empty point along the drawn lines. Forming a new mill still removes a stone.

**Flying phase.** When a player has exactly three stones, they may move one to *any* empty point — lines no longer constrain.

**Loss conditions.** A player loses when they are reduced to fewer than three stones, or when they have stones but no legal move.

## Mill-stone protection, stated exactly

When you form a mill, the opponent stones you may remove are:

1. Any opponent stone that is **not** part of a completed mill; if any such stone exists, mill stones are protected.
2. Only if every opponent stone is inside a mill may you remove one of those mill stones.

This is the standard "never break a mill unless forced" rule. The engine enforces it, and the game shows a message when a protected stone is tapped.

## Controls

| Action | Pointer / touch | Keyboard | Notes |
|---|---|---|---|
| Place | Tap empty point | Enter on focused point | Placement only |
| Select your stone | Tap your stone | Enter | Movement/flying |
| Move | Tap legal green point | Enter on highlighted point | Legal destinations are announced |
| Remove on mill | Tap removeable stone | Enter | Protected stones rejected with a message |
| New game | Play again | Toolbar shortcut | Starts a fresh placement phase |

## A quiet strategy

1. **Chase double mills in placement.** Two open lines sharing a point (e.g. 0 and 1 set, 1 and 2 set) mean your opponent cannot block both.
2. **Break mills before they form.** Blocking at a line's midpoint is often stronger than removing a stone.
3. **Count stones.** The game is won by attrition plus mobility; a player who can fly has a strong late game.
4. **Don't put all nine stones onto the board hurriedly.** Leaving a stone in hand keeps the placement phase open — useful when the board is congested.

## What NoCharge records

One most-recent match record under `nocharge:passplay:match:nine-mens-morris`: mode, result, score, date. No move history, no names.

## Accessibility and limits

Every point is a labeled button (ring and marker), legal destinations are outlined in green plus announced text, and the status line says whose turn and which phase. Arrow keys move between points using the drawn layout, which the guide admits is an approximation of the diagonal connectors. NoCharge makes no claim about strategic depth or cognitive benefit; the variant (mill protection, flying at 3, blocked-player loss) is the contract and is documented here.

## Next step

Play one full game, then try [Gomoku](/games/gomoku/) for an open five-in-a-row contrast. Both are Pass & Play on one device.
