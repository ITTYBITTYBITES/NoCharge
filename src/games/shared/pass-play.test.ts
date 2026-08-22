import { describe, expect, it, beforeEach } from 'vitest';
import {
  DEFAULT_PLAYER_NAMES,
  PASS_PLAY_GAME_IDS,
  PASS_PLAY_MATCH_KEY_PREFIX,
  createHandoffScreen,
  describeMatchResult,
  formatMatchScore,
  formatMatchTally,
  getPlayerNames,
  HANDOFF_SCREEN_TEMPLATE,
  normalizePlayerName,
  otherPlayer,
  passPlayMatchKey,
  parsePassPlayMatchRecord,
  readPassPlayMatchRecord,
  resetPlayerNames,
  savePassPlayMatchRecord,
  setPlayerName,
  turnAnnouncement,
  type HandoffRecordStorage,
} from './pass-play';

/** Minimal localStorage double used by the record tests. */
function memoryStorage(initial: Record<string, string> = {}): HandoffRecordStorage & { dump(): Record<string, string> } {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    dump: () => Object.fromEntries(store),
  };
}

describe('player names', () => {
  beforeEach(() => resetPlayerNames());

  it('uses Player 1 and Player 2 by default', () => {
    expect(getPlayerNames()).toEqual({ p1: 'Player 1', p2: 'Player 2' });
  });

  it('normalizes whitespace and length without ever persisting', () => {
    setPlayerName(1, '  Ada   Lovelace   ');
    setPlayerName(2, '\tGrace Hopper\n');
    expect(getPlayerNames()).toEqual({ p1: 'Ada Lovelace', p2: 'Grace Hopper' });
  });

  it('caps very long names and falls back on blank input', () => {
    setPlayerName(1, 'x'.repeat(200));
    setPlayerName(2, '   ');
    expect(getPlayerNames().p1.length).toBe(18);
    expect(getPlayerNames().p2).toBe('Player 2');
  });

  it('normalizePlayerName rejects non-strings', () => {
    expect(normalizePlayerName(undefined, 'Player 1')).toBe('Player 1');
    expect(normalizePlayerName(42 as unknown as string, 'Player 1')).toBe('Player 1');
  });

  it('resetPlayerNames restores the defaults', () => {
    setPlayerName(1, 'Ada');
    resetPlayerNames();
    expect(getPlayerNames()).toEqual(DEFAULT_PLAYER_NAMES);
  });
});

describe('tally and score text', () => {
  it('names the leader and uses an en dash', () => {
    expect(formatMatchTally(DEFAULT_PLAYER_NAMES, [2, 1])).toBe('Player 1 leads 2–1');
    expect(formatMatchTally({ p1: 'Ada', p2: 'Grace' }, [1, 3])).toBe('Grace leads 3–1');
  });

  it('describes level tallies without inventing a leader', () => {
    expect(formatMatchTally(DEFAULT_PLAYER_NAMES, [1, 1])).toBe('Tied 1–1');
    expect(formatMatchTally(DEFAULT_PLAYER_NAMES, [0, 0])).toBe('Tied 0–0');
  });

  it('treats malformed tallies as zero instead of throwing', () => {
    expect(formatMatchTally(DEFAULT_PLAYER_NAMES, [Number.NaN, 2])).toBe('Player 2 leads 2–0');
    expect(formatMatchTally(DEFAULT_PLAYER_NAMES, [-3, 5])).toBe('Player 2 leads 5–0');
  });

  it('formats match scores with an en dash', () => {
    expect(formatMatchScore([3, 2])).toBe('3–2');
    expect(formatMatchScore([0, 0])).toBe('0–0');
  });
});

describe('turn announcements', () => {
  beforeEach(() => resetPlayerNames());

  it('announces the player by current session name', () => {
    expect(turnAnnouncement({ p1: 'Ada', p2: 'Grace' }, 2)).toBe('Grace, it is your turn.');
    expect(turnAnnouncement({ p1: 'Ada', p2: 'Grace' }, 1, 'Round 2 of 5')).toBe(
      'Ada, it is your turn. Round 2 of 5',
    );
  });

  it('otherPlayer flips the slot', () => {
    expect(otherPlayer(1)).toBe(2);
    expect(otherPlayer(2)).toBe(1);
  });
});

describe('match records', () => {
  it('keys every record under nocharge:passplay:match:', () => {
    for (const id of PASS_PLAY_GAME_IDS) {
      expect(passPlayMatchKey(id)).toBe(`${PASS_PLAY_MATCH_KEY_PREFIX}${id}`);
    }
    expect(passPlayMatchKey('tic-tac-toe')).toBe('nocharge:passplay:match:tic-tac-toe');
  });

  it('round-trips one record per game', () => {
    const storage = memoryStorage();
    const saved = savePassPlayMatchRecord(storage, {
      gameId: 'reversi',
      mode: '8×8 board',
      result: 'p2',
      score: [18, 46],
      finishedAt: Date.parse('2026-08-22T12:00:00Z'),
    });
    expect(saved).toBe(true);
    expect(Object.keys(storage.dump())).toEqual(['nocharge:passplay:match:reversi']);
    expect(readPassPlayMatchRecord(storage, 'reversi')).toEqual({
      gameId: 'reversi',
      mode: '8×8 board',
      result: 'p2',
      score: [18, 46],
      finishedAt: Date.parse('2026-08-22T12:00:00Z'),
    });
  });

  it('overwrites in place so storage stays bounded at one record per game', () => {
    const storage = memoryStorage();
    savePassPlayMatchRecord(storage, { gameId: 'last-token', mode: '3-4-5', result: 'p1', score: [1, 0], finishedAt: 1 });
    savePassPlayMatchRecord(storage, { gameId: 'last-token', mode: '1-3-5-7', result: 'draw', score: [2, 2], finishedAt: 2 });
    const keys = Object.keys(storage.dump());
    expect(keys).toEqual(['nocharge:passplay:match:last-token']);
    expect(readPassPlayMatchRecord(storage, 'last-token')?.mode).toBe('1-3-5-7');
  });

  it('reads malformed, oversized, or absent records as absent', () => {
    const bad = memoryStorage({
      'nocharge:passplay:match:reversi': '{not json',
      'nocharge:passplay:match:last-token': JSON.stringify({ gameId: 'last-token' }),
      'nocharge:passplay:match:tic-tac-toe': JSON.stringify({
        gameId: 'tic-tac-toe',
        mode: 'Match',
        result: 'nobody',
        score: [1, 2],
        finishedAt: 5,
      }),
      'nocharge:passplay:match:dots-and-boxes': JSON.stringify({
        gameId: 'dots-and-boxes',
        mode: 'x'.repeat(200),
        result: 'draw',
        score: [1, 1],
        finishedAt: 5,
      }),
    });
    expect(parsePassPlayMatchRecord(null)).toBeNull();
    expect(parsePassPlayMatchRecord('[]')).toBeNull();
    expect(readPassPlayMatchRecord(bad, 'reversi')).toBeNull();
    expect(readPassPlayMatchRecord(bad, 'last-token')).toBeNull();
    expect(readPassPlayMatchRecord(bad, 'tic-tac-toe')).toBeNull();
    expect(readPassPlayMatchRecord(bad, 'dots-and-boxes')).toBeNull();
    expect(readPassPlayMatchRecord(undefined, 'reversi')).toBeNull();
  });

  it('ignores quota failures so play continues without storage', () => {
    const refusing: HandoffRecordStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(
      savePassPlayMatchRecord(refusing, { gameId: 'reversi', mode: '8×8 board', result: 'draw', score: [1, 1], finishedAt: 3 }),
    ).toBe(false);
  });

  it('describes results as Player 1, Player 2, Draw, or a shared picture', () => {
    const base = { gameId: 'x', mode: 'm', score: [1, 0] as const, finishedAt: 0 };
    expect(describeMatchResult({ ...base, result: 'p1' })).toBe('Player 1');
    expect(describeMatchResult({ ...base, result: 'p2' })).toBe('Player 2');
    expect(describeMatchResult({ ...base, result: 'draw' })).toBe('Draw');
    expect(describeMatchResult({ ...base, result: 'shared' })).toBe('Shared picture');
  });
});

describe('handoff screen factory', () => {
  it('is not instantiated in non-browser unit tests; template stays canonical', () => {
    // The DOM factory is covered by browser e2e; here we pin the contract the
    // component clones: heading, editable names, tally slot, live region,
    // and a large Continue button.
    expect(typeof createHandoffScreen).toBe('function');
    expect(HANDOFF_SCREEN_TEMPLATE).toContain('data-pp="title"');
    expect(HANDOFF_SCREEN_TEMPLATE).toContain('data-pp="tally"');
    expect(HANDOFF_SCREEN_TEMPLATE).toContain('role="status"');
    expect(HANDOFF_SCREEN_TEMPLATE).toContain('data-pp-name="1"');
    expect(HANDOFF_SCREEN_TEMPLATE).toContain('data-pp-name="2"');
    expect(HANDOFF_SCREEN_TEMPLATE).toContain('data-pp="continue"');
    expect(HANDOFF_SCREEN_TEMPLATE).toContain('maxlength="18"');
  });
});
