import { describe, it, expect } from 'vitest';
import {
  createGame,
  markCell,
  toggleCell,
  undo,
  checkSolved,
  computeClues,
  isRowSatisfied,
  isColSatisfied,
} from './engine';
import { PUZZLES_5x5, PUZZLES_10x10, ALL_PUZZLES } from './puzzles';

describe('Nonogram engine', () => {
  it('creates a blank grid with all cells unknown', () => {
    const puzzle = PUZZLES_5x5[0]!;
    const game = createGame(puzzle);
    expect(game.grid.length).toBe(5);
    expect(game.grid[0]!.length).toBe(5);
    expect(game.grid.every((row) => row.every((cell) => cell === 'unknown'))).toBe(true);
  });

  it('marks a cell as filled or empty', () => {
    const game = createGame(PUZZLES_5x5[0]!);
    const filled = markCell(game, 0, 0, 'filled');
    expect(filled).not.toBeNull();
    expect(filled!.grid[0]![0]).toBe('filled');

    const empty = markCell(game, 0, 1, 'empty');
    expect(empty).not.toBeNull();
    expect(empty!.grid[0]![1]).toBe('empty');
  });

  it('toggles cell state through cycle unknown -> filled -> empty -> unknown', () => {
    let game = createGame(PUZZLES_5x5[0]!);
    game = toggleCell(game, 0, 0)!;
    expect(game.grid[0]![0]).toBe('filled');
    game = toggleCell(game, 0, 0)!;
    expect(game.grid[0]![0]).toBe('empty');
    game = toggleCell(game, 0, 0)!;
    expect(game.grid[0]![0]).toBe('unknown');
  });

  it('checkSolved returns true when grid matches solution', () => {
    const puzzle = PUZZLES_5x5[0]!;
    const grid = puzzle.solution.map((row) =>
      row.map((filled) => (filled ? ('filled' as const) : ('empty' as const))),
    );
    expect(checkSolved(grid, puzzle.solution)).toBe(true);
  });

  it('checkSolved returns false when grid does not match', () => {
    const puzzle = PUZZLES_5x5[0]!;
    const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 'empty' as const));
    expect(checkSolved(grid, puzzle.solution)).toBe(false);
  });

  it('undo restores previous state', () => {
    let game = createGame(PUZZLES_5x5[0]!);
    game = markCell(game, 0, 0, 'filled')!;
    expect(game.grid[0]![0]).toBe('filled');
    const undone = undo(game);
    expect(undone).not.toBeNull();
    expect(undone!.grid[0]![0]).toBe('unknown');
  });

  it('computeClues produces correct row and column clues', () => {
    const puzzle = PUZZLES_5x5[0]!; // Heart
    const clues = computeClues(puzzle.solution);
    // Heart row 0: .#.#. → [1, 1]
    expect(clues.rows[0]).toEqual([1, 1]);
    // Heart row 1: ##### → [5]
    expect(clues.rows[1]).toEqual([5]);
  });

  it('every puzzle has valid clues matching its size', () => {
    for (const puzzle of ALL_PUZZLES) {
      const clues = computeClues(puzzle.solution);
      expect(clues.rows.length).toBe(puzzle.size);
      expect(clues.cols.length).toBe(puzzle.size);
    }
  });

  it('isRowSatisfied and isColSatisfied detect complete rows and columns', () => {
    const puzzle = PUZZLES_5x5[0]!;
    const clues = computeClues(puzzle.solution);
    const grid = puzzle.solution.map((row) =>
      row.map((filled) => (filled ? ('filled' as const) : ('empty' as const))),
    );
    for (let r = 0; r < 5; r++) {
      expect(isRowSatisfied(grid, r, clues.rows[r]!)).toBe(true);
    }
    for (let c = 0; c < 5; c++) {
      expect(isColSatisfied(grid, c, clues.cols[c]!)).toBe(true);
    }
  });
});

describe('Nonogram puzzles uniqueness', () => {
  it('all puzzles have unique ids', () => {
    const ids = ALL_PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has 12 5x5 puzzles', () => {
    expect(PUZZLES_5x5.length).toBe(12);
  });

  it('has 12 10x10 puzzles', () => {
    expect(PUZZLES_10x10.length).toBe(12);
  });
});
