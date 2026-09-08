#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NOINDEX_ROUTES } from './sitemap-policy.mjs';
import { publishedSetupSlugs } from './setup-content-utils.mjs';

const dist = join(process.cwd(), 'dist');
const sitemapPath = join(dist, 'sitemap.xml');
if (!existsSync(sitemapPath)) throw new Error('dist/sitemap.xml is missing. Run npm run build first.');

const setupSitemapPath = join(dist, 'sitemap-setup.xml');
if (!existsSync(setupSitemapPath)) throw new Error('dist/sitemap-setup.xml is missing.');
const sitemap = readFileSync(sitemapPath, 'utf8');
if (!sitemap.startsWith('<?xml') || !sitemap.includes('<urlset')) throw new Error('Sitemap is not valid XML sitemap output.');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!locations.length) throw new Error('Sitemap contains no locations.');

const required = [
  '/setup/',
  '/setup/what-quiet-setup-means/',
  '/arcade/',
  '/guides/',
  '/articles/',
  '/articles/what-quiet-arcade-means-at-nocharge/',
  '/articles/how-nocharge-saves-scores-without-an-account/',
  '/articles/designing-browser-games-for-more-ways-to-play/',
  '/articles/how-nocharge-tests-browser-games/',
  '/collections/',
  '/collections/keyboard-friendly-browser-games/',
  '/collections/untimed-or-reduced-pressure-browser-games/',
  '/collections/browser-games-without-accounts/',
  '/collections/games-for-a-short-break/',
  '/about/',
  '/media/',
  '/contact/',
  '/tools/',
  '/tools/discovery-wheel/',
  '/tools/ambient-mixer/',
  '/tools/zoom-visualizer/',
  '/terms/',
  '/advertising/',
  '/privacy/',
  '/accessibility/',
  '/games/memory-match/',
  '/games/word-tile-rush/',
  '/games/color-flip/',
  '/games/beacon-lattice/',
  '/guides/beacon-lattice/',
];
for (const path of required) {
  if (!locations.some((location) => new URL(location).pathname === path)) throw new Error(`Sitemap is missing ${path}`);
}

for (const location of locations) {
  const url = new URL(location);
  const pathname = url.pathname;
  if (url.search || url.hash) throw new Error(`Sitemap must not contain query or fragment variants: ${location}`);
  const output = pathname === '/' ? join(dist, 'index.html') : join(dist, pathname.replace(/^\//, ''), 'index.html');
  if (!existsSync(output)) throw new Error(`Sitemap route has no generated page: ${pathname}`);
  const html = readFileSync(output, 'utf8');
  const canonical = html.match(/<link\b(?=[^>]*\brel="canonical")[^>]*\bhref="([^"]+)"/i)?.[1];
  if (canonical !== location) throw new Error(`Sitemap entry differs from its page canonical: ${location} → ${canonical}`);
  if (/<meta\b(?=[^>]*\bname="robots")(?=[^>]*\bcontent="[^"]*\bnoindex\b)[^>]*>/i.test(html)) {
    throw new Error(`Sitemap contains a noindex page: ${location}`);
  }
}

for (const excluded of NOINDEX_ROUTES) {
  if (locations.some((location) => new URL(location).pathname === excluded)) {
    throw new Error(`No-index or alias route must not appear in sitemap: ${excluded}`);
  }
}
if (new Set(locations).size !== locations.length) throw new Error('Sitemap contains duplicate locations.');

const expectedSetupSlugs = await publishedSetupSlugs();
const setupSitemap = readFileSync(setupSitemapPath, 'utf8');
const setupLocations = [...setupSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSetupPaths = ['/setup/', ...expectedSetupSlugs.map((slug) => `/setup/${slug}/`)];
const setupPaths = setupLocations.map((location) => new URL(location).pathname).sort();
if (JSON.stringify(setupPaths) !== JSON.stringify(expectedSetupPaths.sort())) {
  throw new Error(`Dedicated setup sitemap must contain the index and all ${expectedSetupSlugs.length} published articles.`);
}
console.log(`Sitemap validation passed with ${locations.length} public routes and ${expectedSetupSlugs.length} setup articles.`);
