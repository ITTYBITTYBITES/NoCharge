import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import type { GameController, PauseReason } from '../shared/types';
import {
  createHandoffScreen,
  formatMatchScore,
  formatMatchTally,
  getPlayerNames,
  playerName,
  savePassPlayMatchRecord,
  type HandoffScreenController,
} from '../shared/pass-play';
import '../shared/pass-play-chrome.css';
import {
  cellName,
  findWinner,
  isBoardFull,
  isMatchOver,
  MATCH_MAX_ROUNDS,
  MATCH_TARGET,
  matchWinner,
  nextMark,
  openingMarkForRound,
  placeMark,
  type TicTacToeBoard,
  type TicTacToeMark,
} from './engine';
import './styles.css';

const GAME_ID = 'tic-tac-toe';

type Mode = '3x3' | '4x4' | 'match';

const MODES: { id: Mode; label: string }[] = [
  { id: '3x3', label: '3×3 · 3 in a row' },
  { id: '4x4', label: '4×4 · 4 in a row' },
  { id: 'match', label: `Match · first to ${MATCH_TARGET}` },
];

function boardSize(mode: Mode): 3 | 4 {
  return mode === '4x4' ? 4 : 3;
}

function modeLabel(mode: Mode): string {
  return MODES.find((candidate) => candidate.id === mode)?.label ?? '3×3 · 3 in a row';
}

/** Player-facing mark naming: X is Player 1, O is Player 2. */
function markPlayerName(mark: TicTacToeMark): string {
  return `${mark} · ${playerName(getPlayerNames(), mark === 'X' ? 1 : 2)}`;
}

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function mountTicTacToe(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="pp-game ttt" style="--pp-accent:#60a5fa">
      <div class="pp-hud">
        <div class="pp-hud__modes" role="group" aria-label="Tic-Tac-Toe mode">
          ${MODES.map(
            (mode) =>
              `<button type="button" class="pp-hud__mode" data-ttt-mode="${mode.id}" aria-pressed="false">${mode.label}</button>`,
          ).join('')}
        </div>
        <p class="pp-hud__status" role="status" aria-live="polite" data-ttt-status></p>
        <p class="pp-hud__tally" data-ttt-tally hidden></p>
      </div>
      <div class="pp-stage" data-ttt-stage>
        <div class="ttt__board" role="group" aria-label="Tic-Tac-Toe board" data-ttt-board></div>
        <div class="pp-result" data-ttt-result hidden>
          <div class="pp-result__card">
            <p class="pp-result__kicker" data-ttt-result-kicker></p>
            <h2 class="pp-result__title" data-ttt-result-title></h2>
            <p class="pp-result__detail" data-ttt-result-detail></p>
            <div class="pp-result__actions">
              <button type="button" class="btn" data-ttt-next>Next round</button>
              <button type="button" class="btn btn--ghost" data-ttt-change-mode>Change mode</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const stage = root.querySelector<HTMLElement>('[data-ttt-stage]')!;
  const boardEl = root.querySelector<HTMLElement>('[data-ttt-board]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-ttt-status]')!;
  const tallyEl = root.querySelector<HTMLElement>('[data-ttt-tally]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-ttt-result]')!;
  const resultKicker = root.querySelector<HTMLElement>('[data-ttt-result-kicker]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-ttt-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-ttt-result-detail]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-ttt-next]')!;
  const changeModeBtn = root.querySelector<HTMLButtonElement>('[data-ttt-change-mode]')!;
  const modeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ttt-mode]')];

  let paused = false;
  let mode: Mode = '3x3';
  let size: 3 | 4 = 3;
  let board: TicTacToeBoard = [];
  let turn: TicTacToeMark = 'X';
  let round = 1;
  let wins: [number, number] = [0, 0];
  let roundsPlayed = 0;
  let finished = false;
  let handoff: HandoffScreenController | null = null;

  const cells = () => [...boardEl.querySelectorAll<HTMLButtonElement>('[data-ttt-cell]')];

  const renderModeButtons = () => {
    for (const button of modeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.tttMode === mode));
    }
  };

  const renderTally = () => {
    if (mode !== 'match') {
      tallyEl.hidden = true;
      return;
    }
    tallyEl.textContent = formatMatchTally(getPlayerNames(), wins);
    tallyEl.hidden = false;
  };

  const status = (text: string) => {
    statusEl.textContent = text;
  };

  const turnStatus = () => {
    status(`${markPlayerName(turn)} — your turn.`);
  };

  const roundContext = (): string | undefined => {
    if (mode !== 'match') return undefined;
    return `Round ${Math.min(round, MATCH_MAX_ROUNDS)} of ${MATCH_MAX_ROUNDS} · ${turn} moves first`;
  };

  const closeHandoff = () => {
    handoff?.close();
    handoff = null;
  };

  const showHandoff = (playerMark: TicTacToeMark) => {
    closeHandoff();
    if (paused) return;
    handoff = createHandoffScreen(stage, {
      playerTo: playerMark === 'X' ? 1 : 2,
      context: roundContext(),
      tally: mode === 'match' ? wins : undefined,
      onContinue: () => {
        handoff = null;
        const first = cells().find((cell) => !cell.disabled);
        first?.focus({ preventScroll: true });
      },
    });
  };

  const buildBoard = () => {
    board = Array.from({ length: size * size }, () => null);
    boardEl.style.setProperty('--ttt-size', String(size));
    boardEl.innerHTML = '';
    for (let index = 0; index < size * size; index += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'ttt__cell';
      cell.dataset.tttCell = String(index);
      cell.setAttribute('aria-label', `${cellName(index, size)}, empty`);
      cell.addEventListener('click', () => {
        if (paused || finished) return;
        unlockAudio();
        onCell(index);
      });
      boardEl.appendChild(cell);
    }
  };

  const startRound = (nextRound: number) => {
    round = nextRound;
    finished = false;
    resultEl.hidden = true;
    turn = openingMarkForRound(round);
    buildBoard();
    renderTally();
    turnStatus();
    showHandoff(turn);
  };

  const saveRecord = (result: 'p1' | 'p2' | 'draw', score: readonly [number, number]) => {
    savePassPlayMatchRecord(getBrowserStorage(), {
      gameId: GAME_ID,
      mode: modeLabel(mode),
      result,
      score,
      finishedAt: Date.now(),
    });
  };

  const endMatch = (title: string, detail: string, result: 'p1' | 'p2' | 'draw', score: readonly [number, number]) => {
    finished = true;
    status(title);
    resultKicker.textContent = mode === 'match' ? 'Match complete' : 'Round complete';
    resultTitle.textContent = title;
    resultDetail.textContent = detail;
    nextBtn.textContent = mode === 'match' ? 'New match' : 'Play again';
    resultEl.hidden = false;
    saveRecord(result, score);
    void play('win');
    nextBtn.focus({ preventScroll: true });
  };

  const finishRound = (roundWinner: TicTacToeMark | null) => {
    roundsPlayed += 1;
    const names = getPlayerNames();
    if (mode !== 'match') {
      if (roundWinner === null) {
        endMatch('Draw', 'The board filled with no line. Play again?', 'draw', [0, 0]);
      } else {
        const player = roundWinner === 'X' ? 1 : 2;
        endMatch(
          `${playerName(names, player)} wins the round`,
          `${roundWinner} completed a line of ${size}.`,
          player === 1 ? 'p1' : 'p2',
          player === 1 ? [1, 0] : [0, 1],
        );
      }
      return;
    }

    if (roundWinner !== null) {
      const slot = roundWinner === 'X' ? 0 : 1;
      wins[slot] += 1;
    }
    renderTally();

    const winner = matchWinner(wins);
    if (winner !== null || isMatchOver(wins, roundsPlayed)) {
      const result = winner === null ? 'draw' : winner === 'X' ? 'p1' : 'p2';
      const player = winner === null ? null : winner === 'X' ? 1 : 2;
      endMatch(
        player === null ? 'Match drawn' : `${playerName(names, player)} wins the match`,
        player === null
          ? `Five rounds ended level at ${formatMatchScore(wins)}.`
          : `Final round score ${formatMatchScore(wins)} — first to ${MATCH_TARGET} round wins.`,
        result,
        [wins[0], wins[1]],
      );
      return;
    }

    // Between rounds of a match the device passes to the next opening player.
    finished = true;
    status(
      roundWinner === null
        ? `Round ${round} drawn. ${formatMatchTally(names, wins)}`
        : `${playerName(names, roundWinner === 'X' ? 1 : 2)} wins round ${round}. ${formatMatchTally(names, wins)}`,
    );
    resultKicker.textContent = `Round ${round} of ${MATCH_MAX_ROUNDS} complete`;
    resultTitle.textContent =
      roundWinner === null ? 'Round drawn' : `${playerName(names, roundWinner === 'X' ? 1 : 2)} wins the round`;
    resultDetail.textContent = formatMatchTally(names, wins);
    nextBtn.textContent = 'Next round';
    resultEl.hidden = false;
    void play('win');
    nextBtn.focus({ preventScroll: true });
  };

  const onCell = (index: number) => {
    if (finished) return;
    const next = placeMark(board, index, turn);
    if (next === null) return;

    signalMeaningfulGameInteraction(root);
    board = next;
    const cell = cells()[index]!;
    cell.textContent = turn;
    cell.classList.add(`ttt__cell--${turn.toLowerCase()}`);
    cell.disabled = true;
    cell.setAttribute('aria-label', `${cellName(index, size)}, ${turn}`);
    void play('pop');

    const outcome = findWinner(board, size);
    if (outcome) {
      for (const winIndex of outcome.line) {
        cells()[winIndex]!.classList.add('is-winning');
        cells()[winIndex]!.setAttribute('aria-label', `${cellName(winIndex, size)}, ${turn}, part of the winning line`);
      }
      finishRound(outcome.mark);
      return;
    }

    if (isBoardFull(board)) {
      finishRound(null);
      return;
    }

    turn = nextMark(turn);
    turnStatus();
    showHandoff(turn);
  };

  const resetAll = (nextMode: Mode = mode) => {
    mode = nextMode;
    size = boardSize(mode);
    wins = [0, 0];
    roundsPlayed = 0;
    closeHandoff();
    renderModeButtons();
    startRound(1);
  };

  const moveFocus = (from: number, deltaRow: number, deltaColumn: number) => {
    const row = Math.floor(from / size) + deltaRow;
    const column = (from % size) + deltaColumn;
    if (row < 0 || row >= size || column < 0 || column >= size) return;
    const target = row * size + column;
    const cell = cells()[target];
    if (cell && !cell.disabled) cell.focus({ preventScroll: true });
  };

  boardEl.addEventListener('keydown', (event: KeyboardEvent) => {
    const cell =
      event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-ttt-cell]') : null;
    if (!cell) return;
    const index = Number(cell.dataset.tttCell);
    if (!Number.isFinite(index) || index < 0) return;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    if (paused || finished) return;
    moveFocus(index, move[0], move[1]);
  });

  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      if (paused) return;
      unlockAudio();
      const nextMode = button.dataset.tttMode as Mode;
      if (nextMode === mode) return;
      resetAll(nextMode);
      status(`Mode: ${modeLabel(mode)}. ${markPlayerName(turn)} starts.`);
    });
  }

  nextBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    if (mode === 'match') {
      startRound(roundsPlayed + 1);
    } else {
      startRound(1);
    }
  });

  changeModeBtn.addEventListener('click', () => {
    if (paused) return;
    // Return focus to the mode row so keyboard players can pick the next mode.
    modeButtons[0]?.focus({ preventScroll: true });
  });

  resetAll('3x3');

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
      resetAll(mode);
    },
  };
}
