import type { Card } from './types';
import { createDeck } from './types';

/**
 * Seeded PRNG for solitaire deals. Uses a simple xorshift128+ algorithm.
 * Each deal gets a documented seed so layouts are reproducible.
 */
export class SeededRng {
  private s0: number;
  private s1: number;

  constructor(seed: number) {
    // Split seed into two 32-bit state values using simple mixing.
    this.s0 = (seed ^ 0xdeadbeef) >>> 0 || 1;
    this.s1 = (seed ^ 0x12345678) >>> 0 || 1;
    // Warm up
    for (let i = 0; i < 20; i++) this.next();
  }

  /** Returns a float in [0, 1). */
  next(): number {
    let s1 = this.s0;
    const s0 = this.s1;
    this.s0 = s0;
    s1 ^= s1 << 23;
    s1 ^= s1 >>> 17;
    s1 ^= s0;
    s1 ^= s0 >>> 26;
    this.s1 = s1;
    return ((this.s0 + this.s1) >>> 0) / 0x100000000;
  }

  /** Returns an integer in [0, max). */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/** Fisher–Yates shuffle using a seeded RNG. */
export function shuffleDeck(cards: Card[], rng: SeededRng): Card[] {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}

/** Create and shuffle a fresh deck from a seed. */
export function shuffledDeck(seed: number): Card[] {
  const rng = new SeededRng(seed);
  return shuffleDeck(createDeck(), rng);
}

/** Generate a random seed from Math.random(). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}
