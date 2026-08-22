import {
  describeMatchResult,
  formatMatchScore,
  PASS_PLAY_GAME_IDS,
  parsePassPlayMatchRecord,
  type PassPlayMatchRecord,
} from '../../games/shared/pass-play';
import { isDisplayableTimestamp, toIsoTimestamp } from './format';
import type { ReadableStorage } from './types';

/**
 * Read-only reader for the My Arcade Pass &amp; Play section.
 *
 * The section shows the single most recent match record per game — never a
 * history. Storage stays bounded by design because each game overwrites its
 * own record in place. Player names are session-only and are never stored,
 * so nothing here can contain one.
 */

/** Anything longer than this is not a record any NoCharge game produced. */
const MAX_RAW_LENGTH = 2048;

export interface PassPlayRow {
  gameId: string;
  mode: string;
  /** Display label: Player 1, Player 2, Draw, or Shared picture. */
  result: string;
  /** "2–1" style match score, en dash. */
  score: string;
  /** Epoch milliseconds as stored. */
  finishedAt: number;
  /** ISO-8601 string for a `<time>` element, when the timestamp is a real date. */
  finishedAtIso?: string;
}

export interface PassPlayDashboard {
  storageAvailable: boolean;
  /** Rows for games with a valid stored record, in registry order. */
  rows: PassPlayRow[];
}

function readRaw(storage: ReadableStorage, key: string): string | null {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_RAW_LENGTH) return null;
  return raw;
}

function toRow(record: PassPlayMatchRecord): PassPlayRow {
  const row: PassPlayRow = {
    gameId: record.gameId,
    mode: record.mode,
    result: describeMatchResult(record),
    score: formatMatchScore(record.score),
    finishedAt: record.finishedAt,
  };
  if (isDisplayableTimestamp(record.finishedAt)) {
    row.finishedAtIso = toIsoTimestamp(record.finishedAt);
  }
  return row;
}

/**
 * Build the Pass &amp; Play section model: the most recent record of each of
 * the six games, in the registry order the page renders. Nothing is written
 * back, enumerated, or uploaded.
 */
export function buildPassPlayDashboard(storage: ReadableStorage | null | undefined): PassPlayDashboard {
  if (!storage) return { storageAvailable: false, rows: [] };
  const rows: PassPlayRow[] = [];
  for (const gameId of PASS_PLAY_GAME_IDS) {
    const record = parsePassPlayMatchRecord(readRaw(storage, `nocharge:passplay:match:${gameId}`));
    // A record naming another game under this key is corrupt, not playable.
    if (record && record.gameId === gameId) rows.push(toRow(record));
  }
  return { storageAvailable: true, rows };
}
