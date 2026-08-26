import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import sharp from 'sharp';

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

    await page.getByRole('button', { name: /Enter full screen|Focus mode/ }).first().click();
    await page.waitForTimeout(200);
    await shot(`desktop-${game}-fullscreen-or-immersive`);
    const exit = page.getByRole('button', { name: /Exit (full screen|focus mode)/ });
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

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByRole('button', { name: /Enter full screen|Focus mode/ }).first().click();
    await page.waitForTimeout(200);
    await shot(`mobile-${game}-fullscreen-or-immersive`);
    const exit = page.getByRole('button', { name: /Exit (full screen|focus mode)/ });
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
      const step = Math.max(200, innerHeight - 100);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      scrollTo(0, 0);
      await Promise.all([...document.images].map((i) => i.decode().catch(() => null)));
    });
    await page.waitForTimeout(400);
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
  // With storage blocked, the stored analytics choice cannot be read, so the
  // consent banner reappears and would cover a card in the review capture.
  // Dismissing it the way a visitor would keeps the dashboard state readable.
  const keepAnalyticsOff = page.getByRole('button', { name: 'Keep analytics off' });
  if (await keepAnalyticsOff.isVisible().catch(() => false)) await keepAnalyticsOff.click();
  await page.waitForTimeout(150);
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
      await Promise.all([...document.images].map((i) => i.decode().catch(() => null)));
    });
    await page.waitForTimeout(400);
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

test('captures brand review screens and asset comparisons', async ({ page, baseURL }) => {
  test.setTimeout(6 * 60_000);
  const brandCaptures = join(captures, 'brand');
  await mkdir(brandCaptures, { recursive: true });
  await denyOptionalServices(page);

  const metrics: Array<Record<string, unknown>> = [];
  const origin = baseURL ?? 'http://localhost:4321';

  const measure = async (label: string) => {
    const state = await page.evaluate(() => {
      const header = document.querySelector('.site-header')?.getBoundingClientRect();
      const brand = document.querySelector('.brand')?.getBoundingClientRect();
      const mark = document.querySelector('.brand__mark')?.getBoundingClientRect();
      const footer = document.querySelector('.site-footer')?.getBoundingClientRect();
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scrollWidth: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        headerHeight: header ? Math.round(header.height * 10) / 10 : null,
        brandBox: brand ? { x: Math.round(brand.x), y: Math.round(brand.y), w: Math.round(brand.width), h: Math.round(brand.height) } : null,
        markSize: mark ? Math.round(Math.max(mark.width, mark.height) * 10) / 10 : null,
        footerHeight: footer ? Math.round(footer.height * 10) / 10 : null,
        title: document.title,
      };
    });
    metrics.push({ label, ...state });
    // The review invariants are asserted at capture time so a green CI run is
    // itself the verification for every state below.
    expect(state.overflow, `${label} must not overflow its viewport`).toBeLessThanOrEqual(0);
    if (state.headerHeight !== null) {
      expect(state.headerHeight, `${label} header height`).toBeGreaterThan(40);
      expect(state.headerHeight, `${label} header height`).toBeLessThanOrEqual(100);
    }
    if (state.brandBox) {
      expect(state.brandBox.h, `${label} brand height`).toBeLessThanOrEqual(48);
    }
    if (state.markSize !== null) {
      // The symbol itself stays compact (the link is wider because it also
      // carries the real NoCharge text).
      expect(state.markSize, `${label} symbol size`).toBeGreaterThanOrEqual(28);
      expect(state.markSize, `${label} symbol size`).toBeLessThanOrEqual(36);
    }
  };

  const shot = async (name: string, fullPage = true) =>
    page.screenshot({ path: join(brandCaptures, `${name}.jpg`), type: 'jpeg', quality: 80, fullPage });
  const shotElement = async (name: string, selector: string) =>
    page.locator(selector).screenshot({ path: join(brandCaptures, `${name}.jpg`), type: 'jpeg', quality: 80 });

  const composeSheet = async (name: string, sources: Array<{ file: string; width: number; height: number; scale?: number }>) => {
    const gap = 24;
    const inputs: import('sharp').OverlayOptions[] = [];
    let width = 0;
    const rowHeight = Math.max(...sources.map((source) => source.height * (source.scale ?? 1)));
    for (const source of sources) {
      const buffer = await sharp(source.file)
        .resize(Math.round(source.width * (source.scale ?? 1)), Math.round(source.height * (source.scale ?? 1)), { kernel: 'nearest' })
        .toBuffer();
      inputs.push({ input: buffer, left: width, top: Math.round((rowHeight - source.height * (source.scale ?? 1)) / 2) });
      width += Math.round(source.width * (source.scale ?? 1)) + gap;
    }
    await sharp({ create: { width, height: rowHeight + gap * 2, channels: 4, background: '#101010' } })
      .composite(inputs.map((input) => ({ ...input, left: (input.left ?? 0) + gap / 2, top: (input.top ?? 0) + gap / 2 })))
      .jpeg({ quality: 85 })
      .toFile(join(brandCaptures, `${name}.jpg`));
  };

  // Header on the homepage at desktop, 390, and 320.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await measure('homepage-desktop');
  await shotElement('01-homepage-header-desktop', '.site-header');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await measure('homepage-390');
  await shotElement('02-homepage-header-390', '.site-header');

  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await measure('homepage-320');
  await shotElement('03-homepage-header-320', '.site-header');

  // Zoom uses the equivalent CSS-pixel viewport (1280x1024 divided by the
  // factor), matching the project's other capture suites.
  await page.setViewportSize({ width: 640, height: 512 });
  await page.goto('/');
  await measure('header-200-percent-zoom');
  await shotElement('04-header-200-percent-zoom', '.site-header');
  await page.setViewportSize({ width: 320, height: 256 });
  await page.goto('/');
  await measure('header-400-percent-reflow');
  await shotElement('05-header-400-percent-reflow', '.site-header');

  // Media page at desktop, 390, 320, and 200% equivalent.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/media/');
  await measure('media-desktop');
  await shot('06-media-page-desktop', true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/media/');
  await measure('media-390');
  await shot('07-media-page-390', true);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/media/');
  await measure('media-320');
  await shot('08-media-page-320', true);
  await page.setViewportSize({ width: 640, height: 512 });
  await page.goto('/media/');
  await measure('media-200-percent-zoom');
  await shot('09-media-page-200-percent-zoom', true);

  // Media download section.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/media/');
  await page.locator('#media-brand-assets').scrollIntoViewIfNeeded();
  await measure('media-download-section');
  await shotElement('10-media-download-section', '#media-brand-assets');

  // Default social card and avatar as rendered files.
  await page.goto(`${origin}/social/nocharge-default.jpg`);
  await measure('default-social-card-file');
  await shot('11-default-social-card');
  await page.goto(`${origin}/social/nocharge-avatar-512.png`);
  await measure('avatar-file');
  await shot('12-avatar');

  // Deterministic asset comparisons from the committed files.
  await composeSheet('13-favicon-size-comparison', [
    { file: join(process.cwd(), 'public', 'favicon-16x16.png'), width: 16, height: 16, scale: 8 },
    { file: join(process.cwd(), 'public', 'favicon-32x32.png'), width: 32, height: 32, scale: 8 },
    { file: join(process.cwd(), 'public', 'favicon-48x48.png'), width: 48, height: 48, scale: 8 },
    { file: join(process.cwd(), 'public', 'apple-touch-icon.png'), width: 180, height: 180, scale: 3 },
    { file: join(process.cwd(), 'public', 'icons', 'icon-192.png'), width: 192, height: 192, scale: 3 },
    { file: join(process.cwd(), 'public', 'icons', 'icon-512.png'), width: 512, height: 512, scale: 1.5 },
  ]);
  const maskables = [
    { file: join(process.cwd(), 'public', 'icons', 'icon-maskable-192.png'), width: 192, height: 192, scale: 3 },
    { file: join(process.cwd(), 'public', 'icons', 'icon-maskable-512.png'), width: 512, height: 512, scale: 1.5 },
  ];
  const previewDir = join(process.cwd(), 'artifacts', 'brand-previews');
  if (existsSync(join(previewDir, 'mask-circle.png'))) {
    maskables.push({ file: join(previewDir, 'mask-circle.png'), width: 512, height: 512, scale: 1.5 });
    maskables.push({ file: join(previewDir, 'mask-rounded.png'), width: 512, height: 512, scale: 1.5 });
    maskables.push({ file: join(previewDir, 'mask-squircle.png'), width: 512, height: 512, scale: 1.5 });
  }
  await composeSheet('14-maskable-icon-comparison', maskables);
  await composeSheet('15-logo-variants', [
    { file: join(process.cwd(), 'public', 'brand', 'nocharge-lockup-dark-1200.png'), width: 1200, height: 320, scale: 0.8 },
    { file: join(process.cwd(), 'public', 'brand', 'nocharge-lockup-light-1200.png'), width: 1200, height: 320, scale: 0.8 },
  ]);

  // Footer after branding, then headers on a game page, My Arcade, and Setup.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await measure('footer-after-branding');
  await shotElement('16-footer-after-branding', '.site-footer');

  await page.goto('/games/color-flip/');
  await measure('game-page-header');
  await shotElement('17-game-page-header', '.site-header');
  await page.goto('/my-arcade/');
  await measure('my-arcade-header');
  await shotElement('18-my-arcade-header', '.site-header');
  await page.goto('/setup/');
  await measure('quiet-setup-header');
  await shotElement('19-quiet-setup-header', '.site-header');

  await writeFile(join(brandCaptures, 'review-metrics.json'), JSON.stringify(metrics, null, 2));
  console.log(`Brand captures written to ${brandCaptures} (${metrics.length} measurements).`);
  expect(metrics.length).toBe(16);
});

/**
 * PR #34 evidence: mobile Game Mode screens at the two viewports the live QA
 * report measured. Captured into the same artifact as the other review shots.
 */
test('captures mobile Game Mode screens for solitaire and grid games', async ({ page }) => {
  test.setTimeout(5 * 60_000);
  await mkdir(captures, { recursive: true });
  await denyOptionalServices(page);

  const shot = async (name: string) => {
    await page.screenshot({ path: join(captures, `${name}.jpg`), type: 'jpeg', quality: 80 });
  };

  const enterGameMode = async () => {
    await page.locator('[data-game-play-btn]').click();
    await expect(page.locator('[data-game-viewport]')).toHaveClass(/is-immersive|is-fullscreen-active/);
  };

  const sizes = [
    { label: '320x568', width: 320, height: 568 },
    { label: '360x800', width: 360, height: 800 },
  ] as const;

  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });

    // FreeCell Game Mode, then the in-stage column fan that replaces the tableau.
    await page.goto('/games/freecell/');
    await enterGameMode();
    await shot(`pr34-freecell-game-mode-${size.label}`);
    await page.locator('[data-fc-col="0"] [data-fc-expand]').click();
    await expect(page.locator('[data-fc="fan"]')).toBeVisible();
    await shot(`pr34-freecell-column-fan-${size.label}`);
    await page.keyboard.press('Escape');

    // Klondike Game Mode, then the settings dialog that overlays the stage.
    await page.goto('/games/klondike/');
    await enterGameMode();
    await shot(`pr34-klondike-game-mode-${size.label}`);
    await page.locator('[data-game-toolbar="settings"]').click();
    await expect(page.locator('[data-game-settings-panel]')).toBeVisible();
    await shot(`pr34-game-mode-settings-${size.label}`);
    await page.keyboard.press('Escape');

    // Tile Garden Game Mode.
    await page.goto('/games/tile-garden/');
    await enterGameMode();
    await shot(`pr34-tile-garden-game-mode-${size.label}`);

    // Word Search 10x10 Game Mode, then exit with focus restoration.
    await page.goto('/games/word-search/');
    await page.locator('[data-ws-size]').selectOption('10');
    await expect(page.locator('.ws__cell')).toHaveCount(100);
    await enterGameMode();
    await shot(`pr34-word-search-10x10-game-mode-${size.label}`);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-game-viewport]')).not.toHaveClass(/is-immersive|is-fullscreen-active/);
    await expect(page.locator('[data-game-play-btn]')).toBeFocused();
    await shot(`pr34-game-mode-exit-focus-${size.label}`);
  }
});
