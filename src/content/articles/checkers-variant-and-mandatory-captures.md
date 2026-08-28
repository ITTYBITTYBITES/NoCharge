---
title: "Checkers on NoCharge — mandatory captures and the simple rule"
description: "English draughts variant choices: forced jumps, multi-jump turn continuation, no flying kings, and why the simple capture rule is stated instead of hidden."
kind: game
game: checkers
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 4
topics:
  - checkers
  - pass and play
  - rules
featured: false
---

**Bottom line:** NoCharge Checkers implements English draughts with mandatory captures, multi-jump continuation, men- and king-movement as described, and the simple capture rule — any legal jump may be taken, without forcing the longest chain. Every variant decision is on the guide.

## The three decisions

1. **Mandatory capture:** if any jump exists for the player, simple moves are disabled. The status line announces it before the player selects anything.
2. **Multi-jump continuation:** after a capture, if the same piece can capture again, the turn stays with that player and piece until the chain ends or the player stops at a valid terminal.
3. **No flying kings:** kings move exactly one diagonal per turn in any direction. No multi-square slides.

## The simple capture rule

When two different capture chains exist, the player may choose either. Some rule sets force the longest sequence (or "capture the most"). NoCharge does not enforce that and says so on the guide — two players from different regional variants can verify the contract before the game starts.

## Why variant honesty matters

Checkers rules vary by country (English draughts, Russian, Brazilian, international). A player raised on one variant can be surprised by promotion rules or capture obligations. The guide's "Variant, stated exactly" section is the agreement; the in-game note repeats the key points on first load.

## Testing

Unit tests cover setup, forward moves, mandatory-capture blocking, promotion, multi-jump continuation, and capture-target discovery. The registry review ensures the in-game note and guide text stay in agreement.

## Next step

Play a game, then compare the handoff model with [Nine Men's Morris](/games/nine-mens-morris/) — both Pass & Play, both open-board.
