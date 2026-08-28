import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import type { GameController, PauseReason } from '../shared/types';
import { applyPress, cellName, isSolved, litCount, newGame, type LightsState } from './engine';
import './styles.css';

const GAME_ID = 'lights-out';
const BEST_MOVES_KEY = `nocharge:${GAME_ID}:best-moves`;
const SOLVED_KEY = `nocharge:${GAME_ID}:puzzles-solved`;

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function loadNumber(key: string): number {
  const value = Number(getBrowserStorage()?.getItem(key));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function saveNumber(key: string, value: number): void {
  try {
    getBrowserStorage()?.setItem(key, String(value));
  } catch {
    /* storage unavailable */
  }
}

export function mountLightsOut(root: HTMLElement): GameController {
  let solved = loadNumber(SOLVED_KEY);
  let bestMoves = loadNumber(BEST_MOVES_KEY);

  root.innerHTML = `
    <div class="lo" style="--lo-accent:#a78bfa">
      <div class="lo-hud">
        <p class="lo-hud__status" role="status" aria-live="polite" data-lo-status></p>
        <p class="lo-hud__metrics" data-lo-metrics></p>
      </div>
      <div class="lo-stage">
        <div class="lo-board" role="grid" aria-label="Lights Out 5×5 board" data-lo-board></div>
        <div class="lo-result" data-lo-result hidden>
          <div class="lo-result__card">
            <p class="lo-result__kicker">Lights out</p>
            <h2 class="lo-result__title" data-lo-result-title></h2>
            <p class="lo-result__detail" data-lo-result-detail></p>
            <button type="button" class="btn" data-lo-again>New puzzle</button>
          </div>
        </div>
      </div>
      <p class="lo-note">Pressing a light toggles it and its four neighbours (up, down, left, right). Turn every light off. Every puzzle is generated from a solved board, so it is solvable by construction — there is no timer.</p>
    </div>
  `;

  const boardEl = root.querySelector<HTMLElement>('[data-lo-board]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-lo-status]')!;
  const metricsEl = root.querySelector<HTMLElement>('[data-lo-metrics]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-lo-result]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-lo-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-lo-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-lo-again]')!;

  let paused = false;
  let state: LightsState = newGame();
  let focusRow = 0;
  let focusCol = 0;

  const buttons = () => [...boardEl.querySelectorAll<HTMLButtonElement>('[data-lo-cell]')];

  const metrics = () => `Puzzles solved here: ${solved} · best moves: ${bestMoves > 0 ? bestMoves : '—'}`;

  const render = () => {
    boardEl.setAttribute('aria-rowcount', '5');
    boardEl.setAttribute('aria-colcount', '5');
    boardEl.innerHTML = '';
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const lit = state.board[row]![col];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = lit ? 'lo-cell is-lit' : 'lo-cell';
        button.dataset.loCell = '';
        button.dataset.row = String(row);
        button.dataset.col = String(col);
        button.setAttribute('role', 'gridcell');
        button.setAttribute('aria-pressed', String(lit));
        button.setAttribute('aria-label', `${cellName(row, col)}, ${lit ? 'light on' : 'light off'}`);
        button.tabIndex = row === focusRow && col === focusCol ? 0 : -1;
        boardEl.append(button);
      }
    }
    statusEl.textContent = state.status === 'won' ? 'All lights are off.' : `${litCount(state.board)} lights on · ${state.moves} moves`;
    metricsEl.textContent = metrics();
  };

  const finish = () => {
    solved += 1;
    saveNumber(SOLVED_KEY, solved);
    if (bestMoves === 0 || state.moves < bestMoves) {
      bestMoves = state.moves;
      saveNumber(BEST_MOVES_KEY, bestMoves);
    }
    void play('win');
    statusEl.textContent = 'All lights are off.';
    resultTitle.textContent = `Cleared in ${state.moves} moves.`;
    resultDetail.textContent = metrics();
    resultEl.hidden = false;
    againBtn.focus();
  };

  const activate = (row: number, col: number) => {
    unlockAudio();
    if (paused || state.status === 'won') return;
    state = applyPress(state, row, col);
    void play('flip');
    signalMeaningfulGameInteraction(root);
    render();
    if (isSolved(state.board) && state.status === 'won') finish();
  };

  boardEl.addEventListener('click', (event) => {
    if (paused) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-lo-cell]');
    if (!button) return;
    focusRow = Number(button.dataset.row);
    focusCol = Number(button.dataset.col);
    activate(focusRow, focusCol);
  });

  boardEl.addEventListener('keydown', (event) => {
    const step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
    if (step) {
      event.preventDefault();
      focusRow = Math.max(0, Math.min(4, focusRow + step[0]));
      focusCol = Math.max(0, Math.min(4, focusCol + step[1]));
      for (const button of buttons()) button.tabIndex = Number(button.dataset.row) === focusRow && Number(button.dataset.col) === focusCol ? 0 : -1;
      buttons().find((button) => Number(button.dataset.row) === focusRow && Number(button.dataset.col) === focusCol)?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-lo-cell]');
      if (button) {
        focusRow = Number(button.dataset.row);
        focusCol = Number(button.dataset.col);
        activate(focusRow, focusCol);
      }
    }
  });

  againBtn.addEventListener('click', () => {
    state = newGame();
    resultEl.hidden = true;
    focusRow = 0;
    focusCol = 0;
    render();
    buttons()[0]?.focus();
  });

  render();

  return {
    destroy() {
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      paused = true;
    },
    resume() {
      paused = false;
    },
    isPaused() {
      return paused;
    },
    restart() {
      againBtn.click();
    },
  };
}
