import { expect, test } from '@playwright/test';

import { createPuzzle, type Difficulty } from '../../src/games/mini-sudoku/engine';
import { denyOptionalServices } from './helpers/consent';
import { soundCalls, stubGameSounds } from './helpers/sounds';

const N = 6;

const cellAt = (page: import('@playwright/test').Page, index: number) =>
  page.locator('.ms__cell').nth(index);

const statusOf = (page: import('@playwright/test').Page) =>
  page.locator('[data-ms-status]').textContent() ?? '';

/** Read the rendered board as a flat 36-length array of 0-6 (0 = empty; notes are 0 here). */
async function readBoard(page: import('@playwright/test').Page): Promise<number[]> {
  return page.locator('.ms__cell').evaluateAll((cells) =>
    cells.map((c) => {
      const t = (c.textContent ?? '').trim();
      if (t === '') return 0;
      // A single filled digit or a note string; notes only appear with Marks on.
      const n = Number(t);
      return n >= 1 && n <= 6 ? n : 0;
    }),
  );
}

/** A digit 1-6 that does not conflict with the given cell's row, column, or 3x2 box. */
function validDigit(board: number[], r: number, c: number): number {
  const boxRow = Math.floor(r / 2) * 2;
  const boxCol = Math.floor(c / 3) * 3;
  const used = new Set<number>();
  for (let i = 0; i < N; i++) {
    used.add(board[r * N + i]);
    used.add(board[i * N + c]);
  }
  for (let y = boxRow; y < boxRow + 2; y++) {
    for (let x = boxCol; x < boxCol + 3; x++) used.add(board[y * N + x]);
  }
  for (let n = 1; n <= 6; n++) if (!used.has(n)) return n;
  throw new Error('No valid digit — board is broken');
}

/** Small backtracking solver for the 6x6 grid (boxes are 3 wide x 2 tall). */
function solveBoard(board: number[]): number[] {
  const b = board.slice();
  const fits = (r: number, c: number, n: number) => {
    for (let i = 0; i < N; i++) {
      if (b[r * N + i] === n || b[i * N + c] === n) return false;
    }
    const br = Math.floor(r / 2) * 2;
    const bc = Math.floor(c / 3) * 3;
    for (let y = br; y < br + 2; y++) {
      for (let x = bc; x < bc + 3; x++) if (b[y * N + x] === n) return false;
    }
    return true;
  };
  const go = (idx: number): boolean => {
    while (idx < N * N && b[idx] !== 0) idx++;
    if (idx === N * N) return true;
    const r = Math.floor(idx / N);
    const c = idx % N;
    for (let n = 1; n <= N; n++) {
      if (!fits(r, c, n)) continue;
      b[idx] = n;
      if (go(idx + 1)) return true;
      b[idx] = 0;
    }
    return false;
  };
  if (!go(0)) throw new Error('Puzzle is unsolvable');
  return b;
}

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
  await stubGameSounds(page);
});

test('mounts a 6x6 grid with 12 empty cells on easy and a digit pad', async ({ page }) => {
  await page.goto('/games/mini-sudoku/');
  await expect(page.locator('.ms__cell')).toHaveCount(36);
  expect(await page.locator('[data-ms-difficulty]').inputValue()).toBe('easy');
  const board = await readBoard(page);
  expect(board.filter((v) => v === 0)).toHaveLength(12);
  const pad = page.locator('.ms__pad-btn');
  await expect(pad).toHaveCount(7); // six digits + erase
  for (let n = 1; n <= 6; n++) {
    await expect(page.locator(`[data-ms-digit="${n}"]`)).toBeVisible();
  }
});

test('the digit pad fills the selected cell and plays place', async ({ page }) => {
  await page.goto('/games/mini-sudoku/');
  const board = await readBoard(page);
  const index = board.indexOf(0);
  const digit = validDigit(board, Math.floor(index / N), index % N);
  await cellAt(page, index).click();
  await page.locator(`[data-ms-digit="${digit}"]`).click();
  expect(await cellAt(page, index).textContent()).toBe(String(digit));
  expect(await statusOf(page)).toBe(`Filled ${digit}`);
  expect(await soundCalls(page)).toContain('place');
});

test('arrow keys keep focus inside the grid across repeated presses', async ({ page }) => {
  await page.goto('/games/mini-sudoku/');
  const board = await readBoard(page);
  const index = board.indexOf(0);
  await cellAt(page, index).click();
  const focusedLabel = () =>
    page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ?? '');
  const labelAt = (i: number) => `Row ${Math.floor(i / N) + 1}, column ${(i % N) + 1}`;
  // One step right, then three more: focus must follow every press (the pre-fix
  // rebuild dropped focus to <body> after the first arrow).
  await page.keyboard.press('ArrowRight');
  expect(await focusedLabel()).toContain(labelAt((index + 1) % 36));
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  const idx4 = (index + 4) % 36;
  expect(await focusedLabel()).toContain(labelAt(idx4));
  await page.keyboard.press('ArrowUp');
  expect(await focusedLabel()).toContain(labelAt((idx4 + 30) % 36));
  await page.keyboard.press('ArrowDown');
  expect(await focusedLabel()).toContain(labelAt(idx4));
});

test('keyboard play: typing fills, U undoes, C checks, R reveals', async ({ page }) => {
  await page.goto('/games/mini-sudoku/');
  const board = await readBoard(page);
  const index = board.indexOf(0);
  const row = Math.floor(index / N);
  const col = index % N;
  const digit = validDigit(board, row, col);
  await cellAt(page, index).click();
  // C on a fresh board: every given is correct.
  await page.keyboard.press('c');
  expect(await statusOf(page)).toBe('All filled cells are correct.');
  await page.keyboard.press(String(digit));
  expect(await cellAt(page, index).textContent()).toBe(String(digit));
  await page.keyboard.press('u');
  expect((await cellAt(page, index).textContent()) ?? '').toBe('');
  expect(await statusOf(page)).toBe('Last entry undone.');
  await page.keyboard.press('r');
  const revealed = (await cellAt(page, index).textContent()) ?? '';
  expect(revealed).toMatch(/^[1-6]$/);
  expect(await soundCalls(page)).toContain('hint');
});

test('pencil marks toggle on the selected empty cell and erase with the pad', async ({ page }) => {
  await page.goto('/games/mini-sudoku/');
  const marksBtn = page.getByRole('button', { name: 'Marks' });
  expect(await marksBtn.getAttribute('aria-pressed')).toBe('false');
  await marksBtn.click();
  expect(await marksBtn.getAttribute('aria-pressed')).toBe('true');
  const board = await readBoard(page);
  const index = board.indexOf(0);
  await cellAt(page, index).click();
  await page.keyboard.press('2');
  await page.keyboard.press('5');
  expect(await cellAt(page, index).textContent()).toBe('25');
  await expect(cellAt(page, index)).toHaveClass(/has-marks/);
  // The cell was noted, not filled.
  expect((await readBoard(page))[index]).toBe(0);
  await page.keyboard.press('5'); // toggles the note off again
  expect(await cellAt(page, index).textContent()).toBe('2');
  await page.locator('[data-ms-erase]').click();
  expect((await cellAt(page, index).textContent()) ?? '').toBe('');
});

test('completing the puzzle plays win and records the solve', async ({ page }) => {
  await page.goto('/games/mini-sudoku/');
  expect(await page.evaluate(() => localStorage.getItem('nocharge:sudoku:puzzles-solved'))).toBeNull();
  const board = await readBoard(page);
  const solved = solveBoard(board);
  for (let i = 0; i < 36; i++) {
    if (board[i] !== 0) continue;
    await cellAt(page, i).click();
    await page.locator(`[data-ms-digit="${solved[i]}"]`).click();
  }
  expect(await statusOf(page)).toBe('Puzzle complete');
  expect(await soundCalls(page)).toContain('win');
  expect(await page.evaluate(() => localStorage.getItem('nocharge:sudoku:puzzles-solved'))).toBe('1');
});

test('the in-progress puzzle survives a reload', async ({ page }) => {
  await page.goto('/games/mini-sudoku/');
  const board = await readBoard(page);
  const index = board.indexOf(0);
  // restoreState() only accepts entries that match the puzzle's unique solution,
  // so fill in the actual solution digit (the seed is persisted on first render).
  const saved = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('nocharge:sudoku:current-puzzle'))) ?? '{}',
  ) as { d?: unknown; s?: unknown };
  const solution = createPuzzle((saved.d as Difficulty) ?? 'easy', saved.s as number).solution;
  const digit = solution[Math.floor(index / N)][index % N];
  await cellAt(page, index).click();
  await page.locator(`[data-ms-digit="${digit}"]`).click();
  expect(await statusOf(page)).toBe(`Filled ${digit}`);
  await page.reload();
  expect((await cellAt(page, index).textContent()) ?? '').toBe(String(digit));
  expect(await page.evaluate(() => localStorage.getItem('nocharge:sudoku:current-puzzle'))).not.toBeNull();
  expect(await page.locator('[data-ms-difficulty]').inputValue()).toBe('easy');
});
