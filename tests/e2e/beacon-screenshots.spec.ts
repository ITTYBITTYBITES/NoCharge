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

const emitWorkflowNotices = (label: string, filePath: string) => {
  const encoded = readFileSync(filePath).toString('base64');
  const chunkSize = 3500;
  const total = Math.ceil(encoded.length / chunkSize);
  console.log(`::notice title=${label}_META::bytes=${readFileSync(filePath).byteLength} chunks=${total} chars=${encoded.length}`);
  for (let index = 0; index < total; index += 1) {
    const chunk = encoded.slice(index * chunkSize, (index + 1) * chunkSize);
    const padded = String(index).padStart(2, '0');
    const count = String(total).padStart(2, '0');
    console.log(`::notice title=${label}_${padded}_${count}::${chunk}`);
  }
};

test('captures actual Beacon Lattice gameplay screenshots', async ({ page }, testInfo) => {
  test.skip(!process.env.CI && !process.env.CAPTURE_BEACON_SHOTS, 'CI or CAPTURE_BEACON_SHOTS=1 required.');
  await denyOptionalServices(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/games/beacon-lattice/');
  await stageLongPlusMixedCoverage(page);
  const desktopPath = testInfo.outputPath('beacon-desktop.png');
  await page.locator('[data-game-viewport]').screenshot({
    path: desktopPath,
    type: 'png',
    animations: 'disabled',
    caret: 'hide',
  });
  emitWorkflowNotices('BEACON_DESKTOP', desktopPath);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/beacon-lattice/');
  await stageLongPlusMixedCoverage(page);
  const mobilePath = testInfo.outputPath('beacon-mobile.png');
  await page.locator('[data-game-viewport]').screenshot({
    path: mobilePath,
    type: 'png',
    animations: 'disabled',
    caret: 'hide',
  });
  emitWorkflowNotices('BEACON_MOBILE', mobilePath);
});
