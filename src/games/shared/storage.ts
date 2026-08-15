const PREFIX = 'nocharge:';

export function loadScore(gameId: string): number {
  try {
    const raw = localStorage.getItem(`${PREFIX}${gameId}:high`);
    if (raw == null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function saveScore(gameId: string, score: number): number {
  const prev = loadScore(gameId);
  const next = Math.max(prev, Math.floor(score));
  try {
    localStorage.setItem(`${PREFIX}${gameId}:high`, String(next));
  } catch {
    /* quota / private mode */
  }
  return next;
}

export function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}pref:${key}`);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function savePref<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${PREFIX}pref:${key}`, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
