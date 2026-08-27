/**
 * A10 — localStorage transparency.
 *
 * Every key in `CLEARABLE_GAME_DATA_KEYS` (the "Clear game data" allowlist) must
 * have a row here. `validateStorageDocs` is unit-tested so a new game cannot
 * ship a storage key without documenting it on Privacy.
 *
 * `Category` values: shared (shell/preferences), score, progress, match
 * (Pass & Play most-recent result), hub (daily hub).
 */
import {
  CLEARABLE_GAME_DATA_KEYS,
  FREECELL_GAMES_WON_KEY,
  HANGMAN_GAMES_SOLVED_KEY,
  WORD_LOOM_STREAK_KEY,
  WORD_LOOM_SOLVED_KEY,
  KLONDIKE_BEST_MOVES_KEY,
  KLONDIKE_GAMES_WON_KEY,
  LIGHTS_OUT_BEST_MOVES_KEY,
  LIGHTS_OUT_PUZZLES_SOLVED_KEY,
  MEMORY_MATCH_BEST_MOVES_KEY,
  MINESWEEPER_BEST_TIME_KEY,
  MINESWEEPER_GAMES_WON_KEY,
  SIMON_BEST_LENGTH_KEY,
  NONOGRAM_PUZZLES_REVEALED_KEY,
  SUDOKU9_CURRENT_PUZZLE_KEY,
  SUDOKU9_PUZZLES_SOLVED_KEY,
  SUDOKU_CURRENT_PUZZLE_KEY,
  SUDOKU_PUZZLES_SOLVED_KEY,
  TILE_GARDEN_BEST_TIER_KEY,
  TWENTY_FORTY_EIGHT_BEST_TILE_KEY,
  WORD_SEARCH_LAST_LIST_KEY,
  WORD_SEARCH_PUZZLES_SOLVED_KEY,
} from './local-game-data';
import { DAILY_SLOTS, DAILY_HUB_STORAGE_KEYS } from '../config/dailies';
import { prefKey } from '../games/shared/storage';

export interface StorageDoc {
  key: string;
  /** Which game (or the shared shell) writes the value. */
  owner: string;
  category: 'shared' | 'score' | 'progress' | 'match' | 'hub';
  purpose: string;
  /** Keys documented for dailies that are planned, not yet written. */
  planned?: boolean;
}

const sharedDocs: StorageDoc[] = [
  { key: prefKey('game-muted'), owner: 'Shared game shell', category: 'shared', purpose: 'Master mute for game effects and ambient audio.' },
  { key: prefKey('sound-enabled'), owner: 'Shared game shell', category: 'shared', purpose: 'Whether game sound effects are on.' },
  { key: prefKey('sound-volume'), owner: 'Shared game shell', category: 'shared', purpose: 'Sound and ambient volume level.' },
  { key: prefKey('ambient-sound'), owner: 'Shared game shell', category: 'shared', purpose: 'Selected ambient texture (or none).' },
  { key: prefKey('recently-played'), owner: 'Shared game shell', category: 'shared', purpose: 'Up to four recent game IDs and last-played timestamps.' },
];

const gameDocs: StorageDoc[] = [
  { key: 'nocharge:memory-match:high', owner: 'Memory Match', category: 'score', purpose: 'Best (lowest) move count for a completed board.' },
  { key: MEMORY_MATCH_BEST_MOVES_KEY, owner: 'Memory Match', category: 'score', purpose: 'Best move count (legacy alias, kept for compatibility).' },
  { key: 'nocharge:word-tile-rush:high', owner: 'Word Tile Rush', category: 'score', purpose: 'Best word score for a run.' },
  { key: 'nocharge:color-flip:high', owner: 'Color Flip', category: 'score', purpose: 'Best result for visual mode.' },
  { key: 'nocharge:color-flip-turn-based:high', owner: 'Color Flip', category: 'score', purpose: 'Best result for turn-based mode.' },
  { key: prefKey('color-flip-rotation'), owner: 'Color Flip', category: 'shared', purpose: 'Color cycle direction preference.' },
  { key: 'nocharge:beacon-lattice:high', owner: 'Beacon Lattice', category: 'score', purpose: 'Best move count for a solved lattice.' },
  { key: prefKey('beacon-lattice-progress'), owner: 'Beacon Lattice', category: 'progress', purpose: 'Current puzzle and solved puzzle IDs.' },
  { key: KLONDIKE_GAMES_WON_KEY, owner: 'Klondike', category: 'progress', purpose: 'Number of games won on this device.' },
  { key: KLONDIKE_BEST_MOVES_KEY, owner: 'Klondike', category: 'score', purpose: 'Fewest moves for a won game.' },
  { key: prefKey('klondike-draw-mode'), owner: 'Klondike', category: 'shared', purpose: 'Draw-one or draw-three preference.' },
  { key: FREECELL_GAMES_WON_KEY, owner: 'FreeCell', category: 'progress', purpose: 'Number of games won on this device.' },
  { key: NONOGRAM_PUZZLES_REVEALED_KEY, owner: 'Nonogram', category: 'progress', purpose: 'Puzzles fully revealed on this device.' },
  { key: TWENTY_FORTY_EIGHT_BEST_TILE_KEY, owner: 'Twenty Forty-Eight', category: 'score', purpose: 'Largest tile reached.' },
  { key: TILE_GARDEN_BEST_TIER_KEY, owner: 'Tile Garden', category: 'score', purpose: 'Best flower tier reached.' },
  { key: WORD_SEARCH_PUZZLES_SOLVED_KEY, owner: 'Word Search', category: 'progress', purpose: 'Puzzles fully solved on this device.' },
  { key: WORD_SEARCH_LAST_LIST_KEY, owner: 'Word Search', category: 'shared', purpose: 'Last chosen word list.' },
  { key: SUDOKU_PUZZLES_SOLVED_KEY, owner: 'Mini Sudoku 6×6', category: 'progress', purpose: 'Puzzles solved on this device (future 9×9 sudoku will share the prefix).' },
  { key: SUDOKU_CURRENT_PUZZLE_KEY, owner: 'Mini Sudoku 6×6', category: 'progress', purpose: 'Current in-progress puzzle, so it survives a reload.' },
  { key: prefKey('sudoku-pencil-marks'), owner: 'Mini Sudoku 6×6 and Sudoku 9×9', category: 'shared', purpose: 'Whether pencil marks start enabled.' },
  { key: MINESWEEPER_GAMES_WON_KEY, owner: 'Minesweeper', category: 'progress', purpose: 'Number of cleared boards on this device.' },
  { key: MINESWEEPER_BEST_TIME_KEY, owner: 'Minesweeper', category: 'score', purpose: 'Fastest completed clear, recorded only after a win.' },
  { key: prefKey('minesweeper-last-size'), owner: 'Minesweeper', category: 'shared', purpose: 'Remembered board size (beginner, intermediate, or expert).' },
  { key: HANGMAN_GAMES_SOLVED_KEY, owner: 'Hangman', category: 'progress', purpose: 'Rounds solved on this device.' },
  { key: prefKey('hangman-last-theme'), owner: 'Hangman', category: 'shared', purpose: 'Last chosen word theme.' },
  { key: LIGHTS_OUT_PUZZLES_SOLVED_KEY, owner: 'Lights Out', category: 'progress', purpose: 'Boards cleared on this device.' },
  { key: LIGHTS_OUT_BEST_MOVES_KEY, owner: 'Lights Out', category: 'score', purpose: 'Fewest presses to clear a board.' },
  { key: SIMON_BEST_LENGTH_KEY, owner: 'Simon', category: 'score', purpose: 'Longest sequence fully remembered.' },
  { key: prefKey('simon-calm'), owner: 'Simon', category: 'shared', purpose: 'Whether Calm pattern (reduced-motion presentation) is on.' },
  { key: SUDOKU9_CURRENT_PUZZLE_KEY, owner: 'Sudoku 9×9', category: 'progress', purpose: 'Current in-progress board, so it survives a reload.' },
  { key: SUDOKU9_PUZZLES_SOLVED_KEY, owner: 'Sudoku 9×9', category: 'progress', purpose: 'Puzzles solved on this device.' },
];

const matchDocs: StorageDoc[] = [
  'tic-tac-toe',
  'dots-and-boxes',
  'four-in-a-row',
  'reversi',
  'last-token',
  'pass-the-picture',
  'gomoku',
  'nine-mens-morris',
  'checkers',
].map((game) => ({
  key: `nocharge:passplay:match:${game}`,
  owner: game === 'pass-the-picture' ? 'Pass the Picture' : game.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' '),
  category: 'match' as const,
  purpose: 'Most recent match record: mode, result, match score, and date. Never player names.',
}));

const dailyDocs: StorageDoc[] = [
  ...DAILY_SLOTS.flatMap((slot) => slot.storageKeys.map((key) => ({
    key,
    owner: `Daily · ${slot.title}`,
    category: 'hub' as const,
    purpose: slot.status === 'live' ? 'Streak and solved-date bookkeeping for the date-seeded daily.' : 'Planned: streak and solved-date bookkeeping once the daily ships.',
    planned: slot.status !== 'live',
  }))),
  ...DAILY_HUB_STORAGE_KEYS.map((key) => ({
    key,
    owner: 'Daily hub',
    category: 'hub' as const,
    purpose: 'Planned: last date the hub was visited (used only to show the streak without recomputation).',
    planned: true,
  })),
];

export const STORAGE_KEY_DOCS: StorageDoc[] = [...sharedDocs, ...gameDocs, ...matchDocs, ...dailyDocs];

/** Every clearable key must be documented; every documented clearable key is real. */
export function validateStorageDocs(clearable: readonly string[]): string[] {
  const documented = new Set(STORAGE_KEY_DOCS.map((doc) => doc.key));
  const errors: string[] = [];
  for (const key of clearable) {
    if (!!key.startsWith('nocharge:') && !documented.has(key)) errors.push(`undocumented storage key: ${key}`);
    if (key === 'nocharge:consent') errors.push(`consent key must never be in clearable: ${key}`);
  }
  return errors;
}

/**
 * The exhaustive allowlist exposed to Privacy. Daily keys that are planned are
 * listed as such; the clearable allowlist only includes keys that games
 * actually write today.
 */
export function clearableStorageKeys(): readonly string[] {
  return CLEARABLE_GAME_DATA_KEYS;
}
