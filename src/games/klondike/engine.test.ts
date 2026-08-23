import { describe, it, expect } from 'vitest';
import {
  createGame,
  drawFromStock,
  moveWasteToTableau,
  moveTableau,
  moveTableauToFoundation,
  undo,
  canPlaceOnTableau,
  canPlaceOnFoundation,
} from './engine';
import type { Card } from '../shared/solitaire';

describe('Klondike engine', () => {
  it('creates a game with 7 tableau columns', () => {
    const game = createGame(12345);
    expect(game.tableau).toHaveLength(7);
    expect(game.tableau[0]!.length).toBe(1);
    expect(game.tableau[6]!.length).toBe(7);
    // Top cards are face up
    for (const col of game.tableau) {
      expect(col[col.length - 1]!.faceUp).toBe(true);
    }
  });

  it('has 24 cards in stock after deal', () => {
    const game = createGame(12345);
    expect(game.stock.length).toBe(24);
  });

  it('draws from stock to waste', () => {
    const game = createGame(12345);
    const next = drawFromStock(game);
    expect(next.waste.length).toBe(1);
    expect(next.stock.length).toBe(23);
    expect(next.moves).toBe(1);
  });

  it('draw-3 draws three cards at once', () => {
    const game = createGame(12345, 3);
    const next = drawFromStock(game);
    expect(next.waste.length).toBe(3);
    expect(next.stock.length).toBe(21);
  });

  it('recycles waste when stock is empty', () => {
    let game = createGame(12345);
    // Draw all cards
    while (game.stock.length > 0) {
      game = drawFromStock(game);
    }
    expect(game.stock.length).toBe(0);
    expect(game.waste.length).toBeGreaterThan(0);
    // Recycle
    const recycled = drawFromStock(game);
    expect(recycled.stock.length).toBeGreaterThan(0);
    expect(recycled.waste.length).toBe(0);
  });

  it('canPlaceOnTableau requires alternating colors descending', () => {
    const queenHearts: Card = { suit: 'hearts', rank: 12, faceUp: true, id: 0 };
    const jackSpades: Card = { suit: 'spades', rank: 11, faceUp: true, id: 1 };
    const jackHearts: Card = { suit: 'hearts', rank: 11, faceUp: true, id: 2 };

    expect(canPlaceOnTableau(jackSpades, [queenHearts])).toBe(true);
    expect(canPlaceOnTableau(jackHearts, [queenHearts])).toBe(false);
  });

  it('canPlaceOnFoundation requires same suit ascending from ace', () => {
    expect(canPlaceOnFoundation({ suit: 'spades', rank: 1, faceUp: true, id: 0 }, [])).toBe(true);
    expect(canPlaceOnFoundation({ suit: 'spades', rank: 2, faceUp: true, id: 1 }, [{ suit: 'spades', rank: 1, faceUp: true, id: 0 }])).toBe(true);
    expect(canPlaceOnFoundation({ suit: 'hearts', rank: 2, faceUp: true, id: 2 }, [{ suit: 'spades', rank: 1, faceUp: true, id: 0 }])).toBe(false);
  });

  it('undo restores previous state', () => {
    let game = createGame(12345);
    const initial = game;
    game = drawFromStock(game);
    expect(game.moves).toBe(1);
    const undone = undo(game);
    expect(undone).not.toBeNull();
    expect(undone!.moves).toBe(0);
    expect(undone!.stock.length).toBe(initial.stock.length);
    expect(undone!.waste.length).toBe(0);
  });

  it('undo returns null when no history', () => {
    const game = createGame(12345);
    expect(undo(game)).toBeNull();
  });

  it('seeded deals are reproducible', () => {
    const game1 = createGame(42);
    const game2 = createGame(42);
    expect(game1.tableau[0]![0]!.id).toBe(game2.tableau[0]![0]!.id);
    expect(game1.stock[0]!.id).toBe(game2.stock[0]!.id);
  });
});
