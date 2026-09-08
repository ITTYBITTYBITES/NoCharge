---
title: Tic-Tac-Toe
tagline: Two players, one device.
description: Play Tic-Tac-Toe with a friend on one screen in your browser. Choose the 3×3 board, the 4×4 four-in-a-row board, or a first-to-3 match with no account and no timer.
emoji: ⭕
accent: "#60a5fa"
tier: quick
runtime: tic-tac-toe
artwork:
  icon: /game-art/tic-tac-toe/icon.svg
  coverSquare: /game-art/tic-tac-toe/cover-square.webp
  coverSquareFallback: /game-art/tic-tac-toe/cover-square.jpg
  coverLandscape: /game-art/tic-tac-toe/cover-landscape.webp
  coverLandscapeFallback: /game-art/tic-tac-toe/cover-landscape.jpg
  guideHeader: /game-art/tic-tac-toe/guide-header.webp
  guideHeaderFallback: /game-art/tic-tac-toe/guide-header.jpg
  socialCard: /game-art/tic-tac-toe/social-card.jpg
  socialCardFallback: /game-art/tic-tac-toe/social-card.jpg
  socialCardWebp: /game-art/tic-tac-toe/social-card.webp
  alt: A dark tic-tac-toe board where blue X marks complete a winning diagonal
presentation:
  controlsHeading: Share the board, one move at a time.
  controls:
    - label: Place a mark
      description: Tap or click an empty square, or move with the arrow keys and press Enter or Space.
    - label: Pass the device
      description: After each move the screen offers a handoff to the other player; press Continue when the device has changed hands.
    - label: Player names
      description: Edit Player 1 and Player 2 in the handoff screen. Names last for the browser session only and are never saved.
    - label: Change mode
      description: Switch between 3×3 · 3 in a row, 4×4 · 4 in a row, and Match · first to 3 at any time.
  relatedHeading: Try another shared screen.
genre: Pass & Play
difficulty: Easy to learn
session: 1–3 min per round
order: 5
---

Tic-Tac-Toe is a two-player, shared-device game with 3×3, 4×4, and Match modes. The required line length changes with the board, so a three-mark threat means something different on each size.

## Objective and win/loss conditions

Complete a horizontal, vertical, or diagonal line before the other player: three marks on 3×3, four on 4×4. A full board without a line is a draw. Match uses 3×3 rounds and ends at three round wins or after five rounds. If neither player has reached three wins at that limit, this edition records the match as a draw.

## How it plays

Place one mark in an empty square, then hand over the device. An occupied square cannot replace a mark or spend the turn. X and O alternate moves, and the opening mark alternates between rounds. The Continue control releases the handoff screen for the next player.

For example, on 3×3 a row containing X, X, empty is an immediate winning move for X. O must fill that empty square to block it unless O can win elsewhere immediately. On 4×4, two adjacent X marks still need two more marks in that line.

## Scoring and strategy

A won Match round adds one to that player's tally; a drawn round uses one of the five rounds but adds no win. There are no points for taking a center square or making a partial line.

Check your own immediate winning moves and your opponent's threats before building a new line. A fork creates two distinct winning destinations, but an apparent fork is only useful if the opponent cannot end the game first.

## Local save data

`nocharge:passplay:match:tic-tac-toe` stores one latest result with mode, round-win tally, and completion date. It is replaced by a later completed result, not extended into a match history. The board and ongoing series are not saved, and player names are never written into this localStorage record.
