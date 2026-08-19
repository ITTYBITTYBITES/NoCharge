#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://nocharge.net';
const DEFAULT_THRESHOLD_MS = 5_000;

export const expectedRoutes = [
  '/',
  '/arcade/',
  '/guides/',
  '/articles/',
  '/about/',
  '/terms/',
  '/advertising/',
  '/changelog/',
  '/privacy/',
  '/games/memory-match/',
  '/games/word-tile-rush/',
  '/games/color-flip/',
  '/games/beacon-lattice/',
];

function normaliseBaseUrl(value) {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function responseTime(startedAt) {
  return Math.round(performance.now() - startedAt);
}

export async function checkEndpoint({ baseUrl, path, thresholdMs, fetcher = fetch }) {
  const startedAt = performance.now();
  let response;
  try {
    response = await fetcher(new URL(path, `${baseUrl}/`).toString(), {
      redirect: 'follow',
      headers: { 'user-agent': 'NoCharge-Uptime-Check/1.0' },
    });
  } catch (error) {
    throw new Error(`${path} could not be reached: ${error instanceof Error ? error.message : String(error)}`);
  }
  const elapsedMs = responseTime(startedAt);
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}, expected 200`);
  if (elapsedMs > thresholdMs) throw new Error(`${path} took ${elapsedMs}ms, above ${thresholdMs}ms`);
  return { response, elapsedMs };
}

export async function checkProduction({
  baseUrl = process.env.NOCHARGE_PRODUCTION_URL || process.env.PRODUCTION_URL || DEFAULT_BASE_URL,
  thresholdMs = Number(process.env.NOCHARGE_RESPONSE_THRESHOLD_MS || DEFAULT_THRESHOLD_MS),
  fetcher = fetch,
  log = console.log,
} = {}) {
  if (!Number.isFinite(thresholdMs) || thresholdMs <= 0) {
    throw new Error('NOCHARGE_RESPONSE_THRESHOLD_MS must be a positive number of milliseconds.');
  }

  const origin = normaliseBaseUrl(baseUrl);
  const checks = [];
  for (const path of expectedRoutes) {
    const result = await checkEndpoint({ baseUrl: origin, path, thresholdMs, fetcher });
    checks.push({ path, elapsedMs: result.elapsedMs });
    log(`OK  ${path} (${result.elapsedMs}ms)`);
  }

  const health = await checkEndpoint({ baseUrl: origin, path: '/health.json', thresholdMs, fetcher });
  let healthBody;
  try {
    healthBody = await health.response.json();
  } catch {
    throw new Error('/health.json did not return valid JSON');
  }
  if (
    !healthBody ||
    healthBody.status !== 'ok' ||
    healthBody.site !== 'NoCharge' ||
    typeof healthBody.release !== 'string' ||
    typeof healthBody.builtAt !== 'string'
  ) {
    throw new Error('/health.json did not contain the expected safe release metadata');
  }
  checks.push({ path: '/health.json', elapsedMs: health.elapsedMs });
  log(`OK  /health.json (${health.elapsedMs}ms)`);

  const sitemap = await checkEndpoint({ baseUrl: origin, path: '/sitemap.xml', thresholdMs, fetcher });
  const sitemapText = await sitemap.response.text();
  const sitemapPaths = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    try {
      return new URL(match[1]).pathname;
    } catch {
      return '';
    }
  });
  for (const path of expectedRoutes) {
    if (!sitemapPaths.includes(path)) throw new Error(`/sitemap.xml is missing ${path}`);
  }
  checks.push({ path: '/sitemap.xml', elapsedMs: sitemap.elapsedMs });
  log(`OK  /sitemap.xml (${sitemap.elapsedMs}ms)`);

  log(`Uptime check passed for ${origin}; ${checks.length} responses were 200 within ${thresholdMs}ms.`);
  return { baseUrl: origin, thresholdMs, checks, health: healthBody };
}

const invokedDirectly = process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url;
if (invokedDirectly) {
  checkProduction().catch((error) => {
    console.error(`Uptime check failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
