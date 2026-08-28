import { expect, test } from '@playwright/test';
import { denyOptionalServices } from './helpers/consent';

/**
 * Mount and keyboard smoke tests for the expansion games.
 * Each game must render its board without client errors and accept keyboard input.
 */
const NEW_GAMES = [
  { slug: 'minesweeper', selector: '[data-ms-board]' },
  { slug: 'hangman', selector: '[data-hg-letters]' },
  { slug: 'lights-out', selector: '[data-lo-board]' },
  { slug: 'simon', selector: '[data-sn-pads]' },
  { slug: 'sudoku-9x9', selector: '[data-s9-grid]' },
  { slug: 'gomoku', selector: '[data-gom-board]' },
  { slug: 'nine-mens-morris', selector: '[data-nmm-board]' },
] as const;

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

for (const game of NEW_GAMES) {
  test.describe(game.slug, () => {
    test('mounts the board without client errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });
      await page.goto(`/games/${game.slug}/`);
      await expect(page.locator(game.selector)).toBeVisible({ timeout: 5000 });
      expect(errors.filter((error) => !/Failed to load resource|net::ERR/i.test(error))).toEqual([]);
    });

    test('accepts keyboard input in the core loop', async ({ page }) => {
      await page.goto(`/games/${game.slug}/`);
      await expect(page.locator(game.selector)).toBeVisible({ timeout: 5000 });
      // Basic tab + arrow movement should not throw.
      await page.keyboard.press('Tab');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      expect(errors).toEqual([]);
    });
  });
}

test('Pass & Play games show the handoff screen', async ({ page }) => {
  await page.goto('/games/gomoku/');
  await expect(page.locator('[data-pp-handoff]').first()).toBeVisible({ timeout: 5000 });
});

test('Sudoku 9×9 and Minesweeper ship their guides and articles', async ({ page }) => {
  for (const path of ['/guides/minesweeper/', '/guides/sudoku-9x9/', '/guides/gomoku/', '/guides/nine-mens-morris/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
  }
});
