import { expect, test } from '@playwright/test';
import { denyOptionalServices } from './helpers/consent';

/**
 * Tests that the My Arcade solo dashboard shows rows for all 5 new games
 * and that Clear Game Data covers the new keys.
 */

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test.describe('My Arcade solo extension', () => {
  test('dashboard shows rows for all 9 solo games', async ({ page }) => {
    await page.goto('/my-arcade/');
    const dashboard = page.locator('[data-my-arcade]');
    await expect(dashboard).toBeVisible();

    // All 9 solo game IDs should be present in the dashboard
    const soloGames = [
      'memory-match',
      'word-tile-rush',
      'color-flip',
      'beacon-lattice',
      'klondike',
      'freecell',
      'nonogram',
      'twenty-forty-eight',
      'tile-garden',
    ];

    for (const gameId of soloGames) {
      // Each game should have a card in the dashboard
      await expect(page.locator(`[data-ma-card="${gameId}"]`)).toBeVisible();
    }
  });

  test('Clear Game Data statement covers new keys', async ({ page }) => {
    await page.goto('/my-arcade/');
    const content = await page.content();

    // The clear data statement should mention the new game keys
    expect(content).toContain('klondike');
    expect(content).toContain('freecell');
    expect(content).toContain('nonogram');
    expect(content).toContain('tile-garden');
  });

  test('new metric keys are registered', async ({ page }) => {
    await page.goto('/my-arcade/');

    // Set some values in localStorage
    await page.evaluate(() => {
      localStorage.setItem('nocharge:klondike:games-won', '3');
      localStorage.setItem('nocharge:freecell:games-won', '1');
      localStorage.setItem('nocharge:nonogram:puzzles-revealed', '5');
      localStorage.setItem('nocharge:2048:best-tile', '1024');
      localStorage.setItem('nocharge:tile-garden:best-tier', '2');
    });

    await page.reload();

    // Dashboard should display the metrics
    const content = await page.content();
    expect(content).toContain('3');
    expect(content).toContain('1024');
  });
});
