import { createPuzzle, selectedWord, isComplete, type WordSearchPuzzle } from './engine';
import { WORD_LISTS, type WordListId } from './word-lists';
import { loadPref, savePref } from '../shared/storage';
import { play, unlockAudio } from '../shared/audio';
import type { GameController } from '../shared/types';
import './styles.css';

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
  let first: { row: number; col: number } | null = null;
  let cursor = 0;

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
    first = null;
    cursor = 0;
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

  function selectCell(r: number, c: number) {
    cursor = r * puzzle.size + c;
    const cell = grid.children[cursor] as HTMLButtonElement | undefined;
    if (!first) {
      first = { row: r, col: c };
      cell?.classList.add('is-start');
      return;
    }
    const word = selectedWord(puzzle, first, { row: r, col: c });
    first = null;
    if (word && !found.includes(word)) {
      found.push(word);
      status.textContent = `Found: ${word}`;
      void play('place');
      if (isComplete(found, puzzle.words)) {
        status.textContent = 'Puzzle complete';
        grid.classList.add('is-locked');
        recordSolved();
        void play('win');
      }
    } else {
      status.textContent = word ? 'Already found' : 'Select a straight line';
    }
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
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ws__cell';
        b.textContent = puzzle.grid[r]![c]!.toUpperCase();
        b.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, ${puzzle.grid[r]![c]}`);
        b.tabIndex = r * puzzle.size + c === cursor ? 0 : -1;
        if (first && first.row === r && first.col === c) b.classList.add('is-start');
        b.addEventListener('click', () => selectCell(r, c));
        grid.append(b);
      }
    }
    if (hadFocus) (grid.children[cursor] as HTMLButtonElement | undefined)?.focus();
    list.innerHTML = puzzle.words.map((w) => `<li>${found.includes(w) ? '✓' : '○'} ${w}</li>`).join('');
  }

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
    if (k !== 'ArrowRight' && k !== 'ArrowLeft' && k !== 'ArrowDown' && k !== 'ArrowUp') return;
    e.preventDefault();
    const n = puzzle.size;
    let r = Math.floor(cursor / n);
    let c = cursor % n;
    if (k === 'ArrowUp') r = Math.max(0, r - 1);
    else if (k === 'ArrowDown') r = Math.min(n - 1, r + 1);
    else if (k === 'ArrowLeft') c = Math.max(0, c - 1);
    else c = Math.min(n - 1, c + 1);
    cursor = r * n + c;
    (grid.children[cursor] as HTMLButtonElement | undefined)?.focus();
  });

  init();
  unlockAudio();
  return {
    destroy() {},
    pause() {},
    resume() {},
    isPaused: () => false,
    restart: init,
  };
}
