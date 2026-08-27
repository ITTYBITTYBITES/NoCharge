/**
 * Hangman rules for the NoCharge edition.
 *
 * Pure functions: word selection, guess resolution, win/loss, no DOM or
 * storage. Word lists are theme-based and only use A–Z letters.
 */

export interface HangmanTheme {
  id: string;
  label: string;
  words: readonly string[];
}

export const THEMES: HangmanTheme[] = [
  {
    id: 'nature',
    label: 'Nature',
    words: ['meadow', 'harbor', 'cedar', 'thistle', 'lagoon', 'bramble', 'orchid', 'prairie', 'glacier', 'willow', 'canyon', 'sparrow'],
  },
  {
    id: 'quiet-games',
    label: 'Quiet games',
    words: ['lattice', 'puzzle', 'round', 'tiles', 'handoff', 'pencil', 'beacon', 'garden', 'riddle', 'solitaire', 'bridge', 'memory'],
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    words: ['apron', 'skillet', 'basil', 'carafe', 'ladle', 'molasses', 'teapot', 'walnut', 'ginger', 'omelet', 'saffron', 'biscuit'],
  },
  {
    id: 'colors',
    label: 'Calm colors',
    words: ['emerald', 'indigo', 'amber', 'cobalt', 'moss', 'rose', 'umber', 'seafoam', 'violet', 'slate', 'ochre', 'sage'],
  },
];

export const MAX_WRONG = 6;

export type HangmanStatus = 'playing' | 'won' | 'lost';

export interface HangmanState {
  theme: HangmanTheme;
  word: string;
  guessed: string[];
  wrongCount: number;
  status: HangmanStatus;
}

export function normalizeWord(theme: HangmanTheme, random = Math.random): string {
  const word = theme.words[Math.floor(random() * theme.words.length)] ?? theme.words[0]!;
  return word.toUpperCase();
}

export function newGame(theme: HangmanTheme, random = Math.random): HangmanState {
  return {
    theme,
    word: normalizeWord(theme, random),
    guessed: [],
    wrongCount: 0,
    status: 'playing',
  };
}

/** True when the letter is a single ASCII letter and not already guessed. */
export function canGuess(state: HangmanState, letter: string): boolean {
  const normalized = letter.toUpperCase();
  return state.status === 'playing' && /^[A-Z]$/.test(normalized) && !state.guessed.includes(normalized);
}

export function guess(state: HangmanState, letter: string): HangmanState {
  const normalized = letter.toUpperCase();
  if (!canGuess(state, normalized)) return state;
  const guessed = [...state.guessed, normalized];
  const correct = state.word.includes(normalized);
  const wrongCount = correct ? state.wrongCount : state.wrongCount + 1;
  const lettersRemaining = [...state.word].filter((ch) => !guessed.includes(ch)).length;
  const status: HangmanStatus = lettersRemaining === 0 ? 'won' : wrongCount >= MAX_WRONG ? 'lost' : 'playing';
  return { ...state, guessed, wrongCount, status };
}

/** Revealed letters (same case as the word); unknown letters render as blanks. */
export function revealedWord(state: HangmanState): string {
  return [...state.word].map((ch) => (state.guessed.includes(ch) ? ch : '_')).join(' ');
}

/** The word itself, revealed on loss or win. */
export function solvedWord(state: HangmanState): string {
  return state.status === 'playing' ? '' : state.word;
}

export function alphabet(): string[] {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
}
