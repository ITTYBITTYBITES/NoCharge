/**
 * FreeCell Solitaire engine — pure rules, no DOM, no localStorage.
 * All 52 cards face-up in 8 columns (6+6+6+6+5+5+5+5).
 * 4 free cells, 4 foundations. Multi-card moves when enough free cells open.
 */
import {
  type Card,
  type Suit,
  suitColor,
  shuffledDeck,
  randomSeed,
  SUITS,
} from '../shared/solitaire';

export interface FreeCellState {
  seed: number;
  tableau: Card[][];
  foundations: Card[][];
  freeCells: (Card | null)[];
  history: FreeCellSnapshot[];
  moves: number;
  won: boolean;
}

export interface FreeCellSnapshot {
  tableau: Card[][];
  foundations: Card[][];
  freeCells: (Card | null)[];
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

function cloneFreeCells(fc: (Card | null)[]): (Card | null)[] {
  return fc.map((c) => (c ? cloneCard(c) : null));
}

function snapshot(state: FreeCellState): FreeCellSnapshot {
  return {
    tableau: cloneTableau(state.tableau),
    foundations: cloneFoundations(state.foundations),
    freeCells: cloneFreeCells(state.freeCells),
    moves: state.moves,
  };
}

/** Create a new FreeCell game. All cards dealt face-up. */
export function createGame(seed?: number): FreeCellState {
  const s = seed ?? randomSeed();
  const deck = shuffledDeck(s);

  // 8 columns: first 4 get 7 cards, last 4 get 6 cards
  const tableau: Card[][] = [[], [], [], [], [], [], [], []];
  let idx = 0;
  for (let i = 0; i < 52; i++) {
    const col = i % 8;
    const card = deck[idx]!;
    card.faceUp = true;
    tableau[col]!.push(card);
    idx++;
  }

  return {
    seed: s,
    tableau,
    foundations: [[], [], [], []],
    freeCells: [null, null, null, null],
    history: [],
    moves: 0,
    won: false,
  };
}

/** How many cards can be moved at once given current empty free cells + empty columns. */
export function maxMovableCards(state: FreeCellState, destCol: number): number {
  const emptyCells = state.freeCells.filter((c) => c === null).length;
  const emptyCols = state.tableau.filter((col, i) => col.length === 0 && i !== destCol).length;
  return (emptyCells + 1) * Math.pow(2, emptyCols);
}

/** Check if a card can be placed on a tableau column (alternating colors descending). */
export function canPlaceOnTableau(card: Card, column: Card[]): boolean {
  if (column.length === 0) return true; // Any card on empty column
  const top = column[column.length - 1]!;
  return suitColor(card.suit) !== suitColor(top.suit) && card.rank === top.rank - 1;
}

/** Check if a card can be placed on a foundation pile. */
export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) return card.rank === 1;
  const top = foundation[foundation.length - 1]!;
  return card.suit === top.suit && card.rank === top.rank + 1;
}

function foundationIndex(suit: Suit): number {
  return SUITS.indexOf(suit);
}

/** Move a card from tableau to a free cell. */
export function moveToFreeCell(state: FreeCellState, col: number): FreeCellState | null {
  const column = state.tableau[col]!;
  if (column.length === 0) return null;

  const emptyCell = state.freeCells.findIndex((c) => c === null);
  if (emptyCell === -1) return null;

  const hist = [...state.history, snapshot(state)];
  const tableau = cloneTableau(state.tableau);
  const freeCells = cloneFreeCells(state.freeCells);
  freeCells[emptyCell] = tableau[col]!.pop()!;

  return { ...state, tableau, freeCells, history: hist, moves: state.moves + 1 };
}

/** Move a card from a free cell to a tableau column. */
export function moveFreeCellToTableau(
  state: FreeCellState,
  cellIdx: number,
  col: number,
): FreeCellState | null {
  const card = state.freeCells[cellIdx];
  if (!card) return null;
  if (!canPlaceOnTableau(card, state.tableau[col]!)) return null;

  const hist = [...state.history, snapshot(state)];
  const tableau = cloneTableau(state.tableau);
  const freeCells = cloneFreeCells(state.freeCells);
  tableau[col]!.push(freeCells[cellIdx]!);
  freeCells[cellIdx] = null;

  return { ...state, tableau, freeCells, history: hist, moves: state.moves + 1 };
}

/** Move a card from a free cell to a foundation. */
export function moveFreeCellToFoundation(
  state: FreeCellState,
  cellIdx: number,
): FreeCellState | null {
  const card = state.freeCells[cellIdx];
  if (!card) return null;
  const fi = foundationIndex(card.suit);
  if (!canPlaceOnFoundation(card, state.foundations[fi]!)) return null;

  const hist = [...state.history, snapshot(state)];
  const foundations = cloneFoundations(state.foundations);
  const freeCells = cloneFreeCells(state.freeCells);
  foundations[fi]!.push(freeCells[cellIdx]!);
  freeCells[cellIdx] = null;

  const won = foundations.every((f) => f.length === 13);
  return { ...state, foundations, freeCells, history: hist, moves: state.moves + 1, won };
}

/** Move cards from one tableau column to another (handles multi-card moves). */
export function moveTableau(
  state: FreeCellState,
  fromCol: number,
  cardIndex: number,
  toCol: number,
): FreeCellState | null {
  if (fromCol === toCol) return null;

  const source = state.tableau[fromCol]!;
  if (cardIndex < 0 || cardIndex >= source.length) return null;

  const cardsToMove = source.slice(cardIndex);
  const moveCount = cardsToMove.length;

  // Check if the sequence is valid (descending alternating colors)
  for (let i = 1; i < cardsToMove.length; i++) {
    const prev = cardsToMove[i - 1]!;
    const curr = cardsToMove[i]!;
    if (suitColor(curr.suit) === suitColor(prev.suit) || curr.rank !== prev.rank - 1) {
      return null;
    }
  }

  // Check if we have enough free space
  const maxMove = maxMovableCards(state, toCol);
  if (moveCount > maxMove) return null;

  // Check destination
  if (!canPlaceOnTableau(cardsToMove[0]!, state.tableau[toCol]!)) return null;

  const hist = [...state.history, snapshot(state)];
  const tableau = cloneTableau(state.tableau);
  const moved = tableau[fromCol]!.splice(cardIndex);
  tableau[toCol]!.push(...moved);

  return { ...state, tableau, history: hist, moves: state.moves + 1 };
}

/** Move top of tableau column to foundation. */
export function moveTableauToFoundation(
  state: FreeCellState,
  col: number,
): FreeCellState | null {
  const column = state.tableau[col]!;
  if (column.length === 0) return null;

  const card = column[column.length - 1]!;
  const fi = foundationIndex(card.suit);
  if (!canPlaceOnFoundation(card, state.foundations[fi]!)) return null;

  const hist = [...state.history, snapshot(state)];
  const tableau = cloneTableau(state.tableau);
  const foundations = cloneFoundations(state.foundations);
  foundations[fi]!.push(tableau[col]!.pop()!);

  const won = foundations.every((f) => f.length === 13);
  return { ...state, tableau, foundations, history: hist, moves: state.moves + 1, won };
}

/**
 * What the player has tapped once: the pending source of the next move.
 * Kept next to the engine so tap resolution is pure and testable without DOM.
 */
export type FreeCellSelection =
  | { type: 'cell'; idx: number }
  | { type: 'tableau'; col: number; cardIndex: number };

/**
 * Move the selected tableau card to a free cell.
 *
 * Only the top card of a column may sit in a free cell. Tapping a cell while
 * a mid-run card is selected must not teleport the column's top card away, so
 * the guard lives here where it can be unit tested.
 */
export function moveSelectedToFreeCell(
  state: FreeCellState,
  selection: FreeCellSelection | null,
): FreeCellState | null {
  if (selection?.type !== 'tableau') return null;
  const column = state.tableau[selection.col]!;
  if (selection.cardIndex !== column.length - 1) return null;
  return moveToFreeCell(state, selection.col);
}

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
  state: FreeCellState,
  selection: FreeCellSelection | null,
): FreeCellState | null {
  if (selection?.type === 'cell') {
    return moveFreeCellToFoundation(state, selection.idx);
  }
  if (selection?.type === 'tableau') {
    const column = state.tableau[selection.col]!;
    if (selection.cardIndex !== column.length - 1) return null;
    return moveTableauToFoundation(state, selection.col);
  }
  return null;
}

/** Undo the last move. */
export function undo(state: FreeCellState): FreeCellState | null {
  if (state.history.length === 0) return null;
  const history = [...state.history];
  const prev = history.pop()!;
  return {
    ...state,
    tableau: prev.tableau,
    foundations: prev.foundations,
    freeCells: prev.freeCells,
    moves: prev.moves,
    history,
    won: false,
  };
}

/** Auto-move safe cards to foundations (aces always, others when safe). */
export function autoMoveToFoundation(state: FreeCellState): FreeCellState {
  let current = state;
  let changed = true;
  while (changed) {
    changed = false;
    // Check free cells
    for (let i = 0; i < 4; i++) {
      const card = current.freeCells[i];
      if (!card) continue;
      if (isSafeAutoMove(card, current)) {
        const next = moveFreeCellToFoundation(current, i);
        if (next) { current = next; changed = true; break; }
      }
    }
    if (changed) continue;
    // Check tableau tops
    for (let col = 0; col < 8; col++) {
      const column = current.tableau[col]!;
      if (column.length === 0) continue;
      const card = column[column.length - 1]!;
      if (isSafeAutoMove(card, current)) {
        const next = moveTableauToFoundation(current, col);
        if (next) { current = next; changed = true; break; }
      }
    }
  }
  return current;
}

function isSafeAutoMove(card: Card, state: FreeCellState): boolean {
  if (card.rank <= 1) return true;
  const oppositeColor = suitColor(card.suit) === 'red' ? 'black' : 'red';
  for (const suit of SUITS) {
    if (suitColor(suit) === oppositeColor) {
      const fi = foundationIndex(suit);
      if (state.foundations[fi]!.length < card.rank - 1) return false;
    }
  }
  return true;
}
