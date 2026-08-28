import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import type { GameController, PauseReason } from '../shared/types';
import {
  createHandoffScreen,
  getPlayerNames,
  playerName,
  savePassPlayMatchRecord,
  type HandoffScreenController,
} from '../shared/pass-play';
import '../shared/pass-play-chrome.css';
import {
  cellName,
  dropDisc,
  emptyBoard,
  findWinFrom,
  FOUR_IN_A_ROW_SIZES,
  isBoardFull,
  landingRow,
  openingPlayerForGame,
  otherFourPlayer,
  type FourBoard,
  type FourPlayer,
} from './engine';
import './styles.css';

const GAME_ID = 'four-in-a-row';

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function mountFourInARow(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="pp-game fir" style="--pp-accent:#a78bfa">
      <div class="pp-hud">
        <div class="pp-hud__modes" role="group" aria-label="Four in a Row board size">
          ${FOUR_IN_A_ROW_SIZES.map(
            (size, index) =>
              `<button type="button" class="pp-hud__mode" data-fir-size="${index}" aria-pressed="${index === 0}">${size.label}</button>`,
          ).join('')}
        </div>
        <p class="pp-hud__status" role="status" aria-live="polite" data-fir-status></p>
      </div>
      <div class="pp-stage">
        <div class="fir__controls" role="group" aria-label="Drop a disc into a column" data-fir-controls></div>
        <div class="fir__board" role="group" aria-label="Four in a Row board" data-fir-board></div>
        <div class="pp-result" data-fir-result hidden>
          <div class="pp-result__card">
            <p class="pp-result__kicker" data-fir-result-kicker></p>
            <h2 class="pp-result__title" data-fir-result-title></h2>
            <p class="pp-result__detail" data-fir-result-detail></p>
            <div class="pp-result__actions">
              <button type="button" class="btn" data-fir-again>Play again</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const controlsEl = root.querySelector<HTMLElement>('[data-fir-controls]')!;
  const boardEl = root.querySelector<HTMLElement>('[data-fir-board]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-fir-status]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-fir-result]')!;
  const resultKicker = root.querySelector<HTMLElement>('[data-fir-result-kicker]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-fir-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-fir-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-fir-again]')!;
  const sizeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-fir-size]')];
  const stage = () => root.querySelector<HTMLElement>('.pp-stage')!;

  let paused = false;
  let sizeIndex = 0;
  let board: FourBoard = emptyBoard(FOUR_IN_A_ROW_SIZES[0]!.cols, FOUR_IN_A_ROW_SIZES[0]!.rows);
  let turn: FourPlayer = 1;
  let game = 1;
  let finished = false;
  let handoff: HandoffScreenController | null = null;
  let dropAnimated = false;
  const animationTimers = new Set<number>();

  const size = () => FOUR_IN_A_ROW_SIZES[sizeIndex]!;
  const modeLabel = () => size().label;

  const status = (text: string) => {
    statusEl.textContent = text;
  };

  const turnStatus = () => {
    status(`${playerName(getPlayerNames(), turn)} — choose a column.`);
  };

  const closeHandoff = () => {
    handoff?.close();
    handoff = null;
  };

  const showHandoff = (player: FourPlayer) => {
    closeHandoff();
    if (paused) return;
    handoff = createHandoffScreen(stage(), {
      playerTo: player,
      context: 'First to four in a row wins',
      onContinue: () => {
        handoff = null;
        const first = [...controlsEl.querySelectorAll<HTMLButtonElement>('[data-fir-column]')].find(
          (button) => !button.disabled,
        );
        first?.focus({ preventScroll: true });
      },
    });
  };

  const discClass = (player: FourPlayer) => `fir__disc fir__disc--p${player}`;

  const build = () => {
    const { cols, rows } = size();
    board = emptyBoard(cols, rows);
    finished = false;
    resultEl.hidden = true;
    boardEl.style.setProperty('--fir-cols', String(cols));
    boardEl.innerHTML = '';
    for (let index = 0; index < cols * rows; index += 1) {
      const cell = document.createElement('span');
      cell.className = 'fir__cell';
      cell.dataset.firCell = String(index);
      boardEl.appendChild(cell);
    }
    controlsEl.innerHTML = '';
    for (let col = 0; col < cols; col += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fir__column';
      button.dataset.firColumn = String(col);
      button.textContent = `Column ${col + 1}`;
      button.addEventListener('click', () => {
        if (paused || finished) return;
        unlockAudio();
        onColumn(col);
      });
      controlsEl.appendChild(button);
    }
  };

  const finishGame = (winner: FourPlayer | null) => {
    finished = true;
    const names = getPlayerNames();
    const title = winner === null ? 'Draw' : `${playerName(names, winner)} wins`;
    const detail =
      winner === null ? 'The board filled with no four in a row.' : 'Four in a row — horizontal, vertical, or diagonal.';
    status(`${title}. ${detail}`);
    resultKicker.textContent = 'Game complete';
    resultTitle.textContent = title;
    resultDetail.textContent = detail;
    resultEl.hidden = false;
    savePassPlayMatchRecord(getBrowserStorage(), {
      gameId: GAME_ID,
      mode: modeLabel(),
      result: winner === null ? 'draw' : winner === 1 ? 'p1' : 'p2',
      score: winner === null ? [0, 0] : winner === 1 ? [1, 0] : [0, 1],
      finishedAt: Date.now(),
    });
    void play('win');
    againBtn.focus({ preventScroll: true });
  };

  const onColumn = (col: number) => {
    if (finished) return;
    const dropped = dropDisc(board, col, turn);
    if (!dropped) return;

    signalMeaningfulGameInteraction(root);
    board = dropped.board;
    const cell = boardEl.querySelector<HTMLElement>(`[data-fir-cell="${dropped.row * board.cols + col}"]`)!;
    const disc = document.createElement('span');
    disc.className = discClass(turn);
    disc.setAttribute('aria-hidden', 'true');
    if (dropAnimated) {
      // Animate the fall once, then keep the resting disc for everyone.
      const animated = disc.cloneNode(true) as HTMLElement;
      animated.classList.add('is-falling');
      animated.style.setProperty('--fir-fall-from', `-${(dropped.row + 1) * 4.4}rem`);
      cell.append(animated);
      const timer = window.setTimeout(() => {
        animationTimers.delete(timer);
        animated.replaceWith(disc);
      }, 260);
      animationTimers.add(timer);
    } else {
      cell.append(disc);
    }
    cell.setAttribute('aria-label', `${cellName(dropped.row, col)}, Player ${turn}`);
    void play('place');

    // Full columns close as soon as their top cell fills.
    if (landingRow(board, col) === null) {
      const button = controlsEl.querySelector<HTMLButtonElement>(`[data-fir-column="${col}"]`);
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-label', `Column ${col + 1}, full`);
      }
    }

    const win = findWinFrom(board, dropped.row, col);
    if (win) {
      for (const index of win.cells) {
        boardEl.querySelector(`[data-fir-cell="${index}"]`)?.classList.add('is-winning');
      }
      finishGame(win.player);
      return;
    }

    if (isBoardFull(board)) {
      finishGame(null);
      return;
    }

    turn = otherFourPlayer(turn);
    turnStatus();
    showHandoff(turn);
  };

  const startGame = (nextGame: number) => {
    game = nextGame;
    // The opening player alternates each game.
    turn = openingPlayerForGame(game);
    build();
    turnStatus();
    showHandoff(turn);
  };

  const reset = (nextSizeIndex: number = sizeIndex, restartMatch = true) => {
    sizeIndex = nextSizeIndex;
    for (const button of sizeButtons) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.firSize) === sizeIndex));
    }
    closeHandoff();
    startGame(restartMatch ? 1 : game);
  };

  controlsEl.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!(event.target instanceof HTMLElement)) return;
    const button = event.target.closest<HTMLElement>('[data-fir-column]');
    if (!button) return;
    const col = Number(button.dataset.firColumn);
    const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    if (paused || finished) return;
    let next = col + delta;
    while (next >= 0 && next < board.cols) {
      const candidate = controlsEl.querySelector<HTMLButtonElement>(`[data-fir-column="${next}"]`);
      if (candidate && !candidate.disabled) {
        candidate.focus({ preventScroll: true });
        return;
      }
      next += delta;
    }
  });

  for (const button of sizeButtons) {
    button.addEventListener('click', () => {
      if (paused) return;
      unlockAudio();
      reset(Number(button.dataset.firSize));
    });
  }

  againBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    startGame(game + 1);
  });

  // Reduced-motion players get the resting disc immediately.
  dropAnimated = window.matchMedia('(prefers-reduced-motion: reduce)').matches !== true;
  reset(0);

  return {
    destroy() {
      animationTimers.forEach((timer) => window.clearTimeout(timer));
      animationTimers.clear();
      closeHandoff();
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
      reset(sizeIndex);
    },
  };
}
