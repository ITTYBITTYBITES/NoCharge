/**
 * Klondike Solitaire engine — pure rules, no DOM, no localStorage.
 * Standard deal: 7 tableau columns, 4 foundations, stock + waste.
 * Draw-1 (default) or draw-3 toggle. Undo + restart from fresh seed.
 */
import {
  type Card,
  type Suit,
  suitColor,
  shuffledDeck,
  randomSeed,
  SUITS,
} from '../shared/solitaire';

export interface KlondikeState {
  seed: number;
  drawMode: 1 | 3;
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
  history: KlondikeSnapshot[];
  moves: number;
  won: boolean;
}

export interface KlondikeSnapshot {
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
  moves: number;
}

function cloneCard(c: Card): Card {
  return { suit: c.suit, rank: c.rank, faceUp: c.faceUp, id: c.id };
}

function cloneStack(stack: Card[]): Card[] {
  return stack.map(cloneCard);
}

function cloneTableau(t: Card[][]): Card[][] {
  return t.map(cloneStack);
}

function cloneFoundations(f: Card[][]): Card[][] {
  return f.map(cloneStack);
}

function snapshot(state: KlondikeState): KlondikeSnapshot {
  return {
    tableau: cloneTableau(state.tableau),
    foundations: cloneFoundations(state.foundations),
    stock: cloneStack(state.stock),
    waste: cloneStack(state.waste),
    moves: state.moves,
  };
}

/** Create a new game from a seed. */
export function createGame(seed?: number, drawMode: 1 | 3 = 1): KlondikeState {
  const s = seed ?? randomSeed();
  const deck = shuffledDeck(s);

  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[idx]!;
      card.faceUp = row === col; // only top card is face up
      tableau[col]!.push(card);
      idx++;
    }
  }

  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));
  const foundations: Card[][] = [[], [], [], []];
  const waste: Card[] = [];

  return {
    seed: s,
    drawMode,
    tableau,
    foundations,
    stock,
    waste,
    history: [],
    moves: 0,
    won: false,
  };
}

/** Check if a card can be placed on a tableau column. */
export function canPlaceOnTableau(card: Card, column: Card[]): boolean {
  if (column.length === 0) {
    return card.rank === 13; // Only kings on empty columns
  }
  const top = column[column.length - 1]!;
  if (!top.faceUp) return false;
  return suitColor(card.suit) !== suitColor(top.suit) && card.rank === top.rank - 1;
}

/** Check if a card can be placed on a foundation pile. */
export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) {
    return card.rank === 1; // Aces start foundations
  }
  const top = foundation[foundation.length - 1]!;
  return card.suit === top.suit && card.rank === top.rank + 1;
}

/** Find the foundation index for a given suit. */
function foundationIndex(suit: Suit): number {
  return SUITS.indexOf(suit);
}

/** Draw from stock to waste. */
export function drawFromStock(state: KlondikeState): KlondikeState {
  if (state.stock.length === 0 && state.waste.length === 0) return state;

  const hist = [...state.history, snapshot(state)];
  const stock = cloneStack(state.stock);
  const waste = cloneStack(state.waste);

  if (stock.length === 0) {
    // Flip waste back to stock
    while (waste.length > 0) {
      const card = waste.pop()!;
      card.faceUp = false;
      stock.push(card);
    }
  } else {
    const count = Math.min(state.drawMode, stock.length);
    for (let i = 0; i < count; i++) {
      const card = stock.pop()!;
      card.faceUp = true;
      waste.push(card);
    }
  }

  return {
    ...state,
    stock,
    waste,
    history: hist,
    moves: state.moves + 1,
  };
}

/** Move the top waste card to a foundation. */
export function moveWasteToFoundation(state: KlondikeState): KlondikeState | null {
  if (state.waste.length === 0) return null;
  const card = state.waste[state.waste.length - 1]!;
  const fi = foundationIndex(card.suit);
  if (!canPlaceOnFoundation(card, state.foundations[fi]!)) return null;

  const hist = [...state.history, snapshot(state)];
  const foundations = cloneFoundations(state.foundations);
  const waste = cloneStack(state.waste);
  const moved = waste.pop()!;
  foundations[fi]!.push(moved);

  const won = foundations.every((f) => f.length === 13);

  return {
    ...state,
    foundations,
    waste,
    history: hist,
    moves: state.moves + 1,
    won,
  };
}

/** Move the top waste card to a tableau column. */
export function moveWasteToTableau(state: KlondikeState, col: number): KlondikeState | null {
  if (state.waste.length === 0 || col < 0 || col > 6) return null;
  const card = state.waste[state.waste.length - 1]!;
  if (!canPlaceOnTableau(card, state.tableau[col]!)) return null;

  const hist = [...state.history, snapshot(state)];
  const tableau = cloneTableau(state.tableau);
  const waste = cloneStack(state.waste);
  const moved = waste.pop()!;
  tableau[col]!.push(moved);

  return {
    ...state,
    tableau,
    waste,
    history: hist,
    moves: state.moves + 1,
  };
}

/** Move cards from one tableau column to another. */
export function moveTableau(
  state: KlondikeState,
  fromCol: number,
  cardIndex: number,
  toCol: number,
): KlondikeState | null {
  if (fromCol === toCol) return null;
  if (fromCol < 0 || fromCol > 6 || toCol < 0 || toCol > 6) return null;

  const source = state.tableau[fromCol]!;
  if (cardIndex < 0 || cardIndex >= source.length) return null;

  const card = source[cardIndex]!;
  if (!card.faceUp) return null;

  // Verify all cards from cardIndex onward are face up (they should be)
  for (let i = cardIndex; i < source.length; i++) {
    if (!source[i]!.faceUp) return null;
  }

  if (!canPlaceOnTableau(card, state.tableau[toCol]!)) return null;

  const hist = [...state.history, snapshot(state)];
  const tableau = cloneTableau(state.tableau);
  const cards = tableau[fromCol]!.splice(cardIndex);
  tableau[toCol]!.push(...cards);

  // Flip top of source if needed
  if (tableau[fromCol]!.length > 0) {
    const top = tableau[fromCol]![tableau[fromCol]!.length - 1]!;
    if (!top.faceUp) top.faceUp = true;
  }

  return {
    ...state,
    tableau,
    history: hist,
    moves: state.moves + 1,
  };
}

/** Move a tableau card to a foundation. */
export function moveTableauToFoundation(
  state: KlondikeState,
  col: number,
): KlondikeState | null {
  if (col < 0 || col > 6) return null;
  const column = state.tableau[col]!;
  if (column.length === 0) return null;

  const card = column[column.length - 1]!;
  const fi = foundationIndex(card.suit);
  if (!canPlaceOnFoundation(card, state.foundations[fi]!)) return null;

  const hist = [...state.history, snapshot(state)];
  const tableau = cloneTableau(state.tableau);
  const foundations = cloneFoundations(state.foundations);
  const moved = tableau[col]!.pop()!;
  foundations[fi]!.push(moved);

  // Flip top of source if needed
  if (tableau[col]!.length > 0) {
    const top = tableau[col]![tableau[col]!.length - 1]!;
    if (!top.faceUp) top.faceUp = true;
  }

  const won = foundations.every((f) => f.length === 13);

  return {
    ...state,
    tableau,
    foundations,
    history: hist,
    moves: state.moves + 1,
    won,
  };
}

/**
 * What the player has tapped once: the pending source of the next move.
 * Kept next to the engine so tap resolution is pure and testable without DOM.
 */
export type KlondikeSelection =
  | { type: 'waste' }
  | { type: 'tableau'; col: number; cardIndex: number };

/**
 * Resolve a tap on a foundation pile against the current selection.
 *
 * Tapping a foundation is the tap-then-tap destination for the selected card —
 * the same move a second tap on the card itself performs. A tap with nothing
 * selected, or with a mid-run card that cannot go up yet, is a no-op rather
 * than a move of the wrong card. The engine routes the card to its suit pile,
 * so every foundation pile accepts the tap.
 */
export function tapFoundation(
  state: KlondikeState,
  selection: KlondikeSelection | null,
): KlondikeState | null {
  if (selection?.type === 'waste') {
    return moveWasteToFoundation(state);
  }
  if (selection?.type === 'tableau') {
    const column = state.tableau[selection.col]!;
    if (selection.cardIndex !== column.length - 1) return null;
    return moveTableauToFoundation(state, selection.col);
  }
  return null;
}

/** Undo the last move. Returns null if no history. */
export function undo(state: KlondikeState): KlondikeState | null {
  if (state.history.length === 0) return null;
  const history = [...state.history];
  const prev = history.pop()!;
  return {
    ...state,
    tableau: prev.tableau,
    foundations: prev.foundations,
    stock: prev.stock,
    waste: prev.waste,
    moves: prev.moves,
    history,
    won: false,
  };
}

/** Auto-move a card to foundation if safe (aces and twos always safe). */
export function autoMoveToFoundation(state: KlondikeState): KlondikeState {
  let current = state;
  let changed = true;
  while (changed) {
    changed = false;
    // Check waste top
    if (current.waste.length > 0) {
      const card = current.waste[current.waste.length - 1]!;
      if (isSafeAutoMove(card, current)) {
        const next = moveWasteToFoundation(current);
        if (next) {
          current = next;
          changed = true;
          continue;
        }
      }
    }
    // Check tableau tops
    for (let col = 0; col < 7; col++) {
      const column = current.tableau[col]!;
      if (column.length === 0) continue;
      const card = column[column.length - 1]!;
      if (isSafeAutoMove(card, current)) {
        const next = moveTableauToFoundation(current, col);
        if (next) {
          current = next;
          changed = true;
          break;
        }
      }
    }
  }
  return current;
}

/** A card is safe to auto-move if both opposite-color foundations are at rank-2 or higher. */
function isSafeAutoMove(card: Card, state: KlondikeState): boolean {
  if (card.rank <= 1) return true; // Aces always safe
  const oppositeColor = suitColor(card.suit) === 'red' ? 'black' : 'red';
  for (const suit of SUITS) {
    if (suitColor(suit) === oppositeColor) {
      const fi = foundationIndex(suit);
      const foundation = state.foundations[fi]!;
      if (foundation.length < card.rank - 1) return false;
    }
  }
  return true;
}
