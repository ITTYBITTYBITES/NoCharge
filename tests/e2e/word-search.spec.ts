import { expect, test } from '@playwright/test';

import { WORD_LISTS } from '../../src/games/word-search/word-lists';
import { denyOptionalServices } from './helpers/consent';
import { soundCalls, stubGameSounds } from './helpers/sounds';

const cellAt = (page: import('@playwright/test').Page, row: number, col: number, size: number) =>
  page.locator('.ws__cell').nth(row * size + col);

const statusOf = (page: import('@playwright/test').Page) =>
  page.locator('[data-ws-status]').textContent() ?? '';

/** Read the rendered letter grid back from the DOM. */
async function readGrid(page: import('@playwright/test').Page): Promise<{ size: number; letters: string[] }> {
  return page.locator('[data-ws-grid]').evaluate((el) => {
    const cells = Array.from(el.querySelectorAll<HTMLElement>('.ws__cell'));
    return { size: Math.round(Math.sqrt(cells.length)), letters: cells.map((c) => c.textContent ?? '') };
  });
}

/** Locate a placed word in the letter grid, scanning all 8 directions from every first letter. */
function findPlacement(letters: string[], size: number, word: string): { start: { row: number; col: number }; end: { row: number; col: number } } {
  const target = word.toLowerCase();
  const at = (r: number, c: number) => letters[r * size + c];
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
  ];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (at(r, c) !== target[0]) continue;
      for (const [dr, dc] of dirs) {
        let ok = true;
        for (let i = 1; i < target.length; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size || at(rr, cc) !== target[i]) {
            ok = false;
            break;
          }
        }
        if (ok) {
          return {
            start: { row: r, col: c },
            end: { row: r + dr * (target.length - 1), col: c + dc * (target.length - 1) },
          };
        }
      }
    }
  }
  throw new Error(`Word "${word}" was not found in the rendered grid`);
}

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
  await stubGameSounds(page);
});

test('mounts an 8x8 grid with the default theme and a hidden word list', async ({ page }) => {
  await page.goto('/games/word-search/');
  await expect(page.locator('.ws__cell')).toHaveCount(64);
  await expect(page.locator('[data-ws-grid]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show word list' })).toBeVisible();
  await expect(page.locator('[data-ws-words]')).toBeHidden();
  const theme = page.locator('[data-ws-theme]');
  expect(await theme.inputValue()).toBe('animals');
  const letters = await page.locator('.ws__cell').first().textContent();
  expect(letters).toMatch(/^[A-Z]$/);
});

test('finds a straight word with two cell clicks', async ({ page }) => {
  await page.goto('/games/word-search/');
  const { size, letters } = await readGrid(page);
  const { start, end } = findPlacement(letters, size, 'cat');
  await cellAt(page, start.row, start.col, size).click();
  await cellAt(page, end.row, end.col, size).click();
  expect(await statusOf(page)).toBe('Found: cat');
  await page.getByRole('button', { name: 'Show word list' }).click();
  await expect(page.locator('[data-ws-words] li', { hasText: 'cat' })).toContainText('✓');
  expect(await soundCalls(page)).toContain('place');
});

test('completing every word locks the grid, plays win, and records the solve', async ({ page }) => {
  await page.goto('/games/word-search/');
  expect(await page.evaluate(() => localStorage.getItem('nocharge:word-search:puzzles-solved'))).toBeNull();
  const { size, letters } = await readGrid(page);
  for (const word of WORD_LISTS.animals) {
    const { start, end } = findPlacement(letters, size, word);
    await cellAt(page, start.row, start.col, size).click();
    await cellAt(page, end.row, end.col, size).click();
  }
  expect(await statusOf(page)).toBe('Puzzle complete');
  expect((await page.locator('[data-ws-grid]').getAttribute('class')) ?? '').toContain('is-locked');
  expect(await soundCalls(page)).toContain('win');
  expect(await page.evaluate(() => localStorage.getItem('nocharge:word-search:puzzles-solved'))).toBe('1');
});

test('arrow keys move the focus cursor and Enter selects cells', async ({ page }) => {
  await page.goto('/games/word-search/');
  const { size, letters } = await readGrid(page);
  const { start, end } = findPlacement(letters, size, 'dog');
  await cellAt(page, start.row, start.col, size).click();
  const keyFor = (dr: number, dc: number) =>
    dr === -1 ? 'ArrowUp' : dr === 1 ? 'ArrowDown' : dc === -1 ? 'ArrowLeft' : 'ArrowRight';
  const dr = Math.sign(end.row - start.row);
  const dc = Math.sign(end.col - start.col);
  const steps = Math.max(Math.abs(end.row - start.row), Math.abs(end.col - start.col));
  for (let i = 0; i < steps; i++) await page.keyboard.press(keyFor(dr, dc));
  // Focus must be on the end cell after the walk (roving tabIndex re-focused each step).
  const focused = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.textContent ?? '');
  expect(focused).toBe(letters[end.row * size + end.col]);
  await page.keyboard.press('Enter');
  expect(await statusOf(page)).toBe('Found: dog');
});

test('hint names only a starting letter and marks its cell', async ({ page }) => {
  await page.goto('/games/word-search/');
  await page.getByRole('button', { name: 'Hint' }).click();
  expect(await statusOf(page)).toMatch(/^Hint: starting letter [A-Z]$/);
  await expect(page.locator('.ws__cell.is-hint')).toHaveCount(1);
});

test('new puzzle asks before discarding a started puzzle', async ({ page }) => {
  await page.goto('/games/word-search/');
  const before = (await readGrid(page)).letters;
  // Nothing found yet: no confirmation, grid simply reshuffles.
  await page.getByRole('button', { name: 'New puzzle' }).click();
  const reshuffled = (await readGrid(page)).letters;
  expect(reshuffled).not.toEqual(before);
  // Start one word, then New puzzle must confirm first.
  const { size, letters } = await readGrid(page);
  const { start, end } = findPlacement(letters, size, 'cat');
  await cellAt(page, start.row, start.col, size).click();
  await cellAt(page, end.row, end.col, size).click();
  const dialogPromise = page.waitForEvent('dialog');
  await page.getByRole('button', { name: 'New puzzle' }).click();
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain('Start a new puzzle?');
  await dialog.dismiss();
  expect((await readGrid(page)).letters).toEqual(letters);
  const acceptPromise = page.waitForEvent('dialog');
  await page.getByRole('button', { name: 'New puzzle' }).click();
  await (await acceptPromise).accept();
  expect((await readGrid(page)).letters).not.toEqual(letters);
});

test('remembers the last word list theme across visits', async ({ page }) => {
  await page.goto('/games/word-search/');
  await page.selectOption('[data-ws-theme]', 'nature');
  expect(await page.evaluate(() => localStorage.getItem('nocharge:pref:word-search-last-list'))).toBe('"nature"');
  await page.reload();
  expect(await page.locator('[data-ws-theme]').inputValue()).toBe('nature');
});
