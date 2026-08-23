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
  applyEdge,
  boxCounts,
  boxLabel,
  edgeLabel,
  emptyDotsState,
  hEdgeKey,
  isGameComplete,
  isEdgeTaken,
  leadingPlayer,
  parseEdgeKey,
  type DotsPlayer,
  type DotsState,
  vEdgeKey,
} from './engine';
import './styles.css';

const GAME_ID = 'dots-and-boxes';
const PLAYER_COLORS: Record<DotsPlayer, string> = { 1: 'var(--pp-accent)', 2: '#7dd3fc' };

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function mountDotsAndBoxes(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="pp-game dab" style="--pp-accent:#f472b6">
      <div class="pp-hud">
        <div class="pp-hud__modes" role="group" aria-label="Dots &amp; Boxes board size">
          <button type="button" class="pp-hud__mode" data-dab-mode="4" aria-pressed="true">4×4 · 16 boxes</button>
          <button type="button" class="pp-hud__mode" data-dab-mode="6" aria-pressed="false">6×6 · 36 boxes</button>
        </div>
        <p class="pp-hud__status" role="status" aria-live="polite" data-dab-status></p>
        <p class="dab__score" data-dab-score></p>
      </div>
      <div class="pp-stage">
        <div class="dab__scroll" data-dab-scroll>
          <div class="dab__board" role="group" aria-label="Dots and Boxes board" data-dab-board></div>
        </div>
        <div class="pp-result" data-dab-result hidden>
          <div class="pp-result__card">
            <p class="pp-result__kicker" data-dab-result-kicker></p>
            <h2 class="pp-result__title" data-dab-result-title></h2>
            <p class="pp-result__detail" data-dab-result-detail></p>
            <div class="pp-result__actions">
              <button type="button" class="btn" data-dab-again>Play again</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const boardEl = root.querySelector<HTMLElement>('[data-dab-board]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-dab-status]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-dab-score]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-dab-result]')!;
  const resultKicker = root.querySelector<HTMLElement>('[data-dab-result-kicker]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-dab-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-dab-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-dab-again]')!;
  const modeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-dab-mode]')];

  let paused = false;
  let boxes = 4;
  let state: DotsState = emptyDotsState();
  let turn: DotsPlayer = 1;
  let finished = false;
  let handoff: HandoffScreenController | null = null;

  const stage = () => root.querySelector<HTMLElement>('.pp-stage')!;
  const edgeButtons = () => [...boardEl.querySelectorAll<HTMLButtonElement>('[data-dab-edge]')];
  const boxCells = () => [...boardEl.querySelectorAll<HTMLElement>('[data-dab-box]')];

  const renderScore = () => {
    const [p1, p2] = boxCounts(state);
    const names = getPlayerNames();
    scoreEl.innerHTML = '';
    for (const player of [1, 2] as DotsPlayer[]) {
      const chip = document.createElement('span');
      chip.className = 'dab__score-chip';
      const dot = document.createElement('span');
      dot.className = 'dab__score-dot';
      dot.style.background = PLAYER_COLORS[player];
      dot.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = `${playerName(names, player)} ${player === 1 ? p1 : p2}`;
      chip.append(dot, label);
      if (turn === player && !finished) chip.classList.add('is-current');
      scoreEl.append(chip);
    }
  };

  const status = (text: string) => {
    statusEl.textContent = text;
  };

  const turnStatus = () => {
    status(`${playerName(getPlayerNames(), turn)} — draw one line.`);
  };

  const closeHandoff = () => {
    handoff?.close();
    handoff = null;
  };

  const showHandoff = (player: DotsPlayer) => {
    closeHandoff();
    if (paused) return;
    handoff = createHandoffScreen(stage(), {
      playerTo: player,
      context: 'Most boxes wins',
      onContinue: () => {
        handoff = null;
        const first = edgeButtons().find((button) => !button.disabled);
        first?.focus({ preventScroll: true });
      },
    });
  };

  const buildBoard = () => {
    boardEl.style.setProperty('--dab-units', String(boxes * 2 + 1));
    // A 6×6 board may need a short horizontal scroll on narrow phones; the
    // 4×4 board fits without scrolling down to 320 px.
    boardEl.style.setProperty('--dab-unit', boxes === 6 ? 'clamp(1.7rem, 7.5vw, 2.15rem)' : 'clamp(1.9rem, 9vw, 2.6rem)');
    boardEl.innerHTML = '';
    for (let row = 0; row < boxes * 2 + 1; row += 1) {
      for (let column = 0; column < boxes * 2 + 1; column += 1) {
        const evenRow = row % 2 === 0;
        const evenColumn = column % 2 === 0;
        if (evenRow && evenColumn) {
          const dot = document.createElement('span');
          dot.className = 'dab__dot';
          dot.setAttribute('aria-hidden', 'true');
          boardEl.appendChild(dot);
        } else if (evenRow !== evenColumn) {
          const key = evenRow ? hEdgeKey(row / 2, (column - 1) / 2) : vEdgeKey((row - 1) / 2, column / 2);
          const button = document.createElement('button');
          button.type = 'button';
          button.className = `dab__edge dab__edge--${evenRow ? 'h' : 'v'}`;
          button.dataset.dabEdge = key;
          button.setAttribute('aria-label', `${edgeLabel(key, boxes)}, not drawn`);
          button.addEventListener('click', () => {
            if (paused || finished) return;
            unlockAudio();
            onEdge(key);
          });
          boardEl.appendChild(button);
        } else {
          const box = document.createElement('span');
          box.className = 'dab__box';
          box.dataset.dabBox = `${(row - 1) / 2}:${(column - 1) / 2}`;
          boardEl.appendChild(box);
        }
      }
    }
  };

  const finishGame = () => {
    finished = true;
    const names = getPlayerNames();
    const [p1, p2] = boxCounts(state);
    const winner = leadingPlayer(state);
    const title = winner === null ? 'Draw' : `${playerName(names, winner)} wins`;
    const detail = `Final boxes ${p1}–${p2}. Most boxes wins.`;
    status(`${title}. ${detail}`);
    resultKicker.textContent = 'Game complete';
    resultTitle.textContent = title;
    resultDetail.textContent = detail;
    resultEl.hidden = false;
    savePassPlayMatchRecord(getBrowserStorage(), {
      gameId: GAME_ID,
      mode: `${boxes}×${boxes} boxes`,
      result: winner === null ? 'draw' : winner === 1 ? 'p1' : 'p2',
      score: [p1, p2],
      finishedAt: Date.now(),
    });
    void play('win');
    againBtn.focus({ preventScroll: true });
  };

  const onEdge = (key: string) => {
    if (finished || isEdgeTaken(state, key)) return;
    const applied = applyEdge(state, key, turn, boxes);
    if (!applied) return;

    signalMeaningfulGameInteraction(root);
    state = applied.state;
    const button = edgeButtons().find((candidate) => candidate.dataset.dabEdge === key);
    if (button) {
      button.disabled = true;
      button.classList.add('is-drawn', `is-drawn--p${turn}`);
      button.setAttribute('aria-label', `${edgeLabel(key, boxes)}, drawn by Player ${turn}`);
    }
    void play('place');

    const names = getPlayerNames();
    for (const boxKey of applied.completed) {
      const cell = boxCells().find((candidate) => candidate.dataset.dabBox === boxKey);
      if (cell) {
        const [row, column] = boxKey.split(':').map(Number);
        cell.classList.add('is-claimed', `is-claimed--p${turn}`);
        cell.setAttribute('aria-label', `${boxLabel(row, column)}, claimed by Player ${turn}`);
      }
    }
    if (applied.completed.length > 0) void play('claim');
    renderScore();

    if (isGameComplete(state, boxes)) {
      finishGame();
      return;
    }

    if (applied.completed.length > 0) {
      // Completing a box grants another move: the device stays put.
      status(
        `${playerName(names, turn)} claimed ${applied.completed.length === 1 ? 'a box' : `${applied.completed.length} boxes`} — draw again.`,
      );
      return;
    }

    turn = turn === 1 ? 2 : 1;
    renderScore();
    turnStatus();
    showHandoff(turn);
  };

  const reset = (size: number = boxes) => {
    boxes = size;
    state = emptyDotsState();
    turn = 1;
    finished = false;
    resultEl.hidden = true;
    closeHandoff();
    for (const button of modeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.dabMode === String(boxes)));
    }
    buildBoard();
    renderScore();
    turnStatus();
    showHandoff(1);
  };

  /** Grid position of an edge button, in dot units. */
  const edgePosition = (key: string): { x: number; y: number } | null => {
    const parsed = parseEdgeKey(key);
    if (!parsed) return null;
    return parsed.kind === 'h' ? { x: parsed.b + 0.5, y: parsed.a } : { x: parsed.b, y: parsed.a + 0.5 };
  };

  const moveFocus = (fromKey: string, dx: number, dy: number) => {
    const from = edgePosition(fromKey);
    if (!from) return;
    let best: { button: HTMLButtonElement; distance: number } | null = null;
    for (const button of edgeButtons()) {
      if (button.disabled) continue;
      const position = edgePosition(button.dataset.dabEdge ?? '');
      if (!position) continue;
      const deltaX = position.x - from.x;
      const deltaY = position.y - from.y;
      if (dx > 0 && deltaX <= 0) continue;
      if (dx < 0 && deltaX >= 0) continue;
      if (dy > 0 && deltaY <= 0) continue;
      if (dy < 0 && deltaY >= 0) continue;
      // Prefer continuing along the same line before jumping rows.
      const distance = Math.hypot(deltaX * 1.0, deltaY * 1.2);
      if (!best || distance < best.distance) best = { button, distance };
    }
    best?.button.focus({ preventScroll: true });
  };

  boardEl.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!(event.target instanceof HTMLElement)) return;
    const button = event.target.closest<HTMLElement>('[data-dab-edge]');
    if (!button?.dataset.dabEdge) return;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    if (paused || finished) return;
    moveFocus(button.dataset.dabEdge, move[0], move[1]);
  });

  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      if (paused) return;
      unlockAudio();
      reset(Number(button.dataset.dabMode));
    });
  }

  againBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    reset(boxes);
  });

  reset(4);

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
      reset(boxes);
    },
  };
}
