import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import {
  createHandoffScreen,
  getPlayerNames,
  passPlayMatchKey,
  playerName,
  savePassPlayMatchRecord,
  type HandoffScreenController,
} from '../shared/pass-play';
import type { GameController, PauseReason } from '../shared/types';
import { cellName, GOMOKU_SIZE, newGame, placeStone, stoneName, type GomokuState, type GomokuStone } from './engine';
import '../shared/pass-play-chrome.css';
import './styles.css';

const GAME_ID = 'gomoku';
const MATCH_KEY = passPlayMatchKey(GAME_ID);

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function mountGomoku(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="pp-game gom" style="--pp-accent:#f59e0b">
      <div class="pp-hud">
        <p class="pp-hud__status" role="status" aria-live="polite" data-gom-status></p>
        <p class="pp-hud__tally" data-gom-tally></p>
      </div>
      <div class="pp-stage" data-gom-stage>
        <div class="gom__board" role="grid" aria-label="Gomoku 15 by 15 board" data-gom-board></div>
        <div class="pp-result" data-gom-result hidden>
          <div class="pp-result__card">
            <p class="pp-result__kicker" data-gom-result-kicker></p>
            <h2 class="pp-result__title" data-gom-result-title></h2>
            <p class="pp-result__detail" data-gom-result-detail></p>
            <div class="pp-result__actions">
              <button type="button" class="btn" data-gom-again>Play again</button>
            </div>
          </div>
        </div>
      </div>
      <p class="gom__note">Free-style Gomoku on 15×15: five or more stones in a row wins. No overline restriction, no captures, no tournament opening rules — the variant is stated plainly. Pass the device between turns.</p>
    </div>
  `;

  const stage = root.querySelector<HTMLElement>('[data-gom-stage]')!;
  const boardEl = root.querySelector<HTMLElement>('[data-gom-board]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-gom-status]')!;
  const tallyEl = root.querySelector<HTMLElement>('[data-gom-tally]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-gom-result]')!;
  const resultKicker = root.querySelector<HTMLElement>('[data-gom-result-kicker]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-gom-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-gom-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-gom-again]')!;

  let paused = false;
  let state: GomokuState = newGame();
  let handoff: HandoffScreenController | null = null;
  let focusRow = 7;
  let focusCol = 7;

  const buttons = () => [...boardEl.querySelectorAll<HTMLButtonElement>('[data-gom-cell]')];

  const turnName = (stone: GomokuStone) => `${stoneName(stone)} · ${playerName(getPlayerNames(), stone)}`;

  const closeHandoff = () => {
    handoff?.close();
    handoff = null;
  };

  const showHandoff = (stone: GomokuStone) => {
    closeHandoff();
    if (paused) return;
    // Open-board game: keep the board visible; the screen simply identifies the
    // next player. No hidden information exists in free-style Gomoku.
    handoff = createHandoffScreen(stage, {
      playerTo: stone,
      context: `${GOMOKU_SIZE}×${GOMOKU_SIZE} · free-style five in a row`,
      keepVisible: true,
      onContinue: () => {
        handoff = null;
        buttons().find((button) => Number(button.dataset.row) === focusRow && Number(button.dataset.col) === focusCol)?.focus({ preventScroll: true });
      },
    });
  };

  const render = () => {
    boardEl.setAttribute('aria-rowcount', String(GOMOKU_SIZE));
    boardEl.setAttribute('aria-colcount', String(GOMOKU_SIZE));
    boardEl.innerHTML = '';
    for (let row = 0; row < GOMOKU_SIZE; row += 1) {
      for (let col = 0; col < GOMOKU_SIZE; col += 1) {
        const stone = state.board[row]![col]!;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.gomCell = '';
        button.dataset.row = String(row);
        button.dataset.col = String(col);
        button.className = 'gom__cell';
        button.setAttribute('role', 'gridcell');
        if (stone !== 0) {
          button.classList.add(stone === 1 ? 'is-black' : 'is-white');
          button.setAttribute('aria-label', `${cellName(row, col)}, ${stoneName(stone)} stone`);
        } else {
          button.setAttribute('aria-label', `${cellName(row, col)}, empty`);
        }
        button.tabIndex = row === focusRow && col === focusCol ? 0 : -1;
        boardEl.append(button);
      }
    }
    const names = getPlayerNames();
    tallyEl.textContent = `Black · ${names.p1} vs White · ${names.p2} — ${state.moves} stones placed`;
    if (state.status !== 'playing') {
      resultKicker.textContent = state.status === 'draw' ? 'Draw' : 'Game over';
      resultTitle.textContent = state.status === 'draw' ? 'The board filled with no five in a row.' : `${stoneName(state.winner!)} wins with five in a row.`;
      resultDetail.textContent = `${tallyEl.textContent} · Match result saved to this device.`;
      resultEl.hidden = false;
      againBtn.focus();
    } else {
      statusEl.textContent = `${turnName(state.turn)} — your turn.`;
    }
  };

  const saveRecord = (result: 'p1' | 'p2' | 'draw') => {
    savePassPlayMatchRecord(getBrowserStorage(), {
      gameId: GAME_ID,
      mode: '15×15 free-style',
      result,
      score: [0, 0],
      finishedAt: Date.now(),
    });
  };

  const restart = () => {
    state = newGame();
    resultEl.hidden = true;
    closeHandoff();
    render();
    showHandoff(state.turn);
    signalMeaningfulGameInteraction(root);
  };

  boardEl.addEventListener('click', (event) => {
    if (paused) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-gom-cell]');
    if (!button) return;
    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    if (state.board[row]![col] !== 0) return;
    unlockAudio();
    focusRow = row;
    focusCol = col;
    state = placeStone(state, row, col);
    void play('place');
    signalMeaningfulGameInteraction(root);
    if (state.status !== 'playing') {
      saveRecord(state.status === 'draw' ? 'draw' : state.winner === 1 ? 'p1' : 'p2');
      void play('win');
      render();
      return;
    }
    render();
    showHandoff(state.turn);
  });

  boardEl.addEventListener('keydown', (event) => {
    const step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
    if (step) {
      event.preventDefault();
      focusRow = Math.max(0, Math.min(GOMOKU_SIZE - 1, focusRow + step[0]));
      focusCol = Math.max(0, Math.min(GOMOKU_SIZE - 1, focusCol + step[1]));
      for (const button of buttons()) {
        button.tabIndex = Number(button.dataset.row) === focusRow && Number(button.dataset.col) === focusCol ? 0 : -1;
      }
      buttons().find((button) => Number(button.dataset.row) === focusRow && Number(button.dataset.col) === focusCol)?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-gom-cell]');
      if (button) button.click();
    }
  });

  againBtn.addEventListener('click', restart);

  render();
  showHandoff(state.turn);

  return {
    destroy() {
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
      restart();
    },
  };
}
