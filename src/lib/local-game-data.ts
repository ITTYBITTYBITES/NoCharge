import { prefKey, scoreKey } from '../games/shared/storage';
import { RECENTLY_PLAYED_KEY } from '../games/shared/recently-played';

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

export const GAME_PREFERENCE_KEYS = ['game-muted', 'beacon-lattice-progress'] as const;

export const MEMORY_MATCH_BEST_MOVES_KEY = 'nocharge:memory-match:best-moves';

export const CLEARABLE_GAME_DATA_KEYS: readonly string[] = [
  ...GAME_SCORE_IDS.map((id) => scoreKey(id)),
  MEMORY_MATCH_BEST_MOVES_KEY,
  ...GAME_PREFERENCE_KEYS.map((preference) => prefKey(preference)),
  RECENTLY_PLAYED_KEY,
];

export const CLEAR_GAME_DATA_SUCCESS =
  'Game scores, preferences, and Recently Played were cleared from this browser.';

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
