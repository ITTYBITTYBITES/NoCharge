import { describe, it, expect } from 'vitest';
import {
  COLS,
  ROWS,
  isAdjacent,
  createInitialGrid,
  addPositionToPath,
  isValidWord,
  calculateWordScore,
  submitPath,
  dropNewRow,
  type Cell,
  type Position,
} from './engine';

describe('Word Tile Rush engine', () => {
  it('creates an 8×6 initial grid', () => {
    const grid = createInitialGrid();
    expect(grid).toHaveLength(ROWS);
    expect(grid[0]).toHaveLength(COLS);
    // Top rows should be empty initially
    for (let r = 0; r < ROWS - 3; r++) {
      expect(grid[r]!.every((cell) => cell.letter === null)).toBe(true);
    }
  });

  it('checks adjacency in all 8 directions and rejects self/distance > 1', () => {
    const center: Position = { r: 3, c: 3 };
    // 8 adjacent neighbors
    const neighbors: Position[] = [
      { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 4 },
      { r: 3, c: 2 },                 { r: 3, c: 4 },
      { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 },
    ];
    for (const n of neighbors) {
      expect(isAdjacent(center, n)).toBe(true);
      expect(isAdjacent(n, center)).toBe(true);
    }

    // Self is not adjacent
    expect(isAdjacent(center, center)).toBe(false);

    // Distance 2 is not adjacent
    expect(isAdjacent(center, { r: 1, c: 3 })).toBe(false);
    expect(isAdjacent(center, { r: 3, c: 5 })).toBe(false);
    expect(isAdjacent(center, { r: 5, c: 5 })).toBe(false);
  });

  it('builds a path with adjacent positions and supports backtracking', () => {
    const grid: Cell[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ letter: 'A', selected: false })),
    );

    let path: Position[] = [];

    // Add first cell
    let res = addPositionToPath(grid, path, { r: 5, c: 0 });
    expect(res.changed).toBe(true);
    expect(res.path).toEqual([{ r: 5, c: 0 }]);
    path = res.path;

    // Add adjacent cell
    res = addPositionToPath(grid, path, { r: 5, c: 1 });
    expect(res.changed).toBe(true);
    expect(res.path).toEqual([{ r: 5, c: 0 }, { r: 5, c: 1 }]);
    path = res.path;

    // Reject non-adjacent cell
    res = addPositionToPath(grid, path, { r: 5, c: 4 });
    expect(res.changed).toBe(false);
    expect(res.path).toEqual(path);

    // Backtrack 1 step by selecting previous cell { r: 5, c: 0 }
    res = addPositionToPath(grid, path, { r: 5, c: 0 });
    expect(res.changed).toBe(true);
    expect(res.backtracked).toBe(true);
    expect(res.path).toEqual([{ r: 5, c: 0 }]);
  });

  it('rejects empty cells and cells out of bounds', () => {
    const grid: Cell[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ letter: null, selected: false })),
    );
    const res = addPositionToPath(grid, [], { r: 0, c: 0 });
    expect(res.changed).toBe(false);
    expect(res.path).toEqual([]);

    const res2 = addPositionToPath(grid, [], { r: -1, c: 0 });
    expect(res2.changed).toBe(false);
  });

  it('validates words against the offline dictionary (min length 3)', () => {
    expect(isValidWord('cat')).toBe(true);
    expect(isValidWord('WORD')).toBe(true);
    expect(isValidWord('cloud')).toBe(true);
    expect(isValidWord('no')).toBe(false); // < 3 chars
    expect(isValidWord('xyzqwe')).toBe(false); // not in dictionary
  });

  it('calculates word scoring: length^2 * 10', () => {
    expect(calculateWordScore('cat')).toBe(90); // 3*3*10
    expect(calculateWordScore('card')).toBe(160); // 4*4*10
    expect(calculateWordScore('plant')).toBe(250); // 5*5*10
    expect(calculateWordScore('castle')).toBe(360); // 6*6*10
  });

  it('submits a valid word, clears letters, and collapses columns downward', () => {
    const grid: Cell[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ letter: null, selected: false })),
    );
    // Put 'C' at (5, 0), 'A' at (6, 0), 'T' at (7, 0)
    // Put filler 'X' at (4, 0) above 'C'
    grid[4]![0] = { letter: 'X', selected: false };
    grid[5]![0] = { letter: 'C', selected: false };
    grid[6]![0] = { letter: 'A', selected: false };
    grid[7]![0] = { letter: 'T', selected: false };

    const path: Position[] = [{ r: 5, c: 0 }, { r: 6, c: 0 }, { r: 7, c: 0 }];
    const result = submitPath(grid, path);

    expect(result.valid).toBe(true);
    expect(result.word).toBe('CAT');
    expect(result.points).toBe(90);

    // After gravity, 'X' should now sit at the bottom (7, 0)
    expect(result.newGrid[7]![0]!.letter).toBe('X');
    expect(result.newGrid[6]![0]!.letter).toBeNull();
    expect(result.newGrid[5]![0]!.letter).toBeNull();
    expect(result.newGrid[4]![0]!.letter).toBeNull();
  });

  it('rejects invalid word on submission', () => {
    const grid: Cell[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ letter: 'Z', selected: false })),
    );
    const path: Position[] = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }];
    const result = submitPath(grid, path);
    expect(result.valid).toBe(false);
    expect(result.points).toBe(0);
  });

  it('shifts rows up on drop and triggers game over if top row is occupied', () => {
    const grid: Cell[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ letter: null, selected: false })),
    );
    grid[7]![0] = { letter: 'A', selected: false };

    const drop1 = dropNewRow(grid, () => 0.5);
    expect(drop1.gameOver).toBe(false);
    // Row 6 now has 'A'
    expect(drop1.newGrid[6]![0]!.letter).toBe('A');

    // Put a letter in top row (row 0)
    drop1.newGrid[0]![0] = { letter: 'Z', selected: false };
    const drop2 = dropNewRow(drop1.newGrid, () => 0.5);
    expect(drop2.gameOver).toBe(true);
  });
});
