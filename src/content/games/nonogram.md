---
title: Nonogram
tagline: Follow the clues. Reveal the picture.
description: Solve nonogram puzzles in 5×5 and 10×10 grids. Mark cells filled or empty using row and column clues. No timer, no fail state.
emoji: 🧩
accent: "#12b66a"
runtime: nonogram
artwork:
  icon: /game-art/nonogram/icon.svg
  coverSquare: /game-art/nonogram/cover-square.webp
  coverSquareFallback: /game-art/nonogram/cover-square.jpg
  coverLandscape: /game-art/nonogram/cover-landscape.webp
  coverLandscapeFallback: /game-art/nonogram/cover-landscape.jpg
  socialCard: /game-art/nonogram/social-card.jpg
  socialCardFallback: /game-art/nonogram/social-card.jpg
  socialCardWebp: /game-art/nonogram/social-card.webp
  guideHeader: /game-art/nonogram/guide-header.webp
  guideHeaderFallback: /game-art/nonogram/guide-header.jpg
  alt: A nonogram grid with clues and partially revealed pixel art
presentation:
  controlsHeading: Click cells or use keyboard.
  controls:
    - label: Touch or pointer
      description: Tap a cell to cycle through filled, empty, and unknown. Right-tap marks empty.
    - label: Keyboard
      description: Arrows move cursor. F marks filled, X or Space marks empty, U undoes.
    - label: Accessibility
      description: Toggle "Show clues as text" for a full text list of every row and column clue.
  stageAspectDesktop: 1.0
  stageAspectMobile: 1.0
  relatedHeading: Continue exploring—or try another game.
  relatedGuideLabel: Nonogram rules and strategy
genre: Logic puzzle
difficulty: Easy to learn
session: 2–10 min
featured: false
order: 13
---

Nonogram turns row and column clues into a hidden picture. NoCharge's library offers 5×5 and 10×10 boards; filled cells must satisfy both the horizontal and vertical clues.

## Objective and win/loss conditions

Reveal the picture by filling its intended cells without filling background cells. The completion check accepts background cells that are empty or still unknown; you do not have to mark every background square explicitly. There is no timer, lives counter, or penalty that locks you out for trying a mark.

## How it plays

Each clue number describes a consecutive filled run. Multiple numbers appear in order with at least one empty cell between runs. On a five-cell line, clue 3 can be XXX.., .XXX., or ..XXX, where X is filled and a dot is empty. The middle cell is filled in all three arrangements, so it is a safe deduction.

A pointer tap cycles unknown → filled → empty → unknown. Keyboard controls let you move the cursor and mark filled or empty directly. Undo restores an earlier marking state. The text-clue view lists the row and column clues without requiring you to read numbers around the visual board.

## Scoring and strategy

There is no points score or speed bonus. The persistent metric counts puzzle completions. Start with full-length runs and lines whose minimum span nearly fills the available space. A clue of 2,2 already needs five cells: two filled, one gap, and two filled.

After solving part of a row, inspect the crossing columns rather than guessing the rest of the picture from its apparent shape. Empty marks are useful working notes even though the final completion check does not require every one.

## Local save data

`nocharge:nonogram:puzzles-revealed` stores the completion count locally. It is not a list of distinct solved puzzle IDs, and it does not save the current marking grid. Reloading or choosing another puzzle starts a fresh board while retaining that count until browser data is cleared.
