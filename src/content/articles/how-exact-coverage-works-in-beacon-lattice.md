---
title: "How exact coverage works in Beacon Lattice"
description: "See how Beacon Lattice treats coverage 0, 1, and 2+, and why a gap or overlap keeps a puzzle unsolved."
game: beacon-lattice
published: "2026-08-19"
updated: "2026-08-19"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 5
topics: ["Beacon Lattice", "coverage", "rules"]
featured: false
draft: false
---

Beacon Lattice does not score speed. It scores whether each required cell is covered **once**. That single rule is what the numbers on the board are for.

Play [Beacon Lattice](/games/beacon-lattice/) and keep the [Beacon Lattice guide](/guides/beacon-lattice/) open if you want the full pattern list.

## Three states, always visible

Every required cell shows a count and a word:

- **0 · Gap** — no beacon covers this cell.
- **1 · Exact** — exactly one beacon covers it.
- **2+ · Overlap** — two or more beacons cover it.

Color may tint a gap, an exact cell, or an overlap, but the number and the word stay on the cell. Study mode is not required to see them.

Blocked cells are different. They show as blocked, they refuse beacons, and they are left out of the solved-state check.

## A worked plus

On **First plus**, five cells form a Cross around the center. Before you place anything, those five cells read `0 · Gap`. Place a Cross on the center. Each of the five cells becomes `1 · Exact`, and the puzzle completes with one beacon, which matches par.

If instead you place that Cross one cell to the left, the center arm still covers some of the plus, but the rightmost required cell stays `0 · Gap` and at least one newly covered neighbor may sit on a blocked cell (which does not count). The board is not solved.

## A worked overlap

On **Twin pluses**, the authored solution uses two Cross beacons whose arms do not touch. Move the second beacon one cell toward the first and their shared neighbor becomes `2 · Overlap`. The opposite arm you abandoned becomes `0 · Gap`. One overlap and one gap appear together more often than not; fixing only the gap by adding a third beacon usually creates another overlap.

## Why unused beacons are allowed

A solved board cares about coverage, not about emptying the inventory. If every required cell is already Exact, leftover Horizontal beacons can stay unused. Later puzzles tighten inventory so that wasting the last Cross leaves an unsolvable plus-shaped gap.

## What the counter records

The beacon count is the number of beacons sitting on the solved board, including locked ones. Invalid clicks do not add to it. Removing a beacon lowers the current count. Only a completed exact cover is stored as a best.

For the habit of finding the next forced cell, continue with [How to find forced beacon placements](/articles/how-to-find-forced-beacon-placements/).
