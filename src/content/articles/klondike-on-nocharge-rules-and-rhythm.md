---
title: "Klondike on NoCharge: Rules and Rhythm"
description: How NoCharge's Klondike Solitaire handles draw modes, undo, and the deliberate absence of timers and winnability claims.
kind: game
game: klondike
published: "2026-08-22"
updated: "2026-08-22"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 4
topics: ["Klondike", "solitaire", "Quiet Arcade", "card games"]
featured: true
draft: false
---

> **Bottom line:** How NoCharge's Klondike Solitaire handles draw modes, undo, and the deliberate absence of timers and winnability claims.

Klondike Solitaire is one of the most familiar card games in the world. Most people have played some version of it — on a computer, on a phone, with a physical deck. NoCharge's version keeps the rules standard and changes the frame around them.

## What stays the same

Seven tableau columns, four foundations, stock and waste. Alternating colors descending on the tableau, suit ascending on the foundations. Kings on empty columns, aces start foundations. Draw-1 by default with a toggle to draw-3.

The rules are not novel. The point is not novelty.

## What changes

No timer. No score. No streak. No daily challenge. No winnability percentage. No popup asking you to come back tomorrow.

Instead: an undo button, a draw-mode toggle, and two local metrics (games won and best move count) that stay on your device and can be cleared at any time.

The draw-mode toggle lets you change between draw-1 and draw-3 without starting a new deal. This is unusual — most implementations lock the draw mode per game. We chose flexibility because the constraint served no player need.

## Why no winnability claim

Many solitaire implementations display a percentage like "82% of deals are solvable" or flag individual deals as winnable or unwinnable. We don't do this for two reasons:

1. **Exhaustive solvability search is expensive.** Determining whether a specific Klondike deal is solvable requires exploring a large game tree. Doing this for every deal would add latency without improving play.

2. **The claim implies a performance standard.** If a deal is labeled "winnable" and you don't win, the framing suggests failure. If it's labeled "unwinnable," the framing suggests there's no point playing. Neither frame matches why people play solitaire.

We treat every deal as a fresh layout and let the player decide when to restart.

## The rhythm of quiet play

Klondike sessions on NoCharge tend to range from five to fifteen minutes. There is no rush to finish before a timer expires, no penalty for using undo, and no reward for speed. The game tracks moves as a personal record, not a score to optimize.

This is the Quiet Arcade approach: clear rules, honest documentation, and no manufactured urgency.

