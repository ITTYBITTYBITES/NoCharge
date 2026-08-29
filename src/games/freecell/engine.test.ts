import { describe, it, expect } from 'vitest';
import {
  createGame,
  moveToFreeCell,
  moveFreeCellToTableau,
  moveFreeCellToFoundation,
  moveSelectedToFreeCell,
  moveTableau,
  moveTableauToFoundation,
  tapFoundation,
  autoMoveToFoundation,
  undo,
  canPlaceOnTableau,
  canPlaceOnFoundation,
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

  it('moves free cell card to tableau and foundation', () => {
    const game = createGame(12345);
    game.freeCells[0] = { suit: 'spades', rank: 1, faceUp: true, id: 1 };
    const toFoundation = moveFreeCellToFoundation(game, 0);
    expect(toFoundation).not.toBeNull();
    expect(toFoundation!.foundations[0]!.length).toBe(1);
    expect(toFoundation!.freeCells[0]).toBeNull();

    // Free cell to tableau
    const game2 = createGame(12345);
    game2.tableau[0] = [{ suit: 'spades', rank: 10, faceUp: true, id: 2 }];
    game2.freeCells[0] = { suit: 'hearts', rank: 9, faceUp: true, id: 3 };
    const toTableau = moveFreeCellToTableau(game2, 0, 0);
    expect(toTableau).not.toBeNull();
    expect(toTableau!.tableau[0]!.length).toBe(2);
    expect(toTableau!.freeCells[0]).toBeNull();
  });

  it('canPlaceOnTableau requires alternating colors descending', () => {
    expect(
      canPlaceOnTableau(
        { suit: 'hearts', rank: 10, faceUp: true, id: 0 },
        [{ suit: 'spades', rank: 11, faceUp: true, id: 1 }],
      ),
    ).toBe(true);
    expect(
      canPlaceOnTableau(
        { suit: 'hearts', rank: 10, faceUp: true, id: 0 },
        [{ suit: 'diamonds', rank: 11, faceUp: true, id: 1 }],
      ),
    ).toBe(false);
  });

  it('canPlaceOnFoundation requires same suit ascending from Ace', () => {
    expect(canPlaceOnFoundation({ suit: 'hearts', rank: 1, faceUp: true, id: 0 }, [])).toBe(true);
    expect(
      canPlaceOnFoundation(
        { suit: 'hearts', rank: 2, faceUp: true, id: 1 },
        [{ suit: 'hearts', rank: 1, faceUp: true, id: 0 }],
      ),
    ).toBe(true);
    expect(
      canPlaceOnFoundation(
        { suit: 'spades', rank: 2, faceUp: true, id: 2 },
        [{ suit: 'hearts', rank: 1, faceUp: true, id: 0 }],
      ),
    ).toBe(false);
  });

  it('empty column accepts any card', () => {
    expect(canPlaceOnTableau({ suit: 'hearts', rank: 5, faceUp: true, id: 0 }, [])).toBe(true);
  });

  it('maxMovableCards accounts for free cells and empty columns', () => {
    const game = createGame(12345);
    expect(maxMovableCards(game, 0)).toBeGreaterThanOrEqual(1);
    // Formula: (freeCells + 1) * 2^(emptyCols)
    // 4 empty free cells, 0 empty cols -> (4 + 1) * 1 = 5
    expect(maxMovableCards(game, 0)).toBe(5);
  });

  it('moves tableau card and multi-card sequence', () => {
    const game = createGame(12345);
    game.tableau[0] = [{ suit: 'spades', rank: 10, faceUp: true, id: 10 }];
    game.tableau[1] = [
      { suit: 'hearts', rank: 9, faceUp: true, id: 11 },
      { suit: 'spades', rank: 8, faceUp: true, id: 12 },
    ];
    const moved = moveTableau(game, 1, 0, 0);
    expect(moved).not.toBeNull();
    expect(moved!.tableau[0]!.length).toBe(3);
    expect(moved!.tableau[1]!.length).toBe(0);
  });

  it('moves tableau card to foundation and detects win', () => {
    const game = createGame(12345);
    game.tableau[0] = [{ suit: 'spades', rank: 1, faceUp: true, id: 1 }];
    const res = moveTableauToFoundation(game, 0);
    expect(res).not.toBeNull();
    expect(res!.foundations[0]!.length).toBe(1);
    expect(res!.won).toBe(false);
  });

  it('autoMoveToFoundation automatically moves safe cards', () => {
    const game = createGame(12345);
    game.tableau[0] = [{ suit: 'spades', rank: 1, faceUp: true, id: 1 }];
    game.freeCells[0] = { suit: 'hearts', rank: 1, faceUp: true, id: 2 };
    const auto = autoMoveToFoundation(game);
    expect(auto.tableau[0]!.length).toBe(0);
    expect(auto.freeCells[0]).toBeNull();
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

describe('FreeCell taps', () => {
  it('moves a selected free-cell card to its suit foundation', () => {
    const game = createGame(12345);
    game.freeCells[0] = { suit: 'clubs', rank: 1, faceUp: true, id: 90 };
    const next = tapFoundation(game, { type: 'cell', idx: 0 });
    expect(next).not.toBeNull();
    expect(next!.foundations[3]!.length).toBe(1);
    expect(next!.freeCells[0]).toBeNull();
    expect(next!.moves).toBe(1);
  });

  it('moves a selected tableau top card to the foundation, but never a mid-run card', () => {
    const game = createGame(12345);
    game.tableau[0] = [
      { suit: 'hearts', rank: 6, faceUp: true, id: 1 },
      { suit: 'diamonds', rank: 1, faceUp: true, id: 2 },
    ];
    expect(tapFoundation(game, { type: 'tableau', col: 0, cardIndex: 0 })).toBeNull();
    const next = tapFoundation(game, { type: 'tableau', col: 0, cardIndex: 1 });
    expect(next).not.toBeNull();
    expect(next!.foundations[2]!.length).toBe(1);
    expect(next!.tableau[0]!.length).toBe(1);
  });

  it('moveSelectedToFreeCell only takes the selected top card', () => {
    const game = createGame(12345);
    game.tableau[0] = [
      { suit: 'hearts', rank: 6, faceUp: true, id: 1 },
      { suit: 'spades', rank: 5, faceUp: true, id: 2 },
    ];
    // A mid-run selection must not teleport the column's top card into a cell.
    expect(moveSelectedToFreeCell(game, { type: 'tableau', col: 0, cardIndex: 0 })).toBeNull();
    expect(game.tableau[0]!.length).toBe(2);
    const next = moveSelectedToFreeCell(game, { type: 'tableau', col: 0, cardIndex: 1 });
    expect(next).not.toBeNull();
    expect(next!.tableau[0]!.length).toBe(1);
    expect(next!.freeCells[0]).toEqual({ suit: 'spades', rank: 5, faceUp: true, id: 2 });
  });

  it('foundation taps are a no-op with nothing selected', () => {
    const game = createGame(12345);
    expect(tapFoundation(game, null)).toBeNull();
  });
});
