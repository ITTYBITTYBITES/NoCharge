import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const modes = ['light', 'dark'];
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'mobile-390', width: 390, height: 844 },
];
const products = [
  { id: 'ittybittybites-product-coosjoint', slug: 'coosjoint', name: "Coo's Joint: Coffee Idle", category: 'Games & Entertainment', hostname: 'coosjoint.nocharge.net' },
  { id: 'ittybittybites-product-twosecondwitness', slug: 'twosecondwitness', name: 'The 2-Second Witness', category: 'Games & Entertainment', hostname: 'twosecondwitness.nocharge.net' },
  { id: 'ittybittybites-product-profivue', slug: 'profivue', name: 'ProfiVue', category: 'Productivity & Utilities', hostname: 'profivue.nocharge.net' },
  { id: 'ittybittybites-product-rideside', slug: 'rideside', name: 'RideSide', category: 'Productivity & Utilities', hostname: 'rideside.nocharge.net' },
];
const staticExperienceSlugs = ['profivue', 'rideside'];
const showcaseExperienceSlugs = ['coosjoint', 'twosecondwitness', 'barn-road-chronicles'];
const experienceSlugs = [...showcaseExperienceSlugs, ...staticExperienceSlugs];
const experiencesHtml = await readFile(path.join(dist, 'experiences', 'index.html'), 'utf8');
const calendarMatch = experiencesHtml.match(/<script id="nocharge-holiday-calendar" type="application\/json">([^<]+)<\/script>/u);
assert.ok(calendarMatch, 'production shell embeds the seasonal event registry');
const events = JSON.parse(calendarMatch[1]);
assert.equal(events.length, 16, 'all sixteen seasonal palettes are registered');
const eventIds = events.map(({ id }) => id);

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
const failedRequests = [];
const expectedTrailerAborts = [];
const pageErrors = [];
const consoleErrors = [];
let routeChecks = 0;
let productLinkChecks = 0;
let viewportChecks = 0;
let experiencePaletteChecks = 0;
let brcDirectoryChecks = 0;
let brcDirectoryContrastChecks = 0;
let miniSitePaletteChecks = 0;
let miniSiteContrastChecks = 0;
let miniSiteImageChecks = 0;
let staticShowcaseChecks = 0;
let staticShowcaseContrastChecks = 0;
let trailerClickChecks = 0;

function routeUrl(route, event = 'halloween') {
  const url = new URL(route, origin);
  url.searchParams.set('previewEvent', event);
  return url.href;
}

async function waitForTheme(page, mode, event) {
  await page.waitForFunction(({ expectedTheme, expectedEvent }) => {
    const rootElement = document.documentElement;
    return rootElement.dataset.theme === expectedTheme
      && rootElement.dataset.event === expectedEvent
      && document.querySelector('select[aria-label="Seasonal theme preference"]')?.value === 'auto';
  }, { expectedTheme: mode, expectedEvent: event });
}

async function expectNoOverflow(page, label, width) {
  const state = await page.evaluate(() => ({
    width: window.innerWidth,
    client: document.documentElement.clientWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.equal(state.width, width, `${label} uses the expected viewport`);
  assert.ok(state.html <= state.client + 1 && state.body <= state.client + 1, `${label} has no horizontal overflow (${JSON.stringify(state)})`);
  viewportChecks += 1;
}

async function inspectBarnRoadDirectory(page, mode, viewport, event) {
  const card = page.locator('.catalog-grid .catalog-card').filter({ has: page.locator('a[href="/experiences/barn-road-chronicles/"]') });
  assert.equal(await card.count(), 1, `Barn Road Chronicles has one local directory card (${mode}/${viewport.name}/${event})`);
  const result = await card.evaluate((element) => {
    const textContrast = [...element.querySelectorAll('.catalog-card__meta span, h3, p, .catalog-card__tags span')].flatMap((item) => {
      const text = (item.innerText ?? item.textContent ?? '').trim();
      if (!text || !item.getClientRects().length) return [];
      let background = '';
      let ancestor = item;
      while (ancestor && !background) {
        const candidate = getComputedStyle(ancestor).backgroundColor;
        const channels = candidate.match(/[\d.]+/gu)?.map(Number) ?? [];
        const alpha = channels.length > 3 ? channels[3] : 1;
        if (channels.length >= 3 && alpha >= 0.99) background = candidate;
        ancestor = ancestor.parentElement;
      }
      if (!background) background = getComputedStyle(document.body).backgroundColor;
      return [{ text: text.replace(/\s+/gu, ' ').slice(0, 72), foreground: getComputedStyle(item).color, background }];
    });
    return {
      category: element.getAttribute('data-category'),
      href: element.querySelector('a.catalog-card__title-link')?.getAttribute('href'),
      links: [...element.querySelectorAll('a[href]')].map((link) => link.getAttribute('href')),
      title: element.querySelector('h3')?.innerText ?? '',
      hasImages: Boolean(element.querySelector('img, svg, [data-asset-id]')),
      textContrast,
      theme: document.documentElement.dataset.theme,
      event: document.documentElement.dataset.event,
    };
  });
  assert.equal(result.category, 'Games & Entertainment', `Barn Road Chronicles is categorized in Games & Entertainment (${mode}/${event})`);
  assert.equal(result.href, '/experiences/barn-road-chronicles/', `the directory card points only to the local BRC route (${mode}/${event})`);
  assert.deepEqual(result.links, ['/experiences/barn-road-chronicles/'], `the BRC card does not publish an unverified external product destination (${mode}/${event})`);
  assert.ok(result.title.includes('Barn Road Chronicles: Act 1'), `the BRC title remains readable in the directory (${mode}/${event})`);
  assert.equal(result.hasImages, false, `the Experience card has no unregistered or remote artwork (${mode}/${event})`);
  assert.equal(result.theme, mode, `the BRC directory card is checked in ${mode} theme`);
  assert.equal(result.event, event, `the BRC directory card is checked in the ${event} palette`);
  assert.ok(result.textContrast.length >= 5, `the BRC directory card contributes text to the contrast audit (${mode}/${event})`);
  for (const item of result.textContrast) {
    const ratio = contrastRatio(item.foreground, item.background);
    assert.ok(ratio >= 4.5, `BRC directory text “${item.text}” clears 4.5:1 in ${mode}/${event} (${ratio.toFixed(2)}:1)`);
    brcDirectoryContrastChecks += 1;
  }
  brcDirectoryChecks += 1;
}

function contrastRatio(foreground, background) {
  const luminance = (color) => {
    const values = color.match(/[\d.]+/gu)?.slice(0, 3).map(Number);
    assert.ok(values?.length === 3, `browser computed an RGB color for contrast: ${color}`);
    const channels = values.map((value) => {
      const normalized = value / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const [high, low] = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (high + 0.05) / (low + 0.05);
}

async function inspectStaticMiniSite(page, slug, mode, viewport, event) {
  const expectedIds = slug === 'profivue' ? ['NC-PV-01', 'NC-PV-02', 'NC-PV-03'] : ['NC-RS-01', 'NC-RS-02'];
  const article = page.locator(`article[data-static-experience-route="${slug}"]`);
  await article.waitFor({ state: 'visible' });
  const shell = article.locator(`[data-experience-mini-site="${slug}"][data-editorial-experience="true"]`);
  assert.equal(await shell.count(), 1, `${slug} has one static editorial mini-site (${mode}/${viewport.name}/${event})`);
  assert.equal(await article.locator('.interactive-viewport, [data-demo], .detail-instructions, .experience-documentation').count(), 0,
    `${slug} contains no interactive or preview scaffolding (${mode}/${viewport.name}/${event})`);
  assert.equal(await article.locator('[data-ad-slot]').count(), 0, `${slug} has no post-demo ad slot (${mode}/${viewport.name}/${event})`);
  assert.equal(await page.locator('a[href="/shop/"]').count(), 0, `${slug} route has no Shop link in shared navigation or content (${mode}/${viewport.name}/${event})`);

  const officialHref = slug === 'profivue' ? 'https://profivue.nocharge.net/' : 'https://rideside.nocharge.net/';
  const links = await article.locator('a[href]').evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
  assert.ok(links.includes(officialHref), `${slug} links to its official NoCharge product site`);
  assert.ok(links.every((href) => href?.startsWith('/') || href === officialHref), `${slug} links only to its official site and internal NoCharge resources`);
  assert.equal(await article.locator(`a[href^="https://"]`).count(), 1, `${slug} has exactly one external product destination`);
  assert.equal(await article.locator('a[href*="play.google.com"], a[href*="apps.apple.com"], a[href^="/shop/"]').count(), 0,
    `${slug} contains no store, app-store, or Shop destinations`);
  assert.doesNotMatch(await page.locator('body').innerText(), /Google Play|App Store|\bdownload\b|NoCharge Shop/iu,
    `${slug} contains no store/download callout in visible page copy`);

  const images = article.locator('.experience-mini-site__figure img');
  assert.equal(await images.count(), expectedIds.length, `${slug} renders the expected number of locally registered listing images`);
  for (let index = 0; index < expectedIds.length; index += 1) {
    const figure = article.locator('.experience-mini-site__figure').nth(index);
    const image = images.nth(index);
    assert.equal(await figure.getAttribute('data-asset-id'), expectedIds[index], `${slug} image uses source manifest ID ${expectedIds[index]}`);
    assert.equal(await figure.getAttribute('data-runtime-asset-id'), `${expectedIds[index]}-OPT`, `${slug} image records its optimized runtime ID`);
    assert.equal(await image.getAttribute('loading'), 'lazy', `${expectedIds[index]} is lazy-loaded`);
    assert.equal(await image.getAttribute('decoding'), 'async', `${expectedIds[index]} decodes asynchronously`);
    const alt = await image.getAttribute('alt');
    assert.ok(alt && alt.length >= 50, `${expectedIds[index]} has useful descriptive alternative text`);
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction((element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth === 768 && element.naturalHeight === 1376, await image.elementHandle());
    const imageState = await image.evaluate((element) => ({ src: element.currentSrc, width: element.naturalWidth, height: element.naturalHeight }));
    const resolvedImage = new URL(imageState.src);
    assert.equal(resolvedImage.origin, origin, `${expectedIds[index]} is fetched from the same-origin Vite asset bundle`);
    assert.equal(imageState.width, 768, `${expectedIds[index]} keeps the listing image source width`);
    assert.equal(imageState.height, 1376, `${expectedIds[index]} keeps the listing image source height`);
    miniSiteImageChecks += 1;
  }

  const audit = await shell.evaluate((root) => {
    const candidates = [...root.querySelectorAll('h2, h3, p, li, dt, dd, figcaption, a, button, .eyebrow')];
    const textContrast = candidates.flatMap((element) => {
      const text = (element.innerText ?? element.textContent ?? '').trim();
      if (!text || !element.getClientRects().length) return [];
      let background = '';
      let ancestor = element;
      while (ancestor && !background) {
        const candidate = getComputedStyle(ancestor).backgroundColor;
        const channels = candidate.match(/[\d.]+/gu)?.map(Number) ?? [];
        const alpha = channels.length > 3 ? channels[3] : 1;
        if (channels.length >= 3 && alpha >= .99) background = candidate;
        ancestor = ancestor.parentElement;
      }
      if (!background) background = getComputedStyle(document.body).backgroundColor;
      return [{ text: text.replace(/\s+/gu, ' ').slice(0, 100), foreground: getComputedStyle(element).color, background }];
    });
    return {
      textContrast,
      hasLiveEngine: Boolean(root.querySelector('.interactive-viewport, [data-demo]')),
      event: document.documentElement.dataset.event,
      theme: document.documentElement.dataset.theme,
      staticFaqCount: root.querySelectorAll('.experience-mini-site__faq-item').length,
    };
  });
  assert.equal(audit.theme, mode, `${slug} contrast audit uses ${mode} theme`);
  assert.equal(audit.event, event, `${slug} contrast audit uses the ${event} seasonal palette`);
  assert.equal(audit.hasLiveEngine, false, `${slug} static article has no loaded interactive engine`);
  assert.ok(audit.staticFaqCount >= 5, `${slug} exposes its FAQ answers visibly in the static page`);
  assert.ok(audit.textContrast.length >= 35, `${slug} contributes substantive visible text to the contrast audit`);
  for (const item of audit.textContrast) {
    const ratio = contrastRatio(item.foreground, item.background);
    assert.ok(ratio >= 4.5, `${slug} text “${item.text}” clears 4.5:1 in ${mode}/${event} (${ratio.toFixed(2)}:1)`);
    miniSiteContrastChecks += 1;
  }
  miniSitePaletteChecks += 1;
}


async function inspectStaticShowcase(page, slug, mode, viewport, event) {
  const article = page.locator(`article[data-static-experience-route="${slug}"]`);
  const shell = article.locator(`[data-experience-showcase="${slug}"][data-nocharge-demo="absent"]`);
  assert.equal(await article.count(), 1, `${slug} has a canonical static showcase article (${mode}/${viewport.name}/${event})`);
  assert.equal(await shell.count(), 1, `${slug} has one showcase shell and explicitly no NoCharge demo`);
  assert.equal(await article.locator('.interactive-viewport, [data-demo], .interactive-module, .detail-instructions, .experience-documentation, [data-ad-slot]').count(), 0,
    `${slug} has no game runtime, interactive preview scaffolding, or ad slot`);
  assert.equal(await page.locator('a[href="/shop/"]').count(), 0, `${slug} app/release page has no Shop navigation or CTA`);
  assert.equal(await article.locator('a[href="https://store.nocharge.net"]').count(), 0, `${slug} has no store destination`);
  assert.equal(await page.locator('iframe').count(), 0, `${slug} does not create a remote iframe before a trailer click`);
  assert.equal(await article.locator('.experience-showcase__faq > div').count() >= 3, true, `${slug} has its static FAQ entries`);
  const externalLinks = await article.locator('a[href^="https://"]').evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
  if (slug === 'barn-road-chronicles') {
    assert.deepEqual(externalLinks, ['https://ittybittybites.itch.io/barn-road-chronicles-act-1/'], 'BRC has one external itch.io destination and no legal or app store URLs');
    assert.equal(await article.locator('[data-h5-candidate="true"][data-h5-candidate-status="deferred"]').count(), 1, 'BRC is marked as deferred future H5 Games Ads candidate only');
    assert.equal(await article.locator('[data-youtube-trailer], [data-app-legal-links]').count(), 0, 'BRC has no YouTube trailer or app legal route');
    assert.equal(await article.locator('[data-h5-game-id], [data-h5-ad-slot], [data-h5-adapter-status]').count(), 0, 'BRC has no H5 Games Ads runtime or placement');
  } else {
    const productHost = slug === 'coosjoint' ? 'coosjoint.nocharge.net' : 'twosecondwitness.nocharge.net';
    const playUrl = slug === 'coosjoint'
      ? 'https://play.google.com/store/apps/details?id=com.ittybittybites.cooscafe'
      : 'https://play.google.com/store/apps/details?id=com.ittybittybites.the2secondwitness';
    const itchUrl = slug === 'coosjoint'
      ? 'https://ittybittybites.itch.io/coos-joint-idle-coffee-syndicate'
      : 'https://ittybittybites.itch.io/2-second-witness';
    const expectedExternalLinks = [`https://${productHost}/`, playUrl, itchUrl,
      ...(slug === 'coosjoint' ? ['https://www.facebook.com/profile.php?id=61596369614569'] : [])];
    assert.deepEqual(externalLinks, expectedExternalLinks, `${slug} has only its approved product, release, and social destinations`);
    if (slug === 'coosjoint') {
      const facebookLink = article.locator('[data-facebook-link="coosjoint"]');
      assert.equal(await facebookLink.count(), 1, 'Coo’s Joint publishes one static Facebook profile link');
      assert.equal(await facebookLink.getAttribute('href'), 'https://www.facebook.com/profile.php?id=61596369614569', 'Facebook anchor points to the exact requested profile');
      assert.equal(await facebookLink.getAttribute('target'), '_blank', 'Facebook destination opens separately');
      assert.equal(await facebookLink.getAttribute('rel'), 'noopener noreferrer', 'Facebook destination uses safe isolation');
      assert.match((await facebookLink.innerText()).trim(), /Coo.s Joint on Facebook/u, 'Facebook destination is visibly labeled');
    } else {
      assert.equal(await article.locator('[data-facebook-link]').count(), 0, `${slug} has no unrelated Facebook destination`);
    }
    assert.equal(await article.locator('[data-app-legal-links]').count(), 1, `${slug} has one app-policy link group`);
    assert.equal(await article.locator('[data-app-legal-link="privacy"]').count(), 1, `${slug} has one privacy link`);
    assert.equal(await article.locator('[data-app-legal-link="terms"]').count(), 1, `${slug} has one terms link`);
    const expectedLegalStatus = slug === 'coosjoint' ? 'draft' : 'source-provided';
    assert.equal(await article.locator(`[data-app-legal-links][data-legal-source-status="${expectedLegalStatus}"]`).count(), 1, `${slug} policy links carry their correct source status`);
    assert.equal(await article.locator('[data-youtube-trailer]').count(), 1, `${slug} has one approved click-only trailer`);
    const expectedVideo = slug === 'coosjoint' ? 'bNMkbd4iv-g' : 'tOFySpe6yt0';
    assert.equal(await article.locator('[data-youtube-video-id]').getAttribute('data-youtube-video-id'), expectedVideo, `${slug} uses its approved trailer ID`);
    assert.equal(await article.locator(`[data-trailer-play="${slug}"]`).count(), 1, `${slug} offers one explicit Play action`);
  }

  const audit = await shell.evaluate((root) => {
    const candidates = [...root.querySelectorAll('h2, h3, p, li, dt, dd, a, button, .eyebrow, .youtube-trailer__eyebrow, .youtube-trailer__note')];
    const textContrast = candidates.flatMap((element) => {
      const text = (element.innerText ?? element.textContent ?? '').trim();
      if (!text || !element.getClientRects().length) return [];
      let background = '';
      let ancestor = element;
      while (ancestor && !background) {
        const candidate = getComputedStyle(ancestor).backgroundColor;
        const channels = candidate.match(/[\d.]+/gu)?.map(Number) ?? [];
        const alpha = channels.length > 3 ? channels[3] : 1;
        if (channels.length >= 3 && alpha >= .99) background = candidate;
        ancestor = ancestor.parentElement;
      }
      if (!background) background = getComputedStyle(document.body).backgroundColor;
      return [{ text: text.replace(/\s+/gu, ' ').slice(0, 100), foreground: getComputedStyle(element).color, background }];
    });
    return { textContrast, theme: document.documentElement.dataset.theme, event: document.documentElement.dataset.event };
  });
  assert.equal(audit.theme, mode, `${slug} showcase contrast audit uses ${mode} theme`);
  assert.equal(audit.event, event, `${slug} showcase contrast audit uses ${event} palette`);
  assert.ok(audit.textContrast.length >= 12, `${slug} showcase contributes its static copy to contrast checks`);
  for (const item of audit.textContrast) {
    const ratio = contrastRatio(item.foreground, item.background);
    assert.ok(ratio >= 4.5, `${slug} text “${item.text}” clears 4.5:1 in ${mode}/${event} (${ratio.toFixed(2)}:1)`);
    staticShowcaseContrastChecks += 1;
  }
  staticShowcaseChecks += 1;
}

try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const viewport of viewports) {
    for (const mode of modes) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme: mode,
        reducedMotion: 'reduce',
        timezoneId: 'America/New_York',
      });
      await context.addInitScript((theme) => {
        try {
          localStorage.setItem('nocharge-theme', theme);
          localStorage.setItem('nocharge-seasonal-mode', 'auto');
        } catch { /* Explicit root assertions below report a preference mismatch. */ }
      }, mode);
      const page = await context.newPage();
      page.setDefaultTimeout(8_000);
      page.setDefaultNavigationTimeout(15_000);
      let currentRoute = '';
      let currentEvent = '';
      page.on('pageerror', (error) => pageErrors.push({ mode, viewport: viewport.name, route: currentRoute, event: currentEvent, message: error.message }));
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push({ mode, viewport: viewport.name, route: currentRoute, event: currentEvent, message: message.text() }); });
      page.on('requestfailed', (request) => {
        const failure = request.failure()?.errorText ?? 'unknown';
        const failed = { mode, viewport: viewport.name, route: currentRoute, event: currentEvent, url: request.url(), reason: failure };
        if (request.url().startsWith('https://www.youtube-nocookie.com/embed/') && failure === 'net::ERR_ABORTED') {
          expectedTrailerAborts.push(failed);
          return;
        }
        failedRequests.push(failed);
      });
      page.on('request', (request) => {
        if (new URL(request.url()).origin !== origin) externalRequests.push({ mode, viewport: viewport.name, route: currentRoute, event: currentEvent, url: request.url() });
      });

      currentRoute = '/experiences/';
      currentEvent = 'halloween';
      let response = await page.goto(routeUrl('/experiences/'), { waitUntil: 'domcontentloaded' });
      assert.equal(response?.status(), 200, 'the Experiences directory returns HTTP 200');
      await waitForTheme(page, mode, 'halloween');
      await page.getByRole('heading', { name: 'Games & Entertainment', exact: true }).waitFor({ state: 'visible' });
      await page.getByRole('heading', { name: 'Productivity & Utilities', exact: true }).waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-experience-product-directory="ittybittybites"] .ittybitty-product-card').count(), 4,
        'all four ITTYBITTYBITES app cards render in Experiences');
      assert.equal(await page.locator('a[href="/shop/"], a[href="https://store.nocharge.net"]').count(), 0, 'Shop and store links are absent from the Experiences shell');
      assert.equal(await page.locator('.primary-nav a[href="/experiences/"]').count(), 1, 'Experiences navigation remains available');
      assert.equal(await page.locator('.catalog-filters select').count(), 3, 'existing Experience filters remain available');
      assert.equal(await page.locator('.catalog-grid .catalog-card').count(), 5, 'three static showcases and two editorial overviews remain searchable');
      assert.equal(await page.locator('a[href="https://store.nocharge.net"]').count(), 0, 'the Experiences directory has no NoCharge store destination or commerce CTA');
      assert.equal(await page.locator('main a[href^="https://play.google.com"], main a[download], main [data-nocharge-store-link]').count(), 0, 'the Experiences directory does not promote downloads, app-store installs, or NoCharge commerce');
      await inspectBarnRoadDirectory(page, mode, viewport, 'halloween');
      for (const slug of experienceSlugs) {
        assert.equal(await page.locator(`.catalog-grid .catalog-card a[href="/experiences/${slug}/"]`).count(), 1, `${slug} remains linked as a published local experience`);
      }
      for (const product of products) {
        const card = page.locator(`[data-experience-product-id="${product.id}"]`);
        assert.equal(await card.count(), 1, `${product.name} product card exists exactly once`);
        assert.equal(await card.getAttribute('data-experience-category'), product.category, `${product.name} category is exact`);
        assert.equal(await card.getAttribute('data-experience-hostname'), product.hostname, `${product.name} product host is exact`);
        assert.equal(await card.locator('a[data-experience-product-link]').getAttribute('href'), `https://${product.hostname}/`, `${product.name} external link points only to its official app site`);
        assert.equal(await card.locator('a[data-experience-product-link]').getAttribute('target'), '_blank', `${product.name} product link opens separately`);
        assert.equal(await card.locator('a[data-experience-product-link]').getAttribute('rel'), 'noopener noreferrer', `${product.name} external link uses safe isolation`);
        assert.equal(await card.locator('a[data-experience-detail-link]').getAttribute('href'), `/experiences/${product.slug}/`, `${product.name} has its own local product route`);
        const isEditorialProduct = product.slug === 'profivue' || product.slug === 'rideside';
        assert.equal(await card.locator('a[data-experience-detail-link]').getAttribute('data-experience-detail-kind'), isEditorialProduct ? 'editorial-mini-site' : 'showcase', `${product.name} directory link advertises its correct static detail type`);
        assert.equal((await card.locator('a[data-experience-detail-link]').innerText()).trim(), isEditorialProduct ? 'Read product overview' : 'Read app showcase', `${product.name} action does not imply a local demo`);
        productLinkChecks += 1;
      }
      await expectNoOverflow(page, `${mode}/${viewport.name}/experiences`, viewport.width);
      routeChecks += 1;

      currentRoute = '/shop/';
      response = await page.goto(routeUrl('/shop/'), { waitUntil: 'domcontentloaded' });
      assert.equal(response?.status(), 200, 'the existing Shop route remains HTTP 200');
      await waitForTheme(page, mode, 'halloween');
      await page.getByRole('heading', { name: 'Shop', exact: true }).waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-shop-status="hidden"]').count(), 1, 'the direct Shop route renders its hidden state');
      assert.equal(await page.locator('[data-experience-product-directory]').count(), 0, 'the hidden Shop route renders no application cards');
      assert.equal(await page.locator('.storefront-card').count(), 0, 'the hidden Shop route renders no storefront cards');
      assert.equal(await page.locator('a[href="/shop/"], a[href="https://store.nocharge.net"]').count(), 0, 'the hidden Shop route has no internal or external store links');
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,follow', 'the Shop route remains noindex');
      for (const product of products) assert.equal(await page.locator(`a[href="https://${product.hostname}/"]`).count(), 0, `${product.name} does not leak into Shop`);
      await expectNoOverflow(page, `${mode}/${viewport.name}/shop`, viewport.width);
      routeChecks += 1;


      for (const slug of ['coosjoint', 'twosecondwitness', 'profivue', 'rideside']) {
        for (const kind of ['privacy', 'terms']) {
          currentRoute = `/${kind}/${slug}/`;
          response = await page.goto(routeUrl(currentRoute), { waitUntil: 'domcontentloaded' });
          assert.equal(response?.status(), 200, `${currentRoute} app-specific legal route returns HTTP 200`);
          await waitForTheme(page, mode, 'halloween');
          const legalPage = page.locator(`article[data-app-legal-route="${slug}"][data-app-legal-kind="${kind}"]`);
          assert.equal(await legalPage.count(), 1, `${currentRoute} renders the app-specific legal record`);
          assert.equal(await legalPage.locator('h1').count(), 1, `${currentRoute} has one policy heading`);
          if (slug === 'coosjoint') {
            assert.equal(await legalPage.getAttribute('data-app-legal-status'), 'draft', `${currentRoute} is marked publisher-draft`);
            assert.equal(await legalPage.locator('[data-app-legal-draft-warning]').count(), 1, `${currentRoute} visibly warns it is not final`);
            assert.equal(await legalPage.locator('.app-legal-content').count(), 0, `${currentRoute} does not publish unresolved draft clauses`);
            assert.equal(await legalPage.locator('a[data-app-legal-source-link]').count(), 1, `${currentRoute} links to its publisher source draft`);
          } else {
            assert.equal(await legalPage.getAttribute('data-app-legal-status'), 'source-provided', `${currentRoute} retains its source-provided status`);
            assert.ok(await legalPage.locator('.app-legal-content .app-legal-section').count() > 0, `${currentRoute} renders the attributed policy sections`);
            assert.equal(await legalPage.locator('a[data-app-legal-source-link]').count(), 1, `${currentRoute} links to its exact publisher source`);
          }
          assert.equal(await legalPage.locator('a[href="https://store.nocharge.net"]').count(), 0, `${currentRoute} keeps the separate NoCharge store out of app policy pages`);
          await expectNoOverflow(page, `${mode}/${viewport.name}/${currentRoute}`, viewport.width);
          routeChecks += 1;
        }
      }

      for (const event of eventIds) {
        for (const slug of experienceSlugs) {
          currentEvent = event;
          currentRoute = `/experiences/${slug}/`;
          const externalRequestCountBeforeRoute = externalRequests.length;
          response = await page.goto(routeUrl(currentRoute, event), { waitUntil: 'domcontentloaded' });
          assert.equal(response?.status(), 200, `${currentRoute} renders (${mode}/${viewport.name}/${event})`);
          await waitForTheme(page, mode, event);
          if (staticExperienceSlugs.includes(slug)) {
            await inspectStaticMiniSite(page, slug, mode, viewport, event);
          } else if (showcaseExperienceSlugs.includes(slug)) {
            await inspectStaticShowcase(page, slug, mode, viewport, event);
            assert.equal(externalRequests.length, externalRequestCountBeforeRoute, `${slug} makes no external request on initial page load`);
            if (slug !== 'barn-road-chronicles') {
              const legalSlug = slug;
              const privacyLink = page.locator(`[data-app-legal-link="privacy"]`);
              const termsLink = page.locator(`[data-app-legal-link="terms"]`);
              assert.equal(await privacyLink.getAttribute('href'), `/privacy/${legalSlug}/`, `${slug} privacy link targets its own policy route`);
              assert.equal(await termsLink.getAttribute('href'), `/terms/${legalSlug}/`, `${slug} terms link targets its own policy route`);
              const playButton = page.locator(`[data-trailer-play="${slug}"]`);
              const videoId = slug === 'coosjoint' ? 'bNMkbd4iv-g' : 'tOFySpe6yt0';
              const externalCountBeforePlay = externalRequests.length;
              assert.equal(await page.locator('iframe').count(), 0, `${slug} has no remote video iframe before Play`);
              assert.equal(externalRequests.length, externalCountBeforePlay, `${slug} makes no external request before explicit Play`);
              await page.route('https://www.youtube-nocookie.com/**', async (route) => {
                await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Trailer request intercepted by test</title>' });
              });
              const trailerRequestPromise = page.waitForRequest((request) => request.url().startsWith(`https://www.youtube-nocookie.com/embed/${videoId}`));
              await playButton.click();
              const trailerRequest = await trailerRequestPromise;
              assert.ok(trailerRequest.url().includes(`/${videoId}?autoplay=1`), `${slug} loads its approved trailer only after the visitor clicks Play`);
              const player = page.locator(`[data-youtube-player="${slug}"]`);
              await player.waitFor({ state: 'attached' });
              assert.equal(await player.getAttribute('src'), `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`, `${slug} uses the privacy-enhanced YouTube embed URL`);
              const explicitRequests = externalRequests.slice(externalCountBeforePlay);
              assert.equal(explicitRequests.length, 1, `${slug} creates exactly one external request after the Play action`);
              assert.ok(explicitRequests[0].url.startsWith(`https://www.youtube-nocookie.com/embed/${videoId}`), `${slug} explicit external request targets only the approved video`);
              externalRequests.splice(externalCountBeforePlay, explicitRequests.length);
              await page.unroute('https://www.youtube-nocookie.com/**');
              trailerClickChecks += 1;
            } else {
              assert.equal(await page.locator('[data-trailer-play]').count(), 0, 'BRC does not add a trailer or video integration');
              assert.equal(await page.locator('[data-app-legal-links]').count(), 0, 'BRC does not add an Android legal route or Play Console policy');
            }
          } else {
            assert.fail(`${slug} is not a supported static Experience presentation`);
          }
          await expectNoOverflow(page, `${mode}/${viewport.name}/${event}/${slug}`, viewport.width);
          experiencePaletteChecks += 1;

          routeChecks += 1;
        }
      }
      await context.close();
    }
  }

  assert.equal(experiencePaletteChecks, 5 * 16 * 2 * 2, 'all five static Experiences are visited in both themes, both required widths, and all 16 event palettes');
  assert.equal(miniSitePaletteChecks, 2 * 16 * 2 * 2, 'both editorial mini-sites receive contrast audits in both themes, both widths, and all 16 palettes');
  assert.equal(miniSiteImageChecks, 5 * 16 * 2 * 2, 'all five local mini-site images load in every required palette/theme/viewport state');
  assert.ok(miniSiteContrastChecks >= miniSitePaletteChecks * 35, 'static mini-site text clears 4.5:1 in every required state');
  assert.equal(staticShowcaseChecks, 3 * 16 * 2 * 2, 'all three static app/release showcases are audited in both themes, both widths, and all 16 palettes');
  assert.ok(staticShowcaseContrastChecks >= staticShowcaseChecks * 12, 'static showcase text clears 4.5:1 in every required state');
  assert.equal(trailerClickChecks, 2 * 16 * 2 * 2, 'both official trailers create their external iframe only after an explicit Play click');
  assert.equal(brcDirectoryChecks, 2 * 2, 'the Barn Road Chronicles directory card is checked at both widths in both themes');
  assert.ok(brcDirectoryContrastChecks >= brcDirectoryChecks * 5, 'Barn Road Chronicles directory copy is contrast-audited for every theme and width');
  assert.deepEqual(externalRequests, [], 'Experience and Shop pages do not automatically request external product sites');
  assert.ok(expectedTrailerAborts.length <= trailerClickChecks, 'only explicitly loaded YouTube embed requests may abort during test navigation/teardown');
  assert.deepEqual(failedRequests, [], 'Experience and Shop routes have no unexpected failed requests');
  assert.deepEqual(pageErrors, [], 'Experience and Shop routes have no uncaught page errors');
  assert.deepEqual(consoleErrors, [], 'Experience and Shop routes have no console errors');
  console.log(`Experience / Shop browser checks passed: ${routeChecks} route visits; ${experiencePaletteChecks} static Experience/theme/viewport visits across 16 seasonal palettes; ${miniSitePaletteChecks} editorial mini-site palette checks (${miniSiteContrastChecks} contrast checks, ${miniSiteImageChecks} image loads); ${staticShowcaseChecks} static showcase palette checks (${staticShowcaseContrastChecks} contrast checks); ${trailerClickChecks} explicit trailer loads; ${expectedTrailerAborts.length} expected YouTube aborts during route teardown; ${productLinkChecks} exact app links; ${viewportChecks} overflow checks; app legal routes, source status, and Shop handoff verified; zero unapproved external, unexpected failed, page, or console requests.`)
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
