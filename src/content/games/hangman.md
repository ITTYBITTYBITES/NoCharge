---
title: Hangman
tagline: Guess the calm word, one letter at a time.
description: Themed Hangman with an on-screen alphabet, keyboard letter entry, and a visible wrong-guess figure. Six misses end the round; there is no timer and every word is common and calm.
emoji: ✎
accent: "#fbbf24"
tier: quick
runtime: hangman
artwork:
  icon: /game-art/hangman/icon.svg
  coverSquare: /game-art/hangman/cover-square.webp
  coverSquareFallback: /game-art/hangman/cover-square.jpg
  coverLandscape: /game-art/hangman/cover-landscape.webp
  coverLandscapeFallback: /game-art/hangman/cover-landscape.jpg
  guideHeader: /game-art/hangman/guide-header.webp
  guideHeaderFallback: /game-art/hangman/guide-header.jpg
  socialCard: /game-art/hangman/social-card.jpg
  socialCardFallback: /game-art/hangman/social-card.jpg
  socialCardWebp: /game-art/hangman/social-card.webp
  alt: A hangman gallows next to five letter boxes with three letters revealed
genre: Word
difficulty: Theme word lists
session: 2–6 min
featured: false
order: 19
presentation:
  controlsHeading: Guess the hidden word before the figure is complete. Six wrong letters end the round.
  controls:
    - label: Guess a letter
      description: Tap or click a letter button, or type any A–Z key. Correct letters appear in the word; wrong letters add to the figure.
    - label: Theme
      description: Nature, Quiet games, Kitchen, or Calm colors change the word list; the theme preference is remembered locally.
    - label: New round
      description: Play again picks a new word from the same theme.
---

Hangman chooses a word from Nature, Quiet games, Kitchen, or Calm colors. The word is hidden, but its length and every revealed occurrence of a guessed letter stay visible throughout the round.

## Objective and win/loss conditions

Reveal every letter before making six wrong guesses. The sixth miss completes the figure, ends the round, and reveals the answer. There is no time limit. Guessing a letter you already tried does not spend another attempt.

## How it plays

Use the alphabet buttons or type a single A–Z letter. A correct guess reveals that letter everywhere it occurs, not just in one position. A letter absent from the word adds one to the wrong-guess count.

For example, if the Kitchen answer is TEAPOT, guessing T reveals both the first and last letters: T _ _ _ _ T. Guessing S would leave the pattern unchanged and add one miss. Selecting another theme starts a new word from that theme rather than continuing the previous answer with a different label.

## Scoring and strategy

The game records won rounds, not points for individual letters. Read the six-miss budget separately from the number of blank positions: one successful letter may fill several blanks.

Try letters that distinguish plausible words in the selected theme, then use the revealed pattern to narrow your next choice. Common vowels and consonants can be useful opening guesses, but a theme word can defeat any fixed guessing order. Already-used letters are marked so you do not need to remember the whole guess history unaided.

## Local save data

`nocharge:hangman:games-solved` counts won rounds and `nocharge:pref:hangman-last-theme` remembers the vocabulary theme. The answer, guessed letters, and current miss count remain in page memory only. Reloading keeps the recorded wins and theme but starts another round; clearing browser game data resets them.
