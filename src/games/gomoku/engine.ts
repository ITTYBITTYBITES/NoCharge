/**
 * Gomoku rules for the NoCharge Pass & Play edition.
 *
 * Pure functions only. Variant: free-style Gomoku on a 15×15 board — five or
 * more stones in a row (horizontal, vertical, or diagonal) wins. No overlines
 * restriction, no captures, no opening rules. The variant is documented
 * plainly in the guide; NoCharge does not claim to implement tournament rules.
 */

export const GOMOKU_SIZE = 15;

export type GomokuStone = 1 | 2;
export type GomokuCell = GomokuStone | 0;

export interface GomokuState {
  board: GomokuCell[][];
  turn: GomokuStone;
  status: 'playing' | 'won' | 'draw';
  winner: GomokuStone | null;
  winningLine: number[] | null;
  moves: number;
}

export function newBoard(): GomokuCell[][] {
  return Array.from({ length: GOMOKU_SIZE }, () => Array.from({ length: GOMOKU_SIZE }, () => 0));
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < GOMOKU_SIZE && col >= 0 && col < GOMOKU_SIZE;
}

export function newGame(): GomokuState {
  return { board: newBoard(), turn: 1, status: 'playing', winner: null, winningLine: null, moves: 0 };
}

export function otherTurn(turn: GomokuStone): GomokuStone {
  return turn === 1 ? 2 : 1;
}

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;

/** Find the winning line for the cell just played, or null. */
export function winningLineFor(board: GomokuCell[][], row: number, col: number): number[] | null {
  const stone = board[row]![col]!;
  if (stone === 0) return null;
  for (const [dr, dc] of DIRECTIONS) {
    const line = [{ row, col }];
    for (const sign of [-1, 1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (inBounds(r, c) && board[r]![c] === stone) {
        if (sign === -1) line.unshift({ row: r, col: c });
        else line.push({ row: r, col: c });
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= 5) return line.map((cell) => cell.row * GOMOKU_SIZE + cell.col);
  }
  return null;
}

export function placeStone(state: GomokuState, row: number, col: number): GomokuState {
  if (state.status !== 'playing' || !inBounds(row, col) || state.board[row]![col] !== 0) return state;
  const board = state.board.map((cells) => cells.slice());
  board[row]![col] = state.turn;
  const line = winningLineFor(board, row, col);
  if (line) {
    return { board, turn: state.turn, status: 'won', winner: state.turn, winningLine: line, moves: state.moves + 1 };
  }
  const moves = state.moves + 1;
  if (moves === GOMOKU_SIZE * GOMOKU_SIZE) {
    return { board, turn: state.turn, status: 'draw', winner: null, winningLine: null, moves };
  }
  return { board, turn: otherTurn(state.turn), status: 'playing', winner: null, winningLine: null, moves };
}

export function stoneName(stone: GomokuStone): 'Black' | 'White' {
  return stone === 1 ? 'Black' : 'White';
}

export function cellName(row: number, col: number): string {
  return `Row ${row + 1}, Column ${col + 1}`;
}
