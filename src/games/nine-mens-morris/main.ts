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
import {
  hasAnyMove,
  legalTargets,
  moveStone,
  newGame,
  otherPlayer,
  placeStone,
  pointName,
  removeStone,
  select,
  type MorrisGame,
  type MorrisPlayer,
} from './engine';
import '../shared/pass-play-chrome.css';
import './styles.css';

const GAME_ID = 'nine-mens-morris';
const MATCH_KEY = passPlayMatchKey(GAME_ID);

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function mountNineMensMorris(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="pp-game nmm" style="--pp-accent:#f87171">
      <div class="pp-hud">
        <p class="pp-hud__status" role="status" aria-live="polite" data-nmm-status></p>
        <p class="pp-hud__tally" data-nmm-tally></p>
      </div>
      <div class="pp-stage" data-nmm-stage>
        <div class="nmm__board" role="grid" aria-label="Nine Men's Morris board" data-nmm-board>
          <svg class="nmm__lines" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="0.4" fill="none" stroke="#4a5852" stroke-width="0.45"/>
            <rect x="6" y="6" width="12" height="12" rx="0.2" fill="none" stroke="#4a5852" stroke-width="0.45"/>
            <rect x="9" y="9" width="6" height="6" rx="0.1" fill="none" stroke="#4a5852" stroke-width="0.45"/>
            <path d="M 3 3 L 6 6 M 21 3 L 18 6 M 21 21 L 18 18 M 3 21 L 6 18 M 6 6 L 9 9 M 18 6 L 15 9 M 18 18 L 15 15 M 6 18 L 9 15" fill="none" stroke="#4a5852" stroke-width="0.45"/>
          </svg>
        </div>
        <div class="pp-result" data-nmm-result hidden>
          <div class="pp-result__card">
            <p class="pp-result__kicker" data-nmm-result-kicker></p>
            <h2 class="pp-result__title" data-nmm-result-title></h2>
            <p class="pp-result__detail" data-nmm-result-detail></p>
            <div class="pp-result__actions">
              <button type="button" class="btn" data-nmm-again>Play again</button>
            </div>
          </div>
        </div>
      </div>
      <p class="nmm__note">Three in a line is a mill — remove one opponent stone. A stone in a mill may be removed only when nothing else is available. Three stones left? Flying: move anywhere. A player with no legal move loses. This variant is stated in the guide.</p>
    </div>
  `;

  const stage = root.querySelector<HTMLElement>('[data-nmm-stage]')!;
  const boardEl = root.querySelector<HTMLElement>('[data-nmm-board]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-nmm-status]')!;
  const tallyEl = root.querySelector<HTMLElement>('[data-nmm-tally]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-nmm-result]')!;
  const resultKicker = root.querySelector<HTMLElement>('[data-nmm-result-kicker]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-nmm-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-nmm-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-nmm-again]')!;

  let paused = false;
  let game: MorrisGame = newGame();
  let handoff: HandoffScreenController | null = null;

  // Board geometry: 3 concentric squares (8 points each) with a middle ring.
  const geometry = (() => {
    const cells: { x: number; y: number }[] = [];
    // Outer ring points 0..7 top-left to top-right, clockwise.
    const outer = [0, 1, 2, 3, 4, 5, 6, 7];
    const middle = [8, 9, 10, 11, 12, 13, 14, 15];
    const inner = [16, 17, 18, 19, 20, 21, 22, 23];
    const points: Record<number, { x: number; y: number }> = {};
    const square = (ring: number[], offset: number, isMiddle: boolean) => {
      const corners = [
        [offset + 3, offset + 3],
        [21 - offset, offset + 3],
        [21 - offset, 21 - offset],
        [offset + 3, 21 - offset],
      ];
      ring.forEach((point, index) => {
        const position = index < 2 ? [offset + 3 + (index === 1 ? 9 : 0), offset + 3] : undefined;
        // Simple layout: corners and edge midpoints for outer/inner; middle ring offsets.
        points[point] = isMiddle
          ? { x: offset + 3, y: offset + 3 }
          : { x: corners[index % 4]![0], y: corners[index % 4]![1] };
        void position;
      });
    };
    // Use explicit positions for clarity.
    const pos = (x: number, y: number) => ({ x, y });
    points[0] = pos(3, 3); points[1] = pos(12, 3); points[2] = pos(21, 3);
    points[3] = pos(21, 12); points[4] = pos(21, 21); points[5] = pos(12, 21); points[6] = pos(3, 21); points[7] = pos(3, 12);
    points[8] = pos(6, 6); points[9] = pos(12, 6); points[10] = pos(18, 6);
    points[11] = pos(18, 12); points[12] = pos(18, 18); points[13] = pos(12, 18); points[14] = pos(6, 18); points[15] = pos(6, 12);
    points[16] = pos(9, 9); points[17] = pos(12, 9); points[18] = pos(15, 9);
    points[19] = pos(15, 12); points[20] = pos(15, 15); points[21] = pos(12, 15); points[22] = pos(9, 15); points[23] = pos(9, 12);
    cells.push(...Object.values(points));
    return { cells, points };
  })();

  const buttons = () => [...boardEl.querySelectorAll<HTMLButtonElement>('[data-nmm-point]')];

  const playerLabel = (player: MorrisPlayer) => `${player === 1 ? '● Black' : '○ White'} · ${playerName(getPlayerNames(), player)}`;

  const closeHandoff = () => {
    handoff?.close();
    handoff = null;
  };

  const showHandoff = (player: MorrisPlayer) => {
    closeHandoff();
    if (paused) return;
    handoff = createHandoffScreen(stage, {
      playerTo: player,
      context: game.phase === 'placing' ? 'Mill board · placing stones' : game.phase === 'flying' ? 'Mill board · flying phase' : 'Mill board · moving phase',
      keepVisible: true,
      onContinue: () => {
        handoff = null;
        buttons().find((button) => button.dataset.nmmPoint === String(game.selected))?.focus({ preventScroll: true });
      },
    });
  };

  const render = () => {
    boardEl.innerHTML = '';
    for (let index = 0; index < 24; index += 1) {
      const point = geometry.points[index]!;
      const stone = game.board[index];
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.nmmPoint = String(index);
      button.className = 'nmm__point';
      button.style.left = `${(point.x / 24) * 100}%`;
      button.style.top = `${(point.y / 24) * 100}%`;
      if (stone !== 0) button.classList.add(stone === 1 ? 'is-black' : 'is-white');
      if (game.selected === index) button.classList.add('is-selected');
      if (game.legal.includes(index)) button.classList.add('is-legal');
      button.setAttribute('aria-label', pointName(index));
      if (stone !== 0) button.setAttribute('aria-label', `${pointName(index)}, ${stone === 1 ? 'black stone' : 'white stone'}`);
      boardEl.append(button);
    }
    const names = getPlayerNames();
    tallyEl.textContent = `Black · ${names.p1} (${game.hand[0]} in hand) vs White · ${names.p2} (${game.hand[1]} in hand)`;
    if (game.winner) {
      resultKicker.textContent = 'Mill complete';
      resultTitle.textContent = `${playerLabel(game.winner)} wins.`;
      resultDetail.textContent = game.phase === 'won' ? (game.removalPending ? 'Match result saved to this device.' : 'Match result saved to this device.') : 'Match result saved to this device.';
      resultEl.hidden = false;
      againBtn.focus();
    } else if (game.removalPending) {
      statusEl.textContent = `${playerLabel(game.turn)} formed a mill — remove one ${otherPlayer(game.turn) === 1 ? 'black' : 'white'} stone.`;
    } else if (game.phase === 'placing') {
      statusEl.textContent = `${playerLabel(game.turn)} — place a stone on an empty point.`;
    } else if (game.selected !== null) {
      statusEl.textContent = `${playerLabel(game.turn)} — choose a legal destination${game.phase === 'flying' ? ' (flying: anywhere)' : ''}.`;
    } else {
      statusEl.textContent = `${playerLabel(game.turn)} — select one of your stones.`;
    }
  };

  const saveRecord = (winner: MorrisPlayer | null) => {
    savePassPlayMatchRecord(getBrowserStorage(), {
      gameId: GAME_ID,
      mode: 'standard 24-point mills',
      result: winner === null ? 'draw' : winner === 1 ? 'p1' : 'p2',
      score: [0, 0],
      finishedAt: Date.now(),
    });
  };

  const restart = () => {
    game = newGame();
    resultEl.hidden = true;
    closeHandoff();
    render();
    showHandoff(game.turn);
  };

  const activate = (index: number) => {
    if (paused || game.winner) return;
    unlockAudio();
    if (game.removalPending) {
      const before = game;
      game = removeStone(game, index);
      if (game === before) {
        statusEl.textContent = 'That stone is protected while another is available — choose a different opponent stone.';
        return;
      }
      void play('claim');
      signalMeaningfulGameInteraction(root);
      if (game.winner) {
        saveRecord(game.winner);
        void play('win');
        render();
        return;
      }
      render();
      showHandoff(game.turn);
      return;
    }
    if (game.phase === 'placing') {
      const before = game;
      game = placeStone(game, index);
      if (game === before) return;
      void play('place');
      signalMeaningfulGameInteraction(root);
      if (game.removalPending) {
        render();
        return;
      }
      render();
      showHandoff(game.turn);
      return;
    }
    if (game.phase === 'moving' || game.phase === 'flying') {
      if (game.board[index] === game.turn) {
        game = select(game, index);
        void play('move');
        signalMeaningfulGameInteraction(root);
        render();
        return;
      }
      if (game.selected !== null && game.legal.includes(index)) {
        const before = game;
        game = moveStone(game, game.selected, index);
        if (game === before) return;
        void play('place');
        if (game.removalPending) {
          render();
          return;
        }
        if (game.winner) {
          saveRecord(game.winner);
          void play('win');
          render();
          return;
        }
        render();
        showHandoff(game.turn);
        return;
      }
      if (game.selected !== null) {
        game = { ...game, selected: null, legal: [] };
        render();
      }
    }
  };

  boardEl.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-nmm-point]');
    if (button) activate(Number(button.dataset.nmmPoint));
  });

  boardEl.addEventListener('keydown', (event) => {
    const index = Number(((event.target as HTMLElement).closest<HTMLButtonElement>('[data-nmm-point]'))?.dataset.nmmPoint);
    if (!Number.isInteger(index)) return;
    const step = { ArrowUp: [0, -3], ArrowDown: [0, 3], ArrowLeft: [-3, 0], ArrowRight: [3, 0], Enter: [0, 0], ' ': [0, 0] }[event.key];
    if (!step) return;
    event.preventDefault();
    const [dx, dy] = step;
    const current = geometry.points[index]!;
    if (dx === 0 && dy === 0) {
      activate(index);
      return;
    }
    const target = index + (dx !== 0 ? dx : 0) + (dy !== 0 ? dy : 0);
    if (target >= 0 && target < 24) {
      buttons().find((button) => Number(button.dataset.nmmPoint) === target)?.focus();
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
