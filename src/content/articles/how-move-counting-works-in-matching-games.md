---
title: "How move counting works in matching games"
description: "See exactly when NoCharge Memory Match adds a move and how to use that number as a clear measure of a board run."
game: memory-match
published: "2026-08-15"
updated: "2026-08-15"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 5
topics: ["Memory Match", "moves", "scoring"]
featured: false
draft: false
---

A move counter can look like a score, but it measures something different. In NoCharge Memory Match, lower is better: a move is one two-card attempt. It is counted when you reveal the second card, whether those two cards match or turn back over. Understanding that simple rule helps you evaluate a run without guessing what the number means.

Open [Memory Match](/games/memory-match/) for the live board, and use the [Memory Match guide](/guides/memory-match/) for the complete rules.

## One attempt, one move

The board has sixteen cards and eight pairs. Select a hidden card first, then select a second hidden card. As soon as that second selection is made, the move total increases by one.

There are two possible outcomes:

- **Match:** both cards stay visible, and the pair leaves future decisions.
- **Mismatch:** the two cards remain visible briefly, then turn back over. The move still counts because it was a full attempt.

The first card by itself does not add a move. That matters when you are thinking through a turn. You can reveal a card, use the information it gives you, then decide whether the second card should be a known partner or a fresh location. The counter records the pair of selections, not each individual click or key press.

## The lowest possible total

Eight matching attempts would clear all eight pairs in eight moves. That is the mathematical minimum, but it would require knowing every pair before making the first selection. On a shuffled board, ordinary play begins by discovering locations, so mismatches are expected. They are only wasteful when they repeat information you could have used more directly.

Imagine that your first attempt reveals a green symbol and a blue symbol. The counter becomes one. On your next attempt, you reveal another green symbol. If you remember the first green position and choose it second, the counter becomes two and you have a pair. If instead you reveal a new unknown card, the counter still becomes two, but you may have missed a known match. The total alone does not describe every decision, but it tells you how efficiently those opportunities were converted.

## Why a mismatch is not automatically a bad move

Early mismatches create the map you need later. A move that exposes two never-before-seen cards can be productive even when neither card stays up. It gives you two locations that may be used on later turns. By contrast, a mismatch that reopens a location you cannot place or ignores an available partner usually adds less information.

A helpful question after every mismatch is: “What did I learn that I can use?” If you can name the two symbols and rough positions, the move supplied useful data. If you cannot, simplify your scan pattern rather than trying to force more symbols into memory.

## Use the number for like-for-like comparison

The best way to use a move count is to compare your own completed boards under the same rules. A board that finishes in sixteen moves is not necessarily worse play than a board that finishes in fourteen; the shuffled layout and what you remembered both matter. Still, repeated runs can show whether a specific habit helps:

1. Play one board with a fixed scan direction.
2. Note the final move count.
3. Play another board while taking known matches immediately.
4. Compare several runs, not just one lucky board.

This is more useful than chasing an arbitrary target. A small improvement that comes from better use of known locations is meaningful because it reflects an actual change in decisions.

## Best score storage is local

NoCharge keeps the lowest completed Memory Match move count as the best result for that browser. It is stored in local browser storage, not uploaded to a profile or leaderboard. Starting a new game resets the current board and its move display, but it does not erase an existing best. Clearing game data from the Privacy page removes that local record.

The number is intentionally a simple personal reference. There is no timer, account rank, or sound requirement attached to it.

## Build a better move total from better information

The counter rewards two related habits: reveal new information efficiently, then use remembered partners promptly. You do not need to play faster. Give each attempt a purpose, whether it is completing a known pair or exposing new positions for the map.

For the mapping method behind that approach, read [A systematic way to scan a Memory Match board](/articles/memory-match-systematic-board-scan/). If you play without a mouse, [Keyboard strategy for Memory Match](/articles/keyboard-strategy-for-memory-match/) explains how to keep the same deliberate rhythm with Tab, Enter, and Space. When you are ready, [play another board](/games/memory-match/).
