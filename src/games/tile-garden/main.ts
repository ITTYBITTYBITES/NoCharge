import { play, unlockAudio } from '../shared/audio';
import type { GameController } from '../shared/types';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import {
  type TileGardenState,
  type GameMode,
  type Tile,
  TIER_NAMES,
  createGame,
  placeTile,
  undo as engineUndo,
  clearTile,
} from './engine';
import './styles.css';

const BEST_TIER_KEY = 'nocharge:tile-garden:best-tier';

const SPECIES_EMOJI = ['🌱', '🌿', '🌻', '🌷', '🌸', '🪴'];

export function mountTileGarden(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="tg">
      <div class="tg__hud">
        <div class="tg__stats" aria-live="polite">
          <span>Moves <strong data-tg="moves">0</strong></span>
          <span>Best tier <strong data-tg="best">—</strong></span>
          <span>Next <strong data-tg="next"></strong></span>
        </div>
        <div class="tg__controls">
          <button type="button" class="btn btn--sm" data-tg="mode-btn">Garden</button>
          <button type="button" class="btn btn--sm" data-tg="undo-btn">Undo</button>
          <button type="button" class="btn btn--sm" data-tg="restart-btn">New game</button>
        </div>
      </div>
      <div class="tg__board" data-tg="board" role="group" aria-label="Tile Garden board"></div>
      <div class="tg__overlay" data-tg="overlay" hidden>
        <h2>Garden complete</h2>
        <p data-tg="result" aria-live="polite"></p>
        <button type="button" class="btn" data-tg="again">New game</button>
      </div>
    </div>
  `;

  const movesEl = root.querySelector<HTMLElement>('[data-tg="moves"]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-tg="best"]')!;
  const nextEl = root.querySelector<HTMLElement>('[data-tg="next"]')!;
  const modeBtn = root.querySelector<HTMLButtonElement>('[data-tg="mode-btn"]')!;
  const undoBtn = root.querySelector<HTMLButtonElement>('[data-tg="undo-btn"]')!;
  const restartBtn = root.querySelector<HTMLButtonElement>('[data-tg="restart-btn"]')!;
  const boardEl = root.querySelector<HTMLElement>('[data-tg="board"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-tg="overlay"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-tg="result"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-tg="again"]')!;

  let state: TileGardenState;
  let paused = false;
  let currentMode: GameMode = 'garden';
  let cursorRow = 0;
  let cursorCol = 0;
  let bestTierEver = loadBestTier();

  function loadBestTier(): number {
    try {
      const raw = localStorage.getItem(BEST_TIER_KEY);
      if (raw == null) return 0;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    } catch { return 0; }
  }

  function saveBestTier(value: number): void {
    try { localStorage.setItem(BEST_TIER_KEY, String(value)); } catch { /* */ }
  }

  function init(mode?: GameMode) {
    if (mode) currentMode = mode;
    state = createGame(currentMode);
    cursorRow = 0;
    cursorCol = 0;
    overlay.hidden = true;
    render();
  }

  function tileDisplay(tile: Tile): string {
    const tierEmoji = ['🌱', '🌿', '🌼', '🌸'];
    return tierEmoji[tile.tier] || '🌱';
  }

  function render() {
    movesEl.textContent = String(state.moves);
    bestEl.textContent = state.bestTier > 0 ? TIER_NAMES[state.bestTier] : '—';
    nextEl.textContent = tileDisplay(state.nextTile);
    modeBtn.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);

    boardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'tg__cell';

        const tile = state.grid[r]![c];
        if (tile) {
          cell.classList.add(`tg__cell--tier-${tile.tier}`);
          cell.innerHTML = `<span class="tg__emoji">${tileDisplay(tile)}</span><span class="tg__species">${SPECIES_EMOJI[tile.species]}</span>`;
          cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}: ${TIER_NAMES[tile.tier]} species ${tile.species + 1}`);
        } else {
          cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}: empty`);
        }

        if (r === cursorRow && c === cursorCol) cell.classList.add('tg__cell--cursor');

        // Use click rather than pointerdown so native button activation with
        // Enter and Space follows the same path as pointer and touch input.
        cell.addEventListener('click', () => {
          handleCellClick(r, c);
        });

        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (currentMode === 'sketch') {
            const result = clearTile(state, r, c);
            if (result) { state = result; render(); }
          }
        });

        boardEl.appendChild(cell);
      }
    }

    if (state.bestTier > bestTierEver) {
      bestTierEver = state.bestTier;
      saveBestTier(bestTierEver);
    }

    if (state.won) {
      resultEl.textContent = `A flower bloomed in ${state.moves} moves.`;
      overlay.hidden = false;
      void play('win');
    }
  }

  function focusCursor() {
    const index = cursorRow * 8 + cursorCol;
    boardEl.querySelectorAll<HTMLButtonElement>('.tg__cell')[index]?.focus();
  }

  function handleCellClick(row: number, col: number) {
    if (paused || state.won) return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);
    cursorRow = row;
    cursorCol = col;

    if (state.grid[row]![col] !== null) return;

    const result = placeTile(state, row, col);
    if (result) {
      state = result;
      void play('pop');
      render();
      focusCursor();
    }
  }

  function handleUndo() {
    if (paused) return;
    const result = engineUndo(state);
    if (result) { state = result; render(); }
  }

  function handleModeToggle() {
    const modes: GameMode[] = ['garden', 'meadow', 'sketch'];
    const idx = modes.indexOf(currentMode);
    currentMode = modes[(idx + 1) % modes.length]!;
    init(currentMode);
  }

  modeBtn.addEventListener('click', handleModeToggle);
  undoBtn.addEventListener('click', handleUndo);
  restartBtn.addEventListener('click', () => init());
  againBtn.addEventListener('click', () => init());

  // Keyboard
  root.addEventListener('keydown', (e) => {
    if (paused) return;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); cursorRow = (cursorRow - 1 + 8) % 8; render(); focusCursor(); break;
      case 'ArrowDown': e.preventDefault(); cursorRow = (cursorRow + 1) % 8; render(); focusCursor(); break;
      case 'ArrowLeft': e.preventDefault(); cursorCol = (cursorCol - 1 + 8) % 8; render(); focusCursor(); break;
      case 'ArrowRight': e.preventDefault(); cursorCol = (cursorCol + 1) % 8; render(); focusCursor(); break;
      case 'u': case 'U':
        e.preventDefault();
        handleUndo();
        break;
      case 'Delete': case 'Backspace':
        if (currentMode === 'sketch') {
          e.preventDefault();
          const result = clearTile(state, cursorRow, cursorCol);
          if (result) { state = result; render(); }
        }
        break;
    }
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
