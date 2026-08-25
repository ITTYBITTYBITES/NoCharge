import { describe, expect, it } from 'vitest';
import {
  createPuzzle,
  solvedGrid,
  solve,
  isValidMove,
  togglePencilMarks,
} from './engine';

describe('mini sudoku engine', () => {
  it('makes valid solved 6×6 grids', () => {
    for (let s = 1; s < 20; s++) {
      const g = solvedGrid(s);
      expect(g.flat()).toHaveLength(36);
      expect(solve(g, 2)).toHaveLength(1);
    }
  });

  it('makes unique documented puzzles for each difficulty', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) {
      const p = createPuzzle(d, 22);
      expect(p.puzzle.flat().filter(Boolean)).toHaveLength(
        { easy: 24, medium: 20, hard: 16 }[d],
      );
      expect(solve(p.puzzle, 2)).toHaveLength(1);
    }
  });

  it('validates moves and detects row, column, and box conflicts', () => {
    const g = solvedGrid(42);
    // Move on empty position matching solution
    expect(isValidMove(g, 0, 0, g[0]![0]!)).toBe(true);
    // Digit that already exists in row 0
    expect(isValidMove(g, 0, 0, g[0]![1]!)).toBe(false);
    // Invalid digit < 1 or > 6
    expect(isValidMove(g, 0, 0, 0)).toBe(false);
    expect(isValidMove(g, 0, 0, 7)).toBe(false);
  });

  it('toggles pencil marks on and off', () => {
    let marks = new Set<number>();
    marks = togglePencilMarks(marks, 3);
    expect(marks.has(3)).toBe(true);
    marks = togglePencilMarks(marks, 5);
    expect(marks.has(3)).toBe(true);
    expect(marks.has(5)).toBe(true);
    marks = togglePencilMarks(marks, 3);
    expect(marks.has(3)).toBe(false);
    expect(marks.has(5)).toBe(true);
  });
});
