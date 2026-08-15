import { expect, test } from '@playwright/test';

const denyOptionalServices = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'nocharge:consent',
      JSON.stringify({
        version: 1,
        analytics: false,
        advertising: false,
        updatedAt: new Date().toISOString(),
      }),
    );
  });
};

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test('Memory Match survives restart during a pending mismatch', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/games/memory-match/');

  const cards = page.locator('.mm__card');
  await expect(cards).toHaveCount(16);
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

test('Color Flip waits to start and offers a complete turn-based mode', async ({ page }) => {
  await page.goto('/games/color-flip/');
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  await expect(page.locator('[data-cf="score"]')).toHaveText('0');
  await page.waitForTimeout(800);
  await expect(page.locator('[data-cf="score"]')).toHaveText('0');

  await page.getByRole('button', { name: 'Turn-based mode' }).click();
  await expect(page.getByRole('heading', { name: 'Turn-based Color Flip' })).toBeVisible();
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
