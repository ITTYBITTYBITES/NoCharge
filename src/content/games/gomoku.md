---
title: Gomoku
tagline: Five in a row, two players, one device.
description: "Free-style Gomoku on a 15×15 board for two players on one screen. Five or more stones in a row wins; no overline restriction, no captures, no tournament opening rules — the variant is stated plainly."
emoji: ⚫
accent: "#f59e0b"
tier: signature
runtime: gomoku
artwork:
  icon: /game-art/gomoku/icon.svg
  coverSquare: /game-art/gomoku/cover-square.webp
  coverSquareFallback: /game-art/gomoku/cover-square.jpg
  coverLandscape: /game-art/gomoku/cover-landscape.webp
  coverLandscapeFallback: /game-art/gomoku/cover-landscape.jpg
  guideHeader: /game-art/gomoku/guide-header.webp
  guideHeaderFallback: /game-art/gomoku/guide-header.jpg
  socialCard: /game-art/gomoku/social-card.jpg
  socialCardFallback: /game-art/gomoku/social-card.jpg
  socialCardWebp: /game-art/gomoku/social-card.webp
  alt: A 15×15 Go-style board with black and white stones forming an open row
genre: Board game
difficulty: Open position
session: 5–20 min
featured: false
order: 23
presentation:
  controlsHeading: Place one stone per turn on the 15×15 board. Five or more in a row wins.
  controls:
    - label: Place
      description: Tap or click an empty intersection; keyboard players move the roving cursor with arrow keys and place with Enter or Space.
    - label: Handoff
      description: Between turns the shared handoff screen names the next player. The board stays visible because free-style Gomoku has no hidden information.
    - label: New game
      description: Resets the board and hands the first move to the same starting player.
---

Gomoku places black and white stones on a 15×15 grid. Unlike Four in a Row, stones do not fall: any empty intersection can be the next move.

## Objective and win/loss conditions

Be first to make an unbroken line of five or more stones horizontally, vertically, or diagonally. A filled board without such a line is a draw. Player 1 uses Black and starts a fresh game. There is no countdown, capture score, or computer opponent.

## How it plays

Place one stone, then pass the device to the other player. A stone stays where it was placed and an occupied point cannot be replaced. NoCharge uses free-style Gomoku: overlines count, and there are no Renju forbidden-move restrictions or tournament opening exchanges.

For example, if your row contains Black, Black, empty, Black, Black, placing Black in the gap completes five and wins. If the same placement joins a longer unbroken line, that also wins here. A diagonal counts in exactly the same way as a row or column.

## Scoring and strategy

Only the completed line or drawn board decides the outcome; individual stones do not earn points. A four-stone line with both ends open threatens two possible winning moves, while a line blocked at one end offers fewer continuations.

Check for your own immediate win and the opponent's immediate winning cells before extending a slower plan. Central stones can participate in multiple directions, but an attractive center move is not a substitute for blocking an existing four. The game marks outcomes without evaluating the strength of a move.

## Local save data

`nocharge:passplay:match:gomoku` stores the latest free-style result and finish date. Its shared score fields are 0–0 placeholders, not a tally of captured stones or match wins. The 225-point board, move sequence, and player names are not persisted. A later completed game replaces the previous browser-local record.
