#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) throw new Error('dist/ is missing. Run npm run build first.');

const pages = [
  'index.html',
  'arcade/index.html',
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

for (const type of ['WebSite', 'CollectionPage', 'ItemList', 'VideoGame', 'Article', 'BreadcrumbList']) {
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
for (const [label, pattern] of [['title', /<title>([^<]+)<\/title>/i], ['description', /<meta name="description" content="([^"]+)"/i]]) {
  const seen = new Map();
  for (const path of htmlFiles) {
    const match = readFileSync(path, 'utf8').match(pattern);
    if (!match) continue;
    if (seen.has(match[1])) throw new Error(`Duplicate ${label}: ${match[1]} (${seen.get(match[1])}, ${path})`);
    seen.set(match[1], path);
  }
}
console.log(`Structured-data and unique-metadata inspection passed (${[...types].sort().join(', ')}).`);
