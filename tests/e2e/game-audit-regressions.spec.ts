import { expect, test } from '@playwright/test';
import { denyOptionalServices } from './helpers/consent';

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

async function waitForGame(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('[data-game-root]')).toHaveClass(/is-game-mounted/);
}

test('Word Search rejects pointer and keyboard commands while paused', async ({ page }) => {
  await page.goto('/games/word-search/');
  await waitForGame(page);
  const cells = page.locator('.ws__cell');
  await cells.first().click();
  await page.getByRole('button', { name: 'Pause game' }).click();
  const before = await page.locator('[data-ws-status]').textContent();
  await page.evaluate(() => {
    (document.querySelectorAll<HTMLElement>('.ws__cell')[1])?.click();
    document.querySelector('[data-game-root]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  expect(await page.locator('[data-ws-status]').textContent()).toBe(before);
  await expect(page.locator('[data-game-pause-resume]')).toBeVisible();
});

for (const sudoku of [
  { name: 'Mini Sudoku', route: '/games/mini-sudoku/', cell: '.ms__cell', digit: '[data-ms-digit="1"]', erase: '[data-ms-erase]' },
  { name: 'Sudoku 9×9', route: '/games/sudoku-9x9/', cell: '.s9__cell', digit: '[data-s9-digit="1"]', erase: '[data-s9-erase]' },
]) {
  test(`${sudoku.name} keeps initial clues immutable`, async ({ page }) => {
    await page.goto(sudoku.route);
    await waitForGame(page);
    const clue = page.locator(`${sudoku.cell}.is-given`).first();
    const value = await clue.textContent();
    await clue.click();
    await page.locator(sudoku.erase).click();
    await expect(clue).toHaveText(value ?? '');
    await expect(clue).toHaveAttribute('data-initial-clue', 'true');
  });

  test(`${sudoku.name} rejects pad and keyboard mutations while paused`, async ({ page }) => {
    await page.goto(sudoku.route);
    await waitForGame(page);
    const empty = page.locator(sudoku.cell).filter({ hasText: /^$/ }).first();
    await empty.click();
    const before = await empty.textContent();
    await page.getByRole('button', { name: 'Pause game' }).click();
    await page.evaluate(({ digit }) => {
      document.querySelector<HTMLElement>(digit)?.click();
      document.querySelector('[data-game-root]')?.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    }, { digit: sudoku.digit });
    expect(await empty.textContent()).toBe(before);
  });
}

test('Simon freezes the current cue for the entire pause', async ({ page }) => {
  await page.goto('/games/simon/');
  await waitForGame(page);
  await page.getByRole('button', { name: 'Start pattern' }).click();
  const active = page.locator('[data-sn-pad].is-active');
  await expect(active).toHaveCount(1);
  const pad = await active.getAttribute('data-sn-pad');
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.waitForTimeout(1_200);
  await expect(page.locator(`[data-sn-pad="${pad}"]`)).toHaveClass(/is-active/);
  await page.locator('[data-game-pause-resume]').click();
  await expect(page.locator(`[data-sn-pad="${pad}"]`)).not.toHaveClass(/is-active/, { timeout: 1_500 });
});

test('Pass the Picture shows a useful fallback when Canvas 2D is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/games/pass-the-picture/');
  await waitForGame(page);
  await expect(page.getByRole('alert')).toContainText('Drawing is unavailable');
});
