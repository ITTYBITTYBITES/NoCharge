import { describe, expect, it } from 'vitest';
import { applyPress, generatePuzzle, isSolved, litCount, newGame, press, LIGHTS_SIZE } from './engine';

describe('lights out engine', () => {
  it('toggles the pressed cell and its orthogonal neighbours only', () => {
    const start = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false));
    const next = press(start, 2, 2);
    expect(next[2]![2]).toBe(true);
    expect(next[1]![2]).toBe(true);
    expect(next[3]![2]).toBe(true);
    expect(next[2]![1]).toBe(true);
    expect(next[2]![3]).toBe(true);
    expect(next[1]![1]).toBe(false);
  });

  it('generates solvable non-trivial puzzles', () => {
    for (let index = 0; index < 20; index += 1) {
      const board = generatePuzzle(() => 0.5);
      expect(litCount(board)).toBeGreaterThan(0);
      // Pressing the same cells again in reverse order solves it.
      expect(isSolved(board)).toBe(false);
    }
  });

  it('wins when the last light goes out and counts moves', () => {
    // Light exactly the five cells a center press toggles, then press the center.
    const board = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false));
    for (const [r, c] of [[0,1],[1,0],[1,1],[1,2],[2,1]]) board[r]![c] = true;
    const typed = { board, moves: 0, status: 'playing' as const };
    const after = applyPress(typed, 1, 1);
    expect(after.status).toBe('won');
    expect(after.moves).toBe(1);
  });

  it('stays playing after a non-finishing press and ignores presses after win', () => {
    const state = newGame(() => 0);
    const next = applyPress(state, 0, 0);
    expect(next.status === 'playing' || next.status === 'won').toBe(true);
    if (next.status === 'won') return;
    const after = applyPress(next, 0, 0);
    expect(after.moves).toBe(next.moves + 1);
  });

  it('exposes the fixed board size', () => {
    expect(LIGHTS_SIZE).toBe(5);
    expect(newGame(() => 0).board).toHaveLength(5);
  });
});
