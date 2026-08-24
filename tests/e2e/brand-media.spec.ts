import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const DEFAULT_CARD = '/social/nocharge-default.jpg';

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

async function headerGeometry(page: Page) {
  return page.locator('.site-header').evaluate((header) => {
    const rect = header.getBoundingClientRect();
    const brand = header.querySelector('.brand')?.getBoundingClientRect();
    const mark = header.querySelector('.brand__mark')?.getBoundingClientRect();
    return {
      headerHeight: Math.round(rect.height * 10) / 10,
      headerWidth: Math.round(rect.width * 10) / 10,
      brandHeight: brand ? Math.round(brand.height * 10) / 10 : null,
      markSize: mark ? Math.round(Math.max(mark.width, mark.height) * 10) / 10 : null,
      viewportWidth: window.innerWidth,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
}

test.describe('brand header and footer', () => {
  for (const [label, path] of [
    ['homepage', '/'],
    ['game page', '/games/memory-match/'],
    ['my arcade', '/my-arcade/'],
    ['quiet setup', '/setup/'],
  ] as const) {
    test(`header logo on ${label}: accessible name, symbol, and geometry`, async ({ page }) => {
      await page.goto(path);
      const brand = page.getByRole('link', { name: 'NoCharge home' });
      await expect(brand).toBeVisible();
      await expect(brand).toHaveAttribute('href', '/');
      await expect(brand.locator('svg[aria-hidden="true"]')).toBeVisible();
      await expect(brand.locator('svg[aria-hidden="true"]')).not.toHaveAttribute('role');
      await expect(brand.getByText('NoCharge')).toBeVisible();

      const geometry = await headerGeometry(page);
      // No header height regression: the previous mark was 2rem with the same
      // paddings, so the header must stay within the same compact envelope.
      expect(geometry.headerHeight, `header height on ${label}`).toBeLessThanOrEqual(100);
      expect(geometry.headerHeight).toBeGreaterThan(40);
      expect(geometry.brandHeight).toBeLessThanOrEqual(48);
      expect(geometry.markSize).toBeGreaterThanOrEqual(28);
      expect(geometry.markSize).toBeLessThanOrEqual(36);
      expect(geometry.overflow, `no horizontal overflow on ${label}`).toBeLessThanOrEqual(0);
      // The symbol must not be clipped by its container.
      const clipped = await page.locator('.brand__mark').evaluate((mark) => {
        const rect = mark.getBoundingClientRect();
        const parent = mark.parentElement?.getBoundingClientRect();
        if (!parent) return false;
        return rect.right > parent.right + 1 || rect.bottom > parent.bottom + 1;
      });
      expect(clipped).toBe(false);
    });
  }

  test('header link is keyboard-focusable with a visible focus indicator', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Tab'); // brand home link
    const active = await page.evaluate(() => {
      const element = document.activeElement;
      const style = element ? getComputedStyle(element) : null;
      return {
        text: element?.textContent?.trim() ?? '',
        outlineStyle: style?.outlineStyle ?? '',
        outlineWidth: style?.outlineWidth ?? '',
      };
    });
    expect(active.text).toContain('NoCharge');
    expect(active.outlineStyle).not.toBe('none');
    expect(parseFloat(active.outlineWidth) || 0).toBeGreaterThan(0);
  });

  test('footer keeps its compact identity line with the small symbol', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.site-footer__identity')).toBeVisible();
    await expect(page.locator('.site-footer__identity .brand-mark--footer')).toBeVisible();
    await expect(page.getByText('General-audience site, not directed to children.')).toBeVisible();
    // No new footer navigation columns beyond the existing three groups.
    await expect(page.locator('.footer-groups nav')).toHaveCount(3);
  });

  test('header survives 200% zoom, 400% reflow, forced colors, and reduced motion', async ({ page }) => {
    // Zoom is exercised as the equivalent CSS-pixel viewport (a 1280x1024
    // screen divided by the zoom factor), matching the capture suites: media
    // queries ignore the CSS `zoom` property, so body zoom would scale a
    // desktop layout instead of reflowing it.
    await page.setViewportSize({ width: 640, height: 512 });
    await page.goto('/');
    expect((await headerGeometry(page)).overflow).toBeLessThanOrEqual(0);

    await page.setViewportSize({ width: 320, height: 256 });
    await page.goto('/');
    expect((await headerGeometry(page)).overflow).toBeLessThanOrEqual(0);

    await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'NoCharge home' })).toBeVisible();
    expect((await headerGeometry(page)).overflow).toBeLessThanOrEqual(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'NoCharge home' })).toBeVisible();
  });
});

test.describe('media page', () => {
  test('loads with one H1, logical headings, and no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/media/');
    await expect(page).toHaveTitle('Media and brand resources · NoCharge');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Media and brand resources');

    const levels = await page.evaluate(() =>
      [...document.querySelectorAll('main h1, main h2, main h3')].map((heading) => Number(heading.tagName[1])),
    );
    expect(levels[0]).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(Math.abs(levels[index] - levels[index - 1])).toBeLessThanOrEqual(1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0);

    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 700 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/media/');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
        `overflow at ${viewport.width}px`,
      ).toBeLessThanOrEqual(0);
    }
  });

  test('publishes the verified facts and the verified contact address', async ({ page }) => {
    await page.goto('/media/');
    await expect(page.getByText(/original browser games/).first()).toBeVisible();
    await expect(page.getByText('Memory Match, Word Tile Rush, Color Flip, Beacon Lattice').first()).toBeVisible();
    // The footer carries the same address on every page, so scope to the page.
    await expect(page.locator('.media-page').getByText('hello@nocharge.net')).toBeVisible();
    await expect(page.getByText(/Last reviewed: 2026-08-24/)).toBeVisible();
    // No press-only address, no social destinations, no Amazon content.
    await expect(page.getByText('press@nocharge.net')).toHaveCount(0);
    expect(await page.locator('a[href*="amazon"]').count()).toBe(0);
    expect(await page.locator('a[href*="twitter"], a[href*="bsky"], a[href*="mastodon"], a[href*="youtube"], a[href*="instagram"], a[href*="facebook"], a[href*="tiktok"]').count()).toBe(0);
  });

  test('every download link resolves to the right file type', async ({ page, request }) => {
    await page.goto('/media/');
    const links = await page.locator('a[download]').evaluateAll((anchors) =>
      anchors.map((anchor) => ({ href: anchor.getAttribute('href') ?? '', text: anchor.textContent ?? '' })),
    );
    expect(links.length).toBeGreaterThanOrEqual(12);
    for (const link of links) {
      expect(link.href.startsWith('/'), `${link.text} must be a local download`).toBe(true);
      const response = await request.get(link.href);
      expect(response.status(), `${link.href} should resolve`).toBe(200);
    }
    // Every label names the file format so users know what they are downloading.
    for (const link of links) {
      expect(link.text).toMatch(/SVG|PNG|JPG|ZIP|WebP|JPEG|archive/i);
    }
  });

  test('has no automatically detectable accessibility violations', async ({ page }) => {
    await page.goto('/media/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

test.describe('social metadata, manifest, favicons, and feeds', () => {
  test('homepage uses the default card and declares feed autodiscovery', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://nocharge.net${DEFAULT_CARD}`);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /NoCharge/);
    const feed = page.locator('link[rel="alternate"][type="application/rss+xml"]');
    await expect(feed).toHaveAttribute('href', 'https://nocharge.net/feed.xml');
    await expect(feed).toHaveAttribute('title', 'NoCharge feed');
  });

  test('game pages keep their specific social cards', async ({ page }) => {
    for (const slug of ['memory-match', 'word-tile-rush', 'color-flip', 'beacon-lattice']) {
      await page.goto(`/games/${slug}/`);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        `https://nocharge.net/game-art/${slug}/social-card.jpg`,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    }
  });

  test('my arcade metadata is static and contains no browser-local results', async ({ page }) => {
    await page.goto('/my-arcade/');
    const values = await page.evaluate(() => {
      const read = (selector: string) => document.querySelector(selector)?.getAttribute('content') ?? '';
      return [
        read('meta[property="og:title"]'),
        read('meta[property="og:description"]'),
        read('meta[name="description"]'),
        read('meta[property="og:image"]'),
        read('meta[property="og:image:alt"]'),
      ];
    });
    for (const value of values) {
      expect(value).toBeTruthy();
      expect(value).not.toMatch(/localStorage|recent|score|progress|play record|saved result/i);
    }
    expect(values[3]).toBe(`https://nocharge.net${DEFAULT_CARD}`);
    // The page HTML itself must not contain a serialized local result.
    const html = await page.content();
    expect(html).not.toMatch(/nocharge:(?:best|recent|progress)/);
  });

  test('no page invents a social handle', async ({ page }) => {
    for (const path of ['/', '/about/', '/media/', '/changelog/']) {
      await page.goto(path);
      await expect(page.locator('meta[name="twitter:site"]')).toHaveCount(0);
    }
  });

  test('manifest is served with accurate values and existing icons', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBe('NoCharge');
    expect(manifest.short_name).toBe('NoCharge');
    expect(manifest.start_url).toBe('/');
    expect(manifest.icons).toHaveLength(4);
    const purposes = manifest.icons.map((icon: { purpose: string }) => icon.purpose).sort();
    expect(purposes).toEqual(['any', 'any', 'maskable', 'maskable']);
    for (const icon of manifest.icons as { src: string }[]) {
      const asset = await request.get(icon.src);
      expect(asset.status(), icon.src).toBe(200);
    }
  });

  test('favicon declarations cover SVG, ICO, PNG sizes, apple touch, and theme', async ({ page, request }) => {
    await page.goto('/');
    const icons = await page.locator('link[rel="icon"]').evaluateAll((links) =>
      links.map((link) => ({ href: link.getAttribute('href'), type: link.getAttribute('type'), sizes: link.getAttribute('sizes') })),
    );
    expect(icons.some((icon) => icon.href === '/favicon.svg' && icon.type === 'image/svg+xml')).toBe(true);
    expect(icons.some((icon) => icon.href === '/favicon.ico')).toBe(true);
    expect(icons.some((icon) => icon.href === '/favicon-16x16.png')).toBe(true);
    expect(icons.some((icon) => icon.href === '/favicon-32x32.png')).toBe(true);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#121212');
    for (const icon of icons) {
      if (!icon.href) continue;
      const response = await request.get(icon.href);
      expect(response.status(), icon.href).toBe(200);
    }
  });

  test('general feed is valid RSS with canonical items and no merchant content', async ({ request }) => {
    const response = await request.get('/feed.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/^<\?xml/);
    expect(body).toContain('<rss');
    const items = body.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    expect(items.length).toBeGreaterThanOrEqual(9);
    for (const item of items) {
      expect(item).toMatch(/<guid isPermaLink="true">https:\/\/nocharge\.net\/changelog\/#/);
      expect(item).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
    }
    expect(body).not.toMatch(/amazon\.com|tag=nocharge-20|<script/i);
    expect(new Set(items.map((item) => item.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1])).size).toBe(items.length);
    // The Quiet Setup feed must also remain valid.
    const setupFeed = await request.get('/setup/feed.xml');
    expect(setupFeed.status()).toBe(200);
  });

  test('media kit archive responds as a ZIP download', async ({ request }) => {
    const response = await request.get('/media/nocharge-media-kit.zip');
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['content-type']).toMatch(/zip|octet-stream/);
    const body = await response.body();
    expect(body.length).toBeGreaterThan(100_000);
    expect(body.readUInt32LE(0)).toBe(0x04034b50); // ZIP local file signature
  });
});
