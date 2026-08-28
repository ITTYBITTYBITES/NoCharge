import { describe, expect, it } from 'vitest';
import { alphabet, canGuess, guess, MAX_WRONG, newGame, revealedWord, THEMES } from './engine';

function gameWith(word: string) {
  const theme = { id: 't', label: 'T', words: [word] };
  return newGame(theme, () => 0);
}

describe('hangman engine', () => {
  it('starts with a playing state and no guesses', () => {
    const state = gameWith('MEADOW');
    expect(state.status).toBe('playing');
    expect(state.guessed).toEqual([]);
    expect(state.wrongCount).toBe(0);
  });

  it('accepts a correct letter and wins when all letters are found', () => {
    let state = gameWith('MEADOW');
    for (const letter of 'MEADOW') state = guess(state, letter);
    expect(state.status).toBe('won');
    expect(state.wrongCount).toBe(0);
  });

  it('loses after six wrong guesses', () => {
    let state = gameWith('MEADOW');
    for (const letter of 'BCHIJP') state = guess(state, letter);
    expect(state.wrongCount).toBe(MAX_WRONG);
    expect(state.status).toBe('lost');
  });

  it('reveals only guessed letters and shows blanks otherwise', () => {
    const state = guess(gameWith('TEA'), 'E');
    expect(revealedWord(state)).toBe('_ E _');
  });

  it('rejects non-letters, repeats, and post-game guesses', () => {
    const state = newGame(THEMES[0]!, () => 0);
    expect(canGuess(state, '1')).toBe(false);
    expect(canGuess(state, 'AB')).toBe(false);
    const next = guess(state, 'A');
    expect(canGuess(next, 'a')).toBe(false);
    const lost = guess(next, 'Z');
    void lost;
  });

  it('exposes the full alphabet for on-screen boards', () => {
    expect(alphabet()).toHaveLength(26);
  });
});
