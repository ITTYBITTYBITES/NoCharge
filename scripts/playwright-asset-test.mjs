import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];
const surfaces = [
  { route: '/tools/', assetId: 'NC10-R3.1', iconId: 'tools-section', selector: '.page-intro__title > .adaptive-icon', size: 44 },
  { route: '/guides/', assetId: 'NC09-R3.1', iconId: 'guides-section', selector: '.page-intro__title > .adaptive-icon', size: 44 },
  { route: '/tools/discovery-wheel/', assetId: 'NC11-B02-R3.1', iconId: 'discovery-wheel-tool', selector: '.detail-header__title-icon', size: 52 },
  { route: '/tools/game-finder/', assetId: 'NC12-B02-R3.1', iconId: 'game-finder-tool', selector: '.detail-header__title-icon', size: 52 },
  { route: '/tools/session-planner/', assetId: 'NC13-B02-R3.1', iconId: 'session-planner-tool', selector: '.detail-header__title-icon', size: 52 },
  { route: '/tools/random-activity/', assetId: 'NC14-B02-R3.1', iconId: 'random-activity-tool', selector: '.detail-header__title-icon', size: 52 },
  { route: '/tools/ambient-mixer/', assetId: 'NC15-B02-R3.1', iconId: 'ambient-mixer-tool', selector: '.detail-header__title-icon', size: 52 },
  { route: '/tools/singing-bowl-engine/', assetId: 'NC16-B02-R3.1', iconId: 'singing-bowl-tool', selector: '.detail-header__title-icon', size: 52 },
  { route: '/tools/reduced-motion-tester/', assetId: 'NC17-B02-R3.1', iconId: 'reduced-motion-tool', selector: '.detail-header__title-icon', size: 52 },
  { route: '/tools/touch-target-checker/', assetId: 'NC18-B02-R3.1', iconId: 'touch-target-tool', selector: '.detail-header__title-icon', size: 52 },
  { route: '/tools/storage-inspector/', assetId: 'NC19-B02-R3.1', iconId: 'storage-inspector-tool', selector: '.detail-header__title-icon', size: 52 },
  { route: '/tools/zoom-visualizer/', assetId: 'NC20-B02-R3.1', iconId: 'zoom-visualizer-tool', selector: '.detail-header__title-icon', size: 52 },
];
const accentByTheme = { light: 'rgb(15, 125, 71)', dark: 'rgb(18, 182, 106)' };
const failures = [];
let routeChecks = 0;
let contrastChecks = 0;
let fallbackChecks = 0;
let browser;

function contrastForColors(foreground, background) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (color) => {
    const values = color.match(/[\d.]+/gu)?.slice(0, 3).map(Number);
    assert.ok(values?.length === 3, `browser returned an RGB color: ${color}`);
    return 0.2126 * channel(values[0]) + 0.7152 * channel(values[1]) + 0.0722 * channel(values[2]);
  };
  const [high, low] = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (high + 0.05) / (low + 0.05);
}

const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
const eventRegistryMatch = html.match(/<script id="nocharge-holiday-calendar" type="application\/json">([^<]+)<\/script>/u);
assert.ok(eventRegistryMatch, 'prerendered home page provides the canonical 16-palette seasonal registry');
const events = JSON.parse(eventRegistryMatch[1]);
assert.equal(events.length, 16, 'all sixteen supported seasonal palettes are in the browser matrix');

const server = await preview({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  logLevel: 'error',
  preview: { host: '127.0.0.1', port: 0, strictPort: false },
});
const address = server.httpServer.address();
assert.ok(address && typeof address === 'object', 'production preview listens on a TCP port');
const origin = `http://127.0.0.1:${address.port}`;
const pageErrors = [];
const consoleErrors = [];
const failedRequests = [];

async function expectNoOverflow(page, label, width) {
  const result = await page.evaluate(() => ({
    width: window.innerWidth,
    client: document.documentElement.clientWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.equal(result.width, width, `${label} uses the intended viewport`);
  assert.ok(result.html <= result.client + 1 && result.body <= result.client + 1, `${label} has no horizontal overflow (${JSON.stringify(result)})`);
}

async function inspectMappedIcon(page, theme, event, target) {
  const icon = page.locator(target.selector);
  await icon.waitFor({ state: 'visible' });
  const state = await icon.evaluate((element) => {
    const svg = element.querySelector('svg');
    const root = document.documentElement;
    const body = document.body;
    const colorProbe = document.createElement('span');
    colorProbe.style.color = 'var(--nocharge-icon-accent)';
    body.append(colorProbe);
    const accent = getComputedStyle(colorProbe).color;
    colorProbe.remove();
    const background = getComputedStyle(body).backgroundColor;
    const strokes = svg
      ? [...svg.querySelectorAll('*')]
        .filter((shape) => !shape.getAttribute('stroke')?.includes('--nocharge-icon-surface'))
        .map((shape) => getComputedStyle(shape).stroke)
        .filter((stroke) => stroke && stroke !== 'none' && stroke !== 'rgba(0, 0, 0, 0)')
      : [];
    const bounds = element.getBoundingClientRect();
    const svgBounds = svg?.getBoundingClientRect();
    return {
      assetId: element.getAttribute('data-asset-id'),
      iconId: element.getAttribute('data-icon-id'),
      renderMode: element.getAttribute('data-render-mode'),
      wrapperHidden: element.getAttribute('aria-hidden'),
      wrapperRole: element.getAttribute('role'),
      svgHidden: svg?.getAttribute('aria-hidden'),
      svgRole: svg?.getAttribute('role'),
      focusable: svg?.getAttribute('focusable'),
      titleCount: svg?.querySelectorAll('title, desc').length,
      widthAttribute: svg?.getAttribute('width'),
      heightAttribute: svg?.getAttribute('height'),
      viewBox: svg?.getAttribute('viewBox'),
      hasExternalImage: Boolean(svg?.querySelector('image, use')),
      wrapperSize: [Math.round(bounds.width), Math.round(bounds.height)],
      svgSize: svgBounds ? [Math.round(svgBounds.width), Math.round(svgBounds.height)] : null,
      accent,
      background,
      strokes: [...new Set(strokes)],
      eventId: root.dataset.event,
      theme: root.dataset.theme,
      seasonalPreference: document.querySelector('select[aria-label="Seasonal theme preference"]')?.value,
      imageCount: element.querySelectorAll('img').length,
    };
  });

  assert.equal(state.assetId, target.assetId, `${target.route} renders only its mapped manifest asset (${theme}/${event})`);
  assert.equal(state.iconId, target.iconId, `${target.route} semantic icon reference is correct (${theme}/${event})`);
  assert.equal(state.renderMode, 'inline-svg', `${target.route} uses inline SVG (${theme}/${event})`);
  assert.equal(state.wrapperHidden, 'true', `${target.route} icon is decorative beside visible text (${theme}/${event})`);
  assert.equal(state.wrapperRole, null, `${target.route} does not create a redundant image role (${theme}/${event})`);
  assert.equal(state.svgHidden, 'true', `${target.route} inline vector is hidden from assistive technology (${theme}/${event})`);
  assert.equal(state.svgRole, null, `${target.route} decorative SVG has no image role (${theme}/${event})`);
  assert.equal(state.focusable, 'false', `${target.route} decorative SVG cannot enter keyboard focus (${theme}/${event})`);
  assert.equal(state.titleCount, 0, `${target.route} removes duplicate source title/description nodes (${theme}/${event})`);
  assert.equal(state.viewBox, '0 0 24 24', `${target.route} preserves the source vector viewBox (${theme}/${event})`);
  assert.deepEqual(state.wrapperSize, [target.size, target.size], `${target.route} has explicit ${target.size}px wrapper dimensions (${theme}/${event})`);
  assert.deepEqual(state.svgSize, [target.size, target.size], `${target.route} has explicit ${target.size}px SVG dimensions (${theme}/${event})`);
  assert.equal(state.widthAttribute, String(target.size), `${target.route} SVG width is explicit (${theme}/${event})`);
  assert.equal(state.heightAttribute, String(target.size), `${target.route} SVG height is explicit (${theme}/${event})`);
  assert.equal(state.hasExternalImage, false, `${target.route} makes no external SVG reference (${theme}/${event})`);
  assert.equal(state.imageCount, 0, `${target.route} is inline, not an img with deferred loading (${theme}/${event})`);
  assert.equal(state.eventId, event, `${target.route} uses the selected event palette (${theme}/${event})`);
  assert.equal(state.theme, theme, `${target.route} uses the selected base theme (${theme}/${event})`);
  assert.equal(state.seasonalPreference, 'auto', `${target.route} retains Seasonal Auto (${theme}/${event})`);
  assert.equal(state.accent, accentByTheme[theme], `${target.route} resolves the theme-specific icon accent (${theme}/${event})`);
  assert.ok(state.strokes.length > 0, `${target.route} includes visible vector strokes (${theme}/${event})`);
  for (const stroke of state.strokes) {
    const ratio = contrastForColors(stroke, state.background);
    assert.ok(ratio >= 3, `${target.route} stroke ${stroke} clears 3:1 on ${state.background} (${theme}/${event}, ratio ${ratio.toFixed(2)}:1)`);
    contrastChecks += 1;
  }
  const accentContrast = contrastForColors(state.accent, state.background);
  assert.ok(accentContrast >= 3, `${target.route} accent clears 3:1 (${theme}/${event}, ratio ${accentContrast.toFixed(2)}:1)`);
  contrastChecks += 1;
  routeChecks += 1;
}

async function inspectStructuralFallback(page, route, title) {
  const fallback = page.locator('.page-intro__title > .adaptive-icon');
  await fallback.waitFor({ state: 'visible' });
  const state = await fallback.evaluate((element) => {
    const style = getComputedStyle(element);
    const bg = getComputedStyle(document.body).backgroundColor;
    const colorProbe = document.createElement('span');
    colorProbe.style.color = style.color;
    document.body.append(colorProbe);
    const foreground = getComputedStyle(colorProbe).color;
    colorProbe.remove();
    return {
      isFallback: element.getAttribute('data-icon-fallback'),
      hasSvg: Boolean(element.querySelector('svg')),
      hasImg: Boolean(element.querySelector('img')),
      hasStructure: Boolean(element.querySelector('.adaptive-icon__fallback-mark')),
      hidden: element.getAttribute('aria-hidden'),
      width: Math.round(element.getBoundingClientRect().width),
      height: Math.round(element.getBoundingClientRect().height),
      borderColor: style.borderTopColor,
      foreground,
      background: bg,
    };
  });
  assert.equal(await page.locator('.page-intro__title').innerText(), title, `${route} keeps its visible section heading`);
  assert.equal(state.isFallback, 'true', `${route} uses the structural fallback when no mapped icon exists`);
  assert.equal(state.hasSvg, false, `${route} does not draw pending or rejected SVG artwork`);
  assert.equal(state.hasImg, false, `${route} makes no image request`);
  assert.equal(state.hasStructure, true, `${route} has the CSS structural marker`);
  assert.equal(state.hidden, 'true', `${route} fallback is decorative next to its heading`);
  assert.deepEqual([state.width, state.height], [44, 44], `${route} fallback dimensions are explicit`);
  const borderContrast = contrastForColors(state.borderColor, state.background);
  const markContrast = contrastForColors(state.foreground, state.background);
  assert.ok(borderContrast >= 3 && markContrast >= 3, `${route} fallback remains high contrast (${borderContrast.toFixed(2)}:1 border; ${markContrast.toFixed(2)}:1 mark)`);
  fallbackChecks += 1;
}

try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  for (const theme of ['light', 'dark']) {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme: theme,
        timezoneId: 'America/New_York',
        reducedMotion: 'reduce',
      });
      await context.addInitScript((selectedTheme) => {
        try {
          localStorage.setItem('nocharge-theme', selectedTheme);
          localStorage.setItem('nocharge-seasonal-mode', 'auto');
        } catch { /* Assertions below verify the effective preferences. */ }
      }, theme);
      const page = await context.newPage();
      page.setDefaultTimeout(8_000);
      page.setDefaultNavigationTimeout(15_000);
      let currentRoute = '';
      page.on('pageerror', (error) => pageErrors.push({ theme, viewport: viewport.name, route: currentRoute, message: error.message }));
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push({ theme, viewport: viewport.name, route: currentRoute, message: message.text() });
      });
      page.on('requestfailed', (request) => failedRequests.push({ theme, viewport: viewport.name, route: currentRoute, url: request.url(), reason: request.failure()?.errorText ?? 'unknown' }));

      if (viewport.name === 'mobile-390') {
        for (const event of events) {
          for (const target of surfaces) {
            currentRoute = `${target.route}?previewEvent=${event.id}`;
            const response = await page.goto(`${origin}${currentRoute}`, { waitUntil: 'domcontentloaded' });
            assert.equal(response?.status(), 200, `${currentRoute} returns HTTP 200 (${theme})`);
            await page.waitForFunction(({ selectedTheme, selectedEvent }) => document.documentElement.dataset.theme === selectedTheme
              && document.documentElement.dataset.event === selectedEvent
              && document.querySelector('select[aria-label="Seasonal theme preference"]')?.value === 'auto',
            { selectedTheme: theme, selectedEvent: event.id });
            await inspectMappedIcon(page, theme, event.id, target);
            await expectNoOverflow(page, `${theme}/${event.id}/${target.route}/${viewport.name}`, viewport.width);
          }
        }
      } else {
        for (const target of surfaces) {
          currentRoute = `${target.route}?previewEvent=halloween`;
          const response = await page.goto(`${origin}${currentRoute}`, { waitUntil: 'domcontentloaded' });
          assert.equal(response?.status(), 200, `${currentRoute} returns HTTP 200 (${theme})`);
          await page.waitForFunction((selectedTheme) => document.documentElement.dataset.theme === selectedTheme
            && document.documentElement.dataset.event === 'halloween'
            && document.querySelector('select[aria-label="Seasonal theme preference"]')?.value === 'auto', theme);
          await inspectMappedIcon(page, theme, 'halloween', target);
          await expectNoOverflow(page, `${theme}/halloween/${target.route}/${viewport.name}`, viewport.width);
        }
        currentRoute = '/arcade/?previewEvent=halloween (fallback)';
        await page.goto(`${origin}/arcade/?previewEvent=halloween`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction((selectedTheme) => document.documentElement.dataset.theme === selectedTheme && document.documentElement.dataset.event === 'halloween', theme);
        await inspectStructuralFallback(page, '/arcade/', 'Arcade');
        currentRoute = '/experiences/?previewEvent=halloween (fallback)';
        await page.goto(`${origin}/experiences/?previewEvent=halloween`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction((selectedTheme) => document.documentElement.dataset.theme === selectedTheme && document.documentElement.dataset.event === 'halloween', theme);
        await inspectStructuralFallback(page, '/experiences/', 'App Experiences');
      }
      await context.close();
    }
  }

  assert.deepEqual(pageErrors, [], 'adaptive icon checks have no uncaught browser errors');
  assert.deepEqual(consoleErrors, [], 'adaptive icon checks have no browser console errors');
  assert.deepEqual(failedRequests, [], 'adaptive icons make no failed or deferred image requests');
  assert.equal(routeChecks, 408, 'twelve mapped icon targets pass both themes and all 16 palettes on mobile, plus desktop checks in both themes');
  assert.equal(fallbackChecks, 4, 'both unmapped section headings show the structural fallback in both themes');
  console.log(`Adaptive asset Playwright checks passed (${routeChecks} mapped-icon route/theme/palette/viewport checks, ${contrastChecks} contrast comparisons, ${fallbackChecks} structural fallbacks; zero page, console, or request errors).`);
} finally {
  if (browser) await browser.close();
  await server.close();
}
