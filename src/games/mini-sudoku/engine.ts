export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SudokuPuzzle {
  solution: number[][];
  puzzle: number[][];
  difficulty: Difficulty;
  seed: number;
}

function rng(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

/** Fisher–Yates: consumes exactly n-1 rng draws, so seed→grid is identical in every JS engine */
function shuffle<T>(a: T[], r: () => number) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = b[i];
    b[i] = b[j]!;
    b[j] = t!;
  }
  return b;
}

export function solvedGrid(seed = 1) {
  const r = rng(seed);
  const nums = shuffle([1, 2, 3, 4, 5, 6], r);
  const rows = shuffle([0, 1, 2], r).flatMap((b) => shuffle([0, 1], r).map((x) => b * 2 + x));
  const cols = shuffle([0, 1], r).flatMap((b) => shuffle([0, 1, 2], r).map((x) => b * 3 + x));
  return rows.map((rr) => cols.map((cc) => nums[(rr * 3 + Math.floor(rr / 2) + cc) % 6]!));
}

function candidates(board: number[][], r: number, c: number) {
  const used = new Set<number>();
  for (let i = 0; i < 6; i++) {
    used.add(board[r]![i]!);
    used.add(board[i]![c]!);
  }
  const br = Math.floor(r / 2) * 2;
  const bc = Math.floor(c / 3) * 3;
  for (let y = br; y < br + 2; y++) {
    for (let x = bc; x < bc + 3; x++) {
      used.add(board[y]![x]!);
    }
  }
  return [1, 2, 3, 4, 5, 6].filter((n) => !used.has(n));
}

export function solve(board: number[][], limit = 2): number[][][] {
  const b = board.map((row) => row.slice());
  const out: number[][][] = [];

  function go() {
    if (out.length >= limit) return;
    let best: null | [number, number, number[]] = null;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (!b[r]![c]) {
          const cs = candidates(b, r, c);
          if (!cs.length) return;
          if (!best || cs.length < best[2].length) best = [r, c, cs];
        }
      }
    }
    if (!best) {
      out.push(b.map((row) => row.slice()));
      return;
    }
    for (const n of best[2]) {
      b[best[0]]![best[1]] = n;
      go();
      b[best[0]]![best[1]] = 0;
    }
  }

  go();
  return out;
}

export function createPuzzle(difficulty: Difficulty = 'easy', seed = Date.now()): SudokuPuzzle {
  const target = { easy: 12, medium: 16, hard: 20 }[difficulty];
  const solution = solvedGrid(seed);
  const puzzle = solution.map((r) => r.slice());
  const r = rng(seed + 9);
  const cells = shuffle(Array.from({ length: 36 }, (_, i) => i), r);
  let removed = 0;

  for (const i of cells) {
    if (removed >= target) break;
    const row = Math.floor(i / 6);
    const col = i % 6;
    const old = puzzle[row]![col]!;
    puzzle[row]![col] = 0;
    if (solve(puzzle, 2).length !== 1) {
      puzzle[row]![col] = old;
    } else {
      removed++;
    }
  }

  return { solution, puzzle, difficulty, seed };
}

export function isValidMove(board: number[][], row: number, col: number, digit: number) {
  if (digit < 1 || digit > 6) return false;
  const copy = board.map((r) => r.slice());
  copy[row]![col] = 0;
  return candidates(copy, row, col).includes(digit);
}

export function togglePencilMarks(marks: Set<number>, digit: number) {
  const next = new Set(marks);
  if (next.has(digit)) next.delete(digit);
  else next.add(digit);
  return next;
}
