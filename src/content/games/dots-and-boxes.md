---
title: Dots & Boxes
tagline: Two players, one device.
description: Play Dots & Boxes with a friend on one screen. Draw lines, complete boxes to claim them and move again, and win the most boxes — no account, no timer.
emoji: ⬜
accent: "#f472b6"
tier: quick
runtime: dots-and-boxes
artwork:
  icon: /game-art/dots-and-boxes/icon.svg
  coverSquare: /game-art/dots-and-boxes/cover-square.webp
  coverSquareFallback: /game-art/dots-and-boxes/cover-square.jpg
  coverLandscape: /game-art/dots-and-boxes/cover-landscape.webp
  coverLandscapeFallback: /game-art/dots-and-boxes/cover-landscape.jpg
  guideHeader: /game-art/dots-and-boxes/guide-header.webp
  guideHeaderFallback: /game-art/dots-and-boxes/guide-header.jpg
  socialCard: /game-art/dots-and-boxes/social-card.jpg
  socialCardFallback: /game-art/dots-and-boxes/social-card.jpg
  socialCardWebp: /game-art/dots-and-boxes/social-card.webp
  alt: A dark dot lattice with pink and blue drawn edges enclosing two claimed boxes
presentation:
  controlsHeading: Draw one line each turn.
  controls:
    - label: Draw a line
      description: Tap or click any undrawn line between two dots, or reach it with the arrow keys and press Enter.
    - label: Claim a box
      description: Drawing the fourth side of a box claims it in your color and grants another line immediately — the device does not pass.
    - label: Pass the device
      description: When no box is completed, the handoff screen offers the device to the other player.
    - label: Board size
      description: Switch between the 4×4 board (16 boxes) and the larger 6×6 board (36 boxes) at any time.
  relatedHeading: Try another shared screen.
genre: Pass & Play
difficulty: Easy to learn
session: 3–8 min
order: 6
---

Dots & Boxes makes the fourth side of a square more important than its first three. Two people share one screen, and closing a box lets the same player draw again.

## Objective and win/loss conditions

Claim more boxes than your opponent by the time every box is enclosed. Equal totals produce a draw. The small board contains 4×4 boxes, or 16 in total; the larger board contains 6×6 boxes, or 36. There is no timer and no computer opponent.

## How it plays

Choose an undrawn horizontal or vertical edge between neighboring dots. If the edge finishes no box, the turn passes. If it finishes one or two boxes, those boxes become yours and you keep the turn. It does not matter who drew the other three sides.

For example, two neighboring boxes can each have three sides with their shared middle edge still missing. Drawing that one edge claims both boxes, adds two points, and grants another move. Continue playing until you draw an edge that finishes no box or the board ends.

## Scoring and strategy

Every claimed box is worth one point. On a 16-box board, a final 9–7 count wins by two boxes; the number of lines each player drew does not decide the winner.

Before adding a third side, inspect what your opponent could claim next. Several nearly closed boxes can form a chain that one player takes using consecutive extra moves. When only risky openings remain, compare the lengths of the chains you would release rather than treating each edge as an isolated decision.

## Local save data

`nocharge:passplay:match:dots-and-boxes` records the latest completed board size, each player's box count, result, and date. It stores neither the drawn-edge layout nor player names. Reloading will not resume a half-finished board. My Arcade reads this single browser-local result rather than maintaining a public score table.
