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

Minesweeper is played on a grid where some cells contain mines. The first reveal is always safe; afterward, numbers show how many mines touch that cell. Reveal every non-mine cell to clear the board without a countdown. Time is recorded only as a metric after a win, never shown as pressure.

## Quick answer

This game opens directly in the browser without an account. Wins and best completion time stay in this browser's localStorage.

## How it plays

The board, controls, and session length are documented on the game page and in its definitive guide. No special hardware is required beyond what the guide lists. The game supports the inputs documented for that title.

## Controls at a glance

Check the game page for pointer, touch, and keyboard alternatives. Most actions have a keyboard path and a pointer path. Fullscreen or focus mode depends on browser permission and can be exited with Escape.

## Local storage and session

Best results, win counts, or puzzle progress are kept in this browser only. A different browser, profile, private window, or device will not share them. Clearing site data removes them. My Arcade reads these local values to show a private dashboard.

## Accessibility and options

Sound on/off and mute are separate preferences. Volume and ambient are local choices. Focus outlines remain visible and no board uses transform scale to force fit. Reduced motion affects animation, not sound.

## What NoCharge did not evaluate

This description is based on current game code and tests. We did not measure long-term durability, evaluate every screen reader combination, or promise compatibility with every device. The game is general-audience and not directed to children.

## Next step

Open the game, play one run with the controls documented, and check the guide for the full rule set if needed. Use Privacy page to clear local data when you want.
