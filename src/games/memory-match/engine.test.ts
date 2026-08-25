import { describe, it, expect } from 'vitest';
import {
  createMemoryMatchGame,
  flipCard,
  settleMismatch,
  updateBestMoves,
  calculateMemoryMatchScore,
  PAIRS,
  TOTAL_PAIRS,
  type MemoryMatchState,
} from './engine';

describe('Memory Match engine', () => {
  it('creates a fresh game with 16 cards (8 pairs) all face down', () => {
    const game = createMemoryMatchGame();
    expect(game.cards).toHaveLength(16);
    expect(game.moves).toBe(0);
    expect(game.matchedCount).toBe(0);
    expect(game.locked).toBe(false);
    expect(game.isComplete).toBe(false);
    expect(game.cards.every((c) => !c.flipped && !c.matched)).toBe(true);
  });

  it('flips the first card', () => {
    const game = createMemoryMatchGame();
    const res = flipCard(game, 0);
    expect(res.type).toBe('flipped-first');
    expect(game.cards[0]!.flipped).toBe(true);
    expect(game.firstCardId).toBe(0);
    expect(game.moves).toBe(0);
  });

  it('ignores clicks on already flipped or matched cards', () => {
    const game = createMemoryMatchGame();
    flipCard(game, 0);
    expect(flipCard(game, 0).type).toBe('noop');
  });

  it('handles matching pair', () => {
    // Create deterministic game
    const game: MemoryMatchState = {
      cards: [
        { id: 0, symbol: '🔷', flipped: false, matched: false },
        { id: 1, symbol: '🔷', flipped: false, matched: false },
        { id: 2, symbol: '🔶', flipped: false, matched: false },
        { id: 3, symbol: '🔶', flipped: false, matched: false },
      ],
      moves: 0,
      matchedCount: 0,
      firstCardId: null,
      locked: false,
      isComplete: false,
      round: 1,
    };

    flipCard(game, 0);
    const res = flipCard(game, 1);
    expect(res.type).toBe('match');
    expect(game.moves).toBe(1);
    expect(game.matchedCount).toBe(1);
    expect(game.cards[0]!.matched).toBe(true);
    expect(game.cards[1]!.matched).toBe(true);
    expect(game.locked).toBe(false);
    expect(game.isComplete).toBe(false);
  });

  it('handles mismatch and locks board until settled', () => {
    const game: MemoryMatchState = {
      cards: [
        { id: 0, symbol: '🔷', flipped: false, matched: false },
        { id: 1, symbol: '🔶', flipped: false, matched: false },
      ],
      moves: 0,
      matchedCount: 0,
      firstCardId: null,
      locked: false,
      isComplete: false,
      round: 1,
    };

    flipCard(game, 0);
    const res = flipCard(game, 1);
    expect(res.type).toBe('mismatch');
    expect(game.moves).toBe(1);
    expect(game.locked).toBe(true);
    expect(game.cards[0]!.matched).toBe(false);
    expect(game.cards[1]!.matched).toBe(false);

    // Any flip while locked is rejected
    expect(flipCard(game, 0).type).toBe('noop');

    // Settle mismatch
    const settled = settleMismatch(game);
    expect(settled).toBe(true);
    expect(game.locked).toBe(false);
    expect(game.firstCardId).toBeNull();
    expect(game.cards[0]!.flipped).toBe(false);
    expect(game.cards[1]!.flipped).toBe(false);
  });

  it('detects all-pairs completion', () => {
    const game: MemoryMatchState = {
      cards: [
        { id: 0, symbol: '🔷', flipped: false, matched: false },
        { id: 1, symbol: '🔷', flipped: false, matched: false },
      ],
      moves: 0,
      matchedCount: 0,
      firstCardId: null,
      locked: false,
      isComplete: false,
      round: 1,
    };

    flipCard(game, 0);
    const res = flipCard(game, 1);
    expect(res.type).toBe('match');
    expect(game.isComplete).toBe(true);
    if (res.type === 'match') {
      expect(res.isComplete).toBe(true);
    }

    // No flips allowed after completion
    expect(flipCard(game, 0).type).toBe('noop');
  });

  it('tracks move count accurately', () => {
    const game = createMemoryMatchGame();
    expect(game.moves).toBe(0);
    flipCard(game, 0);
    expect(game.moves).toBe(0);
    flipCard(game, 1);
    expect(game.moves).toBe(1);
  });

  it('updates best score correctly (lower is better)', () => {
    expect(updateBestMoves(null, 12)).toBe(12);
    expect(updateBestMoves(14, 10)).toBe(10);
    expect(updateBestMoves(8, 12)).toBe(8);
  });

  it('calculates score formula correctly', () => {
    expect(calculateMemoryMatchScore(8)).toBe(920);
    expect(calculateMemoryMatchScore(20)).toBe(800);
    expect(calculateMemoryMatchScore(150)).toBe(0);
  });

  it('restart creates new state with 0 moves', () => {
    const game = createMemoryMatchGame();
    flipCard(game, 0);
    const fresh = createMemoryMatchGame();
    expect(fresh.moves).toBe(0);
    expect(fresh.cards.every((c) => !c.flipped)).toBe(true);
  });

  it('has 8 standard pair symbols', () => {
    expect(PAIRS).toHaveLength(8);
    expect(TOTAL_PAIRS).toBe(8);
  });
});
