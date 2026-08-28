---
title: Solitaire free, no download, no signup — the NoCharge card shelf
description: Klondike and FreeCell play instantly in the browser; Spider is planned. Rules, storage, controls, and what each card game keeps local.
kind: platform
category: trust
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 5
topics:
  - solitaire
  - card games
  - free model
featured: true
---

**Bottom line:** NoCharge's card shelf currently has Klondike (draw one or three) and FreeCell (all cards visible), both instant in the browser with no account, no download, and no installation. Wins and best moves stay in this browser. Spider is planned; its rules table already exists in the [solitaire comparator](/tools/solitaire-comparator/).

## What is live

| Game | Rules | What you decide | Local keys |
|---|---|---|---|
| Klondike | 7 tableau columns, stock → waste, 4 Ace-up foundations | Draw one or three (preference saved) | `nocharge:klondike:games-won`, `best-moves`, `pref:klondike-draw-mode` |
| FreeCell | 8 columns, all face-up, 4 free cells, Ace-up foundations | Sequence planning with complete knowledge | `nocharge:freecell:games-won` |

## Why "no download, no signup"

The card games are static Astro pages with client-side JavaScript and localStorage. There is no executable, no account, no server round-trip to play. The [free-model article](/articles/free-browser-games-no-account/) explains the whole model; the [solitaire comparator](/tools/solitaire-comparator/) lists the planned Spider rules.

## Controls

- **Pointer/touch:** tap to select, tap to move; drag is never required.
- **Keyboard:** Tab through stock, waste, tableau, and foundations; Enter moves; D draws (Klondike), U undoes.
- **Shared shell:** pause on tab hide, mute, ambient, Game Mode.

## Limits

- Both are classic-rule implementations; NoCharge does not claim solvability rates or "winnable 99% of games" for either.
- Session labels (5–15 and 5–20 min) are estimates.
- NoCharge does not track streaks, streaks-remaining, or undo limits like apps with energy systems.

## Next step

Play [Klondike](/games/klondike/) or [FreeCell](/games/freecell/), then compare rules with the [comparator](/tools/solitaire-comparator/) before Spider ships.
