#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) throw new Error('dist/ is missing. Run npm run build first.');

const pages = [
  'index.html',
  'arcade/index.html',
  'my-arcade/index.html',
  'guides/index.html',
  'articles/index.html',
  'setup/index.html',
  'setup/mouse-trackpad-trackball-or-touch/index.html',
  'changelog/index.html',
  'games/memory-match/index.html',
  'articles/memory-match-systematic-board-scan/index.html',
  'articles/how-nocharge-tests-browser-games/index.html',
  'collections/index.html',
  'collections/keyboard-friendly-browser-games/index.html',
];
const types = new Set();
const collectTypes = (value) => {
  if (!value || typeof value !== 'object') return;
  if (typeof value['@type'] === 'string') types.add(value['@type']);
  for (const child of Object.values(value)) collectTypes(child);
};
for (const page of pages) {
  const path = join(dist, page);
  if (!existsSync(path)) throw new Error(`Expected structured-data page is missing: ${page}`);
  const html = readFileSync(path, 'utf8');
  const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  if (!blocks.length) throw new Error(`No JSON-LD found in ${page}`);
  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block[1]);
    } catch (error) {
      throw new Error(`Invalid JSON-LD in ${page}: ${error instanceof Error ? error.message : String(error)}`);
    }
    collectTypes(data);
  }
}

for (const type of ['WebSite', 'WebPage', 'CollectionPage', 'ItemList', 'VideoGame', 'Article', 'BreadcrumbList']) {
  if (!types.has(type)) throw new Error(`Expected structured-data type was not found: ${type}`);
}

const htmlFiles = [];
const walk = (directory) => {
  for (const name of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, name.name);
    if (name.isDirectory()) walk(path);
    else if (path.endsWith('.html')) htmlFiles.push(path);
  }
};
walk(dist);
// Localized copies of untranslated pages (under /tr/, /fr-ca/, /es/, or /de/)
// intentionally repeat English metadata and point their canonical at the
// English URL. They are not separate indexable pages, so only the canonical
// page is compared. Keep in sync with PREFIXED_LOCALES in src/i18n/config.ts.
const LOCALE_PREFIX = /^(tr|fr-ca|es|de)\//;
const isCanonicalElsewhere = (path, html) => {
  const relativePath = path.slice(dist.length + 1).split(sep).join('/');
  if (!LOCALE_PREFIX.test(relativePath)) return false;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const ownUrl = `https://nocharge.net/${relativePath.replace(/index\.html$/, '')}`;
  return canonical !== undefined && canonical !== ownUrl;
};
for (const [label, pattern] of [['title', /<title>([^<]+)<\/title>/i], ['description', /<meta name="description" content="([^"]+)"/i]]) {
  const seen = new Map();
  for (const path of htmlFiles) {
    const html = readFileSync(path, 'utf8');
    const match = html.match(pattern);
    if (!match) continue;
    if (isCanonicalElsewhere(path, html)) continue;
    if (seen.has(match[1])) throw new Error(`Duplicate ${label}: ${match[1]} (${seen.get(match[1])}, ${path})`);
    seen.set(match[1], path);
  }
}
console.log(`Structured-data and unique-metadata inspection passed (${[...types].sort().join(', ')}).`);
