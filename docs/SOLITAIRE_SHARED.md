# Shared Solitaire Infrastructure

## Overview

The `src/games/shared/solitaire/` directory provides shared card types, deck management, and a seeded PRNG for Klondike and FreeCell solitaire games.

## Modules

### types.ts
- `Suit`, `Color`, `Rank`, `Card` types
- `suitColor()`, `suitSymbol()`, `rankLabel()`, `cardName()` helpers
- `createDeck()` — creates a standard 52-card deck in order

### deck.ts
- `SeededRng` — xorshift128+ PRNG with documented seed
- `shuffleDeck()` — Fisher–Yates shuffle using seeded RNG
- `shuffledDeck(seed)` — create and shuffle a fresh deck from a seed
- `randomSeed()` — generate a random seed from `Math.random()`

## Design Decisions

- **Standard suits only:** ♠ ♥ ♦ ♣ with no copyrighted characters.
- **Seeded PRNG:** Each deal gets a documented seed so layouts are reproducible. The seed is stored in the game state.
- **No winnability claims:** We never display "X% solvable" or flag deals as winnable/unwinnable.

## Usage

```typescript
import { shuffledDeck, suitSymbol, rankLabel } from '../shared/solitaire';
const deck = shuffledDeck(seed);
```
