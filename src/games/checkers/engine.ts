/**
 * Checkers (English draughts) rules for the NoCharge Pass & Play edition.
 *
 * Pure functions only. Variant documented in the guide:
 * - 8×8 board, 12 pieces per player on the dark squares.
 * - Men move one diagonal forward; Kings move one diagonal in any direction.
 * - Jumps are mandatory when available; a capture that continues (multi-jump)
 *   keeps the same turn.
 * - Simple rule for jump selection: any legal capture may be taken; the game
 *   does not enforce "must take the longest sequence".
 * - No flying kings; no captures of your own pieces.
 */

export const CHECKERS_SIZE = 8;
export const CHECKERS_PIECES = 12;

export type CheckersPlayer = 1 | 2;
export type CheckersPiece = 'm1' | 'k1' | 'm2' | 'k2';
export type CheckersCell = CheckersPiece | null;

export interface Move {
  from: number;
  to: number;
  /** Index of each captured square in order, empty for a simple move. */
  captures: number[] | null;
}

export interface CheckersState {
  board: CheckersCell[];
  turn: CheckersPlayer;
  status: 'playing' | 'won';
  winner: CheckersPlayer | null;
  /** All captures are mandatory when any exist; UI only offers legal moves. */
  mustCapture: boolean;
  moves: number;
}

export function newBoard(): CheckersCell[] {
  const board: CheckersCell[] = Array.from({ length: CHECKERS_SIZE * CHECKERS_SIZE }, () => null);
  for (let row = 0; row < CHECKERS_SIZE; row += 1) {
    for (let col = 0; col < CHECKERS_SIZE; col += 1) {
      const index = row * CHECKERS_SIZE + col;
      const isDark = (row + col) % 2 === 1;
      if (!isDark) continue;
      if (row < 3) board[index] = 'm1';
      else if (row > 4) board[index] = 'm2';
    }
  }
  return board;
}

export function newGame(): CheckersState {
  return { board: newBoard(), turn: 1, status: 'playing', winner: null, mustCapture: false, moves: 0 };
}

export function otherPlayer(player: CheckersPlayer): CheckersPlayer {
  return player === 1 ? 2 : 1;
}

export function piecePlayer(piece: CheckersPiece): CheckersPlayer {
  return piece.endsWith('1') ? 1 : 2;
}

export function isKing(piece: CheckersPiece): boolean {
  return piece.startsWith('k');
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < CHECKERS_SIZE && col >= 0 && col < CHECKERS_SIZE;
}

function indexOf(row: number, col: number): number {
  return row * CHECKERS_SIZE + col;
}

function rowsFor(player: CheckersPlayer): number[] {
  return player === 1 ? [1] : [-1];
}

/** Forward directions for a man; king adds the reverse. */
function directions(piece: CheckersPiece): [number, number][] {
  const forward = piecePlayer(piece) === 1 ? [1] : [-1];
  const dirs: [number, number][] = forward.flatMap((dr) => [[dr, -1], [dr, 1]] as [number, number][]);
  if (isKing(piece)) {
    const back = forward[0]! * -1;
    dirs.push([back, -1], [back, 1]);
  }
  return dirs;
}

/** All legal simple moves for a piece (empty destination). */
export function simpleTargets(board: CheckersCell[], index: number): number[] {
  const piece = board[index];
  if (!piece) return [];
  const row = Math.floor(index / CHECKERS_SIZE);
  const col = index % CHECKERS_SIZE;
  return directions(piece).flatMap(([dr, dc]) => {
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (!inBounds(nextRow, nextCol)) return [];
    const nextIndex = indexOf(nextRow, nextCol);
    return board[nextIndex] === null ? [nextIndex] : [];
  });
}

/** All single captures available from an index; each includes the captured square. */
export function captureTargets(board: CheckersCell[], index: number): { to: number; captured: number }[] {
  const piece = board[index];
  if (!piece) return [];
  const row = Math.floor(index / CHECKERS_SIZE);
  const col = index % CHECKERS_SIZE;
  return directions(piece).flatMap(([dr, dc]) => {
    const midRow = row + dr;
    const midCol = col + dc;
    const toRow = row + dr * 2;
    const toCol = col + dc * 2;
    if (!inBounds(midRow, midCol) || !inBounds(toRow, toCol)) return [];
    const midIndex = indexOf(midRow, midCol);
    const toIndex = indexOf(toRow, toCol);
    const mid = board[midIndex];
    if (mid === null || piecePlayer(mid) === piecePlayer(piece) || board[toIndex] !== null) return [];
    return [{ to: toIndex, captured: midIndex }];
  });
}

/** Does the player have any capture available anywhere? */
export function hasAnyCapture(board: CheckersCell[], player: CheckersPlayer): boolean {
  return board.some((piece, index) => {
    if (piece === null || piecePlayer(piece) !== player) return false;
    return captureTargets(board, index).length > 0;
  });
}

function applyMove(state: CheckersState, from: number, to: number, captures: number[]): CheckersState {
  if (state.status !== 'playing') return state;
  const board = state.board.slice();
  const piece = board[from];
  if (!piece) return state;
  const toRow = Math.floor(to / CHECKERS_SIZE);
  board[from] = null;
  let moved = piece;
  const kingRow = piecePlayer(piece) === 1 ? CHECKERS_SIZE - 1 : 0;
  if (!isKing(piece) && toRow === kingRow) moved = (piecePlayer(piece) === 1 ? 'k1' : 'k2') as CheckersPiece;
  board[to] = moved;
  for (const captured of captures) board[captured] = null;

  // Multi-jump: if the moving piece can capture again, same turn continues.
  if (captures.length > 0 && captureTargets(board, to).length > 0) {
    return { ...state, board, moves: state.moves + 1 };
  }

  const opponent = otherPlayer(piecePlayer(piece));
  const remaining = board.filter((cell) => cell !== null && piecePlayer(cell) === opponent).length;
  // A player blocks when they have pieces but no legal move (captures or simple).
  const opponentHasMove = board.some((cell, index) => {
    if (cell === null || piecePlayer(cell) !== opponent) return false;
    return captureTargets(board, index).length > 0 || simpleTargets(board, index).length > 0;
  });
  if (remaining === 0 || !opponentHasMove) {
    return { ...state, board, status: 'won', winner: piecePlayer(piece), moves: state.moves + 1 };
  }
  return {
    ...state,
    board,
    turn: opponent,
    status: 'playing',
    winner: null,
    mustCapture: hasAnyCapture(board, opponent),
    moves: state.moves + 1,
  };
}

/** Make a move. `captures` is empty for simple moves; multi-jumps call this with a single capture at a time. */
export function makeMove(state: CheckersState, from: number, to: number, captures: number[] = []): CheckersState {
  if (state.status !== 'playing' || state.board[from] === null || piecePlayer(state.board[from]!) !== state.turn) return state;
  const mustCapture = state.mustCapture || hasAnyCapture(state.board, state.turn);
  if (mustCapture) {
    const legal = captureTargets(state.board, from).find((capture) => capture.to === to);
    if (!legal) return state;
  } else if (!simpleTargets(state.board, from).includes(to)) {
    return state;
  }
  return applyMove(state, from, to, captures);
}

/** List one legal capture for a piece (UI uses this for one-at-a-time multi-jumps). */
export function firstCaptureFor(board: CheckersCell[], index: number, mustCapture: boolean): { to: number; captured: number } | null {
  if (!mustCapture) return null;
  const captures = captureTargets(board, index);
  return captures[0] ?? null;
}

export function cellName(index: number): string {
  const row = Math.floor(index / CHECKERS_SIZE) + 1;
  const col = (index % CHECKERS_SIZE) + 1;
  return `Row ${row}, Column ${col}`;
}
