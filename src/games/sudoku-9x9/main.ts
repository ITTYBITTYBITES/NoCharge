import { createPuzzle, isValidMove, togglePencilMarks, type Difficulty } from './engine';
import { loadPref, savePref } from '../shared/storage';
import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import type { GameController } from '../shared/types';
import './styles.css';

const GAME_ID = 'sudoku-9x9';
const SAVED_KEY = 'nocharge:sudoku9:current-puzzle';
const SOLVED_KEY = 'nocharge:sudoku9:puzzles-solved';
const SIZE = 9;

function recordSolved(): void {
  let count = 0;
  try {
    const raw = localStorage.getItem(SOLVED_KEY);
    if (raw != null) {
      const value = Number(raw);
      count = Number.isFinite(value) ? value : 0;
    }
    localStorage.setItem(SOLVED_KEY, String(count + 1));
  } catch {
    /* storage unavailable */
  }
}

export function mountSudoku9x9(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="s9">
      <div class="s9__controls">
        <label>Difficulty
          <select data-s9-difficulty>
            <option value="easy">Easy · 42 givens</option>
            <option value="medium">Medium · 34 givens</option>
            <option value="hard">Hard · 28 givens</option>
          </select>
        </label>
        <button class="btn btn--sm" data-s9-check>Check</button>
        <button class="btn btn--sm" data-s9-reveal>Reveal cell</button>
        <button class="btn btn--sm" data-s9-undo>Undo</button>
        <button class="btn btn--sm" data-s9-marks aria-pressed="false">Marks</button>
      </div>
      <div class="s9__pad" aria-label="Digit pad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `<button class="s9__pad-btn" data-s9-digit="${digit}" aria-label="Enter ${digit}">${digit}</button>`).join('')}
        <button class="s9__pad-btn s9__pad-btn--erase" data-s9-erase aria-label="Clear selected cell">✕</button>
      </div>
      <div class="s9__grid" data-s9-grid aria-label="Sudoku 9 by 9 board"></div>
      <p class="s9__status" data-s9-status aria-live="polite"></p>
      <p class="s9__note">Every puzzle has exactly one solution, verified by the generator. Difficulty is the given-cell count — no IQ or "grade" claims. There is no timer.</p>
    </div>
  `;

  let game = createPuzzle('easy');
  let board = game.puzzle.map((row) => row.slice());
  let selected = 0;
  let history: number[][][] = [];
  let markMode = loadPref('sudoku-pencil-marks', false);
  const marks = Array.from({ length: SIZE * SIZE }, () => new Set<number>());
  let paused = false;

  const grid = root.querySelector<HTMLElement>('[data-s9-grid]')!;
  const status = root.querySelector<HTMLElement>('[data-s9-status]')!;
  const difficulty = root.querySelector<HTMLSelectElement>('[data-s9-difficulty]')!;
  const marksBtn = root.querySelector<HTMLButtonElement>('[data-s9-marks]')!;

  function cellIndex(row: number, col: number): number {
    return row * SIZE + col;
  }

  function saveState(): void {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify({ difficulty: difficulty.value, seed: game.seed, board }));
    } catch {
      /* storage unavailable */
    }
  }

  function restoreState(): boolean {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return false;
      const value = JSON.parse(raw) as { difficulty?: unknown; seed?: unknown; board?: unknown };
      if (typeof value.seed !== 'number' || typeof value.difficulty !== 'string' || !Array.isArray(value.board)) return false;
      if (!['easy', 'medium', 'hard'].includes(value.difficulty)) return false;
      const restored = createPuzzle(value.difficulty as Difficulty, value.seed);
      const boardValue = value.board as unknown[];
      if (boardValue.length !== SIZE) return false;
      for (let row = 0; row < SIZE; row += 1) {
        const rowValue = boardValue[row];
        if (!Array.isArray(rowValue) || (rowValue as unknown[]).length !== SIZE) return false;
        for (let col = 0; col < SIZE; col += 1) {
          const cell = (rowValue as unknown[])[col] as number;
          if (!Number.isInteger(cell) || cell < 0 || cell > 9) return false;
          if (cell !== 0 && restored.solution[row]![col] !== cell) return false;
        }
      }
      difficulty.value = value.difficulty;
      game = restored;
      board = (value.board as number[][]).map((row) => row.slice());
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
    for (const set of marks) set.clear();
    newPuzzle();
  }

  function syncMarksBtn(): void {
    marksBtn.setAttribute('aria-pressed', String(markMode));
  }

  function render(): void {
    const hadFocus = grid.contains(document.activeElement);
    grid.innerHTML = '';
    for (let index = 0; index < SIZE * SIZE; index += 1) {
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 's9__cell';
      if (row % 3 === 2) button.classList.add('s9__cell--box-bottom');
      if (col % 3 === 2) button.classList.add('s9__cell--box-right');
      button.classList.toggle('is-selected', index === selected);
      const value = board[row]![col]!;
      const notes = Array.from(marks[index]!).sort().join('');
      if (value) {
        button.textContent = String(value);
        button.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}: ${value}`);
      } else if (notes) {
        button.classList.add('has-marks');
        button.textContent = notes;
        button.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, notes ${notes.split('').join(', ')}`);
      } else {
        button.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, empty`);
      }
      button.tabIndex = index === selected ? 0 : -1;
      button.addEventListener('click', () => {
        selected = index;
        render();
      });
      grid.append(button);
    }
    if (hadFocus) (grid.children[selected] as HTMLButtonElement | undefined)?.focus();
    saveState();
  }

  function fill(digit: number): void {
    const row = Math.floor(selected / SIZE);
    const col = selected % SIZE;
    if (!isValidMove(board, row, col, digit)) {
      status.textContent = 'That digit conflicts with this row, column, or box.';
      void play('error');
      return;
    }
    history.push(board.map((rowValue) => rowValue.slice()));
    board[row]![col] = digit;
    status.textContent = `Filled ${digit}.`;
    void play('place');
    render();
    signalMeaningfulGameInteraction(root);
    if (board.every((rowValue, rowIndex) => rowValue.every((cell, colIndex) => cell === game.solution[rowIndex]![colIndex]))) {
      status.textContent = 'Puzzle complete. Every digit matches the unique solution.';
      recordSolved();
      void play('win');
    }
  }

  function enterDigit(digit: number): void {
    const row = Math.floor(selected / SIZE);
    const col = selected % SIZE;
    if (markMode) {
      if (board[row]![col]) {
        status.textContent = 'Clear the cell before adding notes.';
        return;
      }
      marks[selected] = togglePencilMarks(marks[selected], digit);
      void play('place');
      render();
      return;
    }
    fill(digit);
  }

  function clearSelected(): void {
    const row = Math.floor(selected / SIZE);
    const col = selected % SIZE;
    if (board[row]![col]) {
      history.push(board.map((rowValue) => rowValue.slice()));
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
    const wrong = board.some((row, rowIndex) =>
      row.some((cell, colIndex) => cell !== 0 && cell !== game.solution[rowIndex]![colIndex]),
    );
    status.textContent = wrong ? 'Some filled cells need another look.' : 'All filled cells are correct.';
    if (wrong) void play('error');
  }

  function doReveal(): void {
    const row = Math.floor(selected / SIZE);
    const col = selected % SIZE;
    if (!board[row]![col]) {
      history.push(board.map((rowValue) => rowValue.slice()));
      board[row]![col] = game.solution[row]![col]!;
      marks[selected] = new Set();
      status.textContent = `Revealed ${board[row]![col]}.`;
      void play('hint');
      render();
    } else {
      status.textContent = 'Selected cell already has a digit.';
    }
  }

  function doUndo(): void {
    const previous = history.pop();
    if (previous) {
      board = previous;
      render();
      status.textContent = 'Last entry undone.';
    } else {
      status.textContent = 'Nothing to undo.';
    }
  }

  root.querySelector<HTMLButtonElement>('[data-s9-check]')!.addEventListener('click', doCheck);
  root.querySelector<HTMLButtonElement>('[data-s9-reveal]')!.addEventListener('click', doReveal);
  root.querySelector<HTMLButtonElement>('[data-s9-undo]')!.addEventListener('click', doUndo);
  marksBtn.addEventListener('click', () => {
    markMode = !markMode;
    savePref('sudoku-pencil-marks', markMode);
    syncMarksBtn();
    status.textContent = markMode ? 'Marks on: digits add notes to the empty cell.' : 'Marks off: digits fill the cell.';
    render();
  });
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-s9-digit]')) {
    button.addEventListener('click', () => enterDigit(Number(button.dataset.s9Digit)));
  }
  root.querySelector<HTMLButtonElement>('[data-s9-erase]')!.addEventListener('click', clearSelected);
  difficulty.addEventListener('change', init);
  root.addEventListener('keydown', (event) => {
    if (event.target === difficulty) return;
    const key = event.key;
    if (/^[1-9]$/.test(key)) {
      event.preventDefault();
      enterDigit(Number(key));
    } else if (key === 'u' || key === 'U') doUndo();
    else if (key === 'c' || key === 'C') doCheck();
    else if (key === 'r' || key === 'R') doReveal();
    else if (key === 'Backspace') {
      event.preventDefault();
      clearSelected();
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      selected = (selected + 1) % (SIZE * SIZE);
      render();
      (grid.children[selected] as HTMLButtonElement | undefined)?.focus();
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      selected = (selected + SIZE * SIZE - 1) % (SIZE * SIZE);
      render();
      (grid.children[selected] as HTMLButtonElement | undefined)?.focus();
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      selected = (selected + SIZE) % (SIZE * SIZE);
      render();
      (grid.children[selected] as HTMLButtonElement | undefined)?.focus();
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      selected = (selected + SIZE * SIZE - SIZE) % (SIZE * SIZE);
      render();
      (grid.children[selected] as HTMLButtonElement | undefined)?.focus();
    }
  });

  syncMarksBtn();
  unlockAudio();
  if (restoreState()) render();
  else init();

  return {
    destroy() {
      root.innerHTML = '';
    },
    pause(_reason?: unknown) {
      paused = true;
    },
    resume() {
      paused = false;
    },
    isPaused() {
      return paused;
    },
    restart() {
      init();
    },
  };
}
