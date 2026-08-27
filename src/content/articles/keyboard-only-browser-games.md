---
title: Keyboard-only browser games at NoCharge
description: Which games have a complete keyboard path, how NoCharge verifies it, what Pass the Picture's exception is, and how to test one yourself.
kind: platform
category: accessibility
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 4
topics:
  - keyboard
  - accessibility
  - input
featured: true
---

**Bottom line:** 23 of 24 NoCharge games have a documented, code-verified complete keyboard path — start, every move, restart, and completion all work with Tab, arrows, and Enter/Space. Pass the Picture is the honest exception: drawing strokes need pointer or touch, so its core loop is not keyboard-complete even though its color and undo controls are.

## What "keyboard-complete" means — verified

The catalog flag `hasKeyboardComplete` is true only when the game's core loop is operable by keyboard alone, checked against game code (native focusable elements, roving tabindex, and explicit key handlers), not inferred from guide prose. The registry-facts page publishes the current count (see [Registry facts](/articles/registry-facts/)).

## Keyboard games in short

- **Grids:** Minesweeper (arrows + Enter, F to flag, chord on Enter), Nonogram (F fill, X empty), Lights Out (arrows + Enter), Beacon Lattice (arrows, 1–4 types, U undo).
- **Words:** Hangman (type any letter), Word Tile Rush (focused tiles + Submit), Word Search (cursor + Enter), Word Tile Rush.
- **Logic:** Mini Sudoku 6×6 and Sudoku 9×9 (arrows, 1–9, U/C/R), Twenty Forty-Eight (arrows/WASD).
- **Cards:** Klondike and FreeCell (Tab-navigable stock, waste, tableau, foundations; D/U shortcuts).
- **Pass & Play:** Tic-Tac-Toe, Dots & Boxes, Four in a Row, Reversi, Last Token, Gomoku, Nine Men's Morris — all with arrow navigation plus the handoff Continue button.

## Focus rules

NoCharge boards use roving tabindex: one cell is in the tab order, arrows move it, and the focused cell is announced by row and column. Focus outlines are visible and `:focus-visible` is not suppressed. The shared shell's Game Mode keeps the same order while collapsing labels to icons.

## Limits

- Keyboard-complete does not mean tested with every assistive technology, keyboard layout, or OS. The [accessibility position](/accessibility/) states the test matrix.
- Pass the Picture's core loop requires a pointer or touch; the guide says so rather than claiming a keyboard path that does not exist.

## Next step

Open [Minesweeper](/games/minesweeper/) and play a beginner board with arrows and Enter only. The [keyboard-friendly collection](/collections/keyboard-friendly-browser-games/) lists every qualifying game.
