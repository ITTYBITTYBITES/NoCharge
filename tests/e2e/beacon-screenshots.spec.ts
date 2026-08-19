import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const stageLongPlusMixedCoverage = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('[data-game-root="beacon-lattice"]')).toHaveClass(/is-game-mounted/);
  await page.getByLabel('Puzzle selector').selectOption('bl-02-long-plus');
  await page.locator('[data-type="cross"]').click();
  await page.getByRole('button', { name: /Row 3, column 3/ }).click();
  await page.getByRole('button', { name: /Row 1, column 3/ }).click();
  await expect(page.locator('.bl__cell.is-gap').first()).toBeVisible();
  await expect(page.locator('.bl__cell.is-exact').first()).toBeVisible();
  await expect(page.locator('.bl__cell.is-overlap').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

const emitFourNotices = (label: string, filePath: string) => {
  const bytes = readFileSync(filePath);
  const encoded = bytes.toString('base64');
  const chunkSize = Math.ceil(encoded.length / 4);
  for (let index = 0; index < 4; index += 1) {
    const chunk = encoded.slice(index * chunkSize, (index + 1) * chunkSize);
    console.log(
      `::notice title=${label}_${index}_of_4_bytes_${bytes.byteLength}_chars_${encoded.length}::${chunk}`,
    );
  }
};

test('captures actual Beacon Lattice gameplay screenshots', async ({ page }, testInfo) => {
  test.skip(!process.env.CI && !process.env.CAPTURE_BEACON_SHOTS, 'CI or CAPTURE_BEACON_SHOTS=1 required.');
  await denyOptionalServices(page);

  const shot = async (width: number, height: number, name: string, label: string) => {
    await page.setViewportSize({ width, height });
    await page.goto('/games/beacon-lattice/');
    await stageLongPlusMixedCoverage(page);
    const filePath = testInfo.outputPath(name);
    await page.locator('[data-game-viewport]').screenshot({
      path: filePath,
      type: 'jpeg',
      quality: 42,
      animations: 'disabled',
      caret: 'hide',
    });
    emitFourNotices(label, filePath);
  };

  await shot(1440, 900, 'beacon-desktop.jpg', 'BEACON_DESKTOP');
  await shot(390, 844, 'beacon-mobile.jpg', 'BEACON_MOBILE');
});
