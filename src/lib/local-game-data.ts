import { prefKey, scoreKey } from '../games/shared/storage';
import { RECENTLY_PLAYED_KEY } from '../games/shared/recently-played';
import { PASS_PLAY_GAME_IDS, passPlayMatchKey } from '../games/shared/pass-play';

/**
 * The single source of truth for "Clear game data".
 *
 * Every key below is written by a NoCharge game or by shared game plumbing.
 * The list is deliberately an explicit allowlist rather than a prefix sweep:
 *
 * - `nocharge:consent` (the separate NoCharge analytics choice) is excluded, so
 *   clearing game data never changes analytics behaviour.
 * - Google Privacy & messaging (Funding Choices) storage is owned by Google and
 *   is never touched here.
 * - Unrelated origin storage written by anything else is never removed.
 */
export const GAME_SCORE_IDS = [
  'memory-match',
  'word-tile-rush',
  'color-flip',
  'color-flip-turn-based',
  'beacon-lattice',
] as const;

export const GAME_PREFERENCE_KEYS = [
  'game-muted',
  'beacon-lattice-progress',
  'klondike-draw-mode',
  'color-flip-rotation',
  'sound-enabled',
  'sound-volume',
  'ambient-sound',
  'sudoku-pencil-marks',
  'minesweeper-last-size',
  'hangman-last-theme',
  'simon-calm',
] as const;

export const MEMORY_MATCH_BEST_MOVES_KEY = 'nocharge:memory-match:best-moves';

export const KLONDIKE_GAMES_WON_KEY = 'nocharge:klondike:games-won';
export const KLONDIKE_BEST_MOVES_KEY = 'nocharge:klondike:best-moves';
export const FREECELL_GAMES_WON_KEY = 'nocharge:freecell:games-won';
export const NONOGRAM_PUZZLES_REVEALED_KEY = 'nocharge:nonogram:puzzles-revealed';
export const TWENTY_FORTY_EIGHT_BEST_TILE_KEY = 'nocharge:2048:best-tile';
export const TILE_GARDEN_BEST_TIER_KEY = 'nocharge:tile-garden:best-tier';
export const WORD_SEARCH_PUZZLES_SOLVED_KEY = 'nocharge:word-search:puzzles-solved';
export const WORD_SEARCH_LAST_LIST_KEY = 'nocharge:word-search:last-list';
export const WORD_LOOM_STREAK_KEY = 'nocharge:daily:word-loom:streak';
export const WORD_LOOM_SOLVED_KEY = 'nocharge:daily:word-loom:solved';
export const SUDOKU_PUZZLES_SOLVED_KEY = 'nocharge:sudoku:puzzles-solved';
export const SUDOKU_CURRENT_PUZZLE_KEY = 'nocharge:sudoku:current-puzzle';
export const MINESWEEPER_GAMES_WON_KEY = 'nocharge:minesweeper:games-won';
export const MINESWEEPER_BEST_TIME_KEY = 'nocharge:minesweeper:best-time';
export const HANGMAN_GAMES_SOLVED_KEY = 'nocharge:hangman:games-solved';
export const LIGHTS_OUT_PUZZLES_SOLVED_KEY = 'nocharge:lights-out:puzzles-solved';
export const LIGHTS_OUT_BEST_MOVES_KEY = 'nocharge:lights-out:best-moves';
export const SIMON_BEST_LENGTH_KEY = 'nocharge:simon:best-length';
export const SUDOKU9_CURRENT_PUZZLE_KEY = 'nocharge:sudoku9:current-puzzle';
export const SUDOKU9_PUZZLES_SOLVED_KEY = 'nocharge:sudoku9:puzzles-solved';

/**
 * Pass & Play match records: exactly one bounded key per game, holding the
 * most recent match only. Clearing them clears the My Arcade Pass & Play
 * section in the same confirmed flow as the solo keys.
 */
export const PASS_PLAY_MATCH_KEYS: readonly string[] = PASS_PLAY_GAME_IDS.map((id) => passPlayMatchKey(id));

export const CLEARABLE_GAME_DATA_KEYS: readonly string[] = [
  ...GAME_SCORE_IDS.map((id) => scoreKey(id)),
  MEMORY_MATCH_BEST_MOVES_KEY,
  KLONDIKE_GAMES_WON_KEY,
  KLONDIKE_BEST_MOVES_KEY,
  FREECELL_GAMES_WON_KEY,
  NONOGRAM_PUZZLES_REVEALED_KEY,
  TWENTY_FORTY_EIGHT_BEST_TILE_KEY,
  TILE_GARDEN_BEST_TIER_KEY,
  WORD_SEARCH_PUZZLES_SOLVED_KEY,
  WORD_SEARCH_LAST_LIST_KEY,
  SUDOKU_PUZZLES_SOLVED_KEY,
  SUDOKU_CURRENT_PUZZLE_KEY,
  MINESWEEPER_GAMES_WON_KEY,
  MINESWEEPER_BEST_TIME_KEY,
  HANGMAN_GAMES_SOLVED_KEY,
  LIGHTS_OUT_PUZZLES_SOLVED_KEY,
  LIGHTS_OUT_BEST_MOVES_KEY,
  SIMON_BEST_LENGTH_KEY,
  WORD_LOOM_STREAK_KEY,
  WORD_LOOM_SOLVED_KEY,
  SUDOKU9_CURRENT_PUZZLE_KEY,
  SUDOKU9_PUZZLES_SOLVED_KEY,
  ...GAME_PREFERENCE_KEYS.map((preference) => prefKey(preference)),
  RECENTLY_PLAYED_KEY,
  ...PASS_PLAY_MATCH_KEYS,
];

export const CLEAR_GAME_DATA_SUCCESS =
  'Game scores, preferences, Recently Played, and Pass & Play match records were cleared from this browser.';

export const CLEAR_GAME_DATA_FAILURE = 'This browser did not allow game data to be cleared.';

export interface RemovableStorage {
  removeItem(key: string): void;
}

/** Remove exactly the allowlisted game keys. Returns false when storage refuses. */
export function clearLocalGameData(storage: RemovableStorage | undefined): boolean {
  if (!storage) return false;
  try {
    for (const key of CLEARABLE_GAME_DATA_KEYS) storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
