import { play, unlockAudio } from '../shared/audio';
import { loadPref, savePref } from '../shared/storage';
import type { GameController, PauseReason } from '../shared/types';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import {
  type KlondikeState,
  createGame,
  drawFromStock,
  moveWasteToTableau,
  moveWasteToFoundation,
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

const GAME_ID = 'klondike';
const DRAW_MODE_KEY = 'klondike-draw-mode';
const GAMES_WON_KEY = 'nocharge:klondike:games-won';
const BEST_MOVES_KEY = 'nocharge:klondike:best-moves';

export function mountKlondike(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="kl">
      <div class="kl__hud">
        <div class="kl__stats" aria-live="polite">
          <span>Moves <strong data-kl="moves">0</strong></span>
          <span>Best <strong data-kl="best">—</strong></span>
          <span>Won <strong data-kl="won">0</strong></span>
        </div>
        <div class="kl__controls">
          <button type="button" class="btn btn--sm" data-kl="draw-toggle">Draw 1</button>
          <button type="button" class="btn btn--sm" data-kl="undo-btn">Undo</button>
        </div>
      </div>
      <div class="kl__board" data-kl="board" role="group" aria-label="Klondike solitaire board">
        <div class="kl__top">
          <div class="kl__stock" data-kl="stock" role="button" tabindex="0" aria-label="Stock pile, click to draw">
            <div class="kl__card kl__card--back" aria-hidden="true"></div>
          </div>
          <div class="kl__waste" data-kl="waste" role="button" tabindex="0" aria-label="Waste pile"></div>
          <div class="kl__spacer"></div>
          <div class="kl__foundations" data-kl="foundations">
            <div class="kl__foundation" data-kl-fn="0" role="button" tabindex="0" aria-label="Foundation spades"></div>
            <div class="kl__foundation" data-kl-fn="1" role="button" tabindex="0" aria-label="Foundation hearts"></div>
            <div class="kl__foundation" data-kl-fn="2" role="button" tabindex="0" aria-label="Foundation diamonds"></div>
            <div class="kl__foundation" data-kl-fn="3" role="button" tabindex="0" aria-label="Foundation clubs"></div>
          </div>
        </div>
        <div class="kl__tableau" data-kl="tableau">
          <div class="kl__column" data-kl-col="0" role="button" tabindex="0" aria-label="Tableau column 1"></div>
          <div class="kl__column" data-kl-col="1" role="button" tabindex="0" aria-label="Tableau column 2"></div>
          <div class="kl__column" data-kl-col="2" role="button" tabindex="0" aria-label="Tableau column 3"></div>
          <div class="kl__column" data-kl-col="3" role="button" tabindex="0" aria-label="Tableau column 4"></div>
          <div class="kl__column" data-kl-col="4" role="button" tabindex="0" aria-label="Tableau column 5"></div>
          <div class="kl__column" data-kl-col="5" role="button" tabindex="0" aria-label="Tableau column 6"></div>
          <div class="kl__column" data-kl-col="6" role="button" tabindex="0" aria-label="Tableau column 7"></div>
        </div>
      </div>
      <div class="kl__overlay" data-kl="overlay" hidden>
        <h2>Game won</h2>
        <p data-kl="result" aria-live="polite"></p>
        <button type="button" class="btn" data-kl="again">New game</button>
      </div>
    </div>
  `;

  const movesEl = root.querySelector<HTMLElement>('[data-kl="moves"]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-kl="best"]')!;
  const wonEl = root.querySelector<HTMLElement>('[data-kl="won"]')!;
  const drawToggle = root.querySelector<HTMLButtonElement>('[data-kl="draw-toggle"]')!;
  const undoBtn = root.querySelector<HTMLButtonElement>('[data-kl="undo-btn"]')!;
  const stockEl = root.querySelector<HTMLElement>('[data-kl="stock"]')!;
  const wasteEl = root.querySelector<HTMLElement>('[data-kl="waste"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-kl="overlay"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-kl="result"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-kl="again"]')!;
  const foundationEls = root.querySelectorAll<HTMLElement>('[data-kl-fn]');
  const columnEls = root.querySelectorAll<HTMLElement>('[data-kl-col]');

  let state: KlondikeState;
  let paused = false;
  let selected: { type: 'waste' } | { type: 'tableau'; col: number; cardIndex: number } | null = null;

  // Load persisted stats
  let gamesWon = loadInt(GAMES_WON_KEY);
  let bestMoves = loadInt(BEST_MOVES_KEY);
  let drawMode: 1 | 3 = (loadPref(DRAW_MODE_KEY, 1) as 1 | 3);

  function loadInt(key: string): number {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return 0;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    } catch {
      return 0;
    }
  }

  function saveInt(key: string, value: number): void {
    try { localStorage.setItem(key, String(value)); } catch { /* */ }
  }

  function init() {
    state = createGame(undefined, drawMode);
    selected = null;
    overlay.hidden = true;
    render();
  }

  function render() {
    movesEl.textContent = String(state.moves);
    bestEl.textContent = bestMoves > 0 ? String(bestMoves) : '—';
    wonEl.textContent = String(gamesWon);
    drawToggle.textContent = `Draw ${state.drawMode}`;

    // Stock
    const stockBack = stockEl.querySelector('.kl__card--back');
    if (stockBack) {
      stockBack.style.display = state.stock.length > 0 ? '' : 'none';
    }
    stockEl.setAttribute('aria-label', `Stock pile, ${state.stock.length} cards remaining. Click to draw.`);

    // Waste - show top 3 cards max
    wasteEl.innerHTML = '';
    const visibleWaste = state.waste.slice(-3);
    for (let i = 0; i < visibleWaste.length; i++) {
      const card = visibleWaste[i]!;
      const el = renderCard(card, i === visibleWaste.length - 1);
      if (i === visibleWaste.length - 1 && selected?.type === 'waste') {
        el.classList.add('is-selected');
      }
      wasteEl.appendChild(el);
    }
    if (state.waste.length === 0) {
      wasteEl.innerHTML = '<div class="kl__card kl__card--empty" aria-hidden="true"></div>';
    }
    wasteEl.setAttribute('aria-label', `Waste pile, ${state.waste.length} cards. Top: ${state.waste.length > 0 ? cardName(state.waste[state.waste.length - 1]!) : 'empty'}`);

    // Foundations
    foundationEls.forEach((el, i) => {
      el.innerHTML = '';
      const pile = state.foundations[i]!;
      if (pile.length > 0) {
        const card = pile[pile.length - 1]!;
        el.appendChild(renderCard(card, false));
      } else {
        el.innerHTML = '<div class="kl__card kl__card--empty" aria-hidden="true"></div>';
      }
      el.setAttribute('aria-label', `Foundation ${['spades', 'hearts', 'diamonds', 'clubs'][i]}, ${pile.length} cards`);
    });

    // Tableau
    columnEls.forEach((el, col) => {
      el.innerHTML = '';
      const column = state.tableau[col]!;
      if (column.length === 0) {
        el.innerHTML = '<div class="kl__card kl__card--empty" aria-hidden="true"></div>';
      }
      for (let i = 0; i < column.length; i++) {
        const card = column[i]!;
        const cardEl = renderCard(card, card.faceUp);
        if (card.faceUp) {
          if (selected?.type === 'tableau' && selected.col === col && i >= selected.cardIndex) {
            cardEl.classList.add('is-selected');
          }
          cardEl.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTableauCardClick(col, i);
          });
        }
        el.appendChild(cardEl);
      }
      el.setAttribute('aria-label', `Tableau column ${col + 1}, ${column.length} cards${column.length > 0 ? `, top: ${column[column.length - 1]!.faceUp ? cardName(column[column.length - 1]!) : 'hidden'}` : ''}`);
    });

    // Win check
    if (state.won) {
      gamesWon++;
      saveInt(GAMES_WON_KEY, gamesWon);
      if (bestMoves === 0 || state.moves < bestMoves) {
        bestMoves = state.moves;
        saveInt(BEST_MOVES_KEY, bestMoves);
      }
      resultEl.textContent = `Completed in ${state.moves} moves.`;
      overlay.hidden = false;
      void play('win');
    }
  }

  function renderCard(card: Card, faceUp: boolean): HTMLElement {
    const el = document.createElement('div');
    el.className = `kl__card ${faceUp ? 'kl__card--up' : 'kl__card--back'}`;
    if (faceUp) {
      const color = suitColor(card.suit);
      el.classList.add(color === 'red' ? 'kl__card--red' : 'kl__card--black');
      el.innerHTML = `<span class="kl__rank">${rankLabel(card.rank)}</span><span class="kl__suit">${suitSymbol(card.suit)}</span>`;
      el.setAttribute('aria-label', cardName(card));
    } else {
      el.setAttribute('aria-hidden', 'true');
    }
    return el;
  }

  function handleStockClick() {
    if (paused) return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);
    selected = null;
    state = drawFromStock(state);
    state = autoMoveToFoundation(state);
    void play('pop');
    render();
  }

  function handleWasteClick() {
    if (paused || state.waste.length === 0) return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);

    if (selected?.type === 'waste') {
      // Try foundation first, then deselect
      const result = moveWasteToFoundation(state);
      if (result) {
        state = result;
        selected = null;
        void play('blip');
        render();
        return;
      }
      selected = null;
      render();
      return;
    }

    selected = { type: 'waste' };
    render();
  }

  function handleTableauCardClick(col: number, cardIndex: number) {
    if (paused) return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);

    if (selected?.type === 'waste') {
      const result = moveWasteToTableau(state, col);
      if (result) {
        state = result;
        selected = null;
        void play('pop');
        render();
        return;
      }
    }

    if (selected?.type === 'tableau') {
      if (selected.col === col) {
        // Double-click on top card → try foundation
        if (cardIndex === state.tableau[col]!.length - 1) {
          const result = moveTableauToFoundation(state, col);
          if (result) {
            state = result;
            selected = null;
            void play('blip');
            render();
            return;
          }
        }
        selected = null;
        render();
        return;
      }
      // Try to move selected to this column
      const result = moveTableau(state, selected.col, selected.cardIndex, col);
      if (result) {
        state = result;
        selected = null;
        void play('pop');
        render();
        return;
      }
    }

    // Select this card
    selected = { type: 'tableau', col, cardIndex };
    render();
  }

  function handleColumnClick(col: number) {
    if (paused) return;
    const column = state.tableau[col]!;
    if (column.length > 0) {
      // Click on occupied column delegates to card click on top card
      handleTableauCardClick(col, column.length - 1);
      return;
    }

    // Empty column - try placing selected
    if (selected?.type === 'waste') {
      const result = moveWasteToTableau(state, col);
      if (result) {
        state = result;
        selected = null;
        void play('pop');
        render();
        return;
      }
    }
    if (selected?.type === 'tableau') {
      const result = moveTableau(state, selected.col, selected.cardIndex, col);
      if (result) {
        state = result;
        selected = null;
        void play('pop');
        render();
        return;
      }
    }

    selected = null;
    render();
  }

  function handleUndo() {
    if (paused) return;
    const result = engineUndo(state);
    if (result) {
      state = result;
      selected = null;
      render();
    }
  }

  function handleDrawToggle() {
    drawMode = drawMode === 1 ? 3 : 1;
    savePref(DRAW_MODE_KEY, drawMode);
    drawToggle.textContent = `Draw ${drawMode}`;
    // Restart with new draw mode
    state = createGame(undefined, drawMode);
    selected = null;
    render();
  }

  // Event bindings
  stockEl.addEventListener('pointerdown', (e) => { e.preventDefault(); handleStockClick(); });
  stockEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStockClick(); } });
  wasteEl.addEventListener('pointerdown', (e) => { e.preventDefault(); handleWasteClick(); });
  wasteEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleWasteClick(); } });

  columnEls.forEach((el, i) => {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); handleColumnClick(i); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleColumnClick(i); } });
  });

  undoBtn.addEventListener('click', handleUndo);
  drawToggle.addEventListener('click', handleDrawToggle);
  againBtn.addEventListener('click', () => init());

  // Keyboard shortcuts
  root.addEventListener('keydown', (e) => {
    if (e.key === 'u' || e.key === 'U') { e.preventDefault(); handleUndo(); }
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); handleStockClick(); }
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
