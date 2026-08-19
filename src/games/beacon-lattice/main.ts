import { play, unlockAudio } from '../shared/audio';
import type { GameController, PauseReason } from '../shared/types';
import { coverageBand } from './coverage';
import {
  boardStatus,
  cellViews,
  createState,
  moveCursor,
  placeBeacon,
  removeBeacon,
  restartPuzzle,
  selectType,
  setCursor,
  undo,
} from './engine';
import { BEACON_META } from './patterns';
import { PUZZLES, getPuzzle, puzzleIndex } from './puzzles';
import { loadProgress, recordSolve, setCurrentPuzzle, type LatticeProgress } from './progress';
import type { BeaconType, GameState, PuzzleDefinition } from './types';
import { isBeaconType } from './patterns';
import './styles.css';

const SHORTCUTS: Record<string, BeaconType> = {
  '1': 'cross',
  '2': 'diagonal',
  '3': 'horizontal',
  '4': 'vertical',
};

function bandPhrase(count: number): string {
  const band = coverageBand(count);
  if (band === 'gap') return `${count} · Gap`;
  if (band === 'exact') return `${count} · Exact`;
  return `${count} · Overlap`;
}

function cellName(puzzle: PuzzleDefinition, state: GameState, x: number, y: number): string {
  const view = cellViews(state, puzzle).find((cell) => cell.x === x && cell.y === y)!;
  const row = `Row ${y + 1}, column ${x + 1}`;
  if (view.kind === 'blocked') return `${row}. Blocked obstacle. Does not take coverage.`;
  if (view.kind === 'void') return `${row}. Outside the lattice.`;
  const cover = view.band === 'gap' ? 'Gap' : view.band === 'exact' ? 'Exact' : 'Overlap';
  const placed = view.beacon
    ? `${BEACON_META[view.beacon.type].name} beacon placed${view.beacon.locked ? ', locked' : ''}.`
    : view.eligible
      ? 'Empty eligible cell.'
      : 'Empty cell. Placement is not allowed here.';
  return `${row}. ${cover} coverage: ${view.coverage}. ${placed}`;
}

export function mountBeaconLattice(root: HTMLElement): GameController {
  try {
    return mountBeaconLatticeInner(root);
  } catch (error) {
    root.textContent = error instanceof Error ? error.message : String(error);
    return {
      destroy() {
        root.innerHTML = '';
      },
      pause() {},
      resume() {},
      isPaused: () => false,
      restart() {},
    };
  }
}

function mountBeaconLatticeInner(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="bl">
      <div class="bl__hud">
        <label>
          <span class="sr-only">Choose puzzle</span>
          <select data-bl="picker" aria-label="Puzzle selector"></select>
        </label>
        <button type="button" class="btn btn--ghost btn--sm" data-bl="prev">Previous puzzle</button>
        <button type="button" class="btn btn--ghost btn--sm" data-bl="next">Next puzzle</button>
      </div>
      <div class="bl__stats" aria-live="polite">
        <span>Beacons <strong data-bl="count">0</strong></span>
        <span>Par <strong data-bl="par">0</strong></span>
        <span>Best <strong data-bl="best">—</strong></span>
        <span>Solved <strong data-bl="solved">0</strong>/${PUZZLES.length}</span>
      </div>
      <p class="bl__note" data-bl="note"></p>
      <div class="bl__types" data-bl="types" role="group" aria-label="Beacon types"></div>
      <div class="bl__legend" aria-hidden="true">
        <span>0 · Gap</span>
        <span>1 · Exact</span>
        <span>2+ · Overlap</span>
      </div>
      <div class="bl__board" data-bl="board" role="group" aria-label="Beacon Lattice board"></div>
      <div class="bl__toolbar">
        <button type="button" class="btn btn--ghost btn--sm" data-bl="undo">Undo</button>
      </div>
      <p class="bl__status" data-bl="live" aria-live="polite"></p>
      <div class="bl__overlay" data-bl="overlay">
        <h2>Lattice complete</h2>
        <p data-bl="result"></p>
        <button type="button" class="btn" data-bl="again">Play this puzzle again</button>
      </div>
    </div>
  `;

  const picker = root.querySelector<HTMLSelectElement>('[data-bl="picker"]')!;
  const board = root.querySelector<HTMLElement>('[data-bl="board"]')!;
  const typesEl = root.querySelector<HTMLElement>('[data-bl="types"]')!;
  const live = root.querySelector<HTMLElement>('[data-bl="live"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-bl="overlay"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-bl="result"]')!;
  const noteEl = root.querySelector<HTMLElement>('[data-bl="note"]')!;

  let progress: LatticeProgress = loadProgress();
  let puzzle = getPuzzle(progress.currentId) ?? PUZZLES[0]!;
  let state = createState(puzzle);
  let paused = false;

  const announce = (message: string) => {
    live.textContent = message;
  };

  const fillPicker = () => {
    picker.innerHTML = PUZZLES.map((item, index) => {
      const done = progress.completed.includes(item.id) ? ' (solved)' : '';
      return `<option value="${item.id}">${index + 1}. ${item.title}${done}</option>`;
    }).join('');
    picker.value = puzzle.id;
  };

  const renderTypes = () => {
    typesEl.innerHTML = puzzle.available
      .map((type) => {
        const meta = BEACON_META[type];
        const remaining = puzzle.inventory[type];
        const used = state.placements.filter((placement) => placement.type === type).length;
        const left = remaining == null ? '∞' : String(Math.max(0, remaining - used));
        const pressed = state.selectedType === type;
        return `<button type="button" class="btn btn--ghost btn--sm" data-type="${type}" aria-pressed="${pressed}" aria-keyshortcuts="${meta.shortcut}" aria-label="${meta.name}. ${meta.description} ${left} remaining.">${meta.shortcut} · ${meta.name} ${meta.short} (${left})</button>`;
      })
      .join('');
  };

  const renderBoard = () => {
    board.style.gridTemplateColumns = `repeat(${puzzle.width}, minmax(0, 1fr))`;
    board.innerHTML = '';
    for (const view of cellViews(state, puzzle)) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'bl__cell';
      el.dataset.x = String(view.x);
      el.dataset.y = String(view.y);
      if (view.kind === 'blocked') el.classList.add('is-blocked');
      else if (view.kind === 'void') el.classList.add('is-void');
      else if (view.band) el.classList.add(`is-${view.band}`);
      if (state.cursor.x === view.x && state.cursor.y === view.y) el.classList.add('is-cursor');
      el.disabled = paused || view.kind !== 'required' || state.complete;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', cellName(puzzle, state, view.x, view.y));
      const glyph = view.beacon ? `<span class="bl__glyph" aria-hidden="true">${BEACON_META[view.beacon.type].short}</span>` : '';
      const count = view.kind === 'blocked' ? '■ Block' : view.kind === 'void' ? '· Void' : bandPhrase(view.coverage);
      el.innerHTML = `${glyph}<span class="bl__count">${count}</span>`;
      el.addEventListener('click', () => onCell(view.x, view.y));
      board.appendChild(el);
    }
  };

  const renderHud = () => {
    root.querySelector('[data-bl="count"]')!.textContent = String(state.beaconCount);
    root.querySelector('[data-bl="par"]')!.textContent = String(puzzle.par);
    const best = progress.bests[puzzle.id];
    root.querySelector('[data-bl="best"]')!.textContent = best == null ? '—' : String(best);
    root.querySelector('[data-bl="solved"]')!.textContent = String(progress.completed.length);
    picker.disabled = paused;
    noteEl.textContent = puzzle.note ?? '';
    overlay.classList.toggle('is-open', state.complete);
    if (state.complete) {
      resultEl.textContent = `Solved with ${state.beaconCount} beacons. Par ${puzzle.par}.`;
      root.classList.add('game-root--complete');
    } else {
      root.classList.remove('game-root--complete');
    }
  };

  const render = () => {
    fillPicker();
    renderTypes();
    renderBoard();
    renderHud();
  };

  const loadPuzzle = (id: string, announcement?: string) => {
    const next = getPuzzle(id);
    if (!next) return;
    puzzle = next;
    progress = setCurrentPuzzle(progress, next.id);
    state = createState(next);
    render();
    announce(announcement ?? `${next.title} loaded. ${boardStatus(state, next)}`);
  };

  const onCell = (x: number, y: number) => {
    if (paused) return;
    unlockAudio();
    setCursor(state, puzzle, { x, y });
    const existing = state.placements.find((placement) => placement.x === x && placement.y === y);
    const result = existing ? removeBeacon(state, puzzle, { x, y }) : placeBeacon(state, puzzle, { x, y });
    if (result.ok) {
      void play(state.complete ? 'win' : existing ? 'pop' : 'blip');
      if (state.complete) progress = recordSolve(progress, puzzle.id, state.beaconCount);
    }
    render();
    announce(result.announcement);
  };

  const onKey = (event: KeyboardEvent) => {
    if (paused) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      const result = selectType(state, puzzle, null);
      render();
      announce(result.announcement);
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const dx = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      const dy = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
      const result = moveCursor(state, puzzle, dx, dy);
      render();
      announce(result.ok ? cellName(puzzle, state, state.cursor.x, state.cursor.y) : result.announcement);
      return;
    }
    if (SHORTCUTS[event.key] && puzzle.available.includes(SHORTCUTS[event.key]!)) {
      event.preventDefault();
      const result = selectType(state, puzzle, SHORTCUTS[event.key]!);
      render();
      announce(result.announcement);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      if (document.activeElement instanceof HTMLButtonElement && document.activeElement !== document.body) return;
      event.preventDefault();
      onCell(state.cursor.x, state.cursor.y);
      return;
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      if (paused) return;
      const result = removeBeacon(state, puzzle, state.cursor);
      render();
      announce(result.announcement);
      return;
    }
    if (event.key === 'u' || event.key === 'U') {
      event.preventDefault();
      const result = undo(state, puzzle);
      render();
      announce(result.announcement);
    }
  };

  picker.addEventListener('change', () => {
    if (paused) {
      picker.value = puzzle.id;
      announce('The game is paused.');
      return;
    }
    loadPuzzle(picker.value, `${getPuzzle(picker.value)?.title} selected.`);
  });
  root.querySelector('[data-bl="prev"]')!.addEventListener('click', () => {
    if (paused) return;
    const index = Math.max(0, puzzleIndex(puzzle.id) - 1);
    loadPuzzle(PUZZLES[index]!.id);
  });
  root.querySelector('[data-bl="next"]')!.addEventListener('click', () => {
    if (paused) return;
    const index = Math.min(PUZZLES.length - 1, puzzleIndex(puzzle.id) + 1);
    loadPuzzle(PUZZLES[index]!.id);
  });
  typesEl.addEventListener('click', (event) => {
    if (paused) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-type]');
    if (!button || !isBeaconType(button.dataset.type ?? '')) return;
    unlockAudio();
    const result = selectType(state, puzzle, button.dataset.type as BeaconType);
    render();
    announce(result.announcement);
  });
  root.querySelector('[data-bl="undo"]')!.addEventListener('click', () => {
    if (paused) return;
    const result = undo(state, puzzle);
    render();
    announce(result.announcement);
  });
  root.querySelector('[data-bl="again"]')!.addEventListener('click', () => {
    if (paused) return;
    restartPuzzle(state, puzzle);
    render();
    announce(`${puzzle.title} restarted.`);
  });
  document.addEventListener('keydown', onKey);

  fillPicker();
  render();
  announce(`${puzzle.title} ready. Cover every required cell exactly once.`);

  const api = {
    getState: () => ({ ...state, puzzleId: puzzle.id, complete: state.complete }),
    loadPuzzle: (id: string) => loadPuzzle(id),
    applySolution: () => {
      state = createState(puzzle);
      for (const placement of puzzle.solution) {
        if (placement.locked) continue;
        placeBeacon(state, puzzle, placement, placement.type);
      }
      if (state.complete) progress = recordSolve(progress, puzzle.id, state.beaconCount);
      render();
    },
    applyPlacements: (placements: { x: number; y: number; type: BeaconType }[]) => {
      state = createState(puzzle);
      for (const placement of placements) {
        placeBeacon(state, puzzle, placement, placement.type);
      }
      render();
    },
  };
  (window as Window & { __NOCHARGE_BEACON_LATTICE_TEST__?: typeof api }).__NOCHARGE_BEACON_LATTICE_TEST__ = api;

  return {
    destroy() {
      document.removeEventListener('keydown', onKey);
      delete (window as Window & { __NOCHARGE_BEACON_LATTICE_TEST__?: typeof api }).__NOCHARGE_BEACON_LATTICE_TEST__;
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      paused = true;
      render();
    },
    resume() {
      paused = false;
      render();
    },
    isPaused() {
      return paused;
    },
    restart() {
      restartPuzzle(state, puzzle);
      render();
    },
  };
}
