---
title: Mini Sudoku 6×6
tagline: A small grid, a quiet puzzle.
description: Solve a 6×6 Sudoku with 3×2 boxes, pencil marks, and no timer or pressure.
emoji: ▦
accent: "#a78bfa"
tier: signature
runtime: mini-sudoku
artwork:
  icon: /game-art/mini-sudoku/icon.svg
  coverSquare: /game-art/mini-sudoku/cover-square.webp
  coverSquareFallback: /game-art/mini-sudoku/cover-square.jpg
  coverLandscape: /game-art/mini-sudoku/cover-landscape.webp
  coverLandscapeFallback: /game-art/mini-sudoku/cover-landscape.jpg
  guideHeader: /game-art/mini-sudoku/guide-header.webp
  guideHeaderFallback: /game-art/mini-sudoku/guide-header.jpg
  socialCard: /game-art/mini-sudoku/social-card.jpg
  socialCardFallback: /game-art/mini-sudoku/social-card.jpg
  socialCardWebp: /game-art/mini-sudoku/social-card.webp
  alt: 6×6 grid with given digits and pencil notes in the Quiet Arcade palette
genre: Logic
difficulty: Cell-count levels
session: 5–20 min
featured: true
order: 17
presentation:
  controlsHeading: Fill each row, column, and 3×2 box with digits 1–6.
  controls:
    - label: Fill
      description: Select a cell and type a digit from 1 to 6, or use the on-screen digit pad.
    - label: Pencil marks
      description: Toggle Marks, then enter digits in an empty cell to keep small candidate notes while you work.
    - label: Clear or undo
      description: ✕ or Backspace clears the selected cell; U undoes the last entry.
    - label: Check or reveal
      description: Check highlights wrong cells; Reveal fills only the selected cell.
---

Mini Sudoku uses digits 1–6 on a 6×6 board with boxes three columns wide and two rows high. It keeps the row, column, and box constraints of Sudoku in a smaller space.

## Objective and win/loss conditions

Fill every editable cell so each row, column, and box contains 1 through 6 exactly once. Given clues cannot be changed. There is no timer or loss after a fixed number of mistakes; you can clear entries, undo, check the board, or reveal the selected cell.

## How it plays

Select a cell with a tap or the keyboard cursor, then use the digit pad or keys 1–6. Marks mode adds or removes candidate notes instead of placing a final digit. Clear removes an entry or notes, while Reveal supplies the selected cell's solution digit.

If a row already contains 1, 2, 3, 4, and 6, its remaining cell must be 5. For a less direct step, collect the digits missing from the row and remove any already used in its column or 3×2 box. A note records a possibility; it does not prove that digit belongs there.

## Scoring and strategy

Mini Sudoku has no points score. Easy, Medium, and Hard describe removing 12, 16, and 20 cells respectively, rather than a measured rating of solving skill. The local result is a completed-puzzle count.

Inspect the most nearly completed row or box first. After placing a digit, revisit notes in the crossing row, column, and box. Check compares current entries with the generated solution, so use it deliberately if you want to work without answer feedback.

## Local save data

`nocharge:sudoku:current-puzzle` stores difficulty, seed, and entered board digits for restoration when the saved data passes validation. `nocharge:sudoku:puzzles-solved` counts completions. The Marks on/off preference uses `nocharge:pref:sudoku-pencil-marks`, shared with Sudoku 9×9. Individual pencil notes and the undo history are not saved with the board. No data is synchronized to another device.
