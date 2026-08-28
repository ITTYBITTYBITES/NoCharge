import { describe, expect, it } from 'vitest';
import { GOMOKU_SIZE, newBoard, newGame, placeStone, winningLineFor } from './engine';

function rowOfFive(state: ReturnType<typeof newGame>) {
  let next = state;
  // Black plays consecutive cells in row 7; White plays separated cells.
  for (let i = 0; i < 5; i += 1) {
    next = placeStone(next, 7, 3 + i); // black
    if (i < 4) next = placeStone(next, 0, i * 2); // white, never five in a row
  }
  return next;
}

describe('gomoku engine', () => {
  it('starts with an empty 15×15 board and player 1 to move', () => {
    const state = newGame();
    expect(state.board.flat().every((cell) => cell === 0)).toBe(true);
    expect(state.turn).toBe(1);
    expect(state.status).toBe('playing');
  });

  it('rejects an occupied cell and keeps the turn', () => {
    let state = newGame();
    state = placeStone(state, 7, 7);
    const rejected = placeStone(state, 7, 7);
    expect(rejected.moves).toBe(1);
    expect(rejected.turn).toBe(2);
  });

  it('wins on five in a row', () => {
    const state = rowOfFive(newGame());
    expect(state.status).toBe('won');
    expect(state.winner).toBe(1);
    expect(state.winningLine).toHaveLength(5);
  });

  it('finds diagonal lines', () => {
    const board = newBoard();
    for (let i = 0; i < 5; i += 1) board[i]![i] = 1;
    expect(winningLineFor(board, 4, 4)).not.toBeNull();
  });

  it('tracks the board size constant', () => {
    expect(GOMOKU_SIZE).toBe(15);
  });
});
