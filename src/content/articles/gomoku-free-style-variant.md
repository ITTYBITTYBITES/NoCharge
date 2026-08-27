---
title: Gomoku on NoCharge — why the variant is the contract
description: "Free-style vs Renju, overlines, captures, and opening rules: what NoCharge implements, what it does not, and why the guide says so."
kind: game
game: gomoku
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 3
topics:
  - gomoku
  - pass and play
  - rules
featured: false
---

"Gomoku" covers several related games. NoCharge picks one — free-style five-or-more-in-a-row — and documents the choice instead of silently picking a flavor.

## What NoCharge implements

- 15×15 grid.
- Black and White alternate; Black moves first.
- Five **or more** stones in a row wins (horizontal, vertical, diagonal).
- Draw when the board fills.

## What NoCharge does not implement

- **Renju rules:** overlines do not lose; there are no forbidden moves for Black; opening restrictions do not exist.
- **Captures or cannibalism:** stones never get removed.
- **Tournament timed play:** there is no clock; a game ends only when someone wins or the board fills.
- **AI or online opponents:** strictly two humans, one device.

## Why variant honesty matters

Two players who learned different variants can disagree mid-game about a six-in-a-row or an open three. NoCharge's guide states the variant in the first paragraph, and the game HUD repeats it on first open. If the implementation ever changes, the guide and the HUD text change together — the registry review would catch a mismatch before release.

## The handoff difference

Free-style Gomoku has no hidden information, so the handoff screen keeps the board visible while naming the next player. That is a deliberate contrast with hidden-information classics like Battleship, which hide the board. Both use the same shared component; the difference is what each game says is secret.

## Limits

The strategy tips in the guide (open lines, central stones, double threats) are patterns, not proofs. NoCharge does not claim they guarantee a win, and makes no claim that Gomoku trains foresight or planning.
