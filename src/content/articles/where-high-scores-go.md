---
title: Where high scores go with no login
description: "NoCharge scores live in browser localStorage under the nocharge: prefix. How to find them, why they vanish in private windows, and how to clear them."
kind: platform
category: privacy
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 3
topics:
  - local storage
  - privacy
  - scores
featured: true
---

**Bottom line:** NoCharge high scores, best moves, win counts, and progress are stored in your browser's `localStorage` under the `nocharge:` prefix. Nothing is uploaded, nothing is shared, and nothing follows you to another device. The Privacy page lists every key; "Clear game data" removes them.

## The exact shape

- `nocharge:{game}:high` — best higher-is-better score (Memory Match, Word Tile Rush, Color Flip, Beacon Lattice).
- `nocharge:{game}:best-moves`, `best-time`, `best-length`, `best-tier` — per-game best metrics.
- `nocharge:{game}:games-won`, `puzzles-solved`, `puzzles-revealed` — lifetime counts on this browser.
- `nocharge:{game}:current-puzzle` — in-progress boards for Sudoku 6×6 and 9×9.
- `nocharge:passplay:match:{game}` — one most-recent Pass & Play record per game.
- `nocharge:pref:*` — sound, volume, ambient, draw mode, theme, size, calm-pattern preferences.
- `nocharge:pref:recently-played` — up to four recent game IDs.

## How to see them

Open the browser's DevTools → Application → Local Storage → `https://nocharge.net`. NoCharge's own [localStorage inspector](/tools/storage-inspector/) (when it ships) lists the same keys without DevTools.

## Why they "disappear"

- **Private window:** temporary storage; closing it discards the values.
- **Different browser or profile:** storage is per origin, per browser, per profile.
- **Different device:** localStorage never leaves the machine.
- **Site data cleared:** the values are gone; there is no backup.

## How to remove them

Privacy page's "Clear game data" removes exactly the allowlisted NoCharge keys — not consent, not Google's advertising choices, not unrelated origin data.

## Limits

localStorage is not a durable "save": it can be evicted by the browser, size-capped, and is per device. NoCharge provides no export, no cloud copy, and no recovery.
