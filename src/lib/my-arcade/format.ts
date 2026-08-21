/**
 * Display formatting for My Arcade. Pure functions only: no storage access,
 * no network, and no side effects.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** Epoch milliseconds outside this range cannot be a real play timestamp. */
const MAX_TIMESTAMP = 8.64e15;

export function isDisplayableTimestamp(playedAt: unknown): playedAt is number {
  return (
    typeof playedAt === 'number' &&
    Number.isFinite(playedAt) &&
    playedAt >= 0 &&
    playedAt <= MAX_TIMESTAMP &&
    !Number.isNaN(new Date(playedAt).getTime())
  );
}

/** ISO-8601 string for a `<time datetime>` attribute, or undefined when unusable. */
export function toIsoTimestamp(playedAt: number): string | undefined {
  if (!isDisplayableTimestamp(playedAt)) return undefined;
  try {
    return new Date(playedAt).toISOString();
  } catch {
    return undefined;
  }
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * A restrained, non-ticking date label.
 *
 * Same calendar day reads "Today", the previous day reads "Yesterday", and
 * everything else — including a timestamp in the future — reads as a plain
 * date. No relative countdown, no seconds, and no timezone claim.
 */
export function formatPlayedAt(playedAt: number, now: number = Date.now()): string | undefined {
  if (!isDisplayableTimestamp(playedAt)) return undefined;
  const played = new Date(playedAt);
  const today = new Date(now);
  const dayDifference = Math.round((startOfDay(today) - startOfDay(played)) / 86_400_000);
  if (dayDifference === 0) return 'Today';
  if (dayDifference === 1) return 'Yesterday';

  const month = MONTHS[played.getMonth()] ?? '';
  const day = played.getDate();
  return played.getFullYear() === today.getFullYear()
    ? `${month} ${day}`
    : `${month} ${day}, ${played.getFullYear()}`;
}

/** Group a whole number for display without claiming a locale NoCharge cannot verify. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const whole = Math.floor(value);
  return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
