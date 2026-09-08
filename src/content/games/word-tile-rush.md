---
title: Word Tile Rush
tagline: Spell words. Clear the grid.
description: Build words from adjacent letter tiles before the grid fills. Play this fast browser word game with touch, mouse, or keyboard controls.
emoji: 🔤
accent: "#60a5fa"
tier: quick
runtime: word-tile-rush
artwork:
  icon: /game-art/word-tile-rush/icon.svg
  coverSquare: /game-art/word-tile-rush/cover-square.webp
  coverSquareFallback: /game-art/word-tile-rush/cover-square.jpg
  coverLandscape: /game-art/word-tile-rush/cover-landscape.webp
  coverLandscapeFallback: /game-art/word-tile-rush/cover-landscape.jpg
  guideHeader: /game-art/word-tile-rush/guide-header.webp
  guideHeaderFallback: /game-art/word-tile-rush/guide-header.jpg
  socialCard: /game-art/word-tile-rush/social-card.jpg
  socialCardFallback: /game-art/word-tile-rush/social-card.jpg
  socialCardWebp: /game-art/word-tile-rush/social-card.webp
  screenshotMobile: /game-art/word-tile-rush/screenshot-mobile.webp
  screenshotDesktop: /game-art/word-tile-rush/screenshot-desktop.webp
  controlsDiagram: /game-art/word-tile-rush/controls-diagram.svg
  scoringDiagram: /game-art/word-tile-rush/scoring-diagram.svg
  alt: Rising cobalt letter tiles joined by a luminous word path
presentation:
  controlsHeading: Connect adjacent letters, then submit the word.
  controls:
    - label: Touch or pointer
      description: Trace adjacent tiles, including diagonals, and submit words of three or more letters.
    - label: Keyboard
      description: Focus tiles with Tab, select with Enter or Space, then use Submit.
    - label: Timing
      description: The rising-grid timer begins only after your first selected letter.
  controlsDiagramAlt: Three steps show selecting, connecting, and submitting adjacent letter tiles.
  controlsDiagramCaption: Build a continuous path without reusing a tile in the same word.
  secondaryDiagramAlt: A scoring diagram shows that longer valid words earn increasingly higher scores.
  secondaryDiagramCaption: Longer words are worth disproportionately more, so clear space without ignoring strong paths.
  gameplayPreviewAlt: Word Tile Rush running with a six-column letter grid, selected path, score, and submit control.
  gameplayPreviewCaption: The live grid supports the same word path with touch, pointer, or keyboard controls.
  relatedHeading: Learn the scoring system—or choose another run.
  relatedGuideLabel: Word Tile Rush scoring and grid strategy
genre: Word
difficulty: Quick thinking
session: 3–8 min
featured: true
order: 2
---

Word Tile Rush combines connected-letter paths with a rising stack on a six-column, eight-row board. Clearing useful space matters as much as finding a long word.

## Objective and win/loss conditions

Keep removing words before the letters reach the top. There is no fixed winning score. The run ends if a top-row cell is occupied when the next row is due to rise. The rise timer starts with your first selected letter and waits while a word path is actively selected.

## How it plays

Connect at least three adjacent letters. Horizontal, vertical, and diagonal neighbors are allowed, but a tile cannot appear twice in the same word. Backtracking to the previous tile shortens the path. Submit checks the word against the bundled list; a word outside that list is rejected without removing tiles.

An accepted word disappears, the remaining letters in each column fall down, and later rises add letters at the bottom. For example, clearing three letters high in one column can give that column breathing room even if a longer word is available near the bottom.

## Scoring and strategy

An accepted word scores **10 × length²**: three letters earn 90, four earn 160, and five earn 250 points. Two three-letter words total 180, less than one five-letter word, but the shorter paths may clear a dangerous area sooner.

Read diagonal neighbors and check whether a final letter can extend into a common ending before submitting. When the stack is high, prioritize removing top letters over chasing a particular score. No bonus depends on how quickly you drag a path.

## Local save data

`nocharge:word-tile-rush:high` keeps the highest run score in this browser's localStorage. The current grid, selected letters, and submitted-word history are not persisted or uploaded. Reloading starts a new run without erasing the stored best; Clear game data resets that best.
