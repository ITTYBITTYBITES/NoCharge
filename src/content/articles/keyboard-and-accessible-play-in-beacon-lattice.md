---
title: "Keyboard and accessible play in Beacon Lattice"
kind: game
description: "Navigate the Beacon Lattice grid from the keyboard, hear coverage changes, and play without relying on color, sound, or drag."
game: beacon-lattice
published: "2026-08-19"
updated: "2026-08-19"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 5
topics: ["Beacon Lattice", "keyboard", "accessibility"]
featured: false
draft: false
---

Beacon Lattice is built as buttons and text, not a canvas-only toy. That makes the same exact-cover rule available with a keyboard, a screen reader, or a phone tap.

Use [Beacon Lattice](/games/beacon-lattice/) with the [Beacon Lattice guide](/guides/beacon-lattice/) for the pattern diagrams.

## Move, then place

Arrow keys move the active cell. The cursor outline stays visible. Enter or Space places the selected beacon on that cell, or removes a removable beacon if you already occupy it. Delete or Backspace only removes. Escape clears the selected type so a later Enter does not drop the wrong pattern.

Number keys choose types when the puzzle offers them:

1. Cross
2. Diagonal
3. Horizontal
4. Vertical

Those shortcuts do nothing in a text field, on the puzzle selector, or while Ctrl, Alt, or Meta is held.

Tab still reaches every type button, grid cell, undo control, and puzzle selector. Enter and Space activate the focused control, matching the rest of NoCharge.

## What the cell name includes

Each cell’s accessible name states the row and column, the coverage word and number, whether a beacon is present, whether that beacon is locked, and whether the cell is eligible. A typical empty exact cell reads like “Row 2, column 4. Exact coverage: 1. Empty eligible cell.”

Important changes are also spoken through a live region: placements, removals, undo, invalid actions, puzzle changes, and solves.

## Coverage without color or sound

`0 · Gap`, `1 · Exact`, and `2+ · Overlap` are printed on the cell. Distinct geometry marks each beacon type. Sound, when unmuted, is only a short confirmation; you can mute from the shared toolbar and lose no information.

## Pause and restart

Pause freezes the board and disables placement, removal, and undo. Hidden-tab and privacy-dialog pauses use the same lock. Resume does not move beacons or change coverage. Shared **New game** restores the current puzzle’s locked starting beacons and empty undo stack without erasing stored bests.

The same rules hold in fullscreen or immersive mode. The type buttons and grid stay with the playfield; the site banner does not.

If you are still learning which cells are forced, [How to find forced beacon placements](/articles/how-to-find-forced-beacon-placements/) pairs well with keyboard cursor movement.
