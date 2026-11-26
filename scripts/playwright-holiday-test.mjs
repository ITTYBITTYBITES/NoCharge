import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const reportDirectory = path.join(root, '.nocharge-review', 'holiday-theme');
const baseRoutes = [
  '/', '/arcade/', '/experiences/', '/tools/', '/guides/', '/discover/', '/search/', '/shop/',
  '/about/', '/contact/', '/advertising/', '/privacy/', '/terms/',
];
const staticShowcaseRoutes = new Set([
  '/experiences/coosjoint/',
  '/experiences/twosecondwitness/',
  '/experiences/barn-road-chronicles/',
]);
const staticEditorialRoutes = new Set(['/experiences/profivue/', '/experiences/rideside/']);
const staticExperienceRoutes = new Set([...staticShowcaseRoutes, ...staticEditorialRoutes]);
const modes = ['light', 'dark'];
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'mobile-390', width: 390, height: 844 },
];
const failures = [];
const consoleErrors = [];
const pageErrors = [];
const requestErrors = [];
const contrastFailures = [];
const overflowFailures = [];
const paletteSamples = new Map();
let routeChecks = 0;
let modeViewportEventChecks = 0;
let datePreviewChecks = 0;
let eventPaletteChecks = 0;
let preferenceChecks = 0;
let layoutStabilityChecks = 0;

async function collectPrerenderedRoutes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const routes = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) routes.push(...await collectPrerenderedRoutes(entryPath));
    else if (entry.isFile() && entry.name === 'index.html') {
      const relativeDirectory = path.relative(dist, path.dirname(entryPath));
      routes.push(!relativeDirectory || relativeDirectory === '.' ? '/' : `/${relativeDirectory.split(path.sep).join('/')}/`);
    }
  }
  return routes;
}

const homeHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
const calendarMatch = homeHtml.match(/<script id="nocharge-holiday-calendar" type="application\/json">([^<]+)<\/script>/);
assert.ok(calendarMatch, 'prerendered HTML includes the holiday registry for the pre-paint resolver');
const events = JSON.parse(calendarMatch[1]);
assert.equal(events.length, 16, 'all requested fixed and floating holidays plus the winter range are present');
const sitemapHtml = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const publishedSitemapRoutes = [...sitemapHtml.matchAll(/<loc>([^<]+)<\/loc>/gu)]
  .map(([, url]) => new URL(url).pathname);
assert.equal(publishedSitemapRoutes.length, 328, 'the canonical sitemap contains exactly 328 published URLs');
const prerenderedRoutes = [...new Set(await collectPrerenderedRoutes(dist))].sort();
assert.equal(prerenderedRoutes.length, 334, 'the production build contains all 334 prerendered HTML routes');
const sitemapAndBaseRoutes = new Set([...baseRoutes, ...publishedSitemapRoutes]);
const noindexPrerenderedRoutes = prerenderedRoutes.filter((route) => !sitemapAndBaseRoutes.has(route));
const allRoutes = [...new Set([...baseRoutes, ...publishedSitemapRoutes, ...noindexPrerenderedRoutes])];
assert.equal(allRoutes.length, 334, 'the holiday matrix covers all 334 prerendered routes, including noindex routes');
assert.ok([...baseRoutes, ...publishedSitemapRoutes].every((route) => prerenderedRoutes.includes(route)),
  'all required base and sitemap routes exist in the prerendered route inventory');
let routes = allRoutes;
let batch;
const batchSpec = process.env.HOLIDAY_ROUTE_BATCH;
if (batchSpec) {
  const match = batchSpec.match(/^([1-9][0-9]*)\/([1-9][0-9]*)$/u);
  assert.ok(match, 'HOLIDAY_ROUTE_BATCH must use the form <1-based-index>/<batch-count>, for example 1/4');
  const index = Number(match[1]);
  const count = Number(match[2]);
  assert.ok(Number.isSafeInteger(index) && Number.isSafeInteger(count) && index <= count && count <= allRoutes.length,
    'HOLIDAY_ROUTE_BATCH index/count must be positive integers with index <= count <= route count');
  const start = Math.floor((index - 1) * allRoutes.length / count);
  const end = Math.floor(index * allRoutes.length / count);
  routes = allRoutes.slice(start, end);
  batch = { index, count, start, end, totalRoutes: allRoutes.length };
  assert.ok(routes.length > 0, 'each holiday route batch must contain at least one route');
}
const previewDatesByEvent = {
  'new-years-day': '2026-01-01',
  'valentines-day': '2026-02-14',
  'st-patricks-day': '2026-03-17',
  'earth-day': '2026-04-22',
  'independence-day': '2026-07-04',
  halloween: '2026-10-31',
  'veterans-day': '2026-11-11',
  'christmas-day': '2026-12-25',
  'new-years-eve': '2026-12-31',
  'mlk-day': '2026-01-19',
  'presidents-day': '2026-02-16',
  'easter-sunday': '2026-04-05',
  'memorial-day': '2026-05-25',
  'labor-day': '2026-09-07',
  thanksgiving: '2026-11-26',
  'winter-holiday-season': '2026-12-20',
};
assert.deepEqual(Object.keys(previewDatesByEvent).sort(), events.map(({ id }) => id).sort(), 'each event has a date-preview probe');

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
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const mode of modes) {
    for (const viewport of viewports) {
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
        } catch {
          // Page assertions will expose a storage/bootstrap mismatch if blocked.
        }
      }, mode);
      const page = await context.newPage();
      page.setDefaultTimeout(8_000);
      page.setDefaultNavigationTimeout(15_000);
      let currentRoute = '';
      let currentEvent = '';
      let currentViewport = viewport.name;
      let currentMode = mode;
      page.on('pageerror', (error) => pageErrors.push({ mode: currentMode, viewport: currentViewport, route: currentRoute, event: currentEvent, message: error.message }));
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push({ mode: currentMode, viewport: currentViewport, route: currentRoute, event: currentEvent, message: message.text() });
      });
      page.on('requestfailed', (request) => requestErrors.push({ mode: currentMode, viewport: currentViewport, route: currentRoute, event: currentEvent, url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
      page.on('response', (response) => {
        if (response.status() >= 400 && response.url().startsWith(origin)) {
          requestErrors.push({ mode: currentMode, viewport: currentViewport, route: currentRoute, event: currentEvent, url: response.url(), error: `HTTP ${response.status()}` });
        }
      });

      for (const event of events) {
        currentEvent = event.id;
        modeViewportEventChecks += 1;
        let eventTokenValues;
        for (const route of routes) {
          currentRoute = route;
          const url = new URL(route, origin);
          url.searchParams.set('previewEvent', event.id);
          const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
          assert.equal(response?.status(), 200, `${route} returns HTTP 200 (${event.id}, ${mode}, ${viewport.name})`);
          await page.waitForFunction(({ eventId, theme }) => {
            const rootElement = document.documentElement;
            const seasonalSelect = document.querySelector('select[aria-label="Seasonal theme preference"]');
            const seasonalControl = document.querySelector('.seasonal-control');
            return rootElement.dataset.event === eventId
              && rootElement.dataset.theme === theme
              && seasonalSelect?.value === 'auto'
              && seasonalControl?.getAttribute('data-active') === 'true';
          }, { eventId: event.id, theme: mode });
          if (/^\/(?:arcade|experiences|tools)\/[^/]+\/$/u.test(route)) {
            if (staticExperienceRoutes.has(route)) {
              const slug = route.split('/')[2];
              const article = page.locator(`article[data-static-experience-route="${slug}"]`);
              await article.waitFor({ state: 'visible' });
              if (staticEditorialRoutes.has(route)) {
                await article.locator(`[data-experience-mini-site="${slug}"][data-editorial-experience="true"]`).waitFor({ state: 'visible' });
              } else {
                await article.locator(`[data-experience-showcase="${slug}"][data-static-experience="true"][data-nocharge-demo="absent"]`).waitFor({ state: 'visible' });
              }
              assert.equal(await page.locator('.interactive-module, .interactive-viewport, [data-demo]').count(), 0,
                `${route} remains a static showcase/editorial page rather than a loaded demo`);
            } else {
              await page.locator('.interactive-module').waitFor({ state: 'visible' });
            }
          }

          const state = await page.evaluate(() => {
            const rootElement = document.documentElement;
            const style = getComputedStyle(rootElement);
            const htmlWidth = rootElement.scrollWidth;
            const bodyWidth = document.body?.scrollWidth ?? 0;
            return {
              event: rootElement.dataset.event,
              theme: rootElement.dataset.theme,
              preference: rootElement.dataset.eventPreference,
              viewport: window.innerWidth,
              clientWidth: rootElement.clientWidth,
              scrollWidth: Math.max(htmlWidth, bodyWidth),
              tokens: {
                accent: style.getPropertyValue('--event-accent').trim(),
                surface: style.getPropertyValue('--event-surface').trim(),
                border: style.getPropertyValue('--event-border').trim(),
                text: style.getPropertyValue('--event-text').trim(),
              },
            };
          });
          assert.equal(state.event, event.id, `event override is active on ${route}`);
          assert.equal(state.theme, mode, `primary color mode remains independent on ${route}`);
          assert.equal(state.viewport, viewport.width, 'browser viewport matches requested QA size');
          assert.ok(Object.values(state.tokens).every(Boolean), `all event tokens resolve for ${event.id} in ${mode}`);
          const defaultAccent = mode === 'light' ? 'rgb(104, 116, 93)' : 'rgb(184, 213, 140)';
          const defaultSurface = mode === 'light' ? 'rgb(244, 245, 239)' : 'rgb(34, 40, 31)';
          assert.notEqual(state.tokens.accent, defaultAccent, `event accent palette is scoped for ${event.id} in ${mode}`);
          assert.notEqual(state.tokens.surface, defaultSurface, `event surface palette is scoped for ${event.id} in ${mode}`);
          if (!eventTokenValues) eventTokenValues = state.tokens;
          if (route === '/') {
            eventPaletteChecks += 1;
            const paletteKey = `${viewport.name}:${event.id}`;
            const pair = paletteSamples.get(paletteKey) ?? {};
            pair[mode] = state.tokens;
            paletteSamples.set(paletteKey, pair);
            if (pair.light && pair.dark) {
              assert.notEqual(pair.light.accent, pair.dark.accent, `${event.id} accent palette differs between light and dark`);
              assert.notEqual(pair.light.surface, pair.dark.surface, `${event.id} surface palette differs between light and dark`);
            }
          }

          const overflow = await page.evaluate(() => ({
            viewport: window.innerWidth,
            htmlClient: document.documentElement.clientWidth,
            htmlScroll: document.documentElement.scrollWidth,
            bodyScroll: document.body.scrollWidth,
          }));
          if (overflow.htmlScroll > overflow.htmlClient + 1 || overflow.bodyScroll > overflow.htmlClient + 1) {
            overflowFailures.push({ mode, viewport: viewport.name, route, event: event.id, ...overflow });
          }

          const contrast = await page.evaluate(() => {
            const parseColor = (input) => {
              if (!input) return null;
              const text = input.trim().toLowerCase();
              if (text === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
              let match = text.match(/^#([0-9a-f]{3,8})$/i);
              if (match) {
                let hex = match[1];
                if (hex.length === 3 || hex.length === 4) hex = [...hex].map((part) => part + part).join('');
                if (hex.length === 6 || hex.length === 8) {
                  return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16),
                    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
                  };
                }
              }
              match = text.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
              if (match) {
                const alphaText = match[4] ?? '1';
                return {
                  r: Number(match[1]), g: Number(match[2]), b: Number(match[3]),
                  a: alphaText.endsWith('%') ? Number(alphaText.slice(0, -1)) / 100 : Number(alphaText),
                };
              }
              return null;
            };
            const composite = (top, under) => {
              const alpha = Math.max(0, Math.min(1, top.a));
              const outAlpha = alpha + under.a * (1 - alpha);
              if (outAlpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
              return {
                r: (top.r * alpha + under.r * under.a * (1 - alpha)) / outAlpha,
                g: (top.g * alpha + under.g * under.a * (1 - alpha)) / outAlpha,
                b: (top.b * alpha + under.b * under.a * (1 - alpha)) / outAlpha,
                a: outAlpha,
              };
            };
            const linearChannel = (channel) => {
              const value = channel / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            };
            const luminance = (color) => 0.2126 * linearChannel(color.r) + 0.7152 * linearChannel(color.g) + 0.0722 * linearChannel(color.b);
            const ratio = (first, second) => {
              const a = luminance(first);
              const b = luminance(second);
              return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            };
            const gradientColorCandidates = (image) => {
              if (!image || image === 'none' || !/gradient\(/i.test(image)) return [];
              const matches = image.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi) ?? [];
              return matches.map(parseColor).filter(Boolean);
            };
            const backgroundCandidates = (element) => {
              const chain = [];
              for (let current = element; current; current = current.parentElement) chain.push(current);
              chain.reverse();
              let candidates = [{ r: 255, g: 255, b: 255, a: 1 }];
              for (const current of chain) {
                const style = getComputedStyle(current);
                const ownColor = parseColor(style.backgroundColor);
                const gradients = gradientColorCandidates(style.backgroundImage);
                if (gradients.length) {
                  const under = ownColor && ownColor.a > 0
                    ? candidates.map((candidate) => composite(ownColor, candidate))
                    : candidates;
                  candidates = gradients.flatMap((color) => under.map((candidate) => composite(color, candidate)));
                } else if (ownColor && ownColor.a > 0) {
                  candidates = candidates.map((candidate) => composite(ownColor, candidate));
                }
                if (candidates.length > 64) candidates = candidates.slice(0, 64);
              }
              return candidates;
            };
            const isClippedForAssistiveText = (element) => {
              for (let current = element; current; current = current.parentElement) {
                const style = getComputedStyle(current);
                if (style.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(style.clipPath)) return true;
              }
              return false;
            };
            const failures = [];
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
              if (!/[\p{L}\p{N}]/u.test(node.nodeValue ?? '')) continue;
              const element = node.parentElement;
              if (!element || isClippedForAssistiveText(element)) continue;
              let hidden = false;
              let opacity = 1;
              for (let current = element; current; current = current.parentElement) {
                const style = getComputedStyle(current);
                if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity) === 0 || current.getAttribute('aria-hidden') === 'true') {
                  hidden = true;
                  break;
                }
                opacity *= Number(style.opacity || '1');
              }
              if (hidden || opacity < 0.01) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              if (![...range.getClientRects()].some((rect) => rect.width > 0 && rect.height > 0)) continue;
              const style = getComputedStyle(element);
              const foreground = parseColor(element.namespaceURI === 'http://www.w3.org/2000/svg' ? style.fill : style.color) ?? parseColor(style.color);
              if (!foreground || foreground.a === 0) continue;
              const effectiveForeground = { ...foreground, a: foreground.a * opacity };
              const candidates = backgroundCandidates(element);
              const minimum = Math.min(...candidates.map((background) => ratio(composite(effectiveForeground, background), background)));
              if (minimum < 4.5) {
                failures.push({
                  text: (node.nodeValue ?? '').trim().replace(/\s+/g, ' ').slice(0, 90),
                  ratio: Number(minimum.toFixed(2)),
                  foreground: style.color,
                  background: candidates.map((color) => `rgb(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)})`),
                  tag: element.tagName.toLowerCase(),
                  className: typeof element.className === 'string' ? element.className : '',
                });
              }
            }
            return failures;
          });
          if (contrast.length) {
            contrastFailures.push({ mode, viewport: viewport.name, route, event: event.id, failures: contrast.slice(0, 12) });
          }
          routeChecks += 1;
        }
        assert.ok(eventTokenValues, `event tokens were captured for ${event.id}`);

        currentRoute = '/shop/';
        const dateUrl = new URL('/shop/', origin);
        dateUrl.searchParams.set('previewDate', previewDatesByEvent[event.id]);
        const dateResponse = await page.goto(dateUrl.href, { waitUntil: 'domcontentloaded' });
        assert.equal(dateResponse?.status(), 200, `date-preview route returns HTTP 200 (${event.id}, ${mode}, ${viewport.name})`);
        await page.waitForFunction(({ eventId, theme }) => {
          const rootElement = document.documentElement;
          return rootElement.dataset.event === eventId
            && rootElement.dataset.theme === theme
            && rootElement.dataset.eventPreview === 'true'
            && document.querySelector('.seasonal-control')?.getAttribute('data-active') === 'true';
        }, { eventId: event.id, theme: mode });
        datePreviewChecks += 1;
      }

      await context.close();
    }
  }

  // Exercise the independent saved seasonal preference, preview fallbacks,
  // primary-mode independence, and persistence in a real production browser.
  const preferenceContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark', timezoneId: 'America/New_York', reducedMotion: 'reduce' });
  await preferenceContext.addInitScript(() => {
    try {
      if (localStorage.getItem('nocharge-theme') === null) localStorage.setItem('nocharge-theme', 'dark');
      if (localStorage.getItem('nocharge-seasonal-mode') === null) localStorage.setItem('nocharge-seasonal-mode', 'auto');
    } catch { /* The explicit page assertions below still report the effective state. */ }
  });
  const preferencePage = await preferenceContext.newPage();
  preferencePage.setDefaultTimeout(8_000);
  preferencePage.setDefaultNavigationTimeout(15_000);
  let preferenceRoute = '/';
  preferencePage.on('pageerror', (error) => pageErrors.push({ mode: 'dark', viewport: 'desktop-1440', route: preferenceRoute, event: 'preference', message: error.message }));
  preferencePage.on('console', (message) => { if (message.type() === 'error') consoleErrors.push({ mode: 'dark', viewport: 'desktop-1440', route: preferenceRoute, event: 'preference', message: message.text() }); });

  const waitForRoot = async (expected) => preferencePage.waitForFunction((state) => {
    const rootElement = document.documentElement;
    return (!state.event || rootElement.dataset.event === state.event)
      && (!state.theme || rootElement.dataset.theme === state.theme)
      && (!state.preference || rootElement.dataset.eventPreference === state.preference);
  }, expected);
  const waitForHeaderPreferenceRender = async () => {
    await preferencePage.waitForFunction(() => {
      const theme = document.querySelector('select[aria-label="Color theme preference"]')?.value;
      const seasonal = document.querySelector('select[aria-label="Seasonal theme preference"]')?.value;
      try {
        return theme === (localStorage.getItem('nocharge-theme') ?? 'system')
          && seasonal === (localStorage.getItem('nocharge-seasonal-mode') ?? 'auto');
      } catch {
        return false;
      }
    });
    await preferencePage.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  const captureLayoutGeometry = () => preferencePage.evaluate(() => ['.site-header', '.site-header__inner', '.seasonal-control', '.site-main'].map((selector) => {
    const rectangle = document.querySelector(selector)?.getBoundingClientRect();
    return rectangle ? { selector, x: rectangle.x, y: rectangle.y, width: rectangle.width, height: rectangle.height } : null;
  }));
  const assertSameLayoutGeometry = (first, second) => {
    assert.deepEqual(first.map(({ selector }) => selector), second.map(({ selector }) => selector), 'event indicator keeps the page shell structure');
    for (let index = 0; index < first.length; index += 1) {
      for (const key of ['x', 'y', 'width', 'height']) {
        assert.ok(Math.abs(first[index][key] - second[index][key]) < 0.5, `${first[index].selector} ${key} is stable across seasonal event application`);
      }
    }
  };

  preferenceRoute = '/?previewEvent=halloween';
  await preferencePage.goto(`${origin}${preferenceRoute}`, { waitUntil: 'domcontentloaded' });
  await waitForRoot({ event: 'halloween', theme: 'dark', preference: 'auto' });
  await waitForHeaderPreferenceRender();
  const eventLayoutGeometry = await captureLayoutGeometry();
  preferenceRoute = '/?previewEvent=none';
  await preferencePage.goto(`${origin}${preferenceRoute}`, { waitUntil: 'domcontentloaded' });
  await waitForRoot({ event: 'none', theme: 'dark', preference: 'auto' });
  await waitForHeaderPreferenceRender();
  const neutralLayoutGeometry = await captureLayoutGeometry();
  assertSameLayoutGeometry(eventLayoutGeometry, neutralLayoutGeometry);
  preferenceChecks += 1;
  layoutStabilityChecks += 1;
  preferenceRoute = '/?previewEvent=halloween';
  await preferencePage.goto(`${origin}${preferenceRoute}`, { waitUntil: 'domcontentloaded' });
  await waitForRoot({ event: 'halloween', theme: 'dark', preference: 'auto' });
  await preferencePage.locator('select[aria-label="Color theme preference"]').selectOption('system');
  await waitForRoot({ event: 'halloween', theme: 'dark', preference: 'auto' });
  assert.equal(await preferencePage.evaluate(() => localStorage.getItem('nocharge-theme')), 'system', 'the existing System preference remains selectable and persistent');
  preferenceChecks += 1;
  await preferencePage.locator('select[aria-label="Color theme preference"]').selectOption('dark');
  await waitForRoot({ event: 'halloween', theme: 'dark', preference: 'auto' });
  await preferencePage.locator('select[aria-label="Seasonal theme preference"]').selectOption('standard');
  await waitForRoot({ event: 'none', theme: 'dark', preference: 'standard' });
  assert.equal(await preferencePage.evaluate(() => localStorage.getItem('nocharge-seasonal-mode')), 'standard', 'Standard preference persists independently');
  assert.equal(new URL(preferencePage.url()).searchParams.has('previewEvent'), false, 'changing the preference exits the explicit preview');
  await preferencePage.reload({ waitUntil: 'domcontentloaded' });
  await waitForRoot({ event: 'none', theme: 'dark', preference: 'standard' });
  await waitForHeaderPreferenceRender();
  assert.equal(await preferencePage.locator('select[aria-label="Seasonal theme preference"]').inputValue(), 'standard', 'Standard preference restores after reload');
  preferenceChecks += 1;

  await preferencePage.locator('select[aria-label="Seasonal theme preference"]').selectOption('auto');
  await preferencePage.waitForFunction(() => document.documentElement.dataset.eventPreference === 'auto');
  assert.equal(await preferencePage.evaluate(() => localStorage.getItem('nocharge-seasonal-mode')), 'auto', 'Seasonal Auto preference persists independently');
  const eventAfterAuto = await preferencePage.locator('html').getAttribute('data-event');
  assert.ok(eventAfterAuto === 'none' || events.some((event) => event.id === eventAfterAuto), 'automatic state resolves to a registered event or none');
  assert.equal(await preferencePage.locator('html').getAttribute('data-theme'), 'dark', 'seasonal changes do not alter dark mode');
  preferenceChecks += 1;

  await preferencePage.locator('select[aria-label="Color theme preference"]').selectOption('light');
  await waitForRoot({ event: eventAfterAuto, theme: 'light', preference: 'auto' });
  assert.equal(await preferencePage.evaluate(() => localStorage.getItem('nocharge-theme')), 'light', 'primary light mode still persists separately');
  preferenceChecks += 1;

  preferenceRoute = '/?previewDate=2026-02-14';
  await preferencePage.goto(`${origin}${preferenceRoute}`, { waitUntil: 'domcontentloaded' });
  await waitForRoot({ event: 'valentines-day', theme: 'light', preference: 'auto' });
  preferenceChecks += 1;

  const normalDateEvent = await (async () => {
    preferenceRoute = '/';
    await preferencePage.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
    await waitForRoot({ theme: 'light', preference: 'auto' });
    return preferencePage.locator('html').getAttribute('data-event');
  })();
  for (const invalidQuery of ['?previewEvent=not-a-registered-event', '?previewDate=2026-02-30']) {
    preferenceRoute = `/${invalidQuery}`;
    await preferencePage.goto(`${origin}/${invalidQuery}`, { waitUntil: 'domcontentloaded' });
    await waitForRoot({ theme: 'light', preference: 'auto' });
    assert.equal(await preferencePage.locator('html').getAttribute('data-event'), normalDateEvent, `${invalidQuery} safely falls back to the local current date`);
    preferenceChecks += 1;
  }

  preferenceRoute = '/?previewEvent=none';
  await preferencePage.goto(`${origin}${preferenceRoute}`, { waitUntil: 'domcontentloaded' });
  await waitForRoot({ event: 'none', preference: 'auto' });
  preferenceChecks += 1;
  await preferenceContext.close();
} catch (error) {
  failures.push({ message: error instanceof Error ? error.stack ?? error.message : String(error) });
} finally {
  if (browser) await browser.close();
  await server.close();
}

const expectedRouteVisits = routes.length * events.length * modes.length * viewports.length;
if (routeChecks !== expectedRouteVisits) failures.push({ message: `Expected ${expectedRouteVisits} route visits in this run, recorded ${routeChecks}.` });
const expectedEventViewportChecks = events.length * modes.length * viewports.length;
if (modeViewportEventChecks !== expectedEventViewportChecks) failures.push({ message: `Expected ${expectedEventViewportChecks} event/theme/viewport combinations, recorded ${modeViewportEventChecks}.` });
if (datePreviewChecks !== expectedEventViewportChecks) failures.push({ message: `Expected ${expectedEventViewportChecks} date-preview checks, recorded ${datePreviewChecks}.` });
if (pageErrors.length) failures.push({ pageErrors });
if (consoleErrors.length) failures.push({ consoleErrors });
if (requestErrors.length) failures.push({ requestErrors });
if (overflowFailures.length) failures.push({ overflowFailures: overflowFailures.slice(0, 20), total: overflowFailures.length });
if (contrastFailures.length) failures.push({ contrastFailures: contrastFailures.slice(0, 30), total: contrastFailures.length });

await mkdir(reportDirectory, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  result: failures.length ? 'FAIL' : 'PASS',
  browser: 'Playwright Chromium (headless)',
  timezoneId: 'America/New_York',
  routes,
  routeCoverage: { totalRoutes: allRoutes.length, batch: batch ?? { index: 1, count: 1 }, selectedRoutes: routes },
  batch: batch ?? null,
  themes: modes,
  viewports,
  events: events.map(({ id, name, label, windowType, priority, dateRule, greeting, badge }) => ({ id, name, label, windowType, priority, dateRule, greeting, badge })),
  checks: {
    routeChecks,
    eventThemeViewportCombinations: modeViewportEventChecks,
    datePreviewChecks,
    eventPaletteModeViewportChecks: eventPaletteChecks,
    preferenceAndPreviewChecks: preferenceChecks,
    layoutStabilityChecks,
    pageErrors: pageErrors.length,
    consoleErrors: consoleErrors.length,
    requestErrors: requestErrors.length,
    horizontalOverflowFailures: overflowFailures.length,
    visibleTextContrastFailures: contrastFailures.length,
    minimumContrastRatio: 4.5,
  },
  previewSyntax: {
    event: `${origin}/shop/?previewEvent=halloween`,
    date: `${origin}/shop/?previewDate=2026-02-14`,
    neutral: `${origin}/shop/?previewEvent=none`,
  },
  failures,
};
const reportStem = batch
  ? `playwright-results-batch-${String(batch.index).padStart(2, '0')}-of-${String(batch.count).padStart(2, '0')}`
  : 'playwright-results';
await writeFile(path.join(reportDirectory, `${reportStem}.json`), `${JSON.stringify(report, null, 2)}\n`);

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ordinalNames = ['first', 'second', 'third', 'fourth', 'fifth'];
const describeDateRule = (event) => {
  const rule = event.dateRule;
  if (rule.type === 'fixed') return `${monthNames[rule.month - 1]} ${rule.day}`;
  if (rule.type === 'nth-weekday') return `${ordinalNames[rule.occurrence - 1]} ${weekdayNames[rule.weekday]} in ${monthNames[rule.month - 1]}`;
  if (rule.type === 'last-weekday') return `last ${weekdayNames[rule.weekday]} in ${monthNames[rule.month - 1]}`;
  if (rule.type === 'easter') return 'Gregorian Easter Sunday';
  return `${monthNames[rule.start.month - 1]} ${rule.start.day}–${monthNames[rule.end.month - 1]} ${rule.end.day}`;
};
const eventRows = report.events.map((event) => `| ${event.id} | ${event.name} | ${describeDateRule(event)} | ${event.windowType} | ${event.priority} |`).join('\n');
const markdown = [
  '# NoCharge V2 — holiday and event theme Playwright QA',
  '',
  `**Result:** ${report.result}  `,
  `**Generated:** ${report.generatedAt}  `,
  `**Browser:** ${report.browser} (${report.timezoneId} local-date context)`,
  '',
  '## Coverage',
  '',
  `- Full route inventory: ${allRoutes.length} prerendered routes; canonical sitemap: ${publishedSitemapRoutes.length} URLs`,
  `- Route batch: ${batch ? `${batch.index}/${batch.count}` : 'single unbatched run'} (${routes.length} routes)`,
  `- Standard routes: ${routes.join(', ')}`,
  `- Primary themes: ${modes.join(', ')}`,
  `- Viewports: ${viewports.map(({ name, width, height }) => `${name} (${width}×${height})`).join(', ')}`,
  `- Registered event × theme × viewport combinations: ${modeViewportEventChecks} (${events.length} events × ${modes.length} themes × ${viewports.length} viewports)`,
  `- Full route visits: ${routeChecks}`,
  `- Date-preview resolver checks: ${datePreviewChecks} (${events.length} event dates × ${modes.length} themes × ${viewports.length} viewports)`,
  `- Visible text contrast floor: 4.5:1; failures: ${contrastFailures.length}`,
  '- Contrast method: visible DOM text with computed foregrounds, composited translucent CSS colors, and gradient color stops; clipped assistive-only text and aria-hidden decorative artwork are excluded.',
  `- Horizontal overflow failures: ${overflowFailures.length}`,
  `- Page errors: ${pageErrors.length}; console errors: ${consoleErrors.length}; failed/HTTP error requests: ${requestErrors.length}`,
  `- Seasonal preference, mode independence, storage, and preview/fallback checks: ${preferenceChecks}`,
  `- Seasonal activation layout geometry comparisons: ${layoutStabilityChecks}`,
  '',
  '## Event registry',
  '',
  '| ID | Event | Date rule | Window | Priority |',
  '|---|---|---|---:|---:|',
  eventRows,
  '',
  'Week windows are Sunday through Saturday inclusive in the visitor’s local calendar. Day windows include only the holiday’s local calendar date. Month/day range endpoints are inclusive; if the end month/day is earlier than the start, the range crosses into the following year. Overlaps resolve by day over week over range; ties then use higher priority, shorter actual span, nearer anchor date, and finally ascending event ID.',
  '',
  '## Preview URLs',
  '',
  '- Event: <code>/shop/?previewEvent=halloween</code>',
  '- Date: <code>/shop/?previewDate=2026-02-14</code> (strict local <code>YYYY-MM-DD</code>)',
  '- Neutral: <code>/shop/?previewEvent=none</code>',
  '',
  'Invalid preview values fall back to the visitor’s local-date resolution and saved Seasonal Auto/Standard preference. Static/prerendered documents start with <code>data-event=none</code>; the inline client bootstrap applies the event before first paint.',
  '',
  '## Result details',
  '',
  `The machine-readable result is <code>${reportStem}.json</code>. ${failures.length ? 'See its failures array for diagnostic details.' : 'All checks in this run passed.'}`,
].join('\n');
await writeFile(path.join(reportDirectory, `${reportStem}.md`), markdown);

if (failures.length) {
  console.error(`Holiday-theme Playwright QA failed. See ${path.join(reportDirectory, `${reportStem}.md`)}`);
  console.error(JSON.stringify(failures.slice(0, 5), null, 2));
  process.exitCode = 1;
} else {
  console.log(`Holiday-theme Playwright QA passed: ${routeChecks} route visits, ${modeViewportEventChecks} event/theme/viewport combinations, ${datePreviewChecks} calendar date-preview checks, ${preferenceChecks} preference/preview checks, ${layoutStabilityChecks} stable-layout comparisons, zero page/console/request errors, zero overflow, and zero contrast failures.`);
  console.log(`Report: ${path.join(reportDirectory, `${reportStem}.md`)}`);
}
