---
title: The handoff screen — how it works
description: "How NoCharge's shared handoff screen works for Pass & Play games: hidden-information privacy, who-can-see rules, and what it never stores."
published: '2026-08-27'
updated: '2026-08-27'
topic: interface
readTime: 3
order: 6
faqs:
  - q: 'What does the handoff screen show?'
    a: 'For hidden-information games it shows only whose turn it is and the next player''s name; the board is hidden. For open-board games it shows a short "pass to Player 2" message, then the visible board.'
  - q: 'Does the handoff screen time players?'
    a: 'No. There is no countdown. The next player taps Continue when they are ready.'
  - q: 'Are player names saved anywhere?'
    a: 'No. Names stay in page memory and reset on reload. The only persisted value is the bounded match record under nocharge:passplay:match:*.'
---

**Bottom line:** The handoff screen is NoCharge's shared component for two players on one device. It hides the board before a turn change so a player with hidden information (ships, letters, planned strokes) cannot see the next player's move, shows whose turn is next, and continues only when the next player taps the button.

## When it appears

- **Hidden-information games** (for example Battleship when it ships): the screen replaces the board; the next player taps Continue to reveal only their side.
- **Open-board games** (Gomoku, Checkers, Nine Men's Morris): the screen briefly identifies the next player before the shared board returns.

Every Pass & Play game page embeds the same component, so the behavior is consistent instead of per-game.

## What it never does

- It does not show the previous player's private information after the pass.
- It does not save names, timing, or pass counts. Nothing about the handoff itself is persisted.
- It does not include a timer, a "hurry up" message, or a score for passing speed.
- It does not handle network turn-taking; this is strictly local.

## Limits

The screen protects the boundary between turns, not the room. It cannot prevent a player across the table from glancing at a shared open board, and it is not a network privacy feature. For true remote play, NoCharge intentionally offers nothing — that is out of scope by design.

## Related reading

- [What Pass & Play means at NoCharge](/learn/what-is-pass-and-play/)
- [Two-player games on one device](/articles/two-player-games-one-device/)
- [Pass & Play collection](/collections/pass-and-play/)
