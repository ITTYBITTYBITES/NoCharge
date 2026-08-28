---
title: "Logic & Number"
description: "Quiet logic and number puzzles: exact coverage, clues, digit rules, and tidy merges — none timed."
inclusionMethod: "Include a current game when its core loop is a deduction or mathematics puzzle (placement, clue solving, digit rules, or numeric merge) with no reaction-time requirement and no timer, or with a documented untimed mode."
reviewed: "2026-08-27"
order: 6
draft: false
games:
  - game: beacon-lattice
    reason: "Every cell must be covered exactly once by chosen beacons — exact-cover logic, untimed, with progress kept locally in nocharge:pref:beacon-lattice-progress."
  - game: nonogram
    reason: "Row and column runs force cells into filled or empty states by deduction; the puzzle is untimed and difficulty is described by size and clue density."
  - game: mini-sudoku
    reason: "Digits 1–6 appear once per row, column, and 3×2 box; pencil marks support deduction and there is no timer. Difficulty is honestly described by given-cell count."
  - game: twenty-forty-eight
    reason: "Sliding and merging powers of two uses planning, not reflexes; the board is untimed and the best tile reached stays local under nocharge:2048:best-tile."
  - game: minesweeper
    reason: "Deduction from numbers and flag counting on 9×9, 16×16, or 16×30 boards with no reaction-time requirement."
  - game: lights-out
    reason: "Pressing toggles an orthogonal cross of five cells, so every board is a small deduction over the grid."
  - game: sudoku-9x9
    reason: "A 9×9 digit placement puzzle with verified uniqueness; givens counts (42/34/28) are the honest difficulty labels."
---

This collection groups NoCharge's quiet logic and number puzzles. These are not “brain training”; they are deduction and arrangement games with clear rules, no countdown, and documented keyboard paths.

## Why this collection exists

The Arcade mixes reflex games, words, cards, and logic. This collection answers a specific need: “I want to think, not react.” Each member's complete play loop is deduction or number work, and every member is untimed by default.

## How we decide inclusion

A game qualifies when all of the following hold:

1. The core loop is a deduction or mathematics puzzle: placement, clues, digit rules, or numeric merges.
2. It does not require reaction speed; no member is timed by default.
3. Its rules and difficulty labels explain their meaning (for example, Mini Sudoku difficulty = given-cell count, not a validated IQ claim).

Color Flip is excluded despite its puzzle feel because its visual mode is reaction-based (its turn-based mode lives in the untimed collection instead). Word games, card games, and Pass & Play titles have their own collections.

## What you will find in the grid

Each card shows the genre, session length, and a reason tied to its rules. For example, Beacon Lattice stores progress locally while Twenty Forty-Eight only keeps the best tile reached. Neither count claims cognitive benefit; difficulty is game-specific and explained in each guide.

## Limits

- Difficulty varies by puzzle; no member claims objective “grade levels”.
- Session lengths are estimates for typical play, not timers.
- Local storage is per browser and per device; there is no sync.

## Related reading

- How exact coverage works in Beacon Lattice
- Nonogram: clues and accessibility
- Mini Sudoku on NoCharge: a quiet 6×6
- Registry facts

## Related collections

- Untimed or reduced pressure
- Originals only
- Browser games without accounts
