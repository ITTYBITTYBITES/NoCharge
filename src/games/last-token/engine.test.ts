import { describe, expect, it } from 'vitest';
import {
  LAST_TOKEN_PRESETS,
  MAX_TAKE,
  isRoundOver,
  legalTakes,
  openingPlayerForRound,
  takeTokens,
  totalTokens,
} from './engine';

describe('presets', () => {
  it('offers two or three pile presets including 3-4-5 and 1-3-5-7', () => {
    const labels = LAST_TOKEN_PRESETS.map((preset) => preset.id);
    expect(labels).toContain('3-4-5');
    expect(labels).toContain('1-3-5-7');
    expect(LAST_TOKEN_PRESETS.length).toBeLessThanOrEqual(3);
  });
});

describe('taking tokens', () => {
  it('removes one to three tokens from a single pile only', () => {
    expect(takeTokens([3, 4, 5], 1, 2)).toEqual([3, 2, 5]);
    expect(takeTokens([3, 4, 5], 0, 3)).toEqual([0, 4, 5]);
    expect(takeTokens([1, 3, 5, 7], 3, 1)).toEqual([1, 3, 5, 6]);
  });

  it('refuses zero, fractional, oversized, and unknown-pile moves', () => {
    expect(takeTokens([3, 4], 0, 0)).toBeNull();
    expect(takeTokens([3, 4], 0, 4)).toBeNull();
    expect(takeTokens([3, 4], 0, 1.5)).toBeNull();
    expect(takeTokens([2, 4], 0, 3)).toBeNull();
    expect(takeTokens([3, 4], -1, 1)).toBeNull();
    expect(takeTokens([3, 4], 2, 1)).toBeNull();
  });

  it('never mutates the existing piles', () => {
    const piles = [3, 4, 5];
    takeTokens(piles, 2, 3);
    expect(piles).toEqual([3, 4, 5]);
  });
});

describe('round end', () => {
  it('ends only when the last token is gone', () => {
    expect(isRoundOver([0, 1, 0])).toBe(false);
    expect(isRoundOver([0, 0, 0])).toBe(true);
    expect(totalTokens([1, 3, 5, 7])).toBe(16);
    expect(totalTokens([0, 0, 0])).toBe(0);
  });

  it('allows emptying a pile exactly but not past zero', () => {
    expect(takeTokens([3], 0, 3)).toEqual([0]);
    expect(takeTokens([2], 0, 3)).toBeNull();
  });
});

describe('helpers', () => {
  it('lists legal take counts for a pile', () => {
    expect(legalTakes(0)).toEqual([]);
    expect(legalTakes(1)).toEqual([1]);
    expect(legalTakes(2)).toEqual([1, 2]);
    expect(legalTakes(7)).toEqual([1, 2, 3]);
    expect(MAX_TAKE).toBe(3);
  });

  it('alternates the opening player each round', () => {
    expect(openingPlayerForRound(1)).toBe(1);
    expect(openingPlayerForRound(2)).toBe(2);
    expect(openingPlayerForRound(3)).toBe(1);
  });
});
