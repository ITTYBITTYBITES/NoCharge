---
title: Minesweeper on NoCharge — a calm clearing loop, not a speed run
description: Why NoCharge's Minesweeper keeps the reveal/flag/chord loop but drops the timer, and why the safe-first-click guarantee is stated with its exact boundary.
kind: game
game: minesweeper
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 4
topics:
  - minesweeper
  - untimed play
  - keyboard controls
featured: true
---

Minesweeper's classic loops — reveal, count, flag, chord — usually ship inside a timer and a score. NoCharge's version keeps the loop and drops the pressure: there is no countdown, no score for speed, and a first click that cannot lose. This note explains the three design decisions that make that honest.

## First click without a death sentence

Most implementations guarantee the first click is safe. NoCharge's guarantee includes one extra step: when the board is large enough, mines also avoid the first click's neighbours, so an opening reveal opens a small region instead of a single isolated number. The engine states exactly when that extension applies (boards where the protected neighbourhood would leave too few cells for the mine count). Documenting the boundary is the point — "safe first click" without a caveat is a promise a player cannot verify.

## Timer as a metric, not a mode

The elapsed time is recorded only when a board is cleared, and it is never displayed while playing. That changes the emotional shape of the game more than it changes the rules: a mid-board pause to reason costs nothing. The recorded best time is a personal by-product, not a ranking — there is no leaderboard and no "you beat 80% of players" line.

## Flag-first is the calm default

Chords fire only when the surrounding flag count exactly matches the cell's number, so a wrong flag costs a click but never detonates a cell by accident. Flag mode is a separate toggle, and the keyboard path (F to flag, arrows to move, Enter to reveal or chord) keeps the whole loop one-handed.

## What this article does not claim

NoCharge does not claim Minesweeper trains working memory, reaction, or problem-solving skills. The "calm" framing describes presentation (untimed, no lives, no score pressure), not an outcome for the player. The definitive guide documents the exact flag/chord behavior and the safe-first-click boundary if you want to verify the game against its description.
