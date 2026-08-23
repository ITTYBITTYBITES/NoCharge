import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const gamePaths = ['/games/memory-match/', '/games/word-tile-rush/', '/games/color-flip/', '/games/beacon-lattice/'] as const;
const articleSlugs = [
  'memory-match-systematic-board-scan',
  'how-move-counting-works-in-matching-games',
  'keyboard-strategy-for-memory-match',
  'word-tile-rush-longer-word-scoring',
  'how-diagonal-letter-paths-work',
  'managing-a-rising-word-game-grid',
  'understanding-the-four-color-cycle',
  'timing-a-color-change-near-tile-boundaries',
  'visual-mode-versus-turn-based-color-flip',
  'how-exact-coverage-works-in-beacon-lattice',
  'how-to-find-forced-beacon-placements',
  'keyboard-and-accessible-play-in-beacon-lattice',
] as const;

const setVisibility = async (page: import('@playwright/test').Page, state: 'hidden' | 'visible') => {
  await page.evaluate((nextState) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => nextState,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
};

const setVisibilityWithoutEvent = async (page: import('@playwright/test').Page, state: 'hidden' | 'visible') => {
  await page.evaluate((nextState) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => nextState,
    });
  }, state);
};

const resumeFromOverlay = (page: import('@playwright/test').Page) =>
  page.locator('[data-game-pause-resume]');

test.describe('shared game lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await denyOptionalServices(page);
  });

  test('renders one shared toolbar for every current game', async ({ page }) => {
    for (const path of gamePaths) {
      await page.goto(path);
      const viewport = page.locator('[data-game-viewport]');
      await expect(viewport.getByRole('button', { name: /Pause game/ })).toBeVisible();
      await expect(viewport.getByRole('button', { name: /Mute game sound/ })).toBeVisible();
      await expect(viewport.getByRole('button', { name: /Enter (full screen|immersive mode)/ })).toBeVisible();
      await expect(viewport.getByRole('button', { name: 'New game' })).toBeVisible();
    }
  });

  test('keeps the desktop Memory Match board compact enough to view as one play area', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/games/memory-match/');
    const metrics = await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>('[data-game-root="memory-match"]')!;
      const viewport = document.querySelector<HTMLElement>('[data-game-viewport]')!;
      return {
        rootWidth: root.getBoundingClientRect().width,
        viewportHeight: viewport.getBoundingClientRect().height,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    expect(metrics.rootWidth).toBeLessThanOrEqual(608);
    expect(metrics.viewportHeight).toBeLessThanOrEqual(780);
    expect(metrics.hasHorizontalOverflow).toBe(false);
  });

  test('pauses Memory Match without resetting revealed cards or allowing input', async ({ page }) => {
    await page.goto('/games/memory-match/');
    const cards = page.locator('.mm__card');
    await cards.nth(0).click();
    await expect(cards.nth(0)).toHaveClass(/is-flipped/);

    await page.getByRole('button', { name: 'Pause game' }).click();
    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    await cards.nth(1).click({ force: true });
    await expect(cards.nth(1)).not.toHaveClass(/is-flipped/);
    await expect(page.locator('[data-mm="moves"]')).toHaveText('0');

    await page.locator('[data-game-toolbar="pause"]').click();
    await cards.nth(1).click();
    await expect(cards.nth(1)).toHaveClass(/is-flipped/);
  });

  test('pauses Word Tile Rush with its selected path and a stopped interval', async ({ page }) => {
    await page.goto('/games/word-tile-rush/');
    const firstLetter = page.locator('.wtr__cell:not(:disabled)').first();
    const coordinates = await firstLetter.evaluate((cell) => ({ r: cell.dataset.r, c: cell.dataset.c }));
    const selectedLetter = page.locator(`.wtr__cell[data-r="${coordinates.r}"][data-c="${coordinates.c}"]`);
    await firstLetter.focus();
    await page.keyboard.press('Enter');
    await expect(selectedLetter).toHaveAttribute('aria-pressed', 'true');
    const before = await page.locator('.wtr__cell').allTextContents();

    await page.getByRole('button', { name: 'Pause game' }).click();
    await page.waitForTimeout(3_050);
    await expect(selectedLetter).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.wtr__cell')).toHaveText(before);

    await page.locator('[data-game-toolbar="pause"]').click();
    await expect(page.getByRole('button', { name: 'Pause game' })).toBeVisible();
  });

  test('pauses Color Flip with its color selection visible and unavailable', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Pick Amber' }).click();
    await expect(page.locator('[data-cf="color-label"]')).toHaveText('Amber');
    const scoreBefore = await page.locator('[data-cf="score"]').textContent();

    await page.getByRole('button', { name: 'Pause game' }).click();
    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    await expect(page.locator('[data-cf="color-label"]')).toHaveText('Amber');
    await page.locator('.cf__tile--adjacent').first().click({ force: true });
    await expect(page.locator('[data-cf="score"]')).toHaveText(scoreBefore ?? '0');
  });

  test('preserves turn-based Color Flip state and disables its choices while paused', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Turn-based mode' }).click();
    const next = page.locator('[data-cf="accessible-next"]');
    const before = await next.textContent();
    await page.getByRole('button', { name: 'Pause game' }).click();
    await expect(page.getByRole('button', { name: 'Cycle color' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Step forward' })).toBeDisabled();
    await expect(next).toHaveText(before ?? '');
    await page.locator('[data-game-toolbar="pause"]').click();
    await expect(page.getByRole('button', { name: 'Cycle color' })).toBeEnabled();
    await expect(next).toHaveText(before ?? '');
  });

  test('automatically pauses hidden play but never auto-resumes a manual pause', async ({ page }) => {
    await page.goto('/games/word-tile-rush/');
    await setVisibility(page, 'hidden');
    await expect(page.locator('[data-game-toolbar="pause"]')).toBeVisible();
    await setVisibility(page, 'visible');
    await expect(page.getByRole('button', { name: 'Pause game' })).toBeVisible();

    await page.getByRole('button', { name: 'Pause game' }).click();
    await setVisibility(page, 'hidden');
    await setVisibility(page, 'visible');
    await expect(page.locator('[data-game-toolbar="pause"]')).toBeVisible();
  });

  test('recovers a stale hidden pause without reloading or resetting Memory Match', async ({ page }) => {
    await page.goto('/games/memory-match/');
    const navigationEntries = await page.evaluate(() => performance.getEntriesByType('navigation').length);
    const firstCard = page.locator('.mm__card').first();
    await firstCard.click();
    const revealedLabel = await firstCard.getAttribute('aria-label');

    await setVisibility(page, 'hidden');
    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    await setVisibilityWithoutEvent(page, 'visible');
    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    await resumeFromOverlay(page).click();

    await expect(page.locator('[data-game-pause-overlay]')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Pause game' })).toBeFocused();
    await expect(firstCard).toHaveClass(/is-flipped/);
    await expect(firstCard).toHaveAttribute('aria-label', revealedLabel ?? '');
    expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(navigationEntries);
  });

  test('keeps manual and hidden pause reasons independent until Resume', async ({ page }) => {
    await page.goto('/games/memory-match/');
    await page.getByRole('button', { name: 'Pause game' }).click();
    await setVisibility(page, 'hidden');
    await setVisibility(page, 'visible');

    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    await resumeFromOverlay(page).click();
    await expect(page.locator('[data-game-pause-overlay]')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Pause game' })).toBeFocused();
  });

  test('does not clear a hidden reason while the document is actually hidden', async ({ page }) => {
    await page.goto('/games/memory-match/');
    await setVisibility(page, 'hidden');
    await resumeFromOverlay(page).evaluate((button: HTMLButtonElement) => button.click());

    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    await expect(page.locator('[data-game-toolbar-status]')).toHaveText('Return to this tab before resuming the game.');

    await setVisibility(page, 'visible');
    await expect(page.locator('[data-game-pause-overlay]')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Pause game' })).toBeVisible();
  });

  test('does not bypass consent when hidden and consent reasons overlap', async ({ page }) => {
    await page.goto('/games/memory-match/');
    await page.getByRole('button', { name: 'Analytics choices' }).click();
    await setVisibility(page, 'hidden');
    await setVisibility(page, 'visible');
    await resumeFromOverlay(page).evaluate((button: HTMLButtonElement) => button.click());

    await expect(page.locator('[data-consent-modal]')).toBeVisible();
    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    await expect(page.locator('[data-game-toolbar-status]')).toHaveText(
      'Close Privacy choices before resuming the game.',
    );

    await page.getByRole('button', { name: 'Close privacy choices' }).click();
    await expect(page.locator('[data-game-pause-overlay]')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Pause game' })).toBeVisible();
  });

  test('stale hidden recovery preserves Word Tile Rush path and restarts a fresh timer', async ({ page }) => {
    await page.goto('/games/word-tile-rush/');
    const firstLetter = page.locator('.wtr__cell:not(:disabled)').first();
    const coordinates = await firstLetter.evaluate((cell) => ({ r: cell.dataset.r, c: cell.dataset.c }));
    const selectedLetter = page.locator(`.wtr__cell[data-r="${coordinates.r}"][data-c="${coordinates.c}"]`);
    await firstLetter.focus();
    await page.keyboard.press('Enter');
    const gridBeforePause = await page.locator('.wtr__cell').allTextContents();

    await setVisibility(page, 'hidden');
    await page.waitForTimeout(3_050);
    await expect(page.locator('.wtr__cell')).toHaveText(gridBeforePause);
    await expect(selectedLetter).toHaveAttribute('aria-pressed', 'true');

    await setVisibilityWithoutEvent(page, 'visible');
    await resumeFromOverlay(page).click();
    await expect(selectedLetter).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.wtr__cell')).toHaveText(gridBeforePause);

    await page.getByRole('button', { name: 'Clear' }).click();
    await page.waitForTimeout(1_500);
    await expect(page.locator('.wtr__cell')).toHaveText(gridBeforePause);
    await page.waitForTimeout(1_700);
    expect(await page.locator('.wtr__cell').allTextContents()).not.toEqual(gridBeforePause);
  });

  test('stale hidden recovery preserves Color Flip color and playfield', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Pick Amber' }).click();
    await expect(page.locator('[data-cf="color-label"]')).toHaveText('Amber');

    await setVisibility(page, 'hidden');
    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    await setVisibilityWithoutEvent(page, 'visible');
    await resumeFromOverlay(page).click();

    await expect(page.locator('[data-cf="color-label"]')).toHaveText('Amber');
    await expect(page.locator('[data-cf="grid"]')).toBeVisible();
    await expect(page.locator('.cf__tile--adjacent').first()).toBeVisible();
  });

  test('stale hidden recovery leaves turn-based Color Flip usable', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Turn-based mode' }).click();
    const current = page.locator('[data-cf="accessible-current"]');
    const next = page.locator('[data-cf="accessible-next"]');
    const before = { current: await current.textContent(), next: await next.textContent() };

    await setVisibility(page, 'hidden');
    await setVisibilityWithoutEvent(page, 'visible');
    await resumeFromOverlay(page).click();
    await expect(current).toHaveText(before.current ?? '');
    await expect(next).toHaveText(before.next ?? '');
    await expect(page.getByRole('button', { name: 'Cycle color' })).toBeEnabled();

    await page.getByRole('button', { name: 'Cycle color' }).click();
    await expect(current).not.toHaveText(before.current ?? '');
  });

  test('pauses for the privacy choices modal and resumes only its matching reason', async ({ page }) => {
    await page.goto('/games/memory-match/');
    await page.getByRole('button', { name: 'Analytics choices' }).click();
    await expect(page.locator('[data-consent-modal]')).toBeVisible();
    await expect(page.locator('[data-game-toolbar="pause"]')).toBeVisible();
    await page.getByRole('button', { name: 'Close privacy choices' }).click();
    await expect(page.getByRole('button', { name: 'Pause game' })).toBeVisible();
  });

  test('persists the shared mute preference between games and reloads', async ({ page }) => {
    await page.goto('/games/memory-match/');
    await page.getByRole('button', { name: 'Mute game sound' }).click();
    await expect(page.getByRole('button', { name: 'Unmute game sound' })).toBeVisible();

    await page.goto('/games/color-flip/');
    await expect(page.getByRole('button', { name: 'Unmute game sound' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Unmute game sound' })).toBeVisible();
  });
});

test.describe('fullscreen and immersive game viewport', () => {
  test.beforeEach(async ({ page }) => {
    await denyOptionalServices(page);
  });

  test('enters and exits the browser-supported fullscreen viewport with an accessible toolbar', async ({ page }) => {
    await page.goto('/games/memory-match/');
    const fullscreen = page.getByRole('button', { name: 'Enter full screen' });
    const immersive = page.getByRole('button', { name: 'Enter immersive mode' });

    if (await fullscreen.count()) {
      await fullscreen.click();
      await expect.poll(async () => {
        const active = await page.evaluate(() => document.fullscreenElement?.hasAttribute('data-game-viewport') ?? false);
        const unavailable = await page.locator('[data-game-toolbar-status]').textContent();
        return active || unavailable?.includes('unavailable');
      }).toBeTruthy();
      const active = await page.evaluate(() => document.fullscreenElement?.hasAttribute('data-game-viewport') ?? false);
      if (active) {
        await expect(page.getByRole('button', { name: 'Exit full screen' })).toBeVisible();
        await expect(page.locator('[data-game-viewport]')).toContainText('Mute sound');
        expect(await page.evaluate(() => document.fullscreenElement?.querySelector('.ad-banner') === null)).toBe(true);
        await page.getByRole('button', { name: 'Exit full screen' }).click();
        await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
        await expect(fullscreen).toBeFocused();
      } else {
        await expect(page.locator('[data-game-toolbar-status]')).toContainText('Full screen is unavailable');
      }
    } else {
      // Browsers without the Fullscreen API deliberately expose immersive mode.
      await immersive.click();
      await expect(page.locator('[data-game-viewport]')).toHaveClass(/is-immersive/);
      await expect(page.getByRole('button', { name: 'Exit immersive mode' })).toBeVisible();
      await page.getByRole('button', { name: 'Exit immersive mode' }).click();
      await expect(page.locator('[data-game-viewport]')).not.toHaveClass(/is-immersive/);
    }
  });

  test('offers an immersive fallback and restores page scrolling when fullscreen is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => false });
    });
    await page.goto('/games/word-tile-rush/');
    const enter = page.getByRole('button', { name: 'Enter immersive mode' });
    test.skip((await enter.count()) === 0, 'This browser does not allow the Fullscreen feature-detection override.');
    await enter.click();
    await expect(page.locator('[data-game-viewport]')).toHaveClass(/is-immersive/);
    await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe('fixed');
    await page.getByRole('button', { name: 'Exit immersive mode' }).click();
    await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe('');
  });

  test('announces a rejected fullscreen request without entering fullscreen', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => true });
      Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
        configurable: true,
        value: () => Promise.reject(new DOMException('blocked', 'NotAllowedError')),
      });
    });
    await page.goto('/games/color-flip/');
    const enter = page.getByRole('button', { name: 'Enter full screen' });
    test.skip((await enter.count()) === 0, 'This browser does not allow the Fullscreen feature-detection override.');
    await enter.click();
    await expect(page.locator('[data-game-toolbar-status]')).toContainText('Full screen is unavailable');
    await expect(page.locator('[data-game-viewport]')).not.toHaveClass(/is-fullscreen-active/);
  });
});

test('trust pages publish one H1, canonical metadata, footer links, and public responses', async ({ page, request }) => {
  await denyOptionalServices(page);
  for (const path of ['/about/', '/terms/', '/advertising/', '/changelog/', '/accessibility/']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://nocharge.net${path}`);
    await expect(page.locator('.site-footer').getByRole('link', { name: /About|Terms|Advertising|Changelog|Accessibility/ }).first()).toBeVisible();
  }
});

test('publishes the article index and game-specific routes with links, breadcrumbs, and Article structured data', async ({ page, request }) => {
  await denyOptionalServices(page);
  await page.goto('/articles/');
  await expect(page.locator('.articles-grid .article-card')).toHaveCount(23);

  for (const slug of articleSlugs) {
    const path = `/articles/${slug}/`;
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    await page.goto(path);
    await expect(page.locator('.breadcrumbs')).toBeVisible();
    await expect(page.locator('.article-play').getByRole('link', { name: /Play (Memory Match|Word Tile Rush|Color Flip|Beacon Lattice)/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Read the guide' })).toBeVisible();
    const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(structuredData.join('\n')).toContain('"@type":"Article"');
    expect(structuredData.join('\n')).toContain('"@type":"BreadcrumbList"');
    await expect(page.locator('.article-header time[datetime]')).toHaveCount(2);
  }
});

test('serves safe build-time health metadata', async ({ request }) => {
  const response = await request.get('/health.json');
  expect(response.status()).toBe(200);
  const health = await response.json();
  expect(health).toMatchObject({ status: 'ok', site: 'NoCharge' });
  expect(typeof health.release).toBe('string');
  expect(typeof health.builtAt).toBe('string');
  expect(JSON.stringify(health)).not.toMatch(/secret|token|host/i);
});
