---
title: "How to find forced beacon placements"
kind: game
description: "Use edges, single-source cells, inventory limits, and restricted slots to place Beacon Lattice beacons without guessing."
game: beacon-lattice
published: "2026-08-19"
updated: "2026-08-19"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 6
topics: ["Beacon Lattice", "strategy", "forced cells"]
featured: true
draft: false
---

> **Bottom line:** Use edges, single-source cells, inventory limits, and restricted slots to place Beacon Lattice beacons without guessing.

Most Beacon Lattice mistakes come from placing a convenient beacon before the board has told you where it must go. Forced cells shrink that guesswork.

The live board is in [Beacon Lattice](/games/beacon-lattice/). Pattern details live in the [Beacon Lattice guide](/guides/beacon-lattice/).

## Start at the edge

A corner required cell can be covered in only a few ways. A Cross on that corner covers the corner plus the two in-board arms. A Diagonal on an adjacent interior cell can also reach it. If the puzzle offers only Cross, the corner often forces the beacon onto the corner itself or onto the unique neighbor whose plus includes it.

**Edge quartet** is built on that idea: the four rim pluses do not meet in the center, so each edge-center cell is the only legal Cross that covers its plus.

## Find cells with one legal source

After the first forced placement, re-read every `0 · Gap`. Ask which remaining beacons can still reach that cell. If the answer is one type on one origin, place it. Inventory makes this sharper: **Limited cross** allows a Cross on only one of its three legal cells. The plus-shaped gap cannot be a diamond, so that Cross is spent there.

## Let inventory veto a tempting overlap

On **Tight inventory** you have one Cross, one Horizontal, and one Vertical. Covering a bar-shaped gap with the Cross wastes the only piece that can finish a plus later. Place the unique plus first, then drop the bars on the leftover three-cell runs.

## Restricted slots are already the candidate list

When a puzzle names allowed cells, ignore the rest of the grid as origins. **Restricted corners** can host beacons only on the four inner corners. You still cover cells outside those corners—the patterns reach outward—but you never click a rim cell to place.

Typed slots go one step further. If a cell accepts only Cross, do not spend a Horizontal there even if a bar would look tidy.

## Avoid overlap chains

An overlap is not a temporary scaffold. Because exact cover forbids a second source, “covering an overlap with a third beacon” cannot repair it. Undo, then place the later beacon where its pattern sits entirely on remaining gaps.

Locked beacons are forced for you. On **Locked plus** and **Seven lock**, treat the locked pattern as already painted Exact and build only in the leftover gaps.

When you want the same reasoning without a pointer, read [Keyboard and accessible play in Beacon Lattice](/articles/keyboard-and-accessible-play-in-beacon-lattice/).

