import { describe, expect, it } from 'vitest';
import { createPuzzle, GIVENS, hasUniqueSolution, isSolved, isValidMove, solvedGrid, togglePencilMarks } from './engine';

function validComplete(grid: number[][]): boolean {
  const check = (values: number[]) => new Set(values).size === 9 && values.every((value) => value >= 1 && value <= 9);
  for (let i = 0; i < 9; i += 1) {
    if (!check(grid[i]!)) return false;
    if (!check(grid.map((row) => row[i]!))) return false;
  }
  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const values = [];
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r += 1) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c += 1) values.push(grid[r]![c]);
      }
      if (!check(values)) return false;
    }
  }
  return true;
}

describe('sudoku 9×9 engine', () => {
  it('generates a valid complete grid deterministically from a seed', () => {
    const grid = solvedGrid(123);
    expect(validComplete(grid)).toBe(true);
    expect(solvedGrid(123)).toEqual(grid);
  });

  it('creates puzzles with the documented given counts and a unique solution', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const puzzle = createPuzzle(difficulty, 42);
      expect(puzzle.givens).toBe(GIVENS[difficulty]);
      expect(puzzle.puzzle.flat().filter(Boolean).length).toBe(GIVENS[difficulty]);
      expect(puzzle.solution.flat().filter(Boolean).length).toBe(81);
      expect(hasUniqueSolution(puzzle.puzzle)).toBe(true);
      expect(isSolved(puzzle.solution, puzzle.solution)).toBe(true);
    }
  });

  it('validates moves against row, column, and box constraints', () => {
    const grid = solvedGrid(7);
    const board = grid.map((row) => row.slice());
    board[0]![0] = 0;
    expect(isValidMove(board, 0, 0, grid[0]![0]!)).toBe(true);
    // The same digit already appears in row 0 at another position.
    const other = grid[0]!.find((digit) => digit !== grid[0]![0])!;
    expect(isValidMove(board, 0, 0, other)).toBe(false);
  });

  it('toggles pencil marks without mutating the input', () => {
    const marks = new Set<number>([1, 2]);
    const next = togglePencilMarks(marks, 3);
    expect(next.has(1)).toBe(true);
    expect(next.has(3)).toBe(true);
    expect(marks.has(3)).toBe(false);
    const removed = togglePencilMarks(next, 2);
    expect(removed.has(2)).toBe(false);
  });
});
