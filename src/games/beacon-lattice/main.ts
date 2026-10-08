import { play, unlockAudio } from '../shared/audio';
import type { GameController, PauseReason } from '../shared/types';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import { currentLocale } from '../../i18n/client';
import { formatMessage, message, type Message } from '../../i18n/message';
import { t, type MessageKey, type MessageParams } from '../../i18n/messages';
import { coverageBand } from './coverage';
import {
  beaconTypeName,
  boardStatus,
  cellViews,
  coverageBandName,
  createState,
  moveCursor,
  placeBeacon,
  removeBeacon,
  restartPuzzle,
  selectType,
  setCursor,
  undo,
} from './engine';
import { PUZZLES, getPuzzle, puzzleIndex } from './puzzles';
import { loadProgress, recordSolve, setCurrentPuzzle, type LatticeProgress } from './progress';
import type { BeaconType, GameState, PuzzleDefinition } from './types';
import { isBeaconType } from './patterns';
import { BEACON_META } from './patterns';
import './styles.css';

const SHORTCUTS: Record<string, BeaconType> = {
  '1': 'cross',
  '2': 'diagonal',
  '3': 'horizontal',
  '4': 'vertical',
};

const DESCRIPTION_KEYS: Record<BeaconType, MessageKey> = {
  cross: 'beacon.desc.cross',
  diagonal: 'beacon.desc.diagonal',
  horizontal: 'beacon.desc.horizontal',
  vertical: 'beacon.desc.vertical',
};

/** The cell's name for screen readers, as a message. */
function cellMessage(puzzle: PuzzleDefinition, state: GameState, x: number, y: number): Message {
  const view = cellViews(state, puzzle).find((cell) => cell.x === x && cell.y === y)!;
  const cell = message('beacon.cell.row', { row: y + 1, column: x + 1 });
  if (view.kind === 'blocked') return message('beacon.cell.blocked', { cell });
  if (view.kind === 'void') return message('beacon.cell.void', { cell });
  const placed: Message = view.beacon
    ? message(view.beacon.locked ? 'beacon.cell.placedLocked' : 'beacon.cell.placed', {
        type: beaconTypeName(view.beacon.type),
      })
    : message(view.eligible ? 'beacon.cell.eligible' : 'beacon.cell.notAllowed');
  return message('beacon.cell.coverage', {
    cell,
    band: coverageBandName(view.band ?? 'overlap'),
    coverage: view.coverage,
    placed,
  });
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
  const locale = currentLocale();
  const text = (key: MessageKey, params?: MessageParams) => t(locale, key, params);
  const format = (value: Message) => formatMessage(locale, value);

  root.innerHTML = `
    <div class="bl">
      <div class="bl__hud">
        <label>
          <span class="sr-only">${text('beacon.ui.choosePuzzle')}</span>
          <select data-bl="picker" aria-label="${text('beacon.ui.picker')}"></select>
        </label>
        <button type="button" class="btn btn--ghost btn--sm" data-bl="prev">${text('beacon.ui.previous')}</button>
        <button type="button" class="btn btn--ghost btn--sm" data-bl="next">${text('beacon.ui.next')}</button>
      </div>
      <div class="bl__stats" aria-live="polite">
        <span>${text('beacon.ui.beacons')} <strong data-bl="count">0</strong></span>
        <span>${text('beacon.ui.par')} <strong data-bl="par">0</strong></span>
        <span>${text('beacon.ui.best')} <strong data-bl="best">—</strong></span>
        <span>${text('beacon.ui.solved')} <strong data-bl="solved">0</strong>/${PUZZLES.length}</span>
      </div>
      <p class="bl__note" data-bl="note"></p>
      <div class="bl__types" data-bl="types" role="group" aria-label="${text('beacon.ui.types')}"></div>
      <div class="bl__legend" aria-hidden="true">
        <span>${text('beacon.ui.band', { count: 0, band: format(coverageBandName('gap')) })}</span>
        <span>${text('beacon.ui.band', { count: 1, band: format(coverageBandName('exact')) })}</span>
        <span>${text('beacon.ui.band', { count: '2+', band: format(coverageBandName('overlap')) })}</span>
      </div>
      <div class="bl__board" data-bl="board" role="group" aria-label="${text('beacon.ui.board')}"></div>
      <div class="bl__toolbar">
        <button type="button" class="btn btn--ghost btn--sm" data-bl="undo">${text('beacon.ui.undo')}</button>
      </div>
      <p class="bl__status" data-bl="live" aria-live="polite"></p>
      <div class="bl__overlay" data-bl="overlay">
        <h2>${text('beacon.ui.complete')}</h2>
        <p data-bl="result"></p>
        <button type="button" class="btn" data-bl="again">${text('beacon.ui.again')}</button>
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

  const announce = (value: string) => {
    live.textContent = value;
  };
  const say = (value: Message) => announce(format(value));

  const fillPicker = () => {
    const options = PUZZLES.map((item, index) => {
      const option = document.createElement('option');
      option.value = item.id;
      const done = progress.completed.includes(item.id) ? text('beacon.ui.solvedMark') : '';
      // Puzzle titles are authored English content; only the markers are localized.
      option.textContent = `${index + 1}. ${item.title}${done}`;
      return option;
    });
    picker.replaceChildren(...options);
    picker.value = puzzle.id;
  };

  const renderTypes = () => {
    typesEl.replaceChildren(
      ...puzzle.available.map((type) => {
        const meta = BEACON_META[type];
        const remaining = puzzle.inventory[type];
        const used = state.placements.filter((placement) => placement.type === type).length;
        const left = remaining == null ? '∞' : String(Math.max(0, remaining - used));
        const pressed = state.selectedType === type;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn--ghost btn--sm';
        button.dataset.type = type;
        button.setAttribute('aria-pressed', String(pressed));
        button.setAttribute('aria-keyshortcuts', meta.shortcut);
        const name = beaconTypeName(type);
        button.setAttribute(
          'aria-label',
          text('beacon.ui.typeAria', {
            name: format(name),
            description: text(DESCRIPTION_KEYS[type]),
            left,
          }),
        );
        button.textContent = text('beacon.ui.typeLabel', {
          shortcut: meta.shortcut,
          name: format(name),
          short: meta.short,
          left,
        });
        return button;
      }),
    );
  };

  const bandPhrase = (count: number): string =>
    text('beacon.ui.band', { count, band: format(coverageBandName(coverageBand(count))) });

  const renderBoard = () => {
    board.style.gridTemplateColumns = `repeat(${puzzle.width}, minmax(0, 1fr))`;
    board.replaceChildren();
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
      el.setAttribute('aria-label', format(cellMessage(puzzle, state, view.x, view.y)));
      if (view.beacon) {
        const glyph = document.createElement('span');
        glyph.className = 'bl__glyph';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.textContent = BEACON_META[view.beacon.type].short;
        el.append(glyph);
      }
      const count = document.createElement('span');
      count.className = 'bl__count';
      count.textContent =
        view.kind === 'blocked'
          ? text('beacon.cell.blockedShort')
          : view.kind === 'void'
            ? text('beacon.cell.voidShort')
            : bandPhrase(view.coverage);
      el.append(count);
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
    // Puzzle notes are authored English content.
    noteEl.textContent = puzzle.note ?? '';
    overlay.classList.toggle('is-open', state.complete);
    if (state.complete) {
      resultEl.textContent = format(boardStatus(state, puzzle));
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

  const loadPuzzle = (id: string, announcement?: Message) => {
    const next = getPuzzle(id);
    if (!next) return;
    puzzle = next;
    progress = setCurrentPuzzle(progress, next.id);
    state = createState(next);
    render();
    say(announcement ?? message('beacon.ui.loaded', { title: next.title, status: boardStatus(state, next) }));
  };

  const onCell = (x: number, y: number) => {
    if (paused) return;
    unlockAudio();
    setCursor(state, puzzle, { x, y });
    const existing = state.placements.find((placement) => placement.x === x && placement.y === y);
    const result = existing ? removeBeacon(state, puzzle, { x, y }) : placeBeacon(state, puzzle, { x, y });
    if (result.ok) {
      signalMeaningfulGameInteraction(root);
      void play(state.complete ? 'win' : existing ? 'error' : 'place');
      if (state.complete) progress = recordSolve(progress, puzzle.id, state.beaconCount);
    }
    render();
    say(result.message);
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
      say(result.message);
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const dx = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      const dy = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
      const result = moveCursor(state, puzzle, dx, dy);
      render();
      say(result.ok ? cellMessage(puzzle, state, state.cursor.x, state.cursor.y) : result.message);
      return;
    }
    if (SHORTCUTS[event.key] && puzzle.available.includes(SHORTCUTS[event.key]!)) {
      event.preventDefault();
      const result = selectType(state, puzzle, SHORTCUTS[event.key]!);
      render();
      say(result.message);
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
      say(result.message);
      return;
    }
    if (event.key === 'u' || event.key === 'U') {
      event.preventDefault();
      const result = undo(state, puzzle);
      render();
      say(result.message);
    }
  };

  picker.addEventListener('change', () => {
    if (paused) {
      picker.value = puzzle.id;
      announce(text('beacon.paused'));
      return;
    }
    const selected = getPuzzle(picker.value);
    loadPuzzle(picker.value, selected ? message('beacon.ui.selectedPuzzle', { title: selected.title }) : undefined);
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
    say(result.message);
  });
  root.querySelector('[data-bl="undo"]')!.addEventListener('click', () => {
    if (paused) return;
    const result = undo(state, puzzle);
    render();
    say(result.message);
  });
  root.querySelector('[data-bl="again"]')!.addEventListener('click', () => {
    if (paused) return;
    const result = restartPuzzle(state, puzzle);
    render();
    say(result.message);
  });
  document.addEventListener('keydown', onKey);

  fillPicker();
  render();
  announce(text('beacon.ui.ready', { title: puzzle.title }));

  return {
    destroy() {
      document.removeEventListener('keydown', onKey);
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
