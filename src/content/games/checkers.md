---
title: "Checkers"
tagline: "English draughts for two, one device."
description: "8×8 English draughts for two players on one screen: men move forward, kings move both ways, jumps are mandatory, and multi-jumps keep the turn. Variant stated in the guide."
emoji: "☗"
accent: "#fbbf24"
tier: signature
runtime: checkers
artwork:
  icon: /game-art/checkers/icon.svg
  coverSquare: /game-art/checkers/cover-square.webp
  coverSquareFallback: /game-art/checkers/cover-square.jpg
  coverLandscape: /game-art/checkers/cover-landscape.webp
  coverLandscapeFallback: /game-art/checkers/cover-landscape.jpg
  guideHeader: /game-art/checkers/guide-header.webp
  guideHeaderFallback: /game-art/checkers/guide-header.jpg
  socialCard: /game-art/checkers/social-card.jpg
  socialCardFallback: /game-art/checkers/social-card.jpg
  socialCardWebp: /game-art/checkers/social-card.webp
  alt: An 8×8 checkers board with dark and light pieces on a dark field
genre: Board game
difficulty: Tactical
session: 8–25 min
featured: false
order: 26
presentation:
  controlsHeading: "Move one piece per turn. Jump when you can. Kings move both ways."
  controls:
    - label: Move
      description: Tap your piece, then tap a highlighted destination; arrow keys move the cursor and Enter selects or moves.
    - label: Capture
      description: When a jump is available it is mandatory. A multi-jump continues with the same piece and same turn.
    - label: Handoff
      description: The shared handoff names the next player between turns; the open board stays visible.
    - label: Variant
      description: "English draughts, simple capture rule: any legal jump may be taken; the game does not force the longest sequence. No flying kings."
---

Checkers is a two-player 8×8 board game played on the dark squares, with twelve pieces per side. Captures are mandatory, so choosing a quiet move is not always an available option.

## Objective and win/loss conditions

Win by removing every opponent piece or leaving the opponent with no legal move. Player 1 starts each fresh board. There is no timer or automatic draw counter for repeated positions in this edition.

## How it plays

An ordinary piece moves one diagonal square forward into an empty square. To capture, jump an adjacent opponent into the empty square immediately beyond it. Kings can move or capture in either diagonal direction, but they do not slide across multiple empty squares.

If any capture is available, a non-capturing move is refused. Multiple available captures do not impose a longest-sequence rule: choose a legal jump, then continue the selected piece's chain when another jump is available. Promotion occurs on reaching the far row; in this implementation the newly crowned king can continue a capture chain if it has another jump.

For example, if your piece faces an adjacent opponent with an empty landing square beyond, that jump is legal. If your second piece could instead move quietly, the mandatory-capture rule prevents choosing that quiet move for this turn.

## Scoring and strategy

Captured pieces change the board, not a points balance. Check the landing square after each prospective jump: taking one piece can place yours where it is captured in reply. Keep supporting pieces close enough to recapture, and consider whether a trade opens a route to promotion.

The short-range king rule and promotion behavior are specific to this implementation; do not assume every rule from another draughts variant applies.

## Local save data

`nocharge:passplay:match:checkers` stores the latest winner, mode label, and completion date. The shared 0–0 score fields are placeholders, not the number of remaining pieces. Piece positions, a continuing jump sequence, and player names stay in memory only, so reloading cannot resume the match.
