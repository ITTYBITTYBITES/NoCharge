import { describe, expect, it } from 'vitest';
import {
  MATCH_MAX_ROUNDS,
  MATCH_TARGET,
  TIC_TAC_TOE_SIZES,
  cellName,
  findWinner,
  isBoardFull,
  isMatchOver,
  markToPlayer,
  matchWinner,
  nextMark,
  openingMarkForRound,
  placeMark,
  winningLines,
  type TicTacToeBoard,
} from './engine';

describe('winning lines', () => {
  it('builds rows, columns, and both diagonals for each supported size', () => {
    expect(winningLines(3)).toHaveLength(8);
    expect(winningLines(4)).toHaveLength(10);
    for (const size of TIC_TAC_TOE_SIZES) {
      const cells = new Set(winningLines(size).flat());
      expect(cells.size).toBe(size * size);
    }
  });

  it('does not build lines for match-3 play on a 4×4 board', () => {
    // The win length is the board size: 4×4 requires 4 in a row.
    const lines = winningLines(4);
    expect(lines.every((line) => line.length === 4)).toBe(true);
  });
});

describe('findWinner', () => {
  it('detects a completed row on 3×3', () => {
    const board: TicTacToeBoard = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
    expect(findWinner(board, 3)).toEqual({ mark: 'X', line: [0, 1, 2] });
  });

  it('detects a column and a diagonal', () => {
    const column: TicTacToeBoard = [null, 'O', 'X', null, 'O', 'X', null, 'O', null];
    expect(findWinner(column, 3)?.line).toEqual([1, 4, 7]);
    const diagonal: TicTacToeBoard = ['X', 'O', null, null, 'X', 'O', null, null, 'X'];
    expect(findWinner(diagonal, 3)?.line).toEqual([0, 4, 8]);
  });

  it('requires the full length on 4×4 — three in a row is not a win', () => {
    const board: TicTacToeBoard = [
      'X', 'X', 'X', null,
      null, null, null, null,
      null, null, null, null,
      null, null, null, null,
    ];
    expect(findWinner(board, 4)).toBeNull();
    const won: TicTacToeBoard = [
      'O', 'X', 'X', 'X',
      null, null, null, 'X',
      null, null, null, 'X',
      null, null, null, 'X',
    ];
    expect(findWinner(won, 4)).toEqual({ mark: 'X', line: [3, 7, 11, 15] });
  });

  it('returns null mid-game and on a draw', () => {
    const draw: TicTacToeBoard = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(findWinner(draw, 3)).toBeNull();
    expect(isBoardFull(draw)).toBe(true);
    expect(isBoardFull(Array<TicTacToeBoard[number]>(9).fill(null))).toBe(false);
  });
});

describe('placeMark', () => {
  it('places on empty cells and refuses taken or out-of-range cells', () => {
    const board: TicTacToeBoard = ['X', null, null, null, null, null, null, null, null];
    expect(placeMark(board, 4, 'O')).toEqual(['X', null, null, null, 'O', null, null, null, null]);
    expect(placeMark(board, 0, 'O')).toBeNull();
    expect(placeMark(board, -1, 'O')).toBeNull();
    expect(placeMark(board, 9, 'O')).toBeNull();
  });

  it('never mutates the existing board', () => {
    const board: TicTacToeBoard = [null, null, null];
    placeMark(board, 0, 'X');
    expect(board[0]).toBeNull();
  });
});

describe('marks, players, and labels', () => {
  it('alternates marks', () => {
    expect(nextMark('X')).toBe('O');
    expect(nextMark('O')).toBe('X');
  });

  it('maps X to Player 1 and O to Player 2', () => {
    expect(markToPlayer('X')).toBe(1);
    expect(markToPlayer('O')).toBe(2);
  });

  it('names cells by one-based row and column', () => {
    expect(cellName(0, 3)).toBe('Row 1, Column 1');
    expect(cellName(5, 3)).toBe('Row 2, Column 3');
    expect(cellName(15, 4)).toBe('Row 4, Column 4');
  });
});

describe('match mode', () => {
  it('targets three round wins within five rounds', () => {
    expect(MATCH_TARGET).toBe(3);
    expect(MATCH_MAX_ROUNDS).toBe(5);
  });

  it('awards the match at the target and keeps 2–2 undecided', () => {
    expect(matchWinner([3, 1])).toBe('X');
    expect(matchWinner([2, 3])).toBe('O');
    expect(matchWinner([2, 2])).toBeNull();
    expect(matchWinner([0, 0])).toBeNull();
  });

  it('ends on the target or after five rounds', () => {
    expect(isMatchOver([3, 0], 3)).toBe(true);
    expect(isMatchOver([2, 2], 4)).toBe(false);
    expect(isMatchOver([2, 2], 5)).toBe(true);
    expect(isMatchOver([0, 0], 5)).toBe(true);
  });

  it('alternates the opening mark each round', () => {
    expect(openingMarkForRound(1)).toBe('X');
    expect(openingMarkForRound(2)).toBe('O');
    expect(openingMarkForRound(3)).toBe('X');
    expect(openingMarkForRound(5)).toBe('X');
  });
});
