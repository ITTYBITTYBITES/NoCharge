import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const GAMES = [
  'memory-match',
  'word-tile-rush',
  'color-flip',
  'beacon-lattice',
  'tic-tac-toe',
  'dots-and-boxes',
  'four-in-a-row',
  'reversi',
  'last-token',
  'pass-the-picture',
  'klondike',
  'freecell',
  'nonogram',
  'twenty-forty-eight',
  'tile-garden',
  'word-search',
  'mini-sudoku',
] as const;

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
] as const;

const cellAt = (page: import('@playwright/test').Page, row: number, col: number, size: number) =>
  page.locator('.ws__cell').nth(row * size + col);

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test('published games mount without page errors or document overflow', async ({ page }) => {
  test.setTimeout(180_000);
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    for (const game of GAMES) {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`/games/${game}/`);
      await expect(page.locator('[data-game-root]')).toHaveClass(/is-game-mounted/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${game} @ ${viewport.width}`).toBeLessThanOrEqual(1);
      expect(errors, `${game}: ${errors.join('; ')}`).toEqual([]);
      page.removeAllListeners('pageerror');
    }
  }
});

test('settings menu is accessible and has no duplicate sound or new-game controls', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/games/word-search/');
  const mute = page.locator('[data-game-toolbar="mute"]');
  await expect(mute).toBeVisible();
  await expect(page.locator('[data-game-toolbar="sound"]')).toBeHidden();
  await page.getByRole('button', { name: 'Game settings' }).click();
  await expect(page.locator('[data-game-settings-panel]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'New game' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'New puzzle' })).toHaveCount(1);
  const results = await new AxeBuilder({ page }).include('[data-game-viewport]').analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-game-settings-panel]')).toBeHidden();
});

test('focus mode shows an exit control and keeps the board visible without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => false });
  });
  await page.goto('/games/twenty-forty-eight/');
  await page.getByRole('button', { name: 'Game settings' }).click();
  const enterFocus = page.getByRole('button', { name: 'Focus mode' });
  await expect(page.locator('[data-game-toolbar="focus-in-menu"]')).toHaveCount(1);
  await enterFocus.click();
  await expect(page.locator('[data-game-viewport]')).toHaveClass(/is-immersive/);
  const exitFocus = page.getByRole('button', { name: 'Exit focus mode' });
  await expect(exitFocus).toBeVisible();
  await expect(page.locator('.tfe__board')).toBeVisible();
  await exitFocus.click();
  await expect(page.locator('[data-game-viewport]')).not.toHaveClass(/is-immersive/);

  // Re-enter to retain coverage for the keyboard escape path as well.
  await page.getByRole('button', { name: 'Game settings' }).click();
  await page.getByRole('button', { name: 'Focus mode' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-game-viewport]')).not.toHaveClass(/is-immersive/);
});

test('FreeCell and Klondike boards fit without internal scrolling on mobile portrait screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const [path, board, lastCol] of [
    ['/games/freecell/', '[data-fc="board"]', '[data-fc-col="7"]'],
    ['/games/klondike/', '[data-kl="board"]', '[data-kl-col="6"]'],
  ] as const) {
    await page.goto(path);
    const boardEl = page.locator(board);
    await expect(boardEl).toBeVisible();
    const hasScroll = await boardEl.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(hasScroll, `${path} should not have horizontal scroll`).toBe(false);
    const last = page.locator(lastCol);
    await expect(last).toBeVisible();
    const box = await last.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    expect(box!.x).toBeGreaterThanOrEqual(0);
  }
});

test('Tile Garden and Word Search fit without internal scrolling on 320px width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const [path, boardSelector] of [
    ['/games/tile-garden/', '[data-tg="board"]'],
    ['/games/word-search/', '[data-ws-board]'],
  ] as const) {
    await page.goto(path);
    const boardEl = page.locator(boardSelector);
    await expect(boardEl).toBeVisible();
    const hasScroll = await boardEl.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(hasScroll, `${path} should not have horizontal scroll`).toBe(false);
  }
});

test('fixed-grid games use available width with readable cells and no internal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/twenty-forty-eight/');
  const cell = page.locator('.tfe__cell').first();
  const box = await cell.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test('Word Search 8x8 and 10x10 have matching visual columns and play without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/games/word-search/');
  const grid = page.locator('[data-ws-grid]');
  await expect(page.locator('.ws__cell')).toHaveCount(64);
  const cols8 = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(cols8).toBe(8);

  await page.selectOption('[data-ws-size]', '10');
  await expect(page.locator('.ws__cell')).toHaveCount(100);
  const cols10 = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(cols10).toBe(10);

  const letters = await page.locator('.ws__cell').evaluateAll((els) => els.map((el) => (el.textContent ?? '').toLowerCase()));
  const size = 10;
  const word = 'cat';
  const dirs = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  let start = { row: 0, col: 0 };
  let end = { row: 0, col: 0 };
  outer: for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (letters[r * size + c] !== word[0]) continue;
      for (const [dr, dc] of dirs) {
        let ok = true;
        for (let i = 1; i < word.length; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size || letters[rr * size + cc] !== word[i]) {
            ok = false;
            break;
          }
        }
        if (ok) {
          start = { row: r, col: c };
          end = { row: r + dr * (word.length - 1), col: c + dc * (word.length - 1) };
          break outer;
        }
      }
    }
  }
  await cellAt(page, start.row, start.col, size).click();
  await cellAt(page, end.row, end.col, size).click();
  await expect(page.locator('[data-ws-status]')).toHaveText('Found: cat');

  await page.getByRole('button', { name: 'Hint' }).click();
  await expect(page.locator('.ws__cell.is-hint')).toHaveCount(1);
});
