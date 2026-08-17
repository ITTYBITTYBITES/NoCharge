---
title: "Understanding the four-color cycle in Color Flip"
description: "Learn the four Color Flip labels, use direct choices in visual mode, and understand the fixed cycle retained in turn-based mode."
game: color-flip
published: "2026-08-15"
updated: "2026-08-17"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 5
topics: ["Color Flip", "color cycle", "controls"]
featured: true
draft: false
---

Color Flip uses four player colors: Green, Blue, Amber, and Rose. Visual mode now presents all four as direct choices, while the untimed turn-based mode retains the fixed Green → Blue → Amber → Rose cycle. In either mode, the goal is to make the player color match the required tile.

[Play Color Flip](/games/color-flip/) to try both input styles, and use the [Color Flip guide](/guides/color-flip/) for the full rules and accessibility details.

## Visual mode offers four direct choices

The visual controls are:

1. **G · Green**
2. **B · Blue**
3. **A · Amber**
4. **R · Rose**

Choosing a button sets that color immediately. The same letters work as direct keyboard shortcuts while visual mode is active, started, and unpaused. Green to Amber requires one Amber choice. Rose to Blue requires one Blue choice. There is no intermediate Blue or Amber state unless you deliberately choose it.

The current choice is communicated with a strong border, a check mark, “Selected” text, the current-color label, and the letter in the player circle. Color is only one of several cues. Choosing the currently selected color is a safe no-op: Green while Green remains Green.

The moving canvas is display-only input-wise. Clicking a colored tile or another part of the canvas does not choose that color. Pointer and touch players use the nearby labeled buttons; keyboard players can use G, B, A, or R, or Tab plus Enter or Space on those native buttons.

## Match at the single checkpoint

Every moving tile displays a color and its first letter. To stay on the path, match the player circle to that tile when its center crosses the dashed checkpoint line. Each tile is evaluated exactly once. A correct crossing adds one point; a wrong color or missed path ends the run; off-screen cleanup adds no score.

If the player is already the required color, leave it unchanged or select the same button again. This is especially clear in the opening Green-on-Green case: the run starts Green, a Green tile approaches, and the unchanged Green circle scores once at the checkpoint.

Focus on the next tile rather than the whole lane. Identify its letter, choose the matching direct control if needed, confirm the selected state, and then read the next target after the crossing. As speed increases, look earlier rather than making extra inputs.

## The fixed order remains in turn-based mode

Turn-based mode has no moving canvas timer. It announces the current player color and next tile, then provides **Cycle color** and **Step forward**. Its cycle is always:

1. **Green**
2. **Blue**
3. **Amber**
4. **Rose**
5. back to **Green**

Each Cycle color activation advances one position in that list. If you are Green and need Amber, cycle twice. If you are Rose and need Green, cycle once. When the names match, choose Step forward. This sequence advice applies to turn-based mode only; visual mode uses direct selection.

A correct turn-based step adds to its separate score and produces a new target. An incorrect color ends that run. The mode keeps its existing target generation, announcements, and locally stored best score.

## Choose the input model that fits

Visual mode combines direct color choice with a moving deadline. It is useful when you want the lane movement and speed progression. Turn-based mode keeps the same four-color match but replaces timing with an explicit step and retains the cycle as part of its untimed decision.

The shared Pause behavior reflects that distinction. A visual pause preserves the exact selected direct color and disables all four choices. A turn-based pause preserves the current and next colors and disables Cycle color and Step forward. Resume does not generate a new target or change a color in either mode.

## Keep sound optional

Color Flip has short interaction sounds, but they are not required. The selected-control text, current label, player letter, and tile letter communicate the necessary state. The shared Mute preference persists in this browser, and fullscreen or immersive mode keeps the controls visible with the playfield.

For the timing side of direct selection, read [Timing a color change near tile boundaries](/articles/timing-a-color-change-near-tile-boundaries/). For a mode-by-mode comparison, read [Visual mode versus turn-based Color Flip](/articles/visual-mode-versus-turn-based-color-flip/). Then [play Color Flip](/games/color-flip/) with one clear choice at a time.
