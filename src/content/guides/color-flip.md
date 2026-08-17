---
title: "Color Flip Guide: Visual and Turn-Based Modes"
description: Learn the Color Flip sequence, visual controls, scoring, timing tips, and how to use the accessible untimed turn-based mode.
game: color-flip
readTime: 4
updated: "2026-08-17"
featured: true
order: 3
---

Color Flip asks you to match your current color to each tile as it reaches the player’s checkpoint line. The path moves automatically in visual mode, so your only action is choosing when to cycle colors. A wrong color at the checkpoint ends the run.

Every color also has a letter label: **G** for green, **B** for blue, **A** for amber, and **R** for rose. The labels make the match readable without relying on color alone.

## The color sequence

The player always cycles in the same order:

1. Green
2. Blue
3. Amber
4. Rose
5. Back to green

You cannot move backward in the sequence. Look several tiles ahead and count how many changes you need before the player reaches a different color.

## Visual mode controls

Choose **Start** to begin the moving path.

- **Touch or mouse:** tap or click the playfield to cycle once.
- **Keyboard:** focus the playfield and press Space or Enter to cycle once.
- **New:** ends the current attempt and begins a fresh run.

The opening tiles are green to give you a brief setup period. After that, colors vary and the path gradually becomes faster. Each correctly matched tile adds exactly one point when its center crosses the dashed checkpoint line; moving off screen does not add another point.

## Timing tips

### Use the checkpoint line

A tile is checked once, when its center reaches the dashed line through the player. Clicking, tapping, Space, or Enter cycles to the next color; it does not confirm or directly select the displayed color. After a correct match, you can begin cycling immediately for the next tile. Intermediate colors between checkpoints are safe; the required final color must be active when the next tile reaches the line.

### Count the sequence

If you are green and the next tile is amber, you need two changes: green to blue, then blue to amber. Make both changes before amber reaches the checkpoint instead of reacting with several rushed taps at the line.

### Watch the letter as well as the color

At higher speed, the single-letter labels can be quicker to distinguish than the tile fills. Choose whichever cue is clearest for you.

## Turn-based mode

Choose **Turn-based mode** when you prefer an untimed or nonvisual version. The moving canvas is replaced with text that identifies your current color and the next tile.

Use **Cycle color** until the two names match, then choose **Step forward**. A correct step adds one point and announces the next tile. A wrong step ends the run. This mode has its own best score so its untimed results do not replace visual-mode records.

The status message is exposed to screen readers, and every action uses a native button. You can switch back to visual mode at any time.

## Where scores are stored

Visual and turn-based best scores are saved separately in local storage. Neither score is uploaded or attached to an account.
