---
title: "Nonogram on NoCharge: Clues and Accessibility"
description: How NoCharge's Nonogram handles clue display, the accessibility text view, and why there is no fail state or timer.
kind: game
game: nonogram
published: "2026-08-22"
updated: "2026-08-22"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 4
topics: ["Nonogram", "Picross", "Quiet Arcade", "logic puzzles", "accessibility"]
featured: true
draft: false
---

> **Bottom line:** How NoCharge's Nonogram handles clue display, the accessibility text view, and why there is no fail state or timer.

Nonogram — also called Picross, griddlers, or picture crosswords — is a logic puzzle where row and column clues describe a hidden picture. NoCharge's version offers 24 curated puzzles across two sizes with a built-in accessibility text view.

## How clues work

Each row and column has a sequence of numbers. "3 2" means three consecutive filled cells, at least one gap, then two consecutive filled cells. A clue of "0" means the entire line is empty.

The clues appear alongside the grid — row clues to the left, column clues above. As you mark cells, satisfied clues dim to indicate completion.

## The accessibility text view

Not everyone reads visual clue labels easily. Small numbers beside a grid can be hard to parse on a phone screen, and screen readers cannot reliably read positioned labels.

The "Show clues as text" button reveals a complete text listing:

- **Row 1:** 3, 2
- **Row 2:** 1, 1, 1
- **Column 1:** 2, 1
- ...

This listing stays visible while you solve and updates as clues are satisfied. It works with screen readers, with zoom, and with any text-to-speech tool.

## No fail state

In some nonogram implementations, marking a cell incorrectly triggers a penalty — a time loss, a life, or a "wrong!" animation. NoCharge's version has no fail state. Mark any cell as filled, empty, or unknown at any time. Undo reverses the last action.

The puzzle is solved when every cell matches the hidden picture. There is no time pressure, no streak, and no scoring beyond a personal puzzle count.

## Puzzle curation

Every puzzle in the library has been validated to have a unique solution. This means there is exactly one way to fill the grid that satisfies all clues. No guessing is required — every cell can be determined by logic.

The 24 puzzles span two sizes (12 at 5×5, 12 at 10×10) and four themes: animals, food, shapes, and simple objects. They are designed for a general audience.

## What the game tracks

One metric: `nocharge:nonogram:puzzles-revealed`, a count of completed puzzles. This is a personal record stored in your browser's local storage.

