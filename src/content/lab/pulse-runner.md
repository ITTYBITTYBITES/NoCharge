---
title: Pulse Runner
tagline: Dodge the descending pulses for as long as you can hold the line.
description: >-
  A one-thumb survival prototype built to prove out the Lab render loop: fixed
  timestep, letterboxed canvas, and a frame counter you can actually read.
status: prototype
touchControls: true
order: 1
draft: false
controls:
  - label: Keyboard
    description: Left and right arrows, or A and D, to steer.
  - label: Touch
    description: Hold the left or right side of the lower band to steer.
  - label: Restart
    description: Use the restart button on the game-over panel, or New game in the settings menu.
---

Pulse Runner exists to answer one question: does the Lab runtime hold sixty
frames a second on a phone? It is the first prototype wired to the fixed-timestep
loop in `src/lab/loop/`, the DPR-aware canvas stage, and the HUD frame counter.
The gameplay is deliberately simple so that any frame drop is the platform's
fault and not the game's.

## How it plays

You steer a single craft along the bottom of the stage. Pulses fall from the top.
Touch one and the run ends. Score is survival time, counted in tenths of a
second, and it is stored only in this browser.

The playfield is letterboxed to a fixed aspect ratio, so the difficulty curve is
identical on a 375 pixel phone and a 2560 pixel monitor. The bars above and below
the playfield are painted with the stage background, which is why the seam is
invisible.

## What this prototype is testing

- **Frame pacing.** The HUD counter is smoothed, not instantaneous, because a
  number changing sixty times a second is unreadable and writing to the DOM that
  often costs the frames it is trying to measure.
- **Pause correctness.** Backgrounding the tab, opening the privacy dialog, or
  starting an ad all pause the loop through the shared shell. Resuming must not
  replay the paused interval as one enormous frame.
- **Input under load.** The input gate swallows keyboard, pointer, and touch in
  the capture phase while an ad is on screen, so a stray tap cannot kill the run
  behind the advert.

## Limits

This is a prototype, not a finished game. It has no settings screen, no ambient
audio, no difficulty options, and no saved progression beyond a browser-local
score. It is not indexed by search engines and it is not part of the Quiet
Arcade catalog. It may change or disappear without notice.
