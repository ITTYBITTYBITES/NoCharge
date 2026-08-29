import { describe, it, expect } from 'vitest';
import {
  createGame,
  drawFromStock,
  moveWasteToTableau,
  moveWasteToFoundation,
  moveTableau,
  moveTableauToFoundation,
  tapFoundation,
  autoMoveToFoundation,
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
    while (game.stock.length > 0) {
      game = drawFromStock(game);
    }
    expect(game.stock.length).toBe(0);
    expect(game.waste.length).toBeGreaterThan(0);
    const recycled = drawFromStock(game);
    expect(recycled.stock.length).toBeGreaterThan(0);
    expect(recycled.waste.length).toBe(0);
  });

  it('canPlaceOnTableau requires alternating colors descending', () => {
    const queenHearts: Card = { suit: 'hearts', rank: 12, faceUp: true, id: 0 };
    const jackSpades: Card = { suit: 'spades', rank: 11, faceUp: true, id: 1 };
    const jackHearts: Card = { suit: 'hearts', rank: 11, faceUp: true, id: 2 };
    const kingSpades: Card = { suit: 'spades', rank: 13, faceUp: true, id: 3 };

    expect(canPlaceOnTableau(jackSpades, [queenHearts])).toBe(true);
    expect(canPlaceOnTableau(jackHearts, [queenHearts])).toBe(false);
    // King on empty column
    expect(canPlaceOnTableau(kingSpades, [])).toBe(true);
    expect(canPlaceOnTableau(queenHearts, [])).toBe(false);
  });

  it('canPlaceOnFoundation requires same suit ascending from ace', () => {
    expect(canPlaceOnFoundation({ suit: 'spades', rank: 1, faceUp: true, id: 0 }, [])).toBe(true);
    expect(canPlaceOnFoundation({ suit: 'spades', rank: 2, faceUp: true, id: 1 }, [{ suit: 'spades', rank: 1, faceUp: true, id: 0 }])).toBe(true);
    expect(canPlaceOnFoundation({ suit: 'hearts', rank: 2, faceUp: true, id: 2 }, [{ suit: 'spades', rank: 1, faceUp: true, id: 0 }])).toBe(false);
  });

  it('moves waste to tableau and waste to foundation', () => {
    const game = createGame(12345);
    // Setup deterministic waste and tableau
    game.waste = [{ suit: 'spades', rank: 1, faceUp: true, id: 99 }];
    // Move ace of spades to foundation
    const toFoundation = moveWasteToFoundation(game);
    expect(toFoundation).not.toBeNull();
    expect(toFoundation!.foundations[0]!.length).toBe(1);
    expect(toFoundation!.waste.length).toBe(0);

    // Waste to tableau
    const game2 = createGame(12345);
    game2.tableau[0] = [{ suit: 'hearts', rank: 10, faceUp: true, id: 100 }];
    game2.waste = [{ suit: 'spades', rank: 9, faceUp: true, id: 101 }];
    const toTableau = moveWasteToTableau(game2, 0);
    expect(toTableau).not.toBeNull();
    expect(toTableau!.tableau[0]!.length).toBe(2);
    expect(toTableau!.waste.length).toBe(0);
  });

  it('moves tableau card and sequence to another tableau column', () => {
    const game = createGame(12345);
    game.tableau[0] = [{ suit: 'spades', rank: 13, faceUp: true, id: 1 }];
    game.tableau[1] = [
      { suit: 'hearts', rank: 12, faceUp: true, id: 2 },
      { suit: 'spades', rank: 11, faceUp: true, id: 3 },
    ];
    // Move sequence from col 1 to col 0
    const moved = moveTableau(game, 1, 0, 0);
    expect(moved).not.toBeNull();
    expect(moved!.tableau[0]!.length).toBe(3);
    expect(moved!.tableau[1]!.length).toBe(0);
  });

  it('moves tableau card to foundation and detects win when all 52 placed', () => {
    const game = createGame(12345);
    game.tableau[0] = [{ suit: 'spades', rank: 1, faceUp: true, id: 1 }];
    const res = moveTableauToFoundation(game, 0);
    expect(res).not.toBeNull();
    expect(res!.foundations[0]!.length).toBe(1);
    expect(res!.won).toBe(false);

    // Full foundations
    const wonGame = { ...game, foundations: Array.from({ length: 4 }, () => Array.from({ length: 13 }, (_, i) => ({ suit: 'spades' as const, rank: (i + 1) as any, faceUp: true, id: i }))) };
    wonGame.tableau[0] = [{ suit: 'spades', rank: 1, faceUp: true, id: 50 }];
    wonGame.foundations[0] = Array.from({ length: 12 }, (_, i) => ({ suit: 'spades' as const, rank: (i + 1) as any, faceUp: true, id: i }));
    wonGame.tableau[0] = [{ suit: 'spades', rank: 13, faceUp: true, id: 50 }];
    const winResult = moveTableauToFoundation(wonGame, 0);
    expect(winResult?.won).toBe(true);
  });

  it('autoMoveToFoundation automatically places aces and twos', () => {
    const game = createGame(12345);
    game.tableau[0] = [{ suit: 'spades', rank: 1, faceUp: true, id: 1 }];
    game.tableau[1] = [{ suit: 'hearts', rank: 1, faceUp: true, id: 2 }];
    const auto = autoMoveToFoundation(game);
    expect(auto.tableau[0]!.length).toBe(0);
    expect(auto.tableau[1]!.length).toBe(0);
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

describe('Klondike foundation taps', () => {
  it('moves the selected waste card to its suit foundation', () => {
    const game = createGame(12345);
    game.waste = [{ suit: 'hearts', rank: 1, faceUp: true, id: 90 }];
    const next = tapFoundation(game, { type: 'waste' });
    expect(next).not.toBeNull();
    expect(next!.foundations[1]!.length).toBe(1);
    expect(next!.waste.length).toBe(0);
    expect(next!.moves).toBe(1);
  });

  it('moves a selected tableau top card, but never a mid-run card', () => {
    const game = createGame(12345);
    game.tableau[0] = [
      { suit: 'hearts', rank: 5, faceUp: false, id: 1 },
      { suit: 'spades', rank: 1, faceUp: true, id: 2 },
    ];
    // Selecting a covered/mid-run card must not send the top card up instead.
    expect(tapFoundation(game, { type: 'tableau', col: 0, cardIndex: 0 })).toBeNull();
    const next = tapFoundation(game, { type: 'tableau', col: 0, cardIndex: 1 });
    expect(next).not.toBeNull();
    expect(next!.foundations[0]!.length).toBe(1);
    expect(next!.tableau[0]!.length).toBe(1);
  });

  it('is a no-op with nothing selected or when the card cannot go up', () => {
    const game = createGame(12345);
    expect(tapFoundation(game, null)).toBeNull();
    game.waste = [{ suit: 'hearts', rank: 5, faceUp: true, id: 9 }];
    expect(tapFoundation(game, { type: 'waste' })).toBeNull();
    expect(game.waste.length).toBe(1);
  });
});
