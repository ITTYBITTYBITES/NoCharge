---
title: "Klondike Solitaire Guide: Rules, Draw Modes, and Calm Play"
description: Learn how NoCharge Klondike Solitaire handles draw modes, tableau building, foundation rules, keyboard controls, and local metrics.
game: klondike
readTime: 5
updated: "2026-08-22"
featured: true
order: 11
---

NoCharge Klondike Solitaire follows the standard rules most players already know: seven tableau columns, four foundations, a stock pile, and a waste pile. The difference is what is not here. There is no timer, no score, no daily challenge, no streak, and no leaderboard.

## How to play

Deal seven columns of increasing length (1 to 7 cards). Only the top card of each column starts face-up. Draw from the stock pile to the waste. Move cards between tableau columns in alternating colors descending. Build foundations by suit ascending from ace to king.

The game is won when all four foundations are complete (13 cards each).

## Controls at a glance

- **Touch or pointer:** tap the stock to draw, tap a card to select it, tap a destination to move.
- **Keyboard:** D draws from stock, U undoes.
- **Draw mode toggle:** switch between draw-1 and draw-3 at any time.
- **Undo:** reverses the last move, including draws and card placements.

## How draw mode works

**Draw-1** reveals one card at a time from the stock. Each draw counts as one move. This is the easier default.

**Draw-3** reveals three cards at a time. Only the top card of the waste is playable, but you can cycle through the waste by drawing again. Draw-3 is more challenging because many cards remain buried until you work through the visible ones.

Your draw mode preference is saved locally under `nocharge:pref:klondike-draw-mode` and persists between sessions.

## How scoring works

There is no score. Klondike tracks two local metrics:

- **Games won:** stored at `nocharge:klondike:games-won`.
- **Best moves:** the lowest move count for a completed game, stored at `nocharge:klondike:best-moves`.

Both values are stored in your browser's local storage and can be cleared from the My Arcade page.

## Strategy and patterns

### Build tableau efficiently

When you have a choice between two cards of the same rank for a tableau column, prefer the one that reveals a face-down card underneath. Revealing hidden cards gives you more options.

### Use the waste strategically

In draw-3 mode, remember that cards cycle through the waste in the same order each pass. If you see a useful card but cannot play it yet, note its position for the next cycle.

### Foundations are one-way

Once a card is on a foundation, it cannot be moved back. The game auto-moves only cards that are safe (aces and low cards where opposite-color foundations are far enough ahead). Avoid manually sending cards to foundations too early if they might be needed on the tableau.

### Empty columns accept kings

An empty tableau column can only receive a king. If you clear a column, plan what king (or king-led sequence) you want to place there before clearing it.

## Accessibility

- All cards have aria-labels describing their rank, suit, and face state.
- Stock and waste are operable by keyboard.
- Undo and draw-toggle are standard buttons reachable by Tab.
- No animation is essential to gameplay; all state is visible in the card faces.

## What we don't claim

We do not claim that any specific deal is solvable. We do not show a winnability percentage. Solitaire deals vary widely in difficulty, and determining solvability requires exhaustive search that we do not perform. We track your wins and best move counts as personal records, not as performance evaluations.
