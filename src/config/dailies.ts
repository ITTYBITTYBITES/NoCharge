/**
 * A7 — Daily hub slot registry.
 *
 * A NoCharge daily is the same puzzle generator with a date-seeded puzzle:
 *   - seed = `YYYY-MM-DD` using the device's local date (documented, consistent);
 *   - streak and solved state live ONLY in this browser under `nocharge:daily:*`;
 *   - practice mode always exists and is untimed;
 *   - no account, no cloud, no cross-device sync.
 *
 * Each slot flips from `planned` to `live` when the corresponding daily game
 * ships; the hub, sitemap and llms.txt update automatically from this file.
 */
export interface DailySlot {
  slug: string;
  title: string;
  blurb: string;
  status: 'live' | 'planned';
  href?: string;
  storageKeys: string[];
}

export const DAILY_DATE_MODEL = 'Device-local date (YYYY-MM-DD) at the moment the daily is seeded. A late-evening game in one timezone is not the same puzzle as the same clock time elsewhere.';

export const DAILY_SLOTS: DailySlot[] = [
  {
    slug: 'word-loom',
    title: 'Daily word',
    blurb: 'A five-letter word puzzle with an original name and rules: six guesses, accessible non-color states, practice mode.',
    status: 'live',
    storageKeys: ['nocharge:daily:word-loom:streak', 'nocharge:daily:word-loom:solved'],
  },
  {
    slug: 'crossword-mini',
    title: 'Mini crossword',
    blurb: 'A 5×5 grid with short clues, untimed practice, and a date-seeded daily layout.',
    status: 'planned',
    storageKeys: ['nocharge:daily:crossword-mini:streak', 'nocharge:daily:crossword-mini:solved'],
  },
  {
    slug: 'sudoku',
    title: 'Daily sudoku',
    blurb: 'A 9×9 Sudoku with the same easy/medium/hard generator, seeded by date.',
    status: 'planned',
    storageKeys: ['nocharge:daily:sudoku:streak', 'nocharge:daily:sudoku:solved'],
  },
];

/** Storage keys introduced by the Daily hub itself (streak bookkeeping). */
export const DAILY_HUB_STORAGE_KEYS = ['nocharge:daily:last-visited'] as const;

export function dailySlotHref(slot: DailySlot): string {
  return slot.href ?? (slot.status === 'live' ? `/games/${slot.slug}/?daily=1` : '');
}
