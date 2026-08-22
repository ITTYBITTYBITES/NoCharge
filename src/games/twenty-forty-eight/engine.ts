/**
 * 2048 engine — pure rules, no DOM, no localStorage.
 * Classic 4×4 grid, tiles 2 to 2048+ (powers of 2).
 * Slide all tiles in one direction; merge equal adjacent.
 * New tile spawns: 2 with 90%, 4 with 10%.
 */
import { createGrid, cloneGrid } from '../shared/grid';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface TwentyFortyEightState {
  grid: number[][];
  score: number;
  bestTile: number;
  history: { grid: number[][]; score: number }[];
  won: boolean;
  over: boolean;
  moves: number;
}

/** Create a new game with 2 starting tiles. */
export function createGame(): TwentyFortyEightState {
  const grid = createGrid<number>(4, 4, 0);
  spawnTile(grid);
  spawnTile(grid);
  const bestTile = findBestTile(grid);
  return { grid, score: 0, bestTile, history: [], won: false, over: false, moves: 0 };
}

/** Find an empty cell and place a 2 (90%) or 4 (10%). */
function spawnTile(grid: number[][]): boolean {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r]![c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return false;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]!;
  grid[r]![c] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

function findBestTile(grid: number[][]): number {
  let best = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r]![c] > best) best = grid[r]![c]!;
    }
  }
  return best;
}

/** Slide a line (row or column) to the left, merging equals. Returns [newLine, points]. */
function slideLine(line: number[]): [number[], number] {
  // Remove zeros
  const filtered = line.filter((v) => v !== 0);
  const result: number[] = [];
  let points = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i]! * 2;
      result.push(merged);
      points += merged;
      i += 2;
    } else {
      result.push(filtered[i]!);
      i++;
    }
  }
  while (result.length < 4) result.push(0);
  return [result, points];
}

/** Perform a move in the given direction. Returns null if the board didn't change. */
export function move(state: TwentyFortyEightState, direction: Direction): TwentyFortyEightState | null {
  if (state.over) return null;

  const prev = cloneGrid(state.grid);
  const grid = cloneGrid(state.grid);
  let points = 0;

  if (direction === 'left') {
    for (let r = 0; r < 4; r++) {
      const [newLine, p] = slideLine(grid[r]!);
      grid[r] = newLine;
      points += p;
    }
  } else if (direction === 'right') {
    for (let r = 0; r < 4; r++) {
      const reversed = [...grid[r]!].reverse();
      const [newLine, p] = slideLine(reversed);
      grid[r] = newLine.reverse();
      points += p;
    }
  } else if (direction === 'up') {
    for (let c = 0; c < 4; c++) {
      const col = [grid[0]![c]!, grid[1]![c]!, grid[2]![c]!, grid[3]![c]!];
      const [newLine, p] = slideLine(col);
      for (let r = 0; r < 4; r++) grid[r]![c] = newLine[r]!;
      points += p;
    }
  } else if (direction === 'down') {
    for (let c = 0; c < 4; c++) {
      const col = [grid[3]![c]!, grid[2]![c]!, grid[1]![c]!, grid[0]![c]!];
      const [newLine, p] = slideLine(col);
      for (let r = 0; r < 4; r++) grid[3 - r]![c] = newLine[r]!;
      points += p;
    }
  }

  // Check if anything changed
  let changed = false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r]![c] !== prev[r]![c]) { changed = true; break; }
    }
    if (changed) break;
  }
  if (!changed) return null;

  // Spawn new tile
  spawnTile(grid);

  const newScore = state.score + points;
  const bestTile = findBestTile(grid);
  const won = bestTile >= 2048;
  const over = isGameOver(grid);

  return {
    grid,
    score: newScore,
    bestTile,
    history: [...state.history, { grid: prev, score: state.score }],
    won,
    over,
    moves: state.moves + 1,
  };
}

/** Check if no moves are available. */
export function isGameOver(grid: number[][]): boolean {
  // Any empty cell means game continues
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r]![c] === 0) return false;
    }
  }
  // Check for adjacent equals
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r]![c]!;
      if (c < 3 && grid[r]![c + 1] === val) return false;
      if (r < 3 && grid[r + 1]![c] === val) return false;
    }
  }
  return true;
}

/** Undo last move. */
export function undo(state: TwentyFortyEightState): TwentyFortyEightState | null {
  if (state.history.length === 0) return null;
  const history = [...state.history];
  const prev = history.pop()!;
  return {
    ...state,
    grid: prev.grid,
    score: prev.score,
    bestTile: findBestTile(prev.grid),
    history,
    won: false,
    over: false,
  };
}
