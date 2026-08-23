import { PUZZLES } from '../../games/beacon-lattice/puzzles';
import { normalizeProgress, PROGRESS_KEY, type LatticeProgress } from '../../games/beacon-lattice/progress';
import { parseRecentlyPlayed, RECENTLY_PLAYED_KEY } from '../../games/shared/recently-played';
import { parseStoredScore, prefKey, scoreKey } from '../../games/shared/storage';
import {
  MEMORY_MATCH_BEST_MOVES_KEY,
  KLONDIKE_GAMES_WON_KEY,
  KLONDIKE_BEST_MOVES_KEY,
  FREECELL_GAMES_WON_KEY,
  NONOGRAM_PUZZLES_REVEALED_KEY,
  TWENTY_FORTY_EIGHT_BEST_TILE_KEY,
  TILE_GARDEN_BEST_TIER_KEY,
} from '../local-game-data';
import { isGameId, type GameId, type ReadableStorage } from './types';

/**
 * Read-only readers for the local values NoCharge games already store.
 *
 * Rules that apply to every reader here:
 *
 * - Only documented NoCharge keys are read. Storage is never enumerated.
 * - Nothing is written, removed, or uploaded.
 * - Cookies, IndexedDB, and Google consent/CMP storage are never inspected.
 * - Malformed, oversized, or unexpected values read back as "no result".
 */

/** Anything longer than this is treated as unexpected data and ignored. */
const MAX_RAW_LENGTH = 64 * 1024;
/** Score-like values are short; a long numeric string is not a real result. */
const MAX_SCORE_RAW_LENGTH = 32;
/** Beyond this a stored "score" is not a value any game produced. */
const MAX_SCORE = 1e12;
/** Memory Match cannot plausibly record more moves than this. */
const MAX_MOVES = 100_000;
/** Solitaire games cannot plausibly record more wins than this. */
const MAX_WINS = 100_000;

export const BEACON_PUZZLE_TOTAL = PUZZLES.length;
const BEACON_PUZZLE_TITLES = new Map(PUZZLES.map((puzzle) => [puzzle.id, puzzle.title]));

/** Read one key defensively. Returns null for missing, throwing, or oversized values. */
function readRaw(storage: ReadableStorage, key: string, maxLength = MAX_RAW_LENGTH): string | null {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (typeof raw !== 'string') return null;
  if (raw.length === 0 || raw.length > maxLength) return null;
  return raw;
}

/**
 * Read a shared higher-is-better score through the game's own parser.
 * Returns null when the key is absent or the stored text is not a real number.
 */
export function readGameScore(storage: ReadableStorage, gameId: string): number | null {
  const raw = readRaw(storage, scoreKey(gameId), MAX_SCORE_RAW_LENGTH);
  if (raw == null || raw.trim() === '') return null;
  if (!Number.isFinite(Number(raw))) return null;
  const value = parseStoredScore(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_SCORE) return null;
  return Math.floor(value);
}

/**
 * Memory Match stores its player-facing result as a move count where lower is
 * better. `nocharge:memory-match:high` is only a derived mirror for shared
 * storage and is deliberately not surfaced as a player metric.
 */
export function readMemoryMatchBestMoves(storage: ReadableStorage): number | null {
  const raw = readRaw(storage, MEMORY_MATCH_BEST_MOVES_KEY, MAX_SCORE_RAW_LENGTH);
  if (raw == null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_MOVES) return null;
  return Math.floor(value);
}

export function readKlondikeGamesWon(storage: ReadableStorage): number | null {
  const raw = readRaw(storage, KLONDIKE_GAMES_WON_KEY, MAX_SCORE_RAW_LENGTH);
  if (raw == null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_WINS) return null;
  return Math.floor(value);
}

export function readKlondikeBestMoves(storage: ReadableStorage): number | null {
  const raw = readRaw(storage, KLONDIKE_BEST_MOVES_KEY, MAX_SCORE_RAW_LENGTH);
  if (raw == null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_MOVES) return null;
  return Math.floor(value);
}

export function readFreeCellGamesWon(storage: ReadableStorage): number | null {
  const raw = readRaw(storage, FREECELL_GAMES_WON_KEY, MAX_SCORE_RAW_LENGTH);
  if (raw == null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_WINS) return null;
  return Math.floor(value);
}

export function readNonogramPuzzlesRevealed(storage: ReadableStorage): number | null {
  const raw = readRaw(storage, NONOGRAM_PUZZLES_REVEALED_KEY, MAX_SCORE_RAW_LENGTH);
  if (raw == null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_SCORE) return null;
  return Math.floor(value);
}

export function readTwentyFortyEightBestTile(storage: ReadableStorage): number | null {
  const raw = readRaw(storage, TWENTY_FORTY_EIGHT_BEST_TILE_KEY, MAX_SCORE_RAW_LENGTH);
  if (raw == null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_SCORE) return null;
  return Math.floor(value);
}

export function readTileGardenBestTier(storage: ReadableStorage): number | null {
  const raw = readRaw(storage, TILE_GARDEN_BEST_TIER_KEY, MAX_SCORE_RAW_LENGTH);
  if (raw == null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 10) return null;
  return Math.floor(value);
}

export interface BeaconLatticeReading {
  progress: LatticeProgress;
  /** Completed ids that still exist in the current puzzle catalogue. */
  solvedIds: string[];
  total: number;
  currentTitle: string | null;
  /** Fewest beacons recorded for the puzzle currently open, when solved. */
  currentBest: number | null;
}

/**
 * Read Beacon Lattice progress through the game's own normalizer, then drop
 * puzzle ids the current catalogue no longer contains.
 */
export function readBeaconLattice(storage: ReadableStorage): BeaconLatticeReading | null {
  const raw = readRaw(storage, prefKey(PROGRESS_KEY));
  if (raw == null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const progress = normalizeProgress(parsed);
  const solvedIds = [...new Set(progress.completed)].filter((id) => BEACON_PUZZLE_TITLES.has(id));
  const currentTitle = BEACON_PUZZLE_TITLES.get(progress.currentId) ?? null;
  const rawBest = progress.bests[progress.currentId];
  const currentBest =
    currentTitle !== null &&
    typeof rawBest === 'number' &&
    Number.isFinite(rawBest) &&
    rawBest > 0 &&
    rawBest <= MAX_MOVES
      ? Math.floor(rawBest)
      : null;

  return { progress, solvedIds, total: BEACON_PUZZLE_TOTAL, currentTitle, currentBest };
}

export interface RecentReading {
  gameId: GameId;
  playedAt: number;
}

/**
 * Read Recently Played through the shared parser, then keep only ids that are
 * still registered games. Reading never rewrites the stored list.
 */
export function readRecentPlays(storage: ReadableStorage): RecentReading[] {
  const raw = readRaw(storage, RECENTLY_PLAYED_KEY);
  if (raw == null) return [];
  return parseRecentlyPlayed(raw)
    .filter((entry): entry is { gameId: GameId; playedAt: number } => isGameId(entry.gameId))
    .map((entry) => ({ gameId: entry.gameId, playedAt: entry.playedAt }));
}

/**
 * Return a read-only view of `window.localStorage`, or null when the browser
 * refuses it (private mode, blocked storage, or a hostile getter).
 */
export function getReadableBrowserStorage(): ReadableStorage | null {
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== 'function') return null;
    // Probe with a read only. Nothing is written during the probe.
    storage.getItem(RECENTLY_PLAYED_KEY);
    return { getItem: (key: string) => storage.getItem(key) };
  } catch {
    return null;
  }
}
