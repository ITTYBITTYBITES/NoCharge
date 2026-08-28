import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import { ActiveTimeTracker } from '../shared/active-time';
import { loadPref, savePref } from '../shared/storage';
import type { GameController, PauseReason } from '../shared/types';
import {
  cellLabel,
  chord,
  DIFFICULTIES,
  newGame,
  revealCell,
  revealAllMines,
  toggleFlag,
  type Board,
  type Difficulty,
  type GameState,
} from './engine';
import './styles.css';

const GAME_ID = 'minesweeper';
const GAMES_WON_KEY = `nocharge:${GAME_ID}:games-won`;
const BEST_TIME_KEY = `nocharge:${GAME_ID}:best-time`;
const SIZE_KEY = 'minesweeper-last-size';

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function loadNumber(key: string): number {
  const raw = getBrowserStorage()?.getItem(key);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function saveNumber(key: string, value: number): void {
  try {
    getBrowserStorage()?.setItem(key, String(value));
  } catch {
    /* storage unavailable */
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

/**
 * The game is untimed by design. `elapsedSeconds` is a recorded personal
 * metric shown only after a win; it is never a countdown.
 */
export function mountMinesweeper(root: HTMLElement): GameController {
  const sizePref = loadPref<Difficulty['id']>(SIZE_KEY, 'beginner');
  const initialDifficulty = DIFFICULTIES.find((difficulty) => difficulty.id === sizePref) ?? DIFFICULTIES[0]!;

  root.innerHTML = `
    <div class="ms" data-ms-root style="--ms-accent:#38bdf8">
      <div class="ms-hud">
        <div class="ms-hud__modes" role="group" aria-label="Minesweeper difficulty">
          ${DIFFICULTIES.map(
            (difficulty) =>
              `<button type="button" class="ms-hud__mode" data-ms-difficulty="${difficulty.id}" aria-pressed="false">${difficulty.label}</button>`,
          ).join('')}
        </div>
        <div class="ms-hud__row">
          <button type="button" class="btn btn--ghost btn--sm" data-ms-flag-mode aria-pressed="false">Flag mode: off</button>
          <p class="ms-hud__status" role="status" aria-live="polite" data-ms-status>Flags 0 / 0 · Mines unknown</p>
          <p class="ms-hud__metric" data-ms-metric aria-label="Recorded metrics"></p>
        </div>
      </div>
      <div class="ms-stage">
        <div class="ms-board" role="grid" aria-label="Minesweeper board" data-ms-board></div>
        <div class="ms-result" data-ms-result hidden>
          <div class="ms-result__card">
            <p class="ms-result__kicker" data-ms-result-kicker></p>
            <h2 class="ms-result__title" data-ms-result-title></h2>
            <p class="ms-result__detail" data-ms-result-detail></p>
            <div class="ms-result__actions">
              <button type="button" class="btn" data-ms-again>Play again</button>
            </div>
          </div>
        </div>
      </div>
      <p class="ms-note">Reveal every safe cell. <strong>Flag</strong> marks a mine; <strong>Chord</strong> (double-click / Enter on a numbered cell with correct flags) reveals its neighbours. First click is always safe. There is no timer — time is recorded only after a win.</p>
    </div>
  `;

  const boardEl = root.querySelector<HTMLElement>('[data-ms-board]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-ms-status]')!;
  const metricEl = root.querySelector<HTMLElement>('[data-ms-metric]')!;
  const flagModeBtn = root.querySelector<HTMLButtonElement>('[data-ms-flag-mode]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-ms-result]')!;
  const resultKicker = root.querySelector<HTMLElement>('[data-ms-result-kicker]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-ms-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-ms-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-ms-again]')!;
  const difficultyButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ms-difficulty]')];

  let paused = false;
  let difficulty: Difficulty = initialDifficulty;
  let state: GameState = newGame(difficulty);
  let flagMode = false;
  const activeTime = new ActiveTimeTracker();
  let elapsedSeconds = 0;
  let timer: number | null = null;
  let focusRow = 0;
  let focusCol = 0;
  let gamesWon = loadNumber(GAMES_WON_KEY);
  let bestTime = loadNumber(BEST_TIME_KEY);
  let lastResult: 'won' | 'lost' | null = null;

  const cells = () => [...boardEl.querySelectorAll<HTMLButtonElement>('[data-ms-cell]')];

  const stopTimer = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    activeTime.start();
    timer = window.setInterval(() => {
      if (paused || state.status !== 'playing') return;
      elapsedSeconds = Math.floor(activeTime.elapsedMs() / 1000);
    }, 1000);
  };

  const pauseTimer = () => {
    activeTime.pause();
    elapsedSeconds = Math.floor(activeTime.elapsedMs() / 1000);
    stopTimer();
  };

  const resetTimer = () => {
    stopTimer();
    activeTime.reset();
    elapsedSeconds = 0;
  };

  const metricSummary = () => {
    const size = `${difficulty.rows}×${difficulty.cols}`;
    const best = bestTime > 0 ? ` · best ${formatDuration(bestTime)}` : '';
    return `${size} · won ${gamesWon}${best}`;
  };

  const readMetric = () => {
    metricEl.textContent = metricSummary();
  };

  const renderModes = () => {
    for (const button of difficultyButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.msDifficulty === difficulty.id));
    }
  };

  const renderFlagMode = () => {
    flagModeBtn.setAttribute('aria-pressed', String(flagMode));
    flagModeBtn.textContent = flagMode ? 'Flag mode: on' : 'Flag mode: off';
  };

  const cellAriaLabel = (row: number, col: number): string => {
    const cell = state.board[row]![col]!;
    const name = cellLabel(row, col);
    if (cell.revealed) {
      if (cell.mine) return `${name}, mine`;
      return cell.adjacent > 0 ? `${name}, revealed, ${cell.adjacent} adjacent mines` : `${name}, revealed, empty`;
    }
    return `${name}, ${cell.flagged ? 'flagged' : 'hidden'}`;
  };

  const render = () => {
    const displayBoard: Board = state.status === 'lost' ? revealAllMines(state) : state.board;
    boardEl.setAttribute('aria-rowcount', String(difficulty.rows));
    boardEl.setAttribute('aria-colcount', String(difficulty.cols));
    boardEl.innerHTML = '';
    for (let row = 0; row < difficulty.rows; row += 1) {
      for (let col = 0; col < difficulty.cols; col += 1) {
        const cell = displayBoard[row]![col]!;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ms-cell';
        button.dataset.msCell = '';
        button.dataset.row = String(row);
        button.dataset.col = String(col);
        button.setAttribute('role', 'gridcell');
        button.setAttribute('aria-label', cellAriaLabel(row, col));
        if (row === focusRow && col === focusCol) button.tabIndex = 0;
        else button.tabIndex = -1;
        const classes = ['ms-cell'];
        if (cell.revealed) classes.push('is-revealed');
        if (cell.flagged) classes.push('is-flagged');
        if (cell.mine && cell.revealed) classes.push('is-mine');
        if (lastResult === 'lost' && cell.mine && cell.revealed) classes.push('is-exploded');
        button.className = classes.join(' ');
        if (cell.revealed && !cell.mine) button.textContent = cell.adjacent > 0 ? String(cell.adjacent) : '';
        if (cell.flagged) button.textContent = '⚑';
        boardEl.append(button);
      }
    }
    const minesTotal = difficulty.mines;
    statusEl.textContent = `Flags ${state.flaggedCount} / ${minesTotal} · ${state.status === 'won' ? 'Cleared' : state.status === 'lost' ? 'Hit a mine' : state.status === 'idle' ? 'First click reveals the board' : 'Clearing…'}`;
    readMetric();
  };

  const updateFocused = () => {
    for (const button of cells()) {
      const row = Number(button.dataset.row);
      const col = Number(button.dataset.col);
      button.tabIndex = row === focusRow && col === focusCol ? 0 : -1;
    }
  };

  const finish = (status: 'won' | 'lost') => {
    pauseTimer();
    lastResult = status;
    if (status === 'won') {
      gamesWon += 1;
      saveNumber(GAMES_WON_KEY, gamesWon);
      if (elapsedSeconds > 0 && (bestTime === 0 || elapsedSeconds < bestTime)) {
        bestTime = elapsedSeconds;
        saveNumber(BEST_TIME_KEY, bestTime);
      }
      void play('win');
      resultKicker.textContent = 'Board cleared';
      resultTitle.textContent = 'Every safe cell revealed.';
      resultDetail.textContent = metricSummary();
    } else {
      void play('lose');
      resultKicker.textContent = 'That cell was a mine';
      resultTitle.textContent = 'Board swept.';
      resultDetail.textContent = `Mines are revealed. New boards are untimed — take as long as you like.`;
    }
    render();
    resultEl.hidden = false;
    againBtn.focus();
  };

  const activate = (row: number, col: number) => {
    unlockAudio();
    if (paused || state.status === 'won' || state.status === 'lost') return;
    if (flagMode || state.board[row]![col]!.flagged) {
      state = toggleFlag(state, row, col);
      void play('place');
      render();
      return;
    }
    if (state.board[row]![col]!.revealed) {
      const before = state.revealedCount;
      state = chord(state, row, col);
      void play('move');
      if (state.status === 'lost') finish('lost');
      else if (state.status === 'won') {
        // Chord counts as the finishing action; measure from the first reveal.
        finish('won');
      } else if (state.revealedCount > before) {
        render();
      }
      return;
    }
    if (state.status === 'idle' || state.status === 'playing') {
      if (state.status === 'idle') startTimer();
      state = revealCell(state, row, col);
      if (state.status === 'playing') void play('flip');
      render();
      signalMeaningfulGameInteraction(root);
      if (state.status === 'lost') finish('lost');
      else if (state.status === 'won') finish('won');
    }
  };

  const moveFocus = (row: number, col: number) => {
    focusRow = Math.max(0, Math.min(difficulty.rows - 1, row));
    focusCol = Math.max(0, Math.min(difficulty.cols - 1, col));
    updateFocused();
    cells().find((button) => Number(button.dataset.row) === focusRow && Number(button.dataset.col) === focusCol)?.focus();
  };

  boardEl.addEventListener('click', (event) => {
    if (paused) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-ms-cell]');
    if (!button) return;
    focusRow = Number(button.dataset.row);
    focusCol = Number(button.dataset.col);
    activate(focusRow, focusCol);
  });

  boardEl.addEventListener('dblclick', (event) => {
    if (paused || flagMode) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-ms-cell]');
    if (!button) return;
    focusRow = Number(button.dataset.row);
    focusCol = Number(button.dataset.col);
    if (state.board[focusRow]![focusCol]!.revealed) activate(focusRow, focusCol);
  });

  boardEl.addEventListener('keydown', (event) => {
    const step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
    if (step) {
      event.preventDefault();
      moveFocus(focusRow + step[0], focusCol + step[1]);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-ms-cell]');
      if (button) {
        event.preventDefault();
        focusRow = Number(button.dataset.row);
        focusCol = Number(button.dataset.col);
        activate(focusRow, focusCol);
      }
    }
    if (!paused && (event.key.toLowerCase() === 'f' || event.key.toLowerCase() === 'm')) {
      event.preventDefault();
      flagMode = false;
      state = toggleFlag(state, focusRow, focusCol);
      void play('place');
      render();
    }
  });

  flagModeBtn.addEventListener('click', () => {
    if (paused) return;
    flagMode = !flagMode;
    renderFlagMode();
  });

  againBtn.addEventListener('click', () => {
    if (paused) return;
    state = newGame(difficulty);
    lastResult = null;
    resetTimer();
    resultEl.hidden = true;
    focusRow = 0;
    focusCol = 0;
    render();
    cells()[0]?.focus();
  });

  for (const button of difficultyButtons) {
    button.addEventListener('click', () => {
      if (paused) return;
      const next = DIFFICULTIES.find((candidate) => candidate.id === button.dataset.msDifficulty) ?? DIFFICULTIES[0]!;
      difficulty = next;
      savePref(SIZE_KEY, next.id);
      state = newGame(difficulty);
      lastResult = null;
      resetTimer();
      resultEl.hidden = true;
      focusRow = 0;
      focusCol = 0;
      renderModes();
      render();
      cells()[0]?.focus();
    });
  }

  renderModes();
  renderFlagMode();
  render();

  return {
    destroy() {
      resetTimer();
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      if (paused) return;
      paused = true;
      if (state.status === 'playing') pauseTimer();
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (state.status === 'playing') startTimer();
    },
    isPaused() {
      return paused;
    },
    restart() {
      againBtn.click();
    },
  };
}
