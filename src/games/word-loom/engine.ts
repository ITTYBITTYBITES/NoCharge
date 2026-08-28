/**
 * Word Loom rules for the NoCharge daily/practice word game.
 *
 * Original name and ruleset — NOT Wordle or any third-party brand. Six guesses
 * at a five-letter word. Feedback states use both color and non-color cues:
 *   - correct  = letter in this position (announced and marked with ✓)
 *   - present  = letter appears elsewhere (marked with ~)
 *   - absent   = letter not in the word (marked with ✗)
 * Duplicate letters follow the same rule as the word: the word's letter count
 * caps how many "present/correct" results a guessed letter can receive.
 */

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export type Feedback = 'correct' | 'present' | 'absent';

export interface GuessResult {
  word: string;
  feedback: Feedback[];
  solved: boolean;
}

export const WORD_LIST: readonly string[] = [
  'quiet', 'tiles', 'looms', 'beads', 'stone', 'cloud', 'marsh', 'grove',
  'ferns', 'dunes', 'pearl', 'cedar', 'maple', 'brook', 'aspen', 'lilac',
  'minty', 'roses', 'sable', 'umber', 'ocean', 'waves', 'tides', 'shore',
  'cabin', 'porch', 'hearth', 'lantern', 'meadow', 'hollow', 'ember', 'spark',
  'grain', 'wheat', 'baker', 'honey', 'olive', 'apple', 'plums', 'grape',
  'chess', 'cards', 'dice', 'poker', 'rummy', 'whist', 'scores', 'peace',
  'logic', 'brain', 'think', 'puzzle', 'riddle', 'clues', 'solve', 'grids',
  'reads', 'pages', 'quill', 'inkwell', 'paper', 'voice', 'notes', 'lyric',
  'songs', 'drums', 'flute', 'piano', 'opera', 'tempo', 'notes', 'scale',
  'night', 'stars', 'moon', 'dusk', 'dawn', 'mists', 'frost', 'snow',
  'rainy', 'storm', 'breezy', 'calm', 'still', 'sooth', 'serene', 'tranquil',
];

/** Pick a word deterministically from a seed string. */
export function wordForSeed(seed: string): string {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % WORD_LIST.length;
  return WORD_LIST[index]!;
}

/** Device-local date seed: YYYY-MM-DD (documented on /daily/). */
export function dailySeed(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isInDictionary(word: string): boolean {
  const normalized = word.toLowerCase();
  return WORD_LIST.includes(normalized);
}

/**
 * Compute feedback. `counts` = letter tallies of the answer; present is capped
 * so an extra guessed copy of a letter becomes absent.
 */
export function evaluateGuess(guess: string, answer: string): Feedback[] {
  const lower = guess.toLowerCase();
  const target = answer.toLowerCase();
  const feedback: Feedback[] = Array.from({ length: WORD_LENGTH }, () => 'absent');
  const remaining = new Map<string, number>();
  for (const letter of target) remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
  // First pass: correct positions.
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (lower[index] === target[index]) {
      feedback[index] = 'correct';
      remaining.set(lower[index]!, (remaining.get(lower[index]!) ?? 0) - 1);
    }
  }
  // Second pass: present, capped by remaining count.
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (feedback[index] === 'correct') continue;
    const letter = lower[index]!;
    const count = remaining.get(letter) ?? 0;
    if (count > 0) {
      feedback[index] = 'present';
      remaining.set(letter, count - 1);
    }
  }
  return feedback;
}

export function submitGuess(guess: string, answer: string): GuessResult {
  const feedback = evaluateGuess(guess, answer);
  return { word: guess.toLowerCase(), feedback, solved: feedback.every((state) => state === 'correct') };
}

export function symbolFor(feedback: Feedback): '✓' | '~' | '✗' {
  return feedback === 'correct' ? '✓' : feedback === 'present' ? '~' : '✗';
}
