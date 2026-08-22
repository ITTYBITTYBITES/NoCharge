/**
 * Reversi rules for the Pass &amp; Play edition.
 *
 * Pure functions only: no DOM, no storage, no AI. Standard rules: place a
 * disc that outflanks one or more opponent discs in a straight line and flip
 * every outflanked disc; a move must flip at least one disc; a player with no
 * legal move passes; the game ends when the board is full or neither player
 * can move. Most discs wins. The engine never suggests or evaluates moves.
 */

export type ReversiDisc = 'black' | 'white';
export type ReversiCell = ReversiDisc | null;
export type ReversiBoard = readonly ReversiCell[];

export const REVERSI_SIZE = 8;
export const REVERSI_CELLS = REVERSI_SIZE * REVERSI_SIZE;

const ALL_DIRECTIONS: readonly [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

/**
 * Classic four-disc start: black on d5 and e4, white on d4 and e5, with rows
 * counted from the top (a8 is index 0). Black (Player 1) moves first.
 */
export function initialBoard(): ReversiBoard {
  const board = Array.from({ length: REVERSI_CELLS }, () => null) as ReversiCell[];
  board[3 * REVERSI_SIZE + 3] = 'black'; // d5
  board[4 * REVERSI_SIZE + 4] = 'black'; // e4
  board[4 * REVERSI_SIZE + 3] = 'white'; // d4
  board[3 * REVERSI_SIZE + 4] = 'white'; // e5
  return board;
}

export function otherDisc(disc: ReversiDisc): ReversiDisc {
  return disc === 'black' ? 'white' : 'black';
}

/**
 * Every disc that would flip if `disc` were placed on `index`, in the order
 * the lines radiate from the placed disc. Empty when the placement is not a
 * legal move.
 */
export function flipsFor(board: ReversiBoard, index: number, disc: ReversiDisc): number[] {
  if (index < 0 || index >= REVERSI_CELLS) return [];
  if (board[index] !== null) return [];
  const row = Math.floor(index / REVERSI_SIZE);
  const column = index % REVERSI_SIZE;
  const flips: number[] = [];
  for (const [dr, dc] of ALL_DIRECTIONS) {
    const line: number[] = [];
    let r = row + dr;
    let c = column + dc;
    // Walk outward: opponent discs accumulate; an own disc closes the line
    // and commits the flips; an empty square or the board edge discards it.
    while (r >= 0 && r < REVERSI_SIZE && c >= 0 && c < REVERSI_SIZE) {
      const cellIndex = r * REVERSI_SIZE + c;
      const cell = board[cellIndex];
      if (cell === null) break;
      if (cell === disc) {
        flips.push(...line);
        break;
      }
      line.push(cellIndex);
      r += dr;
      c += dc;
    }
  }
  return flips;
}

/** True when placing `disc` on `index` flips at least one opponent disc. */
export function isLegalMove(board: ReversiBoard, index: number, disc: ReversiDisc): boolean {
  return flipsFor(board, index, disc).length > 0;
}

/** All legal placements for `disc`, as board indexes in reading order. */
export function legalMoves(board: ReversiBoard, disc: ReversiDisc): number[] {
  const moves: number[] = [];
  for (let index = 0; index < REVERSI_CELLS; index += 1) {
    if (isLegalMove(board, index, disc)) moves.push(index);
  }
  return moves;
}

export function applyMove(
  board: ReversiBoard,
  index: number,
  disc: ReversiDisc,
): { board: ReversiBoard; flips: number[] } | null {
  const flips = flipsFor(board, index, disc);
  if (flips.length === 0) return null;
  const next = [...board];
  next[index] = disc;
  for (const flip of flips) next[flip] = disc;
  return { board: next, flips };
}

export function discCounts(board: ReversiBoard): { black: number; white: number } {
  let black = 0;
  let white = 0;
  for (const cell of board) {
    if (cell === 'black') black += 1;
    else if (cell === 'white') white += 1;
  }
  return { black, white };
}

/**
 * The game ends when the board is full or neither player has a legal move.
 */
export function isGameOver(board: ReversiBoard): boolean {
  if (board.every((cell) => cell !== null)) return true;
  return legalMoves(board, 'black').length === 0 && legalMoves(board, 'white').length === 0;
}

/** Winner by disc count, or null on an exact tie. */
export function leadingDisc(board: ReversiBoard): ReversiDisc | null {
  const { black, white } = discCounts(board);
  if (black === white) return null;
  return black > white ? 'black' : 'white';
}

/** Square notation for accessible labels, e.g. "d4" or "h8". */
export function squareName(index: number): string {
  const row = Math.floor(index / REVERSI_SIZE);
  const column = index % REVERSI_SIZE;
  return `${String.fromCharCode(97 + column)}${REVERSI_SIZE - row}`;
}

/** Black is Player 1; white is Player 2. */
export function discToPlayer(disc: ReversiDisc): 1 | 2 {
  return disc === 'black' ? 1 : 2;
}
