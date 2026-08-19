import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const captures = join(process.cwd(), 'artifacts', 'pr-captures');
const games = ['memory-match', 'word-tile-rush', 'color-flip', 'beacon-lattice'] as const;
const pages = [
  ['about', '/about/'],
  ['terms', '/terms/'],
  ['advertising', '/advertising/'],
  ['changelog', '/changelog/'],
  ['articles', '/articles/'],
  ['article-memory-scan', '/articles/memory-match-systematic-board-scan/'],
] as const;

// These review captures run only in the pull-request workflow. Keeping them
// out of the normal matrix makes functional feedback fast while still giving
// reviewers current desktop and mobile visual evidence as a CI artifact.
test.skip(!process.env.CAPTURE_PR, 'PR review capture artifact is generated only when requested.');
test.describe.configure({ mode: 'serial' });

test('captures desktop and mobile platform-maturity review screens', async ({ page }) => {
  await mkdir(captures, { recursive: true });
  await denyOptionalServices(page);

  const shot = async (name: string, fullPage = false) => {
    await page.screenshot({ path: join(captures, `${name}.jpg`), type: 'jpeg', quality: 78, fullPage });
  };

  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const game of games) {
    await page.goto(`/games/${game}/`);
    await page.waitForLoadState('networkidle');
    await shot(`desktop-${game}-normal`);

    await page.getByRole('button', { name: /Enter (full screen|immersive mode)/ }).click();
    await page.waitForTimeout(200);
    await shot(`desktop-${game}-fullscreen-or-immersive`);
    const exit = page.getByRole('button', { name: /Exit (full screen|immersive mode)/ });
    if (await exit.count()) await exit.click();
    await page.waitForTimeout(100);
  }

  await page.goto('/games/memory-match/');
  await page.getByRole('button', { name: 'Pause game' }).click();
  await shot('desktop-memory-match-pause-overlay');

  for (const [name, path] of pages) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await shot(`desktop-${name}`, true);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const game of games) {
    await page.goto(`/games/${game}/`);
    await page.waitForLoadState('networkidle');
    await shot(`mobile-${game}-normal`);

    await page.getByRole('button', { name: /Enter (full screen|immersive mode)/ }).click();
    await page.waitForTimeout(200);
    await shot(`mobile-${game}-fullscreen-or-immersive`);
    const exit = page.getByRole('button', { name: /Exit (full screen|immersive mode)/ });
    if (await exit.count()) await exit.click();
    await page.waitForTimeout(100);
  }

  await page.goto('/games/memory-match/');
  await page.getByRole('button', { name: 'Pause game' }).click();
  await shot('mobile-memory-match-pause-overlay');

  for (const [name, path] of pages) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await shot(`mobile-${name}`, true);
  }
});
