---
title: Hangman guide
description: Rules, theme word lists, letter-by-letter controls, wrong-guess limit, and what NoCharge stores locally.
game: hangman
readTime: 4
updated: '2026-08-27'
order: 19
featured: false
---

## Rules

A word is chosen from the active theme's list. The round shows blank slots for each letter. Guess one letter at a time:

- A correct letter appears in every position it occupies.
- A wrong letter adds one part to the gallows figure.
- Six wrong guesses end the round and reveal the word.
- Revealing every letter before the sixth miss wins the round.

Words are A–Z only (no spaces, hyphens, or apostrophes) so the on-screen alphabet covers every case.

## Themes

| Theme | Example words | Note |
|---|---|---|
| Nature | meadow, harbor, cedar, lagoon | common outdoor words |
| Quiet games | lattice, beacon, handoff, pencil | NoCharge vocabulary |
| Kitchen | skillet, basil, carafe, teapot | everyday kitchen words |
| Calm colors | emerald, indigo, seafoam, ochre | color names as words |

The theme choice is saved under `nocharge:pref:hangman-last-theme` so the next visit starts where you left it.

## Controls

| Action | Pointer / touch | Keyboard | Notes |
|---|---|---|---|
| Guess | Tap a letter button | Type any A–Z key | Focus stays on the guessed letter's button |
| Change theme | Tap a theme button | Tab + Enter | Saved as preference |
| New round | Play again / New game | Toolbar shortcut | Picks a new word |
| Sound | Shared shell | Toolbar | Mute and volume shared across games |

## Strategy that is not about speed

1. **Start with vowels and common consonants** (A, E, I, O, U, then S, T, R, N) — most words in the lists use them, but it is a heuristic, not a guarantee.
2. **Read the revealed pattern aloud.** `_ E _ _ O W` narrows to a handful of common words faster than isolated guesses.
3. **Watch the figure, not the letter count.** Six misses is the real budget; the figure is the countdown.
4. **Switching themes is free.** A word you keep missing in one theme is often easier to find in another.

## What NoCharge records

- `nocharge:hangman:games-solved` — total rounds solved in this browser.
- `nocharge:pref:hangman-last-theme` — last theme.

Nothing about your guesses is stored, and NoCharge never shows a solved-word history.

## Accessibility and limits

Letter buttons are native buttons with labels; the word row is announced with `aria-live` after every guess; the wrong-guess figure is accompanied by a text count ("Wrong guesses: 2 of 6"), so the state is never color-only and never picture-only. Keyboard users type letters directly and the guessed letter's button keeps focus. NoCharge makes no claim about vocabulary learning or memory training; word lists are editorial choices for calm, common words.

## Next step

Play one round with the controls above. Check the [Word games collection](/collections/word-games/) once additional word titles ship.
