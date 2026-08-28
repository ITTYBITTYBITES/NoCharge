import { describe, expect, it } from 'vitest';
import { dailySeed, evaluateGuess, isInDictionary, submitGuess, wordForSeed } from './engine';

describe('word loom engine', () => {
  it('evaluates a perfect guess as all correct', () => {
    const result = submitGuess('quiet', 'quiet');
    expect(result.solved).toBe(true);
    expect(result.feedback).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });

  it('distinguishes present from absent', () => {
    // answer: STONE; guess: TONES → all five letters appear in the answer.
    const feedback = evaluateGuess('tones', 'stone');
    expect(feedback).toEqual(['present', 'present', 'present', 'present', 'present']);
  });

  it('caps duplicates: TWO guesses of the same letter when the word has one', () => {
    // answer: MAPLE (one P). guess: POPPY → the second P must be absent.
    const feedback = evaluateGuess('poppy', 'maple');
    expect(feedback.filter((state) => state !== 'absent')).toHaveLength(1);
    expect(feedback[2]).toBe('correct');
  });

  it('derives the same word from the same seed and a stable date', () => {
    expect(wordForSeed('2026-08-27')).toBe(wordForSeed('2026-08-27'));
    expect(dailySeed(new Date(2026, 7, 27))).toBe('2026-08-27');
  });

  it('validates dictionary membership case-insensitively', () => {
    expect(isInDictionary('QUIET')).toBe(true);
    expect(isInDictionary('zzzzz')).toBe(false);
  });
});
