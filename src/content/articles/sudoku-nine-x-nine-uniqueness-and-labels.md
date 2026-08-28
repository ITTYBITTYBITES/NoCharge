---
title: Sudoku 9×9 on NoCharge — uniqueness first, labels second
description: Why the 9×9 generator verifies exactly one solution, and why difficulty is reported as a given count instead of a grade or "brain level".
kind: game
game: sudoku-9x9
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 3
topics:
  - sudoku
  - puzzle generation
  - honesty
featured: false
---

A Sudoku puzzle is a promise: there is one place to put each digit. NoCharge's 9×9 generator checks that promise before it shows a board.

## The pipeline

1. Build a complete valid 9×9 grid from shuffled bands, stacks, and digits.
2. Remove cells one at a time, always from a random order.
3. After each removal, run a solver with a limit of two solutions.
4. Keep the removal only when the puzzle still has exactly one solution; otherwise restore the cell.
5. Stop when the given-cell target (42, 34, or 28) is reached.

The solver is deterministic and exhaustive for the board size; "one solution" is checked, not assumed.

## Why labels are counts

"Easy" and "Hard" are widely used but rarely defined. NoCharge defines difficulty as givens and states the number on the difficulty selector. The generator does not claim that 28 givens is "hard for your brain level" — that would be a claim about a person, not about a puzzle.

## What the player gets

- A current board that resumes after reload (`nocharge:sudoku9:current-puzzle`).
- A Check tool that compares filled cells to the solution, and a Reveal tool that fills exactly one selected cell — labeled as separate actions because they are different kinds of help.
- Pencil marks shared with Mini Sudoku 6×6, so one preference covers both grids.

## Limits

Uniqueness is about solvability, not about human difficulty. A 28-given puzzle can be easier to a practiced player than a 42-given puzzle full of hard chains, and NoCharge does not rank those cases. The one-solution test is the only promise the generator makes.
