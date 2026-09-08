---
title: Reversi
tagline: Two players, one device.
description: Play Reversi with a friend on one screen. Outflank and flip your opponent's discs on the classic 8×8 board — most discs wins. No account, no timer, no computer opponent.
emoji: ⚫
accent: "#2dd4bf"
tier: quick
runtime: reversi
artwork:
  icon: /game-art/reversi/icon.svg
  coverSquare: /game-art/reversi/cover-square.webp
  coverSquareFallback: /game-art/reversi/cover-square.jpg
  coverLandscape: /game-art/reversi/cover-landscape.webp
  coverLandscapeFallback: /game-art/reversi/cover-landscape.jpg
  guideHeader: /game-art/reversi/guide-header.webp
  guideHeaderFallback: /game-art/reversi/guide-header.jpg
  socialCard: /game-art/reversi/social-card.jpg
  socialCardFallback: /game-art/reversi/social-card.jpg
  socialCardWebp: /game-art/reversi/social-card.webp
  alt: A green Reversi board with black and white discs and a marked legal move
presentation:
  controlsHeading: Outflank a line of discs, then pass the device.
  controls:
    - label: Place a disc
      description: Tap or click any highlighted square, or move between playable squares with the arrow keys and press Enter.
    - label: Flipping
      description: A legal move outflanks one or more opponent discs in a straight line — horizontal, vertical, or diagonal — and flips every outflanked disc.
    - label: Passing
      description: A player with no legal move passes automatically and the other player continues; the game ends when the board is full or neither player can move.
    - label: Legal-move hints
      description: Playable squares are marked by default; the toolbar button hides the markers if both players prefer reading the board themselves.
  relatedHeading: Try another shared screen.
genre: Pass & Play
difficulty: Easy to learn, hard to master
session: 5–12 min
order: 8
---

Reversi begins with four center discs on an 8×8 board. A legal placement changes existing discs as well as adding a new one, so the visible lead can change sharply near the end.

## Objective and win/loss conditions

Finish with more discs of your color than the other player. Black moves first. Play ends when the board is full or neither player can make a legal move; equal disc counts are a draw. If only one player is unable to move, that player passes automatically rather than losing immediately.

## How it plays

Place on an empty square that brackets at least one opposing disc between your new disc and another of your own. The bracket must be an unbroken horizontal, vertical, or diagonal line. All bracketed enemy discs flip, including lines in several directions from the same placement.

For example, a row segment Black, White, White, empty lets Black play the empty square and flip both White discs. An empty gap between those White discs would break the bracket. You cannot place a disc merely because the square is empty; at least one flip is required.

## Scoring and strategy

The score is the number of discs currently showing each color. Only the final comparison decides the result. Flipping many discs early can expose useful moves to your opponent rather than secure a lasting advantage.

Inspect the legal moves your placement leaves behind. An owned corner cannot be outflanked, so avoid offering one without understanding the trade. Near the end, count empty spaces and consider automatic passes: the same player can sometimes take consecutive turns when the opponent has no legal placement.

## Local save data

`nocharge:passplay:match:reversi` keeps the last completed 8×8 result, final Black and White disc totals, and date. It is not a move log or a restored board. Player names stay out of the record, and nothing is synchronized between browsers. My Arcade displays the locally saved outcome.
