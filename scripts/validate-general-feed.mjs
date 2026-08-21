#!/usr/bin/env node

/**
 * General feed validation (npm run validate:feed, after build).
 *
 * Verifies dist/feed.xml is a well-formed RSS document with absolute canonical
 * URLs, stable GUIDs, publication dates, no duplicate items, and no affiliate,
 * tracking, or script content.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const feedPath = join(dist, 'feed.xml');

if (!existsSync(feedPath)) throw new Error('dist/feed.xml is missing. Run npm run build first.');
const feed = readFileSync(feedPath, 'utf8');

if (!feed.startsWith('<?xml') || !feed.includes('<rss') || !feed.includes('<channel>')) {
  throw new Error('General feed is not a valid RSS document.');
}
const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)];
if (items.length < 9) throw new Error(`Expected at least 9 feed items, found ${items.length}.`);
if (items.length > 50) throw new Error(`Feed item count looks wrong: ${items.length}.`);

for (const [, body] of items) {
  const guid = body.match(/<guid isPermaLink="true">([^<]+)<\/guid>/)?.[1];
  const link = body.match(/<link>([^<]+)<\/link>/)?.[1];
  const title = body.match(/<title>([^<]*)<\/title>/)?.[1];
  const pubDate = body.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1];
  if (!guid || !link || !title || !pubDate) throw new Error(`Feed item is missing guid/link/title/pubDate: ${title ?? guid ?? '(unknown)'}`);
  if (guid !== link) throw new Error(`Feed item GUID must equal its link: ${guid}`);
  if (!/^https:\/\/nocharge\.net\//.test(guid)) throw new Error(`Feed GUID is not an absolute canonical URL: ${guid}`);
  if (!/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(pubDate)) {
    throw new Error(`Feed pubDate is not a valid RFC-822 date: ${pubDate}`);
  }
  if (/amazon\.com|tag=nocharge-20|<script|tracking|pixel/i.test(body)) {
    throw new Error(`Feed item contains merchant or tracking content: ${title}`);
  }
}

const guids = items.map(([, body]) => body.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1]);
if (new Set(guids).size !== guids.length) throw new Error('Feed contains duplicate GUIDs.');

const selfLink = feed.match(/<atom:link[^>]*href="([^"]+)"[^>]*rel="self"/)?.[1] ?? feed.match(/<atom:link[^>]*rel="self"[^>]*href="([^"]+)"/)?.[1];
if (!selfLink || !selfLink.endsWith('/feed.xml')) throw new Error('Feed must declare a self link to /feed.xml.');
if (/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com|bsky\.app|mastodon|youtube\.com|instagram\.com|facebook\.com|tiktok\.com|threads\.net)/i.test(feed)) {
  throw new Error('Feed must not contain social platform URLs.');
}

console.log(`General feed validation passed: ${items.length} items, canonical GUIDs, no affiliate or tracking content.`);
