---
title: How local scores work
description: "How NoCharge scores work: localStorage keys, what they hold, why they never sync, and how to clear them — no account, no server."
published: '2026-08-27'
updated: '2026-08-27'
topic: privacy
readTime: 4
order: 3
faqs:
  - q: 'Do scores leave my device?'
    a: 'No. NoCharge game scores, progress, and preferences are written to the browser''s localStorage and are never uploaded. Analytics are separate and consent-gated.'
  - q: 'Why does my best score disappear in a private window?'
    a: 'Private windows have isolated or ephemeral storage. A different browser, profile, or device will not show scores from another session.'
  - q: 'What is the nocharge: prefix?'
    a: 'Every NoCharge key starts with nocharge: so the browser''s storage inspector can separate NoCharge data from other sites, and so Clear game data can target exactly the right keys.'
---

**Bottom line:** NoCharge scores live in your browser's `localStorage` under keys beginning `nocharge:`. They are never uploaded, never shared between devices, and never attached to an identity. The Privacy page lists every key and its purpose, and "Clear game data" removes exactly those keys.

## The key pattern

Shared plumbing uses two shapes:

- `nocharge:{game}:high` — best higher-is-better score.
- `nocharge:{game}:best-moves` or similar — a per-game metric like fewest moves.
- `nocharge:pref:*` — preferences such as sound, volume, ambient texture, draw mode, and rotation.
- `nocharge:passplay:match:{game}` — one most-recent match record per Pass & Play game.
- `nocharge:recently-played` — up to four game IDs and timestamps for the "Recently Played" row.

Missing, malformed, or non-finite values read back as a safe default (0 for scores), so a corrupted value never breaks a game.

## Why there is no account

An account would require a server profile, which conflicts with the free, private model: no signup walls, no merge screens, no "sync your progress" prompt. Local-first storage means:

- The game never blocks on a network call to show your best.
- Clearing browser data is the complete account deletion story.
- My Arcade is a local dashboard reading the same keys, not a cloud profile.

## Where scores show up

- On the game page, the HUD reads and updates the local best.
- [My Arcade](/my-arcade/) summarizes solved puzzles, wins, and best results already in this browser.
- [Privacy](/privacy/) lists every key and offers the clear control.

## Limits

Local storage is per-origin, per-browser, per-profile, per-device. It is also removable — clearing site data deletes everything, including the daily streaks. NoCharge does not offer export or backup, and does not claim durability.

## Related reading

- [Where high scores go with no login](/articles/where-high-scores-go/)
- [Browser games without accounts](/learn/browser-games-without-accounts/)
- [Registry facts](/articles/registry-facts/)
