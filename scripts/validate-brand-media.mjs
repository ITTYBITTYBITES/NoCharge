#!/usr/bin/env node

/**
 * Post-build brand/media metadata audit (npm run validate:brand-media).
 *
 * Runs against dist/ and verifies the social metadata contract: generic routes
 * use the default NoCharge card, specific routes keep their specific artwork,
 * My Arcade leaks no browser-local data into metadata, no invented social
 * handle or platform profile appears anywhere, the media page carries no
 * affiliate links, and feed autodiscovery is present on the homepage.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) throw new Error('dist/ is missing. Run npm run build first.');

const DEFAULT_CARD = 'https://nocharge.net/social/nocharge-default.jpg';

function readPage(route) {
  const path = route === '/' ? join(dist, 'index.html') : join(dist, route.replace(/^\//, ''), 'index.html');
  if (!existsSync(path)) throw new Error(`Expected page is missing: ${route}`);
  return { path, html: readFileSync(path, 'utf8') };
}

function meta(html, name) {
  const match = html.match(new RegExp(`<meta[^>]+(?:name|property)="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+content="([^"]*)"`));
  return match?.[1];
}

const errors = [];

// Generic routes must use the default card; specific routes keep specific art.
const genericRoutes = [
  '/', '/arcade/', '/guides/', '/articles/', '/collections/', '/help/', '/privacy/',
  '/accessibility/', '/advertising/', '/terms/', '/changelog/', '/about/', '/media/', '/my-arcade/',
];
for (const route of genericRoutes) {
  const { html } = readPage(route);
  const image = meta(html, 'og:image');
  if (image !== DEFAULT_CARD) errors.push(`${route} should use the default social card (got ${image})`);
  const width = meta(html, 'og:image:width');
  const height = meta(html, 'og:image:height');
  if (width !== '1200' || height !== '630') errors.push(`${route} has wrong og:image dimensions (${width}x${height})`);
  if (meta(html, 'twitter:site')) errors.push(`${route} declares an unverified twitter:site handle`);
}

// Game pages keep their specific social cards.
const games = ['memory-match', 'word-tile-rush', 'color-flip', 'beacon-lattice'];
for (const slug of games) {
  const { html } = readPage(`/games/${slug}/`);
  const image = meta(html, 'og:image');
  if (image !== `https://nocharge.net/game-art/${slug}/social-card.jpg`) {
    errors.push(`game page /games/${slug}/ must keep its specific social card (got ${image})`);
  }
}

// Quiet Setup pages keep their artwork and its true 1200x675 dimensions.
for (const route of ['/setup/', '/setup/what-quiet-setup-means/']) {
  const { html: setupHtml } = readPage(route);
  if (!(meta(setupHtml, 'og:image') ?? '').startsWith('https://nocharge.net/setup-art/')) {
    errors.push(`${route} must keep its setup artwork social image`);
  }
  if (meta(setupHtml, 'og:image:width') !== '1200' || meta(setupHtml, 'og:image:height') !== '675') {
    errors.push(`${route} must declare the true 1200x675 setup artwork dimensions`);
  }
}

// My Arcade must not expose local data through metadata.
const myArcade = readPage('/my-arcade/').html;
for (const [name, value] of [
  ['og:title', meta(myArcade, 'og:title')],
  ['og:description', meta(myArcade, 'og:description')],
  ['description', meta(myArcade, 'description')],
  ['og:image:alt', meta(myArcade, 'og:image:alt')],
]) {
  if (!value) errors.push(`my-arcade is missing ${name}`);
  if (/localStorage|recent|score|progress|play record|saved result/i.test(value ?? '')) {
    errors.push(`my-arcade ${name} appears to describe browser-local results: ${value}`);
  }
}

// No social platform links anywhere in the built site.
const htmlFiles = [];
const walk = (directory) => {
  for (const name of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, name.name);
    if (name.isDirectory()) walk(path);
    else if (path.endsWith('.html')) htmlFiles.push(path);
  }
};
walk(dist);
const socialUrl = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com|bsky\.app|mastodon\.[a-z.]+|youtube\.com|instagram\.com|facebook\.com|tiktok\.com|threads\.net)/i;
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const match = html.match(socialUrl);
  if (match) errors.push(`social platform URL found in ${file}: ${match[0]}`);
  if (/<meta[^>]+name="twitter:site"/.test(html)) errors.push(`twitter:site handle found in ${file}`);
}

// Media page: download links resolve and no Amazon/affiliate content is present.
const media = readPage('/media/').html;
if (/amazon\.com|tag=nocharge-20/i.test(media)) errors.push('Media page must not contain Amazon or affiliate links');
const mediaHrefs = [...media.matchAll(/(?:href)="(\/(?:brand|social|media|game-art)\/[^"]+)"/g)].map((m) => m[1]);
if (mediaHrefs.length < 12) errors.push(`Media page exposes too few download links (${mediaHrefs.length})`);
for (const href of mediaHrefs) {
  const clean = decodeURIComponent(href.split(/[?#]/, 1)[0]);
  const target = clean === '/' ? join(dist, 'index.html') : join(dist, clean.replace(/^\//, ''));
  if (!existsSync(target) && !existsSync(join(target, 'index.html'))) {
    errors.push(`Media page link does not resolve: ${href}`);
  }
}

// Homepage feed autodiscovery.
const home = readPage('/').html;
if (!/<link[^>]+rel="alternate"[^>]+type="application\/rss\+xml"[^>]+href="https:\/\/nocharge\.net\/feed\.xml"/.test(home)) {
  errors.push('Homepage must declare feed autodiscovery for /feed.xml');
}

if (errors.length) {
  console.error(`Brand/media metadata audit failed (${errors.length}):\n${errors.map((item) => `- ${item}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Brand/media metadata audit passed for ${htmlFiles.length} pages; default card on generic routes, specific art preserved, no handles, no local data, no affiliate links.`);
}
