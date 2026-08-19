import { expect, test } from '@playwright/test';

import { CONSENT_KEY, denyOptionalServices } from './helpers/consent';

/**
 * Clear game data must remove only current game-only keys while leaving the
 * consent decision and unrelated origin storage untouched.
 */
const seedGameData = async (page: import('@playwright/test').Page) => {
  await page.evaluate(() => {
    localStorage.setItem('nocharge:memory-match:high', '900');
    localStorage.setItem('nocharge:word-tile-rush:high', '4200');
    localStorage.setItem('nocharge:color-flip:high', '12');
    localStorage.setItem('nocharge:color-flip-turn-based:high', '7');
    localStorage.setItem('nocharge:memory-match:best-moves', '14');
    localStorage.setItem('nocharge:pref:game-muted', 'true');
    localStorage.setItem('nocharge:beacon-lattice:high', '3');
    localStorage.setItem('nocharge:pref:beacon-lattice-progress', '{"currentId":"bl-01-first-plus"}');
    localStorage.setItem('nocharge:pref:recently-played', '[{"gameId":"memory-match","playedAt":1}]');
    localStorage.setItem('unrelated-origin-key', 'keep-me');
  });
};

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test('clear game data removes scores and game preferences but preserves consent', async ({ page }) => {
  await page.goto('/privacy/');
  await seedGameData(page);

  const consentBefore = await page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY);
  expect(consentBefore).not.toBeNull();

  await page.getByRole('button', { name: 'Clear game data' }).click();

  const after = await page.evaluate(() => {
    const read = (key: string) => localStorage.getItem(key);
    return {
      memoryHigh: read('nocharge:memory-match:high'),
      wordHigh: read('nocharge:word-tile-rush:high'),
      colorHigh: read('nocharge:color-flip:high'),
      turnBasedHigh: read('nocharge:color-flip-turn-based:high'),
      bestMoves: read('nocharge:memory-match:best-moves'),
      muted: read('nocharge:pref:game-muted'),
      beaconHigh: read('nocharge:beacon-lattice:high'),
      beaconProgress: read('nocharge:pref:beacon-lattice-progress'),
      recentlyPlayed: read('nocharge:pref:recently-played'),
      consent: read('nocharge:consent'),
      unrelated: read('unrelated-origin-key'),
    };
  });

  // 1. A normal high-score key is removed.
  expect(after.memoryHigh).toBeNull();
  // 2. Memory Match best-moves is removed.
  expect(after.bestMoves).toBeNull();
  // 3. nocharge:pref:game-muted is removed.
  expect(after.muted).toBeNull();
  // 4. Another current game-only key (the turn-based high score) is removed.
  expect(after.turnBasedHigh).toBeNull();
  expect(after.wordHigh).toBeNull();
  expect(after.colorHigh).toBeNull();
  expect(after.beaconHigh).toBeNull();
  expect(after.beaconProgress).toBeNull();
  expect(after.recentlyPlayed).toBeNull();
  // 5. nocharge:consent remains exactly unchanged.
  expect(after.consent).toBe(consentBefore);
  // 7. Unrelated localStorage is not broadly cleared.
  expect(after.unrelated).toBe('keep-me');
});

test('clear game data reports an accurate status', async ({ page }) => {
  await page.goto('/privacy/');
  await seedGameData(page);

  await page.getByRole('button', { name: 'Clear game data' }).click();
  await expect(page.locator('[data-game-status]')).toHaveText(
    'Game scores, preferences, and Recently Played were cleared from this browser.',
  );
});
