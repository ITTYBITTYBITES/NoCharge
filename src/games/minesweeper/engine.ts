/**
 * Minesweeper rules for the NoCharge calm edition.
 *
 * Pure functions only: no DOM, no storage, no timer pressure. The board is
 * untimed; elapsed time may be recorded as a personal metric but never
 * displayed as a countdown or used to score the game.
 *
 * First-click safety: the first reveal never hits a mine. If the first-click
 * neighbourhood is large enough, mines avoid that cell and its neighbours so a
 * first reveal opens an area; otherwise only the clicked cell is protected.
 */

export interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

export type Board = Cell[][];

export interface Difficulty {
  id: 'beginner' | 'intermediate' | 'expert';
  label: string;
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Difficulty[] = [
  { id: 'beginner', label: 'Beginner · 9×9 · 10 mines', rows: 9, cols: 9, mines: 10 },
  { id: 'intermediate', label: 'Intermediate · 16×16 · 40 mines', rows: 16, cols: 16, mines: 40 },
  { id: 'expert', label: 'Expert · 16×30 · 99 mines', rows: 16, cols: 30, mines: 99 },
];

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface GameState {
  difficulty: Difficulty;
  board: Board;
  status: GameStatus;
  firstRevealDone: boolean;
  revealedCount: number;
  flaggedCount: number;
  /** The exact index of the mine that ended the game (row, col), if lost. */
  exploded: { row: number; col: number } | null;
}

export function makeEmptyBoard(difficulty: Difficulty): Board {
  return Array.from({ length: difficulty.rows }, () =>
    Array.from({ length: difficulty.cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  );
}

export function inBounds(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < board[0]!.length;
}

/** All in-bounds neighbours of a cell, in reading order. */
export function neighbours(board: Board, row: number, col: number): { row: number; col: number }[] {
  const result: { row: number; col: number }[] = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (inBounds(board, nextRow, nextCol)) result.push({ row: nextRow, col: nextCol });
    }
  }
  return result;
}

function seed(board: Board, mines: number, safe: { row: number; col: number }): void {
  const rows = board.length;
  const cols = board[0]!.length;
  const protectedCells = new Set<string>([`${safe.row},${safe.col}`]);
  // Protect the first-click neighbourhood when it fits; the standard promise
  // is "first click is never a mine", and opening a small area is a bonus we
  // document honestly.
  if (rows * cols - 9 >= mines) {
    for (const next of neighbours(board, safe.row, safe.col)) protectedCells.add(`${next.row},${next.col}`);
  }
  const candidates: { row: number; col: number }[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!protectedCells.has(`${row},${col}`)) candidates.push({ row, col });
    }
  }
  // Fisher–Yates and take the first `mines`.
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swap]] = [candidates[swap]!, candidates[index]!];
  }
  for (let index = 0; index < mines && index < candidates.length; index += 1) {
    const spot = candidates[index]!;
    board[spot.row]![spot.col]!.mine = true;
  }
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = board[row]![col]!;
      cell.adjacent = neighbours(board, row, col).filter((next) => board[next.row]![next.col]!.mine).length;
    }
  }
}

/** Start a fresh game. First reveal is handled by revealCell with first-click safety. */
export function newGame(difficulty: Difficulty, random = Math.random): GameState {
  // A placeholder safe cell; the first reveal replaces the board.
  const board = makeEmptyBoard(difficulty);
  // Seed with every cell protected except (0,0) as a safe default so a
  // reveal before seeding never exposes a mine; revealCell reseeds properly.
  const safeRow = 0;
  const safeCol = 0;
  seed(board, difficulty.mines, { row: safeRow, col: safeCol });
  return {
    difficulty,
    board,
    status: 'idle',
    firstRevealDone: false,
    revealedCount: 0,
    flaggedCount: 0,
    exploded: null,
  };
}

/** The first reveal re-seeds the board with the clicked cell protected. */
export function revealCell(state: GameState, row: number, col: number, random = Math.random): GameState {
  if (state.status === 'won' || state.status === 'lost') return state;
  if (!inBounds(state.board, row, col)) return state;
  if (state.board[row]![col]!.flagged) return state;

  let board = state.board;
  if (!state.firstRevealDone) {
    board = makeEmptyBoard(state.difficulty);
    seed(board, state.difficulty.mines, { row, col });
  }

  const cell = board[row]![col]!;
  if (cell.revealed) return { ...state, board, firstRevealDone: true };
  if (cell.mine) {
    cell.revealed = true;
    return {
      difficulty: state.difficulty,
      board,
      status: 'lost',
      firstRevealDone: true,
      revealedCount: state.revealedCount,
      flaggedCount: state.flaggedCount,
      exploded: { row, col },
    };
  }

  let revealedCount = state.revealedCount;
  const stack: { row: number; col: number }[] = [{ row, col }];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const currentCell = board[current.row]![current.col]!;
    if (currentCell.revealed || currentCell.flagged) continue;
    currentCell.revealed = true;
    revealedCount += 1;
    if (currentCell.adjacent === 0) {
      for (const next of neighbours(board, current.row, current.col)) {
        if (!board[next.row]![next.col]!.revealed && !board[next.row]![next.col]!.flagged) stack.push(next);
      }
    }
  }

  const safeCount = state.difficulty.rows * state.difficulty.cols - state.difficulty.mines;
  const status = revealedCount === safeCount ? 'won' : 'playing';
  return {
    difficulty: state.difficulty,
    board,
    status,
    firstRevealDone: true,
    revealedCount,
    flaggedCount: state.flaggedCount,
    exploded: null,
  };
}

/** Toggle a flag on a hidden cell. Costs nothing when the game is over. */
export function toggleFlag(state: GameState, row: number, col: number): GameState {
  if (state.status === 'won' || state.status === 'lost') return state;
  if (!inBounds(state.board, row, col)) return state;
  const board = state.board.map((cells) => cells.slice());
  const cell = board[row]![col]!;
  if (cell.revealed) return state;
  cell.flagged = !cell.flagged;
  const flaggedDelta = cell.flagged ? 1 : -1;
  return {
    ...state,
    board,
    flaggedCount: state.flaggedCount + flaggedDelta,
  };
}

/** Chord: reveal unflagged neighbours when the flag count matches the number. */
export function chord(state: GameState, row: number, col: number, random = Math.random): GameState {
  if (state.status === 'won' || state.status === 'lost') return state;
  if (!inBounds(state.board, row, col)) return state;
  const cell = state.board[row]![col]!;
  if (!cell.revealed || cell.adjacent === 0) return state;
  const around = neighbours(state.board, row, col);
  const flags = around.filter((next) => state.board[next.row]![next.col]!.flagged).length;
  if (flags !== cell.adjacent) return state;
  let next = state;
  for (const spot of around) {
    if (!state.board[spot.row]![spot.col]!.revealed && !state.board[spot.row]![spot.col]!.flagged) {
      next = revealCell(next, spot.row, spot.col, random);
      if (next.status === 'lost') return next;
    }
  }
  return next;
}

export function revealAllMines(state: GameState): Board {
  return state.board.map((cells) => cells.map((cell) => (cell.mine ? { ...cell, revealed: true } : { ...cell })));
}

export function cellLabel(row: number, col: number): string {
  return `Row ${row + 1}, Column ${col + 1}`;
}
