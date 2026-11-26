import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const reportDirectory = path.join(root, '.nocharge-review', 'adsense-placement');
const modes = ['light', 'dark'];
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'mobile-390', width: 390, height: 844 },
];
const placements = [
  { route: '/', slotId: 'home-footer' },
  { route: '/arcade/', slotId: 'arcade-hub-footer' },
  { route: '/experiences/', slotId: 'experiences-hub-footer' },
  { route: '/tools/', slotId: 'tools-hub-footer' },
  { route: '/guides/', slotId: 'guides-hub-footer' },
  { route: '/discover/', slotId: 'discover-footer' },
  { route: '/arcade/pattern-pairs/', slotId: 'arcade-detail-companion' },
  { route: '/arcade/simon/', slotId: 'arcade-detail-companion' },
  { route: '/tools/word-counter/', slotId: 'tools-detail-post-documentation' },
  { route: '/guides/a-local-first-workflow-for-browser-tools/', slotId: 'guides-detail-mid-editorial' },
];
const blockedNetworkPatterns = [
  /adsbygoogle/i,
  /googlesyndication/i,
  /doubleclick\.net/i,
  /googleadservices/i,
  /googletagmanager/i,
  /google-analytics/i,
  /analytics\.js/i,
  /gtag\/(?:js|js\?)/i,
  /ca-pub-[\da-z-]+/i,
];

const indexHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
const calendarMatch = indexHtml.match(/<script id="nocharge-holiday-calendar" type="application\/json">([^<]+)<\/script>/);
assert.ok(calendarMatch, 'production HTML embeds the event registry for seasonal previews');
const events = JSON.parse(calendarMatch[1]);
assert.equal(events.length, 16, 'all 16 seasonal palettes are available for ad-theme QA');
const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapRoutes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(([, url]) => new URL(url).pathname);
const arcadeDetails = sitemapRoutes.filter((route) => /^\/arcade\/[^/]+\/$/u.test(route));
const toolDetails = sitemapRoutes.filter((route) => /^\/tools\/[^/]+\/$/u.test(route));
assert.ok(arcadeDetails.length > 0 && toolDetails.length > 0, 'Arcade and Tool detail routes are present in the sitemap');

const server = await preview({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  logLevel: 'error',
  preview: { host: '127.0.0.1', port: 0, strictPort: false },
});
const address = server.httpServer.address();
assert.ok(address && typeof address === 'object', 'production preview listens on a TCP port');
const origin = `http://127.0.0.1:${address.port}`;
let browser;
const externalRequests = [];
const blockedAdRequests = [];
const failedRequests = [];
const pageErrors = [];
let responsiveChecks = 0;
let placementChecks = 0;
let arcadeSafetyChecks = 0;
let toolSeparationChecks = 0;
let paletteChecks = 0;
const arcadeSeparationMeasurements = [];

function urlWithEvent(route, eventId) {
  const url = new URL(route, origin);
  url.searchParams.set('previewEvent', eventId);
  return url.href;
}

function requestIsBlockedAd(url) {
  return blockedNetworkPatterns.some((pattern) => pattern.test(url));
}

async function waitForTheme(page, mode, eventId) {
  await page.waitForFunction(({ theme, event }) => document.documentElement.dataset.theme === theme
    && document.documentElement.dataset.event === event
    && document.querySelector('select[aria-label="Seasonal theme preference"]')?.value === 'auto',
  { theme: mode, event: eventId });
}

async function revealForVisualQA(page, slotId) {
  const slot = page.locator(`[data-ad-slot="${slotId}"]`);
  await slot.waitFor({ state: 'attached' });
  await slot.evaluate((element) => {
    // This test-only marker reveals CSS; it does not alter the disabled adapter,
    // network flag, or application config and cannot issue an ad request.
    element.setAttribute('data-ad-status', 'preview');
    element.setAttribute('aria-hidden', 'false');
    element.style.transition = 'none';
  });
  // The global reduced-motion rule shortens all property transitions. Wait for
  // its next style frame before measuring the preview colors/visibility.
  await page.waitForFunction((id) => {
    const element = document.querySelector(`[data-ad-slot="${id}"]`);
    if (!element || element.getAttribute('data-ad-status') !== 'preview') return false;
    const style = getComputedStyle(element);
    const label = element.querySelector('.ad-slot__label');
    return style.visibility === 'visible'
      && style.backgroundColor !== 'rgba(0, 0, 0, 0)'
      && label
      && getComputedStyle(label).color !== 'rgba(0, 0, 0, 0)';
  }, slotId, { timeout: 5_000 });
  return slot;
}

async function checkNoHorizontalOverflow(page, label, width) {
  const state = await page.evaluate(() => ({
    viewport: window.innerWidth,
    htmlClient: document.documentElement.clientWidth,
    htmlScroll: document.documentElement.scrollWidth,
    bodyScroll: document.body.scrollWidth,
  }));
  assert.equal(state.viewport, width, `${label} uses the requested viewport width`);
  assert.ok(state.htmlScroll <= state.htmlClient + 1 && state.bodyScroll <= state.htmlClient + 1,
    `${label} has no horizontal overflow (${JSON.stringify(state)})`);
  responsiveChecks += 1;
}

async function checkSlotVisual(page, slotId, label, width) {
  const state = await page.locator(`[data-ad-slot="${slotId}"]`).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const labelElement = element.querySelector('.ad-slot__label');
    const labelStyle = labelElement ? getComputedStyle(labelElement) : null;
    return {
      slotStatus: element.getAttribute('data-ad-status'),
      enabled: element.getAttribute('data-ad-enabled'),
      networkRequests: element.getAttribute('data-ad-network-requests'),
      visible: style.visibility === 'visible' && style.display !== 'none',
      text: labelElement?.textContent?.trim() ?? '',
      textColor: labelStyle?.color ?? '',
      backgroundColor: style.backgroundColor,
      fontSize: labelStyle?.fontSize ?? '',
      fontWeight: labelStyle?.fontWeight ?? '',
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      slotScrollWidth: element.scrollWidth,
      slotClientWidth: element.clientWidth,
    };
  });
  assert.equal(state.slotStatus, 'preview', `${label} is only in test-preview styling`);
  assert.equal(state.enabled, 'false', `${label} remains functionally disabled while previewed`);
  assert.equal(state.networkRequests, 'false', `${label} still disallows network activity while previewed`);
  assert.equal(state.visible, true, `${label} label styling can be evaluated without activation (${JSON.stringify(state)})`);
  assert.equal(state.text, 'Advertisements', `${label} uses an explicit future advertising label`);
  assert.equal(state.fontSize, '10px', `${label} keeps the reserved high-visibility label style`);
  assert.ok(Number(state.fontWeight) >= 700, `${label} label is bold enough to distinguish from content`);
  assert.ok(state.width > 0 && state.height > 0, `${label} retains its reserved dimensions`);
  assert.ok(state.left >= -1 && state.right <= width + 1, `${label} fits inside the viewport`);
  assert.ok(state.slotScrollWidth <= state.slotClientWidth + 1, `${label} itself has no internal horizontal overflow`);
  const ratio = contrastRatio(state.textColor, state.backgroundColor);
  assert.ok(ratio >= 4.5, `${label} ad-label contrast is WCAG AA for normal text (${ratio.toFixed(2)}:1, ${state.textColor} on ${state.backgroundColor})`);
  await checkNoHorizontalOverflow(page, label, width);
  return { ...state, contrastRatio: Number(ratio.toFixed(2)) };
}

async function checkDisabledDom(page, slotId, route, expectedZone, expectedPageType) {
  const state = await page.locator(`[data-ad-slot="${slotId}"]`).evaluate((element) => ({
    slot: element.getAttribute('data-ad-slot'),
    zone: element.getAttribute('data-ad-zone'),
    pageType: element.getAttribute('data-ad-page-type'),
    status: element.getAttribute('data-ad-status'),
    enabled: element.getAttribute('data-ad-enabled'),
    networkRequests: element.getAttribute('data-ad-network-requests'),
    ariaHidden: element.getAttribute('aria-hidden'),
  }));
  assert.deepEqual(state, {
    slot: slotId,
    zone: expectedZone,
    pageType: expectedPageType,
    status: 'inactive',
    enabled: 'false',
    networkRequests: 'false',
    ariaHidden: 'true',
  }, `${route} emits a verifiable but strictly inactive approved slot`);
}

function intersects(a, b) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function boxDistance(a, b) {
  const dx = Math.max(0, a.left - b.right, b.left - a.right);
  const dy = Math.max(0, a.top - b.bottom, b.top - a.bottom);
  return Math.hypot(dx, dy);
}

async function geometryFor(page, slotId) {
  return page.locator(`[data-ad-slot="${slotId}"]`).evaluate((slot) => {
    const toBox = (element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const interactive = document.querySelector('.interactive-viewport');
    const docs = document.querySelector('.tool-documentation');
    const controls = [...document.querySelectorAll('.interactive-viewport input, .interactive-viewport textarea, .interactive-viewport select, .interactive-viewport button, .interactive-viewport [role="slider"], .interactive-viewport [role="button"]')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      })
      .map(toBox);
    return {
      slot: toBox(slot),
      interactive: interactive ? toBox(interactive) : null,
      documentation: docs ? toBox(docs) : null,
      controls,
    };
  });
}

function parseComputedRgb(value) {
  const match = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/u);
  assert.ok(match, `computed CSS color is an opaque RGB value: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function luminance(value) {
  const channels = parseComputedRgb(value).map((channel) => channel / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  for (const viewport of viewports) {
    const eventContrast = new Map();
    for (const mode of modes) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme: mode,
        timezoneId: 'America/New_York',
        reducedMotion: 'reduce',
      });
      await context.addInitScript((theme) => {
        try {
          localStorage.setItem('nocharge-theme', theme);
          localStorage.setItem('nocharge-seasonal-mode', 'auto');
        } catch { /* The checks below expose any preference/bootstrap mismatch. */ }
      }, mode);
      const page = await context.newPage();
      page.setDefaultTimeout(8_000);
      page.setDefaultNavigationTimeout(15_000);
      let currentRoute = '';
      page.on('pageerror', (error) => pageErrors.push({ mode, viewport: viewport.name, route: currentRoute, message: error.message }));
      page.on('request', (request) => {
        const requestUrl = request.url();
        if (requestIsBlockedAd(requestUrl)) blockedAdRequests.push({ mode, viewport: viewport.name, route: currentRoute, url: requestUrl });
        if (new URL(requestUrl).origin !== origin) externalRequests.push({ mode, viewport: viewport.name, route: currentRoute, url: requestUrl });
      });
      page.on('requestfailed', (request) => failedRequests.push({ mode, viewport: viewport.name, route: currentRoute, url: request.url(), reason: request.failure()?.errorText ?? 'unknown' }));

      // Reveal each approved zone in a local-only visual preview; the application
      // still reports data-ad-enabled=false and data-ad-network-requests=false.
      for (const placement of placements) {
        currentRoute = placement.route;
        const response = await page.goto(urlWithEvent(placement.route, 'halloween'), { waitUntil: 'domcontentloaded' });
        assert.equal(response?.status(), 200, `${placement.route} returns HTTP 200`);
        await waitForTheme(page, mode, 'halloween');
        const slot = page.locator(`[data-ad-slot="${placement.slotId}"]`);
        await slot.waitFor({ state: 'attached' });
        const zone = await slot.getAttribute('data-ad-zone');
        const pageType = await slot.getAttribute('data-ad-page-type');
        await checkDisabledDom(page, placement.slotId, placement.route, zone, pageType);
        await revealForVisualQA(page, placement.slotId);
        await checkSlotVisual(page, placement.slotId, `${mode}/${viewport.name}/${placement.route}`, viewport.width);
        assert.equal(await page.evaluate(() => document.cookie), '', `${placement.route} does not set cookies`);
        assert.equal(await page.locator('script[src]').evaluateAll((scripts) => scripts.every((script) => new URL(script.src, location.href).origin === location.origin)), true,
          `${placement.route} loads only same-origin scripts`);
        placementChecks += 1;
      }

      // Every published Tool and Arcade detail page gets a safety-spacing check.
      for (const [type, routes] of [['arcade', arcadeDetails], ['tool', toolDetails]]) {
        for (const route of routes) {
          currentRoute = route;
          const response = await page.goto(urlWithEvent(route, 'halloween'), { waitUntil: 'domcontentloaded' });
          assert.equal(response?.status(), 200, `${route} returns HTTP 200`);
          await waitForTheme(page, mode, 'halloween');
          await page.locator('.interactive-module').waitFor({ state: 'visible' });
          const slotId = type === 'arcade' ? 'arcade-detail-companion' : 'tools-detail-post-documentation';
          await revealForVisualQA(page, slotId);
          const geometry = await geometryFor(page, slotId);
          assert.ok(geometry.interactive, `${route} has a live interactive surface for the spacing check`);
          const overlaps = geometry.controls.filter((control) => intersects(control, geometry.slot));
          assert.deepEqual(overlaps, [], `${route} ad reservation overlaps no visible game/tool input or control`);
          if (type === 'arcade') {
            const separation = geometry.slot.top - geometry.interactive.bottom;
            assert.ok(separation >= 160, `${route} preserves the required 160px between the playable game and companion zone (${separation}px)`);
            arcadeSeparationMeasurements.push({ route, mode, viewport: viewport.name, separationPx: Number(separation.toFixed(1)) });
            arcadeSafetyChecks += 1;
          } else {
            assert.ok(geometry.documentation, `${route} includes full documentation before its reserved slot`);
            const documentationGap = geometry.slot.top - geometry.documentation.bottom;
            assert.ok(documentationGap >= 24, `${route} keeps at least 24px after the tool documentation/FAQ (${documentationGap}px)`);
            const controlGaps = geometry.controls.map((control) => boxDistance(control, geometry.slot));
            const nearestControl = controlGaps.length ? Math.min(...controlGaps) : boxDistance(geometry.interactive, geometry.slot);
            assert.ok(nearestControl >= 24, `${route} keeps at least 24px from the nearest tool control (${nearestControl.toFixed(1)}px)`);
            toolSeparationChecks += 1;
          }
          await checkNoHorizontalOverflow(page, `${mode}/${viewport.name}/${route}`, viewport.width);
          assert.equal(await page.evaluate(() => document.cookie), '', `${route} does not set cookies`);
        }
      }

      // All 16 event palettes are tested on a visible, test-only slot preview at
      // both breakpoints and in both Light and Dark modes.
      for (const event of events) {
        currentRoute = `/${event.id}`;
        const response = await page.goto(urlWithEvent('/', event.id), { waitUntil: 'domcontentloaded' });
        assert.equal(response?.status(), 200, `home returns HTTP 200 for ${event.id}`);
        await waitForTheme(page, mode, event.id);
        await revealForVisualQA(page, 'home-footer');
        const visual = await checkSlotVisual(page, 'home-footer', `${mode}/${viewport.name}/${event.id}`, viewport.width);
        eventContrast.set(`${viewport.name}/${event.id}/${mode}`, { text: visual.textColor, surface: visual.backgroundColor, ratio: visual.contrastRatio });
        paletteChecks += 1;
      }
      for (const excluded of ['/shop/', '/search/?q=memory', '/about/', '/arcade/categories/puzzle/', '/not-a-real-route/']) {
        currentRoute = excluded;
        const response = await page.goto(urlWithEvent(excluded, 'halloween'), { waitUntil: 'domcontentloaded' });
        assert.equal(response?.status(), 200, `${excluded} resolves through the app shell`);
        assert.equal(await page.locator('[data-ad-slot]').count(), 0, `${excluded} is excluded from ad placement`);
        await checkNoHorizontalOverflow(page, `${mode}/${viewport.name}/${excluded}`, viewport.width);
      }
      await context.close();
    }
    for (const event of events) {
      const light = eventContrast.get(`${viewport.name}/${event.id}/light`);
      const dark = eventContrast.get(`${viewport.name}/${event.id}/dark`);
      assert.ok(light && dark, `${event.id} was checked in both Light and Dark modes`);
      assert.notEqual(light.text, dark.text, `${event.id} ad-label foreground adapts between Light and Dark`);
      assert.notEqual(light.surface, dark.surface, `${event.id} ad surface adapts between Light and Dark`);
    }
  }

  assert.deepEqual(blockedAdRequests, [], 'the browser makes zero requests to known ad or analytics endpoints');
  assert.deepEqual(externalRequests, [], 'the browser makes zero third-party network requests');
  assert.deepEqual(failedRequests, [], 'placement and detail visits have no failed requests');
  assert.deepEqual(pageErrors, [], 'placement and detail visits have no uncaught page errors');
  assert.ok(arcadeSeparationMeasurements.length > 0, 'Arcade spacing was measured on every published game route');
  const minimumArcadeSeparationPx = Math.min(...arcadeSeparationMeasurements.map(({ separationPx }) => separationPx));

  await mkdir(reportDirectory, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    result: 'PASS',
    browser: 'Playwright Chromium (headless)',
    themes: modes,
    events: events.map(({ id }) => id),
    viewports,
    approvedPlacements: placements,
    arcadeDetailRoutes: arcadeDetails,
    toolDetailRoutes: toolDetails,
    checks: {
      placementVisits: placementChecks,
      arcadeSafetyChecks,
      minimumArcadeSeparationPx,
      arcadeSeparationMeasurements,
      toolSeparationChecks,
      responsiveOverflowChecks: responsiveChecks,
      seasonalPaletteContrastChecks: paletteChecks,
      blockedAdRequests: blockedAdRequests.length,
      externalRequests: externalRequests.length,
      failedRequests: failedRequests.length,
      pageErrors: pageErrors.length,
    },
    constraints: {
      arcadeMinimumGameBoundaryPx: 160,
      toolMinimumDocumentationAndControlGapPx: 24,
      minimumAdLabelContrast: '4.5:1 WCAG AA',
      slotPreviewIsLocalOnly: true,
      liveAdStatusRemainsDisabled: true,
    },
  };
  await writeFile(path.join(reportDirectory, 'browser-results.json'), `${JSON.stringify(report, null, 2)}\n`);
  const markdown = [
    '# NOCHARGE V2 Phase 4A — Ad placement browser verification',
    '',
    `**Result:** ${report.result}  `,
    `**Generated:** ${report.generatedAt}  `,
    `**Browser:** ${report.browser}`, '',
    '## Coverage', '',
    `- Approved zones previewed (visual-only, still disabled): ${placementChecks} visits across ${placements.length} zone types, Light/Dark, and 1440px/390px.`,
    `- Arcade game safety spacing: ${arcadeSafetyChecks} route checks; minimum measured gap ${minimumArcadeSeparationPx}px (required: 160px).`,
    `- Tool documentation/control separation: ${toolSeparationChecks} route checks; at least 24px after the documentation/FAQ and from the nearest interactive control.`,
    `- Seasonal label contrast/overflow: ${paletteChecks} checks (16 palettes × Light/Dark × 1440px/390px); normal text meets 4.5:1.`,
    `- Horizontal overflow checks: ${responsiveChecks}; failures: 0.`,
    `- Ad/analytics endpoint requests: ${blockedAdRequests.length}; any third-party request: ${externalRequests.length}; failed requests: ${failedRequests.length}; page errors: ${pageErrors.length}.`,
    '',
    '## Active safeguards', '',
    '- Every rendered slot starts with `data-ad-status="inactive"`, `data-ad-enabled="false"`, and `data-ad-network-requests="false"`.',
    '- The visual preview changes only the DOM status marker in Playwright. It does not change central configuration or invoke any ad adapter.',
    '- No cookies, vendor scripts, publisher IDs, or third-party network requests were observed.',
    '',
    'Full route lists and per-matrix counts are in `browser-results.json`.',
    '',
  ].join('\n');
  await writeFile(path.join(reportDirectory, 'browser-results.md'), markdown);
  console.log(`Ad placement browser checks passed: ${placementChecks} approved-zone visits, ${arcadeSafetyChecks} Arcade spacing checks (minimum ${minimumArcadeSeparationPx}px; required 160px), ${toolSeparationChecks} Tool separation checks, ${paletteChecks} event contrast/overflow checks, and ${responsiveChecks} responsive overflow checks.`);
  console.log(`Report: ${path.join(reportDirectory, 'browser-results.md')}`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
