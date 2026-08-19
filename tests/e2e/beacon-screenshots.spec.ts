import { test } from '@playwright/test';

test('captures actual Beacon Lattice gameplay screenshots', async ({ page }, testInfo) => {
  test.skip(!process.env.CAPTURE_BEACON_SHOTS, 'Set CAPTURE_BEACON_SHOTS=1 to write DOM screenshots.');
  await page.addInitScript(() => localStorage.setItem('nocharge:consent', JSON.stringify({ analytics: false })));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/games/beacon-lattice/');
  await page.evaluate(() => {
    const api = (
      window as typeof window & {
        __NOCHARGE_BEACON_LATTICE_TEST__?: {
          loadPuzzle(id: string): void;
          applyPlacements(placements: Array<{ x: number; y: number; type: 'cross' | 'diagonal' | 'horizontal' | 'vertical' }>): void;
        };
      }
    ).__NOCHARGE_BEACON_LATTICE_TEST__;
    if (!api) throw new Error('Beacon Lattice test seam missing');
    api.loadPuzzle('bl-02-long-plus');
    api.applyPlacements([
      { x: 2, y: 2, type: 'cross' },
      { x: 2, y: 0, type: 'cross' },
    ]);
  });
  await page.locator('[data-game-viewport]').screenshot({
    path: testInfo.project.outputDir + '/../../../public/game-art/beacon-lattice/screenshot-desktop.webp',
    type: 'png',
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/beacon-lattice/');
  await page.evaluate(() => {
    const api = (
      window as typeof window & {
        __NOCHARGE_BEACON_LATTICE_TEST__?: {
          loadPuzzle(id: string): void;
          applyPlacements(placements: Array<{ x: number; y: number; type: 'cross' | 'diagonal' | 'horizontal' | 'vertical' }>): void;
        };
      }
    ).__NOCHARGE_BEACON_LATTICE_TEST__;
    if (!api) throw new Error('Beacon Lattice test seam missing');
    api.loadPuzzle('bl-02-long-plus');
    api.applyPlacements([
      { x: 2, y: 2, type: 'cross' },
      { x: 2, y: 0, type: 'cross' },
    ]);
  });
  await page.locator('[data-game-viewport]').screenshot({
    path: testInfo.project.outputDir + '/../../../public/game-art/beacon-lattice/screenshot-mobile.webp',
    type: 'png',
  });
});
