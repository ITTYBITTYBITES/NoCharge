export const RECENTLY_PLAYED_KEY = 'nocharge:pref:recently-played';
export const RECENTLY_PLAYED_LIMIT = 4;

export interface RecentlyPlayedEntry { gameId: string; playedAt: number }
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

export function parseRecentlyPlayed(raw: string | null): RecentlyPlayedEntry[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const unique = new Map<string, RecentlyPlayedEntry>();
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const gameId = (item as RecentlyPlayedEntry).gameId;
      const playedAt = (item as RecentlyPlayedEntry).playedAt;
      if (typeof gameId !== 'string' || !gameId || typeof playedAt !== 'number' || !Number.isFinite(playedAt) || playedAt < 0) continue;
      const prior = unique.get(gameId);
      if (!prior || playedAt > prior.playedAt) unique.set(gameId, { gameId, playedAt });
    }
    return [...unique.values()].sort((a,b)=>b.playedAt-a.playedAt).slice(0,RECENTLY_PLAYED_LIMIT);
  } catch { return []; }
}

export function getBrowserStorage(): StorageLike | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

export function readRecentlyPlayed(storage: StorageLike | undefined): RecentlyPlayedEntry[] {
  if (!storage) return [];
  try { return parseRecentlyPlayed(storage.getItem(RECENTLY_PLAYED_KEY)); } catch { return []; }
}

export function recordRecentlyPlayed(storage: StorageLike | undefined, gameId: string, playedAt = Date.now()): RecentlyPlayedEntry[] {
  const next = [{ gameId, playedAt }, ...readRecentlyPlayed(storage).filter(entry=>entry.gameId!==gameId)]
    .sort((a,b)=>b.playedAt-a.playedAt).slice(0,RECENTLY_PLAYED_LIMIT);
  if (!storage) return next;
  try { storage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(next)); } catch { /* Play continues when storage is unavailable. */ }
  return next;
}

export function signalMeaningfulGameInteraction(root: HTMLElement): void {
  root.dispatchEvent(new CustomEvent('nocharge:meaningful-game-interaction', { bubbles: true }));
}
