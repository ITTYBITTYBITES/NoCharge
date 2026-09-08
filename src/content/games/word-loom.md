---
title: "Word Loom"
tagline: "Weave the word. Six guesses, one date."
description: "An original five-letter word game with daily (date-seeded) and practice modes. Feedback uses symbols and color, the streak lives only on this device, and there is no account. Not affiliated with any third-party word puzzle."
emoji: "⌘"
accent: "#f97316"
tier: signature
runtime: word-loom
artwork:
  icon: /game-art/word-loom/icon.svg
  coverSquare: /game-art/word-loom/cover-square.webp
  coverSquareFallback: /game-art/word-loom/cover-square.jpg
  coverLandscape: /game-art/word-loom/cover-landscape.webp
  coverLandscapeFallback: /game-art/word-loom/cover-landscape.jpg
  guideHeader: /game-art/word-loom/guide-header.webp
  guideHeaderFallback: /game-art/word-loom/guide-header.jpg
  socialCard: /game-art/word-loom/social-card.jpg
  socialCardFallback: /game-art/word-loom/social-card.jpg
  socialCardWebp: /game-art/word-loom/social-card.webp
  alt: Five letter tiles with one highlighted in orange on a dark Quiet Arcade field
genre: Word
difficulty: Fixed word list
session: 2–5 min
featured: true
order: 25
presentation:
  controlsHeading: "Guess the five-letter word in six tries. ✓ correct · ~ present elsewhere · ✗ absent."
  controls:
    - label: Type
      description: Type five letters in the input and press Enter or Loom it. Only real words from the calm list are accepted.
    - label: Daily vs practice
      description: Daily uses the device-local date; practice picks a random word and never touches the streak.
    - label: Feedback
      description: Each tile shows a symbol and a color. Symbols and spoken labels are the non-color state.
    - label: Streak
      description: On-device only, stored under nocharge:daily:word-loom:streak. Missing a day restarts it.
---

Word Loom is a daily-or-practice word puzzle with six rows of letter feedback. The symbols ✓, ~, and ✗ communicate the result alongside color, so each tile has a readable meaning.

## Objective and win/loss conditions

Submit the hidden five-letter word within six accepted guesses. A correct guess finishes the round; using all six without solving reveals the answer. A guess with the wrong length or outside the game's internal word list is rejected rather than consuming a row. There is no input timer.

## How it plays

A ✓ means the letter is in the correct position. A ~ means it appears elsewhere in the answer. A ✗ means there is no remaining occurrence to assign to that guessed copy. Correct positions are evaluated before misplaced copies, so duplicate letters cannot claim more occurrences than the answer contains.

For example, with APPLE as the answer and PAPER as the guess, the feedback is ~, ~, ✓, ~, ✗. The P in position 3 is correct; the other P is present because APPLE contains a second P. R is absent. Use both position and duplicate-letter information for the next guess.

## Scoring and strategy

There are no letter points. A daily solve records its guess count and updates a device-local streak; Practice counts wins only while the page is open. Daily targets are chosen from the local calendar date, so people in different time zones can be on different dates.

Keep confirmed positions and test plausible placements for present letters. The internal list is a limited vocabulary, not a general spelling dictionary, so a rejected word is not a judgment about whether that word exists in English.

## Local save data

`nocharge:daily:word-loom:streak` stores a count and last solved date. `nocharge:daily:word-loom:solved` stores the latest solved date and number of guesses. Practice does not write those keys. Submitted words, partial rows, and a resumable attempt are not saved; these records are not a synchronized leaderboard or a server-enforced daily result.
