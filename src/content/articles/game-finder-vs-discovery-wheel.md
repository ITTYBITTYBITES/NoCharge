---
title: Game Finder vs Discovery Wheel — two ways to filter the same catalog
description: Both tools read the same game-catalog facts. The quiz asks five directed questions; the wheel exposes the raw filters. Which to use when, and what neither does.
kind: platform
category: trust
published: '2026-08-27'
updated: '2026-08-27'
author: NoCharge Editorial
reviewer: NoCharge Editorial
readTime: 4
topics:
  - tools
  - comparison
  - discovery
featured: true
---

**Bottom line:** The Game Finder asks five questions (time, players, pace, input, kind) and returns an alphabetical shortlist. The Discovery Wheel exposes the same filters directly and lets you rotate through matches. Same facts, different entry points; neither ranks quality.

## What each tool reads

Both read `src/lib/game-catalog.ts` — the same structured facts that drive the Arcade chips, session planner, and registry-facts page. There are no second hand lists.

## Which to use

- **Game Finder** when you want a short conversation with the catalog: "I have 5 minutes, alone, keyboard, want a logic thing."
- **Discovery Wheel** when you want control: set time ceiling, input, pressure, players, and press "Show another match" to cycle.
- **Neither** for "best game": both tools sort alphabetically or by catalog order, and no tool produces a ranking.

## What the tools do not do

- No difficulty rating of games or puzzles.
- No recommendation engine, no behavioral tracking, no "because you played X".
- No persistence of your answers: both run in the page and store nothing.

## Table

| | Game Finder | Discovery Wheel |
|---|---|---|
| Input | 5 multiple-choice questions | 4 selects + sort |
| Output | Full matching list, alphabetical | Up to 3 matches, cycled |
| Result order | Alphabetical | Catalog order, not a ranking |
| Time filter | Ceiling options | 2/5/15 min ceilings |
| Kind filter | Logic/word/cards/board/memory | No kind filter |
| Shares catalog facts | Yes | Yes |

## Next step

Answer the [Game Finder](/tools/game-finder/) once to see the shortlist, then use the [Discovery Wheel](/tools/discovery-wheel/) to iterate on the same facts.
