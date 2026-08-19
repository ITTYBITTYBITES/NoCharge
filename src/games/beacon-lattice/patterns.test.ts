import { describe, expect, test } from 'vitest';

import { coverageCells, computeCoverage, coverageBand, isExactCover } from './coverage';
import {
  createState,
  placeBeacon,
  removeBeacon,
  replaceBeacon,
  restartPuzzle,
  selectType,
  undo,
} from './engine';
import { PUZZLES, getPuzzle } from './puzzles';
import { countSolutions } from './solver';
import type { PuzzleDefinition } from './types';

const mini = (overrides: Partial<PuzzleDefinition> = {}): PuzzleDefinition => ({
  id: 'mini',
  title: 'Mini',
  width: 3,
  height: 3,
  difficulty: 'intro',
  blocked: [],
  available: ['cross', 'diagonal', 'horizontal', 'vertical'],
  inventory: { cross: 4, diagonal: 4, horizontal: 4, vertical: 4 },
  locked: [],
  solution: [],
  par: 0,
  lesson: 'test',
  ...overrides,
});

describe('beacon patterns', () => {
  test('cross covers self and orthogonal neighbors', () => {
    const puzzle = mini();
    expect(coverageCells(puzzle, 'cross', { x: 1, y: 1 })).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 2 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
    ]);
  });

  test('diagonal covers self and diagonal neighbors', () => {
    const puzzle = mini();
    expect(coverageCells(puzzle, 'diagonal', { x: 1, y: 1 })).toHaveLength(5);
    expect(coverageCells(puzzle, 'diagonal', { x: 1, y: 1 })).toContainEqual({ x: 0, y: 0 });
  });

  test('horizontal and vertical are separate three-cell bars', () => {
    const puzzle = mini();
    expect(coverageCells(puzzle, 'horizontal', { x: 1, y: 1 })).toEqual([
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
    ]);
    expect(coverageCells(puzzle, 'vertical', { x: 1, y: 1 })).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 2 },
    ]);
  });

  test('pattern offsets outside the board are ignored', () => {
    const puzzle = mini();
    expect(coverageCells(puzzle, 'cross', { x: 0, y: 0 })).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ]);
  });

  test('blocked cells are excluded from coverage but do not stop other offsets', () => {
    const puzzle = mini({ blocked: [{ x: 1, y: 0 }] });
    expect(coverageCells(puzzle, 'cross', { x: 1, y: 1 })).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
    ]);
  });
});

describe('coverage and engine', () => {
  test('detects gap, exact, and overlap', () => {
    expect(coverageBand(0)).toBe('gap');
    expect(coverageBand(1)).toBe('exact');
    expect(coverageBand(2)).toBe('overlap');
  });

  test('invalid placement leaves state unchanged', () => {
    const puzzle = mini({ blocked: [{ x: 0, y: 0 }] });
    const state = createState(puzzle);
    const before = JSON.stringify(state.placements);
    expect(placeBeacon(state, puzzle, { x: 0, y: 0 }, 'cross').ok).toBe(false);
    expect(placeBeacon(state, puzzle, { x: 1, y: 1 }, 'cross').ok).toBe(true);
    const blocked = placeBeacon(state, puzzle, { x: 0, y: 0 }, 'cross');
    expect(blocked.ok).toBe(false);
    expect(JSON.stringify(state.placements)).not.toBe(before);
    const occupied = placeBeacon(state, puzzle, { x: 1, y: 1 }, 'horizontal');
    expect(occupied.ok).toBe(false);
    if (!occupied.ok) expect(occupied.reason).toBe('occupied');
  });

  test('inventory exhaustion and locked beacons', () => {
    const puzzle = mini({
      inventory: { cross: 1 },
      locked: [{ x: 2, y: 2, type: 'horizontal', locked: true }],
    });
    const state = createState(puzzle);
    expect(placeBeacon(state, puzzle, { x: 0, y: 1 }, 'cross').ok).toBe(true);
    const exhausted = placeBeacon(state, puzzle, { x: 2, y: 0 }, 'cross');
    expect(exhausted.ok).toBe(false);
    if (!exhausted.ok) expect(exhausted.reason).toBe('inventory-exhausted');
    const locked = removeBeacon(state, puzzle, { x: 2, y: 2 });
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.reason).toBe('locked-beacon');
  });

  test('restricted cells and types', () => {
    const puzzle = mini({
      allowedCells: [{ x: 1, y: 1 }],
      allowedTypesByCell: { '1,1': ['vertical'] },
    });
    const state = createState(puzzle);
    const notAllowed = placeBeacon(state, puzzle, { x: 0, y: 1 }, 'cross');
    expect(notAllowed.ok).toBe(false);
    if (!notAllowed.ok) expect(notAllowed.reason).toBe('placement-not-allowed');
    const wrongType = placeBeacon(state, puzzle, { x: 1, y: 1 }, 'cross');
    expect(wrongType.ok).toBe(false);
    if (!wrongType.ok) expect(wrongType.reason).toBe('type-not-allowed');
    expect(placeBeacon(state, puzzle, { x: 1, y: 1 }, 'vertical').ok).toBe(true);
  });

  test('undo, restart, and replace', () => {
    const puzzle = mini();
    const state = createState(puzzle);
    placeBeacon(state, puzzle, { x: 1, y: 1 }, 'cross');
    replaceBeacon(state, puzzle, { x: 1, y: 1 }, 'diagonal');
    expect(state.placements[0]?.type).toBe('diagonal');
    undo(state, puzzle);
    expect(state.placements[0]?.type).toBe('cross');
    restartPuzzle(state, puzzle);
    expect(state.placements).toEqual([]);
    const emptyUndo = undo(state, puzzle);
    expect(emptyUndo.ok).toBe(false);
    if (!emptyUndo.ok) expect(emptyUndo.reason).toBe('nothing-to-undo');
  });

  test('selecting an unavailable type fails', () => {
    const puzzle = mini({ available: ['cross'] });
    const state = createState(puzzle);
    const unavailable = selectType(state, puzzle, 'diagonal');
    expect(unavailable.ok).toBe(false);
    if (!unavailable.ok) expect(unavailable.reason).toBe('type-unavailable');
  });
});

describe('authored puzzles', () => {
  test('there are 24 unique puzzle ids', () => {
    expect(PUZZLES).toHaveLength(24);
    expect(new Set(PUZZLES.map((puzzle) => puzzle.id)).size).toBe(24);
  });

  test.each(PUZZLES)('$id solution is legal, exact, and matches par', (puzzle) => {
    expect(puzzle.width).toBeGreaterThanOrEqual(5);
    expect(puzzle.height).toBeGreaterThanOrEqual(5);
    expect(puzzle.par).toBe(puzzle.solution.length);
    const used: Partial<Record<string, number>> = {};
    for (const placement of puzzle.solution) {
      expect(placement.x).toBeGreaterThanOrEqual(0);
      expect(placement.x).toBeLessThan(puzzle.width);
      expect(puzzle.blocked.some((cell) => cell.x === placement.x && cell.y === placement.y)).toBe(false);
      expect(puzzle.available).toContain(placement.type);
      used[placement.type] = (used[placement.type] ?? 0) + 1;
      const limit = puzzle.inventory[placement.type];
      if (limit != null) expect(used[placement.type]).toBeLessThanOrEqual(limit);
    }
    const coverage = computeCoverage(puzzle, puzzle.solution);
    expect(isExactCover(puzzle, coverage)).toBe(true);
    const state = createState(puzzle);
    for (const placement of puzzle.solution) {
      if (placement.locked) continue;
      const result = placeBeacon(state, puzzle, placement, placement.type);
      expect(result.ok, result.announcement).toBe(true);
    }
    expect(state.complete).toBe(true);
    expect(state.beaconCount).toBe(puzzle.par);
  });

  test.each(PUZZLES.filter((puzzle) => puzzle.unique))('$id uniqueness claim holds', (puzzle) => {
    expect(countSolutions(puzzle, 2)).toBe(1);
  });

  test('first puzzle is the teaching plus', () => {
    expect(getPuzzle('bl-01-first-plus')?.par).toBe(1);
  });
});
