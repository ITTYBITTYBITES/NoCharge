import { createPuzzle, selectedWord, isComplete, type WordSearchPuzzle } from './engine';
import { WORD_LISTS, type WordListId } from './word-lists';
import { loadPref, savePref } from '../shared/storage';
import { play, unlockAudio } from '../shared/audio';
import type { GameController } from '../shared/types';
import './styles.css';

interface Coord {
  row: number;
  col: number;
}

export function mountWordSearch(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="ws">
      <div class="ws__controls">
        <label>Theme <select data-ws-theme>${Object.keys(WORD_LISTS)
          .map((x) => `<option value="${x}">${x[0]!.toUpperCase()}${x.slice(1)}</option>`)
          .join('')}</select></label>
        <label>Grid <select data-ws-size><option value="8">8</option><option value="10">10</option></select></label>
        <button type="button" class="btn btn--sm" data-ws-list>Show word list</button>
        <button type="button" class="btn btn--sm" data-ws-hint>Hint</button>
        <button type="button" class="btn btn--sm" data-ws-new>New puzzle</button>
      </div>
      <div class="ws__board" data-ws-board>
        <div class="ws__grid" data-ws-grid aria-label="Word search grid"></div>
      </div>
      <ul data-ws-words class="ws__words" hidden></ul>
      <p data-ws-status class="sr-only" aria-live="polite"></p>
    </div>
  `;

  let puzzle: WordSearchPuzzle;
  let found: string[] = [];
  let foundCells: Set<number> = new Set();
  let first: Coord | null = null;
  let cursor = 0;
  let isDragging = false;
  let dragStart: Coord | null = null;

  const grid = root.querySelector<HTMLElement>('[data-ws-grid]')!;
  const list = root.querySelector<HTMLUListElement>('[data-ws-words]')!;
  const status = root.querySelector<HTMLElement>('[data-ws-status]')!;
  const theme = root.querySelector<HTMLSelectElement>('[data-ws-theme]')!;
  const size = root.querySelector<HTMLSelectElement>('[data-ws-size]')!;

  const lastList = loadPref<string>('word-search-last-list', '');
  if (lastList && Object.prototype.hasOwnProperty.call(WORD_LISTS, lastList)) theme.value = lastList;

  function init() {
    puzzle = createPuzzle(WORD_LISTS[theme.value as WordListId], Number(size.value));
    found = [];
    foundCells.clear();
    first = null;
    cursor = 0;
    isDragging = false;
    dragStart = null;
    render();
  }

  function recordSolved() {
    const key = 'nocharge:word-search:puzzles-solved';
    let n = 0;
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        const v = Number(raw);
        n = Number.isFinite(v) ? v : 0;
      }
    } catch {
      n = 0;
    }
    try {
      localStorage.setItem(key, String(n + 1));
    } catch {
      /* */
    }
  }

  function getLineCells(start: Coord, end: Coord): Coord[] | null {
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
    const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;

    // Must be straight line: horizontal, vertical, or diagonal
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
      return null;
    }

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const cells: Coord[] = [];
    for (let i = 0; i <= steps; i++) {
      cells.push({ row: start.row + i * stepR, col: start.col + i * stepC });
    }
    return cells;
  }

  function clearSelecting() {
    grid.querySelectorAll('.ws__cell.is-selecting').forEach((el) => el.classList.remove('is-selecting'));
  }

  function highlightLine(start: Coord, end: Coord) {
    clearSelecting();
    const cells = getLineCells(start, end);
    if (!cells) return;
    for (const { row, col } of cells) {
      const idx = row * puzzle.size + col;
      grid.children[idx]?.classList.add('is-selecting');
    }
  }

  function checkWordSelection(start: Coord, end: Coord): boolean {
    const word = selectedWord(puzzle, start, end);
    if (word && !found.includes(word)) {
      found.push(word);
      const cells = getLineCells(start, end);
      if (cells) {
        for (const { row, col } of cells) {
          foundCells.add(row * puzzle.size + col);
        }
      }
      status.textContent = `Found: ${word}`;
      void play('place');
      if (isComplete(found, puzzle.words)) {
        status.textContent = 'Puzzle complete';
        grid.classList.add('is-locked');
        recordSolved();
        void play('win');
      }
      render();
      return true;
    }
    status.textContent = word ? 'Already found' : 'Select a straight line';
    return false;
  }

  function cellFromPoint(x: number, y: number): Coord | null {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el || !el.classList.contains('ws__cell')) return null;
    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);
    if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
    return { row, col };
  }

  function handlePointerDown(e: PointerEvent) {
    if (isComplete(found, puzzle.words)) return;
    unlockAudio();
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    isDragging = true;
    dragStart = cell;
    cursor = cell.row * puzzle.size + cell.col;
    grid.setPointerCapture(e.pointerId);
    highlightLine(cell, cell);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging || !dragStart) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) {
      cursor = cell.row * puzzle.size + cell.col;
      highlightLine(dragStart, cell);
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging || !dragStart) return;
    isDragging = false;
    clearSelecting();

    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) {
      if (dragStart.row === cell.row && dragStart.col === cell.col) {
        // Single tap -> two-click fallback
        handleTwoClickSelect(cell.row, cell.col);
      } else {
        checkWordSelection(dragStart, cell);
        first = null;
      }
    }
    dragStart = null;
  }

  function handlePointerCancel() {
    isDragging = false;
    dragStart = null;
    clearSelecting();
  }

  function handleTwoClickSelect(r: number, c: number) {
    cursor = r * puzzle.size + c;
    if (!first) {
      first = { row: r, col: c };
      const cell = grid.children[cursor] as HTMLButtonElement | undefined;
      cell?.classList.add('is-start');
      return;
    }
    checkWordSelection(first, { row: r, col: c });
    first = null;
    render();
  }

  function render() {
    const hadFocus = grid.contains(document.activeElement);
    grid.innerHTML = '';
    grid.style.setProperty('--ws-size', String(puzzle.size));
    grid.dataset.size = String(puzzle.size);
    if (!isComplete(found, puzzle.words)) grid.classList.remove('is-locked');

    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const idx = r * puzzle.size + c;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ws__cell';
        b.dataset.row = String(r);
        b.dataset.col = String(c);
        b.textContent = puzzle.grid[r]![c]!.toUpperCase();
        b.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, ${puzzle.grid[r]![c]}`);
        b.tabIndex = idx === cursor ? 0 : -1;

        if (foundCells.has(idx)) b.classList.add('is-found');
        if (first && first.row === r && first.col === c) b.classList.add('is-start');

        grid.append(b);
      }
    }
    if (hadFocus) (grid.children[cursor] as HTMLButtonElement | undefined)?.focus();
    list.innerHTML = puzzle.words
      .map((w) => `<li class="${found.includes(w) ? 'is-found' : ''}">${found.includes(w) ? '✓' : '○'} ${w}</li>`)
      .join('');
  }

  grid.addEventListener('pointerdown', handlePointerDown);
  grid.addEventListener('pointermove', handlePointerMove);
  grid.addEventListener('pointerup', handlePointerUp);
  grid.addEventListener('pointercancel', handlePointerCancel);

  root.querySelector('[data-ws-list]')?.addEventListener('click', () => {
    list.hidden = !list.hidden;
    (root.querySelector('[data-ws-list]') as HTMLElement).textContent = list.hidden
      ? 'Show word list'
      : 'Hide word list';
  });

  root.querySelector('[data-ws-hint]')?.addEventListener('click', () => {
    const w = puzzle.words.find((x) => !found.includes(x));
    if (!w) return;
    const p = puzzle.placements.find((x) => x.word === w);
    if (!p) {
      status.textContent = 'No hint available for this puzzle.';
      return;
    }
    grid.querySelector('.ws__cell.is-hint')?.classList.remove('is-hint');
    status.textContent = `Hint: starting letter ${w[0]!.toUpperCase()}`;
    grid.children[p.start.row * puzzle.size + p.start.col]?.classList.add('is-hint');
    void play('hint');
  });

  function switchPuzzle() {
    if (found.length || first) {
      if (!confirm('Start a new puzzle? Words found so far will be reset.')) return;
    }
    savePref('word-search-last-list', theme.value);
    init();
  }

  root.querySelector('[data-ws-new]')?.addEventListener('click', switchPuzzle);
  theme.addEventListener('change', switchPuzzle);
  size.addEventListener('change', switchPuzzle);

  root.addEventListener('keydown', (e) => {
    const k = e.key;
    const n = puzzle.size;
    let r = Math.floor(cursor / n);
    let c = cursor % n;

    if (k === 'ArrowUp') {
      e.preventDefault();
      r = Math.max(0, r - 1);
    } else if (k === 'ArrowDown') {
      e.preventDefault();
      r = Math.min(n - 1, r + 1);
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      c = Math.max(0, c - 1);
    } else if (k === 'ArrowRight') {
      e.preventDefault();
      c = Math.min(n - 1, c + 1);
    } else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      handleTwoClickSelect(r, c);
      return;
    } else {
      return;
    }

    cursor = r * n + c;
    (grid.children[cursor] as HTMLButtonElement | undefined)?.focus();
    if (first) {
      highlightLine(first, { row: r, col: c });
    }
  });

  init();
  unlockAudio();
  return {
    destroy() {
      root.innerHTML = '';
    },
    pause() {
      handlePointerCancel();
    },
    resume() {
      handlePointerCancel();
    },
    isPaused: () => false,
    restart: init,
  };
}
