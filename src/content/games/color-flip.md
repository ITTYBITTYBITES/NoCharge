---
title: Color Flip
tagline: Pick a color. Step carefully. Take your time.
description: A calm tile puzzle where you pick a color and step through matching tiles. No timer, no reflex pressure. Turn-based mode also available.
emoji: 🎨
accent: "#f59e0b"
tier: quick
runtime: color-flip
artwork:
  icon: /game-art/color-flip/icon.svg
  coverSquare: /game-art/color-flip/cover-square.webp
  coverSquareFallback: /game-art/color-flip/cover-square.jpg
  coverLandscape: /game-art/color-flip/cover-landscape.webp
  coverLandscapeFallback: /game-art/color-flip/cover-landscape.jpg
  guideHeader: /game-art/color-flip/guide-header.webp
  guideHeaderFallback: /game-art/color-flip/guide-header.jpg
  socialCard: /game-art/color-flip/social-card.jpg
  socialCardFallback: /game-art/color-flip/social-card.jpg
  socialCardWebp: /game-art/color-flip/social-card.webp
  screenshotMobile: /game-art/color-flip/screenshot-mobile.webp
  screenshotDesktop: /game-art/color-flip/screenshot-desktop.webp
  controlsDiagram: /game-art/color-flip/controls-diagram.svg
  modesDiagram: /game-art/color-flip/modes-diagram.svg
  alt: An amber-led path of green, blue, amber, and rose labeled tiles
presentation:
  controlsHeading: Pick a color, then tap adjacent tiles to step.
  controls:
    - label: Visual mode
      description: Pick one color at round start, then tap adjacent tiles to step. Matching color scores.
    - label: Color rotation
      description: Toggle between Never, Every 10 steps, or Every 5 steps for color changes during play.
    - label: Turn-based mode
      description: Use Cycle color and Step forward with no timing requirement.
  controlsDiagramAlt: A player circle on a 5×5 tile grid with adjacent tiles highlighted for stepping.
  controlsDiagramCaption: Tap any adjacent tile to step. Matching your color scores a point.
  secondaryDiagramAlt: Visual tap-to-step mode and untimed turn-based mode are shown side by side.
  secondaryDiagramCaption: Turn-based mode keeps its fixed Cycle color and Step forward controls.
  gameplayPreviewAlt: Color Flip displays a labeled four-color tile grid with stepping controls.
  gameplayPreviewCaption: Visual mode uses tap-to-step with color rotation options; turn-based mode keeps its untimed cycle control.
  relatedHeading: Compare both modes—or try another game.
  relatedGuideLabel: Color Flip visual and turn-based guide
genre: Tile puzzle
difficulty: Easy to learn
session: 1–4 min
featured: true
order: 3
---

Color Flip offers a spatial tap-to-step board and a separate turn-based color-matching mode. Both use letters alongside color: G for green, B for blue, A for amber, and R for rose.

## Objective and win/loss conditions

Build a run of correct-color steps. A matching destination adds a point; stepping onto a different color ends the round. There is no target score to finish and no countdown in either mode. The visual board also offers a one-step undo for reconsidering the last move.

## How it plays

In visual mode, choose your color at the start, then move one tile up, down, left, or right. Diagonal moves are not allowed. The 5×5 viewport shifts after a step to keep the player centered and brings new tiles into view.

With rotation set to Never, your chosen color stays fixed. Every 5 steps or Every 10 steps rotates it through Green → Blue → Amber → Rose. For example, with Every 5 steps enabled, your fifth successful green step scores before your color becomes blue; inspect the blue destinations before moving again.

Turn-based mode instead announces one upcoming tile. Use Cycle color until the player matches it, then Step forward. It does not use the spatial grid.

## Scoring and strategy

One correct step equals one point, with separate bests for the two modes. In visual play, inspect the next adjacent options rather than assuming every direction remains available after the grid shifts. Near a rotation boundary, plan for the next color as well as the current one. In turn-based play, compare the named current color and next tile before stepping.

## Local save data

localStorage holds the visual best at `nocharge:color-flip:high`, the turn-based best at `nocharge:color-flip-turn-based:high`, and the rotation choice at `nocharge:pref:color-flip-rotation`. It does not restore the current grid or an unfinished run. These records are specific to the browser where you played.
