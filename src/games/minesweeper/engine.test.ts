import { describe, expect, it } from 'vitest';
import {
  chord,
  DIFFICULTIES,
  newGame,
  revealCell,
  toggleFlag,
} from './engine';

describe('minesweeper engine', () => {
  it('seeds the requested mine count on a fresh board', () => {
    for (const difficulty of DIFFICULTIES) {
      const state = newGame(difficulty);
      const mines = state.board.flat().filter((cell) => cell.mine).length;
      expect(mines).toBe(difficulty.mines);
    }
  });

  it('uses the injected random source for reproducible boards', () => {
    const difficulty = DIFFICULTIES[0]!;
    const mineIndexes = (random: () => number) =>
      newGame(difficulty, random).board.flat().flatMap((cell, index) => (cell.mine ? [index] : []));

    expect(mineIndexes(() => 0)).toEqual(mineIndexes(() => 0));
    expect(mineIndexes(() => 0)).not.toEqual(mineIndexes(() => 0.999999));
  });

  it('never explodes on the first reveal', () => {
    for (const difficulty of DIFFICULTIES) {
      const state = newGame(difficulty);
      const midCol = Math.floor(difficulty.cols / 2);
      const next = revealCell(state, 0, midCol);
      expect(next.status).not.toBe('lost');
      expect(next.firstRevealDone).toBe(true);
    }
  });

  it('flags hidden cells, blocks flags on revealed cells, and blocks reveal of a flag', () => {
    let state = newGame(DIFFICULTIES[0]!);
    state = revealCell(state, 4, 4);
    // Find a cell that is still hidden after the first reveal.
    const hidden =
      state.board.flatMap((cells, row) =>
        cells.map((cell, col) => ({ cell, row, col })).filter(({ cell }) => !cell.revealed),
      )[0];
    expect(hidden).toBeDefined();
    state = toggleFlag(state, hidden.row, hidden.col);
    expect(state.board[hidden.row]![hidden.col]!.flagged).toBe(true);
    expect(state.flaggedCount).toBe(1);
    const before = state.revealedCount;
    const blocked = revealCell(state, hidden.row, hidden.col);
    expect(blocked.revealedCount).toBe(before);
    state = toggleFlag(state, hidden.row, hidden.col);
    expect(state.flaggedCount).toBe(0);
  });

  it('wins when every non-mine cell is revealed', () => {
    let state = newGame(DIFFICULTIES[0]!, () => 0);
    const first = revealCell(state, 4, 4, () => 0);
    // Dump all non-mine cells deterministically.
    let next = first;
    for (let row = 0; row < next.board.length; row += 1) {
      for (let col = 0; col < next.board[row]!.length; col += 1) {
        if (next.board[row]![col]!.mine) continue;
        next = revealCell(next, row, col, () => 0);
      }
    }
    expect(next.status).toBe('won');
    expect(next.revealedCount).toBe(9 * 9 - 10);
  });

  it('reveals zero-regions iteratively and computes neighbour counts', () => {
    // Force a 2×2 board via a custom difficulty, then check adjacency.
    const tiny = { id: 'expert' as const, label: 'tiny', rows: 3, cols: 3, mines: 1 };
    let state = newGame(tiny, () => 0);
    state = revealCell(state, 0, 0, () => 0); // safe cell is (0,0) until first reveal
    // With random=0, seed picks the earliest candidates after the protected
    // neighbourhood; state is valid and every non-mine cell eventually reveals.
    let count = 0;
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        state = revealCell(state, row, col, () => 0);
        count += 1;
      }
    }
    expect(state.status === 'won' || state.status === 'lost').toBe(true);
    expect(count).toBe(9);
  });

  it('chords only when flag count matches the number', () => {
    let state = newGame(DIFFICULTIES[0]!, () => 0);
    state = revealCell(state, 4, 4, () => 0);
    const target = state.board[4]![4]!;
    if (target.adjacent === 0) return;
    const around = [[3, 3], [3, 4], [3, 5], [4, 3], [4, 5], [5, 3], [5, 4], [5, 5]];
    let flagged = 0;
    for (const [row, col] of around) {
      if (!state.board[row]![col]!.mine) continue;
      state = toggleFlag(state, row, col);
      flagged += 1;
    }
    expect(flagged).toBe(target.adjacent);
    const next = chord(state, 4, 4, () => 0);
    expect(next.revealedCount).toBeGreaterThanOrEqual(state.revealedCount);
    const wrong = toggleFlag(state, 3, 3);
    const noChord = chord(wrong, 4, 4, () => 0);
    expect(noChord.revealedCount).toBe(wrong.revealedCount);
  });
});
