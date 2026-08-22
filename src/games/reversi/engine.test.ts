import { describe, expect, it } from 'vitest';
import {
  REVERSI_CELLS,
  applyMove,
  discCounts,
  discToPlayer,
  initialBoard,
  isGameOver,
  isLegalMove,
  leadingDisc,
  legalMoves,
  otherDisc,
  squareName,
  type ReversiCell,
} from './engine';

describe('initial board', () => {
  it('uses the classic four-disc center start with black to move', () => {
    const board = initialBoard();
    expect(discCounts(board)).toEqual({ black: 2, white: 2 });
    expect(board[3 * 8 + 3]).toBe('black'); // d5
    expect(board[4 * 8 + 4]).toBe('black'); // e4
    expect(board[4 * 8 + 3]).toBe('white'); // d4
    expect(board[3 * 8 + 4]).toBe('white'); // e5
    expect(REVERSI_CELLS).toBe(64);
  });

  it('gives each player exactly the four standard opening squares', () => {
    expect(legalMoves(initialBoard(), 'black').sort((a, b) => a - b)).toEqual([20, 29, 34, 43]); // e6, f5, c4, d3
    expect(legalMoves(initialBoard(), 'white').sort((a, b) => a - b)).toEqual([19, 26, 37, 44]); // d6, c5, f4, e3
  });
});

describe('flip logic', () => {
  it('flips a single outflanked disc and updates counts', () => {
    const board = initialBoard();
    const applied = applyMove(board, 43, 'black'); // d3 outflanks white d4
    expect(applied).not.toBeNull();
    expect(applied!.flips).toEqual([35]);
    expect(applied!.board[43]).toBe('black');
    expect(applied!.board[35]).toBe('black');
    expect(discCounts(applied!.board)).toEqual({ black: 4, white: 1 });
  });

  it('rejects occupied cells, off-board indexes, and placements that flip nothing', () => {
    const board = initialBoard();
    expect(applyMove(board, 27, 'black')).toBeNull(); // occupied
    expect(applyMove(board, -1, 'black')).toBeNull();
    expect(applyMove(board, 64, 'black')).toBeNull();
    expect(applyMove(board, 0, 'black')).toBeNull(); // no outflank possible
    expect(isLegalMove(board, 0, 'black')).toBe(false);
  });

  it('flips several discs in one line but not unclosed lines', () => {
    const board: ReversiCell[] = Array.from({ length: 64 }, () => null);
    // Row 1: white plays b1 and outflanks black c1..e1, closing at f1.
    board[2] = 'black';
    board[3] = 'black';
    board[4] = 'black';
    board[5] = 'white';
    expect(applyMove(board, 1, 'white')!.flips).toEqual([2, 3, 4]);
    const open: ReversiCell[] = [...board];
    open[5] = null; // remove the closing white disc
    expect(applyMove(open, 1, 'white')).toBeNull();
  });

  it('flips in several directions from one placement', () => {
    const board: ReversiCell[] = Array.from({ length: 64 }, () => null);
    // White plays d3 (43). Down flips d4,d5 (closed by white d6); right
    // flips e3 (closed by white f3); up-left flips c4,d5-adjacent? — c4 and
    // d5 diagonal squares (closed by white at b5's line end).
    board[35] = 'black'; // d4
    board[27] = 'black'; // d5
    board[19] = 'white'; // d6 closes the down line
    board[44] = 'black'; // e3
    board[45] = 'white'; // f3 closes the right line
    board[34] = 'black'; // c4 on the up-left diagonal
    board[25] = 'black'; // b5 on the up-left diagonal
    board[16] = 'white'; // a6 closes the up-left diagonal
    const applied = applyMove(board, 43, 'white');
    expect(applied).not.toBeNull();
    expect(applied!.flips.sort((a, b) => a - b)).toEqual([25, 27, 34, 35, 44]);
  });

  it('never mutates the existing board', () => {
    const board = initialBoard();
    applyMove(board, 43, 'black');
    expect(discCounts(board)).toEqual({ black: 2, white: 2 });
    expect(board[43]).toBeNull();
  });
});

describe('game end', () => {
  it('ends when neither player can move even with empty squares', () => {
    // Only a1 is empty. Black surrounds it, so black cannot outflank there,
    // and white's single disc at e8 is on no line through a1, so white cannot
    // outflank anywhere either.
    const board: ReversiCell[] = Array.from({ length: 64 }, () => 'black' as ReversiCell);
    board[63] = null;
    board[4] = 'white';
    expect(isGameOver(board)).toBe(true);
    expect(legalMoves(board, 'black')).toEqual([]);
    expect(legalMoves(board, 'white')).toEqual([]);
  });

  it('ends when the board is full', () => {
    const full = Array.from({ length: 64 }, (_, i) => (i % 2 === 0 ? 'black' : 'white'));
    expect(isGameOver(full)).toBe(true);
  });

  it('continues while a player has a move', () => {
    expect(isGameOver(initialBoard())).toBe(false);
  });

  it('reports the leading disc and exact ties', () => {
    expect(leadingDisc(initialBoard())).toBeNull();
    const board = Array.from({ length: 64 }, (_, i) => (i < 40 ? 'black' : i < 60 ? 'white' : null));
    expect(leadingDisc(board)).toBe('black');
  });
});

describe('labels', () => {
  it('names squares in a1–h8 notation with row 1 at the bottom', () => {
    expect(squareName(0)).toBe('a8');
    expect(squareName(63)).toBe('h1');
    expect(squareName(43)).toBe('d3');
  });

  it('maps black to Player 1 and white to Player 2', () => {
    expect(discToPlayer('black')).toBe(1);
    expect(discToPlayer('white')).toBe(2);
    expect(otherDisc('black')).toBe('white');
  });
});
