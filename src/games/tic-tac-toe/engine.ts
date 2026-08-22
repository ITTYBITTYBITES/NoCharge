/**
 * Tic-Tac-Toe rules for the Pass &amp; Play edition.
 *
 * Pure functions only: no DOM, no storage, and no strategy logic. NoCharge
 * never claims a winning line exists where the board does not show one, and
 * this engine never evaluates or suggests moves.
 */

export type TicTacToeMark = 'X' | 'O';
export type TicTacToeCell = TicTacToeMark | null;
export type TicTacToeBoard = readonly TicTacToeCell[];

export interface TicTacToeOutcome {
  mark: TicTacToeMark;
  /** Board indexes of the winning line, in reading order. */
  line: readonly number[];
}

/** Supported board sizes; the win length always equals the board size. */
export const TIC_TAC_TOE_SIZES = [3, 4] as const;

/** Match mode: first to 3 round wins, within at most 5 rounds. */
export const MATCH_TARGET = 3;
export const MATCH_MAX_ROUNDS = 5;

const linesCache = new Map<number, number[][]>();

/** Every straight line of `size` cells (rows, columns, and both diagonals). */
export function winningLines(size: number): number[][] {
  const cached = linesCache.get(size);
  if (cached) return cached;
  const lines: number[][] = [];
  for (let row = 0; row < size; row += 1) {
    lines.push(Array.from({ length: size }, (_, column) => row * size + column));
  }
  for (let column = 0; column < size; column += 1) {
    lines.push(Array.from({ length: size }, (_, row) => row * size + column));
  }
  lines.push(Array.from({ length: size }, (_, index) => index * size + index));
  lines.push(Array.from({ length: size }, (_, index) => index * size + (size - 1 - index)));
  linesCache.set(size, lines);
  return lines;
}

/** The winning outcome for the current board, or null while play continues. */
export function findWinner(board: TicTacToeBoard, size: number): TicTacToeOutcome | null {
  const lines = winningLines(size);
  for (const line of lines) {
    const first = board[line[0]!];
    if (first === null) continue;
    if (line.every((index) => board[index] === first)) {
      return { mark: first, line };
    }
  }
  return null;
}

export function isBoardFull(board: TicTacToeBoard): boolean {
  return board.every((cell) => cell !== null);
}

/**
 * Place a mark. Returns a new board, or null when the cell is taken — the
 * caller keeps the turn and the board unchanged.
 */
export function placeMark(board: TicTacToeBoard, index: number, mark: TicTacToeMark): TicTacToeBoard | null {
  if (index < 0 || index >= board.length) return null;
  if (board[index] !== null) return null;
  const next = [...board];
  next[index] = mark;
  return next;
}

export function nextMark(mark: TicTacToeMark): TicTacToeMark {
  return mark === 'X' ? 'O' : 'X';
}

/**
 * The mark that moves first in a round. Round 1 starts with X; the first
 * player alternates every round so neither player keeps the opening move.
 */
export function openingMarkForRound(round: number): TicTacToeMark {
  return round % 2 === 1 ? 'X' : 'O';
}

/** The mark that reaches the match target first wins the match, if any. */
export function matchWinner(wins: readonly [number, number]): TicTacToeMark | null {
  if (wins[0] >= MATCH_TARGET) return 'X';
  if (wins[1] >= MATCH_TARGET) return 'O';
  return null;
}

/** True once a match target is reached or all rounds are played. */
export function isMatchOver(wins: readonly [number, number], roundsPlayed: number): boolean {
  return matchWinner(wins) !== null || roundsPlayed >= MATCH_MAX_ROUNDS;
}

/** Stable cell name used for accessible labels, e.g. "Row 2, Column 3". */
export function cellName(index: number, size: number): string {
  const row = Math.floor(index / size) + 1;
  const column = (index % size) + 1;
  return `Row ${row}, Column ${column}`;
}

/** Player slot for a mark: X is Player 1 and O is Player 2. */
export function markToPlayer(mark: TicTacToeMark): 1 | 2 {
  return mark === 'X' ? 1 : 2;
}
