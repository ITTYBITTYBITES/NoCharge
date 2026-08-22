/**
 * Shared card types for Klondike and FreeCell solitaire games.
 * Standard 52-card deck with suit and rank encoding.
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Color = 'red' | 'black';

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

/** Rank 1 = Ace, 11 = Jack, 12 = Queen, 13 = King. */
export type Rank = number;

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: number;
}

export function suitColor(suit: Suit): Color {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case 'spades': return '♠';
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
  }
}

export function rankLabel(rank: Rank): string {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
}

export function cardName(card: Card): string {
  return `${rankLabel(card.rank)}${suitSymbol(card.suit)}`;
}

/** Create a standard 52-card deck in order. */
export function createDeck(): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      cards.push({ suit, rank, faceUp: false, id: id++ });
    }
  }
  return cards;
}
