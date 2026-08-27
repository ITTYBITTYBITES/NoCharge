---
title: Simon's Calm pattern, same rules
description: How NoCharge implements a reduced-motion alternative for a flashing sequence game without changing the rules, target length, or difficulty.
kind: game
game: simon
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 3
topics:
  - simon
  - reduced motion
  - accessibility
featured: false
---

Sequence games usually flash a colour. Simon is the classic example — and flashing is exactly the kind of motion some players need to avoid. NoCharge's answer is not a different game; it is a presentation switch inside the same rules.

## What changes

| Aspect | Standard | Calm pattern |
|---|---|---|
| Highlight | Colour flash (short) | Static highlight held longer |
| Announcement | Visual only | Spoken pad names via live status |
| Pause between pads | 380 ms | 520 ms |
| Rules, sequence, target | — | Identical |

The engine stores pad ids, not colours. The UI maps ids to colour + icon + label, so "calm" is a rendering decision the rules never see.

## What does not change

- The sequence is random and the same length in both modes.
- A wrong pad still ends the run; 12 pads still completes it.
- Sound remains optional via the shared shell's mute control.

## Why "reduced motion" is stated precisely

NoCharge does not say Calm pattern is "safer for everyone" or "recommended for photosensitivity" — that would be a medical claim. It says what the mode does: no flashing, no pulsing animation, longer gaps, announced names. The CSS also honors `prefers-reduced-motion` by disabling the press scale transform, independent of the in-game toggle.

## Where the toggle lives

In the game HUD, saved under `nocharge:pref:simon-calm`. The guide documents both modes and the exact pause times; the game page documents the controls. If the values drift from the guide, the catalog review flags it before release.
