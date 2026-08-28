---
title: Two-player games on one device
description: "What NoCharge Pass & Play is, how handoffs handle hidden information, and one record per game saved locally."
kind: platform
category: trust
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 4
topics:
  - pass and play
  - local play
  - comparisons
featured: true
---

**Bottom line:** NoCharge's two-player mode is Pass & Play: two humans, one screen, no network, no account, no AI opponent. The device passes between turns — either through a handoff screen that hides hidden information or a simple "next player" handoff for open boards. NoCharge saves one bounded match record per game, and never player names or match history.

## What "two players" means here

- Exactly two humans, taking turns on one device.
- No server, no lobby, no online matchmaking, no cross-device sync.
- No computer opponent. AI is a possible future mode, explicitly separate.

## Handoff screens

NoCharge's shared handoff component is the boundary between turns. For open-board games (Gomoku, Nine Men's Morris, Checkers) it names the next player over a visible board. For hidden-information games (Battleship when it ships) it hides the board. Either way there is no timer, no "quick, it's your turn" pressure, and no habit loop.

## What NoCharge saves

One most-recent match record per game under `nocharge:passplay:match:*`: mode, result, score, and timestamp. That is the entire persistence model. Names live in page memory only; a reload resets them. The Privacy page lists the keys, and Clear game data removes them.

## What NoCharge does not offer

- Online multiplayer of any kind.
- Player ratings, Elo, or "best on the device" leaderboards.
- Match history or replays.
- Notifications or streaks for Pass & Play.

These are intentional absences, not missing features — see the [Pass & Play explainer](/learn/what-is-pass-and-play/) for the reasoning.

## Choosing a game

- **Open board, strategy:** Gomoku (five in a row), Nine Men's Morris (mills), Checkers (when it ships).
- **Hidden information, bluffing:** Battleship (when it ships).
- **Quick rounds:** Last Token, Tic-Tac-Toe.

The [Pass & Play collection](/collections/pass-and-play/) lists current members with genre and session length.
