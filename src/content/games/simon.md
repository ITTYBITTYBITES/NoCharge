---
title: Simon
tagline: Watch the pattern. Repeat it. No flashing required.
description: A sequence-memory game with four pads and a 12-step target. Calm pattern replaces flashing colour with static highlights and spoken pad names; there is no timer and the run ends cleanly at the target.
emoji: ◇
accent: "#f472b6"
tier: quick
runtime: simon
artwork:
  icon: /game-art/simon/icon.svg
  coverSquare: /game-art/simon/cover-square.webp
  coverSquareFallback: /game-art/simon/cover-square.jpg
  coverLandscape: /game-art/simon/cover-landscape.webp
  coverLandscapeFallback: /game-art/simon/cover-landscape.jpg
  guideHeader: /game-art/simon/guide-header.webp
  guideHeaderFallback: /game-art/simon/guide-header.jpg
  socialCard: /game-art/simon/social-card.jpg
  socialCardFallback: /game-art/simon/social-card.jpg
  socialCardWebp: /game-art/simon/social-card.webp
  alt: Four rounded pads in the Simon layout with a small pattern center label
genre: Memory
difficulty: Growing sequence
session: 2–5 min
featured: false
order: 21
presentation:
  controlsHeading: Watch the pads light in sequence, then repeat the pattern from the start.
  controls:
    - label: Watch
      description: The pads highlight one at a time. In Calm pattern the same sequence is announced by pad name instead of flashing.
    - label: Repeat
      description: Tap or click the pads in order; keyboard users Tab to the pads and press Enter or Space.
    - label: Calm pattern
      description: A checkbox in the HUD. Static highlights, spoken names, longer gaps — the rules stay identical.
    - label: Target
      description: The run completes at 12 pads. There is no timer while you decide.
---

Simon presents a growing sequence using four named pads: circle, triangle, square, and star. You repeat the whole pattern after each playback, rather than pressing only its newest addition.

## Objective and win/loss conditions

Repeat sequences correctly until you complete the 12-pad target. The first wrong pad ends the run. During your input turn there is no deadline for deciding which pad to press; playback timing is separate from the guessing rules.

## How it plays

Start pattern shows the first pad. After a successful repetition, one random pad is appended and the longer sequence plays from its beginning. Repeated pads are possible.

If one round shows circle, star, triangle, your response must be circle, star, triangle in that order. If the next round adds another star, you repeat all four pads, not just star. Input during playback is not a substitute for waiting for your turn.

Calm pattern changes the presentation to slower, longer-held highlights and named cues. It does not shorten the pattern, remove repeated pads, or change the target of 12.

## Scoring and strategy

Best remembered measures the longest sequence you fully completed. Remembering the first three pads of a failed four-pad round does not count as completing four. There is no bonus for rapid responses.

Try grouping a longer pattern into short named chunks. A repeated pair such as star, star can be remembered as a pair without losing its two required presses. Choose the presentation you find easier to follow, and keep using the pad names when color alone is not useful.

## Local save data

`nocharge:simon:best-length` stores the longest completed sequence, and `nocharge:pref:simon-calm` remembers Calm pattern. Neither the current generated sequence nor your partial response is a saved session. Closing the page ends that run, while the best-length record remains in the same browser until cleared.
