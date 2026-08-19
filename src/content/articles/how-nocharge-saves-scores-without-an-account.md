---
title: "How NoCharge saves scores without an account"
kind: platform
category: privacy
description: "A plain-language map of NoCharge’s local scores, Beacon Lattice progress, shared mute preference, browser limits, and Clear Game Data control."
published: "2026-08-19"
updated: "2026-08-19"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 6
topics: ["local storage", "scores", "privacy"]
featured: true
draft: false
---

NoCharge has no player accounts or score database. Current games remember a small set of results and preferences through **localStorage**, a browser feature that lets a site retain text values for later visits in the same browser profile.

Local storage is not a NoCharge login, is not synchronized, and should not be described as encrypted or inherently secure.

## What the games store

The current implementation can use these NoCharge game keys:

- `nocharge:memory-match:high` for the Memory Match high result and `nocharge:memory-match:best-moves` for its lowest completed move count.
- `nocharge:word-tile-rush:high` for the best Word Tile Rush score.
- `nocharge:color-flip:high` for Visual mode and `nocharge:color-flip-turn-based:high` for Turn-based mode.
- `nocharge:beacon-lattice:high` for the highest completed-puzzle count written alongside Beacon Lattice progress.
- `nocharge:pref:beacon-lattice-progress` for the current puzzle, completed puzzle IDs, and best solved beacon counts.
- `nocharge:pref:game-muted` for the sound choice shared by all four games.
- `nocharge:pref:recently-played` for at most four stable game IDs and last-played timestamps.

Recently Played does not retain moves, selected cards, typed words, tile paths, scores, or a device identifier. A game enters that list only after a meaningful action inside the mounted game, not after a card or page view.

## What is not uploaded

NoCharge does not send these score and preference values to its own server. There is no account endpoint to receive them. That is why a score on one phone does not appear on a laptop, and why another browser profile on the same computer starts with its own local state.

Optional analytics and Google advertising are separate services with separate choices, described on the [Privacy page](/privacy/). Keeping the analytics consent choice in local storage does not turn game results into analytics. Clear Game Data deliberately leaves that consent record unchanged, and Google Privacy & messaging choices are managed by Google rather than the game-data control.

## Browser limits

A browser can remove local storage when site data is cleared, a profile is reset, storage is restricted, or private-browsing sessions end. Some privacy tools remove it automatically. Storage can also be unavailable because of browser policy or limits. Games continue to work when possible, but the result may not survive a reload.

If a result is missing:

1. Confirm that this is the same device, browser, and browser profile used before.
2. Check whether private browsing or an automatic site-data cleaner is active.
3. Check whether site storage is blocked for `nocharge.net`.
4. Remember that using Clear Game Data or clearing browser/site data intentionally removes the saved values.
5. Try another run after storage is available; there is no server copy to restore.

## Clearing only game data

The [Privacy page](/privacy/) offers **Clear Game Data**. It removes the current score keys, Memory Match best moves, Beacon Lattice progress, shared mute preference, and Recently Played list. It does not call `localStorage.clear()`: unrelated storage on the origin is left alone. NoCharge’s analytics consent remains as chosen, and the control does not claim to erase Google’s separate advertising-consent records.

Browser settings can clear all site data more broadly, but that may also remove privacy choices and other site storage. Use the narrower NoCharge button when the goal is only to reset local play history and preferences.

The practical rule is: treat local results as a convenience on this browser, not as a durable backup. Open [Privacy](/privacy/) to review choices or clear the game-only values.
