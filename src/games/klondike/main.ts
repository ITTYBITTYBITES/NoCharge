import { play, unlockAudio } from '../shared/audio';
import { loadPref, savePref } from '../shared/storage';
import type { GameController } from '../shared/types';
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
import {
  RUN_GAP_PX,
  columnLayout,
  tableauGeometry,
} from '../shared/solitaire/stage-fit';
import { fanLayout } from '../shared/solitaire/fan';
import './styles.css';

const DRAW_MODE_KEY = 'klondike-draw-mode';
const GAMES_WON_KEY = 'nocharge:klondike:games-won';
const BEST_MOVES_KEY = 'nocharge:klondike:best-moves';
/** Solitaire cards are 5 wide by 7 tall. */
const CARD_ASPECT = 7 / 5;
const COLUMN_GAP_PX = 4;
const TABLEAU_COLUMNS = 7;
/** Outside Game Mode the board is unconstrained, so piles use their comfort step. */
const DESKTOP_COLUMN_BUDGET_PX = 10_000;
/** Room the fan's close/page bar needs above its cards. */
const FAN_BAR_RESERVE_PX = 46;

/** Split a column into its covered prefix and its open tail. */
function splitColumn(column: readonly Card[]): { down: number; up: number } {
  let down = 0;
  while (down < column.length && !column[down]!.faceUp) down += 1;
  return { down, up: column.length - down };
}

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
        <div class="kl__tableau" data-kl="tableau"></div>
        <div class="kl__fan" data-kl="fan" role="group" aria-label="Selected column detail" hidden></div>
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
  const boardEl = root.querySelector<HTMLElement>('[data-kl="board"]')!;
  const topEl = root.querySelector<HTMLElement>('.kl__top')!;
  const tableauEl = root.querySelector<HTMLElement>('[data-kl="tableau"]')!;
  const fanEl = root.querySelector<HTMLElement>('[data-kl="fan"]')!;
  const foundationEls = root.querySelectorAll<HTMLElement>('[data-kl-fn]');
  const gameEl = root.querySelector<HTMLElement>('.kl')!;

  let state: KlondikeState;
  let paused = false;
  let selected: { type: 'waste' } | { type: 'tableau'; col: number; cardIndex: number } | null = null;
  /** Column shown in the detail fan, or null when the tableau is on screen. */
  let fanColumn: number | null = null;
  let fanPage = 0;
  let geometryKey = '';
  let observer: ResizeObserver | null = null;

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
    fanColumn = null;
    fanPage = 0;
    overlay.hidden = true;
    fitBoard();
    render();
  }

  /**
   * Game Mode pins the viewport to a fixed pixel budget; outside it the page
   * scrolls normally and the board may take its natural height.
   */
  function inGameMode(): boolean {
    return root.closest('.is-immersive, .is-fullscreen-active') !== null;
  }

  function getViewport(): HTMLElement | null {
    return root.closest('[data-game-viewport]') as HTMLElement | null;
  }

  /** Vertical room left for the tableau (or the fan that replaces it) inside the fixed stage. */
  function tableauAvailableHeight(): number {
    const viewport = getViewport();
    if (!viewport) return 0;
    const viewportRect = viewport.getBoundingClientRect();
    const tableauRect = tableauEl.getBoundingClientRect();
    if (tableauRect.top > 0 && tableauRect.width > 0) {
      return Math.max(0, viewportRect.bottom - tableauRect.top - 12);
    }
    const boardRect = boardEl.getBoundingClientRect();
    const hudEl = root.querySelector<HTMLElement>('.kl__hud');
    const hudH = hudEl ? hudEl.getBoundingClientRect().height : 0;
    const topH = topEl.getBoundingClientRect().height || topEl.offsetHeight;
    const estimatedTop = boardRect.top + hudH + topH + COLUMN_GAP_PX + 8;
    if (estimatedTop > 0) {
      return Math.max(0, viewportRect.bottom - estimatedTop - 12);
    }
    const toolbar = viewport.querySelector<HTMLElement>('.game-toolbar');
    const toolbarH = toolbar ? toolbar.getBoundingClientRect().height : 0;
    return Math.max(0, viewportRect.height - toolbarH - hudH - topH - COLUMN_GAP_PX - 24);
  }

  /** Height budget a single column may occupy. */
  function columnBudget(): number {
    if (!inGameMode()) return DESKTOP_COLUMN_BUDGET_PX;
    const height = tableauAvailableHeight();
    return height > 0 ? height : DESKTOP_COLUMN_BUDGET_PX;
  }

  /**
   * Measure the stage and derive the card size from it. The key is compared
   * before re-rendering so the ResizeObserver cannot loop on its own layout.
   */
  function fitBoard() {
    const boardWidth = boardEl.clientWidth;
    if (boardWidth <= 0) return;

    const gameMode = inGameMode();
    const columnWidth = (boardWidth - COLUMN_GAP_PX * (TABLEAU_COLUMNS - 1)) / TABLEAU_COLUMNS;
    const geometry = tableauGeometry({
      columnWidth,
      cardAspect: CARD_ASPECT,
      rows: 1,
      rowGap: COLUMN_GAP_PX,
      availableHeight: gameMode ? tableauAvailableHeight() : 0,
    });

    const key = [boardWidth, gameMode ? 1 : 0, geometry.cardHeight.toFixed(2)].join('|');
    if (key === geometryKey) return;
    geometryKey = key;

    gameEl.style.setProperty('--kl-card-h', `${Math.max(12, Math.floor(geometry.cardHeight))}px`);
    gameEl.style.setProperty('--kl-column-gap', `${COLUMN_GAP_PX}px`);
    root.style.setProperty('--kl-card-h', `${Math.max(12, Math.floor(geometry.cardHeight))}px`);
    root.style.setProperty('--kl-column-gap', `${COLUMN_GAP_PX}px`);
  }

  function cardHeight(): number {
    const raw = gameEl.style.getPropertyValue('--kl-card-h') || root.style.getPropertyValue('--kl-card-h');
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    const computed = getComputedStyle(gameEl).getPropertyValue('--kl-card-h');
    const parsedComputed = Number.parseFloat(computed);
    return Number.isFinite(parsedComputed) && parsedComputed > 0 ? parsedComputed : 48;
  }

  /** Steps for a column: one for the covered run, one for the open tail. */
  function columnSteps(col: number): { down: number; up: number; overflows: boolean } {
    const column = state.tableau[col]!;
    const { down, up } = splitColumn(column);
    const layout = columnLayout({
      cardHeight: cardHeight(),
      availableHeight: columnBudget(),
      segments: [
        { count: down, faceUp: false },
        { count: up, faceUp: true },
      ],
    });
    return {
      down: layout.segments[0]?.step ?? 0,
      up: layout.segments[1]?.step ?? 0,
      overflows: layout.overflows,
    };
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

  function openFan(col: number) {
    fanColumn = col;
    fanPage = 0;
    render();
    const attemptFocus = () => {
      const closeBtn = fanEl.querySelector<HTMLElement>('[data-kl-fan-close]');
      if (closeBtn) {
        try { closeBtn.focus({ preventScroll: true }); } catch { closeBtn.focus(); }
      }
    };
    attemptFocus();
    window.setTimeout(attemptFocus, 0);
    window.setTimeout(attemptFocus, 50);
    window.setTimeout(attemptFocus, 150);
  }

  function closeFan(returnFocus = true) {
    const col = fanColumn;
    fanColumn = null;
    fanPage = 0;
    render();
    if (returnFocus && col !== null) {
      const attemptFocus = () => {
        const trigger = root.querySelector<HTMLElement>(`[data-kl-col="${col}"] [data-kl-expand]`);
        if (trigger) {
          try { trigger.focus({ preventScroll: true }); } catch { trigger.focus(); }
        }
      };
      attemptFocus();
      window.setTimeout(attemptFocus, 0);
      window.setTimeout(attemptFocus, 50);
      window.setTimeout(attemptFocus, 150);
    }
  }

  function renderFan() {
    if (fanColumn === null) {
      fanEl.hidden = true;
      fanEl.innerHTML = '';
      return;
    }

    const col = fanColumn;
    const pile = state.tableau[col]!;
    const availableHeight = inGameMode() ? tableauAvailableHeight() : Math.max(240, tableauAvailableHeight());
    const availableWidth = boardEl.clientWidth;
    const ch = cardHeight();
    const plan = fanLayout(
      {
        count: pile.length,
        cardHeight: ch,
        // The fan bar sits above the cards inside the same fixed stage, so it
        // has to come out of the budget before the cards are sized.
        availableHeight: Math.max(0, availableHeight - FAN_BAR_RESERVE_PX),
        availableWidth,
        cardAspect: CARD_ASPECT,
      },
      fanPage,
    );
    const shown = pile.slice(plan.startIndex, plan.startIndex + Math.max(1, plan.perPage));
    const horizontalStep = plan.compressed && shown.length > 1
      ? Math.max(24, Math.floor((availableWidth - ch * (5 / 7)) / (shown.length - 1)))
      : 0;

    fanEl.hidden = false;
    fanEl.innerHTML = `
      <div class="kl__fan-bar">
        <button type="button" class="btn btn--sm" data-kl-fan-close>Close column ${col + 1}</button>
        <span class="kl__fan-count" aria-live="polite">Column ${col + 1} · ${pile.length} cards${
          plan.pages > 1 ? ` · page ${Math.min(plan.pages, Math.floor(plan.startIndex / Math.max(1, plan.perPage)) + 1)} of ${plan.pages}` : ''
        }</span>
        ${
          plan.pages > 1
            ? '<span class="kl__fan-pager"><button type="button" class="btn btn--sm" data-kl-fan-prev>Previous</button><button type="button" class="btn btn--sm" data-kl-fan-next>Next</button></span>'
            : ''
        }
      </div>
      <div class="kl__fan-cards"></div>
    `;

    const cardsEl = fanEl.querySelector<HTMLElement>('.kl__fan-cards')!;
    shown.forEach((card, offset) => {
      const index = plan.startIndex + offset;
      const cardEl = renderCard(card, card.faceUp);
      cardEl.classList.add('kl__fan-card');
      cardEl.dataset.klFanCard = String(index);
      cardEl.style.marginTop = offset === 0 ? '0px' : `${plan.step - ch}px`;
      if (horizontalStep > 0) cardEl.style.marginLeft = `${horizontalStep}px`;
      if (card.faceUp) {
        cardEl.setAttribute('role', 'button');
        cardEl.setAttribute('tabindex', '0');
        if (selected?.type === 'tableau' && selected.col === col && index >= selected.cardIndex) {
          cardEl.classList.add('is-selected');
        }
        const pick = () => handleTableauCardClick(col, index);
        cardEl.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); pick(); });
        cardEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      }
      cardsEl.appendChild(cardEl);
    });

    fanEl.querySelector('[data-kl-fan-close]')?.addEventListener('click', () => closeFan());
    fanEl.querySelector('[data-kl-fan-prev]')?.addEventListener('click', () => { fanPage = Math.max(0, fanPage - 1); render(); });
    fanEl.querySelector('[data-kl-fan-next]')?.addEventListener('click', () => { fanPage += 1; render(); });
  }

  function renderTableau() {
    tableauEl.innerHTML = '';

    state.tableau.forEach((column, col) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'kl__column';
      wrapper.dataset.klCol = String(col);

      const header = document.createElement('div');
      header.className = 'kl__column-head';
      const expand = document.createElement('button');
      expand.type = 'button';
      expand.className = 'kl__expand';
      expand.dataset.klExpand = '';
      expand.setAttribute('aria-expanded', 'false');
      expand.setAttribute('aria-label', `Open column ${col + 1} detail: ${column.length} cards`);
      expand.textContent = '⤢';
      expand.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
      expand.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        unlockAudio();
        openFan(col);
      });
      header.appendChild(expand);
      wrapper.appendChild(header);

      const pile = document.createElement('div');
      pile.className = 'kl__pile';
      const { down, up } = splitColumn(column);
      const steps = columnSteps(col);
      const ch = cardHeight();

      if (column.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'kl__card kl__card--empty';
        empty.setAttribute('aria-hidden', 'false');
        empty.setAttribute('role', 'button');
        empty.setAttribute('tabindex', '0');
        empty.setAttribute('aria-label', `Column ${col + 1}, empty`);
        empty.addEventListener('pointerdown', (e) => { e.preventDefault(); handleColumnClick(col); });
        empty.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleColumnClick(col); } });
        pile.appendChild(empty);
      }

      column.forEach((card, i) => {
        const cardEl = renderCard(card, card.faceUp);
        cardEl.dataset.klCard = String(i);
        const isFirstOfRun = i === 0 || i === down;
        // Overlapping logic: visible strip = step, margin = step - cardHeight
        // For first card of second run, add RUN_GAP between runs.
        let margin = 0;
        if (i === 0) {
          margin = 0;
        } else if (isFirstOfRun) {
          // Gap between down and up runs: previous step + RUN_GAP - cardHeight
          margin = steps.down - ch + RUN_GAP_PX;
        } else {
          const step = card.faceUp ? steps.up : steps.down;
          margin = step - ch;
        }
        cardEl.style.marginTop = `${margin}px`;
        if (card.faceUp) {
          if (selected?.type === 'tableau' && selected.col === col && i >= selected.cardIndex) {
            cardEl.classList.add('is-selected');
          }
          cardEl.setAttribute('role', 'button');
          cardEl.setAttribute('tabindex', '0');
          const pickCard = () => handleTableauCardClick(col, i);
          cardEl.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            pickCard();
          });
          cardEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); pickCard(); }
          });
        }
        pile.appendChild(cardEl);
      });
      wrapper.appendChild(pile);

      // Accessibility: wrapper is group, not button, to avoid nested interactive.
      wrapper.setAttribute('role', 'group');
      wrapper.setAttribute('aria-label', `Tableau column ${col + 1}, ${column.length} cards, ${up} face up${column.length > 0 ? `, top: ${column[column.length - 1]!.faceUp ? cardName(column[column.length - 1]!) : 'hidden'}` : ''}`);
      tableauEl.appendChild(wrapper);
    });
  }

  function render() {
    movesEl.textContent = String(state.moves);
    bestEl.textContent = bestMoves > 0 ? String(bestMoves) : '—';
    wonEl.textContent = String(gamesWon);
    drawToggle.textContent = `Draw ${state.drawMode}`;

    // Stock
    const stockBack = stockEl.querySelector<HTMLElement>('.kl__card--back');
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

    // The fan replaces the tableau inside the same fixed stage.
    tableauEl.hidden = fanColumn !== null;
    renderTableau();
    renderFan();

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

  function handleStockClick() {
    if (paused) return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);
    selected = null;
    state = drawFromStock(state);
    state = autoMoveToFoundation(state);
    void play('flip');
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
        void play('move');
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
        void play('place');
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
            void play('move');
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
        void play('place');
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
        void play('place');
        render();
        return;
      }
    }
    if (selected?.type === 'tableau') {
      const result = moveTableau(state, selected.col, selected.cardIndex, col);
      if (result) {
        state = result;
        selected = null;
        void play('place');
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
    fanColumn = null;
    fanPage = 0;
    render();
  }

  // Event bindings
  stockEl.addEventListener('pointerdown', (e) => { e.preventDefault(); handleStockClick(); });
  stockEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStockClick(); } });
  wasteEl.addEventListener('pointerdown', (e) => { e.preventDefault(); handleWasteClick(); });
  wasteEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleWasteClick(); } });

  undoBtn.addEventListener('click', handleUndo);
  drawToggle.addEventListener('click', handleDrawToggle);
  againBtn.addEventListener('click', () => init());

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && fanColumn !== null) {
      // Stop here so Escape closes the fan without also exiting Game Mode.
      e.preventDefault();
      e.stopPropagation();
      closeFan();
      return;
    }
    if (e.key === 'u' || e.key === 'U') { e.preventDefault(); handleUndo(); }
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); handleStockClick(); }
  };

  const onDocKeyDownCapture = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && fanColumn !== null) {
      e.preventDefault();
      e.stopPropagation();
      closeFan();
    }
  };

  root.addEventListener('keydown', onKeyDown);
  document.addEventListener('keydown', onDocKeyDownCapture, true);

  init();

  if (typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(() => {
      const prev = geometryKey;
      fitBoard();
      if (geometryKey !== prev) render();
    });
    observer.observe(boardEl);
    const viewport = getViewport();
    if (viewport) observer.observe(viewport);
  }

  return {
    destroy() {
      observer?.disconnect();
      observer = null;
      root.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keydown', onDocKeyDownCapture, true);
      root.innerHTML = '';
    },
    pause() { paused = true; },
    resume() { paused = false; },
    isPaused: () => paused,
    restart: () => init(),
  };
}
