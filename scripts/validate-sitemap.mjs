#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const sitemapPath = join(dist, 'sitemap.xml');
if (!existsSync(sitemapPath)) throw new Error('dist/sitemap.xml is missing. Run npm run build first.');

const sitemap = readFileSync(sitemapPath, 'utf8');
if (!sitemap.startsWith('<?xml') || !sitemap.includes('<urlset')) throw new Error('Sitemap is not valid XML sitemap output.');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!locations.length) throw new Error('Sitemap contains no locations.');

const required = [
  '/arcade/',
  '/guides/',
  '/articles/',
  '/about/',
  '/terms/',
  '/advertising/',
  '/changelog/',
  '/privacy/',
  '/accessibility/',
  '/games/memory-match/',
  '/games/word-tile-rush/',
  '/games/color-flip/',
];
for (const path of required) {
  if (!locations.some((location) => new URL(location).pathname === path)) throw new Error(`Sitemap is missing ${path}`);
}

for (const location of locations) {
  const pathname = new URL(location).pathname;
  const output = pathname === '/' ? join(dist, 'index.html') : join(dist, pathname.replace(/^\//, ''), 'index.html');
  if (!existsSync(output)) throw new Error(`Sitemap route has no generated page: ${pathname}`);
}

console.log(`Sitemap validation passed with ${locations.length} public routes.`);
