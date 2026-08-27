import { describe, expect, it } from 'vitest';
import { captureTargets, hasAnyCapture, makeMove, newBoard, newGame, simpleTargets, CHECKERS_PIECES, CHECKERS_SIZE } from './engine';

describe('checkers engine', () => {
  it('sets up 12 pieces per player on dark squares', () => {
    const game = newGame();
    expect(game.board.filter((cell) => cell === 'm1')).toHaveLength(CHECKERS_PIECES);
    expect(game.board.filter((cell) => cell === 'm2')).toHaveLength(CHECKERS_PIECES);
    expect(game.board).toHaveLength(CHECKERS_SIZE * CHECKERS_SIZE);
    expect(game.turn).toBe(1);
  });

  it('moves a man forward diagonally', () => {
    let game = newGame();
    const board = newBoard();
    board[8] = 'm1';
    board[17] = null;
    const state = { ...game, board };
    expect(simpleTargets(board, 8)).toContain(17);
    game = makeMove(state, 8, 17);
    expect(game.board[17]).toBe('m1');
    expect(game.board[8]).toBeNull();
    expect(game.turn).toBe(2);
  });

  it('forces a capture when available', () => {
    const game = newGame();
    const board = newBoard();
    board[8] = 'm1';   // row 1 col 0
    board[17] = 'm2';  // row 2 col 1
    board[26] = null;  // row 3 col 2
    const state = { ...game, board };
    expect(hasAnyCapture(board, 1)).toBe(true);
    const rejected = makeMove(state, 8, 17);
    expect(rejected).toBe(state);
    const jump = makeMove(state, 8, 26, [17]);
    expect(jump.board[26]).toBe('m1');
    expect(jump.board[17]).toBeNull();
    expect(jump.board[8]).toBeNull();
    expect(jump.turn).toBe(2);
  });

  it('promotes a man at the last row', () => {
    const game = newGame();
    const board = newBoard();
    board[49] = 'm1';  // row 6 col 1
    board[58] = null;  // row 7 col 2
    const state = { ...game, board };
    const next = makeMove(state, 49, 58);
    expect(next.board[58]).toBe('k1');
  });

  it('continues multi-jumps on the same turn', () => {
    const game = newGame();
    const board = newBoard();
    board[35] = 'k1';  // row 4 col 3
    board[26] = 'm2';  // row 3 col 2
    board[10] = 'm2';  // row 1 col 2
    board[17] = null;  // row 2 col 1
    board[3] = null;   // row 0 col 3
    const chain = { ...game, board, mustCapture: true };
    const first = makeMove(chain, 35, 17, [26]);
    expect(first.board[17]).toBe('k1');
    expect(first.turn).toBe(1); // multi-jump continues
    const second = makeMove(first, 17, 3, [10]);
    expect(second.board[3]).toBe('k1');
    expect(second.board[10]).toBeNull();
    expect(second.turn).toBe(2);
  });

  it('exposes capture targets', () => {
    const board = newBoard();
    board[8] = 'm1';
    board[17] = 'm2';
    board[26] = null;
    expect(captureTargets(board, 8)).toEqual([{ to: 26, captured: 17 }]);
  });
});
