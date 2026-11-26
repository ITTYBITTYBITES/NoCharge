import assert from 'node:assert/strict';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const assetsDirectory = path.join(dist, 'assets');
const reportDirectory = path.join(root, '.nocharge-review', 'content-audit');

// Read the published registry through Vite so the test binds each published
// Arcade/Experience route to the exact source moduleLoader it is meant to run.
const vite = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
  logLevel: 'error',
});
let engines;
let prerenderPaths;
let staticExperienceRoutes;
try {
  const [registry, site] = await Promise.all([
    vite.ssrLoadModule('/src/content/registry.ts'),
    vite.ssrLoadModule('/src/site.ts'),
  ]);
  engines = ['arcade', 'experiences'].flatMap((section) => registry.getPublishedBySection(section)
    .filter((entry) => typeof entry.moduleLoader === 'function')
    .map((entry) => {
      const match = entry.moduleLoader.toString().match(/\/src\/modules\/(arcade|experiences)\/([A-Za-z0-9]+)\.tsx?/u);
      assert.ok(match, `${section}/${entry.slug} exposes a direct local engine loader`);
      assert.equal(match[1], section, `${section}/${entry.slug} loads an engine from its own section`);
      return {
        route: registry.getContentPath(entry),
        section,
        slug: entry.slug,
        moduleName: match[2],
      };
    }));
  staticExperienceRoutes = registry.getPublishedBySection('experiences')
    .filter((entry) => entry.presentation === 'editorial-mini-site' || entry.presentation === 'showcase')
    .map((entry) => registry.getContentPath(entry));
  prerenderPaths = site.prerenderPages.map(({ path: route }) => route);
} finally {
  await vite.close();
}

assert.equal(engines.filter(({ section }) => section === 'arcade').length, 28, 'all 28 published Arcade engines are covered');
assert.equal(engines.filter(({ section }) => section === 'experiences').length, 0, 'all published Experiences are static and have no local engine');
assert.equal(engines.length, 28, 'the audit covers only the 28 published Arcade engines');
assert.equal(staticExperienceRoutes.length, 5, 'all five published Experience routes are static showcases or editorial mini-sites');
assert.equal(prerenderPaths.length, 334, 'the engine audit covers the complete 334-route prerender set');
assert.equal(new Set(prerenderPaths).size, prerenderPaths.length, 'the prerender set has no duplicate route paths');

const assetNames = await readdir(assetsDirectory);
const engineRoutes = new Map();
for (const engine of engines) {
  const candidates = assetNames.filter((name) => name.startsWith(`${engine.moduleName}-`) && name.endsWith('.js'));
  assert.equal(candidates.length, 1, `${engine.section}/${engine.slug} has one distinct production JS chunk (${engine.moduleName})`);
  engine.chunk = candidates[0];
  engineRoutes.set(engine.route, engine);
}
for (const route of staticExperienceRoutes) assert.ok(!engineRoutes.has(route), `${route} has no interactive Experience engine`);
assert.equal(new Set(engines.map(({ chunk }) => chunk)).size, engines.length, 'each published Arcade/Experience module has a distinct chunk');

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
const routeResults = [];
const pageErrors = [];
const consoleErrors = [];
const failedRequests = [];
const failedResponses = [];
const externalRequests = [];

try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // Every route gets an isolated browser cache so a previously visited game
  // cannot hide an accidental eager engine request on a different route.
  for (const route of prerenderPaths) {
    const expectedEngine = engineRoutes.get(route);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    page.setDefaultNavigationTimeout(20_000);
    const requestedEngineChunks = new Set();
    const requestedJsAssets = new Set();

    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin !== origin) externalRequests.push({ route, url: request.url() });
      if (url.origin !== origin || !url.pathname.startsWith('/assets/') || !url.pathname.endsWith('.js')) return;
      requestedJsAssets.add(path.posix.basename(url.pathname));
      if (engines.some((engine) => engine.chunk === path.posix.basename(url.pathname))) {
        requestedEngineChunks.add(path.posix.basename(url.pathname));
      }
    });
    page.on('requestfailed', (request) => failedRequests.push({ route, url: request.url(), reason: request.failure()?.errorText ?? 'unknown' }));
    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === origin && response.status() >= 400) {
        failedResponses.push({ route, status: response.status(), url: response.url() });
      }
    });
    page.on('pageerror', (error) => pageErrors.push({ route, message: error.message }));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push({ route, message: message.text() });
    });

    const response = await page.goto(new URL(route, origin).href, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200, `${route} returns HTTP 200 from the production preview`);
    assert.equal(await page.locator('#root').getAttribute('data-prerendered-path'), route, `${route} receives its own static prerender marker`);

    if (expectedEngine) {
      await page.locator('.interactive-viewport .interactive-module').waitFor({ state: 'visible' });
      assert.ok(requestedEngineChunks.has(expectedEngine.chunk), `${route} requests its own ${expectedEngine.section} engine chunk ${expectedEngine.chunk}`);
    }

    const actualEngineChunks = [...requestedEngineChunks].sort();
    const expectedChunks = expectedEngine ? [expectedEngine.chunk] : [];
    assert.deepEqual(
      actualEngineChunks,
      expectedChunks,
      expectedEngine
        ? `${route} loads exactly its own engine and no other Arcade/Experience engine`
        : `${route} does not load any Arcade or Experience engine outside a published detail route`,
    );

    routeResults.push({
      route,
      expectedEngine: expectedEngine ? `${expectedEngine.section}/${expectedEngine.slug}` : null,
      expectedChunk: expectedEngine?.chunk ?? null,
      requestedEngineChunks: actualEngineChunks,
      requestedJsAssets: [...requestedJsAssets].sort(),
    });
    await context.close();
  }

  assert.deepEqual(failedRequests, [], 'all route and engine requests complete successfully');
  assert.deepEqual(failedResponses, [], 'the complete prerender set has no internal HTTP errors');
  assert.deepEqual(pageErrors, [], 'all tested routes have zero uncaught page errors');
  assert.deepEqual(consoleErrors, [], 'all tested routes have zero browser console errors');
  assert.deepEqual(externalRequests, [], 'the engine-loading audit makes zero third-party requests');

  const report = {
    generatedAt: new Date().toISOString(),
    result: 'PASS',
    browser: 'Playwright Chromium (headless)',
    prerenderRouteCount: prerenderPaths.length,
    publishedEngineCounts: {
      arcade: engines.filter(({ section }) => section === 'arcade').length,
      experiences: engines.filter(({ section }) => section === 'experiences').length,
    },
    checks: {
      detailEngineRoutes: engines.length,
      routesWithNoArcadeOrExperienceEngine: routeResults.filter(({ expectedEngine }) => expectedEngine === null).length,
      internalHttpErrors: failedResponses.length,
      failedRequests: failedRequests.length,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length,
      externalRequests: externalRequests.length,
    },
    routes: routeResults,
  };
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(path.join(reportDirectory, 'engine-loading-browser-results.json'), `${JSON.stringify(report, null, 2)}\n`);
  const markdown = [
    '# NOCHARGE V2 — Route-level engine loading audit',
    '',
    `**Result:** ${report.result}  `,
    `**Generated:** ${report.generatedAt}  `,
    `**Coverage:** ${report.prerenderRouteCount} prerendered routes; ${report.checks.detailEngineRoutes} detail engines (${report.publishedEngineCounts.arcade} Arcade, ${report.publishedEngineCounts.experiences} Experiences).`,
    '',
    'Each published Arcade route requested exactly its own engine chunk. All five static Experience routes and every other non-engine prerendered route requested none of these chunks. Each route ran in a fresh browser context to avoid cache masking.',
    '',
    `- Routes with no Arcade/Experience engine: ${report.checks.routesWithNoArcadeOrExperienceEngine}.`,
    `- Internal HTTP errors: ${report.checks.internalHttpErrors}; failed requests: ${report.checks.failedRequests}.`,
    `- Page errors: ${report.checks.pageErrors}; console errors: ${report.checks.consoleErrors}; external requests: ${report.checks.externalRequests}.`,
    '',
    'Per-route expected chunks and all same-origin JavaScript asset requests are recorded in `engine-loading-browser-results.json`.',
    '',
  ].join('\n');
  await writeFile(path.join(reportDirectory, 'engine-loading-browser-results.md'), markdown);
  console.log(`Engine loading browser checks passed: ${engines.filter(({ section }) => section === 'arcade').length} Arcade engines loaded only on their own detail routes; ${engines.filter(({ section }) => section === 'experiences').length} Experience engines; ${staticExperienceRoutes.length} static Experience routes; ${routeResults.length - engines.length} other prerender routes loaded no engine chunks; zero internal HTTP errors, failed requests, console/page errors, or external requests.`);
  console.log(`Report: ${path.join(reportDirectory, 'engine-loading-browser-results.md')}`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
