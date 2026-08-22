import { describe, expect, it } from 'vitest';
import { buildPassPlayDashboard } from './passplay';

/** Minimal storage double. */
function fixtureStorage(initial: Record<string, string>) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    dump: () => Object.fromEntries(store),
  };
}

const VALID_RECORD = {
  gameId: 'reversi',
  mode: '8×8 board',
  result: 'p2',
  score: [18, 46],
  finishedAt: Date.parse('2026-08-22T12:00:00Z'),
};

describe('buildPassPlayDashboard', () => {
  it('returns no rows and no storage when storage is unavailable', () => {
    expect(buildPassPlayDashboard(null)).toEqual({ storageAvailable: false, rows: [] });
    expect(buildPassPlayDashboard(undefined)).toEqual({ storageAvailable: false, rows: [] });
  });

  it('returns one row per game with a valid record, in registry order', () => {
    const storage = fixtureStorage({
      'nocharge:passplay:match:reversi': JSON.stringify(VALID_RECORD),
      'nocharge:passplay:match:tic-tac-toe': JSON.stringify({
        gameId: 'tic-tac-toe',
        mode: 'Match · first to 3',
        result: 'p1',
        score: [3, 2],
        finishedAt: Date.parse('2026-08-21T09:30:00Z'),
      }),
      'nocharge:passplay:match:pass-the-picture': JSON.stringify({
        gameId: 'pass-the-picture',
        mode: '3 passes each',
        result: 'shared',
        score: [3, 3],
        finishedAt: Date.parse('2026-08-22T15:00:00Z'),
      }),
    });
    const dashboard = buildPassPlayDashboard(storage);
    expect(dashboard.storageAvailable).toBe(true);
    expect(dashboard.rows.map((row) => row.gameId)).toEqual(['tic-tac-toe', 'reversi', 'pass-the-picture']);
    const reversi = dashboard.rows.find((row) => row.gameId === 'reversi')!;
    expect(reversi.result).toBe('Player 2');
    expect(reversi.score).toBe('18–46');
    expect(reversi.finishedAtIso).toBe('2026-08-22T12:00:00.000Z');
    const shared = dashboard.rows.find((row) => row.gameId === 'pass-the-picture')!;
    expect(shared.result).toBe('Shared picture');
    expect(shared.score).toBe('3–3');
  });

  it('ignores malformed, oversized, and mismatched records', () => {
    const storage = fixtureStorage({
      'nocharge:passplay:match:last-token': '{not json',
      'nocharge:passplay:match:dots-and-boxes': JSON.stringify({
        gameId: 'some-other-game',
        mode: '4×4 boxes',
        result: 'draw',
        score: [8, 8],
        finishedAt: 10,
      }),
      'nocharge:passplay:match:four-in-a-row': JSON.stringify({
        gameId: 'four-in-a-row',
        mode: 'x'.repeat(500),
        result: 'p1',
        score: [1, 0],
        finishedAt: 10,
      }),
    });
    const dashboard = buildPassPlayDashboard(storage);
    expect(dashboard.rows).toEqual([]);
  });

  it('reads only the six bounded passplay keys — never enumerating storage', () => {
    const keysRead: string[] = [];
    const storage = {
      getItem: (key: string) => {
        keysRead.push(key);
        return null;
      },
    };
    buildPassPlayDashboard(storage);
    expect(keysRead).toEqual([
      'nocharge:passplay:match:tic-tac-toe',
      'nocharge:passplay:match:dots-and-boxes',
      'nocharge:passplay:match:four-in-a-row',
      'nocharge:passplay:match:reversi',
      'nocharge:passplay:match:last-token',
      'nocharge:passplay:match:pass-the-picture',
    ]);
  });

  it('never writes anything', () => {
    const storage = fixtureStorage({
      'nocharge:passplay:match:reversi': JSON.stringify(VALID_RECORD),
    });
    const before = JSON.stringify(storage.dump());
    buildPassPlayDashboard(storage);
    expect(JSON.stringify(storage.dump())).toBe(before);
  });

  it('omits the ISO field for timestamps that cannot form a real date', () => {
    const storage = fixtureStorage({
      'nocharge:passplay:match:reversi': JSON.stringify({ ...VALID_RECORD, finishedAt: 1e18 }),
    });
    const dashboard = buildPassPlayDashboard(storage);
    // parsePassPlayMatchRecord rejects out-of-range timestamps entirely.
    expect(dashboard.rows).toEqual([]);
  });
});
