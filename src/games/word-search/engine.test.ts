import { describe, expect, it } from 'vitest';
import { createPuzzle, isComplete, selectedWord, safeWords, wordsForSize } from './engine';
import { WORD_LISTS } from './word-lists';

describe('word search engine', () => {
  it('places all words', () => {
    const p = createPuzzle(WORD_LISTS.animals, 8, 4);
    expect(p.placements).toHaveLength(p.words.length);
    for (const x of p.placements) expect(selectedWord(p, x.start, x.end)).toBe(x.word);
  });

  it('recognises reverse and diagonal lines', () => {
    const p = createPuzzle(WORD_LISTS.animals, 10, 9);
    const x = p.placements.find((item) => item.start.row !== item.end.row && item.start.col !== item.end.col)!;
    expect(selectedWord(p, x.end, x.start)).toBe(x.word);
  });

  it('checks completion and safe fallback', () => {
    expect(isComplete(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(safeWords(['bad'])).toHaveLength(12);
  });

  const themes = Object.keys(WORD_LISTS) as (keyof typeof WORD_LISTS)[];
  for (const theme of themes) {
    for (const size of [8, 10] as const) {
      it(`places every ${theme} word that fits on ${size}×${size}`, () => {
        const p = createPuzzle(WORD_LISTS[theme], size, 17);
        expect(p.size).toBe(size);
        expect(p.grid).toHaveLength(size);
        expect(p.grid[0]).toHaveLength(size);
        expect(p.placements).toHaveLength(p.words.length);
        for (const word of p.words) {
          expect(word.length).toBeLessThanOrEqual(size);
        }
        for (const placement of p.placements) {
          expect(selectedWord(p, placement.start, placement.end)).toBe(placement.word);
          expect(placement.start.row).toBeGreaterThanOrEqual(0);
          expect(placement.start.col).toBeGreaterThanOrEqual(0);
          expect(placement.end.row).toBeLessThan(size);
          expect(placement.end.col).toBeLessThan(size);
        }
      });
    }
  }

  it('filters impossible words instead of returning an unplaceable list', () => {
    expect(wordsForSize(['telescope', 'atom'], 8)).toEqual(['atom']);
    const impossible = createPuzzle(['telescope', 'zzzzzzzzz'], 8, 1);
    expect(impossible.words.every((w) => w.length <= 8)).toBe(true);
    expect(impossible.placements).toHaveLength(impossible.words.length);
  });

  it('handles an empty compatible list explicitly', () => {
    const p = createPuzzle(['telescope'], 8, 3);
    expect(p.words).toEqual([]);
    expect(p.placements).toEqual([]);
    expect(p.grid).toHaveLength(8);
  });
});
