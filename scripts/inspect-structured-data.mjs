#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) throw new Error('dist/ is missing. Run npm run build first.');

const pages = [
  'index.html',
  'arcade/index.html',
  'guides/index.html',
  'articles/index.html',
  'changelog/index.html',
  'games/memory-match/index.html',
  'articles/memory-match-systematic-board-scan/index.html',
];
const types = new Set();
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
    for (const value of Array.isArray(data) ? data : [data]) {
      if (value?.['@type']) types.add(value['@type']);
    }
  }
}

for (const type of ['WebSite', 'CollectionPage', 'VideoGame', 'Article', 'BreadcrumbList']) {
  if (!types.has(type)) throw new Error(`Expected structured-data type was not found: ${type}`);
}
console.log(`Structured-data inspection passed (${[...types].sort().join(', ')}).`);
