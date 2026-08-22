/**
 * Pass the Picture scheduling logic for the Pass &amp; Play edition.
 *
 * Pure functions only: no DOM, no storage, no canvas. Two players alternate
 * one stroke per pass on a shared drawing; nothing is scored, ranked, or
 * uploaded — the finished picture is the result.
 */

export type PicturePlayer = 1 | 2;

/** Passes available to each player. */
export const PASS_CHOICES = [2, 3, 4, 5] as const;
export const DEFAULT_PASSES = 3;

/** One finished stroke: normalized points plus its color and author. */
export interface PictureStroke {
  /** Pass index (0-based) that produced this stroke. */
  pass: number;
  player: PicturePlayer;
  color: string;
  /** Points normalized to 0–1 in both axes, at least two. */
  points: readonly { x: number; y: number }[];
}

export const PICTURE_PALETTE = [
  '#1f2430',
  '#f87171',
  '#f59e0b',
  '#16a34a',
  '#0ea5e9',
  '#8b5cf6',
  '#ec4899',
  '#a3e635',
] as const;

export const STROKE_WIDTH = 6;

export function totalPasses(passesPerPlayer: number): number {
  return passesPerPlayer * 2;
}

/** Player 1 takes even pass indexes, Player 2 takes odd ones. */
export function playerForPass(pass: number): PicturePlayer {
  return pass % 2 === 0 ? 1 : 2;
}

export function isLastPass(pass: number, passesPerPlayer: number): boolean {
  return pass >= totalPasses(passesPerPlayer) - 1;
}

/** Strokes contributed by each player: [Player 1, Player 2]. */
export function strokeCounts(strokes: readonly PictureStroke[]): [number, number] {
  let p1 = 0;
  let p2 = 0;
  for (const stroke of strokes) {
    if (stroke.player === 1) p1 += 1;
    else p2 += 1;
  }
  return [p1, p2];
}

/**
 * Remove the last stroke and restore the pass it belonged to. Returns the
 * strokes that remain and the pass index play should resume from.
 */
export function undoLastStroke(
  strokes: readonly PictureStroke[],
): { strokes: readonly PictureStroke[]; resumePass: number } | null {
  if (strokes.length === 0) return null;
  const last = strokes[strokes.length - 1]!;
  return { strokes: strokes.slice(0, -1), resumePass: last.pass };
}

/** Clamp a pointer position into the normalized 0–1 square. */
export function normalizePoint(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

/** Simplify a raw point stream into a stroke: dedupe and thin samples. */
export function buildStroke(points: readonly { x: number; y: number }[]): { x: number; y: number }[] {
  const simplified: { x: number; y: number }[] = [];
  for (const point of points) {
    const previous = simplified[simplified.length - 1];
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.004) continue;
    simplified.push({ x: point.x, y: point.y });
  }
  if (simplified.length === 1) {
    // A tap becomes a short stroke so it still renders.
    const only = simplified[0]!;
    simplified.push({ x: only.x + 0.004, y: only.y + 0.004 });
  }
  return simplified;
}
