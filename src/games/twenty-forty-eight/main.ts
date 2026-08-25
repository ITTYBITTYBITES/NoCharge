import { play, unlockAudio } from '../shared/audio';
import type { GameController } from '../shared/types';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import {
  type TwentyFortyEightState,
  type Direction,
  createGame,
  move,
  undo as engineUndo,
} from './engine';
import './styles.css';

const GAME_ID = 'twenty-forty-eight';
const BEST_TILE_KEY = 'nocharge:2048:best-tile';

export function mountTwentyFortyEight(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="tfe">
      <div class="tfe__hud">
        <div class="tfe__stats" aria-live="polite">
          <span>Score <strong data-tfe="score">0</strong></span>
          <span>Best <strong data-tfe="best">—</strong></span>
        </div>
        <div class="tfe__controls">
          <button type="button" class="btn btn--sm" data-tfe="undo-btn">Undo</button>
        </div>
      </div>
      <div class="tfe__board" data-tfe="board" role="group" aria-label="2048 game board"></div>
      <div class="tfe__overlay" data-tfe="overlay" hidden>
        <h2 data-tfe="overlay-title"></h2>
        <p data-tfe="result" aria-live="polite"></p>
        <div class="tfe__overlay-controls">
          <button type="button" class="btn" data-tfe="continue-btn" hidden>Keep going</button>
          <button type="button" class="btn" data-tfe="again-btn">New game</button>
        </div>
      </div>
    </div>
  `;

  const scoreEl = root.querySelector<HTMLElement>('[data-tfe="score"]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-tfe="best"]')!;
  const undoBtn = root.querySelector<HTMLButtonElement>('[data-tfe="undo-btn"]')!;
  const boardEl = root.querySelector<HTMLElement>('[data-tfe="board"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-tfe="overlay"]')!;
  const overlayTitle = root.querySelector<HTMLElement>('[data-tfe="overlay-title"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-tfe="result"]')!;
  const continueBtn = root.querySelector<HTMLButtonElement>('[data-tfe="continue-btn"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-tfe="again-btn"]')!;

  let state: TwentyFortyEightState;
  let paused = false;
  let continuing = false; // past 2048 win
  let bestTile = loadBestTile();

  function loadBestTile(): number {
    try {
      const raw = localStorage.getItem(BEST_TILE_KEY);
      if (raw == null) return 0;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    } catch { return 0; }
  }

  function saveBestTile(value: number): void {
    try { localStorage.setItem(BEST_TILE_KEY, String(value)); } catch { /* */ }
  }

  function init() {
    state = createGame();
    continuing = false;
    overlay.hidden = true;
    render();
  }

  function render() {
    scoreEl.textContent = String(state.score);
    bestEl.textContent = bestTile > 0 ? String(bestTile) : '—';

    boardEl.innerHTML = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'tfe__cell';
        const value = state.grid[r]![c]!;
        if (value > 0) {
          cell.textContent = String(value);
          cell.classList.add(`tfe__cell--${Math.min(value, 2048)}`);
          cell.setAttribute('role', 'img');
          cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}: ${value}`);
        } else {
          cell.setAttribute('aria-hidden', 'true');
        }
        boardEl.appendChild(cell);
      }
    }

    // Update best
    if (state.bestTile > bestTile) {
      bestTile = state.bestTile;
      saveBestTile(bestTile);
      bestEl.textContent = String(bestTile);
    }

    // Win/lose overlays
    if (state.won && !continuing) {
      overlayTitle.textContent = 'You reached 2048';
      resultEl.textContent = `Score: ${state.score}. Keep going for higher tiles?`;
      continueBtn.hidden = false;
      overlay.hidden = false;
      void play('win');
    } else if (state.over) {
      overlayTitle.textContent = 'No moves left';
      resultEl.textContent = `Final score: ${state.score}. Best tile: ${state.bestTile}.`;
      continueBtn.hidden = true;
      overlay.hidden = false;
      void play('move');
    }
  }

  function handleMove(direction: Direction) {
    if (paused || state.over) return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);
    const next = move(state, direction);
    if (next) {
      if (next.score > state.score) void play('merge');
      state = next;
      render();
    }
  }

  function handleUndo() {
    if (paused) return;
    const next = engineUndo(state);
    if (next) { state = next; render(); }
  }

  undoBtn.addEventListener('click', handleUndo);
  againBtn.addEventListener('click', () => init());
  continueBtn.addEventListener('click', () => {
    continuing = true;
    overlay.hidden = true;
  });

  // Keyboard
  root.addEventListener('keydown', (e) => {
    const dirMap: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right',
    };
    const dir = dirMap[e.key];
    if (dir) { e.preventDefault(); handleMove(dir); }
    if (e.key === 'u' || e.key === 'U') { e.preventDefault(); handleUndo(); }
  });

  // Touch swipe
  let touchStartX = 0;
  let touchStartY = 0;
  boardEl.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0]!.clientX;
    touchStartY = e.touches[0]!.clientY;
  }, { passive: true });
  boardEl.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0]!.clientX - touchStartX;
    const dy = e.changedTouches[0]!.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return; // too short
    if (absDx > absDy) {
      handleMove(dx > 0 ? 'right' : 'left');
    } else {
      handleMove(dy > 0 ? 'down' : 'up');
    }
  }, { passive: true });

  init();

  return {
    destroy() { root.innerHTML = ''; },
    pause() { paused = true; },
    resume() { paused = false; },
    isPaused: () => paused,
    restart: () => init(),
  };
}
