import { describe, expect, it } from 'vitest';

import { PUZZLES } from '../../games/beacon-lattice/puzzles';
import { RECENTLY_PLAYED_KEY, RECENTLY_PLAYED_LIMIT } from '../../games/shared/recently-played';
import {
  CLEARABLE_GAME_DATA_KEYS,
  clearLocalGameData,
  MEMORY_MATCH_BEST_MOVES_KEY,
} from '../local-game-data';
import { formatPlayedAt, toIsoTimestamp } from './format';
import { BEACON_PUZZLE_TOTAL, getReadableBrowserStorage, readBeaconLattice } from './readers';
import { buildLocalDashboard, NO_SAVED_RESULT_MESSAGE, STORAGE_BLOCKED_MESSAGE } from './summary';
import { MY_ARCADE_GAME_IDS, type LocalDashboard } from './types';

/**
 * All fixtures below are invented representative values. No capture of a real
 * visitor's storage is used anywhere in this suite.
 */

const BEACON_PROGRESS_KEY = 'nocharge:pref:beacon-lattice-progress';
const MEMORY_HIGH = 'nocharge:memory-match:high';
const WORD_HIGH = 'nocharge:word-tile-rush:high';
const COLOR_HIGH = 'nocharge:color-flip:high';
const COLOR_TURN_HIGH = 'nocharge:color-flip-turn-based:high';
const CONSENT_KEY = 'nocharge:consent';

interface FixtureStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readKeys: string[];
  writtenKeys: string[];
  removedKeys: string[];
  entries: Record<string, string>;
}

function fixtureStorage(
  entries: Record<string, string> = {},
  options: { throwOnGet?: boolean } = {},
): FixtureStorage {
  const state: Record<string, string> = { ...entries };
  const storage: FixtureStorage = {
    entries: state,
    readKeys: [],
    writtenKeys: [],
    removedKeys: [],
    getItem(key) {
      storage.readKeys.push(key);
      if (options.throwOnGet) throw new Error('SecurityError: storage is blocked');
      return Object.prototype.hasOwnProperty.call(state, key) ? state[key]! : null;
    },
    setItem(key, value) {
      storage.writtenKeys.push(key);
      state[key] = value;
    },
    removeItem(key) {
      storage.removedKeys.push(key);
      delete state[key];
    },
  };
  return storage;
}

function metricLabels(dashboard: LocalDashboard, gameId: string): string[] {
  return dashboard.games.find((game) => game.gameId === gameId)?.metrics.map((metric) => metric.label) ?? [];
}

function metricValue(dashboard: LocalDashboard, gameId: string, label: string): string | undefined {
  return dashboard.games
    .find((game) => game.gameId === gameId)
    ?.metrics.find((metric) => metric.label === label)?.value;
}

const DAY = 86_400_000;
const NOW = new Date('2026-08-21T15:00:00Z').getTime();

describe('My Arcade local dashboard', () => {
  it('returns a neutral empty model when nothing is stored', () => {
    const dashboard = buildLocalDashboard(fixtureStorage());
    expect(dashboard.storageAvailable).toBe(true);
    expect(dashboard.isEmpty).toBe(true);
    expect(dashboard.recent).toEqual([]);
    expect(dashboard.games.map((game) => game.gameId)).toEqual([...MY_ARCADE_GAME_IDS]);
    for (const game of dashboard.games) {
      expect(game.metrics).toEqual([]);
      expect(game.status).toBe('unplayed');
      expect(game.lastPlayedAt).toBeUndefined();
    }
  });

  it('summarizes one played game without inventing anything for the others', () => {
    const dashboard = buildLocalDashboard(
      fixtureStorage({
        [RECENTLY_PLAYED_KEY]: JSON.stringify([{ gameId: 'memory-match', playedAt: NOW - DAY }]),
        [MEMORY_MATCH_BEST_MOVES_KEY]: '14',
        [MEMORY_HIGH]: '860',
      }),
    );

    expect(dashboard.isEmpty).toBe(false);
    expect(dashboard.recent.map((entry) => entry.gameId)).toEqual(['memory-match']);
    expect(metricLabels(dashboard, 'memory-match')).toEqual(['Fewest moves']);
    expect(metricValue(dashboard, 'memory-match', 'Fewest moves')).toBe('14');
    expect(dashboard.games.find((game) => game.gameId === 'memory-match')?.status).toBe('has-result');
    for (const gameId of ['word-tile-rush', 'color-flip', 'beacon-lattice']) {
      expect(metricLabels(dashboard, gameId)).toEqual([]);
      expect(dashboard.games.find((game) => game.gameId === gameId)?.status).toBe('unplayed');
    }
  });

  it('summarizes multiple played games with each game keeping its own metric', () => {
    const dashboard = buildLocalDashboard(
      fixtureStorage({
        [RECENTLY_PLAYED_KEY]: JSON.stringify([
          { gameId: 'color-flip', playedAt: NOW - 60_000 },
          { gameId: 'word-tile-rush', playedAt: NOW - 4 * DAY },
        ]),
        [MEMORY_MATCH_BEST_MOVES_KEY]: '18',
        [WORD_HIGH]: '4200',
        [COLOR_HIGH]: '12',
        [COLOR_TURN_HIGH]: '7',
        [BEACON_PROGRESS_KEY]: JSON.stringify({
          currentId: PUZZLES[1]!.id,
          completed: [PUZZLES[0]!.id, PUZZLES[1]!.id],
          bests: { [PUZZLES[1]!.id]: 3 },
          lastSolved: { [PUZZLES[1]!.id]: 4 },
        }),
      }),
    );

    expect(metricLabels(dashboard, 'memory-match')).toEqual(['Fewest moves']);
    expect(metricLabels(dashboard, 'word-tile-rush')).toEqual(['Best score']);
    expect(metricValue(dashboard, 'word-tile-rush', 'Best score')).toBe('4,200');
    expect(metricLabels(dashboard, 'color-flip')).toEqual([
      'Best score, Visual mode',
      'Best score, Turn-based mode',
    ]);
    expect(metricLabels(dashboard, 'beacon-lattice')).toEqual([
      'Puzzles solved',
      'Puzzle open',
      'Fewest beacons recorded',
    ]);
    expect(metricValue(dashboard, 'beacon-lattice', 'Puzzles solved')).toBe(`2 of ${BEACON_PUZZLE_TOTAL}`);
    expect(metricValue(dashboard, 'beacon-lattice', 'Puzzle open')).toBe(PUZZLES[1]!.title);

    // There is no combined score and no completion percentage anywhere.
    const values = dashboard.games.flatMap((game) => game.metrics.map((metric) => metric.value));
    expect(values.some((value) => value.includes('%'))).toBe(false);
  });

  it('keeps Recently Played newest first and collapses duplicate records', () => {
    const dashboard = buildLocalDashboard(
      fixtureStorage({
        [RECENTLY_PLAYED_KEY]: JSON.stringify([
          { gameId: 'memory-match', playedAt: NOW - 3 * DAY },
          { gameId: 'color-flip', playedAt: NOW - DAY },
          { gameId: 'memory-match', playedAt: NOW - 10_000 },
          { gameId: 'beacon-lattice', playedAt: NOW - 2 * DAY },
        ]),
      }),
    );

    expect(dashboard.recent.map((entry) => entry.gameId)).toEqual([
      'memory-match',
      'color-flip',
      'beacon-lattice',
    ]);
    expect(dashboard.recent.length).toBeLessThanOrEqual(RECENTLY_PLAYED_LIMIT);
  });

  it('never exceeds the existing Recently Played maximum', () => {
    const dashboard = buildLocalDashboard(
      fixtureStorage({
        [RECENTLY_PLAYED_KEY]: JSON.stringify(
          MY_ARCADE_GAME_IDS.map((gameId, index) => ({ gameId, playedAt: NOW - index * DAY })),
        ),
      }),
    );
    expect(dashboard.recent).toHaveLength(RECENTLY_PLAYED_LIMIT);
  });

  it('drops unknown and unregistered game ids from Recently Played', () => {
    const dashboard = buildLocalDashboard(
      fixtureStorage({
        [RECENTLY_PLAYED_KEY]: JSON.stringify([
          { gameId: 'retired-game', playedAt: NOW },
          { gameId: 'memory-match', playedAt: NOW - DAY },
          { gameId: 42, playedAt: NOW },
        ]),
      }),
    );
    expect(dashboard.recent.map((entry) => entry.gameId)).toEqual(['memory-match']);
  });

  it('ignores malformed Recently Played timestamps without dropping valid records', () => {
    const dashboard = buildLocalDashboard(
      fixtureStorage({
        [RECENTLY_PLAYED_KEY]: JSON.stringify([
          { gameId: 'memory-match', playedAt: 'yesterday' },
          { gameId: 'color-flip', playedAt: Number.NaN },
          { gameId: 'word-tile-rush', playedAt: -5 },
          { gameId: 'beacon-lattice', playedAt: NOW - DAY },
        ]),
      }),
    );
    expect(dashboard.recent.map((entry) => entry.gameId)).toEqual(['beacon-lattice']);
  });

  it('shows a future timestamp as a plain date rather than a countdown', () => {
    const future = NOW + 30 * DAY;
    const dashboard = buildLocalDashboard(
      fixtureStorage({
        [RECENTLY_PLAYED_KEY]: JSON.stringify([{ gameId: 'color-flip', playedAt: future }]),
      }),
    );
    expect(dashboard.recent[0]?.lastPlayedAt).toBe(new Date(future).toISOString());
    const label = formatPlayedAt(future, NOW);
    expect(label).toBeDefined();
    expect(label).not.toMatch(/ago|in \d/i);
    expect(label).not.toBe('Today');
  });

  it('rejects malformed Beacon Lattice progress', () => {
    for (const raw of ['{not json', '"a string"', '[1,2,3]', 'null']) {
      const dashboard = buildLocalDashboard(fixtureStorage({ [BEACON_PROGRESS_KEY]: raw }));
      expect(metricLabels(dashboard, 'beacon-lattice')).toEqual([]);
    }
  });

  it('accepts partial Beacon Lattice progress without inventing solved puzzles', () => {
    const dashboard = buildLocalDashboard(
      fixtureStorage({ [BEACON_PROGRESS_KEY]: JSON.stringify({ currentId: PUZZLES[2]!.id }) }),
    );
    expect(metricLabels(dashboard, 'beacon-lattice')).toEqual(['Puzzle open']);
    expect(dashboard.games.find((game) => game.gameId === 'beacon-lattice')?.status).toBe('has-progress');
  });

  it('reads an older valid Beacon Lattice record that predates the bests map', () => {
    const legacy = JSON.stringify({ currentId: PUZZLES[0]!.id, completed: [PUZZLES[0]!.id] });
    const reading = readBeaconLattice(fixtureStorage({ [BEACON_PROGRESS_KEY]: legacy }));
    expect(reading?.solvedIds).toEqual([PUZZLES[0]!.id]);
    expect(reading?.currentBest).toBeNull();

    const dashboard = buildLocalDashboard(fixtureStorage({ [BEACON_PROGRESS_KEY]: legacy }));
    expect(metricLabels(dashboard, 'beacon-lattice')).toEqual(['Puzzles solved', 'Puzzle open']);
  });

  it('drops puzzle ids the current catalogue no longer contains', () => {
    const dashboard = buildLocalDashboard(
      fixtureStorage({
        [BEACON_PROGRESS_KEY]: JSON.stringify({
          currentId: 'bl-99-removed',
          completed: [PUZZLES[0]!.id, 'bl-98-removed', 'bl-97-removed'],
          bests: { 'bl-99-removed': 2 },
        }),
      }),
    );
    expect(metricValue(dashboard, 'beacon-lattice', 'Puzzles solved')).toBe(`1 of ${BEACON_PUZZLE_TOTAL}`);
    expect(metricLabels(dashboard, 'beacon-lattice')).toEqual(['Puzzles solved']);
  });

  it('rejects malformed and oversized score values instead of showing a wrong number', () => {
    const dashboard = buildLocalDashboard(
      fixtureStorage({
        [WORD_HIGH]: 'not-a-number',
        [COLOR_HIGH]: '1e400',
        [COLOR_TURN_HIGH]: '9'.repeat(64),
        [MEMORY_MATCH_BEST_MOVES_KEY]: '-4',
      }),
    );
    expect(metricLabels(dashboard, 'word-tile-rush')).toEqual([]);
    expect(metricLabels(dashboard, 'color-flip')).toEqual([]);
    expect(metricLabels(dashboard, 'memory-match')).toEqual([]);
    expect(dashboard.isEmpty).toBe(true);
  });

  it('rejects an oversized Recently Played or progress payload', () => {
    const oversized = JSON.stringify(
      Array.from({ length: 5000 }, () => ({ gameId: 'memory-match', playedAt: NOW })),
    );
    const dashboard = buildLocalDashboard(
      fixtureStorage({ [RECENTLY_PLAYED_KEY]: oversized, [BEACON_PROGRESS_KEY]: `{"note":"${'x'.repeat(70_000)}"}` }),
    );
    expect(dashboard.recent).toEqual([]);
    expect(metricLabels(dashboard, 'beacon-lattice')).toEqual([]);
  });

  it('fails safely when local storage is unavailable', () => {
    const dashboard = buildLocalDashboard(null);
    expect(dashboard.storageAvailable).toBe(false);
    expect(dashboard.isEmpty).toBe(false);
    expect(dashboard.recent).toEqual([]);
    expect(dashboard.games).toHaveLength(MY_ARCADE_GAME_IDS.length);
    expect(STORAGE_BLOCKED_MESSAGE).toContain('You can still open and play every game.');
  });

  it('fails safely when getItem throws', () => {
    const storage = fixtureStorage({}, { throwOnGet: true });
    const dashboard = buildLocalDashboard(storage);
    expect(dashboard.storageAvailable).toBe(true);
    expect(dashboard.recent).toEqual([]);
    expect(dashboard.games.every((game) => game.metrics.length === 0)).toBe(true);
    expect(dashboard.isEmpty).toBe(true);
  });

  it('returns null browser storage when window is unavailable', () => {
    expect(getReadableBrowserStorage()).toBeNull();
  });

  it('reads only documented NoCharge keys and never writes the derived model back', () => {
    const storage = fixtureStorage({
      [RECENTLY_PLAYED_KEY]: JSON.stringify([{ gameId: 'memory-match', playedAt: NOW }]),
      [MEMORY_MATCH_BEST_MOVES_KEY]: '14',
      [WORD_HIGH]: '900',
      [COLOR_HIGH]: '11',
      [BEACON_PROGRESS_KEY]: JSON.stringify({ currentId: PUZZLES[0]!.id, completed: [PUZZLES[0]!.id] }),
      [CONSENT_KEY]: '{"version":1,"analytics":false}',
    });

    buildLocalDashboard(storage);

    expect(storage.writtenKeys).toEqual([]);
    expect(storage.removedKeys).toEqual([]);
    const allowedReads = new Set([
      RECENTLY_PLAYED_KEY,
      MEMORY_MATCH_BEST_MOVES_KEY,
      MEMORY_HIGH,
      WORD_HIGH,
      COLOR_HIGH,
      COLOR_TURN_HIGH,
      BEACON_PROGRESS_KEY,
    ]);
    for (const key of storage.readKeys) expect(allowedReads.has(key)).toBe(true);
    // The consent choice and Google's own storage are never read for summaries.
    expect(storage.readKeys).not.toContain(CONSENT_KEY);
  });

  it('uses neutral wording for a game with no saved result', () => {
    expect(NO_SAVED_RESULT_MESSAGE).toBe('No saved result in this browser yet.');
    expect(NO_SAVED_RESULT_MESSAGE).not.toMatch(/%|incomplete|streak|rank|level/i);
  });
});

describe('My Arcade date formatting', () => {
  it('labels today, yesterday, and older dates without a ticking timer', () => {
    expect(formatPlayedAt(NOW - 60_000, NOW)).toBe('Today');
    expect(formatPlayedAt(NOW - DAY, NOW)).toBe('Yesterday');
    expect(formatPlayedAt(new Date('2026-08-02T09:00:00Z').getTime(), NOW)).toMatch(/^Aug \d{1,2}$/);
    expect(formatPlayedAt(new Date('2025-12-24T09:00:00Z').getTime(), NOW)).toMatch(/^Dec \d{1,2}, 2025$/);
  });

  it('returns nothing for timestamps that cannot form a real date', () => {
    expect(formatPlayedAt(Number.NaN, NOW)).toBeUndefined();
    expect(formatPlayedAt(Number.POSITIVE_INFINITY, NOW)).toBeUndefined();
    expect(formatPlayedAt(1e18, NOW)).toBeUndefined();
    expect(toIsoTimestamp(1e18)).toBeUndefined();
  });
});

describe('Clear Game Data source of truth', () => {
  it('is the single allowlist shared by Privacy and My Arcade', () => {
    expect(CLEARABLE_GAME_DATA_KEYS).toEqual([
      MEMORY_HIGH,
      WORD_HIGH,
      COLOR_HIGH,
      COLOR_TURN_HIGH,
      'nocharge:beacon-lattice:high',
      MEMORY_MATCH_BEST_MOVES_KEY,
      'nocharge:pref:game-muted',
      BEACON_PROGRESS_KEY,
      RECENTLY_PLAYED_KEY,
    ]);
  });

  it('removes every game key and leaves consent, Google CMP, and unrelated storage untouched', () => {
    const storage = fixtureStorage({
      [MEMORY_HIGH]: '860',
      [MEMORY_MATCH_BEST_MOVES_KEY]: '14',
      [WORD_HIGH]: '4200',
      [COLOR_HIGH]: '12',
      [COLOR_TURN_HIGH]: '7',
      'nocharge:beacon-lattice:high': '2',
      [BEACON_PROGRESS_KEY]: '{"currentId":"bl-01-first-plus"}',
      'nocharge:pref:game-muted': 'true',
      [RECENTLY_PLAYED_KEY]: '[{"gameId":"memory-match","playedAt":1}]',
      [CONSENT_KEY]: '{"version":1,"analytics":true}',
      'FCCDCF': 'google-cmp-value',
      '__gpp': 'google-cmp-value',
      'unrelated-origin-key': 'keep-me',
    });

    expect(clearLocalGameData(storage)).toBe(true);

    for (const key of CLEARABLE_GAME_DATA_KEYS) expect(storage.entries[key]).toBeUndefined();
    expect(storage.entries[CONSENT_KEY]).toBe('{"version":1,"analytics":true}');
    expect(storage.entries['FCCDCF']).toBe('google-cmp-value');
    expect(storage.entries['__gpp']).toBe('google-cmp-value');
    expect(storage.entries['unrelated-origin-key']).toBe('keep-me');
    expect(storage.removedKeys).toEqual([...CLEARABLE_GAME_DATA_KEYS]);
  });

  it('reports failure instead of throwing when storage refuses removal', () => {
    const hostile = {
      removeItem() {
        throw new Error('SecurityError: storage is blocked');
      },
    };
    expect(clearLocalGameData(hostile)).toBe(false);
    expect(clearLocalGameData(undefined)).toBe(false);
  });

  it('leaves the dashboard empty after clearing', () => {
    const storage = fixtureStorage({
      [MEMORY_MATCH_BEST_MOVES_KEY]: '14',
      [RECENTLY_PLAYED_KEY]: '[{"gameId":"memory-match","playedAt":1}]',
    });
    clearLocalGameData(storage);
    expect(buildLocalDashboard(storage).isEmpty).toBe(true);
  });
});
