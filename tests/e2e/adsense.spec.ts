import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const PUBLISHER_ID = 'ca-pub-1566091161594729';
const BOTTOM_SLOT_ID = '6964002740';
const ADSENSE_SCRIPT_PATTERN = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
const ADS_TXT_LINE = 'google.com, pub-1566091161594729, DIRECT, f08c47fec0942fa0';

const ELIGIBLE_PATHS = [
  '/',
  '/arcade/',
  '/guides/',
  '/guides/memory-match/',
  '/articles/',
  '/articles/memory-match-systematic-board-scan/',
  '/games/memory-match/',
  '/games/word-tile-rush/',
  '/games/color-flip/',
  '/games/beacon-lattice/',
] as const;

const AD_FREE_PATHS = [
  '/privacy/',
  '/terms/',
  '/accessibility/',
  '/advertising/',
  '/about/',
  '/changelog/',
  '/404.html',
] as const;

test.beforeEach(async ({ page }) => {
  // Seeds a denied analytics choice and stubs every Google endpoint so no
  // test ever contacts or clicks a live ad.
  await denyOptionalServices(page);
});

test('eligible pages render exactly one banner with the exact publisher and slot ids', async ({ page }) => {
  for (const path of ELIGIBLE_PATHS) {
    await page.goto(path);

    const banner = page.locator('[data-ad-banner]');
    await expect(banner, `${path} should show one banner`).toHaveCount(1);
    await expect(banner.getByText('Advertisement')).toBeVisible();
    await expect(banner.locator('.ad-banner__label')).toHaveText('Advertisement');

    const ins = banner.locator('ins.adsbygoogle');
    await expect(ins).toHaveCount(1);
    await expect(ins).toHaveAttribute('data-ad-client', PUBLISHER_ID);
    await expect(ins).toHaveAttribute('data-ad-slot', BOTTOM_SLOT_ID);
    await expect(ins).toHaveAttribute('data-ad-format', 'auto');
    await expect(ins).toHaveAttribute('data-full-width-responsive', 'true');
    await expect(ins).toHaveAttribute('style', /display\s*:\s*block/i);

    // The banner is the only AdSense slot on the page and the tag script
    // appears exactly once.
    await expect(page.locator('.adsbygoogle')).toHaveCount(1);
    await expect(page.locator(`script[src*="${ADSENSE_SCRIPT_PATTERN}"]`)).toHaveCount(1);
  }
});

test('the AdSense tag is registered exactly once per page', async ({ page }) => {
  await page.goto('/');
  const queued = await page.evaluate(() => {
    const queue = (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle;
    return Array.isArray(queue) ? queue.length : -1;
  });
  expect(queued).toBe(1);
});

test('the official Google consent message tag is loaded on every page', async ({ page }) => {
  for (const path of ['/', '/games/memory-match/', '/privacy/']) {
    await page.goto(path);
    await expect(
      page.locator(`script[src*="fundingchoicesmessages.google.com/i/pub-1566091161594729?ers=1"]`),
      `${path} should load the Privacy & messaging tag`,
    ).toHaveCount(1);
  }
});

test('ad-free pages and utility routes have no banner and no AdSense script', async ({ page, request }) => {
  for (const path of AD_FREE_PATHS) {
    await page.goto(path);
    await expect(page.locator('[data-ad-banner]'), `${path} should be ad-free`).toHaveCount(0);
    await expect(page.locator(`script[src*="${ADSENSE_SCRIPT_PATTERN}"]`), `${path} should not load the AdSense tag`).toHaveCount(0);
  }

  const health = await request.get('/health.json');
  expect(health.ok()).toBe(true);
  const body = await health.text();
  expect(body).not.toContain('adsbygoogle');
  expect(body).not.toContain(PUBLISHER_ID);
});

test('the old Adsterra ad-host routes are gone', async ({ request }) => {
  for (const unit of ['banner-728x90', 'banner-320x50', 'rect-300x250']) {
    const response = await request.get(`/ads/${unit}/`);
    expect(response.status(), `/ads/${unit}/ should no longer exist`).toBe(404);
  }
  const index = await request.get('/ads/');
  expect(index.status()).toBe(404);
});

test('public/ads.txt is the exact AdSense line', async ({ request }) => {
  const response = await request.get('/ads.txt');
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body.trim()).toBe(ADS_TXT_LINE);
  // Exactly one AdSense record, nothing else.
  const lines = body.trim().split('\n').filter((line) => line.trim().length > 0);
  expect(lines).toEqual([ADS_TXT_LINE]);
});

test('no Adsterra or Smartlink implementation artifacts remain', async ({ page }) => {
  for (const path of ['/', '/games/memory-match/', '/privacy/', '/advertising/']) {
    await page.goto(path);
    const html = (await page.content()).toLowerCase();
    for (const needle of ['highperformanceformat', 'harryinspectionlucy', 'adsterra.com', 'atoptions']) {
      expect(html, `${path} must not contain ${needle}`).not.toContain(needle);
    }
    await expect(
      page.locator('script[src*="highperformanceformat"], iframe[src*="/ads/"], a[href*="/ads/"], script[src*="/ads/"]'),
      `${path} must not reference ad-host pages`,
    ).toHaveCount(0);
    // No custom sandboxed ad iframes anywhere.
    await expect(page.locator('[data-ad-banner] iframe')).toHaveCount(0);
    await expect(page.locator('.ad-slot')).toHaveCount(0);
  }
});

test('the banner is in-flow before the footer, never sticky or floating', async ({ page }) => {
  await page.goto('/');

  const order = await page.evaluate(() => {
    const banner = document.querySelector('[data-ad-banner]');
    const footer = document.querySelector('.site-footer');
    const main = document.querySelector('.site-main');
    if (!banner || !footer || !main) return null;
    const afterMain = !!(banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_PRECEDING);
    const beforeFooter = !!(footer.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_PRECEDING);
    const position = getComputedStyle(banner).position;
    return { afterMain, beforeFooter, position };
  });

  expect(order?.afterMain).toBe(true);
  expect(order?.beforeFooter).toBe(true);
  expect(order?.position).toBe('static');
  // No sticky/fixed banner variant exists anymore.
  await expect(page.locator('.site-banner--sticky, .site-banner')).toHaveCount(0);
});

test('the banner reserves responsive space to reduce layout shift', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const desktop = await page.locator('.ad-banner__slot').evaluate((el) => getComputedStyle(el).minHeight);
  expect(parseFloat(desktop)).toBeGreaterThanOrEqual(90);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const mobile = await page.locator('.ad-banner__slot').evaluate((el) => getComputedStyle(el).minHeight);
  expect(parseFloat(mobile)).toBeGreaterThanOrEqual(100);
});

test('a stale wide filled creative cannot force horizontal page overflow', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');

    // Reproduce what the tag leaves behind when it fills the slot while the
    // container is wider (device rotation, pinch zoom) and the viewport
    // shrinks afterwards: explicit pixel dimensions set inline, never
    // re-measured. Without the slot/unit width guard this stretches the
    // page past the viewport and clips both edges on small screens.
    await page.locator('ins.adsbygoogle').evaluate((el) => {
      el.style.width = '728px';
      el.style.height = '90px';
    });

    await expect
      .poll(async () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
      .toBeLessThanOrEqual(0);
  }
});

test('the game-page banner sits below all game content and at least 150px from gameplay', async ({ page }) => {
  await page.goto('/games/memory-match/');

  const metrics = await page.evaluate(() => {
    const banner = document.querySelector('[data-ad-banner]');
    const viewport = document.querySelector('[data-game-viewport]');
    const related = document.querySelector('.game-related');
    if (!banner || !viewport || !related) return null;
    const bannerTop = banner.getBoundingClientRect().top + window.scrollY;
    const viewportBottom = viewport.getBoundingClientRect().bottom + window.scrollY;
    const relatedBottom = related.getBoundingClientRect().bottom + window.scrollY;
    return {
      separation: bannerTop - viewportBottom,
      belowRelated: bannerTop - relatedBottom,
      insideGameplay: banner.closest('[data-game-viewport], [data-game-root], .game-controls') !== null,
    };
  });

  expect(metrics, 'banner placement could not be measured').not.toBeNull();
  expect(metrics!.insideGameplay).toBe(false);
  expect(metrics!.belowRelated).toBeGreaterThanOrEqual(0);
  expect(metrics!.separation).toBeGreaterThanOrEqual(150);
});

test('the footer consent link reopens the official Google consent message', async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { googlefc?: Record<string, unknown>; __nochargeRevoked?: boolean }).googlefc = {
      showRevocationMessage: () => {
        (window as Window & { __nochargeRevoked?: boolean }).__nochargeRevoked = true;
      },
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Privacy and cookie settings' }).click();
  expect(await page.evaluate(() => (window as Window & { __nochargeRevoked?: boolean }).__nochargeRevoked)).toBe(true);
});

test('the footer consent link falls back to Google policy when the tag is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const opened: string[] = [];
    (window as Window & { __openedUrls?: string[] }).__openedUrls = opened;
    window.open = ((url?: unknown) => {
      opened.push(String(url));
      return null;
    }) as typeof window.open;
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Privacy and cookie settings' }).click();
  const opened = await page.evaluate(() => (window as Window & { __openedUrls?: string[] }).__openedUrls);
  expect(opened).toEqual(['https://policies.google.com/privacy']);
});

test('no fake ids, auto ads, or non-banner ad formats exist', async ({ page }) => {
  await page.goto('/');

  const ids = await page.evaluate(() => {
    const clients = [...document.querySelectorAll('[data-ad-client]')].map((el) => el.getAttribute('data-ad-client'));
    const slots = [...document.querySelectorAll('[data-ad-slot]')].map((el) => el.getAttribute('data-ad-slot'));
    const scriptClients = [...document.querySelectorAll('script[src*="adsbygoogle.js"]')]
      .map((el) => el.getAttribute('src') ?? '')
      .map((src) => new URL(src).searchParams.get('client'));
    return { clients, slots, scriptClients };
  });

  expect(ids.clients).toEqual([PUBLISHER_ID]);
  expect(ids.slots).toEqual([BOTTOM_SLOT_ID]);
  expect(ids.scriptClients).toEqual([PUBLISHER_ID]);

  const html = await page.content();
  // Auto ads markers, matched content, interstitials, rewarded, and H5/AMP
  // test-ad machinery must all be absent.
  expect(html).not.toContain('enable_page_level_ads');
  expect(html).not.toContain('data-ad-format="autorelaxed"');
  expect(html).not.toContain('data-ad-layout');
  expect(html).not.toContain('gpt.js');
});
