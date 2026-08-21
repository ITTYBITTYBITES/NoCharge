import { formatCount, formatPlayedAt, toIsoTimestamp } from './format';
import {
  readBeaconLattice,
  readGameScore,
  readMemoryMatchBestMoves,
  readRecentPlays,
} from './readers';
import {
  MY_ARCADE_GAME_IDS,
  type GameId,
  type LocalDashboard,
  type LocalGameMetric,
  type LocalGameSummary,
  type ReadableStorage,
  type RecentPlaySummary,
} from './types';

export const NO_SAVED_RESULT_MESSAGE = 'No saved result in this browser yet.';
export const STORAGE_BLOCKED_MESSAGE =
  'This browser is not allowing local game data right now. You can still open and play every game.';
export const EMPTY_DASHBOARD_MESSAGE = 'Choose a game whenever you are ready.';

/** Color Flip stores its two modes under separate keys. */
const COLOR_FLIP_TURN_BASED_ID = 'color-flip-turn-based';

function memoryMatchMetrics(storage: ReadableStorage): LocalGameMetric[] {
  const bestMoves = readMemoryMatchBestMoves(storage);
  if (bestMoves == null) return [];
  return [
    {
      label: 'Fewest moves',
      value: formatCount(bestMoves),
      detail: 'Memory Match counts a move each time you reveal a second card. Fewer is better.',
    },
  ];
}

function wordTileRushMetrics(storage: ReadableStorage): LocalGameMetric[] {
  const best = readGameScore(storage, 'word-tile-rush');
  if (best == null) return [];
  return [
    {
      label: 'Best score',
      value: formatCount(best),
      detail: 'Longer words score more; the value is the highest run saved in this browser.',
    },
  ];
}

function colorFlipMetrics(storage: ReadableStorage): LocalGameMetric[] {
  const metrics: LocalGameMetric[] = [];
  const visual = readGameScore(storage, 'color-flip');
  if (visual != null) {
    metrics.push({
      label: 'Best score, Visual mode',
      value: formatCount(visual),
      detail: 'Tiles matched at the checkpoint during the timed canvas run.',
    });
  }
  const turnBased = readGameScore(storage, COLOR_FLIP_TURN_BASED_ID);
  if (turnBased != null) {
    metrics.push({
      label: 'Best score, Turn-based mode',
      value: formatCount(turnBased),
      detail: 'The untimed mode keeps its own separate best score.',
    });
  }
  return metrics;
}

function beaconLatticeMetrics(storage: ReadableStorage): LocalGameMetric[] {
  const reading = readBeaconLattice(storage);
  if (!reading) return [];
  const metrics: LocalGameMetric[] = [];
  if (reading.solvedIds.length > 0) {
    metrics.push({
      label: 'Puzzles solved',
      value: `${formatCount(reading.solvedIds.length)} of ${formatCount(reading.total)}`,
      detail: 'Solved puzzles stay solved; the order you play them in is your own.',
    });
  }
  if (reading.currentTitle) {
    metrics.push({
      label: 'Puzzle open',
      value: reading.currentTitle,
      detail: 'The puzzle this browser will show when you continue.',
    });
  }
  if (reading.currentBest != null) {
    metrics.push({
      label: 'Fewest beacons recorded',
      value: formatCount(reading.currentBest),
      detail: `Your own lowest recorded count on ${reading.currentTitle ?? 'this puzzle'}. It is not a proven minimum.`,
    });
  }
  return metrics;
}

const METRIC_READERS: Record<GameId, (storage: ReadableStorage) => LocalGameMetric[]> = {
  'memory-match': memoryMatchMetrics,
  'word-tile-rush': wordTileRushMetrics,
  'color-flip': colorFlipMetrics,
  'beacon-lattice': beaconLatticeMetrics,
};

function summarizeGame(
  gameId: GameId,
  storage: ReadableStorage,
  lastPlayedAt: string | undefined,
): LocalGameSummary {
  const metrics = METRIC_READERS[gameId](storage);
  let status: LocalGameSummary['status'] = 'unplayed';
  if (metrics.length > 0) {
    // Beacon Lattice can expose an open puzzle before any puzzle is solved.
    const hasResult = gameId !== 'beacon-lattice' || metrics.some((metric) => metric.label !== 'Puzzle open');
    status = hasResult ? 'has-result' : 'has-progress';
  } else if (lastPlayedAt) {
    status = 'played';
  }
  return lastPlayedAt ? { gameId, status, lastPlayedAt, metrics } : { gameId, status, metrics };
}

/**
 * Build the normalized display model for My Arcade.
 *
 * The result is returned to the caller and rendered. It is never written back
 * to local storage, never sent anywhere, and never logged.
 */
export function buildLocalDashboard(storage: ReadableStorage | null | undefined): LocalDashboard {
  if (!storage) {
    return {
      storageAvailable: false,
      recent: [],
      games: MY_ARCADE_GAME_IDS.map((gameId) => ({ gameId, status: 'unplayed', metrics: [] })),
      isEmpty: false,
    };
  }

  const recent: RecentPlaySummary[] = readRecentPlays(storage).map((entry) => {
    const iso = toIsoTimestamp(entry.playedAt);
    return iso
      ? { gameId: entry.gameId, playedAt: entry.playedAt, lastPlayedAt: iso }
      : { gameId: entry.gameId, playedAt: entry.playedAt };
  });
  const lastPlayed = new Map(recent.map((entry) => [entry.gameId, entry.lastPlayedAt]));

  const games = MY_ARCADE_GAME_IDS.map((gameId) => summarizeGame(gameId, storage, lastPlayed.get(gameId)));
  const isEmpty = recent.length === 0 && games.every((game) => game.metrics.length === 0);

  return { storageAvailable: true, recent, games, isEmpty };
}

/** Human label for a recent record, e.g. "Today" or "Aug 21". */
export function recentDateLabel(entry: RecentPlaySummary, now: number = Date.now()): string | undefined {
  return formatPlayedAt(entry.playedAt, now);
}
