---
title: Hangman and accessible letter entry on NoCharge
description: How letter buttons, direct keyboard typing, live announcements, and the six-miss figure make Hangman fully keyboard-operable without turning the state into a picture-only puzzle.
kind: game
game: hangman
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 4
topics:
  - hangman
  - accessibility
  - keyboard controls
featured: true
---

Hangman is a classic example of a game whose state can become picture-only: a gallows drawing, a word under construction, and a graveyard of wrong letters. NoCharge's version keeps the drawing but makes every state speakable, and it is honest about what that does and does not solve.

## Two input paths, same loop

- **Pointer/touch:** tap a letter button.
- **Keyboard:** type any letter. The game intercepts A–Z keys, submits the guess, and leaves focus on that letter's button, so a keyboard player never has to navigate a 26-button grid to make a second guess.

The engine accepts only single ASCII letters, then disables repeats — so a double-tap or a stray key cannot waste a miss.

## State is announced, not implied

After every guess:

- The word row updates and is announced via `aria-live`: revealed letters plus blanks (`_ E A`).
- The status line says "Wrong guesses: 2 of 6 (B, C)".
- The figure is `aria-hidden`; the text count is the source of truth.

Correct letters are styled differently from wrong ones, but the difference is also labeled ("in the word" / "not in the word"), so color is never the only cue.

## Why the six-miss limit stays

A guesser with no limit would brute-force the alphabet. Six misses is the countdown, and the figure is simply its visual. What NoCharge removes is time pressure: there is no clock, no per-guess timer, and no score for speed.

## Limits NoCharge states

The word lists are editorial: common, everyday words. They are not a vocabulary curriculum, and NoCharge does not claim Hangman teaches spelling or word recall. The guide's "read the pattern aloud" tip is a heuristic, not an optimal strategy claim.

The definitive guide documents the exact theme lists and the storage keys; the game page documents the controls. If any of those disagree with the running game, the catalog review should catch it before the next release.
