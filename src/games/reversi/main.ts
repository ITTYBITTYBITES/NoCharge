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
  applyMove,
  discCounts,
  discToPlayer,
  initialBoard,
  isGameOver,
  legalMoves,
  otherDisc,
  type ReversiBoard,
  type ReversiDisc,
  squareName,
} from './engine';
import './styles.css';

const GAME_ID = 'reversi';

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function mountReversi(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="pp-game rev" style="--pp-accent:#2dd4bf">
      <div class="pp-hud">
        <div class="pp-hud__modes" role="group" aria-label="Reversi options">
          <button type="button" class="pp-hud__mode" data-rev-hints aria-pressed="true">Show legal moves</button>
        </div>
        <p class="pp-hud__status" role="status" aria-live="polite" data-rev-status></p>
        <p class="rev__score" data-rev-score></p>
      </div>
      <div class="pp-stage">
        <div class="rev__board" role="group" aria-label="Reversi board, squares a8 through h1" data-rev-board></div>
        <div class="pp-result" data-rev-result hidden>
          <div class="pp-result__card">
            <p class="pp-result__kicker">Game complete</p>
            <h2 class="pp-result__title" data-rev-result-title></h2>
            <p class="pp-result__detail" data-rev-result-detail></p>
            <div class="pp-result__actions">
              <button type="button" class="btn" data-rev-again>Play again</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const boardEl = root.querySelector<HTMLElement>('[data-rev-board]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-rev-status]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-rev-score]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-rev-result]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-rev-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-rev-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-rev-again]')!;
  const hintsButton = root.querySelector<HTMLButtonElement>('[data-rev-hints]')!;
  const stage = () => root.querySelector<HTMLElement>('.pp-stage')!;

  let paused = false;
  let board: ReversiBoard = initialBoard();
  let turn: ReversiDisc = 'black';
  let finished = false;
  let showHints = true;
  let handoff: HandoffScreenController | null = null;

  const cells = () => [...boardEl.querySelectorAll<HTMLButtonElement>('[data-rev-cell]')];

  const discName = (disc: ReversiDisc) => (disc === 'black' ? 'black' : 'white');

  const status = (text: string) => {
    statusEl.textContent = text;
  };

  const renderScore = () => {
    const { black, white } = discCounts(board);
    const names = getPlayerNames();
    scoreEl.innerHTML = '';
    for (const disc of ['black', 'white'] as ReversiDisc[]) {
      const chip = document.createElement('span');
      chip.className = 'rev__score-chip';
      const swatch = document.createElement('span');
      swatch.className = `rev__score-disc rev__score-disc--${disc}`;
      swatch.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = `${playerName(names, discToPlayer(disc))} · ${discName(disc)} ${disc === 'black' ? black : white}`;
      chip.append(swatch, label);
      if (turn === disc && !finished) chip.classList.add('is-current');
      scoreEl.append(chip);
    }
  };

  const buildBoard = () => {
    boardEl.innerHTML = '';
    for (let index = 0; index < 64; index += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'rev__cell';
      cell.dataset.revCell = String(index);
      cell.setAttribute('aria-label', `${squareName(index)}, empty`);
      boardEl.appendChild(cell);
    }
  };

  const renderBoard = () => {
    const moves = new Set(legalMoves(board, turn));
    for (let index = 0; index < cells().length; index += 1) {
      const cell = cells()[index]!;
      const value = board[index];
      const classes = ['rev__cell'];
      if (value === 'black') classes.push('rev__cell--black');
      if (value === 'white') classes.push('rev__cell--white');
      const legal = !finished && moves.has(index);
      if (legal && showHints) classes.push('is-legal');
      cell.className = classes.join(' ');
      cell.disabled = finished || !legal;
      const described = value !== null ? `${discName(value)} disc` : legal ? `empty, legal move for ${discName(turn)}` : 'empty';
      cell.setAttribute('aria-label', `${squareName(index)}, ${described}`);
    }
  };

  const closeHandoff = () => {
    handoff?.close();
    handoff = null;
  };

  const showHandoff = (disc: ReversiDisc) => {
    closeHandoff();
    if (paused) return;
    handoff = createHandoffScreen(stage(), {
      playerTo: discToPlayer(disc),
      context: 'Most discs wins',
      onContinue: () => {
        handoff = null;
        const first = cells().find((cell) => !cell.disabled);
        first?.focus({ preventScroll: true });
      },
    });
  };

  const finishGame = () => {
    finished = true;
    renderBoard();
    renderScore();
    const { black, white } = discCounts(board);
    const names = getPlayerNames();
    const title = black === white ? 'Draw' : `${playerName(names, black > white ? 1 : 2)} wins`;
    const detail = `Final discs ${black}–${white} (black–white). Most discs wins.`;
    status(`${title}. ${detail}`);
    resultTitle.textContent = title;
    resultDetail.textContent = detail;
    resultEl.hidden = false;
    savePassPlayMatchRecord(getBrowserStorage(), {
      gameId: GAME_ID,
      mode: '8×8 board',
      result: black === white ? 'draw' : black > white ? 'p1' : 'p2',
      score: [black, white],
      finishedAt: Date.now(),
    });
    void play('win');
    againBtn.focus({ preventScroll: true });
  };

  /**
   * Hand the turn to `disc`, announcing and skipping a player who must pass.
   * Ends the game when neither player can move.
   */
  const advanceTurn = (disc: ReversiDisc) => {
    if (isGameOver(board)) {
      finishGame();
      return;
    }
    const names = getPlayerNames();
    if (legalMoves(board, disc).length > 0) {
      turn = disc;
      renderBoard();
      renderScore();
      status(`${playerName(names, discToPlayer(disc))} (${discName(disc)}) — place a disc that flips at least one opponent disc.`);
      showHandoff(disc);
      return;
    }
    // The player to move has no legal move and passes by rule.
    status(`${playerName(names, discToPlayer(disc))} (${discName(disc)}) has no legal move — turn passes.`);
    void play('blip');
    advanceTurn(otherDisc(disc));
  };

  const onCell = (index: number) => {
    if (finished) return;
    const applied = applyMove(board, index, turn);
    if (!applied) return;

    signalMeaningfulGameInteraction(root);
    board = applied.board;
    void play('pop');

    const mover = turn;
    renderBoard();
    renderScore();
    // Animation classes are applied after renderBoard() because that pass
    // rewrites classNames; reduced-motion players never see them animate.
    cells()[index]?.classList.add('is-placed');
    for (const flip of applied.flips) {
      cells()[flip]?.classList.add('is-flipped');
    }
    status(
      `${playerName(getPlayerNames(), discToPlayer(mover))} placed ${squareName(index)} and flipped ${applied.flips.length} ${
        applied.flips.length === 1 ? 'disc' : 'discs'
      }.`,
    );
    advanceTurn(otherDisc(mover));
  };

  const reset = () => {
    buildBoard();
    board = initialBoard();
    turn = 'black';
    finished = false;
    resultEl.hidden = true;
    closeHandoff();
    renderBoard();
    renderScore();
    status('Black places first. Place a disc that outflanks at least one white disc.');
    showHandoff('black');
  };

  /**
   * Arrow navigation moves to the nearest square that is legal for the
   * current turn, searching the half-plane in the pressed direction. Legal
   * squares can be sparse (early turns have only four), so a plain row/column
   * walk could strand focus; the nearest-legal search never does.
   */
  const moveFocus = (from: number, dx: number, dy: number) => {
    const fromRow = Math.floor(from / 8);
    const fromColumn = from % 8;
    let best: { index: number; distance: number } | null = null;
    for (const cell of cells()) {
      if (cell.disabled) continue;
      const index = Number(cell.dataset.revCell);
      const deltaX = (index % 8) - fromColumn;
      const deltaY = Math.floor(index / 8) - fromRow;
      if (dx > 0 && deltaX <= 0) continue;
      if (dx < 0 && deltaX >= 0) continue;
      if (dy > 0 && deltaY <= 0) continue;
      if (dy < 0 && deltaY >= 0) continue;
      const distance = Math.hypot(deltaX, deltaY * 1.2);
      if (!best || distance < best.distance) best = { index, distance };
    }
    if (best) cells()[best.index]?.focus({ preventScroll: true });
  };

  boardEl.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!(event.target instanceof HTMLElement)) return;
    const cell = event.target.closest<HTMLElement>('[data-rev-cell]');
    if (!cell) return;
    const index = Number(cell.dataset.revCell);
    if (!Number.isFinite(index)) return;
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
    moveFocus(index, move[0], move[1]);
  });

  boardEl.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const cell = event.target.closest<HTMLElement>('[data-rev-cell]');
    if (!cell) return;
    if (paused || finished) return;
    unlockAudio();
    onCell(Number(cell.dataset.revCell));
  });

  hintsButton.addEventListener('click', () => {
    if (paused) return;
    showHints = !showHints;
    hintsButton.setAttribute('aria-pressed', String(showHints));
    hintsButton.textContent = showHints ? 'Show legal moves' : 'Hide legal moves';
    renderBoard();
  });

  againBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    reset();
  });

  reset();

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
      reset();
    },
  };
}
