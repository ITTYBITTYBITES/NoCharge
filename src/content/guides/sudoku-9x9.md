---
title: Sudoku 9×9 guide
description: Rules, honest difficulty labeling, pencil-mark workflow, keyboard path, solver uniqueness, and local storage.
game: sudoku-9x9
readTime: 6
updated: '2026-08-27'
order: 22
featured: true
---

## Rules

Place digits 1–9 so that every row, every column, and every 3×3 box contains each digit exactly once. A digit is valid in a cell when it does not already appear in that row, column, or box.

- **Easy:** 42 given cells.
- **Medium:** 34 given cells.
- **Hard:** 28 given cells.

## What difficulty labels mean — and do not

The labels describe the number of givens, nothing more. NoCharge does not grade puzzles, does not claim a "brain age", and does not assert that 28-given puzzles are always harder than 34-given ones. The generator also verifies that each published puzzle has exactly one solution before showing it, because "difficulty" without uniqueness is not a real puzzle.

## Pencil marks

Turn on **Marks**, select an empty cell, and type digits to add or remove candidate notes. Notes are per-cell and saved with the current board. Marks are a helper, not a claim about the best solving method.

## Controls

| Action | Pointer / touch | Keyboard | Notes |
|---|---|---|---|
| Select cell | Tap | Arrow keys | Roving tabindex, live labels |
| Fill digit | Digit pad / tap | 1–9 | Conflict is announced, not silently accepted |
| Pencil marks | Marks button | — | Shared preference with Mini Sudoku 6×6 |
| Clear | ✕ | Backspace | Clears digit or notes |
| Undo | Undo | U | Last entry only |
| Check | Check | C | Compares filled cells to the solution |
| Reveal | Reveal | R | Fills only the selected cell |
| New puzzle | Difficulty select | Tab + Enter | Also saved as the current puzzle |

## A quiet method that scales to 9×9

1. **Start with the box with the most givens.** A nearly-full box forces the fewest candidates.
2. **Write pencil marks only when a cell has two or three candidates.** Marking every empty cell turns the grid into noise.
3. **Cross out as you go.** After placing a digit, remove it from the row, column, and box notes — this is the highest-value habit.
4. **Use Check sparingly.** It is a verification tool, not a hint; the guide treats Reveal as the explicit hint.
5. **Take a break freely.** The current board is saved automatically under `nocharge:sudoku9:current-puzzle`, so closing the tab loses nothing.

## What NoCharge records

- `nocharge:sudoku9:current-puzzle` — difficulty, seed, and board so a reload resumes.
- `nocharge:sudoku9:puzzles-solved` — completed puzzles on this device.
- `nocharge:pref:sudoku-pencil-marks` — shared with Mini Sudoku 6×6.

## Accessibility and limits

Arrow-key navigation, announced row/column labels, live status, and separate controls for check and reveal support keyboard and screen-reader play; conflict messages are text, not color-only. The 9×9 board needs more precision than the 6×6, so the one-thumb collection lists the smaller grid instead. NoCharge makes no claim about memory, concentration, or cognitive benefit.

## Next step

Open an Easy puzzle, mark the two-candidate cells, and cross out as you place digits. Compare with the 6×6 version using the [6×6 vs 9×9 article](/articles/mini-sudoku-vs-9x9/).
