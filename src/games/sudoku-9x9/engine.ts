/**
 * Sudoku 9×9 rules for the NoCharge edition.
 *
 * Pure functions only. Difficulty labels describe the number of given cells
 * (Easy 42, Medium 34, Hard 28) and every puzzle is verified to have exactly
 * one solution by the solver before it is declared. No cognitive or IQ claims.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SudokuPuzzle {
  solution: number[][];
  puzzle: number[][];
  difficulty: Difficulty;
  givens: number;
  seed: number;
}

export const GIVENS: Record<Difficulty, number> = {
  easy: 42,
  medium: 34,
  hard: 28,
};

export const SIZE = 9;

function rng(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

function shuffle<T>(items: T[], r: () => number): T[] {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(r() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap]!, copy[index]!];
  }
  return copy;
}

/** A complete 9×9 grid built from shuffled bands, stacks, and digits. */
export function solvedGrid(seed = 1): number[][] {
  const r = rng(seed);
  const base = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const bands = shuffle([0, 1, 2], r);
  const stacks = shuffle([0, 1, 2], r);
  const rows = bands.flatMap((band) => shuffle([0, 1, 2], r).map((offset) => band * 3 + offset));
  const cols = stacks.flatMap((stack) => shuffle([0, 1, 2], r).map((offset) => stack * 3 + offset));
  const digits = shuffle(base, r);
  return rows.map((row) =>
    cols.map((col) => digits[(row * 3 + Math.floor(row / 3) + col) % 9]!),
  );
}

function candidates(board: number[][], row: number, col: number): number[] {
  const used = new Set<number>();
  for (let index = 0; index < SIZE; index += 1) {
    used.add(board[row]![index]!);
    used.add(board[index]![col]!);
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let y = boxRow; y < boxRow + 3; y += 1) {
    for (let x = boxCol; x < boxCol + 3; x += 1) used.add(board[y]![x]!);
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((digit) => !used.has(digit));
}

/** Up to `limit` solutions (1 = uniqueness check, 2 = count). */
export function solve(board: number[][], limit = 2): number[][][] {
  const working = board.map((row) => row.slice());
  const solutions: number[][][] = [];
  const go = () => {
    if (solutions.length >= limit) return;
    let best: [number, number, number[]] | null = null;
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (working[row]![col] !== 0) continue;
        const options = candidates(working, row, col);
        if (options.length === 0) return;
        if (best === null || options.length < best[2].length) best = [row, col, options];
      }
    }
    if (best === null) {
      solutions.push(working.map((row) => row.slice()));
      return;
    }
    for (const digit of best[2]) {
      working[best[0]]![best[1]] = digit;
      go();
      working[best[0]]![best[1]] = 0;
    }
  };
  go();
  return solutions;
}

export function hasUniqueSolution(board: number[][]): boolean {
  return solve(board, 2).length === 1;
}

/**
 * Remove cells at random while keeping a unique solution, then trim to the
 * target given count. The result is labeled by `givens`, not by difficulty
 * "grade".
 */
export function createPuzzle(difficulty: Difficulty = 'easy', seed = Date.now()): SudokuPuzzle {
  const random = rng(seed);
  const solution = solvedGrid(seed ^ 0x9e3779b9);
  const puzzle = solution.map((row) => row.slice());
  const positions = shuffle(
    Array.from({ length: SIZE * SIZE }, (_, index) => [Math.floor(index / SIZE), index % SIZE] as [number, number]),
    random,
  );
  let givens = SIZE * SIZE;
  const target = GIVENS[difficulty];
  for (const [row, col] of positions) {
    if (givens <= target) break;
    const saved = puzzle[row]![col]!;
    puzzle[row]![col] = 0;
    if (hasUniqueSolution(puzzle)) givens -= 1;
    else puzzle[row]![col] = saved;
  }
  return { solution, puzzle, difficulty, givens, seed };
}

/** True when the digit already appears in the row, column, or box. */
export function isValidMove(board: number[][], row: number, col: number, digit: number): boolean {
  return candidates(board, row, col).includes(digit);
}

export function isComplete(board: number[][]): boolean {
  return board.every((row) => row.every((cell) => cell !== 0));
}

export function isSolved(board: number[][], solution: number[][]): boolean {
  return board.every((row, rowIndex) => row.every((cell, colIndex) => cell === solution[rowIndex]![colIndex]));
}

export function togglePencilMarks(marks: Set<number>, digit: number): Set<number> {
  const next = new Set(marks);
  if (next.has(digit)) next.delete(digit);
  else next.add(digit);
  return next;
}

export function cellName(row: number, col: number): string {
  return `Row ${row + 1}, Column ${col + 1}`;
}
