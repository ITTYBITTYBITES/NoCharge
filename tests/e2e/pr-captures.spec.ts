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
