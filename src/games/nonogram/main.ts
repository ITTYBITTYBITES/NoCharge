import { play, unlockAudio } from '../shared/audio';
import type { GameController } from '../shared/types';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import {
  type NonogramState,
  createGame,
  toggleCell,
  markCell,
  undo as engineUndo,
  computeClues,
  isRowSatisfied,
  isColSatisfied,
} from './engine';
import { PUZZLES_5x5, PUZZLES_10x10 } from './puzzles';
import './styles.css';

const PUZZLES_REVEALED_KEY = 'nocharge:nonogram:puzzles-revealed';

export function mountNonogram(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="ng">
      <div class="ng__hud">
        <div class="ng__stats" aria-live="polite">
          <span>Moves <strong data-ng="moves">0</strong></span>
          <span>Revealed <strong data-ng="revealed">0</strong></span>
          <span data-ng="puzzle-title"></span>
        </div>
        <div class="ng__controls">
          <button type="button" class="btn btn--sm" data-ng="size-toggle">5×5</button>
          <button type="button" class="btn btn--sm" data-ng="undo-btn">Undo</button>
          <button type="button" class="btn btn--sm" data-ng="next-btn">Next puzzle</button>
          <button type="button" class="btn btn--sm" data-ng="clues-btn">Show clues as text</button>
        </div>
      </div>
      <div class="ng__board" data-ng="board" role="group" aria-label="Nonogram grid"></div>
      <div class="ng__clues-text" data-ng="clues-text" hidden aria-live="polite"></div>
      <div class="ng__overlay" data-ng="overlay" hidden>
        <h2>Picture revealed</h2>
        <p data-ng="result" aria-live="polite"></p>
        <button type="button" class="btn" data-ng="next-overlay">Next puzzle</button>
      </div>
    </div>
  `;

  const movesEl = root.querySelector<HTMLElement>('[data-ng="moves"]')!;
  const revealedEl = root.querySelector<HTMLElement>('[data-ng="revealed"]')!;
  const puzzleTitleEl = root.querySelector<HTMLElement>('[data-ng="puzzle-title"]')!;
  const sizeToggle = root.querySelector<HTMLButtonElement>('[data-ng="size-toggle"]')!;
  const undoBtn = root.querySelector<HTMLButtonElement>('[data-ng="undo-btn"]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-ng="next-btn"]')!;
  const cluesBtn = root.querySelector<HTMLButtonElement>('[data-ng="clues-btn"]')!;
  const boardEl = root.querySelector<HTMLElement>('[data-ng="board"]')!;
  const cluesTextEl = root.querySelector<HTMLElement>('[data-ng="clues-text"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-ng="overlay"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-ng="result"]')!;
  const nextOverlayBtn = root.querySelector<HTMLButtonElement>('[data-ng="next-overlay"]')!;

  let state: NonogramState;
  let paused = false;
  let currentSize: 5 | 10 = 5;
  let puzzleIndex = 0;
  let cursorRow = 0;
  let cursorCol = 0;
  let showCluesText = false;
  let revealed = loadRevealedCount();
  // Rendering also happens for focus movement and clue toggles. Record a
  // completed puzzle once, rather than incrementing on every later render.
  let solutionRecorded = false;

  function loadRevealedCount(): number {
    try {
      const raw = localStorage.getItem(PUZZLES_REVEALED_KEY);
      if (raw == null) return 0;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    } catch { return 0; }
  }

  function saveRevealedCount(count: number): void {
    try { localStorage.setItem(PUZZLES_REVEALED_KEY, String(count)); } catch { /* */ }
  }

  function init(size?: 5 | 10) {
    if (size) currentSize = size;
    const pool = currentSize === 5 ? PUZZLES_5x5 : PUZZLES_10x10;
    puzzleIndex = puzzleIndex % pool.length;
    const puzzle = pool[puzzleIndex]!;
    state = createGame(puzzle);
    solutionRecorded = false;
    cursorRow = 0;
    cursorCol = 0;
    overlay.hidden = true;
    render();
  }

  function render() {
    const clues = computeClues(state.puzzle.solution);
    const size = state.puzzle.size;

    movesEl.textContent = String(state.moves);
    revealedEl.textContent = String(revealed);
    puzzleTitleEl.textContent = `${state.puzzle.title} (${state.puzzle.theme})`;
    sizeToggle.textContent = currentSize === 5 ? '5×5' : '10×10';

    // Build grid
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `auto repeat(${size}, 1fr)`;
    boardEl.style.gridTemplateRows = `auto repeat(${size}, 1fr)`;

    // Column clues header row
    const corner = document.createElement('div');
    corner.className = 'ng__corner';
    boardEl.appendChild(corner);

    for (let c = 0; c < size; c++) {
      const clueEl = document.createElement('div');
      clueEl.className = 'ng__col-clue';
      const satisfied = isColSatisfied(state.grid, c, clues.cols[c]!);
      if (satisfied) clueEl.classList.add('is-satisfied');
      clueEl.textContent = clues.cols[c]!.join(' ');
      boardEl.appendChild(clueEl);
    }

    // Rows
    for (let r = 0; r < size; r++) {
      const rowClue = document.createElement('div');
      rowClue.className = 'ng__row-clue';
      const satisfied = isRowSatisfied(state.grid, r, clues.rows[r]!);
      if (satisfied) rowClue.classList.add('is-satisfied');
      rowClue.textContent = clues.rows[r]!.join(' ');
      boardEl.appendChild(rowClue);

      for (let c = 0; c < size; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'ng__cell';
        cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}: ${state.grid[r]![c]}`);
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);

        const cellState = state.grid[r]![c];
        if (cellState === 'filled') cell.classList.add('ng__cell--filled');
        else if (cellState === 'empty') cell.classList.add('ng__cell--empty');

        if (r === cursorRow && c === cursorCol) cell.classList.add('ng__cell--cursor');

        // Native click covers mouse, touch, Enter, and Space. The old
        // pointerdown-only handler made focused cells inert for keyboard users.
        cell.addEventListener('click', () => {
          handleCellClick(r, c);
        });

        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          handleCellRightClick(r, c);
        });

        boardEl.appendChild(cell);
      }
    }

    // Clues text panel
    if (showCluesText) {
      cluesTextEl.hidden = false;
      cluesTextEl.innerHTML = renderCluesText(clues);
    } else {
      cluesTextEl.hidden = true;
    }

    if (state.solved && !solutionRecorded) {
      solutionRecorded = true;
      revealed++;
      saveRevealedCount(revealed);
      resultEl.textContent = `${state.puzzle.title} revealed in ${state.moves} moves.`;
      overlay.hidden = false;
      void play('win');
    }
  }

  function renderCluesText(clues: { rows: number[][]; cols: number[][] }): string {
    let html = '<h3>Row clues</h3><ul>';
    for (let r = 0; r < clues.rows.length; r++) {
      html += `<li>Row ${r + 1}: ${clues.rows[r]!.join(', ')}</li>`;
    }
    html += '</ul><h3>Column clues</h3><ul>';
    for (let c = 0; c < clues.cols.length; c++) {
      html += `<li>Column ${c + 1}: ${clues.cols[c]!.join(', ')}</li>`;
    }
    html += '</ul>';
    return html;
  }

  function focusCursor() {
    boardEl.querySelector<HTMLButtonElement>(`.ng__cell[data-row="${cursorRow}"][data-col="${cursorCol}"]`)?.focus();
  }

  function handleCellClick(row: number, col: number) {
    if (paused || state.solved) return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);
    cursorRow = row;
    cursorCol = col;

    // Left click cycles: unknown → filled → empty → unknown
    const result = toggleCell(state, row, col);
    if (result) {
      cueNonogramMark(state, result, row, col);
      state = result;
      render();
      focusCursor();
    }
  }

  function handleCellRightClick(row: number, col: number) {
    if (paused || state.solved) return;
    cursorRow = row;
    cursorCol = col;
    const result = markCell(state, row, col, 'empty');
    if (result) {
      cueNonogramMark(state, result, row, col);
      state = result;
      render();
      focusCursor();
    }
  }

  function cueNonogramMark(before: NonogramState, after: NonogramState, row: number, col: number) {
    void play('place');
    const clues = computeClues(after.puzzle.solution);
    const rowNow = isRowSatisfied(after.grid, row, clues.rows[row]!);
    const colNow = isColSatisfied(after.grid, col, clues.cols[col]!);
    const rowWas = isRowSatisfied(before.grid, row, clues.rows[row]!);
    const colWas = isColSatisfied(before.grid, col, clues.cols[col]!);
    if ((!rowWas && rowNow) || (!colWas && colNow)) void play('hint');
    if (after.grid[row]![col] === 'filled' && after.puzzle.solution[row]![col] === false) void play('error');
  }

  function handleUndo() {
    if (paused) return;
    const result = engineUndo(state);
    if (result) { state = result; render(); }
  }

  function handleNext() {
    puzzleIndex++;
    init();
  }

  function handleSizeToggle() {
    currentSize = currentSize === 5 ? 10 : 5;
    puzzleIndex = 0;
    init(currentSize);
  }

  function handleCluesToggle() {
    showCluesText = !showCluesText;
    cluesBtn.textContent = showCluesText ? 'Hide clues text' : 'Show clues as text';
    render();
  }

  sizeToggle.addEventListener('click', handleSizeToggle);
  undoBtn.addEventListener('click', handleUndo);
  nextBtn.addEventListener('click', handleNext);
  nextOverlayBtn.addEventListener('click', handleNext);
  cluesBtn.addEventListener('click', handleCluesToggle);

  // Keyboard
  root.addEventListener('keydown', (e) => {
    if (paused) return;
    const size = state.puzzle.size;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); cursorRow = (cursorRow - 1 + size) % size; render(); focusCursor(); break;
      case 'ArrowDown': e.preventDefault(); cursorRow = (cursorRow + 1) % size; render(); focusCursor(); break;
      case 'ArrowLeft': e.preventDefault(); cursorCol = (cursorCol - 1 + size) % size; render(); focusCursor(); break;
      case 'ArrowRight': e.preventDefault(); cursorCol = (cursorCol + 1) % size; render(); focusCursor(); break;
      case 'f': case 'F':
        e.preventDefault();
        {
          const result = markCell(state, cursorRow, cursorCol, 'filled');
          if (result) { cueNonogramMark(state, result, cursorRow, cursorCol); state = result; render(); focusCursor(); }
        }
        break;
      case 'x': case 'X': case ' ':
        e.preventDefault();
        {
          const result = markCell(state, cursorRow, cursorCol, 'empty');
          if (result) { state = result; void play('move'); render(); focusCursor(); }
        }
        break;
      case 'u': case 'U':
        e.preventDefault();
        handleUndo();
        break;
    }
  });

  init();

  return {
    destroy() { root.innerHTML = ''; },
    pause() { paused = true; },
    resume() { paused = false; },
    isPaused: () => paused,
    restart: () => init(),
  };
}
