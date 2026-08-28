---
title: Simon guide
description: Sequence rules, the 12-pad target, how Calm pattern changes presentation without changing rules, and the local best-length metric.
game: simon
readTime: 4
updated: '2026-08-27'
order: 21
featured: false
---

## Rules

Four pads — circle, triangle, square, star — each with a colour and an icon. A round:

1. Shows a sequence of pads one at a time.
2. Waits for the player to repeat the sequence from the start.
3. Grows by one pad per successful round.
4. Ends on the first wrong pad, or completes at 12 pads.

There is no timer while you decide. The shown sequence is the only information.

## Calm pattern (reduced-motion alternative)

The Calm pattern checkbox changes presentation only:

- **Standard:** pads flash with colour; audio tones play.
- **Calm:** the active pad holds a static (non-flashing) highlight, the sequence is announced by pad name ("Watch: triangle"), and the pause between pads is longer.

The sequence, length, and win condition are identical. Calm pattern is for people who prefer no flashing or who use screen readers; it is not an easier mode.

## Controls

| Action | Pointer / touch | Keyboard | Notes |
|---|---|---|---|
| Start | Start pattern button | Enter on the button | Generates round 1 |
| Repeat | Tap a pad | Tab into pads + Enter / Space | Wrong pad ends the run |
| Calm pattern | Checkbox | Space on the checkbox | Preference saved locally |
| New run | Try again / New game | Toolbar shortcut | Same rules, new sequence |

## What helps

1. **Name the pads aloud as they show.** "Circle, star, triangle" creates a verbal chain that is easier to hold than colour positions.
2. **Chunk in twos and threes.** The moment a wrong pad is not required, the remaining sequence is already familiar — chunking turns a 12-pad run into four 3-pad chunks.
3. **Use Calm pattern when the flash breaks concentration.** Static highlights and longer gaps make the sequence easier to follow without changing its difficulty.

## What NoCharge records

- `nocharge:simon:best-length` — longest sequence fully remembered in this browser.
- `nocharge:pref:simon-calm` — whether Calm pattern is on.

## Accessibility and limits

Each pad is a labeled button (colour + icon + name), the status line announces the expected pad during input, and the result card restates the run length. Colour alone is never the state. NoCharge makes no claim about memory training or cognitive benefit; the target of 12 is an editorial length, and "best remembered" is a local metric, not a score.

## Next step

Play one run with Calm pattern on, then try without it. Memory Match is the other memory title today; both games keep their best results locally and the [untimed collection](/collections/untimed-or-reduced-pressure-browser-games/) lists them together.
