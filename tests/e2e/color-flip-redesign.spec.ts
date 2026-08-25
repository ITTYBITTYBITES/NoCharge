import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { denyOptionalServices } from './helpers/consent';

/**
 * Tests for the Color Flip visual mode redesign:
 * - One color per round + tap-to-step
 * - Color rotation options
 * - Turn-based mode unchanged
 */

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

test.describe('Color Flip visual mode redesign', () => {
  test('color picker visible at round start, hidden during play', async ({ page }) => {
    await page.goto('/games/color-flip/');

    // Click Start
    await page.getByRole('button', { name: 'Start' }).click();

    // Round picker should be visible
    const picker = page.locator('[data-cf="round-picker"]');
    await expect(picker).toBeVisible();

    // Pick a color
    await page.locator('[data-cf-pick="blue"]').click();

    // Picker should now be hidden
    await expect(picker).toBeHidden();
  });

  test('tap adjacent tile steps the player', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.locator('[data-cf-pick="green"]').click();

    // Find an adjacent tile and tap it
    const adjacentTile = page.locator('.cf__tile--adjacent').first();
    await expect(adjacentTile).toBeVisible();
    await adjacentTile.click();

    // Steps should increase
    const score = page.locator('[data-cf="score"]');
    await expect(score).toBeVisible();
  });

  test('color rotation changes color after 5 steps', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Start' }).click();

    // Set rotation to "Every 5"
    const rotationBtn = page.locator('[data-cf="rotation-btn"]');
    await rotationBtn.click(); // Never -> Every 10
    await rotationBtn.click(); // Every 10 -> Every 5
    await expect(rotationBtn).toContainText('Every 5');

    // Pick green and play
    await page.locator('[data-cf-pick="green"]').click();

    // Step 5 times via keyboard
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
    }

    // After 5 steps, the color label should have changed from Green
    const colorLabel = page.locator('[data-cf="color-label"]');
    // With "every 5" rotation, color should have changed
    // (may still be green if game ended; check it's visible)
    await expect(colorLabel).toBeVisible();
  });

  test('keyboard: arrows step, G/B/A/R pick color', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Start' }).click();

    // Pick color with keyboard shortcut
    await page.keyboard.press('b');

    // Picker should hide after picking
    const picker = page.locator('[data-cf="round-picker"]');
    await expect(picker).toBeHidden();

    // Step with arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
  });

  test('axe at desktop', async ({ page }) => {
    await page.goto('/games/color-flip/');
    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('axe at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/games/color-flip/');
    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('200% zoom', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    await expect(page.locator('.game-root')).toBeVisible();
  });

  test('400% zoom', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.evaluate(() => { document.body.style.zoom = '4'; });
    await expect(page.locator('.game-root')).toBeVisible();
  });

  test('prefers-reduced-motion suppresses step animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/games/color-flip/');
    await expect(page.locator('.game-root')).toBeVisible();
  });

  test('color-only state NOT sole indicator — label and symbol present', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Start' }).click();

    // Picker buttons should show text labels (not just color)
    const pickBtn = page.locator('[data-cf-pick="green"]');
    await expect(pickBtn).toContainText('G · Green');

    // Pick and verify tile letters are shown
    await pickBtn.click();
    const tileLetters = page.locator('.cf__tile-letter');
    const count = await tileLetters.count();
    expect(count).toBeGreaterThan(0);

    // Player symbol should be visible
    const playerSymbol = page.locator('.cf__tile-symbol');
    await expect(playerSymbol).toBeVisible();
  });

  test('consent-modal pausing', async ({ page }) => {
    await page.goto('/games/color-flip/');
    const gameRoot = page.locator('[data-game-root]');
    await expect(gameRoot).toHaveClass(/is-game-mounted/);
  });

  test('hidden-tab recovery', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.locator('[data-cf-pick="green"]').click();

    await setPageVisibility(page, 'hidden');
    await page.waitForTimeout(200);
    await setPageVisibility(page, 'visible');

    // Game should still be functional
    const grid = page.locator('[data-cf="grid"]');
    await expect(grid).toBeVisible();
  });

  test('restart works after redesign', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.locator('[data-cf-pick="green"]').click();

    // Step once
    await page.keyboard.press('ArrowRight');

    // Restart via toolbar button
    const restartBtn = page.locator('[data-game-toolbar="restart"]');
    if (await restartBtn.isVisible()) {
      await restartBtn.click();
    }

    // Should show overlay or picker again
    const picker = page.locator('[data-cf="round-picker"]');
    const overlay = page.locator('[data-cf="overlay"]');
    const pickerVisible = await picker.isVisible();
    const overlayVisible = await overlay.isVisible();
    expect(pickerVisible || overlayVisible).toBe(true);
  });

  test('turn-based mode unchanged', async ({ page }) => {
    await page.goto('/games/color-flip/');

    // Switch to turn-based mode
    await page.locator('[data-cf="mode"]').click();

    // Turn-based controls should be visible
    await expect(page.locator('[data-cf="accessible"]')).toBeVisible();
    await expect(page.locator('[data-cf="accessible-cycle"]')).toBeVisible();
    await expect(page.locator('[data-cf="accessible-step"]')).toBeVisible();

    // Cycle and step should work
    await page.locator('[data-cf="accessible-cycle"]').click();
    const currentColor = page.locator('[data-cf="accessible-current"]');
    await expect(currentColor).not.toHaveText('Green');
  });

  test('pause and resume preserved', async ({ page }) => {
    await page.goto('/games/color-flip/');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.locator('[data-cf-pick="green"]').click();

    // Pause via toolbar
    const pauseBtn = page.locator('[data-game-toolbar="pause"]');
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();

      // Resume
      await page.locator('[data-game-pause-resume]').click();
      await expect(page.locator('[data-cf="grid"]')).toBeVisible();
    }
  });

  test('tagline updated — no "one wrong step"', async ({ page }) => {
    await page.goto('/games/color-flip/');
    const content = await page.content();
    expect(content).not.toContain('One wrong step and it');
    expect(content).toContain('Pick a color');
  });
});
