import { createPuzzle, isValidMove, togglePencilMarks, type Difficulty } from './engine';
import { loadPref, savePref } from '../shared/storage';
import { play, unlockAudio } from '../shared/audio';
import type { GameController, PauseReason } from '../shared/types';
import './styles.css';

const SIZE = 6;
const CELL_COUNT = SIZE * SIZE;
const SAVED_KEY = 'nocharge:sudoku:current-puzzle';
const SOLVED_KEY = 'nocharge:sudoku:puzzles-solved';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

type SavedPuzzle = { d?: unknown; s?: unknown; b?: unknown };

export function mountMiniSudoku(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="ms">
      <div class="ms__controls">
        <label>Difficulty
          <select data-ms-difficulty>
            <option value="easy">Easy · 12 removed</option>
            <option value="medium">Medium · 16 removed</option>
            <option value="hard">Hard · 20 removed</option>
          </select>
        </label>
        <button class="btn btn--sm" data-ms-check>Check</button>
        <button class="btn btn--sm" data-ms-reveal>Reveal</button>
        <button class="btn btn--sm" data-ms-undo>Undo</button>
        <button class="btn btn--sm" data-ms-marks aria-pressed="false">Marks</button>
      </div>
      <div class="ms__pad" aria-label="Digit pad">
        ${[1, 2, 3, 4, 5, 6]
          .map((digit) => `<button class="ms__pad-btn" data-ms-digit="${digit}" aria-label="Enter ${digit}">${digit}</button>`)
          .join('')}
        <button class="ms__pad-btn ms__pad-btn--erase" data-ms-erase aria-label="Clear selected cell">✕</button>
      </div>
      <div class="ms__grid" data-ms-grid aria-label="Mini Sudoku 6 by 6"></div>
      <p data-ms-status aria-live="polite"></p>
    </div>`;

  const listeners = new AbortController();
  const listenerOptions = { signal: listeners.signal };
  const grid = root.querySelector<HTMLElement>('[data-ms-grid]')!;
  const status = root.querySelector<HTMLElement>('[data-ms-status]')!;
  const difficulty = root.querySelector<HTMLSelectElement>('[data-ms-difficulty]')!;
  const marksBtn = root.querySelector<HTMLButtonElement>('[data-ms-marks]')!;

  let game = createPuzzle('easy');
  let board = game.puzzle.map((row) => row.slice());
  let selected = 0;
  let history: number[][][] = [];
  let markMode = loadPref('sudoku-pencil-marks', false);
  let paused = false;
  const marks = Array.from({ length: CELL_COUNT }, () => new Set<number>());

  const isInitialClue = (row: number, col: number) => game.puzzle[row]![col] !== 0;

  function saveState(): void {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify({ d: difficulty.value, s: game.seed, b: board }));
    } catch {
      // Storage can be unavailable in private/restricted browsing.
    }
  }

  function restoreState(): boolean {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return false;
      const value = JSON.parse(raw) as SavedPuzzle;
      if (typeof value.s !== 'number' || typeof value.d !== 'string' || !Array.isArray(value.b)) return false;
      if (!DIFFICULTIES.includes(value.d as Difficulty)) return false;

      const restored = createPuzzle(value.d as Difficulty, value.s);
      const storedBoard = value.b as unknown[];
      if (storedBoard.length !== SIZE) return false;
      for (let row = 0; row < SIZE; row += 1) {
        const storedRow = storedBoard[row];
        if (!Array.isArray(storedRow) || storedRow.length !== SIZE) return false;
        for (let col = 0; col < SIZE; col += 1) {
          const cell = storedRow[col];
          if (typeof cell !== 'number' || !Number.isInteger(cell) || cell < 0 || cell > SIZE) return false;
          const clue = restored.puzzle[row]![col]!;
          if (clue !== 0 && cell !== clue) return false;
          if (cell !== 0 && restored.solution[row]![col] !== cell) return false;
        }
      }

      difficulty.value = value.d;
      game = restored;
      board = (value.b as number[][]).map((row) => row.slice());
      return true;
    } catch {
      return false;
    }
  }

  function newPuzzle(): void {
    game = createPuzzle(difficulty.value as Difficulty);
    board = game.puzzle.map((row) => row.slice());
    render();
  }

  function init(): void {
    history = [];
    marks.forEach((set) => set.clear());
    newPuzzle();
  }

  function syncMarksBtn(): void {
    marksBtn.setAttribute('aria-pressed', String(markMode));
  }

  function recordSolved(): void {
    let solved = 0;
    try {
      const raw = localStorage.getItem(SOLVED_KEY);
      const parsed = raw == null ? 0 : Number(raw);
      solved = Number.isFinite(parsed) ? parsed : 0;
      localStorage.setItem(SOLVED_KEY, String(solved + 1));
    } catch {
      // Keep gameplay working without persistence.
    }
  }

  function render(): void {
    const hadFocus = grid.contains(document.activeElement);
    grid.innerHTML = '';
    for (let index = 0; index < CELL_COUNT; index += 1) {
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const button = document.createElement('button');
      const value = board[row]![col]!;
      const notes = Array.from(marks[index]!).sort().join('');
      const given = isInitialClue(row, col);

      button.type = 'button';
      button.className = 'ms__cell';
      button.classList.toggle('is-selected', index === selected);
      button.classList.toggle('is-given', given);
      button.dataset.initialClue = String(given);
      if (value) {
        button.textContent = String(value);
        button.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}: ${value}${given ? ', fixed clue' : ''}`);
      } else if (notes) {
        button.classList.add('has-marks');
        button.textContent = notes;
        button.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, notes ${notes.split('').join(', ')}`);
      } else {
        button.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, empty`);
      }
      button.tabIndex = index === selected ? 0 : -1;
      button.addEventListener('click', () => {
        if (paused) return;
        unlockAudio();
        selected = index;
        render();
      }, listenerOptions);
      grid.append(button);
    }
    if (hadFocus) (grid.children[selected] as HTMLButtonElement | undefined)?.focus();
    saveState();
  }

  function fixedClueMessage(row: number, col: number): boolean {
    if (!isInitialClue(row, col)) return false;
    status.textContent = 'That clue is fixed.';
    return true;
  }

  function fill(digit: number): void {
    if (paused) return;
    const row = Math.floor(selected / SIZE);
    const col = selected % SIZE;
    if (fixedClueMessage(row, col)) return;
    if (!isValidMove(board, row, col, digit)) {
      status.textContent = 'That digit conflicts with this row, column, or box.';
      void play('error');
      return;
    }
    history.push(board.map((currentRow) => currentRow.slice()));
    board[row]![col] = digit;
    marks[selected]!.clear();
    status.textContent = `Filled ${digit}`;
    void play('place');
    render();
    if (board.every((currentRow, y) => currentRow.every((value, x) => value === game.solution[y]![x]))) {
      status.textContent = 'Puzzle complete';
      recordSolved();
      void play('win');
    }
  }

  function enterDigit(digit: number): void {
    if (paused) return;
    unlockAudio();
    const row = Math.floor(selected / SIZE);
    const col = selected % SIZE;
    if (fixedClueMessage(row, col)) return;
    if (markMode) {
      if (board[row]![col]) {
        status.textContent = 'Clear the cell before adding notes.';
        return;
      }
      marks[selected] = togglePencilMarks(marks[selected]!, digit);
      void play('place');
      render();
      return;
    }
    fill(digit);
  }

  function clearSelected(): void {
    if (paused) return;
    unlockAudio();
    const row = Math.floor(selected / SIZE);
    const col = selected % SIZE;
    if (fixedClueMessage(row, col)) return;
    if (board[row]![col]) {
      history.push(board.map((currentRow) => currentRow.slice()));
      board[row]![col] = 0;
      render();
      status.textContent = 'Cell cleared.';
    } else if (marks[selected]!.size) {
      marks[selected] = new Set();
      render();
      status.textContent = 'Notes cleared.';
    } else {
      status.textContent = 'Selected cell is already empty.';
    }
  }

  function doCheck(): void {
    if (paused) return;
    unlockAudio();
    const wrong = board.some((row, y) => row.some((value, x) => value !== 0 && value !== game.solution[y]![x]));
    status.textContent = wrong ? 'Some cells need another look.' : 'All filled cells are correct.';
    if (wrong) void play('error');
  }

  function doReveal(): void {
    if (paused) return;
    unlockAudio();
    const row = Math.floor(selected / SIZE);
    const col = selected % SIZE;
    if (fixedClueMessage(row, col)) return;
    if (!board[row]![col]) {
      history.push(board.map((currentRow) => currentRow.slice()));
      board[row]![col] = game.solution[row]![col]!;
      marks[selected] = new Set();
      void play('hint');
      render();
    }
  }

  function doUndo(): void {
    if (paused) return;
    unlockAudio();
    const previous = history.pop();
    if (previous) {
      board = previous;
      render();
      status.textContent = 'Last entry undone.';
    }
  }

  root.querySelector('[data-ms-check]')?.addEventListener('click', doCheck, listenerOptions);
  root.querySelector('[data-ms-reveal]')?.addEventListener('click', doReveal, listenerOptions);
  root.querySelector('[data-ms-undo]')?.addEventListener('click', doUndo, listenerOptions);
  marksBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    markMode = !markMode;
    savePref('sudoku-pencil-marks', markMode);
    syncMarksBtn();
    status.textContent = markMode
      ? 'Pencil marks on: digits add notes to the empty cell.'
      : 'Pencil marks off: digits fill the cell.';
    render();
  }, listenerOptions);
  root.querySelectorAll<HTMLElement>('[data-ms-digit]').forEach((button) =>
    button.addEventListener('click', () => enterDigit(Number(button.dataset.msDigit)), listenerOptions),
  );
  root.querySelector('[data-ms-erase]')?.addEventListener('click', clearSelected, listenerOptions);
  difficulty.addEventListener('change', () => {
    if (paused) return;
    unlockAudio();
    init();
  }, listenerOptions);

  const onKeyDown = (event: KeyboardEvent) => {
    if (paused || event.target === difficulty) return;
    const key = event.key;
    if (/^[1-6]$/.test(key)) {
      event.preventDefault();
      enterDigit(Number(key));
    } else if (key === 'u' || key === 'U') doUndo();
    else if (key === 'c' || key === 'C') doCheck();
    else if (key === 'r' || key === 'R') doReveal();
    else if (key === 'Backspace') {
      event.preventDefault();
      clearSelected();
    } else if (key.startsWith('Arrow')) {
      event.preventDefault();
      unlockAudio();
      if (key === 'ArrowRight') selected = (selected + 1) % CELL_COUNT;
      if (key === 'ArrowLeft') selected = (selected + CELL_COUNT - 1) % CELL_COUNT;
      if (key === 'ArrowDown') selected = (selected + SIZE) % CELL_COUNT;
      if (key === 'ArrowUp') selected = (selected + CELL_COUNT - SIZE) % CELL_COUNT;
      render();
      (grid.children[selected] as HTMLButtonElement | undefined)?.focus();
    }
  };
  root.addEventListener('keydown', onKeyDown, listenerOptions);

  history = [];
  marks.forEach((set) => set.clear());
  if (restoreState()) render();
  else newPuzzle();
  syncMarksBtn();

  return {
    destroy() {
      listeners.abort();
      root.inert = false;
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      paused = true;
      root.inert = true;
    },
    resume() {
      paused = false;
      root.inert = false;
    },
    isPaused: () => paused,
    restart: init,
  };
}
