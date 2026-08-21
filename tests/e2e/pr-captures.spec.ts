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

test('captures My Arcade review screens', async ({ page }) => {
  test.setTimeout(6 * 60_000);
  await mkdir(captures, { recursive: true });
  await denyOptionalServices(page);

  const shot = async (name: string, fullPage = true) =>
    page.screenshot({ path: join(captures, `${name}.jpg`), type: 'jpeg', quality: 80, fullPage });

  const RECENT_KEY = 'nocharge:pref:recently-played';
  const POPULATED = {
    [RECENT_KEY]: JSON.stringify([
      { gameId: 'beacon-lattice', playedAt: Date.now() - 60_000 },
      { gameId: 'color-flip', playedAt: Date.now() - 86_400_000 },
      { gameId: 'word-tile-rush', playedAt: Date.now() - 3 * 86_400_000 },
      { gameId: 'memory-match', playedAt: Date.now() - 21 * 86_400_000 },
    ]),
    'nocharge:memory-match:best-moves': '14',
    'nocharge:memory-match:high': '860',
    'nocharge:word-tile-rush:high': '4200',
    'nocharge:color-flip:high': '12',
    'nocharge:color-flip-turn-based:high': '7',
    'nocharge:beacon-lattice:high': '2',
    'nocharge:pref:beacon-lattice-progress': JSON.stringify({
      currentId: 'bl-02-long-plus',
      completed: ['bl-01-first-plus', 'bl-02-long-plus'],
      bests: { 'bl-01-first-plus': 1, 'bl-02-long-plus': 3 },
    }),
  } as const;

  const ready = async () => {
    await page.locator('[data-my-arcade][aria-busy="false"]').waitFor();
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll('img')) img.loading = 'eager';
      await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null))));
    });
    await page.waitForTimeout(120);
  };

  // Remove only the documented game keys. The stored analytics choice is left
  // in place so no consent banner appears in a review capture.
  const GAME_KEYS = [
    RECENT_KEY,
    'nocharge:memory-match:best-moves',
    'nocharge:memory-match:high',
    'nocharge:word-tile-rush:high',
    'nocharge:color-flip:high',
    'nocharge:color-flip-turn-based:high',
    'nocharge:beacon-lattice:high',
    'nocharge:pref:beacon-lattice-progress',
    'nocharge:pref:game-muted',
  ];

  const clearLocal = async () => {
    await page.goto('/my-arcade/');
    await page.evaluate((keys) => keys.forEach((key) => localStorage.removeItem(key)), GAME_KEYS);
  };

  const seed = async (values: Record<string, string>) => {
    await clearLocal();
    await page.evaluate((entries) => {
      for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    }, values);
    await page.reload();
    await ready();
  };

  // 1-3. Empty dashboard at desktop, 390px and 320px.
  for (const [label, width, height] of [
    ['desktop', 1440, 900],
    ['390', 390, 844],
    ['320', 320, 700],
  ] as const) {
    await page.setViewportSize({ width, height });
    await clearLocal();
    await page.reload();
    await ready();
    await shot(`my-arcade-empty-${label}`);
  }

  // 4 and 12. Zoom is captured as the equivalent CSS-pixel viewport (a
  // 1280x1024 screen divided by the zoom factor) because media queries ignore
  // the CSS `zoom` property and would show a scaled desktop layout instead.
  await page.setViewportSize({ width: 640, height: 512 });
  await clearLocal();
  await page.reload();
  await ready();
  await shot('my-arcade-empty-zoom-200');

  await page.setViewportSize({ width: 320, height: 256 });
  await seed({ ...POPULATED });
  await shot('my-arcade-populated-zoom-400');

  // 5. One recently played game.
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed({
    [RECENT_KEY]: JSON.stringify([{ gameId: 'memory-match', playedAt: Date.now() - 60_000 }]),
    'nocharge:memory-match:best-moves': '18',
  });
  await shot('my-arcade-one-recent-desktop');

  // 6 and 7. Multiple recent games and all four summary cards with data.
  await seed({ ...POPULATED });
  await shot('my-arcade-populated-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await ready();
  await shot('my-arcade-populated-390');

  // 9. Privacy clearing, before and after.
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed({ ...POPULATED });
  await shot('my-arcade-before-clear');
  await page.goto('/privacy/');
  await page.getByRole('button', { name: 'Clear game data' }).click();
  await page.goto('/my-arcade/');
  await ready();
  await shot('my-arcade-after-clear');

  // 10 and 11. Entry points.
  await seed({ ...POPULATED });
  await page.goto('/arcade/');
  await page.waitForLoadState('networkidle');
  await shot('my-arcade-entry-arcade');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await shot('my-arcade-entry-home-recent');

  // 8. Storage unavailable. This init script cannot be removed afterwards, so
  // it runs last in this capture block.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
  });
  await page.goto('/my-arcade/');
  await ready();
  await shot('my-arcade-storage-unavailable');
});

test('captures Quiet Setup review screens', async ({ page }) => {
  test.setTimeout(8 * 60_000);
  await mkdir(captures, { recursive: true });
  await denyOptionalServices(page);

  const shot = async (name: string, fullPage = true) =>
    page.screenshot({ path: join(captures, `${name}.jpg`), type: 'jpeg', quality: 78, fullPage });

  /** Load and decode every lazy image so full-page captures show real artwork. */
  const settle = async () => {
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll('img')) img.loading = 'eager';
      const step = Math.max(200, innerHeight - 100);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      scrollTo(0, 0);
      await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null))));
    });
    await page.waitForTimeout(200);
  };

  const capture = async (name: string, path: string) => {
    await page.goto(path);
    await settle();
    await shot(name);
  };

  const element = async (name: string, path: string, selector: string) => {
    await page.goto(path);
    await settle();
    const target = page.locator(selector).first();
    if (!(await target.count())) return;
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    await target.screenshot({ path: join(captures, `${name}.jpg`), type: 'jpeg', quality: 82 });
  };

  const setupSlugs = [
    ['what-quiet-setup-means', 'what-quiet-setup-means'],
    ['mouse-trackpad', 'mouse-trackpad-trackball-or-touch'],
    ['compact-keyboard', 'choosing-a-compact-keyboard-layout'],
    ['quiet-switches', 'quiet-keyboard-switches-explained'],
    ['tablet-stand', 'choosing-a-tablet-or-phone-stand'],
    ['browser-zoom', 'browser-zoom-versus-a-larger-display'],
    ['puzzle-book', 'choosing-an-offline-logic-puzzle-book'],
    ['low-noise-desk', 'a-low-noise-desk-setup'],
  ] as const;

  // Quiet Setup index at every reviewed viewport.
  for (const [label, width, height] of [
    ['1440x900', 1440, 900],
    ['1024x768', 1024, 768],
    ['768x1024', 768, 1024],
    ['390x844', 390, 844],
    ['360x800', 360, 800],
    ['320x700', 320, 700],
  ] as const) {
    await page.setViewportSize({ width, height });
    await capture(`quiet-setup-index-${label}`, '/setup/');
  }

  // Browser zoom is emulated as an equivalent CSS-pixel viewport (a 1280x1024
  // screen divided by the zoom factor). The CSS `zoom` property leaves media
  // queries at the unzoomed width, so it would capture a scaled desktop
  // layout rather than the reflow being reviewed.
  await page.setViewportSize({ width: 640, height: 512 });
  await capture('quiet-setup-index-zoom-200', '/setup/');
  await page.setViewportSize({ width: 320, height: 256 });
  await capture('quiet-setup-index-zoom-400', '/setup/');

  // Reduced motion and forced colors.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await capture('quiet-setup-index-reduced-motion', '/setup/');
  await page.emulateMedia({ reducedMotion: null, forcedColors: 'active' });
  await capture('quiet-setup-index-forced-colors', '/setup/');
  await page.emulateMedia({ forcedColors: null });

  // Every article at desktop, mobile, 320px and 200%-equivalent widths.
  for (const [name, slug] of setupSlugs) {
    for (const [label, width, height] of [
      ['1440x900', 1440, 900],
      ['390x844', 390, 844],
      ['320x700', 320, 700],
      ['zoom-200', 640, 512],
    ] as const) {
      await page.setViewportSize({ width, height });
      await capture(`quiet-setup-article-${name}-${label}`, `/setup/${slug}/`);
    }
  }

  // Focused close-ups reviewers asked for by name.
  await page.setViewportSize({ width: 1440, height: 900 });
  await element(
    'quiet-setup-disclosure-closeup-desktop',
    '/setup/mouse-trackpad-trackball-or-touch/',
    '[data-affiliate-disclosure]',
  );
  await element(
    'quiet-setup-paid-recommendation-closeup-desktop',
    '/setup/mouse-trackpad-trackball-or-touch/',
    '[data-paid-recommendation]',
  );
  await element('quiet-setup-topic-cards', '/setup/', '.topic-grid');
  await element('quiet-setup-card-closeup-desktop', '/setup/', '[data-setup-card]');
  await element('quiet-setup-footer-consent-boundary', '/setup/', '.site-footer');
  await page.setViewportSize({ width: 320, height: 700 });
  await element(
    'quiet-setup-disclosure-closeup-320',
    '/setup/mouse-trackpad-trackball-or-touch/',
    '[data-affiliate-disclosure]',
  );
  await element(
    'quiet-setup-paid-recommendation-closeup-320',
    '/setup/mouse-trackpad-trackball-or-touch/',
    '[data-paid-recommendation]',
  );
  await element('quiet-setup-card-closeup-320', '/setup/', '[data-setup-card]');

  // Entry points and the platform article whose hero picture was mis-styled.
  for (const [label, width, height] of [
    ['desktop', 1440, 900],
    ['mobile', 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await capture(`quiet-setup-entry-articles-${label}`, '/articles/');
    await capture(`quiet-setup-entry-help-${label}`, '/help/');
    await capture(`quiet-setup-entry-advertising-${label}`, '/advertising/');
    await capture(`quiet-setup-entry-privacy-${label}`, '/privacy/');
    await capture(`platform-article-hero-${label}`, '/articles/designing-browser-games-for-more-ways-to-play/');
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await capture('platform-article-hero-360', '/articles/designing-browser-games-for-more-ways-to-play/');
});
