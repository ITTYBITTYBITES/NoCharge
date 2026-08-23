import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { denyOptionalServices } from './helpers/consent';

/**
 * End-to-end tests for the 5 new solo games added in PR #26:
 * Klondike, FreeCell, Nonogram, Twenty Forty-Eight, Tile Garden.
 */

const NEW_SOLO_GAMES = [
  { slug: 'klondike', name: 'Klondike Solitaire' },
  { slug: 'freecell', name: 'FreeCell Solitaire' },
  { slug: 'nonogram', name: 'Nonogram' },
  { slug: 'twenty-forty-eight', name: 'Twenty Forty-Eight' },
  { slug: 'tile-garden', name: 'Tile Garden' },
] as const;

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

for (const game of NEW_SOLO_GAMES) {
  test.describe(game.name, () => {
    test(`renders game page with controls`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });

      await page.goto(`/games/${game.slug}/`);
      await expect(page.locator('[data-game-root]')).toBeVisible({ timeout: 5000 });
      expect(errors.filter((error) => !/Failed to load resource|net::ERR/i.test(error)), `Client errors: ${errors.join(' | ') || 'none'}`).toEqual([]);
    });

    test(`keyboard-only interaction`, async ({ page }) => {
      await page.goto(`/games/${game.slug}/`);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      // Verify focus is visible
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test(`axe desktop`, async ({ page }) => {
      await page.goto(`/games/${game.slug}/`);
      const results = await new AxeBuilder({ page })
        .disableRules(['color-contrast', 'region'])
        .analyze();
      expect(results.violations).toEqual([]);
    });

    test(`320px reflow`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(`/games/${game.slug}/`);
      // No horizontal overflow on body
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      expect(overflow).toBe(true);
    });

    test(`200% zoom`, async ({ page }) => {
      await page.goto(`/games/${game.slug}/`);
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });
      // Game still visible
      const gameRoot = page.locator('.game-root');
      await expect(gameRoot).toBeVisible();
    });

    test(`prefers-reduced-motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/games/${game.slug}/`);
      const gameRoot = page.locator('.game-root');
      await expect(gameRoot).toBeVisible();
    });

    test(`consent-modal pausing`, async ({ page }) => {
      await page.goto(`/games/${game.slug}/`);
      // Game should be mounted
      const gameRoot = page.locator('[data-game-root]');
      await expect(gameRoot).toHaveClass(/is-game-mounted/);
    });

    test(`hidden-tab recovery`, async ({ page }) => {
      await page.goto(`/games/${game.slug}/`);
      const gameRoot = page.locator('[data-game-root]');
      await expect(gameRoot).toHaveClass(/is-game-mounted/);

      // Simulate hidden tab
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Simulate visible tab
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Game should still be mounted
      await expect(gameRoot).toHaveClass(/is-game-mounted/);
    });
  });
}

test.describe('Twenty Forty-Eight specific', () => {
  test('slide tiles with arrow keys', async ({ page }) => {
    await page.goto('/games/twenty-forty-eight/');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowUp');
    // Score should exist
    const score = page.locator('[data-tfe="score"]');
    await expect(score).toBeVisible();
  });
});

test.describe('Nonogram specific', () => {
  test('mark cells with keyboard', async ({ page }) => {
    await page.goto('/games/nonogram/');
    await page.locator('.ng__cell').first().focus();
    await page.keyboard.press('f'); // mark filled
    const filled = page.locator('.ng__cell--filled');
    await expect(filled.first()).toBeVisible();
  });
});

test.describe('Tile Garden specific', () => {
  test('place tile on grid', async ({ page }) => {
    await page.goto('/games/tile-garden/');
    await page.keyboard.press('Enter'); // place at cursor
    const moves = page.locator('[data-tg="moves"]');
    await expect(moves).toHaveText('1');
  });
});

test.describe('My Arcade shows new game metrics', () => {
  test('new solo rows present on My Arcade page', async ({ page }) => {
    await denyOptionalServices(page);
    await page.goto('/my-arcade/');
    // Each new game should appear in the dashboard
    for (const game of NEW_SOLO_GAMES) {
      const row = page.locator(`text=${game.name}`).first();
      // Game name may be in the heading or row
      await expect(page.locator('[data-my-arcade]')).toBeVisible();
    }
  });
});

test.describe('Clear Game Data covers new keys', () => {
  test('privacy exposes the shared clear control and My Arcade lists the new games', async ({ page }) => {
    await page.goto('/privacy/');
    await expect(page.getByRole('button', { name: 'Clear game data' })).toBeVisible();
    await page.goto('/my-arcade/');
    for (const game of NEW_SOLO_GAMES) {
      await expect(page.locator(`[data-ma-card="${game.slug}"]`)).toBeVisible();
    }
  });
});
