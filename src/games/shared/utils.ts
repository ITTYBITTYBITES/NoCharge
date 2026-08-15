/** Fisher–Yates shuffle (mutates and returns array). */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Prefer pointer events; fall back cleanly. */
export function onPress(
  el: HTMLElement,
  handler: (e: PointerEvent | MouseEvent | TouchEvent) => void,
): () => void {
  const fn = (e: Event) => {
    e.preventDefault();
    handler(e as PointerEvent);
  };
  el.addEventListener('pointerdown', fn);
  return () => el.removeEventListener('pointerdown', fn);
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
