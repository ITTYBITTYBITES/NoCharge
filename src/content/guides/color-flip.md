---
title: "Color Flip Guide: Visual and Turn-Based Modes"
description: Learn the direct visual color controls, checkpoint scoring, timing tips, and how to use the accessible untimed turn-based mode.
game: color-flip
readTime: 4
updated: "2026-08-17"
featured: true
order: 3
---

Color Flip asks you to match the player circle to each tile as it reaches the dashed checkpoint. The path moves automatically in visual mode, but the color choice is direct: choose Green, Blue, Amber, or Rose. A wrong color or a missed path at the checkpoint ends the run.

Every color also has a letter label: **G** for green, **B** for blue, **A** for amber, and **R** for rose. The labels make the match readable without relying on color alone.

## The four color choices

Visual mode provides four native buttons:

1. **G · Green**
2. **B · Blue**
3. **A · Amber**
4. **R · Rose**

Choosing one sets the player circle to that color immediately, regardless of its previous color. Green to Amber takes one Amber selection; Rose to Blue takes one Blue selection. Choosing the color that is already active keeps it selected. The active button includes a check mark and “Selected” text as well as its color.

Turn-based mode still uses the fixed Green → Blue → Amber → Rose cycle. Its Cycle color control is separate from the direct controls described for visual mode.

## Visual mode controls

Choose **Start** to begin the moving path. The color buttons become available while the run is active.

- **Touch or mouse:** choose **G · Green**, **B · Blue**, **A · Amber**, or **R · Rose** directly. Clicking the moving canvas does not select a color.
- **Keyboard shortcuts:** press G, B, A, or R to select the corresponding color while visual mode is running.
- **Keyboard buttons:** use Tab to reach any color button, then Enter or Space to activate it.
- **New:** resets the player circle to Green and returns to the ready state; choose Start for the next run.

The opening tiles are green to give you a brief setup period. You can leave Green selected or explicitly choose **G · Green**; either way, the circle remains Green. After that, colors vary and the path gradually becomes faster.

## Timing tips

### Use the checkpoint line

A tile is checked exactly once, when its center reaches the dashed line through the player. A correct color and path adds one point. A wrong color or missed path ends the run. Moving an evaluated tile off screen does not add another point.

Make the required direct choice before the tile reaches the line. If the player circle already shows the tile’s color, leave it unchanged or choose that same button again. Selecting the active color never advances to another color.

### Read the next tile, then choose once

Look at the closest approaching tile and use its letter to identify the required control. If you are Green and the next tile is Amber, choose **A · Amber** once. There is no need to count through Blue first. After the checkpoint, read the next tile and make the next direct choice.

### Watch the letter as well as the color

At higher speed, the single-letter labels can be quicker to distinguish than the tile fills. Match the tile’s G, B, A, or R with the same labeled control and confirm the current-color label above the playfield.

## Pause, fullscreen, and sound

Pause preserves the exact selected color, tiles, score, and speed. The four direct controls are disabled until the run resumes, and keyboard shortcuts do nothing while paused. Hidden-tab and consent-dialog pauses use the same checkpoint-safe lifecycle, so resuming cannot skip or duplicate an evaluation.

The controls stay with the playfield in fullscreen and immersive mode. Sound remains optional: the visible circle, label, active-button check mark, and tile letters communicate the complete state.

## Turn-based mode

Choose **Turn-based mode** when you prefer an untimed or nonvisual version. The moving canvas and visual-only direct controls are replaced with text that identifies your current color and the next tile.

Use **Cycle color** until the two names match, then choose **Step forward**. A correct step adds one point and announces the next tile. A wrong step ends the run. This mode has its own best score, target generation, and announcements, so its untimed results do not replace visual-mode records.

## Where scores are stored

Visual and turn-based best scores are saved separately in local storage. Neither score is uploaded or attached to an account.
