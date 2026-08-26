---
title: "FreeCell on NoCharge: Planning with Free Cells"
description: How NoCharge's FreeCell Solitaire uses visible information, multi-card moves, and the absence of timers to support deliberate planning.
kind: game
game: freecell
published: "2026-08-22"
updated: "2026-08-22"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 4
topics: ["FreeCell", "solitaire", "Quiet Arcade", "card games"]
featured: true
draft: false
---

> **Bottom line:** How NoCharge's FreeCell Solitaire uses visible information, multi-card moves, and the absence of timers to support deliberate planning.

FreeCell is the solitaire game where you can see everything from the start. All 52 cards are dealt face-up into eight columns. Four free cells provide temporary storage. Four foundations wait for aces.

The challenge is not hidden information — it is sequencing.

## What makes FreeCell different from Klondike

In Klondike, face-down cards create uncertainty. You make moves partly to reveal information. In FreeCell, every card is visible, so the challenge shifts from discovery to planning. You can see the blocking cards, the buried aces, and the sequences that need to unravel.

This makes FreeCell feel more like a logic puzzle than a card game, even though the mechanics are similar to Klondike.

## Free cells as a planning tool

Each free cell holds one card. Moving a card to a free cell is always legal (when one is empty). The constraint is capacity: each occupied cell reduces the number of cards you can move as a group.

The multi-card move formula is **(empty free cells + 1) × 2^(empty columns)**. With all four cells empty and one empty column, you can move up to 10 cards. With no cells and no empty columns, you can move only one.

This means free cells are not just storage — they are a resource that controls your mobility. Spending a free cell to park a blocking card is sometimes the right move, but it comes at a cost.

## How NoCharge handles the game

No timer. No score. No winnability claim. Undo and restart are always available.

We track one local metric: games won. This is stored at `nocharge:freecell:games-won` and can be cleared from the My Arcade page.

Auto-move sends only cards that are provably safe (aces always, other ranks when opposite-color foundations are sufficiently advanced). This prevents the common FreeCell mistake of stranding a card on a foundation that later needs it on the tableau.

## Planning ahead

Because every card is visible, you can scan the entire layout before making a move. Look for:

- **Buried aces:** these need to reach foundations early. What blocks them?
- **Long descending sequences:** these can be moved as groups if you have enough free space.
- **Empty columns:** these double your multi-card move capacity. Can you clear one early?

The game does not evaluate your plan or tell you whether a move is good. It presents the layout and lets you decide.

