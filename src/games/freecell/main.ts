import { play, unlockAudio } from '../shared/audio';
import type { GameController } from '../shared/types';
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
} from './engine';
import {
  type Card,
  suitSymbol,
  rankLabel,
  suitColor,
  cardName,
} from '../shared/solitaire';
import {
  columnLayout,
  tableauColumnsForWidth,
  tableauGeometry,
  tableauRowsForWidth,
  type RowPlanInput,
} from '../shared/solitaire/stage-fit';
import { fanLayout } from '../shared/solitaire/fan';
import './styles.css';

const GAMES_WON_KEY = 'nocharge:freecell:games-won';
/** Solitaire cards are 5 wide by 7 tall. */
const CARD_ASPECT = 7 / 5;
const COLUMN_GAP_PX = 4;
const ROW_GAP_PX = 8;
/** Largest pile the initial deal can produce. */
const MAX_DEAL_PILE = 7;
/** Outside Game Mode the board is unconstrained, so piles use their comfort step. */
const DESKTOP_COLUMN_BUDGET_PX = 10_000;
/** Room the fan's close/page bar needs above its cards. */
const FAN_BAR_RESERVE_PX = 46;

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
        <div class="fc__tableau" data-fc="tableau"></div>
        <div class="fc__fan" data-fc="fan" role="group" aria-label="Selected column detail" hidden></div>
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
  const boardEl = root.querySelector<HTMLElement>('[data-fc="board"]')!;
  const topEl = root.querySelector<HTMLElement>('.fc__top')!;
  const tableauEl = root.querySelector<HTMLElement>('[data-fc="tableau"]')!;
  const fanEl = root.querySelector<HTMLElement>('[data-fc="fan"]')!;
  const cellEls = root.querySelectorAll<HTMLElement>('[data-fc-cell]');
  const foundationEls = root.querySelectorAll<HTMLElement>('[data-fc-fn]');

  let state: FreeCellState;
  let paused = false;
  let selected: { type: 'cell'; idx: number } | { type: 'tableau'; col: number; cardIndex: number } | null = null;
  let gamesWon = loadInt(GAMES_WON_KEY);
  let heardDeal = false;
  /** Column shown in the detail fan, or null when the tableau is on screen. */
  let fanColumn: number | null = null;
  let fanPage = 0;
  /** Columns whose pile is too tall to read at the readable floor. */
  const expanded = new Set<number>();
  /** Last applied geometry, used to avoid a measure/render feedback loop. */
  let geometryKey = '';
  let observer: ResizeObserver | null = null;

  function cuePlacement() {
    if (!heardDeal) {
      heardDeal = true;
      void play('flip');
      return;
    }
    void play('place');
  }

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
    heardDeal = false;
    fanColumn = null;
    fanPage = 0;
    expanded.clear();
    overlay.hidden = true;
    fitBoard();
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

  /**
   * Game Mode pins the viewport to a fixed pixel budget; outside it the page
   * scrolls normally and the board may take its natural height.
   */
  function inGameMode(): boolean {
    return root.closest('.is-immersive, .is-fullscreen-active') !== null;
  }

  /**
   * Measure the stage and solve the tableau geometry.
   *
   * Game Mode gives the board a fixed pixel budget, so the pile overlap is
   * derived from real measured height rather than a viewport guess. The
   * resulting key is compared before re-rendering to keep the ResizeObserver
   * from looping on its own layout changes.
   */
  function fitBoard() {
    const boardWidth = boardEl.clientWidth;
    if (boardWidth <= 0) return;

    const gameMode = inGameMode();
    const available = gameMode ? tableauHeight() : 0;

    const plan: RowPlanInput = {
      width: boardWidth,
      availableHeight: available,
      totalColumns: 8,
      maxPile: MAX_DEAL_PILE,
      columnGap: COLUMN_GAP_PX,
      rowGap: ROW_GAP_PX,
      cardAspect: CARD_ASPECT,
    };
    const rows = gameMode ? tableauRowsForWidth(plan) : 1;
    const columns = gameMode ? tableauColumnsForWidth(plan) : 8;
    const columnWidth = (boardWidth - COLUMN_GAP_PX * (columns - 1)) / columns;
    const geometry = tableauGeometry({
      columnWidth,
      cardAspect: CARD_ASPECT,
      rows,
      rowGap: ROW_GAP_PX,
      availableHeight: available,
    });

    const key = [boardWidth, columns, rows, gameMode ? 1 : 0, geometry.cardHeight.toFixed(2), geometry.rowHeight.toFixed(2)].join('|');
    if (key === geometryKey) return;
    geometryKey = key;

    root.style.setProperty('--fc-columns', String(columns));
    root.style.setProperty('--fc-card-h', `${Math.max(12, Math.floor(geometry.cardHeight))}px`);
    // Outside Game Mode the rows keep their natural height; only Game Mode
    // gets a hard row budget.
    if (gameMode && geometry.rowHeight > 0) {
      root.style.setProperty('--fc-row-h', `${Math.max(24, Math.floor(geometry.rowHeight))}px`);
    } else {
      root.style.removeProperty('--fc-row-h');
    }
    root.style.setProperty('--fc-column-gap', `${COLUMN_GAP_PX}px`);
    root.style.setProperty('--fc-row-gap', `${ROW_GAP_PX}px`);
  }

  /** Vertical room left for the tableau (or the fan that replaces it). */
  function tableauHeight(): number {
    const boardHeight = boardEl.clientHeight;
    if (boardHeight <= 0) return 0;
    return Math.max(0, boardHeight - topEl.offsetHeight - ROW_GAP_PX);
  }

  /** Height budget a single column may occupy. */
  function columnBudget(): number {
    if (!inGameMode()) return DESKTOP_COLUMN_BUDGET_PX;
    const height = tableauHeight();
    return height > 0 ? height : DESKTOP_COLUMN_BUDGET_PX;
  }

  function columnStep(col: number, cardHeight: number): { step: number; overflows: boolean } {
    const pile = state.tableau[col]!;
    const layout = columnLayout({
      cardHeight,
      availableHeight: columnBudget(),
      segments: [{ count: pile.length, faceUp: true }],
    });
    return { step: layout.segments[0]?.step ?? 0, overflows: layout.overflows };
  }

  function openFan(col: number) {
    fanColumn = col;
    fanPage = 0;
    render();
    fanEl.querySelector<HTMLElement>('[data-fc-fan-close]')?.focus({ preventScroll: true });
  }

  function closeFan(returnFocus = true) {
    const col = fanColumn;
    fanColumn = null;
    fanPage = 0;
    render();
    if (returnFocus && col !== null) {
      root.querySelector<HTMLElement>(`[data-fc-col="${col}"] [data-fc-expand]`)?.focus({ preventScroll: true });
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
    const availableHeight = inGameMode() ? tableauHeight() : Math.max(240, tableauHeight());
    const availableWidth = boardEl.clientWidth;
    const plan = fanLayout(
      {
        count: pile.length,
        cardHeight: cardHeight(),
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
      ? Math.max(24, Math.floor((availableWidth - cardHeight() * (5 / 7)) / (shown.length - 1)))
      : 0;

    fanEl.hidden = false;
    fanEl.innerHTML = `
      <div class="fc__fan-bar">
        <button type="button" class="btn btn--sm" data-fc-fan-close>Close column ${col + 1}</button>
        <span class="fc__fan-count" aria-live="polite">Column ${col + 1} · ${pile.length} cards${
          plan.pages > 1 ? ` · page ${Math.min(plan.pages, Math.floor(plan.startIndex / Math.max(1, plan.perPage)) + 1)} of ${plan.pages}` : ''
        }</span>
        ${
          plan.pages > 1
            ? '<span class="fc__fan-pager"><button type="button" class="btn btn--sm" data-fc-fan-prev>Previous</button><button type="button" class="btn btn--sm" data-fc-fan-next>Next</button></span>'
            : ''
        }
      </div>
      <div class="fc__fan-cards"></div>
    `;

    const cardsEl = fanEl.querySelector<HTMLElement>('.fc__fan-cards')!;
    shown.forEach((card, offset) => {
      const index = plan.startIndex + offset;
      const cardEl = renderCard(card, true);
      cardEl.classList.add('fc__fan-card');
      cardEl.dataset.fcFanCard = String(index);
      cardEl.setAttribute('role', 'button');
      cardEl.setAttribute('tabindex', '0');
      cardEl.style.marginTop = offset === 0 ? '0px' : `${plan.step}px`;
      if (horizontalStep > 0) cardEl.style.marginLeft = `${horizontalStep}px`;
      if (selected?.type === 'tableau' && selected.col === col && index >= selected.cardIndex) {
        cardEl.classList.add('is-selected');
      }
      const pick = () => handleTableauCardClick(col, index);
      cardEl.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); pick(); });
      cardEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      cardsEl.appendChild(cardEl);
    });

    fanEl.querySelector('[data-fc-fan-close]')?.addEventListener('click', () => closeFan());
    fanEl.querySelector('[data-fc-fan-prev]')?.addEventListener('click', () => { fanPage = Math.max(0, fanPage - 1); render(); });
    fanEl.querySelector('[data-fc-fan-next]')?.addEventListener('click', () => { fanPage += 1; render(); });
  }

  function cardHeight(): number {
    const raw = root.style.getPropertyValue('--fc-card-h');
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 48;
  }

  function renderTableau() {
    const height = cardHeight();
    tableauEl.innerHTML = '';

    state.tableau.forEach((column, col) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'fc__column';
      wrapper.dataset.fcCol = String(col);

      const header = document.createElement('div');
      header.className = 'fc__column-head';
      const expand = document.createElement('button');
      expand.type = 'button';
      expand.className = 'fc__expand';
      expand.dataset.fcExpand = '';
      const tooTall = columnStep(col, height).overflows || expanded.has(col);
      expand.setAttribute('aria-expanded', String(tooTall));
      expand.setAttribute('aria-label', `Open column ${col + 1} detail: ${column.length} cards`);
      expand.textContent = tooTall ? '▼' : '⤢';
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
      pile.className = 'fc__pile';
      const { step } = columnStep(col, height);
      if (column.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'fc__card fc__card--empty';
        empty.setAttribute('aria-hidden', 'true');
        pile.appendChild(empty);
      }
      column.forEach((card, i) => {
        const cardEl = renderCard(card, true);
        cardEl.dataset.fcCard = String(i);
        cardEl.style.marginTop = i === 0 ? '0px' : `${step}px`;
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
        pile.appendChild(cardEl);
      });
      wrapper.appendChild(pile);

      wrapper.setAttribute(
        'aria-label',
        `Column ${col + 1}, ${column.length} cards${column.length > 0 ? ', top: ' + cardName(column[column.length - 1]!) : ''}`,
      );
      wrapper.addEventListener('pointerdown', (e) => { e.preventDefault(); handleColumnClick(col); });
      wrapper.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleColumnClick(col); } });
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'button');
      tableauEl.appendChild(wrapper);
    });
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

    // The fan replaces the tableau inside the same fixed stage; it never
    // extends the board, so nothing has to be scrolled to.
    tableauEl.hidden = fanColumn !== null;
    renderTableau();
    renderFan();

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
      if (result) { state = result; selected = null; cuePlacement(); render(); return; }
      selected = null;
      render();
      return;
    }

    if (selected?.type === 'tableau') {
      // Move selected tableau card to this cell
      const result = moveToFreeCell(state, selected.col);
      if (result) { state = result; selected = null; cuePlacement(); render(); return; }
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
      if (result) { state = result; selected = null; cuePlacement(); render(); return; }
    }

    if (selected?.type === 'tableau') {
      if (selected.col === col) {
        // Double-click top card → try foundation
        if (cardIndex === state.tableau[col]!.length - 1) {
          const result = moveTableauToFoundation(state, col);
          if (result) { state = result; selected = null; cuePlacement(); render(); return; }
        }
        selected = null;
        render();
        return;
      }
      const result = moveTableau(state, selected.col, selected.cardIndex, col);
      if (result) { state = result; selected = null; cuePlacement(); render(); return; }
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
      if (result) { state = result; selected = null; cuePlacement(); render(); return; }
    }
    if (selected?.type === 'tableau') {
      const result = moveTableau(state, selected.col, selected.cardIndex, col);
      if (result) { state = result; selected = null; cuePlacement(); render(); return; }
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

  undoBtn.addEventListener('click', handleUndo);
  againBtn.addEventListener('click', () => init());

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fanColumn !== null) {
      // Stop here so Escape closes the fan without also exiting Game Mode.
      e.preventDefault();
      e.stopPropagation();
      closeFan();
      return;
    }
    if (e.key === 'u' || e.key === 'U') { e.preventDefault(); handleUndo(); }
  });

  init();

  if (typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(() => {
      fitBoard();
      render();
    });
    observer.observe(boardEl);
  }

  return {
    destroy() {
      observer?.disconnect();
      observer = null;
      root.innerHTML = '';
    },
    pause() { paused = true; },
    resume() { paused = false; },
    isPaused: () => paused,
    restart: () => init(),
  };
}
