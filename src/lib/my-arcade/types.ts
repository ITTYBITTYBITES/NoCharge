/**
 * Types for the My Arcade read-only local summary layer.
 *
 * Nothing in this module is persisted. Every value is derived on demand from
 * storage keys that NoCharge games already write, and is discarded when the
 * page unloads.
 */

export const MY_ARCADE_GAME_IDS = [
  'memory-match',
  'word-tile-rush',
  'color-flip',
  'beacon-lattice',
  'klondike',
  'freecell',
  'nonogram',
  'twenty-forty-eight',
  'tile-garden',
  'word-search',
  'mini-sudoku',
] as const;

export type GameId = (typeof MY_ARCADE_GAME_IDS)[number];

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (MY_ARCADE_GAME_IDS as readonly string[]).includes(value);
}

/** Minimal read surface. Only `getItem` is ever used by this layer. */
export interface ReadableStorage {
  getItem(key: string): string | null;
}

export type LocalGameStatus = 'unplayed' | 'played' | 'has-result' | 'has-progress';

export interface LocalGameMetric {
  label: string;
  value: string;
  detail?: string;
}

export interface LocalGameSummary {
  gameId: GameId;
  status: LocalGameStatus;
  /** ISO-8601 string derived from Recently Played, when a valid record exists. */
  lastPlayedAt?: string;
  metrics: LocalGameMetric[];
}

export interface RecentPlaySummary {
  gameId: GameId;
  /** Raw epoch milliseconds as stored by Recently Played. */
  playedAt: number;
  /** ISO-8601 string, omitted when the stored timestamp cannot form a real date. */
  lastPlayedAt?: string;
}

export interface LocalDashboard {
  /** False when the browser refuses local storage entirely. */
  storageAvailable: boolean;
  /** Newest first, already limited to the Recently Played maximum. */
  recent: RecentPlaySummary[];
  /** One entry per registered game, in registry order. */
  games: LocalGameSummary[];
  /** True when storage works but nothing meaningful is stored yet. */
  isEmpty: boolean;
}
