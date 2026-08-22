import { describe, expect, it } from 'vitest';
import {
  FOUR_IN_A_ROW_SIZES,
  cellName,
  dropDisc,
  emptyBoard,
  findWinFrom,
  isBoardFull,
  landingRow,
  openingPlayerForGame,
  otherFourPlayer,
} from './engine';

describe('board sizes', () => {
  it('offers the standard 7×6 board and the small 6×5 board', () => {
    expect(FOUR_IN_A_ROW_SIZES).toEqual([
      { cols: 7, rows: 6, label: '7×6 · standard' },
      { cols: 6, rows: 5, label: '6×5 · small' },
    ]);
  });
});

describe('dropping discs', () => {
  it('starts empty and lands discs in the lowest row first', () => {
    const board = emptyBoard(7, 6);
    expect(landingRow(board, 3)).toBe(5);
    const first = dropDisc(board, 3, 1);
    expect(first?.row).toBe(5);
    expect(first?.board.cells[5 * 7 + 3]).toBe(1);
    expect(landingRow(first!.board, 3)).toBe(4);
    const second = dropDisc(first!.board, 3, 2);
    expect(second?.row).toBe(4);
  });

  it('stacks upward within a column and refuses full columns', () => {
    let board = emptyBoard(6, 5);
    for (let i = 0; i < 5; i += 1) {
      const next = dropDisc(board, 0, (i % 2 === 0 ? 1 : 2));
      expect(next).not.toBeNull();
      board = next!.board;
    }
    expect(landingRow(board, 0)).toBeNull();
    expect(dropDisc(board, 0, 1)).toBeNull();
    expect(landingRow(board, 1)).toBe(4);
  });

  it('rejects columns outside the board', () => {
    const board = emptyBoard(7, 6);
    expect(dropDisc(board, -1, 1)).toBeNull();
    expect(dropDisc(board, 7, 1)).toBeNull();
  });

  it('never mutates the existing board', () => {
    const board = emptyBoard(7, 6);
    dropDisc(board, 2, 1);
    expect(board.cells.every((cell) => cell === null)).toBe(true);
  });
});

describe('win detection', () => {
  it('detects a vertical four through the newest disc', () => {
    let board = emptyBoard(7, 6);
    for (let i = 0; i < 3; i += 1) board = dropDisc(board, 2, 1)!.board;
    const final = dropDisc(board, 2, 1)!;
    const win = findWinFrom(final.board, final.row, 2);
    expect(win?.player).toBe(1);
    expect(win?.cells).toEqual([2 + 7 * 2, 2 + 7 * 3, 2 + 7 * 4, 2 + 7 * 5]);
  });

  it('detects horizontal and diagonal fours', () => {
    let board = emptyBoard(7, 6);
    // Build a diagonal of player 1 discs at (5,0),(4,1),(3,2),(2,3) by
    // stacking filler discs for player 2 underneath each one.
    const fillersBelow = [0, 1, 2, 3];
    for (let c = 0; c < 4; c += 1) {
      for (let i = 0; i < fillersBelow[c]!; i += 1) board = dropDisc(board, c, 2)!.board;
    }
    for (let c = 0; c < 4; c += 1) board = dropDisc(board, c, 1)!.board;
    const win = findWinFrom(board, 2, 3);
    expect(win?.player).toBe(1);
    expect(win?.cells.length).toBe(4);

    // Horizontal four for player 2 along the top row of a small board.
    let small = emptyBoard(6, 5);
    for (let c = 0; c < 6; c += 1) {
      small = dropDisc(small, c, c % 2 === 0 ? 2 : 1)!.board;
    }
    for (const c of [0, 2, 4]) small = dropDisc(small, c, 2)!.board;
    for (const c of [1, 3, 5]) small = dropDisc(small, c, 1)!.board;
    for (const c of [0, 1, 2, 3]) small = dropDisc(small, c, 2)!.board;
    const topRow = 5 - 3;
    const horizontal = findWinFrom(small, topRow, 3);
    expect(horizontal?.player).toBe(2);
    expect(horizontal?.cells).toEqual([topRow * 6 + 0, topRow * 6 + 1, topRow * 6 + 2, topRow * 6 + 3]);
  });

  it('does not report three in a row', () => {
    let board = emptyBoard(7, 6);
    for (let i = 0; i < 3; i += 1) board = dropDisc(board, i, 1)!.board;
    expect(findWinFrom(board, 5, 2)).toBeNull();
  });

  it('ignores wins that do not include the newest disc', () => {
    let board = emptyBoard(7, 6);
    for (let i = 0; i < 4; i += 1) board = dropDisc(board, i, 1)!.board;
    const next = dropDisc(board, 6, 2)!;
    expect(findWinFrom(next.board, next.row, 6)).toBeNull();
  });
});

describe('full board and labels', () => {
  it('knows when the board is full', () => {
    let board = emptyBoard(4, 2);
    const order: [number, number][] = [
      [0, 1], [0, 2],
      [1, 1], [1, 2],
      [2, 2], [2, 1],
      [3, 1], [3, 2],
    ];
    for (const [col, player] of order) board = dropDisc(board, col, player as 1 | 2)!.board;
    expect(isBoardFull(board)).toBe(true);
    expect(landingRow(board, 0)).toBeNull();
  });

  it('labels cells one-based and alternates players', () => {
    expect(cellName(0, 0)).toBe('Row 1, Column 1');
    expect(cellName(4, 6)).toBe('Row 5, Column 7');
    expect(otherFourPlayer(1)).toBe(2);
    expect(otherFourPlayer(2)).toBe(1);
    expect(openingPlayerForGame(1)).toBe(1);
    expect(openingPlayerForGame(2)).toBe(2);
    expect(openingPlayerForGame(3)).toBe(1);
  });
});
