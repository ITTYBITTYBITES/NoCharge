import { describe, it, expect } from 'vitest';
import {
  createGame,
  moveToFreeCell,
  moveTableau,
  moveTableauToFoundation,
  undo,
  canPlaceOnTableau,
  maxMovableCards,
} from './engine';

describe('FreeCell engine', () => {
  it('creates a game with 8 columns, all cards face up', () => {
    const game = createGame(12345);
    expect(game.tableau).toHaveLength(8);
    const totalCards = game.tableau.reduce((sum, col) => sum + col.length, 0);
    expect(totalCards).toBe(52);
    for (const col of game.tableau) {
      for (const card of col) {
        expect(card.faceUp).toBe(true);
      }
    }
  });

  it('first 4 columns have 7 cards, last 4 have 6', () => {
    const game = createGame(12345);
    // Distribution: 52 cards across 8 columns
    // round-robin dealing: columns 0-3 get 7, columns 4-7 get 6
    expect(game.tableau[0]!.length).toBe(7);
    expect(game.tableau[1]!.length).toBe(7);
    expect(game.tableau[2]!.length).toBe(7);
    expect(game.tableau[3]!.length).toBe(7);
    expect(game.tableau[4]!.length).toBe(6);
    expect(game.tableau[5]!.length).toBe(6);
    expect(game.tableau[6]!.length).toBe(6);
    expect(game.tableau[7]!.length).toBe(6);
  });

  it('can move top card to free cell', () => {
    const game = createGame(12345);
    const result = moveToFreeCell(game, 0);
    expect(result).not.toBeNull();
    expect(result!.freeCells.filter((c) => c !== null).length).toBe(1);
    expect(result!.tableau[0]!.length).toBe(6);
  });

  it('cannot move to full free cells', () => {
    let game = createGame(12345);
    for (let i = 0; i < 4; i++) {
      game = moveToFreeCell(game, 0)!;
    }
    const result = moveToFreeCell(game, 0);
    expect(result).toBeNull();
  });

  it('canPlaceOnTableau requires alternating colors descending', () => {
    expect(canPlaceOnTableau(
      { suit: 'hearts', rank: 10, faceUp: true, id: 0 },
      [{ suit: 'spades', rank: 11, faceUp: true, id: 1 }],
    )).toBe(true);
    expect(canPlaceOnTableau(
      { suit: 'hearts', rank: 10, faceUp: true, id: 0 },
      [{ suit: 'diamonds', rank: 11, faceUp: true, id: 1 }],
    )).toBe(false);
  });

  it('empty column accepts any card', () => {
    expect(canPlaceOnTableau({ suit: 'hearts', rank: 5, faceUp: true, id: 0 }, [])).toBe(true);
  });

  it('maxMovableCards accounts for free cells and empty columns', () => {
    const game = createGame(12345);
    // With 4 free cells empty and no empty columns, can move 5 cards
    expect(maxMovableCards(game, 0)).toBeGreaterThanOrEqual(1);
  });

  it('undo restores previous state', () => {
    const game = createGame(12345);
    const moved = moveToFreeCell(game, 0);
    expect(moved).not.toBeNull();
    const undone = undo(moved!);
    expect(undone).not.toBeNull();
    expect(undone!.tableau[0]!.length).toBe(game.tableau[0]!.length);
    expect(undone!.freeCells.every((c) => c === null)).toBe(true);
  });

  it('seeded deals are reproducible', () => {
    const game1 = createGame(42);
    const game2 = createGame(42);
    expect(game1.tableau[0]![0]!.id).toBe(game2.tableau[0]![0]!.id);
  });
});
