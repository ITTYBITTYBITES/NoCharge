/**
 * Four in a Row rules for the Pass &amp; Play edition.
 *
 * Pure functions only: no DOM, no storage, no AI. The engine applies the
 * standard rules — a disc falls to the lowest empty cell in its column, and
 * the first four in a row horizontally, vertically, or diagonally wins. It
 * never suggests a column and never claims anything about strategy.
 */

export type FourPlayer = 1 | 2;
export type CellValue = FourPlayer | null;

export interface BoardSize {
  cols: number;
  rows: number;
  label: string;
}

/** Standard 7×6 board and the smaller 6×5 board. */
export const FOUR_IN_A_ROW_SIZES: readonly BoardSize[] = [
  { cols: 7, rows: 6, label: '7×6 · standard' },
  { cols: 6, rows: 5, label: '6×5 · small' },
];

/** Rows are stored top to bottom; row 0 is the top of the board. */
export interface FourBoard {
  cols: number;
  rows: number;
  cells: readonly CellValue[];
}

export function emptyBoard(cols: number, rows: number): FourBoard {
  return { cols, rows, cells: Array.from({ length: cols * rows }, () => null) };
}

/** The row a disc in `col` would land in, or null when the column is full. */
export function landingRow(board: FourBoard, col: number): number | null {
  if (col < 0 || col >= board.cols) return null;
  for (let row = board.rows - 1; row >= 0; row -= 1) {
    if (board.cells[row * board.cols + col] === null) return row;
  }
  return null;
}

/** Drop a disc; returns the updated board and landing row, or null. */
export function dropDisc(
  board: FourBoard,
  col: number,
  player: FourPlayer,
): { board: FourBoard; row: number } | null {
  const row = landingRow(board, col);
  if (row === null) return null;
  const cells = [...board.cells];
  cells[row * board.cols + col] = player;
  return { board: { cols: board.cols, rows: board.rows, cells }, row };
}

const DIRECTIONS: readonly [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * Whether the move just made at (`row`, `col`) completes four in a row.
 * Only lines through the newest disc are checked.
 */
export function findWinFrom(board: FourBoard, row: number, col: number): { player: FourPlayer; cells: number[] } | null {
  const player = board.cells[row * board.cols + col];
  if (player === null || player === undefined) return null;
  for (const [dr, dc] of DIRECTIONS) {
    const line: number[] = [row * board.cols + col];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < board.rows && c >= 0 && c < board.cols && board.cells[r * board.cols + c] === player) {
        line.push(r * board.cols + c);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= 4) {
      return { player, cells: line.sort((a, b) => a - b) };
    }
  }
  return null;
}

export function isBoardFull(board: FourBoard): boolean {
  return board.cells.every((cell) => cell !== null);
}

/** Accessible cell label: "Row 3, Column 4" (both one-based). */
export function cellName(row: number, col: number): string {
  return `Row ${row + 1}, Column ${col + 1}`;
}

/** The player who opens the next game alternates each game. */
export function openingPlayerForGame(game: number): FourPlayer {
  return game % 2 === 1 ? 1 : 2;
}

export function otherFourPlayer(player: FourPlayer): FourPlayer {
  return player === 1 ? 2 : 1;
}
