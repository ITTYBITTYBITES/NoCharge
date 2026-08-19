import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const captures = join(process.cwd(), 'artifacts', 'pr-captures');
const games = ['memory-match', 'word-tile-rush', 'color-flip', 'beacon-lattice'] as const;
const pages = [
  ['about', '/about/'],
  ['help', '/help/'],
  ['terms', '/terms/'],
  ['advertising', '/advertising/'],
  ['changelog', '/changelog/'],
  ['articles', '/articles/'],
  ['article-platform-testing', '/articles/how-nocharge-tests-browser-games/'],
  ['collections', '/collections/'],
  ['collection-keyboard', '/collections/keyboard-friendly-browser-games/'],
  ['collection-reduced-pressure', '/collections/untimed-or-reduced-pressure-browser-games/'],
  ['collection-no-accounts', '/collections/browser-games-without-accounts/'],
  ['collection-short-break', '/collections/games-for-a-short-break/'],
] as const;

// These review captures run only in the pull-request workflow. Keeping them
// out of the normal matrix makes functional feedback fast while still giving
// reviewers current desktop and mobile visual evidence as a CI artifact.
test.skip(!process.env.CAPTURE_PR, 'PR review capture artifact is generated only when requested.');
test.describe.configure({ mode: 'serial' });

test('captures desktop and mobile platform-maturity review screens', async ({ page }) => {
  test.setTimeout(5 * 60_000);
  await mkdir(captures, { recursive: true });
  await denyOptionalServices(page);

  const shot = async (name: string, fullPage = false) => {
    await page.screenshot({ path: join(captures, `${name}.jpg`), type: 'jpeg', quality: 78, fullPage });
  };

  const captureDiscoveryStates = async (prefix: 'desktop' | 'mobile') => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('nocharge:pref:recently-played'));
    await page.reload();
    await shot(`${prefix}-home-recent-empty`, true);
    await page.evaluate(() => localStorage.setItem('nocharge:pref:recently-played', JSON.stringify([
      { gameId: 'beacon-lattice', playedAt: 4 }, { gameId: 'color-flip', playedAt: 3 },
      { gameId: 'word-tile-rush', playedAt: 2 }, { gameId: 'memory-match', playedAt: 1 },
    ])));
    await page.reload();
    await shot(`${prefix}-home-recent-populated`, true);
    await page.goto('/arcade/');
    await shot(`${prefix}-arcade-recent-populated`, true);
    await page.goto('/privacy/');
    await page.getByRole('button', { name: 'Clear game data' }).click();
    await shot(`${prefix}-privacy-clear-result`, true);
  };

  await page.setViewportSize({ width: 1440, height: 1000 });
  await captureDiscoveryStates('desktop');
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
  await captureDiscoveryStates('mobile');
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

  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('nocharge:pref:recently-played', JSON.stringify([
    { gameId: 'beacon-lattice', playedAt: 4 }, { gameId: 'color-flip', playedAt: 3 },
    { gameId: 'word-tile-rush', playedAt: 2 }, { gameId: 'memory-match', playedAt: 1 },
  ])));
  await page.reload();
  await shot('mobile-320-home-recent-populated', true);
  await page.goto('/collections/keyboard-friendly-browser-games/');
  await shot('mobile-320-collection-keyboard', true);

  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('nocharge:pref:recently-played', JSON.stringify([
    { gameId: 'beacon-lattice', playedAt: 4 }, { gameId: 'color-flip', playedAt: 3 },
    { gameId: 'word-tile-rush', playedAt: 2 }, { gameId: 'memory-match', playedAt: 1 },
  ])));
  await page.reload();
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await shot('zoom-200-home-recent-populated', true);
  await page.goto('/collections/keyboard-friendly-browser-games/');
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await shot('zoom-200-collection-keyboard', true);
});
