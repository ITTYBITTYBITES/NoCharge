---
title: Memory Match
tagline: Flip cards. Find pairs.
description: Play a fast 4×4 memory matching game in your browser. Match eight symbol pairs, count every move, and keep your best result on your device.
emoji: 🃏
accent: "#12b66a"
runtime: memory-match
artwork:
  icon: /game-art/memory-match/icon.svg
  coverSquare: /game-art/memory-match/cover-square.webp
  coverSquareFallback: /game-art/memory-match/cover-square.jpg
  coverLandscape: /game-art/memory-match/cover-landscape.webp
  coverLandscapeFallback: /game-art/memory-match/cover-landscape.jpg
  guideHeader: /game-art/memory-match/guide-header.webp
  guideHeaderFallback: /game-art/memory-match/guide-header.jpg
  socialCard: /game-art/memory-match/social-card.jpg
  socialCardFallback: /game-art/memory-match/social-card.jpg
  socialCardWebp: /game-art/memory-match/social-card.webp
  screenshotMobile: /game-art/memory-match/screenshot-mobile.webp
  screenshotDesktop: /game-art/memory-match/screenshot-desktop.webp
  controlsDiagram: /game-art/memory-match/controls-diagram.svg
  alt: Two overlapping dark cards marked with matching emerald diamonds
presentation:
  controlsHeading: Choose two cards. Remember both positions.
  controls:
    - label: Touch or pointer
      description: Select any hidden card, then select a second.
    - label: Keyboard
      description: Tab between available cards; reveal with Enter or Space.
    - label: Restart
      description: Use New game at any time to reshuffle and reset the move count.
  stageAspectDesktop: 0.952
  stageAspectMobile: 0.857
  controlsDiagramAlt: Choose one hidden card, compare it with a second card, then keep a match or remember both mismatch positions.
  controlsDiagramCaption: Each two-card attempt is one move. Matches remain visible; mismatches turn back over.
  gameplayPreviewAlt: Memory Match shown on desktop with a four-by-four card grid and several geometric symbols revealed.
  gameplayPreviewCaption: The board keeps the move count, personal best, and restart control visible above the four-by-four grid.
  relatedHeading: Guide the next move—or try another game.
  relatedGuideLabel: Memory Match rules and recall strategy
genre: Memory
difficulty: Easy to learn
session: 2–5 min
featured: true
order: 1
---

Memory Match is a 4×4 concentration board with eight pairs of symbols. The challenge is remembering where a card appeared, not racing a countdown.

## Objective and win/loss conditions

Reveal all eight matching pairs to complete the board. There is no move limit or timed loss: a mismatch leaves both cards available for another attempt. New game abandons the current layout and shuffles a fresh board.

## How it plays

Choose one hidden card, then a different hidden card. Identical symbols stay face up and leave the active card controls. Different symbols remain visible briefly before turning over again; wait for that reveal to finish before choosing another pair.

For example, suppose you see a blue diamond at the top-left and a yellow circle at the bottom-right. That attempt is one move, even though it does not match. If a later reveal shows another blue diamond, pair it with the remembered top-left card rather than exploring two unknown positions.

## Scoring and strategy

Each two-card attempt adds one move. Lower completed move counts are better; eight moves is the mathematical minimum, because there are eight pairs. A 12-move finish improves a previous best of 15, while a 17-move finish does not replace it.

Use row-and-column locations to remember cards, scan new positions in a consistent order, and clear known pairs before taking another guess. The brief mismatch animation is not a speed bonus or penalty.

## Local save data

The displayed best is stored at `nocharge:memory-match:best-moves` in browser localStorage. The shared arcade score also stores `max(0, 1000 − 10 × moves)` under `nocharge:memory-match:high`; it is a compatibility score, not the move count shown on the board. The shuffled cards and an unfinished round are not saved. Browser site-data controls or Clear game data remove these records.
