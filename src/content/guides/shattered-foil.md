---
title: "Solitaire: Shattered Foil Guide: Complete Klondike Draw 1 Rules"
description: Learn the Shattered Foil deal, tableau and foundation rules, scoring, undo, keyboard controls, accessibility options, and local save behavior.
game: shattered-foil
readTime: 9
updated: "2026-08-15"
featured: true
order: 4
---

Shattered Foil is Klondike Draw 1 played with a standard 52-card deck. Win by moving every card to four suit foundations, from Ace through King. The game saves locally, so a longer deal can continue without an account.

## The initial deal and objective

Seven tableau columns contain one through seven cards. Only the top card of each column begins face up. The remaining 24 cards form the stock. Complete all four foundations to win.

## Tableau and sequence rules

Tableau cards build downward by rank while alternating red and black. A black Jack can receive a red 10, for example. Any complete face-up descending alternating sequence moves together. Only a King or King-led sequence can enter an empty column. Exposing a face-down card flips it automatically.

## Foundations, stock, and waste

Each foundation begins with an Ace and builds upward in one suit. Select the stock to draw one card to waste. When stock is empty, recycle the waste for another unlimited pass. A foundation card can return to a legal tableau position, with the documented score penalty.

## Scoring and undo

Waste to tableau earns 5 points; waste or tableau to foundation earns 10; revealing a hidden tableau card earns 5; foundation back to tableau costs 15. Score never drops below zero. Undo restores the complete prior state, including score, card faces, and pile order.

## Keyboard and touch controls

Touch and pointer players select a card and then its destination; dragging is not required. Keyboard players Tab through controls, press Enter or Space to select and move, and press Escape to cancel. New deal creates a new seed, while Restart returns to the current seed’s opening deal.

## Left-handed and four-color modes

Left-handed layout moves stock and waste emphasis for easier reach. Four-color suits distinguish diamonds and clubs in addition to the standard red/black relationship; visible suit symbols and accessible names remain authoritative, so rules never depend on hue alone.

## Save, resume, timer, and local data

The deal seed, piles, score, moves, elapsed time, preferences, and recent undo history use the versioned `nocharge:shattered-foil:v1` local key. The timer advances only after play begins, pauses while hidden, and does not run behind consent controls. Clearing game data from Privacy removes this save without removing consent choices.

## Strategy

Prioritize revealing face-down tableau cards, preserve empty columns for useful Kings, and avoid sending cards to foundations when they are still needed to organize tableau sequences. Use undo to inspect consequences, not to replace a plan.

## Accessibility

Every card is a DOM control with rank, suit, color, face state, and pile context in its accessible name. Moves, invalid destinations, undo, and wins are announced. Focus remains visible, reduced motion is honored, and audio is never needed to understand state.

## Frequently asked questions

### Are deals guaranteed to be winnable?

No. Deals are deterministic and reproducible, but this release does not include an advanced solver or guaranteed-winnable generator.

### Are Spider or FreeCell included?

No. This release intentionally exposes only complete Klondike Draw 1. Other variants remain deferred rather than appearing as unfinished controls.

### Does progress sync between devices?

No. Saves remain in this browser and are not uploaded. Use New deal when you want to replace the current local game.
