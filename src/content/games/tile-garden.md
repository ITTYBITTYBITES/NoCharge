---
title: Tile Garden
tagline: Plant seeds. Grow flowers. No rush.
description: A calm merge game where you place seed tiles on a grid and grow them through four tiers. Three modes, no lives, no timer, no dark patterns.
emoji: 🌱
accent: "#12b66a"
runtime: tile-garden
artwork:
  icon: /game-art/tile-garden/icon.svg
  coverSquare: /game-art/tile-garden/cover-square.webp
  coverSquareFallback: /game-art/tile-garden/cover-square.jpg
  coverLandscape: /game-art/tile-garden/cover-landscape.webp
  coverLandscapeFallback: /game-art/tile-garden/cover-landscape.jpg
  socialCard: /game-art/tile-garden/social-card.jpg
  socialCardFallback: /game-art/tile-garden/social-card.jpg
  socialCardWebp: /game-art/tile-garden/social-card.webp
  guideHeader: /game-art/tile-garden/guide-header.webp
  guideHeaderFallback: /game-art/tile-garden/guide-header.jpg
  alt: Plant tiles merging on a garden grid with seeds growing into flowers
presentation:
  controlsHeading: Click cells or use keyboard.
  controls:
    - label: Touch or pointer
      description: Tap an empty cell to place the next seed tile.
    - label: Keyboard
      description: Arrows move cursor. Enter or Space places a tile. U undoes.
    - label: Modes
      description: Garden (standard), Meadow (endless), Sketch (creative, no merges).
  stageAspectDesktop: 1.0
  stageAspectMobile: 1.0
  relatedHeading: Continue exploring—or try another game.
  relatedGuideLabel: Tile Garden rules and modes
genre: Merge puzzle
difficulty: Gentle
session: 3–15 min
featured: false
order: 15
---

Tile Garden grows plants by combining matching 2×2 blocks on an 8×8 board. Each new seed has one of six species, and a successful merge frees three cells for later placements.

## Objective and win/loss conditions

In Garden mode, make a Flower on one of the four center cells to finish. Meadow uses the same merge rules without that finish condition. Sketch disables automatic merges and lets you remove placed tiles. There is no timer or life counter; a full board can leave no placement available, so use Undo or begin another garden.

## How it plays

Place the displayed next seed in an empty cell. Four tiles merge only when they share both a species and a tier and fill a 2×2 square. The result occupies that square's top-left cell; the other three cells clear. The tiers are Seed → Sprout → Bloom → Flower, and Flowers do not merge further.

For example, three matching Seeds at row 1 column 1, row 1 column 2, and row 2 column 1 need a fourth matching Seed at row 2 column 2. That placement creates one Sprout at row 1 column 1. Four Sprouts of the same species can later make a Bloom; four Blooms can make a Flower.

## Scoring and strategy

Best tier records how far a plant has grown rather than a points score. The placement counter tracks actions during the current garden. A Garden win is about a Flower's position, not just creating one anywhere on the board.

Plan where a merge's top-left result will land before completing the square. Group related species while leaving open cells for the next seed; a line of four matching plants does not qualify as a 2×2 block. In Sketch, arrange freely without expecting the normal chain reactions.

## Local save data

`nocharge:tile-garden:best-tier` stores the highest tier reached. The current grid, mode, next seed, and Undo history are not restored from localStorage. A new visit begins another layout while retaining the best-tier record until you clear browser game data.
