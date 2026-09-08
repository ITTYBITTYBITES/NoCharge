---
title: Beacon Lattice
tagline: Cover every cell. Overlap nothing.
description: Place labeled beacons so every required cell is covered exactly once. Play this quiet logic puzzle with touch, pointer, or keyboard. Best results stay on your device.
emoji: "◇"
accent: "#2dd4bf"
tier: signature
runtime: beacon-lattice
artwork:
  icon: /game-art/beacon-lattice/icon.svg
  coverSquare: /game-art/beacon-lattice/cover-square.webp
  coverSquareFallback: /game-art/beacon-lattice/cover-square.jpg
  coverLandscape: /game-art/beacon-lattice/cover-landscape.webp
  coverLandscapeFallback: /game-art/beacon-lattice/cover-landscape.jpg
  guideHeader: /game-art/beacon-lattice/guide-header.webp
  guideHeaderFallback: /game-art/beacon-lattice/guide-header.jpg
  socialCard: /game-art/beacon-lattice/social-card.jpg
  socialCardFallback: /game-art/beacon-lattice/social-card.jpg
  socialCardWebp: /game-art/beacon-lattice/social-card.webp
  screenshotMobile: /game-art/beacon-lattice/screenshot-mobile.webp
  screenshotDesktop: /game-art/beacon-lattice/screenshot-desktop.webp
  controlsDiagram: /game-art/beacon-lattice/controls-diagram.svg
  rulesDiagram: /game-art/beacon-lattice/coverage-diagram.svg
  alt: A dark lattice with four thin cyan beacon marks and numbered coverage counts
presentation:
  controlsHeading: Choose a beacon, then cover the lattice exactly once.
  controls:
    - label: Touch or pointer
      description: Select a beacon type, then select an eligible cell to place it. Select a placed beacon to remove it.
    - label: Keyboard
      description: Arrow keys move the cell cursor. 1–4 choose a type. Enter or Space places. Delete removes. U undoes.
    - label: Coverage
      description: Every required cell shows 0 · Gap, 1 · Exact, or 2+ · Overlap. Color is only a secondary cue.
  stageAspectDesktop: 1.05
  stageAspectMobile: 0.92
  controlsDiagramAlt: Three steps show choosing a beacon type, placing it on the grid, and reading the coverage count on each cell.
  controlsDiagramCaption: Select a type, place or remove it on a cell, then read the numeric coverage state.
  secondaryDiagramAlt: A Cross, Diagonal, Horizontal, and Vertical beacon are shown with the cells each pattern covers.
  secondaryDiagramCaption: Off-board and void cells are skipped. Blocked obstacles, introduced later, also skip coverage without stopping the rest of a pattern.
  gameplayPreviewAlt: Beacon Lattice on desktop with a five-by-five grid, coverage counts, and four beacon type controls.
  gameplayPreviewCaption: Coverage numbers stay visible on every required cell during play.
  relatedHeading: Study the coverage rules—or try another game.
  relatedGuideLabel: Beacon Lattice exact-coverage guide
genre: Logic
difficulty: Thoughtful
session: 3–8 min
featured: true
order: 4
---

Beacon Lattice is an untimed exact-coverage puzzle built from shaped grids, four beacon patterns, and limited inventories. The coverage numbers explain why a placement helps or conflicts.

## Objective and win/loss conditions

Every required cell must have coverage exactly 1. A 0 is a gap; 2 or more means overlapping coverage. Trying an overlap does not lose a life or end the puzzle: remove a beacon or undo and keep working. Void cells outside the lattice and blocked obstacles do not need coverage and cannot hold a beacon.

## How it plays

A Cross covers its own cell and its four orthogonal neighbors. A Diagonal covers its center and four diagonal neighbors. Horizontal and Vertical beacons cover their center plus the two neighbors along the named axis. Offsets outside the eligible lattice are skipped, so an edge placement can cover fewer cells than an interior placement.

On the opening First plus puzzle, placing a Cross at row 3, column 3 covers all five required cells exactly once. Adding coverage to one of those cells would make it an overlap, not a better solution. Later puzzles introduce restricted placement cells, locked beacons, and larger boards. Locked beacons cannot be removed.

## Scoring and strategy

The completed result is the number of beacons on the solved board; fewer is better for that puzzle. Par is the count in its authored solution, not a universal proof of optimality. Unused inventory is allowed.

Start with isolated cells that have only one possible covering pattern. Check each proposed beacon's entire footprint before placing it: filling one gap is not useful if the same beacon doubles coverage elsewhere. Undo carries no permanent score penalty.

## Local save data

`nocharge:pref:beacon-lattice-progress` stores the selected puzzle ID, completed IDs, best beacon counts, and each puzzle's last solved count. The shared `nocharge:beacon-lattice:high` value records completed-puzzle count. Partial beacon placements are not a saved board. All progress is browser-local and can be removed through Clear game data.
