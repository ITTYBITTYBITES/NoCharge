---
title: Word Search
tagline: Find words at your own pace.
description: A calm single-player word search with curated themes, touch selection, and full keyboard controls.
emoji: 🔎
accent: "#38bdf8"
tier: quick
runtime: word-search
artwork:
  icon: /game-art/word-search/icon.svg
  coverSquare: /game-art/word-search/cover-square.webp
  coverSquareFallback: /game-art/word-search/cover-square.jpg
  coverLandscape: /game-art/word-search/cover-landscape.webp
  coverLandscapeFallback: /game-art/word-search/cover-landscape.jpg
  guideHeader: /game-art/word-search/guide-header.webp
  guideHeaderFallback: /game-art/word-search/guide-header.jpg
  socialCard: /game-art/word-search/social-card.jpg
  socialCardFallback: /game-art/word-search/social-card.jpg
  socialCardWebp: /game-art/word-search/social-card.webp
  alt: Letter grid with one word highlighted in the Quiet Arcade palette
genre: Word
difficulty: Gentle
session: 5–15 min
featured: true
order: 16
presentation:
  controlsHeading: Select a straight line from first letter to last.
  controls:
    - label: Touch or pointer
      description: Tap the first letter, then the last letter of a word.
    - label: Keyboard
      description: Arrow keys move the focus cursor; Enter or Space selects a cell.
    - label: Themes
      description: Choose from eight general-audience word lists.
    - label: New puzzle
      description: Start a fresh grid at any time; theme or size changes ask first if you have progress.
---

Word Search is an untimed hunt for listed words on an 8×8 or 10×10 letter grid. Themes change the vocabulary, while the selection rule stays the same: a word must follow one straight line.

## Objective and win/loss conditions

Find every word in the current puzzle's list. A selection that is not a listed word does not cost a life, reduce a score, or end the puzzle. There is no countdown. Starting another puzzle resets found words, with a confirmation when you have already begun selecting or finding words.

## How it plays

Choose the first and last letters of a word by tapping, dragging, or using the keyboard cursor and Enter or Space. Horizontal, vertical, and diagonal lines are valid in either direction; a path that bends is not.

For example, if CLOUD runs diagonally from row 1, column 1 to row 5, column 5, those endpoints select its five letters. A word on the same diagonal can also be selected from the opposite end. Found words stay highlighted. Show word list reveals the words to look for, and Hint marks a starting cell for an unfound word without tracing the whole answer.

## Scoring and strategy

The game counts completed puzzles, not points, speed, or consecutive days. Scan for an uncommon first letter, then inspect all eight directions for its next letter. Long words often have fewer possible placements near an edge, which can make them useful starting points.

Do not count every word you happen to see in the random filler: only words in the puzzle's own list count toward completion. A hint carries no score deduction.

## Local save data

The solved counter uses `nocharge:word-search:puzzles-solved`. The last selected theme is saved through the preference key `nocharge:pref:word-search-last-list` and is reused on a later visit. The generated letters, selected endpoints, and found-word highlights are not a saved puzzle; reload creates a new grid. Browser site-data controls can remove both records.
