/**
 * Memory Match pure engine logic.
 */

export const PAIRS = ['🔷', '🔶', '🟣', '🟢', '🔵', '🟡', '⚪', '🔺'] as const;
export const TOTAL_PAIRS = PAIRS.length; // 8 pairs = 16 cards
export const MISMATCH_DELAY_MS = 650;

export interface MemoryCard {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

export interface MemoryMatchState {
  cards: MemoryCard[];
  moves: number;
  matchedCount: number;
  firstCardId: number | null;
  locked: boolean;
  isComplete: boolean;
  round: number;
}

export type FlipResult =
  | { type: 'noop' }
  | { type: 'flipped-first'; card: MemoryCard }
  | { type: 'match'; firstCard: MemoryCard; secondCard: MemoryCard; moves: number; isComplete: boolean }
  | { type: 'mismatch'; firstCard: MemoryCard; secondCard: MemoryCard; moves: number };

/** Shuffle an array using Fisher-Yates */
export function shuffleCards<T>(array: T[], rng: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Create a fresh game state */
export function createMemoryMatchGame(
  symbols: readonly string[] = PAIRS,
  rng: () => number = Math.random,
): MemoryMatchState {
  const deck = shuffleCards([...symbols, ...symbols], rng);
  const cards: MemoryCard[] = deck.map((symbol, id) => ({
    id,
    symbol,
    flipped: false,
    matched: false,
  }));

  return {
    cards,
    moves: 0,
    matchedCount: 0,
    firstCardId: null,
    locked: false,
    isComplete: false,
    round: 1,
  };
}

/** Flip a card by index */
export function flipCard(state: MemoryMatchState, cardId: number): FlipResult {
  if (state.locked || state.isComplete) return { type: 'noop' };
  const card = state.cards[cardId];
  if (!card || card.flipped || card.matched) return { type: 'noop' };

  card.flipped = true;

  if (state.firstCardId === null) {
    state.firstCardId = cardId;
    return { type: 'flipped-first', card };
  }

  const firstCard = state.cards[state.firstCardId]!;
  state.moves += 1;

  if (firstCard.symbol === card.symbol) {
    firstCard.matched = true;
    card.matched = true;
    state.matchedCount += 1;
    state.firstCardId = null;
    state.locked = false;
    if (state.matchedCount === state.cards.length / 2) {
      state.isComplete = true;
    }
    return {
      type: 'match',
      firstCard,
      secondCard: card,
      moves: state.moves,
      isComplete: state.isComplete,
    };
  }

  // Mismatch
  state.locked = true;
  return {
    type: 'mismatch',
    firstCard,
    secondCard: card,
    moves: state.moves,
  };
}

/** Settle a mismatch by turning both cards back down and unlocking the board */
export function settleMismatch(state: MemoryMatchState): boolean {
  if (!state.locked || state.firstCardId === null) return false;
  for (const card of state.cards) {
    if (!card.matched) {
      card.flipped = false;
    }
  }
  state.firstCardId = null;
  state.locked = false;
  return true;
}

/** Compute updated best moves (lower is better) */
export function updateBestMoves(prevBest: number | null, currentMoves: number): number {
  if (prevBest === null || !Number.isFinite(prevBest) || prevBest <= 0) return currentMoves;
  return Math.min(prevBest, currentMoves);
}

/** Compute arcade score (higher is better) */
export function calculateMemoryMatchScore(moves: number): number {
  return Math.max(0, 1000 - moves * 10);
}
