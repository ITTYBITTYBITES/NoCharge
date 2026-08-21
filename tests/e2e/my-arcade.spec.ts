import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { CONSENT_KEY, denyOptionalServices } from './helpers/consent';

/**
 * My Arcade browser coverage.
 *
 * Local values are created through the public game UI wherever that is
 * practical. Where a historical state cannot be produced by playing (for
 * example an old best score), the fixture is written here in the test with a
 * documented, valid data shape. No production debug global or query seam is
 * added for testing.
 */

const RECENT_KEY = 'nocharge:pref:recently-played';
const MEMORY_BEST_MOVES = 'nocharge:memory-match:best-moves';
const WORD_HIGH = 'nocharge:word-tile-rush:high';
const COLOR_HIGH = 'nocharge:color-flip:high';
const COLOR_TURN_HIGH = 'nocharge:color-flip-turn-based:high';
const BEACON_PROGRESS = 'nocharge:pref:beacon-lattice-progress';
const BEACON_HIGH = 'nocharge:beacon-lattice:high';

/** Representative valid local data for all four games. */
const POPULATED_FIXTURE = {
  [RECENT_KEY]: JSON.stringify([
    { gameId: 'beacon-lattice', playedAt: 1_755_000_000_000 },
    { gameId: 'color-flip', playedAt: 1_754_900_000_000 },
    { gameId: 'word-tile-rush', playedAt: 1_754_800_000_000 },
    { gameId: 'memory-match', playedAt: 1_754_700_000_000 },
  ]),
  [MEMORY_BEST_MOVES]: '14',
  'nocharge:memory-match:high': '860',
  [WORD_HIGH]: '4200',
  [COLOR_HIGH]: '12',
  [COLOR_TURN_HIGH]: '7',
  [BEACON_HIGH]: '2',
  [BEACON_PROGRESS]: JSON.stringify({
    currentId: 'bl-02-long-plus',
    completed: ['bl-01-first-plus', 'bl-02-long-plus'],
    bests: { 'bl-01-first-plus': 1, 'bl-02-long-plus': 3 },
    lastSolved: { 'bl-02-long-plus': 3 },
  }),
} as const;

const seedFixture = async (page: Page, entries: Record<string, string>) => {
  await page.evaluate((values) => {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
  }, entries);
};

const readStorage = (page: Page, key: string) => page.evaluate((name) => localStorage.getItem(name), key);

const dashboardReady = async (page: Page) => {
  await expect(page.locator('[data-my-arcade]')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('[data-ma-loading]')).toBeHidden();
};

/** One meaningful Memory Match action: reveal a card. */
const playMemoryMatch = async (page: Page) => {
  await page.goto('/games/memory-match/');
  // Any hidden card is a valid first move; the board is deliberately shuffled.
  await page.locator('[data-game-root="memory-match"] .mm__card').first().click();
  await expect.poll(() => readStorage(page, RECENT_KEY)).toContain('memory-match');
};

/** One meaningful Word Tile Rush action: select a letter with the keyboard. */
const playWordTileRush = async (page: Page) => {
  await page.goto('/games/word-tile-rush/');
  const letter = page.locator('.wtr__cell:not(:disabled)').first();
  await letter.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => readStorage(page, RECENT_KEY)).toContain('word-tile-rush');
};

/**
 * Meaningful Color Flip actions in the untimed turn-based mode. Cycling a
 * colour records play; stepping forward completes a scored turn, which is what
 * the game itself saves as a turn-based best.
 */
const playColorFlip = async (page: Page) => {
  await page.goto('/games/color-flip/');
  const root = page.locator('[data-game-root="color-flip"]');
  await root.getByRole('button', { name: 'Turn-based mode', exact: true }).click();
  await root.getByRole('button', { name: 'Cycle color' }).click();
  await expect.poll(() => readStorage(page, RECENT_KEY)).toContain('color-flip');
  await root.getByRole('button', { name: 'Step forward' }).click();
  await expect.poll(() => readStorage(page, COLOR_TURN_HIGH)).not.toBeNull();
};

/** Play Memory Match to completion so the game itself saves a fewest-moves result. */
const completeMemoryMatch = async (page: Page) => {
  await page.goto('/games/memory-match/');
  const cards = page.locator('.mm__card');
  const symbols = await cards.evaluateAll((elements) =>
    elements.map((element, index) => ({
      index,
      symbol: element.querySelector('.mm__face--front')?.textContent ?? '',
    })),
  );
  const pairs = new Map<string, number[]>();
  symbols.forEach(({ index, symbol }) => pairs.set(symbol, [...(pairs.get(symbol) ?? []), index]));
  for (const indexes of pairs.values()) {
    await cards.nth(indexes[0]!).click();
    await cards.nth(indexes[1]!).click();
  }
  await expect(page.locator('.mm__overlay')).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test.describe('empty dashboard', () => {
  test('loads a neutral empty state with every game still available', async ({ page, request }) => {
    expect((await request.get('/my-arcade/')).status()).toBe(200);
    await page.goto('/my-arcade/');
    await dashboardReady(page);

    await expect(page.getByRole('heading', { level: 1, name: 'My Arcade' })).toBeVisible();
    await expect(page.locator('[data-ma-empty]')).toBeVisible();
    await expect(page.locator('[data-ma-blocked]')).toBeHidden();

    // No Recently Played heading and no Continue playing section when empty.
    await expect(page.getByRole('heading', { name: 'Recently Played' })).toHaveCount(0);
    await expect(page.locator('[data-ma-continue]')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Continue playing' })).toBeHidden();

    for (const gameId of ['memory-match', 'word-tile-rush', 'color-flip', 'beacon-lattice']) {
      const card = page.locator(`[data-ma-card="${gameId}"]`);
      await expect(card).toBeVisible();
      await expect(card.locator('[data-ma-metrics]')).toHaveText('No saved result in this browser yet.');
      await expect(card.getByRole('link', { name: /^Play/ })).toHaveAttribute('href', `/games/${gameId}/`);
      await expect(card.getByRole('link', { name: /^Guide/ })).toHaveAttribute('href', `/guides/${gameId}/`);
    }

    const body = (await page.locator('main').innerText()).toLowerCase();
    expect(body).not.toMatch(/\d\s*%|complete your|keep your streak|level up|your rank|player score/);
    expect(body).toContain('choose a game whenever you are ready');
  });

  test('carries no advertisement region and no affiliate link', async ({ page }) => {
    await page.goto('/my-arcade/');
    await dashboardReady(page);
    await expect(page.locator('[data-ad-banner]')).toHaveCount(0);
    await expect(page.locator('.adsbygoogle')).toHaveCount(0);
    await expect(page.locator('main a[href*="amazon."]')).toHaveCount(0);
    await expect(page.locator('main [data-amazon-paid-link]')).toHaveCount(0);
  });

  test('describes the page without personal values in metadata or structured data', async ({ page }) => {
    await page.goto('/my-arcade/');
    await seedFixture(page, { ...POPULATED_FIXTURE });
    await page.reload();
    await dashboardReady(page);

    await expect(page).toHaveTitle('My Arcade · NoCharge');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://nocharge.net/my-arcade/');
    expect(page.url()).not.toContain('?');

    const json = (await page.locator('script[type="application/ld+json"]').allTextContents()).join('\n');
    expect(json).toContain('"@type":"WebPage"');
    expect(json).toContain('"@type":"BreadcrumbList"');
    for (const forbidden of [
      'ProfilePage',
      'Person',
      'AggregateRating',
      'Review',
      'Product',
      'Dataset',
      '4200',
      '4,200',
    ]) {
      expect(json).not.toContain(forbidden);
    }

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).not.toMatch(/4200|4,200|14 moves/);
  });
});

test.describe('meaningful play', () => {
  test('a page view alone does not populate My Arcade', async ({ page }) => {
    await page.goto('/games/memory-match/');
    await expect(page.locator('[data-game-root="memory-match"]')).toHaveClass(/is-game-mounted/);
    expect(await readStorage(page, RECENT_KEY)).toBeNull();

    await page.goto('/my-arcade/');
    await dashboardReady(page);
    await expect(page.locator('[data-ma-empty]')).toBeVisible();
    await expect(page.locator('[data-ma-continue]')).toBeHidden();
    expect(await readStorage(page, RECENT_KEY)).toBeNull();
  });

  test('a real game action appears in Continue playing and opening the page changes nothing', async ({ page }) => {
    await playMemoryMatch(page);

    await page.goto('/my-arcade/');
    await dashboardReady(page);
    const stored = await readStorage(page, RECENT_KEY);
    expect(stored).not.toBeNull();

    const section = page.locator('[data-ma-continue]');
    await expect(section).toBeVisible();
    const item = section.locator('[data-ma-recent="memory-match"]');
    await expect(item).toBeVisible();
    await expect(item.getByRole('heading', { name: 'Memory Match' })).toBeVisible();
    await expect(item.getByRole('link', { name: /Continue/ })).toHaveAttribute('href', '/games/memory-match/');
    const time = item.locator('[data-ma-recent-time]');
    await expect(time).toHaveText('Today');
    expect(await time.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Opening and reloading My Arcade must not add, reorder, or re-stamp anything.
    await page.reload();
    await dashboardReady(page);
    await page.goto('/my-arcade/');
    await dashboardReady(page);
    expect(await readStorage(page, RECENT_KEY)).toBe(stored);
  });

  test('orders several played games newest first with per-game metrics', async ({ page }) => {
    await playMemoryMatch(page);
    await playWordTileRush(page);
    await playColorFlip(page);

    await page.goto('/my-arcade/');
    await dashboardReady(page);

    const order = await page
      .locator('[data-ma-continue-list] [data-ma-recent]:not([hidden])')
      .evaluateAll((items) => items.map((item) => item.getAttribute('data-ma-recent')));
    expect(order).toEqual(['color-flip', 'word-tile-rush', 'memory-match']);

    // Word Tile Rush recorded play but has not finished a run, so it has no
    // best score yet. That state is described honestly, never inferred.
    await expect(page.locator('[data-ma-card="word-tile-rush"] [data-ma-metrics]')).toHaveText(
      'No saved result in this browser yet.',
    );
    await expect(page.locator('[data-ma-card="word-tile-rush"] [data-ma-card-played]')).toBeVisible();
    await expect(page.locator('[data-ma-card="color-flip"] [data-ma-metrics]')).toContainText(
      'Best score, Turn-based mode',
    );
    await expect(page.locator('[data-ma-card="beacon-lattice"] [data-ma-metrics]')).toHaveText(
      'No saved result in this browser yet.',
    );
  });

  test('a completed Memory Match game shows its own fewest-moves metric', async ({ page }) => {
    await completeMemoryMatch(page);
    const bestMoves = await readStorage(page, MEMORY_BEST_MOVES);
    expect(bestMoves).not.toBeNull();

    await page.goto('/my-arcade/');
    await dashboardReady(page);
    const metrics = page.locator('[data-ma-card="memory-match"] [data-ma-metrics]');
    await expect(metrics).toContainText('Fewest moves');
    await expect(metrics).toContainText(String(Number(bestMoves)));
  });
});

test.describe('saved results', () => {
  test('renders each game metric from valid stored data', async ({ page }) => {
    await page.goto('/my-arcade/');
    await seedFixture(page, { ...POPULATED_FIXTURE });
    await page.reload();
    await dashboardReady(page);

    await expect(page.locator('[data-ma-empty]')).toBeHidden();
    await expect(page.locator('[data-ma-card="memory-match"] [data-ma-metrics]')).toContainText('Fewest moves');
    await expect(page.locator('[data-ma-card="memory-match"] [data-ma-metrics]')).toContainText('14');
    await expect(page.locator('[data-ma-card="word-tile-rush"] [data-ma-metrics]')).toContainText('Best score');
    await expect(page.locator('[data-ma-card="word-tile-rush"] [data-ma-metrics]')).toContainText('4,200');
    const colorMetrics = page.locator('[data-ma-card="color-flip"] [data-ma-metrics]');
    await expect(colorMetrics).toContainText('Best score, Visual mode');
    await expect(colorMetrics).toContainText('Best score, Turn-based mode');
    const beaconMetrics = page.locator('[data-ma-card="beacon-lattice"] [data-ma-metrics]');
    await expect(beaconMetrics).toContainText('Puzzles solved');
    await expect(beaconMetrics).toContainText('2 of 24');
    await expect(beaconMetrics).toContainText('Long plus');
    await expect(beaconMetrics).not.toContainText('par');

    // Older stored dates read as a plain date, never a live "minutes ago" timer.
    const dates = await page
      .locator('[data-ma-continue-list] [data-ma-recent]:not([hidden]) [data-ma-recent-time]')
      .allTextContents();
    expect(dates).toHaveLength(4);
    for (const date of dates) expect(date).not.toMatch(/ago|second|minute/i);
  });

  test('keeps a saved result that is absent from the recent list', async ({ page }) => {
    await page.goto('/my-arcade/');
    await seedFixture(page, {
      [WORD_HIGH]: '1810',
      [RECENT_KEY]: JSON.stringify([{ gameId: 'memory-match', playedAt: 1_755_000_000_000 }]),
    });
    await page.reload();
    await dashboardReady(page);

    await expect(page.locator('[data-ma-continue-list] [data-ma-recent]:not([hidden])')).toHaveCount(1);
    await expect(page.locator('[data-ma-card="word-tile-rush"] [data-ma-metrics]')).toContainText('1,810');
    await expect(page.locator('[data-ma-card="word-tile-rush"] [data-ma-card-played]')).toBeHidden();
  });

  test('ignores malformed and unknown stored values without breaking the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/my-arcade/');
    await seedFixture(page, {
      [RECENT_KEY]: '[{"gameId":"ghost-game","playedAt":1},{"gameId":"color-flip","playedAt":"soon"}]',
      [BEACON_PROGRESS]: '{not-json',
      [WORD_HIGH]: 'NaN',
      [MEMORY_BEST_MOVES]: '-3',
    });
    await page.reload();
    await dashboardReady(page);

    await expect(page.locator('[data-ma-empty]')).toBeVisible();
    await expect(page.locator('[data-ma-continue]')).toBeHidden();
    for (const gameId of ['memory-match', 'word-tile-rush', 'color-flip', 'beacon-lattice']) {
      await expect(page.locator(`[data-ma-card="${gameId}"] [data-ma-metrics]`)).toHaveText(
        'No saved result in this browser yet.',
      );
    }
    expect(errors).toEqual([]);
  });

  test('does not write a dashboard model back into storage', async ({ page }) => {
    await page.goto('/my-arcade/');
    await seedFixture(page, { ...POPULATED_FIXTURE });
    await page.reload();
    await dashboardReady(page);

    const keys = await page.evaluate(() => Object.keys(localStorage).sort());
    expect(keys).toEqual([...Object.keys(POPULATED_FIXTURE), CONSENT_KEY].sort());
  });
});

test.describe('clearing', () => {
  test('the Privacy control clears the dashboard and leaves consent untouched', async ({ page }) => {
    await playMemoryMatch(page);
    await page.goto('/my-arcade/');
    await seedFixture(page, {
      [MEMORY_BEST_MOVES]: '16',
      [COLOR_HIGH]: '9',
      FCCDCF: 'google-cmp-value',
      'unrelated-origin-key': 'keep-me',
    });
    await page.reload();
    await dashboardReady(page);
    await expect(page.locator('[data-ma-continue]')).toBeVisible();

    const consentBefore = await readStorage(page, CONSENT_KEY);
    expect(consentBefore).not.toBeNull();

    await page.goto('/privacy/');
    await page.getByRole('button', { name: 'Clear game data' }).click();
    await expect(page.locator('[data-game-status]')).toHaveText(
      'Game scores, preferences, and Recently Played were cleared from this browser.',
    );

    await page.goto('/my-arcade/');
    await dashboardReady(page);
    await expect(page.locator('[data-ma-empty]')).toBeVisible();
    await expect(page.locator('[data-ma-continue]')).toBeHidden();
    await expect(page.locator('[data-ma-card="memory-match"] [data-ma-metrics]')).toHaveText(
      'No saved result in this browser yet.',
    );

    expect(await readStorage(page, CONSENT_KEY)).toBe(consentBefore);
    expect(await readStorage(page, 'FCCDCF')).toBe('google-cmp-value');
    expect(await readStorage(page, 'unrelated-origin-key')).toBe('keep-me');
  });

  test('the dashboard control confirms, clears, and announces through a live region', async ({ page }) => {
    await page.goto('/my-arcade/');
    await seedFixture(page, { ...POPULATED_FIXTURE, FCCDCF: 'google-cmp-value', 'keep-me': 'yes' });
    await page.reload();
    await dashboardReady(page);

    const consentBefore = await readStorage(page, CONSENT_KEY);
    const status = page.locator('[data-ma-clear-status]');
    await expect(status).toHaveAttribute('role', 'status');

    await page.getByRole('button', { name: 'Clear game data' }).click();
    const confirmPanel = page.locator('[data-ma-clear-confirm]');
    await expect(confirmPanel).toBeVisible();
    await expect(confirmPanel).toContainText('It does not change your analytics consent choice');

    // A confirmation step is required: nothing is removed until it is used.
    expect(await readStorage(page, WORD_HIGH)).toBe('4200');
    await page.getByRole('button', { name: 'Keep it' }).click();
    await expect(confirmPanel).toBeHidden();
    expect(await readStorage(page, WORD_HIGH)).toBe('4200');

    await page.getByRole('button', { name: 'Clear game data' }).click();
    await page.getByRole('button', { name: 'Remove saved game data' }).click();

    await expect(status).toHaveText('Game scores, preferences, and Recently Played were cleared from this browser.');
    await expect(page.locator('[data-ma-empty]')).toBeVisible();
    await expect(page.locator('[data-ma-continue]')).toBeHidden();
    await expect(page.locator('[data-ma-card="word-tile-rush"] [data-ma-metrics]')).toHaveText(
      'No saved result in this browser yet.',
    );

    expect(await readStorage(page, WORD_HIGH)).toBeNull();
    expect(await readStorage(page, RECENT_KEY)).toBeNull();
    expect(await readStorage(page, CONSENT_KEY)).toBe(consentBefore);
    expect(await readStorage(page, 'FCCDCF')).toBe('google-cmp-value');
    expect(await readStorage(page, 'keep-me')).toBe('yes');
  });
});

test.describe('storage failures', () => {
  test('explains blocked storage without crashing and keeps every game reachable', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });
    });

    await page.goto('/my-arcade/');
    await dashboardReady(page);

    await expect(page.locator('[data-ma-blocked]')).toBeVisible();
    await expect(page.locator('[data-ma-blocked]')).toContainText(
      'This browser is not allowing local game data right now. You can still open and play every game.',
    );
    await expect(page.locator('[data-ma-empty]')).toBeHidden();
    await expect(page.locator('[data-ma-continue]')).toBeHidden();

    for (const gameId of ['memory-match', 'word-tile-rush', 'color-flip', 'beacon-lattice']) {
      await expect(page.locator(`[data-ma-card="${gameId}"]`).getByRole('link', { name: /^Play/ })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});

test.describe('discovery', () => {
  test('links from the Arcade and from a populated homepage Recently Played', async ({ page }) => {
    await page.goto('/arcade/');
    const arcadeLink = page.locator('.arcade-notes').getByRole('link', { name: 'View My Arcade' });
    await expect(arcadeLink).toHaveAttribute('href', '/my-arcade/');

    await page.goto('/');
    await expect(page.locator('[data-recently-played="home"]')).toBeHidden();
    await seedFixture(page, { [RECENT_KEY]: '[{"gameId":"memory-match","playedAt":1755000000000}]' });
    await page.reload();
    const homeSection = page.locator('[data-recently-played="home"]');
    await expect(homeSection).toBeVisible();
    await expect(homeSection.getByRole('link', { name: 'View My Arcade' })).toHaveAttribute('href', '/my-arcade/');

    // My Arcade is deliberately absent from game controls, overlays, consent
    // UI, advertising regions, the header, and the footer.
    await page.goto('/games/memory-match/');
    await expect(page.locator('[data-game-viewport] a[href="/my-arcade/"]')).toHaveCount(0);
    await expect(page.locator('.site-footer a[href="/my-arcade/"]')).toHaveCount(0);
    await expect(page.locator('.site-header a[href="/my-arcade/"]')).toHaveCount(0);
  });

  test('is explained on Privacy and Help', async ({ page }) => {
    await page.goto('/privacy/');
    await expect(page.getByRole('heading', { name: 'My Arcade' })).toBeVisible();
    await expect(page.locator('#my-arcade').locator('..')).toContainText('does not create an account');
    await expect(page.locator('main').getByRole('link', { name: 'My Arcade' })).toHaveAttribute(
      'href',
      '/my-arcade/',
    );

    await page.goto('/help/');
    await expect(page.getByRole('heading', { name: 'My Arcade' })).toBeVisible();
    await expect(page.locator('main')).toContainText('Opening My Arcade does not count as playing.');
  });
});

test.describe('accessibility and layout', () => {
  test('has no axe violations when populated', async ({ page }) => {
    await page.goto('/my-arcade/');
    await seedFixture(page, { ...POPULATED_FIXTURE });
    await page.reload();
    await dashboardReady(page);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

    await page.getByRole('button', { name: 'Clear game data' }).click();
    const confirmResults = await new AxeBuilder({ page }).analyze();
    expect(confirmResults.violations, JSON.stringify(confirmResults.violations, null, 2)).toEqual([]);
  });

  test('uses one H1 and a logical heading order', async ({ page }) => {
    await page.goto('/my-arcade/');
    await seedFixture(page, { ...POPULATED_FIXTURE });
    await page.reload();
    await dashboardReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const levels = await page.evaluate(() =>
      [...document.querySelectorAll('main h1, main h2, main h3')]
        .filter((heading) => heading.checkVisibility())
        .map((heading) => Number(heading.tagName[1])),
    );
    expect(levels[0]).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(Math.abs(levels[index]! - levels[index - 1]!)).toBeLessThanOrEqual(1);
    }
  });

  test('is fully operable with the keyboard and shows visible focus', async ({ page }) => {
    await page.goto('/my-arcade/');
    await seedFixture(page, { ...POPULATED_FIXTURE });
    await page.reload();
    await dashboardReady(page);

    // Nothing steals focus during hydration.
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');

    const reached: string[] = [];
    for (let step = 0; step < 40; step += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return null;
        const style = getComputedStyle(active);
        return {
          tag: active.tagName,
          label: (active.textContent ?? '').trim().slice(0, 40),
          href: active.getAttribute('href'),
          outline: `${style.outlineStyle}:${style.outlineWidth}`,
        };
      });
      if (!info) break;
      // Only real links and buttons take focus; no clickable div appears.
      if (info.tag === 'A' || info.tag === 'BUTTON') reached.push(info.href ?? info.label);
      if (reached.includes('/games/memory-match/')) break;
    }
    expect(reached).toContain('/games/memory-match/');

    await expect(page.locator('main [role="button"], main div[onclick]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear game data' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Remove saved game data' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Keep it' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-ma-clear-confirm]')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Clear game data' })).toBeFocused();
    await expect(page.locator('[data-ma-clear-status]')).toHaveText('Nothing was removed.');
  });

  test('reflows without horizontal overflow at narrow widths and high zoom', async ({ page }) => {
    for (const [label, width, height] of [
      ['1440x900', 1440, 900],
      ['390x844', 390, 844],
      ['320x700', 320, 700],
      ['zoom-200', 640, 512],
      ['zoom-400', 320, 256],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto('/my-arcade/');
      await seedFixture(page, { ...POPULATED_FIXTURE });
      await page.reload();
      await dashboardReady(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${label} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  });

  test('remains readable with reduced motion and forced colors', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/my-arcade/');
    await seedFixture(page, { ...POPULATED_FIXTURE });
    await page.reload();
    await dashboardReady(page);
    await expect(page.locator('[data-ma-card="memory-match"] [data-ma-metrics]')).toContainText('Fewest moves');

    await page.emulateMedia({ reducedMotion: null, forcedColors: 'active' });
    await page.reload();
    await dashboardReady(page);
    await expect(page.locator('[data-ma-card="beacon-lattice"] [data-ma-metrics]')).toContainText('Puzzles solved');
    await page.emulateMedia({ forcedColors: null });
  });
});
