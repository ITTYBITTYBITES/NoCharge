---
title: How NoCharge generates and verifies its puzzles
description: Sudoku uniqueness checks, Lights Out invertibility, Beacon Lattice solver-backed packs, and the honest boundaries of each method.
kind: platform
category: trust
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 5
topics:
  - puzzle generation
  - testing
  - honesty
featured: true
---

**Bottom line:** NoCharge's generated puzzles are verifiable by construction, not by marketing. Sudoku 9×9 checks exactly one solution before publishing. Lights Out is built by pressing from a solved board, so its inverse always solves it. Beacon Lattice packs come with a solver-backed review. Each method is documented with its boundary.

## Sudoku 9×9 — uniqueness first

1. Build a complete grid from shuffled bands, stacks, and digits.
2. Remove cells in random order.
3. After each removal run a solver with a two-solution limit.
4. Keep the removal only when exactly one solution remains.
5. Stop at the given count (42 easy, 34 medium, 28 hard).

Hardness is labeled by givens, never by grade. The solver is deterministic for a 9×9 grid, so "one solution" is checked, not assumed. Tests generate dozens of puzzles and assert the count and uniqueness.

## Lights Out — solved by inverse

A board is produced by pressing ~12 random cells on an all-off grid. The same presses in reverse solve it, so solvability is a property of the generator. The guide states this instead of hiding it, and the engine tests regenerate boards and assert they are non-trivial.

## Beacon Lattice — solver-backed packs

Curated packs are checked by the coverage solver for no unintended gaps and by the editor for pacing. Curated packs are reviewed against the coverage rules and recorded in the repo review notes; the guide explains forced-move deduction without overclaiming strategy.

## Beacons of honesty

- **Nonogram packs** are hand-curated? No — see the games' notes. NoCharge does not claim a pack source it does not have.
- **Word lists** (Hangman) are editorial selections of common, calm words. They are not a vocabulary curriculum.
- **Simon sequences** are random; no pattern is hidden in the display.

## Limits

- Uniqueness tells you a puzzle is solvable, not that it is enjoyable or appropriately hard.
- Generator randomness is not cryptographic; seeds are for deterministic tests and daily consistency.
- No generation method is a claim about cognitive benefit.

## Next step

Read the [Sudoku generator article](/articles/sudoku-nine-x-nine-uniqueness-and-labels/) and the [Lights Out article](/articles/lights-out-solvable-by-construction/), then play one of each.
