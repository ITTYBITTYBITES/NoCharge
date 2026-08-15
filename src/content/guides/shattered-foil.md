---
title: "Shattered Foil Complete Solitaire Guide"
description: Learn all five Shattered Foil solitaire modes, Daily Window, Journey, Atelier, scoring, timeline, accessibility settings, and IndexedDB saves.
game: shattered-foil
readTime: 14
updated: "2026-08-15"
featured: true
order: 4
---

Solitaire: Shattered Foil brings five stained-glass solitaire systems into one local-first studio. “Fragments of beauty, brought together” describes both the copper-foil card identity and the objective: organize a scattered deck into complete structures. Progress, saves, inventory, Daily Window results, and settings remain in this browser’s IndexedDB.

## Entering the studio

The entry panel leads to the active table and six studio surfaces: Modes, Glass Atelier, Daily, Journey, Timeline, and Settings. If an unfinished session exists, Resume restores its exact deal. New deal creates a new deterministic seed; Restart returns to the opening position of the current seed.

## Klondike: Draw 1 and Draw 3

Seven tableau columns contain one through seven cards, with only each top card face up. Build tableau downward while alternating red and black. Only a King-led sequence enters an empty column. Foundations build by matching suit from Ace through King. Draw 1 exposes one stock card; Draw 3 exposes up to three. Recycle waste when stock is empty. Moving to foundations, revealing hidden cards, undo, score, and elapsed time are recorded.

## Spider

Spider uses 104 cards and ten tableau columns. Four columns begin with six cards and six with five; only top cards face up. Build descending ranks. A movable multi-card sequence must be a packed same-suit run. Stock deals one face-up card onto each non-empty column. A complete same-suit King-to-Ace run clears automatically. Clear eight runs to win.

## FreeCell

All 52 cards begin face up across eight cascades. Four free cells hold one card each, and four foundations build by suit. Cascades build downward in alternating colors. The maximum movable sequence depends on available free cells and empty cascades: `(empty cells + 1) × 2 ^ empty cascades`, excluding the destination. Complete all foundations to win.

## TriPeaks Mosaic

Twenty-eight cards form three overlapping peaks. Only cards with all blockers removed are exposed. Remove an exposed card when its rank is one above or below the waste card; Ace and King wrap as adjacent. Consecutive removals increase the streak multiplier. Drawing stock resets the multiplier. Clear the board before legal moves and stock run out.

## Pyramid Alignment

Twenty-eight cards form seven overlapping rows. A card is exposed only after both children below it are removed. Remove two exposed cards totaling thirteen, or remove an exposed King by itself. Stock and waste provide additional pair candidates. Clear the pyramid to win.

## Daily Window and streak calendar

The Daily Window uses a stable UTC date key and deterministic seed, so the same date and mode produce the same deal offline. The first completion is the canonical result and grants one star plus twenty local shards. Replays do not duplicate rewards. Consecutive UTC completion dates extend current and longest streaks; the monthly calendar handles month and year boundaries.

## The Glass Journey

Chronos contains five data-driven realms: Botanical Gardens, Notre-Dame Spires, Crystal Caverns, Nocturne Bat Belfry, and Celestial Rose. Each realm contains ten seeded deals across the five modes. Stars unlock later realms. Completed-deal markers, per-deal results, rewards, and the active Journey position persist locally.

## Glass Atelier, card backs, and shards

Classic Copper Foil and Notre-Dame Azure begin owned. Other catalog designs—including Tiffany Dragonfly, Favrile Amber Pearl, Murano Millefiori, and Prismatic Bauhaus—use local shards. Purchases deduct currency and add inventory in one IndexedDB transaction, cannot charge twice, and report insufficient balance. Stars and shards have no cash value.

## Atmospheres, music, foley, and haptics

Dark Cathedral Oak, Cathedral Sapphire, Amethyst Sanctuary, and Obsidian Noir alter the table while retaining readable labels and copper framing. Ten named synthesized melodic movements can be selected, auditioned, skipped, or auto-rotated. Playback starts only after interaction and pauses while hidden. Music, foley volume, mute, and safely detected haptics are optional; visual and announced feedback always remains.

## Move timeline and undo

Each move records a description, score delta, elapsed time, and restorable state. The timeline can inspect earlier positions without changing the persisted live position. If a player explicitly restores an earlier step and makes a new move, abandoned future events are truncated. Undo restores the exact previous piles, faces, score, and move count.

## Controls and accessibility

Touch and pointer players select a card or sequence and then its destination; drag is only an enhancement. Keyboard players Tab through controls, use Enter or Space to activate, and Escape to cancel. Card names include rank, suit, color, face state, pile, column, and selection. Invalid moves, wins, losses, and progression updates use live announcements. Left-handed and four-color modes, visible focus, reduced motion, 200% zoom, and sound-independent state are supported.

## IndexedDB save, export, and privacy

`nocharge-shattered-foil` stores profiles, settings, sessions, Daily results, streaks, progression, inventory, Journey state, move history, and migration records. Autosave follows valid moves. Corrupt or unknown imports are rejected; export creates versioned JSON. Clearing current save or all progress does not clear NoCharge consent. The Privacy button opens the platform consent manager rather than a duplicate game dialog.

The old GitHub Pages origin cannot share browser storage with `nocharge.net`. NoCharge therefore starts a new local profile unless data is moved through the versioned export/import flow.
