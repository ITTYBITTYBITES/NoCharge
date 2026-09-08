---
title: FreeCell Solitaire
tagline: All cards visible. Plan your moves.
description: Play FreeCell solitaire in your browser with all 52 cards face-up, 4 free cells, undo, and restart. No timer, no score.
emoji: 🃏
accent: "#12b66a"
runtime: freecell
artwork:
  icon: /game-art/freecell/icon.svg
  coverSquare: /game-art/freecell/cover-square.webp
  coverSquareFallback: /game-art/freecell/cover-square.jpg
  coverLandscape: /game-art/freecell/cover-landscape.webp
  coverLandscapeFallback: /game-art/freecell/cover-landscape.jpg
  socialCard: /game-art/freecell/social-card.jpg
  socialCardFallback: /game-art/freecell/social-card.jpg
  socialCardWebp: /game-art/freecell/social-card.webp
  guideHeader: /game-art/freecell/guide-header.webp
  guideHeaderFallback: /game-art/freecell/guide-header.jpg
  alt: FreeCell solitaire layout showing all cards face up
presentation:
  controlsHeading: Click, tap, or keyboard.
  controls:
    - label: Touch or pointer
      description: Tap a card to select, tap destination to move. Double-tap to auto-send to foundation.
    - label: Free cells
      description: Use the four cells at top-left for temporary storage.
    - label: Keyboard
      description: U undoes. Click columns, cells, and foundations to place cards.
  stageAspectDesktop: 1.5
  stageAspectMobile: 0.7
  relatedHeading: Continue exploring—or try another game.
  relatedGuideLabel: FreeCell rules and planning tips
genre: Cards
difficulty: Strategic
session: 5–20 min
featured: false
order: 12
---

FreeCell deals all 52 cards face up across eight columns. Four single-card free cells provide temporary workspace, so the available empty space determines which sequences you can move.

## Objective and win/loss conditions

Move every card to four foundations, building each suit from ace to king. There is no countdown or points requirement. A blocked position does not trigger a timed loss; use Undo or start another deal. The deal generator does not certify that every arrangement is winnable.

## How it plays

Tableau columns descend in alternating colors. A red 6 can rest on a black 7. A free cell can hold one exposed card, while an empty tableau column can receive any card or a legal sequence, not only a king. Foundation cards follow their own suit in ascending order.

Moving a whole sequence requires enough workspace. Capacity is **(empty free cells + 1) × 2^(spare empty columns)**, excluding an empty destination column from the spare-column count. With two empty free cells and one other empty column, up to six cards can move together. If that empty column is the destination instead, the same position supports only three.

## Scoring and strategy

The board displays a move count, but the persistent game metric is completed deals, not a points score or a best-time table. Inspect the location of aces and low cards before filling the free cells. Parking one blocker may expose a useful foundation card; parking all four can leave no workspace for the next sequence.

Use the capacity calculation before committing a move. An empty column is especially valuable because it can double the size of a transferable sequence when it is available as spare workspace.

## Local save data

`nocharge:freecell:games-won` stores completed-deal count in this browser's localStorage. The tableau, contents of the free cells, move counter, and undo stack remain in page memory and are lost on reload. Clearing the site's game data removes the win record without affecting another browser's results.
