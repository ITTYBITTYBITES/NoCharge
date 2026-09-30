---
title: Barn Road Chronicles
tagline: Unlock the gate, restore the grid, and wake the Apex Atom hidden beneath the barn.
description: >-
  An interactive point-and-click mystery and vehicle restoration prototype set on
  Pine Valley's old Barn Road: inspect clues, crack tumblers, tune the breaker,
  and scrub forty years of rust off Uncle Silas's hidden prototype.
status: prototype
touchControls: false
order: 2
draft: false
controls:
  - label: Point & Tap
    description: Tap glowing teal and amber hotspots to inspect containers, locks, and terminals.
  - label: Drag & Swipe
    description: Swipe padlock dials, drag inventory items to sockets, crank the flywheel clockwise, and swipe down to untie tarp knots.
  - label: Restoration Bay
    description: Switch between Nano-Scrub, Sonic Wave, and Quantum tools, then drag across the vehicle hull to restore it.
---

Barn Road Chronicles — Act 1 is a multi-scene narrative puzzle and restoration
prototype running inside the Lab stage. You arrive at Uncle Silas's locked
homestead at 11:42 PM and work through five connected scenes — Barn Gate, Outer
Barn, Zen Chamber, Restoration Bay, and The Open Road.

## How it plays

Explore each scene by tapping the pulsing hotspot rings:

1. **Barn Gate:** Search the weathered mailbox for the brass magnifying glass
   and the 1958 Pine Valley postcard. Equip the magnifier to inspect the clock
   tower plaque, then dial the four-tumbler padlock to unlock the barn.
2. **Outer Barn:** Search the tool chest, coffee tin, and tractor glovebox to
   recover the cast-iron crank handle, 30A glass fuse, and bakelite radio knob.
   Seat the fuse and knob in the breaker box, tune the spindle into the green
   band to restore hydraulics, and crank the flywheel three full clockwise turns
   to open the floor hatch.
3. **Zen Chamber:** Read Uncle Silas's letter on the desk and swipe down on all
   four tarp knots to reveal the dusty Apex Atom.
4. **Restoration Bay:** Use Nano-Scrub, Sonic Wave, and Quantum paint across the
   hull until restoration reaches 100% and opens the road to Pine Valley.

## What this prototype is testing

- **Layered scene projection.** Background plates, pinned overlays, hotspot
  coordinates, and floating glass UI stay aligned across portrait and landscape
  viewports.
- **Tactile pointer and touch gestures.** Dial swipes, circular flywheel
  cranking, rope-knot downward swipes, and canvas alpha-mask scrubbing run
  alongside the Lab's shared HUD and ad-lifecycle gates.
- **Procedural Web Audio.** Rain, 60 Hz transformer hum, radio static, lock
  clicks, and restoration tool synthesis run through a single mute-aware bus.

## Limits

This is an Act 1 Lab prototype. Progress is stored locally in this browser under
`brc_act1_state` and can be cleared at any time with Reset Demo. It is not
indexed by search engines and is not part of the Quiet Arcade catalog.
