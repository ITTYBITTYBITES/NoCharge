import { describe, it, expect } from 'vitest';
import {
  createGame,
  placeTile,
  undo,
  clearTile,
  GARDEN_CENTER_CELLS,
  type TileGardenState,
  type Tile,
} from './engine';

function withNext(state: TileGardenState, tile: Tile): TileGardenState {
  return { ...state, nextTile: tile };
}

function place(state: TileGardenState, row: number, col: number, tile: Tile = { tier: 0, species: 0 }) {
  return placeTile(withNext(state, tile), row, col)!;
}

describe('Tile Garden engine', () => {
  it('creates an empty 8x8 grid', () => {
    const game = createGame();
    expect(game.grid.length).toBe(8);
    expect(game.grid[0]!.length).toBe(8);
    expect(game.grid.every((row) => row.every((cell) => cell === null))).toBe(true);
  });

  it('places a tile on an empty cell', () => {
    const result = placeTile(createGame(), 0, 0);
    expect(result).not.toBeNull();
    expect(result!.grid[0]![0]!.tier).toBe(0);
    expect(result!.moves).toBe(1);
  });

  it('cannot place on occupied cell', () => {
    const placed = placeTile(createGame(), 0, 0)!;
    expect(placeTile(placed, 0, 0)).toBeNull();
  });

  it('places the merged tile at the top-left of the 2×2 block', () => {
    let game = createGame();
    game = place(game, 2, 3);
    game = place(game, 2, 4);
    game = place(game, 3, 3);
    game = place(game, 3, 4);
    expect(game.grid[2]![3]).toEqual({ tier: 1, species: 0 });
    expect(game.grid[2]![4]).toBeNull();
    expect(game.grid[3]![3]).toBeNull();
    expect(game.grid[3]![4]).toBeNull();
  });

  it('cascades when four sprouts form after a seed merge', () => {
    let game = createGame();
    game = place(game, 0, 0);
    game = place(game, 0, 1);
    game = place(game, 1, 0);
    game = place(game, 1, 1);
    expect(game.grid[0]![0]?.tier).toBe(1);
    game = place(game, 0, 1, { tier: 1, species: 0 });
    game = place(game, 1, 0, { tier: 1, species: 0 });
    game = place(game, 1, 1, { tier: 1, species: 0 });
    expect(game.grid[0]![0]?.tier).toBe(2);
    expect(game.grid[0]![1]).toBeNull();
    expect(game.grid[1]![0]).toBeNull();
    expect(game.grid[1]![1]).toBeNull();
  });

  it('undo restores the exact pre-merge state', () => {
    let game = createGame();
    game = place(game, 0, 0);
    game = place(game, 0, 1);
    game = place(game, 1, 0);
    const beforeMerge = game;
    game = place(game, 1, 1);
    expect(game.grid[0]![0]?.tier).toBe(1);
    const undone = undo(game)!;
    expect(undone.grid[0]![0]).toEqual(beforeMerge.grid[0]![0]);
    expect(undone.grid[0]![1]).toEqual(beforeMerge.grid[0]![1]);
    expect(undone.grid[1]![0]).toEqual(beforeMerge.grid[1]![0]);
    expect(undone.grid[1]![1]).toBeNull();
    expect(undone.moves).toBe(beforeMerge.moves);
  });

  it('garden mode wins with a flower at each intended center cell', () => {
    for (const { row, col } of GARDEN_CENTER_CELLS) {
      let game = createGame('garden');
      game.grid[row]![col] = { tier: 3, species: 0 };
      const placed = placeTile(withNext(game, { tier: 0, species: 1 }), 0, 0);
      expect(placed?.won, `flower at ${row},${col}`).toBe(true);
    }
  });

  it('does not win when a flower is away from center', () => {
    let game = createGame('garden');
    game.grid[0]![0] = { tier: 2, species: 0 };
    game.grid[0]![1] = { tier: 2, species: 0 };
    game.grid[1]![0] = { tier: 2, species: 0 };
    const result = placeTile(withNext(game, { tier: 2, species: 0 }), 1, 1)!;
    expect(result.grid[0]![0]?.tier).toBe(3);
    expect(result.won).toBe(false);
  });

  it('meadow mode never enters the garden win state', () => {
    let game = createGame('meadow');
    game.grid[3]![3] = { tier: 2, species: 0 };
    game.grid[3]![4] = { tier: 2, species: 0 };
    game.grid[4]![3] = { tier: 2, species: 0 };
    const result = placeTile(withNext(game, { tier: 2, species: 0 }), 4, 4)!;
    expect(result.grid[3]![3]?.tier).toBe(3);
    expect(result.won).toBe(false);
  });

  it('sketch mode does not auto-merge', () => {
    let game = createGame('sketch');
    game = place(game, 0, 0);
    game = place(game, 0, 1);
    game = place(game, 1, 0);
    game = place(game, 1, 1);
    expect(game.grid[0]![0]?.tier).toBe(0);
    expect(game.grid[1]![1]?.tier).toBe(0);
    expect(game.won).toBe(false);
  });

  it('clearTile works in sketch mode', () => {
    let game = createGame('sketch');
    game = placeTile(game, 0, 0)!;
    const cleared = clearTile(game, 0, 0);
    expect(cleared!.grid[0]![0]).toBeNull();
  });

  it('three modes are supported', () => {
    expect(createGame('garden').mode).toBe('garden');
    expect(createGame('meadow').mode).toBe('meadow');
    expect(createGame('sketch').mode).toBe('sketch');
  });
});
