/**
 * Nonogram / Picross engine — pure rules, no DOM, no localStorage.
 * 5×5 and 10×10 grids with row/column clues from curated picture library.
 * Mark cells filled, empty, or unknown. Solved when picture matches.
 */

export type CellState = 'unknown' | 'filled' | 'empty';

export interface PuzzleDefinition {
  id: string;
  size: number;
  title: string;
  theme: string;
  /** The solution grid: true = filled, false = empty. */
  solution: boolean[][];
}

export interface NonogramState {
  puzzle: PuzzleDefinition;
  grid: CellState[][];
  history: CellState[][][];
  moves: number;
  solved: boolean;
}

/** Generate row/column clues from a solution grid. */
export function computeClues(solution: boolean[][]): { rows: number[][]; cols: number[][] } {
  const size = solution.length;
  const rows: number[][] = [];
  const cols: number[][] = [];

  for (let r = 0; r < size; r++) {
    rows.push(lineClue(solution[r]!));
  }
  for (let c = 0; c < size; c++) {
    const col: boolean[] = [];
    for (let r = 0; r < size; r++) {
      col.push(solution[r]![c]!);
    }
    cols.push(lineClue(col));
  }

  return { rows, cols };
}

/** Compute the clue numbers for a single line (row or column). */
function lineClue(line: boolean[]): number[] {
  const groups: number[] = [];
  let count = 0;
  for (const cell of line) {
    if (cell) {
      count++;
    } else if (count > 0) {
      groups.push(count);
      count = 0;
    }
  }
  if (count > 0) groups.push(count);
  return groups.length > 0 ? groups : [0];
}

/** Create a new game from a puzzle definition. */
export function createGame(puzzle: PuzzleDefinition): NonogramState {
  const grid: CellState[][] = Array.from({ length: puzzle.size }, () =>
    Array.from({ length: puzzle.size }, () => 'unknown' as CellState),
  );
  return { puzzle, grid, history: [], moves: 0, solved: false };
}

/** Mark a cell. Returns new state or null if already solved. */
export function markCell(
  state: NonogramState,
  row: number,
  col: number,
  mark: CellState,
): NonogramState | null {
  if (state.solved) return null;
  if (row < 0 || row >= state.puzzle.size || col < 0 || col >= state.puzzle.size) return null;
  if (state.grid[row]![col] === mark) return null;

  const history = [...state.history, state.grid.map((r) => [...r])];
  const grid = state.grid.map((r) => [...r]);
  grid[row]![col] = mark;

  const solved = checkSolved(grid, state.puzzle.solution);

  return { ...state, grid, history, moves: state.moves + 1, solved };
}

/** Toggle cell: unknown → filled → empty → unknown. */
export function toggleCell(state: NonogramState, row: number, col: number): NonogramState | null {
  if (row < 0 || row >= state.puzzle.size || col < 0 || col >= state.puzzle.size) return null;
  const current = state.grid[row]![col];
  const next: CellState = current === 'unknown' ? 'filled' : current === 'filled' ? 'empty' : 'unknown';
  return markCell(state, row, col, next);
}

/** Undo last move. */
export function undo(state: NonogramState): NonogramState | null {
  if (state.history.length === 0) return null;
  const history = [...state.history];
  const grid = history.pop()!;
  return { ...state, grid, history, solved: false };
}

/** Check if the player grid matches the solution. */
export function checkSolved(grid: CellState[][], solution: boolean[][]): boolean {
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r]!.length; c++) {
      const shouldBeFilled = solution[r]![c]!;
      const playerState = grid[r]![c];
      if (shouldBeFilled && playerState !== 'filled') return false;
      if (!shouldBeFilled && playerState === 'filled') return false;
    }
  }
  return true;
}

/** Check if a row clue is satisfied by the current grid row. */
export function isRowSatisfied(grid: CellState[][], row: number, clue: number[]): boolean {
  const line = grid[row]!;
  return isLineSatisfied(line, clue);
}

/** Check if a column clue is satisfied by the current grid column. */
export function isColSatisfied(grid: CellState[][], col: number, clue: number[]): boolean {
  const line: CellState[] = [];
  for (let r = 0; r < grid.length; r++) {
    line.push(grid[r]![col]!);
  }
  return isLineSatisfied(line, clue);
}

function isLineSatisfied(line: CellState[], clue: number[]): boolean {
  // If any unknown cells remain, not yet satisfied
  if (line.some((c) => c === 'unknown')) return false;
  const groups: number[] = [];
  let count = 0;
  for (const cell of line) {
    if (cell === 'filled') {
      count++;
    } else if (count > 0) {
      groups.push(count);
      count = 0;
    }
  }
  if (count > 0) groups.push(count);
  const actual = groups.length > 0 ? groups : [0];
  return actual.length === clue.length && actual.every((v, i) => v === clue[i]);
}
