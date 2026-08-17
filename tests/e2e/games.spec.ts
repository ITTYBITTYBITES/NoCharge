import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

type VisualScenario = {
  tiles: Array<{ x?: number; y: number; color: 'green' | 'blue' | 'amber' | 'rose' }>;
  speed?: number;
  playerX?: number;
  playerColor?: 'green' | 'blue' | 'amber' | 'rose';
};

const setColorFlipScenario = async (page: import('@playwright/test').Page, scenario: VisualScenario) => {
  await page.evaluate((config) => {
    const api = (
      window as typeof window & {
        __NOCHARGE_COLOR_FLIP_TEST__?: { setVisualScenario(value: VisualScenario): void };
      }
    ).__NOCHARGE_COLOR_FLIP_TEST__;
    if (!api) throw new Error('Color Flip checkpoint test seam is unavailable.');
    api.setVisualScenario(config);
  }, scenario);
};

const openColorFlipTestRun = async (page: import('@playwright/test').Page) => {
  await page.goto('/games/color-flip/?colorFlipTest=checkpoint');
  await page.getByRole('button', { name: 'Start' }).click();
};

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

test('Memory Match survives restart during a pending mismatch', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  await page.goto('/games/memory-match/');

  const cards = page.locator('.mm__card');
  await expect(cards, `Client errors: ${errors.join(' | ') || 'none observed'}`).toHaveCount(16);
  const symbols = await cards.evaluateAll((elements) =>
    elements.map((element) => element.querySelector('.mm__face--front')?.textContent ?? ''),
  );
  const mismatchIndex = symbols.findIndex((symbol) => symbol !== symbols[0]);
  expect(mismatchIndex).toBeGreaterThan(0);

  await cards.nth(0).click();
  await cards.nth(mismatchIndex).click();
  await page.getByRole('button', { name: 'New game' }).click();
  await page.waitForTimeout(750);

  await expect(cards).toHaveCount(16);
  const labels = await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label')));
  expect(labels.every((label) => label?.includes('hidden'))).toBe(true);
  expect(errors).toEqual([]);
});

test('Memory Match replaces the cleared board with a visible result panel', async ({ page }) => {
  await page.goto('/games/memory-match/');
  const cards = page.locator('.mm__card');
  const symbols = await cards.evaluateAll((elements) =>
    elements.map((element, index) => ({
      index,
      symbol: element.querySelector('.mm__face--front')?.textContent ?? '',
    })),
  );
  const pairs = new Map<string, number[]>();
  symbols.forEach(({ index, symbol }) => pairs.set(symbol, [...(pairs.get(symbol) ?? []), index]));

  for (const indexes of pairs.values()) {
    await cards.nth(indexes[0]!).click();
    await cards.nth(indexes[1]!).click();
  }

  await expect(page.locator('.mm__board')).toBeHidden();
  await expect(page.locator('.mm__overlay')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cleared' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();
  await expect(page.locator('[data-game-root="memory-match"]')).toHaveClass(/game-root--complete/);
});

test('Word Tile Rush waits for input and supports keyboard selection', async ({ page }) => {
  await page.goto('/games/word-tile-rush/');
  const cells = page.locator('.wtr__cell');
  const before = await cells.allTextContents();
  await page.waitForTimeout(3_000);
  await expect(cells).toHaveText(before);

  const firstLetter = page.locator('.wtr__cell:not(:disabled)').first();
  await firstLetter.focus();
  await page.keyboard.press('Enter');
  await expect(firstLetter).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
});

test('Color Flip waits to start and permits Green to Blue to Amber across animation frames', async ({ page }) => {
  await page.goto('/games/color-flip/?colorFlipTest=checkpoint');
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  await expect(page.locator('[data-cf="score"]')).toHaveText('0');
  await page.waitForTimeout(500);
  await expect(page.locator('[data-cf="score"]')).toHaveText('0');

  await page.getByRole('button', { name: 'Start' }).click();
  await setColorFlipScenario(page, {
    speed: 0.2,
    tiles: [
      { y: 0.72, color: 'green' },
      { y: 0.5, color: 'amber' },
    ],
  });
  await expect(page.locator('[data-cf="score"]')).toHaveText('1', { timeout: 1_000 });

  // Inputs deliberately span several animation frames while the evaluated
  // Green tile is still overlapping the player marker.
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  await expect(page.locator('[data-cf="color-label"]')).toHaveText('Blue');
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  await expect(page.locator('[data-cf="color-label"]')).toHaveText('Amber');
  await expect(page.locator('[data-cf="overlay"]')).not.toHaveClass(/is-open/);
  await expect(page.locator('[data-cf="score"]')).toHaveText('2', { timeout: 1_500 });
});

test('Color Flip keeps a complete four-color cycle safe between checkpoints', async ({ page }) => {
  await openColorFlipTestRun(page);
  await setColorFlipScenario(page, {
    speed: 0.2,
    tiles: [
      { y: 0.72, color: 'green' },
      { y: 0.42, color: 'green' },
    ],
  });
  await expect(page.locator('[data-cf="score"]')).toHaveText('1', { timeout: 1_000 });

  for (const expected of ['Blue', 'Amber', 'Rose', 'Green']) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    await expect(page.locator('[data-cf="color-label"]')).toHaveText(expected);
    await expect(page.locator('[data-cf="overlay"]')).not.toHaveClass(/is-open/);
  }

  await expect(page.locator('[data-cf="score"]')).toHaveText('2', { timeout: 1_500 });
});

test('Color Flip scores a matching checkpoint once and not again during cleanup', async ({ page }) => {
  await openColorFlipTestRun(page);
  await setColorFlipScenario(page, { speed: 0.2, tiles: [{ y: 0.72, color: 'green' }] });

  await expect(page.locator('[data-cf="score"]')).toHaveText('1', { timeout: 1_000 });
  await page.waitForTimeout(2_600);
  await expect(page.locator('[data-cf="score"]')).toHaveText('1');
  await expect(page.locator('[data-cf="overlay"]')).not.toHaveClass(/is-open/);
});

test('Color Flip consistently ends on a wrong final color at the next checkpoint', async ({ page }) => {
  await openColorFlipTestRun(page);
  await setColorFlipScenario(page, {
    speed: 0.2,
    tiles: [
      { y: 0.72, color: 'green' },
      { y: 0.5, color: 'amber' },
    ],
  });

  await expect(page.locator('[data-cf="score"]')).toHaveText('1', { timeout: 1_000 });
  await expect(page.locator('[data-cf="overlay"]')).toHaveClass(/is-open/, { timeout: 1_500 });
  await expect(page.locator('[data-cf="result"]')).toContainText('Score 1.');
});

test('Color Flip pause and resume near a checkpoint neither skips nor duplicates scoring', async ({ page }) => {
  await openColorFlipTestRun(page);
  await page.getByRole('button', { name: 'Pause game' }).click();
  await setColorFlipScenario(page, { speed: 0.2, tiles: [{ y: 0.77, color: 'green' }] });

  await page.waitForTimeout(500);
  await expect(page.locator('[data-cf="score"]')).toHaveText('0');
  await page.locator('[data-game-toolbar="pause"]').click();
  await expect(page.locator('[data-cf="score"]')).toHaveText('1', { timeout: 1_000 });
  await page.waitForTimeout(500);
  await expect(page.locator('[data-cf="score"]')).toHaveText('1');
});

test('Color Flip hidden-tab pause preserves the pending checkpoint', async ({ page }) => {
  await openColorFlipTestRun(page);
  await setPageVisibility(page, 'hidden');
  await setColorFlipScenario(page, { speed: 0.2, tiles: [{ y: 0.77, color: 'green' }] });

  await page.waitForTimeout(500);
  await expect(page.locator('[data-cf="score"]')).toHaveText('0');
  await setPageVisibility(page, 'visible');
  await expect(page.locator('[data-cf="score"]')).toHaveText('1', { timeout: 1_000 });
  await page.waitForTimeout(400);
  await expect(page.locator('[data-cf="score"]')).toHaveText('1');
});

test('Color Flip consent-modal pause preserves the pending checkpoint', async ({ page }) => {
  await openColorFlipTestRun(page);
  await page.getByRole('button', { name: 'Privacy choices' }).click();
  await expect(page.locator('[data-consent-modal]')).toBeVisible();
  await setColorFlipScenario(page, { speed: 0.2, tiles: [{ y: 0.77, color: 'green' }] });

  await page.waitForTimeout(500);
  await expect(page.locator('[data-cf="score"]')).toHaveText('0');
  await page.getByRole('button', { name: 'Close privacy choices' }).click();
  await expect(page.locator('[data-cf="score"]')).toHaveText('1', { timeout: 1_000 });
  await page.waitForTimeout(400);
  await expect(page.locator('[data-cf="score"]')).toHaveText('1');
});

test('Color Flip offers a complete turn-based mode', async ({ page }) => {
  await page.goto('/games/color-flip/');
  await page.getByRole('button', { name: 'Turn-based mode' }).click();
  await expect(page.getByRole('heading', { name: 'Turn-based Color Flip', exact: true })).toBeVisible();
  await expect(page.locator('[data-cf="stage"]')).toBeHidden();

  const current = page.locator('[data-cf="accessible-current"]');
  const next = page.locator('[data-cf="accessible-next"]');
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const currentName = await current.textContent();
    const nextName = (await next.textContent())?.split(',')[0];
    if (currentName === nextName) break;
    await page.getByRole('button', { name: 'Cycle color' }).click();
  }

  await page.getByRole('button', { name: 'Step forward' }).click();
  await expect(page.locator('[data-cf="score"]')).toHaveText('1');

  // The next target always differs from the tile just cleared, while the
  // player color stays the same, so this deliberate step ends the run.
  await page.getByRole('button', { name: 'Step forward' }).click();
  await expect(page.locator('[data-cf="accessible-result"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play again' })).toBeFocused();
});
