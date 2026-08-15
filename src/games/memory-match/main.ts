import { play, unlockAudio } from '../shared/audio';
import { loadScore, saveScore } from '../shared/storage';
import { shuffle } from '../shared/utils';
import './styles.css';

const GAME_ID = 'memory-match';
const PAIRS = ['🔷', '🔶', '🟣', '🟢', '🔵', '🟡', '⚪', '🔺'] as const;

type Card = {
  id: number;
  symbol: string;
  el: HTMLButtonElement;
  flipped: boolean;
  matched: boolean;
};

export function mountMemoryMatch(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="mm">
      <div class="mm__hud">
        <div class="mm__stats">
          <span>Moves <strong data-mm="moves">0</strong></span>
          <span>Best <strong data-mm="best">—</strong></span>
        </div>
        <button type="button" class="btn btn--ghost btn--sm" data-mm="restart">New game</button>
      </div>
      <div class="mm__board" data-mm="board" role="grid" aria-label="Memory board"></div>
      <div class="mm__overlay" data-mm="overlay" role="status" aria-live="polite">
        <h2>Cleared</h2>
        <p data-mm="result"></p>
        <button type="button" class="btn" data-mm="again">Play again</button>
      </div>
    </div>
  `;

  const board = root.querySelector<HTMLElement>('[data-mm="board"]')!;
  const movesEl = root.querySelector<HTMLElement>('[data-mm="moves"]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-mm="best"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-mm="overlay"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-mm="result"]')!;
  const restartBtn = root.querySelector<HTMLButtonElement>('[data-mm="restart"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-mm="again"]')!;

  let cards: Card[] = [];
  let lock = false;
  let first: Card | null = null;
  let moves = 0;
  let matched = 0;
  let best = loadScore(GAME_ID);

  bestEl.textContent = best > 0 ? String(best) : '—';

  function updateMoves() {
    movesEl.textContent = String(moves);
    movesEl.classList.remove('score-pop');
    void movesEl.offsetWidth;
    movesEl.classList.add('score-pop');
  }

  function build() {
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
      el.setAttribute('role', 'gridcell');
      el.setAttribute('aria-label', 'Hidden card');
      el.innerHTML = `
        <span class="mm__face mm__face--back" aria-hidden="true">?</span>
        <span class="mm__face mm__face--front" aria-hidden="true">${symbol}</span>
      `;
      const card: Card = { id, symbol, el, flipped: false, matched: false };
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        unlockAudio();
        void onFlip(card);
      });
      board.appendChild(el);
      return card;
    });
  }

  async function onFlip(card: Card) {
    if (lock || card.flipped || card.matched) return;

    card.flipped = true;
    card.el.classList.add('is-flipped');
    card.el.setAttribute('aria-label', `Card ${card.symbol}`);
    void play('blip');

    if (!first) {
      first = card;
      return;
    }

    moves += 1;
    updateMoves();
    lock = true;

    if (first.symbol === card.symbol) {
      first.matched = true;
      card.matched = true;
      first.el.classList.add('is-matched');
      card.el.classList.add('is-matched');
      first.el.disabled = true;
      card.el.disabled = true;
      matched += 1;
      void play('pop');
      first = null;
      lock = false;

      if (matched === PAIRS.length) {
        // Lower moves is better
        try {
          const raw = localStorage.getItem('nocharge:memory-match:best-moves');
          const prev = raw ? Number(raw) : Infinity;
          best = Math.min(prev, moves);
          localStorage.setItem('nocharge:memory-match:best-moves', String(best));
          // Also keep a generic high-score style value (higher = better)
          saveScore(GAME_ID, Math.max(0, 1000 - moves * 10));
        } catch {
          best = moves;
        }
        bestEl.textContent = String(best);
        resultEl.textContent = `Finished in ${moves} moves. Best: ${best}.`;
        overlay.classList.add('is-open');
        board.hidden = true;
        void play('win');
      }
      return;
    }

    await new Promise((r) => setTimeout(r, 650));
    first.flipped = false;
    card.flipped = false;
    first.el.classList.remove('is-flipped');
    card.el.classList.remove('is-flipped');
    first.el.setAttribute('aria-label', 'Hidden card');
    card.el.setAttribute('aria-label', 'Hidden card');
    first = null;
    lock = false;
  }

  // Load best moves if present
  try {
    const raw = localStorage.getItem('nocharge:memory-match:best-moves');
    if (raw) {
      best = Number(raw);
      bestEl.textContent = String(best);
    }
  } catch {
    /* ignore */
  }

  restartBtn.addEventListener('click', () => {
    unlockAudio();
    build();
  });
  againBtn.addEventListener('click', () => {
    unlockAudio();
    build();
  });

  build();

  return () => {
    root.innerHTML = '';
  };
}

// Auto-mount when script is loaded on game page
const mountEl = document.querySelector<HTMLElement>('[data-game-root="memory-match"]');
if (mountEl) mountMemoryMatch(mountEl);
