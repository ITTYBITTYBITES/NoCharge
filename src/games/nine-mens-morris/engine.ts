/**
 * Nine Men's Morris rules for the NoCharge Pass & Play edition.
 *
 * Pure functions only. Standard 24-point board: 9 stones per player, placement
 * phase, mill scoring (remove one opponent stone), flying phase when a player
 * has 3 stones, and a player with no legal move loses. A stone in a complete
 * mill may be removed only when no other opponent stone is available. The
 * variant is documented in the guide.
 */

export const MORRIS_POINTS = 24;
export const MORRIS_STONES = 9;

export type MorrisPlayer = 1 | 2;
export type MorrisPhase = 'placing' | 'moving' | 'flying' | 'won';

export interface MorrisGame {
  board: number[];
  turn: MorrisPlayer;
  phase: MorrisPhase;
  hand: [number, number];
  winner: MorrisPlayer | null;
  selected: number | null;
  legal: number[];
  removalPending: boolean;
  moves: number;
}

/**
 * Classic mill board geometry. Ring points are numbered clockwise from the
 * top-left corner: outer 0–7, middle 8–15, inner 16–23. Corners have ring
 * neighbours only; midpoints add the straight connector to the next ring.
 */
export const MILLS: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [8, 9, 10], [16, 17, 18],
  [4, 5, 6], [12, 13, 14], [20, 21, 22],
  [0, 7, 6], [8, 15, 14], [16, 23, 22],
  [2, 3, 4], [10, 11, 12], [18, 19, 20],
];

export const ADJACENCY: readonly (readonly number[])[] = [
  [1, 7], [0, 2, 9], [1, 3], [2, 4, 11], [3, 5], [4, 6, 13], [5, 7], [6, 0, 15],
  [9, 15], [8, 10, 17], [9, 11], [10, 12, 19], [11, 13], [12, 14, 21], [13, 15], [14, 8, 23],
  [17, 23], [16, 18], [17, 19], [18, 20], [19, 21], [20, 22], [21, 23], [22, 16],
];

export function newGame(): MorrisGame {
  return {
    board: Array.from({ length: MORRIS_POINTS }, () => 0),
    turn: 1,
    phase: 'placing',
    hand: [MORRIS_STONES, MORRIS_STONES],
    winner: null,
    selected: null,
    legal: [],
    removalPending: false,
    moves: 0,
  };
}

export function otherPlayer(player: MorrisPlayer): MorrisPlayer {
  return player === 1 ? 2 : 1;
}

export function isMillAt(board: number[], points: readonly [number, number, number], player: number): boolean {
  return points.every((point) => board[point] === player);
}

export function completesMill(board: number[], point: number, player: number): boolean {
  return MILLS.some((mill) => mill.includes(point) && isMillAt(board, mill, player));
}

export function opponentStones(board: number[], player: MorrisPlayer): number[] {
  const opponent = otherPlayer(player);
  return board.flatMap((stone, index) => (stone === opponent ? [index] : []));
}

export function removableStones(board: number[], player: MorrisPlayer): number[] {
  const opponent = otherPlayer(player);
  const stones = opponentStones(board, player);
  if (stones.length === 0) return [];
  const nonMill = stones.filter((index) => !MILLS.some((mill) => mill.includes(index) && isMillAt(board, mill, opponent)));
  return nonMill.length ? nonMill : stones;
}

function emptyNeighbours(board: number[], point: number): number[] {
  if (point < 0 || point >= MORRIS_POINTS) return [];
  return ADJACENCY[point]!.filter((next) => board[next] === 0);
}

function allEmpty(board: number[]): number[] {
  return board.flatMap((stone, index) => (stone === 0 ? [index] : []));
}

/** Every point the active player could legally move to (or empty for placement). */
export function legalTargets(game: MorrisGame): number[] {
  if (game.phase === 'placing') return [];
  if (game.selected === null) return [];
  if (game.board[game.selected] !== game.turn) return [];
  const own = game.board.filter((stone) => stone === game.turn).length;
  if (own <= 3) return allEmpty(game.board);
  return emptyNeighbours(game.board, game.selected);
}

/** True when the active player has at least one legal move from anywhere. */
export function hasAnyMove(game: MorrisGame): boolean {
  if (game.phase === 'placing') return game.hand[game.turn - 1] > 0;
  const own = game.board.flatMap((stone, index) => (stone === game.turn ? [index] : []));
  if (own.length === 0) return false;
  if (own.length <= 3) return allEmpty(game.board).length > 0;
  return own.some((point) => emptyNeighbours(game.board, point).length > 0);
}

export function placeStone(game: MorrisGame, point: number): MorrisGame {
  if (game.phase !== 'placing' || game.winner || game.removalPending || game.board[point] !== 0) return game;
  if (game.hand[game.turn - 1] === 0) return game;
  const board = game.board.slice();
  board[point] = game.turn;
  const hand: [number, number] = [...game.hand];
  hand[game.turn - 1] -= 1;
  if (completesMill(board, point, game.turn)) {
    return { ...game, board, hand, moves: game.moves + 1, removalPending: true, selected: null, legal: [] };
  }
  return advanceTurn({ ...game, board, hand, moves: game.moves + 1 });
}

export function removeStone(game: MorrisGame, point: number): MorrisGame {
  if (!game.removalPending || game.phase === 'won' || game.winner) return game;
  if (!removableStones(game.board, game.turn).includes(point)) return game;
  const board = game.board.slice();
  board[point] = 0;
  const opponent = otherPlayer(game.turn);
  if (board.filter((stone) => stone === opponent).length < 3) {
    return { ...game, board, removalPending: false, phase: 'won', winner: game.turn, selected: null, legal: [] };
  }
  return advanceTurn({ ...game, board, removalPending: false, selected: null, legal: [] });
}

function phaseAfter(game: MorrisGame, turn: MorrisPlayer): MorrisPhase {
  if (game.phase === 'placing') {
    return game.hand[turn - 1] === 0 ? 'moving' : 'placing';
  }
  const own = game.board.filter((stone) => stone === turn).length;
  return own <= 3 ? 'flying' : 'moving';
}

function advanceTurn(game: MorrisGame): MorrisGame {
  const turn = otherPlayer(game.turn);
  const next: MorrisGame = { ...game, turn, phase: phaseAfter(game, turn), selected: null, legal: [] };
  // A player with no moves in the moving/flying phase loses immediately.
  if (next.phase === 'moving' || next.phase === 'flying') {
    if (!hasAnyMove(next)) return { ...next, phase: 'won', winner: turn === 1 ? 2 : 1 };
  }
  return next;
}

export function select(game: MorrisGame, point: number): MorrisGame {
  if (game.removalPending || game.winner || game.phase === 'placing' || game.phase === 'won') return game;
  const hasOwn = game.board[point] === game.turn;
  if (hasOwn) {
    const own = game.board.filter((stone) => stone === game.turn).length;
    const targets = own <= 3 ? allEmpty(game.board) : emptyNeighbours(game.board, point);
    return { ...game, selected: point, legal: targets };
  }
  return { ...game, selected: null, legal: [] };
}

export function moveStone(game: MorrisGame, from: number, to: number): MorrisGame {
  if (game.winner || game.removalPending) return game;
  if (game.phase !== 'moving' && game.phase !== 'flying') return game;
  if (game.board[from] !== game.turn || game.board[to] !== 0) return game;
  const own = game.board.filter((stone) => stone === game.turn).length;
  const legalMove = own <= 3 || emptyNeighbours(game.board, from).includes(to);
  if (!legalMove) return game;
  const board = game.board.slice();
  board[from] = 0;
  board[to] = game.turn;
  if (completesMill(board, to, game.turn)) {
    return { ...game, board, moves: game.moves + 1, removalPending: true, selected: null, legal: [] };
  }
  return advanceTurn({ ...game, board, moves: game.moves + 1, selected: null, legal: [] });
}

export function playerName(player: MorrisPlayer, p1: string, p2: string): string {
  return player === 1 ? p1 : p2;
}

export function pointName(index: number): string {
  const label = String.fromCharCode(65 + (index % 8));
  const ring = ['outer', 'middle', 'inner'][Math.floor(index / 8)] ?? 'outer';
  return `${ring} ring, marker ${label}`;
}
