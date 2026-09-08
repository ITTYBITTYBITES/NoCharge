---
title: Four in a Row
tagline: Two players, one device.
description: Play Four in a Row with a friend on one screen. Drop discs into columns on the standard 7×6 board or a 6×5 board — first to four in a row wins. No account, no timer.
emoji: 🟡
accent: "#a78bfa"
tier: quick
runtime: four-in-a-row
artwork:
  icon: /game-art/four-in-a-row/icon.svg
  coverSquare: /game-art/four-in-a-row/cover-square.webp
  coverSquareFallback: /game-art/four-in-a-row/cover-square.jpg
  coverLandscape: /game-art/four-in-a-row/cover-landscape.webp
  coverLandscapeFallback: /game-art/four-in-a-row/cover-landscape.jpg
  guideHeader: /game-art/four-in-a-row/guide-header.webp
  guideHeaderFallback: /game-art/four-in-a-row/guide-header.jpg
  socialCard: /game-art/four-in-a-row/social-card.jpg
  socialCardFallback: /game-art/four-in-a-row/social-card.jpg
  socialCardWebp: /game-art/four-in-a-row/social-card.webp
  alt: A violet game board with violet and amber discs stacked in its columns
presentation:
  controlsHeading: Drop a disc, then pass the device.
  controls:
    - label: Drop a disc
      description: Choose a column button above the board, or move between columns with the left and right arrow keys and press Enter.
    - label: Falling discs
      description: A dropped disc falls to the lowest empty cell in its column; the drop animation turns itself off for reduced-motion players.
    - label: Winning
      description: The first four discs in a row — horizontal, vertical, or diagonal — win the game, and a full board is a draw.
    - label: Board size
      description: Play the standard 7×6 board or switch to the quicker 6×5 board at any time.
  relatedHeading: Try another shared screen.
genre: Pass & Play
difficulty: Easy to learn
session: 2–6 min
order: 7
---

Four in a Row is a gravity-based board game for two people on one device. You choose a column, not a free square, which makes the height of a potential winning cell part of the tactic.

## Objective and win/loss conditions

Connect at least four of your discs horizontally, vertically, or diagonally. The standard board has seven columns and six rows; the smaller board has six columns and five rows. A full board with no winning line is a draw. The starting player alternates between games.

## How it plays

Choose a column button to drop a disc into its lowest empty space. Full columns cannot accept another disc. After the drop and any win check, the handoff screen gives the next move to the other player.

For example, three discs at the bottom of columns 1, 2, and 3 can be completed by a disc at the bottom of column 4 if that cell is open. A line of three higher up is not immediately finishable if the space below its fourth cell is empty: your drop will stop below the intended winning position.

## Scoring and strategy

The outcome is a win or draw, not points for individual discs. A vertical stack of three is an immediate threat when the next space in that column is open. Horizontal and diagonal threats require checking the landing height.

Before dropping beneath an opponent's open line, inspect the space your disc will support. Filling the lower cell can make their winning cell reachable on the very next turn. Central columns participate in many possible lines, but an immediate block or win takes precedence over a general preference for the center.

## Local save data

`nocharge:passplay:match:four-in-a-row` stores the latest board size, winner or draw, a 1–0/0–1 result tally (0–0 for a draw), and completion date. It does not save disc positions or an ongoing game. The result stays on this browser only and can be removed through Clear game data.
