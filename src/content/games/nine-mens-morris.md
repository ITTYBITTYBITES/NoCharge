---
title: Nine Men's Morris
tagline: Three in a line. Remove a stone. Outmaneuver.
description: "The classic 24-point mill game for two players on one device: place nine stones, form mills to remove opponent stones, then fly with your last three. No account, no AI, no timer."
emoji: ✚
accent: "#f87171"
tier: signature
runtime: nine-mens-morris
artwork:
  icon: /game-art/nine-mens-morris/icon.svg
  coverSquare: /game-art/nine-mens-morris/cover-square.webp
  coverSquareFallback: /game-art/nine-mens-morris/cover-square.jpg
  coverLandscape: /game-art/nine-mens-morris/cover-landscape.webp
  coverLandscapeFallback: /game-art/nine-mens-morris/cover-landscape.jpg
  guideHeader: /game-art/nine-mens-morris/guide-header.webp
  guideHeaderFallback: /game-art/nine-mens-morris/guide-header.jpg
  socialCard: /game-art/nine-mens-morris/social-card.jpg
  socialCardFallback: /game-art/nine-mens-morris/social-card.jpg
  socialCardWebp: /game-art/nine-mens-morris/social-card.webp
  alt: Three concentric squares with corner and midpoint stones in the mill board layout
genre: Board game
difficulty: Placement + movement
session: 8–25 min
featured: false
order: 24
presentation:
  controlsHeading: Place nine stones, form mills to remove opponent stones, then move or fly to the last three.
  controls:
    - label: Place
      description: During placement, tap any empty point; arrow keys move a roving cursor and Enter places.
    - label: Mill
      description: Three of your stones in a line form a mill — remove one opponent stone. A stone already in a mill is protected unless nothing else is available.
    - label: Move / Fly
      description: Once every stone is placed, tap your stone then a legal destination. With three stones left you fly to any empty point.
    - label: Handoff
      description: The shared handoff screen names the next player between turns; the open board stays visible.
---

Nine Men's Morris uses nine stones per player on a 24-point board of three nested squares. Placement, movement, and stone removal are distinct actions, and the current phase determines which buttons can make a move.

## Objective and win/loss conditions

Form mills to remove opposing stones or leave the other player unable to move. In this edition, a removal ends the game immediately when fewer than three opponent stones remain on the board; that count is checked during placement as well as movement. A blocked player in the movement phase also loses. There is no timer or automatic repetition-draw counter.

## How it plays

Start by placing stones on empty points. During movement, select one of your stones and choose an adjacent empty point along a connecting line. With three stones remaining, you may fly to any empty point.

A recognized mill lets you remove one opposing stone before the turn passes. For example, occupying outer-ring markers A, B, and C completes the top side. Opponent stones outside mills must be removed first; mill stones are available only when all remaining opponent stones are in mills.

The current implementation recognizes the three points along each side of a square as mill lines. Cross-ring connectors allow movement but are not additional mill triples in this edition. These boundaries matter if you are familiar with another Morris ruleset.

## Scoring and strategy

Mills earn removals, not numerical points. Watch both an opponent's unfinished lines and your own mobility: a stone that completes a mill may also block a route you need later. Keeping a removable stone outside your existing mills changes which capture choices your opponent receives. The status message distinguishes selecting a stone, moving it, and making the required removal.

## Local save data

`nocharge:passplay:match:nine-mens-morris` keeps the latest mode, winner, and finish date. The shared 0–0 score fields are not stone counts. Positions, stones in hand, pending removals, and names are not a saved game. The record is local to this browser and is replaced by the next completed result.
