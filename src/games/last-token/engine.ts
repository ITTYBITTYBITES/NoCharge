/**
 * Last Token rules for the Pass &amp; Play edition.
 *
 * Pure functions only: no DOM, no storage, and deliberately no strategy
 * logic, hints, or evaluation of any kind. The rules are the classic
 * misère take-away game: remove one to three tokens from a single pile on
 * your turn, and the player who takes the very last token loses.
 */

export type LastTokenPiles = readonly number[];

export interface LastTokenPreset {
  id: string;
  label: string;
  piles: LastTokenPiles;
}

/** Two quick presets and one longer one; each pile is a token count. */
export const LAST_TOKEN_PRESETS: readonly LastTokenPreset[] = [
  { id: '3-4-5', label: '3-4-5 · three piles', piles: [3, 4, 5] },
  { id: '1-3-5-7', label: '1-3-5-7 · four piles', piles: [1, 3, 5, 7] },
  { id: '3-5', label: '3-5 · quick two piles', piles: [3, 5] },
];

/** The most tokens a single move may remove. */
export const MAX_TAKE = 3;

export function totalTokens(piles: LastTokenPiles): number {
  return piles.reduce((sum, pile) => sum + pile, 0);
}

/**
 * Remove `count` tokens from one pile. Returns the next piles, or null when
 * the move is not legal (unknown pile, count outside 1–3, or more tokens
 * than the pile holds).
 */
export function takeTokens(piles: LastTokenPiles, pileIndex: number, count: number): LastTokenPiles | null {
  if (pileIndex < 0 || pileIndex >= piles.length) return null;
  if (!Number.isInteger(count) || count < 1 || count > MAX_TAKE) return null;
  if (count > piles[pileIndex]!) return null;
  return piles.map((pile, index) => (index === pileIndex ? pile - count : pile));
}

/** The round is over once every token has been taken. */
export function isRoundOver(piles: LastTokenPiles): boolean {
  return totalTokens(piles) === 0;
}

/** Legal take counts for one pile right now. */
export function legalTakes(pile: number): number[] {
  const takes: number[] = [];
  for (let count = 1; count <= Math.min(MAX_TAKE, pile); count += 1) takes.push(count);
  return takes;
}

/** The player who opens a round alternates each round. */
export function openingPlayerForRound(round: number): 1 | 2 {
  return round % 2 === 1 ? 1 : 2;
}
