---
title: "Twenty Forty-Eight"
tagline: Slide tiles. Merge doubles.
description: Play 2048 in your browser on a classic 4×4 grid. Slide and merge tiles to reach 2048 and beyond. No timer, no leaderboard.
emoji: 🧮
accent: "#12b66a"
runtime: twenty-forty-eight
artwork:
  icon: /game-art/twenty-forty-eight/icon.svg
  coverSquare: /game-art/twenty-forty-eight/cover-square.webp
  coverSquareFallback: /game-art/twenty-forty-eight/cover-square.jpg
  coverLandscape: /game-art/twenty-forty-eight/cover-landscape.webp
  coverLandscapeFallback: /game-art/twenty-forty-eight/cover-landscape.jpg
  socialCard: /game-art/twenty-forty-eight/social-card.jpg
  socialCardFallback: /game-art/twenty-forty-eight/social-card.jpg
  socialCardWebp: /game-art/twenty-forty-eight/social-card.webp
  guideHeader: /game-art/twenty-forty-eight/guide-header.webp
  guideHeaderFallback: /game-art/twenty-forty-eight/guide-header.jpg
  alt: Number tiles sliding and merging on a 4×4 grid
presentation:
  controlsHeading: Swipe, arrows, or WASD.
  controls:
    - label: Touch
      description: Swipe in any direction to slide all tiles.
    - label: Keyboard
      description: Arrow keys or WASD to slide. U to undo.
    - label: Goal
      description: Merge equal tiles to reach 2048. Keep going for higher tiles.
  stageAspectDesktop: 1.0
  stageAspectMobile: 1.0
  relatedHeading: Continue exploring—or try another game.
  relatedGuideLabel: "2048 merge strategy"
genre: Number puzzle
difficulty: Easy to learn
session: 3–10 min
featured: false
order: 14
---

Twenty Forty-Eight slides number tiles across a 4×4 board. Equal values combine, but the direction of a move determines which pairs meet first.

## Objective and win/loss conditions

Build a 2048 tile to reach the target; larger tiles remain possible if you continue. The board is over when it is full and no horizontal or vertical neighboring pair can merge. A move that changes nothing does not spawn a new tile.

## How it plays

Slide with arrow keys, WASD, or a swipe. All tiles travel as far as they can in that direction. Equal neighbors merge once per move. After a successful slide, a new tile appears in an empty cell: 2 with 90% probability or 4 with 10%.

For example, before the new tile spawns, sliding the row 2, 2, 2, 2 left produces 4, 4, empty, empty. It does not produce 8 in one move because newly merged tiles cannot merge again until the next slide. A row of 2, 2, 4, empty similarly becomes 4, 4, empty, empty.

## Scoring and strategy

Each merge adds the value of its resulting tile to the current score. The four-twos example earns 4 + 4 = 8 points. The persistent best, however, is the largest tile reached, not the run's point total.

Keeping a large tile near one corner can make a descending chain easier to maintain. Before changing direction, check whether the slide separates a useful pair or traps a smaller tile behind a larger one. Random spawns mean this is a planning habit, not a guarantee of reaching 2048. Undo can restore a previous board.

## Local save data

`nocharge:2048:best-tile` remembers the highest tile reached in this browser's localStorage. It does not store the current score, full grid, or undo sequence. Reloading begins a new board with the saved best tile still available as a personal reference.
