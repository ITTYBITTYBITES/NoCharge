import { play, unlockAudio } from '../shared/audio';
import { loadScore, saveScore } from '../shared/storage';
import type { GameController, PauseReason } from '../shared/types';
import { shuffle } from '../shared/utils';
import './styles.css';

const GAME_ID = 'memory-match';
const PAIRS = ['🔷', '🔶', '🟣', '🟢', '🔵', '🟡', '⚪', '🔺'] as const;
const MISMATCH_DELAY = 650;

type Card = {
  id: number;
  symbol: string;
  el: HTMLButtonElement;
  flipped: boolean;
  matched: boolean;
};

type PendingMismatch = {
  firstCard: Card;
  secondCard: Card;
  activeRound: number;
  remaining: number;
  startedAt: number;
  timer: number | null;
};

export function mountMemoryMatch(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="mm">
      <div class="mm__hud">
        <div class="mm__stats" aria-live="polite">
          <span>Moves <strong data-mm="moves">0</strong></span>
          <span>Best <strong data-mm="best">—</strong></span>
        </div>
      </div>
      <div class="mm__board" data-mm="board" role="group" aria-label="Memory cards"></div>
      <div class="mm__overlay" data-mm="overlay">
        <h2>Cleared</h2>
        <p data-mm="result" aria-live="polite"></p>
        <button type="button" class="btn" data-mm="again">Play again</button>
      </div>
    </div>
  `;

  const board = root.querySelector<HTMLElement>('[data-mm="board"]')!;
  const movesEl = root.querySelector<HTMLElement>('[data-mm="moves"]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-mm="best"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-mm="overlay"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-mm="result"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-mm="again"]')!;

  let cards: Card[] = [];
  let lock = false;
  let paused = false;
  let first: Card | null = null;
  let moves = 0;
  let matched = 0;
  let round = 0;
  let best = loadScore(GAME_ID);
  let pendingMismatch: PendingMismatch | null = null;

  bestEl.textContent = best > 0 ? String(best) : '—';

  function updateMoves() {
    movesEl.textContent = String(moves);
    movesEl.classList.remove('score-pop');
    void movesEl.offsetWidth;
    movesEl.classList.add('score-pop');
  }

  function clearPendingMismatch() {
    if (pendingMismatch?.timer != null) window.clearTimeout(pendingMismatch.timer);
    pendingMismatch = null;
  }

  function settleMismatch(mismatch: PendingMismatch) {
    if (pendingMismatch !== mismatch || mismatch.activeRound !== round) return;
    pendingMismatch = null;
    if (paused) return;
    mismatch.firstCard.flipped = false;
    mismatch.secondCard.flipped = false;
    mismatch.firstCard.el.classList.remove('is-flipped');
    mismatch.secondCard.el.classList.remove('is-flipped');
    mismatch.firstCard.el.setAttribute('aria-label', `Card ${mismatch.firstCard.id + 1} of ${cards.length}, hidden`);
    mismatch.secondCard.el.setAttribute('aria-label', `Card ${mismatch.secondCard.id + 1} of ${cards.length}, hidden`);
    first = null;
    lock = false;
  }

  function scheduleMismatch(mismatch: PendingMismatch) {
    if (paused || mismatch.activeRound !== round) return;
    mismatch.startedAt = performance.now();
    mismatch.timer = window.setTimeout(() => settleMismatch(mismatch), mismatch.remaining);
  }

  function queueMismatch(firstCard: Card, secondCard: Card, activeRound: number) {
    clearPendingMismatch();
    const mismatch: PendingMismatch = {
      firstCard,
      secondCard,
      activeRound,
      remaining: MISMATCH_DELAY,
      startedAt: performance.now(),
      timer: null,
    };
    pendingMismatch = mismatch;
    scheduleMismatch(mismatch);
  }

  function build() {
    round += 1;
    root.classList.remove('game-root--complete');
    clearPendingMismatch();
    lock = false;
    first = null;
    moves = 0;
    matched = 0;
    updateMoves();
    overlay.classList.remove('is-open');
    board.hidden = false;

    const symbols = shuffle([...PAIRS, ...PAIRS]);
    board.innerHTML = '';
    cards = symbols.map((symbol, id) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mm__card';
      el.setAttribute('aria-label', `Card ${id + 1} of ${symbols.length}, hidden`);
      el.innerHTML = `
        <span class="mm__face mm__face--back" aria-hidden="true">?</span>
        <span class="mm__face mm__face--front" aria-hidden="true">${symbol}</span>
      `;
      const card: Card = { id, symbol, el, flipped: false, matched: false };
      el.addEventListener('click', () => {
        if (paused) return;
        unlockAudio();
        onFlip(card);
      });
      board.appendChild(el);
      return card;
    });
  }

  function onFlip(card: Card) {
    if (paused || lock || card.flipped || card.matched) return;

    card.flipped = true;
    card.el.classList.add('is-flipped');
    card.el.setAttribute('aria-label', `${card.symbol}, card ${card.id + 1} of ${cards.length}`);
    void play('blip');

    if (!first) {
      first = card;
      return;
    }

    const firstCard = first;
    const activeRound = round;
    moves += 1;
    updateMoves();
    lock = true;

    if (firstCard.symbol === card.symbol) {
      firstCard.matched = true;
      card.matched = true;
      firstCard.el.classList.add('is-matched');
      card.el.classList.add('is-matched');
      firstCard.el.setAttribute('aria-label', `${firstCard.symbol}, matched`);
      card.el.setAttribute('aria-label', `${card.symbol}, matched`);
      firstCard.el.disabled = true;
      card.el.disabled = true;
      matched += 1;
      void play('pop');
      first = null;
      lock = false;

      if (matched === PAIRS.length) {
        // Lower move counts are better for Memory Match.
        try {
          const raw = localStorage.getItem('nocharge:memory-match:best-moves');
          const prev = raw ? Number(raw) : Infinity;
          best = Math.min(Number.isFinite(prev) ? prev : Infinity, moves);
          localStorage.setItem('nocharge:memory-match:best-moves', String(best));
          // Keep a generic higher-is-better value for shared score storage.
          saveScore(GAME_ID, Math.max(0, 1000 - moves * 10));
        } catch {
          best = moves;
        }
        bestEl.textContent = String(best);
        resultEl.textContent = `Finished in ${moves} moves. Best: ${best}.`;
        root.classList.add('game-root--complete');
        overlay.classList.add('is-open');
        board.hidden = true;
        if (!paused) againBtn.focus();
        void play('win');
      } else {
        cards.find((candidate) => !candidate.matched)?.el.focus();
      }
      return;
    }

    // Keep the reveal delay as game state. Pausing clears its timer and stores
    // its remaining duration so an old timeout cannot mutate a resumed board.
    queueMismatch(firstCard, card, activeRound);
  }

  // Load the lower-is-better score used by this game, if present.
  try {
    const raw = localStorage.getItem('nocharge:memory-match:best-moves');
    if (raw && Number.isFinite(Number(raw))) {
      best = Number(raw);
      bestEl.textContent = String(best);
    }
  } catch {
    /* Storage may be unavailable. */
  }

  againBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    build();
  });

  build();

  return {
    destroy() {
      round += 1;
      clearPendingMismatch();
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      if (paused) return;
      paused = true;
      if (pendingMismatch?.timer != null) {
        window.clearTimeout(pendingMismatch.timer);
        pendingMismatch.timer = null;
        pendingMismatch.remaining = Math.max(0, pendingMismatch.remaining - (performance.now() - pendingMismatch.startedAt));
      }
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (pendingMismatch) {
        if (pendingMismatch.remaining <= 0) settleMismatch(pendingMismatch);
        else scheduleMismatch(pendingMismatch);
      }
    },
    isPaused() {
      return paused;
    },
    restart() {
      build();
    },
  };
}
