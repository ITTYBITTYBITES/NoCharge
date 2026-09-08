---
title: Sudoku 9×9
tagline: The full grid, at your own pace.
description: Classic 9×9 Sudoku with 3×3 boxes, pencil marks, check, and reveal-one-cell. Easy/Medium/Hard are labeled by given count (42/34/28) and every puzzle has one verified solution. Untimed.
emoji: ㊿
accent: "#60a5fa"
tier: signature
runtime: sudoku-9x9
artwork:
  icon: /game-art/sudoku-9x9/icon.svg
  coverSquare: /game-art/sudoku-9x9/cover-square.webp
  coverSquareFallback: /game-art/sudoku-9x9/cover-square.jpg
  coverLandscape: /game-art/sudoku-9x9/cover-landscape.webp
  coverLandscapeFallback: /game-art/sudoku-9x9/cover-landscape.jpg
  guideHeader: /game-art/sudoku-9x9/guide-header.webp
  guideHeaderFallback: /game-art/sudoku-9x9/guide-header.jpg
  socialCard: /game-art/sudoku-9x9/social-card.jpg
  socialCardFallback: /game-art/sudoku-9x9/social-card.jpg
  socialCardWebp: /game-art/sudoku-9x9/social-card.webp
  alt: A 9×9 sudoku grid with given digits and box borders in the Quiet Arcade palette
genre: Logic
difficulty: Given counts
session: 8–25 min
featured: true
order: 22
presentation:
  controlsHeading: Fill every row, column, and 3×3 box with digits 1–9.
  controls:
    - label: Fill
      description: Select a cell and type 1–9, or use the on-screen digit pad.
    - label: Pencil marks
      description: Toggle Marks, then enter digits in an empty cell to keep candidate notes.
    - label: Clear or undo
      description: ✕ or Backspace clears the selected cell; U undoes the last entry.
    - label: Check or reveal
      description: Check highlights wrong cells; Reveal fills only the selected cell.
    - label: Difficulty
      description: Easy 42 givens, Medium 34, Hard 28 — labels describe the given count, and every puzzle has exactly one solution.
---

Sudoku 9×9 expands the puzzle to nine rows, nine columns, and nine 3×3 boxes. Every placement has to satisfy all three units, so a digit that fits a row can still be ruled out by its box.

## Objective and win/loss conditions

Complete the grid with digits 1–9, each occurring once in every row, column, and box. Original clues are fixed. Incorrect attempts do not use lives and there is no countdown; Clear, Undo, Check, and a selected-cell Reveal are separate controls.

## How it plays

Choose an editable square and enter a digit with the keyboard or number pad. Turn on Marks to keep candidate notes in an empty cell. Those notes are your working list rather than an automatic solution.

Suppose a cell's row is missing 2, 7, and 9. If its column already contains 7 and its box already contains 9, only 2 remains. Conversely, if a digit is a candidate in only one empty square of a box, that box forces its location even when the square has other candidates. Check tests entered digits against the solution; Reveal fills only the selected cell.

## Scoring and strategy

There is no speed score. The current presets request 42, 34, or 28 givens for Easy, Medium, or Hard, with the generator preserving a unique solution. Clue count is not a promise that one puzzle needs a particular solving technique or amount of time.

Start with constrained units and cross-reference their candidates. When a placement changes a row or box, update your notes there before adding more. Keeping notes consistent is more useful than filling every empty square with all nine digits.

## Local save data

`nocharge:sudoku9:current-puzzle` holds the difficulty, seed, and board digits. Valid saved boards can resume on reload; individual notes and Undo history are not restored. `nocharge:sudoku9:puzzles-solved` counts completed grids, while `nocharge:pref:sudoku-pencil-marks` remembers the Marks toggle shared with Mini Sudoku. Clearing local game data removes these browser-only records.
