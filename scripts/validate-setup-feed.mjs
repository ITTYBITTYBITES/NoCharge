#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { publishedSetupSlugs } from './setup-content-utils.mjs';

const expectedSlugs = await publishedSetupSlugs();
const feed = await readFile('dist/setup/feed.xml', 'utf8');
if (!feed.startsWith('<?xml') || !feed.includes('<rss')) throw new Error('Invalid setup RSS root.');

const items = [...feed.matchAll(/<item>/g)].length;
if (items !== expectedSlugs.length) {
  throw new Error(`Expected ${expectedSlugs.length} feed items from published setup content, found ${items}.`);
}
for (const required of ['<nocharge:reviewed>', '<category>', 'https://nocharge.net/setup/']) {
  if (!feed.includes(required)) throw new Error(`Feed missing ${required}`);
}
for (const slug of expectedSlugs) {
  if (!feed.includes(`https://nocharge.net/setup/${slug}/`)) throw new Error(`Feed missing published setup article: ${slug}`);
}
if (/amazon\.com|<script|<img|utm_|doubleclick|googletagmanager|google-analytics/i.test(feed)) {
  throw new Error('Feed contains merchant or tracker markup.');
}
console.log(`Quiet Setup RSS validation passed with ${items} items.`);
