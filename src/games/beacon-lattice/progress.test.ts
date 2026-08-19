import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { defaultProgress, loadProgress, recordSolve, saveProgress } from './progress';
import { PUZZLES } from './puzzles';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    },
  });
});

afterEach(() => {
  memory.clear();
});

describe('progress persistence', () => {
  test('records best without worsening after a later worse solve', () => {
    let progress = defaultProgress();
    progress = recordSolve(progress, PUZZLES[0]!.id, 1);
    progress = recordSolve(progress, PUZZLES[0]!.id, 4);
    expect(progress.bests[PUZZLES[0]!.id]).toBe(1);
    expect(progress.lastSolved[PUZZLES[0]!.id]).toBe(4);
    expect(progress.completed).toEqual([PUZZLES[0]!.id]);
  });

  test('round-trips through local storage helpers', () => {
    const progress = recordSolve(defaultProgress(), PUZZLES[1]!.id, 2);
    saveProgress(progress);
    const loaded = loadProgress();
    expect(loaded.completed).toContain(PUZZLES[1]!.id);
    expect(loaded.bests[PUZZLES[1]!.id]).toBe(2);
  });
});
