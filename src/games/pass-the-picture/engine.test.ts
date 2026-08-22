import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PASSES,
  PASS_CHOICES,
  PICTURE_PALETTE,
  STROKE_WIDTH,
  buildStroke,
  isLastPass,
  normalizePoint,
  playerForPass,
  strokeCounts,
  totalPasses,
  undoLastStroke,
  type PictureStroke,
} from './engine';

describe('pass scheduling', () => {
  it('allows 2–5 passes per player with 3 as the default', () => {
    expect([...PASS_CHOICES]).toEqual([2, 3, 4, 5]);
    expect(DEFAULT_PASSES).toBe(3);
  });

  it('gives each player the same number of passes', () => {
    expect(totalPasses(2)).toBe(4);
    expect(totalPasses(5)).toBe(10);
  });

  it('alternates players, with Player 1 opening', () => {
    expect(playerForPass(0)).toBe(1);
    expect(playerForPass(1)).toBe(2);
    expect(playerForPass(2)).toBe(1);
    expect(playerForPass(9)).toBe(2);
  });

  it('knows the final pass', () => {
    expect(isLastPass(5, 3)).toBe(true);
    expect(isLastPass(4, 3)).toBe(false);
    expect(isLastPass(0, 2)).toBe(false);
  });
});

describe('strokes', () => {
  const stroke = (pass: number, player: 1 | 2): PictureStroke => ({
    pass,
    player,
    color: '#1f2430',
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  });

  it('counts strokes per player', () => {
    expect(strokeCounts([])).toEqual([0, 0]);
    expect(strokeCounts([stroke(0, 1), stroke(1, 2), stroke(2, 1)])).toEqual([2, 1]);
  });

  it('undo removes the newest stroke and restores its pass', () => {
    const strokes = [stroke(0, 1), stroke(1, 2), stroke(2, 1)];
    const undone = undoLastStroke(strokes)!;
    expect(undone.strokes).toHaveLength(2);
    expect(undone.resumePass).toBe(2);
    expect(undoLastStroke([])).toBeNull();
    expect(undone.strokes).not.toBe(strokes);
  });

  it('keeps an eight-color palette and a single stroke width', () => {
    expect(PICTURE_PALETTE).toHaveLength(8);
    expect(new Set(PICTURE_PALETTE).size).toBe(8);
    expect(STROKE_WIDTH).toBeGreaterThan(0);
  });
});

describe('point handling', () => {
  it('clamps points into the unit square', () => {
    expect(normalizePoint(-1, 2)).toEqual({ x: 0, y: 1 });
    expect(normalizePoint(0.5, 0.25)).toEqual({ x: 0.5, y: 0.25 });
  });

  it('drops near-duplicate samples and expands single taps', () => {
    const dense = [
      { x: 0.1, y: 0.1 },
      { x: 0.1002, y: 0.1001 },
      { x: 0.2, y: 0.2 },
    ];
    expect(buildStroke(dense)).toHaveLength(2);
    const tap = buildStroke([{ x: 0.5, y: 0.5 }]);
    expect(tap).toHaveLength(2);
  });
});
