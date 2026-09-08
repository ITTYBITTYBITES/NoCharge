---
title: Minesweeper
tagline: Clear the field, one safe cell at a time.
description: "Classic minesweeper on 9×9, 16×16, or 16×30 boards with flags, chording, and a guaranteed-safe first click. Untimed: elapsed time is recorded only after a clear."
emoji: ▦
accent: "#38bdf8"
tier: signature
runtime: minesweeper
artwork:
  icon: /game-art/minesweeper/icon.svg
  coverSquare: /game-art/minesweeper/cover-square.webp
  coverSquareFallback: /game-art/minesweeper/cover-square.jpg
  coverLandscape: /game-art/minesweeper/cover-landscape.webp
  coverLandscapeFallback: /game-art/minesweeper/cover-landscape.jpg
  guideHeader: /game-art/minesweeper/guide-header.webp
  guideHeaderFallback: /game-art/minesweeper/guide-header.jpg
  socialCard: /game-art/minesweeper/social-card.jpg
  socialCardFallback: /game-art/minesweeper/social-card.jpg
  socialCardWebp: /game-art/minesweeper/social-card.webp
  alt: A calm minesweeper grid with revealed numbers, hidden cells, and one flagged mine
genre: Logic
difficulty: Preset boards
session: 3–12 min
featured: true
order: 18
presentation:
  controlsHeading: Reveal every safe cell. Flag the mines. There is no countdown.
  controls:
    - label: Reveal
      description: Click or tap a hidden cell; Enter or Space reveals the focused cell. The first click is always safe.
    - label: Flag
      description: Toggle Flag mode, or press F on the focused cell, to mark a suspected mine.
    - label: Chord
      description: Double-click, or press Enter on a revealed number with the right number of flags, to reveal its neighbours.
    - label: Move
      description: Arrow keys move the board cursor; the focused cell is announced by row and column.
    - label: Difficulty
      description: Beginner 9×9 with 10 mines, Intermediate 16×16 with 40, Expert 16×30 with 99.
---

Minesweeper asks you to distinguish safe squares from mines using the numbers on the border of the revealed area. NoCharge removes the countdown, but a later incorrect reveal can still end the board.

## Objective and win/loss conditions

Reveal every non-mine cell to win. Revealing a mine loses; flagging all mines without uncovering the remaining safe cells is not enough. The first reveal is protected from mines. The presets are Beginner 9×9 with 10 mines, Intermediate 16×16 with 40, and Expert 16×30 with 99.

## How it plays

A revealed number counts adjacent mines, including diagonals. A zero expands the connected safe area. Toggle Flag mode or use F on the focused cell to mark a suspected mine; flagged squares are protected from ordinary reveals.

For example, a 1 with exactly one still-covered neighbor identifies that neighbor as a mine. Once its one mine is correctly flagged, the other covered neighbors are safe. A chord opens unflagged neighbors when the surrounding flag count equals the number. **The chord checks the count, not whether your flags are correct:** a wrong flag can leave a real mine unflagged and cause a loss.

## Scoring and strategy

The persistent metrics are completed clears and the fastest winning time. Elapsed play time is recorded after a win, not shown as a countdown or used to force a move. A failed board does not add a win.

Work from numbered boundaries, compare neighboring clues, and flag deductions rather than guesses. When a deduction is unavailable, the first-click guarantee does not protect later guesses. Chording is a shortcut for applying known information, not a hint that verifies flags.

## Local save data

`nocharge:minesweeper:games-won` and `nocharge:minesweeper:best-time` hold your records. `nocharge:pref:minesweeper-last-size` remembers the selected preset. Mines, revealed cells, flags, and an unfinished timer are not restored after closing the page. Records stay in this browser and are removable with Clear game data.
