---
title: "Word Loom guide"
description: "Rules, daily seeding, non-color feedback states, streak storage, word list, and what Word Loom is not."
game: word-loom
readTime: 5
updated: '2026-08-27'
order: 25
featured: true
---

## Rules

1. The hidden word is five letters and comes from NoCharge's calm word list (200+ common words).
2. Enter any dictionary word from the list — exactly five letters.
3. Each of six guesses gets feedback per tile: ✓ correct position, ~ in the word elsewhere, ✗ absent.
4. Solve in six tries or miss; the run ends either way with no timer.

## Feedback is never color-only

Every tile shows a symbol (`✓ ~ ✗`) and `aria-label` announces "letter, correct/present/absent". Color strengthens the state but is never the only cue — a key difference the guide states because word puzzles often rely on color alone.

## Daily vs practice

- **Daily** seeds the word from the device-local date (`YYYY-MM-DD` at the moment you open the page). Everyone on the same local date gets the same word on NoCharge.
- **Practice** picks a random word from the same list. It writes no streak keys and changes nothing about the daily.

## Duplicate letters, stated exactly

The answer's letter count caps the feedback. If the word has one P and you guess two Ps, only one P can be correct or present; the extra P is absent. The engine test covers this case because it is the most common confusion in word games.

## Streak

`nocharge:daily:word-loom:streak` stores `{ count, lastDate }`. A solve on a consecutive local date increments; a miss or a missed day resets to 1 on the next solve. NoCharge never sends a reminder, never ranks streaks, and never syncs them.

## Word list

Calm, common words only: nature, home, music, and NoCharge vocabulary. It is editorial, not a dictionary; "not in the list" is a list membership message, not a spelling judgment.

## What Word Loom is not

Not a clone of any branded word puzzle: the name, ruleset (semi-transparent-style but with symbol-plus-color feedback and a documented duplicate rule), word list, and art are NoCharge's own. Not a daily "challenge" that pressures return visits. Not a vocabulary trainer; NoCharge makes no learning claim.

## Next step

Play today's loom, then practice a round. The daily slot on the [daily hub](/daily/) is live for this game.
