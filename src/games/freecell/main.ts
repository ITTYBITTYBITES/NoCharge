import { play, unlockAudio } from '../shared/audio';
import type { GameController, PauseReason } from '../shared/types';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import {
  type FreeCellState,
  createGame,
  moveToFreeCell,
  moveFreeCellToTableau,
  moveFreeCellToFoundation,
  moveTableau,
  moveTableauToFoundation,
  undo as engineUndo,
  autoMoveToFoundation,
} from './engine';
import {
  type Card,
  suitSymbol,
  rankLabel,
  suitColor,
  cardName,
} from '../shared/solitaire';
import './styles.css';

const GAME_ID = 'freecell';
const GAMES_WON_KEY = 'nocharge:freecell:games-won';

export function mountFreeCell(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="fc">
      <div class="fc__hud">
        <div class="fc__stats" aria-live="polite">
          <span>Moves <strong data-fc="moves">0</strong></span>
          <span>Won <strong data-fc="won">0</strong></span>
        </div>
        <button type="button" class="btn btn--sm" data-fc="undo-btn">Undo</button>
      </div>
      <div class="fc__board" data-fc="board" role="group" aria-label="FreeCell solitaire board">
        <div class="fc__top">
          <div class="fc__cells" data-fc="cells">
            <div class="fc__cell" data-fc-cell="0" role="button" tabindex="0" aria-label="Free cell 1"></div>
            <div class="fc__cell" data-fc-cell="1" role="button" tabindex="0" aria-label="Free cell 2"></div>
            <div class="fc__cell" data-fc-cell="2" role="button" tabindex="0" aria-label="Free cell 3"></div>
            <div class="fc__cell" data-fc-cell="3" role="button" tabindex="0" aria-label="Free cell 4"></div>
          </div>
          <div class="fc__foundations" data-fc="foundations">
            <div class="fc__foundation" data-fc-fn="0" role="button" tabindex="0" aria-label="Foundation spades"></div>
            <div class="fc__foundation" data-fc-fn="1" role="button" tabindex="0" aria-label="Foundation hearts"></div>
            <div class="fc__foundation" data-fc-fn="2" role="button" tabindex="0" aria-label="Foundation diamonds"></div>
            <div class="fc__foundation" data-fc-fn="3" role="button" tabindex="0" aria-label="Foundation clubs"></div>
          </div>
        </div>
        <div class="fc__tableau" data-fc="tableau">
          <div class="fc__column" data-fc-col="0" role="button" tabindex="0" aria-label="Column 1"></div>
          <div class="fc__column" data-fc-col="1" role="button" tabindex="0" aria-label="Column 2"></div>
          <div class="fc__column" data-fc-col="2" role="button" tabindex="0" aria-label="Column 3"></div>
          <div class="fc__column" data-fc-col="3" role="button" tabindex="0" aria-label="Column 4"></div>
          <div class="fc__column" data-fc-col="4" role="button" tabindex="0" aria-label="Column 5"></div>
          <div class="fc__column" data-fc-col="5" role="button" tabindex="0" aria-label="Column 6"></div>
          <div class="fc__column" data-fc-col="6" role="button" tabindex="0" aria-label="Column 7"></div>
          <div class="fc__column" data-fc-col="7" role="button" tabindex="0" aria-label="Column 8"></div>
        </div>
      </div>
      <div class="fc__overlay" data-fc="overlay" hidden>
        <h2>Game won</h2>
        <p data-fc="result" aria-live="polite"></p>
        <button type="button" class="btn" data-fc="again">New game</button>
      </div>
    </div>
  `;

  const movesEl = root.querySelector<HTMLElement>('[data-fc="moves"]')!;
  const wonEl = root.querySelector<HTMLElement>('[data-fc="won"]')!;
  const undoBtn = root.querySelector<HTMLButtonElement>('[data-fc="undo-btn"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-fc="overlay"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-fc="result"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-fc="again"]')!;
  const cellEls = root.querySelectorAll<HTMLElement>('[data-fc-cell]');
  const foundationEls = root.querySelectorAll<HTMLElement>('[data-fc-fn]');
  const columnEls = root.querySelectorAll<HTMLElement>('[data-fc-col]');

  let state: FreeCellState;
  let paused = false;
  let selected: { type: 'cell'; idx: number } | { type: 'tableau'; col: number; cardIndex: number } | null = null;
  let gamesWon = loadInt(GAMES_WON_KEY);

  function loadInt(key: string): number {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return 0;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    } catch { return 0; }
  }

  function saveInt(key: string, value: number): void {
    try { localStorage.setItem(key, String(value)); } catch { /* */ }
  }

  function init() {
    state = createGame();
    selected = null;
    overlay.hidden = true;
    render();
  }

  function renderCard(card: Card, faceUp: boolean): HTMLElement {
    const el = document.createElement('div');
    el.className = `fc__card ${faceUp ? 'fc__card--up' : 'fc__card--back'}`;
    if (faceUp) {
      const color = suitColor(card.suit);
      el.classList.add(color === 'red' ? 'fc__card--red' : 'fc__card--black');
      el.innerHTML = `<span class="fc__rank">${rankLabel(card.rank)}</span><span class="fc__suit">${suitSymbol(card.suit)}</span>`;
      el.setAttribute('aria-label', cardName(card));
    }
    return el;
  }

  function render() {
    movesEl.textContent = String(state.moves);
    wonEl.textContent = String(gamesWon);

    // Free cells
    cellEls.forEach((el, i) => {
      el.innerHTML = '';
      const card = state.freeCells[i];
      if (card) {
        const cardEl = renderCard(card, true);
        if (selected?.type === 'cell' && selected.idx === i) cardEl.classList.add('is-selected');
        el.appendChild(cardEl);
      } else {
        el.innerHTML = '<div class="fc__card fc__card--empty" aria-hidden="true"></div>';
      }
      el.setAttribute('aria-label', `Free cell ${i + 1}${card ? ': ' + cardName(card) : ', empty'}`);
    });

    // Foundations
    foundationEls.forEach((el, i) => {
      el.innerHTML = '';
      const pile = state.foundations[i]!;
      if (pile.length > 0) {
        el.appendChild(renderCard(pile[pile.length - 1]!, true));
      } else {
        el.innerHTML = '<div class="fc__card fc__card--empty" aria-hidden="true"></div>';
      }
      el.setAttribute('aria-label', `Foundation ${['spades', 'hearts', 'diamonds', 'clubs'][i]}, ${pile.length} cards`);
    });

    // Tableau
    columnEls.forEach((el, col) => {
      el.innerHTML = '';
      const column = state.tableau[col]!;
      if (column.length === 0) {
        el.innerHTML = '<div class="fc__card fc__card--empty" aria-hidden="true"></div>';
      }
      for (let i = 0; i < column.length; i++) {
        const card = column[i]!;
        const cardEl = renderCard(card, true);
        if (selected?.type === 'tableau' && selected.col === col && i >= selected.cardIndex) {
          cardEl.classList.add('is-selected');
        }
        cardEl.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleTableauCardClick(col, i);
        });
        el.appendChild(cardEl);
      }
      el.setAttribute('aria-label', `Column ${col + 1}, ${column.length} cards${column.length > 0 ? ', top: ' + cardName(column[column.length - 1]!) : ''}`);
    });

    if (state.won) {
      gamesWon++;
      saveInt(GAMES_WON_KEY, gamesWon);
      resultEl.textContent = `Completed in ${state.moves} moves.`;
      overlay.hidden = false;
      void play('win');
    }
  }

  function handleCellClick(idx: number) {
    if (paused) return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);

    if (selected?.type === 'cell' && selected.idx === idx) {
      // Double-click → try foundation
      const result = moveFreeCellToFoundation(state, idx);
      if (result) { state = result; selected = null; void play('move'); render(); return; }
      selected = null;
      render();
      return;
    }

    if (selected?.type === 'tableau') {
      // Move selected tableau card to this cell
      const result = moveToFreeCell(state, selected.col);
      if (result) { state = result; selected = null; void play('place'); render(); return; }
    }

    if (state.freeCells[idx]) {
      selected = { type: 'cell', idx };
    } else if (selected?.type === 'cell') {
      // Moving free cell card back doesn't apply, just deselect
      selected = null;
    } else {
      // Try to move tableau top to this empty cell
      selected = null;
    }
    render();
  }

  function handleTableauCardClick(col: number, cardIndex: number) {
    if (paused) return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);

    if (selected?.type === 'cell') {
      const result = moveFreeCellToTableau(state, selected.idx, col);
      if (result) { state = result; selected = null; void play('place'); render(); return; }
    }

    if (selected?.type === 'tableau') {
      if (selected.col === col) {
        // Double-click top card → try foundation
        if (cardIndex === state.tableau[col]!.length - 1) {
          const result = moveTableauToFoundation(state, col);
          if (result) { state = result; selected = null; void play('move'); render(); return; }
        }
        selected = null;
        render();
        return;
      }
      const result = moveTableau(state, selected.col, selected.cardIndex, col);
      if (result) { state = result; selected = null; void play('place'); render(); return; }
    }

    selected = { type: 'tableau', col, cardIndex };
    render();
  }

  function handleColumnClick(col: number) {
    if (paused) return;
    const column = state.tableau[col]!;
    if (column.length > 0) {
      handleTableauCardClick(col, column.length - 1);
      return;
    }
    if (selected?.type === 'cell') {
      const result = moveFreeCellToTableau(state, selected.idx, col);
      if (result) { state = result; selected = null; void play('place'); render(); return; }
    }
    if (selected?.type === 'tableau') {
      const result = moveTableau(state, selected.col, selected.cardIndex, col);
      if (result) { state = result; selected = null; void play('place'); render(); return; }
    }
    selected = null;
    render();
  }

  function handleUndo() {
    if (paused) return;
    const result = engineUndo(state);
    if (result) { state = result; selected = null; render(); }
  }

  cellEls.forEach((el, i) => {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); handleCellClick(i); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCellClick(i); } });
  });

  columnEls.forEach((el, i) => {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); handleColumnClick(i); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleColumnClick(i); } });
  });

  undoBtn.addEventListener('click', handleUndo);
  againBtn.addEventListener('click', () => init());

  root.addEventListener('keydown', (e) => {
    if (e.key === 'u' || e.key === 'U') { e.preventDefault(); handleUndo(); }
  });

  init();

  return {
    destroy() { root.innerHTML = ''; },
    pause() { paused = true; },
    resume() { paused = false; },
    isPaused: () => paused,
    restart: () => init(),
  };
}
