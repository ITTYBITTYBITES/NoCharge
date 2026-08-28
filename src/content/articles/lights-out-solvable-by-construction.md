---
title: Lights Out — solvable by construction, and why that matters
description: NoCharge generates every Lights Out puzzle by pressing from a solved board, so solvability is a property of the generator, not a promise. What that means for play and for honesty.
kind: game
game: lights-out
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 3
topics:
  - lights-out
  - puzzle generation
  - honesty
featured: false
---

A puzzle site can promise "every puzzle is solvable" without proving it. Lights Out makes that promise trivially provable, so NoCharge uses the proof.

## The generation rule

A new board is produced by:

1. Start with all lights off.
2. Pick around twelve cells at random.
3. Press each one.

Because pressing a cell twice cancels itself, the inverse of the generation presses turns the board off. The player does not need to know the original presses; the existence of that inverse is the proof.

## What NoCharge does not claim

- Not "every puzzle is easy": solvability says nothing about move count or difficulty.
- Not "puzzles have a unique solution": many boards do not; NoCharge never claims one.
- Not "this trains thinking": the systems article simply explains generation.

## Why the HUD counts moves

Moves are a personal metric — fewest presses to clear a board — recorded only in this browser. They are not a score, not a ranking, and not a difficulty label. The guide's top-to-bottom method is one approach, stated as a heuristic.

## Where the proof lives

The guide's "Solvability, stated honestly" section gives the same argument in one paragraph, and the engine tests generate dozens of puzzles and assert they are non-trivial. If the generator ever changed, the guide and the tests would both need to change — that is the review loop the registry documents.
