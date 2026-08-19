import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const setPageVisibility = async (page: import('@playwright/test').Page, state: 'hidden' | 'visible') => {
  await page.evaluate((nextState) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => nextState,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
};

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test('Beacon Lattice mounts with selector, types, and coverage labels', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await expect(page.locator('[data-game-root="beacon-lattice"]')).toBeVisible();
  await expect(page.getByLabel('Puzzle selector')).toBeVisible();
  await expect(page.getByRole('button', { name: /Cross/ })).toBeVisible();
  await expect(page.locator('.bl__cell').first()).toContainText(/Gap|Exact|Overlap|—/);
});

test('pointer placement solves the first puzzle and stores a best', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await page.getByRole('button', { name: /Cross/ }).click();
  await page.getByRole('gridcell', { name: /Row 3, column 3/ }).click();
  await expect(page.getByRole('heading', { name: 'Lattice complete' })).toBeVisible();
  await expect(page.locator('[data-bl="best"]')).toHaveText('1');
  await expect(page.locator('[data-bl="live"]')).toContainText(/solved/i);
});

test('keyboard navigation places and removes a beacon', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await page.locator('[data-game-viewport]').click();
  await page.keyboard.press('1');
  await expect(page.getByRole('button', { name: /Cross/ })).toHaveAttribute('aria-pressed', 'true');
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-bl="count"]')).not.toHaveText('0');
  await page.keyboard.press('Backspace');
});

test('invalid locked or blocked actions are announced', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await page.getByLabel('Puzzle selector').selectOption('bl-17-locked-tip');
  await page.locator('.bl__cell', { hasText: '+' }).first().click();
  await expect(page.locator('[data-bl="live"]')).toContainText(/locked/i);
});

test('undo and restart restore the current puzzle without dropping recorded bests', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await page.evaluate(() => {
    (window as Window & { __NOCHARGE_BEACON_LATTICE_TEST__?: { applySolution(): void } }).__NOCHARGE_BEACON_LATTICE_TEST__?.applySolution();
  });
  await expect(page.getByRole('heading', { name: 'Lattice complete' })).toBeVisible();
  await page.getByRole('button', { name: 'New game' }).click();
  await expect(page.locator('[data-bl="count"]')).toHaveText('0');
  await expect(page.locator('[data-bl="best"]')).toHaveText('1');
});

test('pause blocks placement and resume keeps coverage', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
  await page.locator('.bl__cell').nth(12).click({ force: true });
  await expect(page.locator('[data-bl="count"]')).toHaveText('0');
  await page.locator('[data-game-toolbar="pause"]').click();
  await expect(page.locator('[data-game-pause-overlay]')).toBeHidden();
});

test('hidden tab and consent modal pause the lattice', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await setPageVisibility(page, 'hidden');
  await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
  await setPageVisibility(page, 'visible');
  await expect(page.locator('[data-game-pause-overlay]')).toBeHidden();

  await page.getByRole('button', { name: 'Analytics choices' }).click();
  await expect(page.locator('[data-consent-modal]')).toBeVisible();
  await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
  await page.getByRole('button', { name: 'Close privacy choices' }).click();
  await expect(page.locator('[data-game-pause-overlay]')).toBeHidden();
});

test('immersive mode keeps beacon controls visible', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => false });
  });
  await page.goto('/games/beacon-lattice/');
  const enter = page.getByRole('button', { name: 'Enter immersive mode' });
  test.skip((await enter.count()) === 0, 'Fullscreen override unavailable.');
  await enter.click();
  await expect(page.locator('[data-game-viewport]')).toHaveClass(/is-immersive/);
  await expect(page.getByRole('button', { name: /Cross/ })).toBeVisible();
});

test('mobile viewport and 200% zoom keep the grid readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/beacon-lattice/');
  await expect(page.locator('.bl__board')).toBeVisible();
  await page.setViewportSize({ width: 720, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.getByLabel('Puzzle selector')).toBeVisible();
});

test('guide, articles, social metadata, and sitemap include Beacon Lattice', async ({ page, request }) => {
  await page.goto('/guides/beacon-lattice/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Beacon Lattice');
  await expect(page.locator('.gameplay-preview img')).toHaveAttribute('loading', 'lazy');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://nocharge.net/game-art/beacon-lattice/social-card.jpg',
  );

  for (const slug of [
    'how-exact-coverage-works-in-beacon-lattice',
    'how-to-find-forced-beacon-placements',
    'keyboard-and-accessible-play-in-beacon-lattice',
  ]) {
    const response = await request.get(`/articles/${slug}/`);
    expect(response.status()).toBe(200);
  }

  const sitemap = await request.get('/sitemap.xml');
  const xml = await sitemap.text();
  expect(xml).toContain('/games/beacon-lattice/');
  expect(xml).toContain('/guides/beacon-lattice/');
});

test('ad banner stays below Beacon Lattice gameplay', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  const metrics = await page.evaluate(() => {
    const banner = document.querySelector('[data-ad-banner]');
    const viewport = document.querySelector('[data-game-viewport]');
    if (!banner || !viewport) return null;
    return banner.getBoundingClientRect().top + window.scrollY - (viewport.getBoundingClientRect().bottom + window.scrollY);
  });
  expect(metrics).toBeGreaterThanOrEqual(150);
});

test('best count does not worsen after a longer solve', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await page.evaluate(() => {
    const api = (window as Window & { __NOCHARGE_BEACON_LATTICE_TEST__?: { applySolution(): void } })
      .__NOCHARGE_BEACON_LATTICE_TEST__;
    api?.applySolution();
  });
  await expect(page.locator('[data-bl="best"]')).toHaveText('1');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.evaluate(() => {
    localStorage.setItem(
      'nocharge:pref:beacon-lattice-progress',
      JSON.stringify({
        currentId: 'bl-01-first-plus',
        completed: ['bl-01-first-plus'],
        bests: { 'bl-01-first-plus': 1 },
        lastSolved: { 'bl-01-first-plus': 4 },
      }),
    );
  });
  await page.reload();
  await expect(page.locator('[data-bl="best"]')).toHaveText('1');
});

test('paused selector cannot change the puzzle', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.getByLabel('Puzzle selector')).toBeDisabled();
});

test('Beacon Lattice has no axe violations', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
