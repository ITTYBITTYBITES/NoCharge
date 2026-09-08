---
title: Klondike Solitaire
tagline: Classic solitaire. Draw one or three.
description: Play standard Klondike solitaire in your browser with draw-1 or draw-3, undo, and restart. No timer, no score, no dark patterns.
emoji: 🃏
accent: "#12b66a"
runtime: klondike
artwork:
  icon: /game-art/klondike/icon.svg
  coverSquare: /game-art/klondike/cover-square.webp
  coverSquareFallback: /game-art/klondike/cover-square.jpg
  coverLandscape: /game-art/klondike/cover-landscape.webp
  coverLandscapeFallback: /game-art/klondike/cover-landscape.jpg
  socialCard: /game-art/klondike/social-card.jpg
  socialCardFallback: /game-art/klondike/social-card.jpg
  socialCardWebp: /game-art/klondike/social-card.webp
  guideHeader: /game-art/klondike/guide-header.webp
  guideHeaderFallback: /game-art/klondike/guide-header.jpg
  alt: Klondike solitaire card layout on a dark green background
presentation:
  controlsHeading: Click, tap, or keyboard.
  controls:
    - label: Touch or pointer
      description: Tap stock to draw. Tap a card to select, tap destination to move.
    - label: Keyboard
      description: D draws from stock. U undoes. Click columns and foundations to place.
    - label: Draw mode
      description: Toggle between draw-1 and draw-3 at any time.
  stageAspectDesktop: 1.4
  stageAspectMobile: 0.75
  relatedHeading: Continue exploring—or try another game.
  relatedGuideLabel: Klondike rules and strategy
genre: Cards
difficulty: Familiar rules
session: 5–15 min
featured: false
order: 11
---

Klondike Solitaire starts with seven tableau columns, a stock, a waste pile, and four suit foundations. Hidden cards make opening a column a different decision from simply moving a visible card.

## Objective and win/loss conditions

Complete all four foundations from ace through king, one suit per pile, to win. There is no timer, points target, or automatic claim that a deal is solvable. If no useful move remains, undo a decision, recycle the stock, or start a new deal.

## How it plays

Build tableau sequences downward in rank and alternate red and black. A black 7 can move onto a red 8, but not another 7 or a black 8. Empty tableau columns accept a king or a king-led sequence. Exposing the last face-down card in a column turns it over.

Draw-one exposes one stock card; draw-three exposes up to three, with only the top waste card playable. When the stock is empty, another draw recycles the waste. Changing the draw setting starts a new deal in the selected mode. Foundations build upward in the same suit: the 2 of hearts follows the ace of hearts, not the ace of diamonds.

## Scoring and strategy

The game tracks moves and wins rather than a points score. Draws and successful card transfers count as moves; the lowest move total from a completed deal becomes the best.

Prefer a transfer that exposes a face-down card when two otherwise similar moves are available. Before clearing a column, locate a king that can use the space. Foundation transfers are not ordinary reversible tableau moves, so consider whether a card is still useful for building; Undo can reverse recent actions.

## Local save data

Completed-deal count is saved as `nocharge:klondike:games-won`, the lowest winning move count as `nocharge:klondike:best-moves`, and draw preference as `nocharge:pref:klondike-draw-mode`. The current stock order and unfinished tableau are not restored after a reload. These localStorage records are not an account or cloud save.
