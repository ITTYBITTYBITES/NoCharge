import { describe, it, expect } from 'vitest';
import { createGame, move, undo, isGameOver } from './engine';

describe('2048 engine', () => {
  it('creates a game with 2 starting tiles', () => {
    const game = createGame();
    let tileCount = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (game.grid[r]![c] !== 0) tileCount++;
      }
    }
    expect(tileCount).toBe(2);
  });

  it('starting tiles are 2 or 4', () => {
    const game = createGame();
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = game.grid[r]![c];
        if (val !== 0) {
          expect(val === 2 || val === 4).toBe(true);
        }
      }
    }
  });

  it('move returns null when nothing changes', () => {
    const game = createGame();
    // Create a grid where left move does nothing
    const stuck = { ...game, grid: [[2, 4, 8, 16], [2, 4, 8, 16], [2, 4, 8, 16], [2, 4, 8, 16]] };
    // All tiles already packed left with no merges possible
    const result = move(stuck, 'left');
    expect(result).toBeNull();
  });

  it('merge produces doubled tile', () => {
    const game = {
      grid: [[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
      bestTile: 2,
      history: [],
      won: false,
      over: false,
      moves: 0,
    };
    const result = move(game, 'left');
    expect(result).not.toBeNull();
    expect(result!.grid[0]![0]).toBe(4);
    expect(result!.score).toBe(4);
  });

  it('undo restores previous state', () => {
    const game = createGame();
    const moved = move(game, 'left');
    if (moved) {
      const undone = undo(moved);
      expect(undone).not.toBeNull();
      expect(undone!.score).toBe(game.score);
    }
  });

  it('isGameOver detects full board with no merges', () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(isGameOver(grid)).toBe(true);
  });

  it('isGameOver returns false when empty cells exist', () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 0],
    ];
    expect(isGameOver(grid)).toBe(false);
  });

  it('isGameOver returns false when adjacent tiles can merge', () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 4],
    ];
    expect(isGameOver(grid)).toBe(false);
  });

  it('win is detected at 2048', () => {
    // Force a merge to 2048
    const game = {
      grid: [[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
      bestTile: 1024,
      history: [],
      won: false,
      over: false,
      moves: 0,
    };
    const result = move(game, 'left');
    expect(result).not.toBeNull();
    expect(result!.grid[0]![0]).toBe(2048);
    expect(result!.won).toBe(true);
  });
});
