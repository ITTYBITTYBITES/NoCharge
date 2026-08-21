const PREFIX = 'nocharge:';

/** Canonical key for a game's shared higher-is-better score. */
export function scoreKey(gameId: string): string {
  return `${PREFIX}${gameId}:high`;
}

/** Canonical key for a shared or game preference value. */
export function prefKey(key: string): string {
  return `${PREFIX}pref:${key}`;
}

/**
 * The single parser for a stored shared score. Anything missing, malformed, or
 * non-finite reads back as 0 so a damaged value never breaks a game or a
 * read-only summary of that value.
 */
export function parseStoredScore(raw: string | null): number {
  if (raw == null) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** The single parser for a stored preference value. */
export function parseStoredPref<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadScore(gameId: string): number {
  try {
    return parseStoredScore(localStorage.getItem(scoreKey(gameId)));
  } catch {
    return 0;
  }
}

export function saveScore(gameId: string, score: number): number {
  const prev = loadScore(gameId);
  const next = Math.max(prev, Math.floor(score));
  try {
    localStorage.setItem(scoreKey(gameId), String(next));
  } catch {
    /* quota / private mode */
  }
  return next;
}

export function loadPref<T>(key: string, fallback: T): T {
  try {
    return parseStoredPref(localStorage.getItem(prefKey(key)), fallback);
  } catch {
    return fallback;
  }
}

export function savePref<T>(key: string, value: T): void {
  try {
    localStorage.setItem(prefKey(key), JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
