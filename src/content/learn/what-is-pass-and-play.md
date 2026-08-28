---
title: Pass & Play — the definition
description: Pass & Play is two humans taking turns on one device — no network, no accounts, no computer opponent. How the handoff screen works and what NoCharge stores.
published: '2026-08-27'
updated: '2026-08-27'
topic: pass-and-play
readTime: 4
order: 2
faqs:
  - q: 'Is Pass & Play online multiplayer?'
    a: 'No. It is strictly local: two people share one screen and take turns. There is no server, no lobby, and no connection between devices.'
  - q: 'Do player names get saved?'
    a: 'No. Names live in page memory only and reset on reload. The only stored value is one most-recent match record per game under nocharge:passplay:match:*.'
  - q: 'How do players avoid seeing each other''s plans?'
    a: 'Games with hidden information use the handoff screen, which hides the board and shows only whose turn it is. Games without hidden information simply turn the screen toward the next player.'
---

**Bottom line:** Pass & Play at NoCharge means two humans, one device, no network. Players take turns on a shared screen; games with hidden information (like Battleship) use a handoff screen between turns, while open-board games (like Gomoku) just rotate. Scores are one local match record per game — never a profile.

## The rules of the category

A game belongs in the Pass & Play collection when:

1. Two people can complete its full play loop on one shared screen by taking turns.
2. No account, server, or computer opponent is required.
3. Any persisted result is one bounded local record; player names never leave the session.

Current members: Tic-Tac-Toe, Dots & Boxes, Four in a Row, Reversi, Last Token, and Pass the Picture — plus the classics being added in this expansion (Checkers, Gomoku, Nine Men's Morris, and others).

## Handoff screens

NoCharge ships a shared [handoff screen](/learn/handoff-screen/) component. For hidden-information games it:

- Hides the board and shows only "Player 1's turn" (or "Player 2's turn").
- Gives each player a private moment to review the position.
- Returns control with a large, unambiguous continue button — no timers, no points.

For open-board games, the same screen appears briefly with the next player's name, then gameplay continues.

## What NoCharge stores

One most-recent match record per Pass & Play game: mode, result, score, and date. That is all. There are no match histories, no ratings, no Elo, and no cross-device sync. [Privacy](/privacy/) lists every key.

## Limits

Pass & Play requires both players to look at or handle the same device. NoCharge does not offer networked play, asynchronous turns, or AI opponents; AI is a future optional mode, not a substitute for local play.

## Related reading

- [The handoff screen](/learn/handoff-screen/)
- [Two-player games on one device](/articles/two-player-games-one-device/)
- [Pass & Play collection](/collections/pass-and-play/)
