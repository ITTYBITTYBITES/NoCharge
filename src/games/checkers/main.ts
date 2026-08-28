import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import {
  createHandoffScreen,
  getPlayerNames,
  playerName,
  savePassPlayMatchRecord,
  type HandoffScreenController,
} from '../shared/pass-play';
import type { GameController, PauseReason } from '../shared/types';
import {
  captureTargets,
  cellName,
  hasAnyCapture,
  isKing,
  makeMove,
  newGame,
  simpleTargets,
  type CheckersCell,
  type CheckersPlayer,
  type CheckersState,
} from './engine';
import '../shared/pass-play-chrome.css';
import './styles.css';

const GAME_ID = 'checkers';

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function mountCheckers(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="pp-game ck" style="--pp-accent:#fbbf24">
      <div class="pp-hud">
        <p class="pp-hud__status" role="status" aria-live="polite" data-ck-status></p>
        <p class="pp-hud__tally" data-ck-tally></p>
      </div>
      <div class="pp-stage" data-ck-stage>
        <div class="ck__board" role="grid" aria-label="Checkers 8 by 8 board" data-ck-board></div>
        <div class="pp-result" data-ck-result hidden>
          <div class="pp-result__card">
            <p class="pp-result__kicker" data-ck-result-kicker></p>
            <h2 class="pp-result__title" data-ck-result-title></h2>
            <p class="pp-result__detail" data-ck-result-detail></p>
            <div class="pp-result__actions">
              <button type="button" class="btn" data-ck-again>Play again</button>
            </div>
          </div>
        </div>
      </div>
      <p class="ck__note">English draughts: men move one diagonal forward, kings move both ways, jumps are mandatory, multi-jumps continue the turn. Simple capture rule — any legal jump may be taken; NoCharge does not force the longest sequence. No flying kings.</p>
    </div>
  `;

  const stage = root.querySelector<HTMLElement>('[data-ck-stage]')!;
  const boardEl = root.querySelector<HTMLElement>('[data-ck-board]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-ck-status]')!;
  const tallyEl = root.querySelector<HTMLElement>('[data-ck-tally]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-ck-result]')!;
  const resultKicker = root.querySelector<HTMLElement>('[data-ck-result-kicker]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-ck-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-ck-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-ck-again]')!;

  let paused = false;
  let game: CheckersState = newGame();
  let handoff: HandoffScreenController | null = null;
  let selected: number | null = null;
  let legalTargets: number[] = [];

  const buttons = () => [...boardEl.querySelectorAll<HTMLButtonElement>('[data-ck-cell]')];

  const closeHandoff = () => {
    handoff?.close();
    handoff = null;
  };

  const showHandoff = (player: CheckersPlayer) => {
    closeHandoff();
    if (paused) return;
    handoff = createHandoffScreen(stage, {
      playerTo: player,
      context: 'English draughts · 8×8 · mandatory captures',
      keepVisible: true,
      onContinue: () => {
        handoff = null;
        buttons().find((button) => button.dataset.ckIndex === String(selected))?.focus({ preventScroll: true });
      },
    });
  };

  const playerLabel = (player: CheckersPlayer) =>
    `${player === 1 ? '● Dark' : '○ Light'} · ${playerName(getPlayerNames(), player)}`;

  const render = () => {
    const mustCapture = game.mustCapture || hasAnyCapture(game.board, game.turn);
    boardEl.setAttribute('aria-rowcount', '8');
    boardEl.setAttribute('aria-colcount', '8');
    boardEl.innerHTML = '';
    for (let index = 0; index < 64; index += 1) {
      const row = Math.floor(index / 8);
      const col = index % 8;
      const cell: CheckersCell = game.board[index]!;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.ckCell = '';
      button.dataset.ckIndex = String(index);
      button.className = 'ck__cell';
      const isDark = (row + col) % 2 === 1;
      button.classList.add(isDark ? 'is-dark' : 'is-light');
      if (cell !== null) {
        button.classList.add(isKing(cell) ? 'is-king' : 'is-man');
        button.classList.add(cell.endsWith('1') ? 'is-dark-piece' : 'is-light-piece');
        button.setAttribute('aria-label', `${cellName(index)}, ${isKing(cell) ? 'king' : 'man'}, ${cell.endsWith('1') ? 'dark' : 'light'}`);
      } else {
        button.setAttribute('aria-label', `${cellName(index)}, empty`);
      }
      if (selected === index) button.classList.add('is-selected');
      if (legalTargets.includes(index)) button.classList.add('is-legal');
      boardEl.append(button);
    }
    const names = getPlayerNames();
    const p1Pieces = game.board.filter((cell) => cell?.endsWith('1')).length;
    const p2Pieces = game.board.filter((cell) => cell?.endsWith('2')).length;
    tallyEl.textContent = `Dark · ${names.p1} (${p1Pieces}) vs Light · ${names.p2} (${p2Pieces})`;
    if (game.status === 'won') {
      resultKicker.textContent = 'Game over';
      resultTitle.textContent = `${playerLabel(game.winner!)} wins.`;
      resultDetail.textContent = `${tallyEl.textContent} · Match result saved to this device.`;
      resultEl.hidden = false;
      againBtn.focus();
    } else {
      statusEl.textContent = mustCapture
        ? `${playerLabel(game.turn)} — a jump is available; you must capture.`
        : `${playerLabel(game.turn)} — move one piece.`;
    }
  };

  const saveRecord = (winner: CheckersPlayer) => {
    savePassPlayMatchRecord(getBrowserStorage(), {
      gameId: GAME_ID,
      mode: 'English draughts · 8×8',
      result: winner === 1 ? 'p1' : 'p2',
      score: [0, 0],
      finishedAt: Date.now(),
    });
  };

  const restart = () => {
    game = newGame();
    selected = null;
    legalTargets = [];
    resultEl.hidden = true;
    closeHandoff();
    render();
    showHandoff(game.turn);
    signalMeaningfulGameInteraction(root);
  };

  const activate = (index: number) => {
    if (paused || game.status !== 'playing') return;
    unlockAudio();
    const piece = game.board[index];
    if (piece !== null && piece.endsWith(String(game.turn))) {
      selected = index;
      const mustCapture = game.mustCapture || hasAnyCapture(game.board, game.turn);
      legalTargets = mustCapture
        ? captureTargets(game.board, index).map((capture) => capture.to)
        : simpleTargets(game.board, index);
      void play('move');
      render();
      return;
    }
    if (selected !== null && legalTargets.includes(index)) {
      const mustCapture = game.mustCapture || hasAnyCapture(game.board, game.turn);
      const capture = mustCapture
        ? captureTargets(game.board, selected).find((item) => item.to === index)
        : undefined;
      const before = game;
      game = makeMove(game, selected, index, capture ? [capture.captured] : []);
      if (game === before) return;
      selected = null;
      legalTargets = [];
      void play('place');
      signalMeaningfulGameInteraction(root);
      if (game.status === 'won') {
        saveRecord(game.winner!);
        void play('win');
        render();
        return;
      }
      render();
      showHandoff(game.turn);
      return;
    }
    selected = null;
    legalTargets = [];
    render();
  };

  boardEl.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-ck-cell]');
    if (button) activate(Number(button.dataset.ckIndex));
  });

  boardEl.addEventListener('keydown', (event) => {
    const current = Number(((event.target as HTMLElement).closest<HTMLButtonElement>('[data-ck-cell]'))?.dataset.ckIndex);
    if (!Number.isInteger(current)) return;
    const step = { ArrowUp: -8, ArrowDown: 8, ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (typeof step === 'number') {
      event.preventDefault();
      const next = current + step;
      if (next >= 0 && next < 64) buttons().find((button) => Number(button.dataset.ckIndex) === next)?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(current);
    }
  });

  againBtn.addEventListener('click', restart);

  render();
  showHandoff(game.turn);

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
