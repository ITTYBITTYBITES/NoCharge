import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

test('Memory Match artwork preserves crops, focus visibility, and layout stability', async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __nochargeCls?: number }).__nochargeCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) {
          (window as Window & { __nochargeCls?: number }).__nochargeCls! += shift.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await denyOptionalServices(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/games/memory-match/');
  await page.waitForLoadState('networkidle');

  const art = page.locator('.game-shell__artwork');
  expect(await art.locator('img').evaluate((image: HTMLImageElement) => image.currentSrc)).toContain(
    '/game-art/memory-match/cover-landscape.webp',
  );
  const desktopRatio = await art.evaluate((element) => {
    const { width, height } = element.getBoundingClientRect();
    return width / height;
  });
  expect(desktopRatio).toBeCloseTo(16 / 9, 1);

  const restart = page.locator('[data-game-toolbar="restart"]');
  await restart.focus();
  await expect(restart).toBeFocused();
  expect(await restart.evaluate((element) => getComputedStyle(element).outlineWidth)).not.toBe('0px');

  const cls = await page.evaluate(() => (window as Window & { __nochargeCls?: number }).__nochargeCls ?? 0);
  expect(cls).toBeLessThan(0.1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  expect(await art.locator('img').evaluate((image: HTMLImageElement) => image.currentSrc)).toContain(
    '/game-art/memory-match/cover-square.webp',
  );
  const mobileRatio = await art.evaluate((element) => {
    const { width, height } = element.getBoundingClientRect();
    return width / height;
  });
  expect(mobileRatio).toBeCloseTo(1, 1);
});

test('consent UI remains above the Memory Match artwork at mobile size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/memory-match/');

  const banner = page.locator('[data-consent-banner]');
  await expect(banner).toBeVisible();
  // WebKit reports `auto` for some computed z-index values. Check the actual
  // stacking outcome instead of relying on that browser-specific string.
  expect(
    await banner.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return !!hit && element.contains(hit);
    }),
  ).toBe(true);
  await expect(page.locator('.game-shell__artwork')).toBeVisible();

  await page.getByRole('button', { name: 'Customize' }).click();
  const modal = page.locator('[data-consent-modal]');
  await expect(modal).toBeVisible();
  expect(
    await modal.evaluate((element) => {
      const panel = element.querySelector('.consent-modal__panel');
      if (!panel) return false;
      const rect = panel.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return !!hit && panel.contains(hit);
    }),
  ).toBe(true);
  await expect(page.locator('[data-consent-analytics]')).toBeFocused();
});
