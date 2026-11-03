#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { publishedSetupSlugs } from './setup-content-utils.mjs';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) throw new Error('dist is missing; run build first.');

const expectedSlugs = await publishedSetupSlugs();
const builtSlugs = (await readdir(join(dist, 'setup'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (JSON.stringify(builtSlugs) !== JSON.stringify(expectedSlugs)) {
  const missing = expectedSlugs.filter((slug) => !builtSlugs.includes(slug));
  const extra = builtSlugs.filter((slug) => !expectedSlugs.includes(slug));
  throw new Error(`Setup build mismatch. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`);
}

const index = await readFile(join(dist, 'setup', 'index.html'), 'utf8');
const paidUrls = [];
for (const slug of expectedSlugs) {
  const html = await readFile(join(dist, 'setup', slug, 'index.html'), 'utf8');
  if (!index.includes(`/setup/${slug}/`)) throw new Error(`Orphan setup article: ${slug}`);
  if (html.includes('data-ad-banner')) throw new Error(`Display ad on setup article: ${slug}`);

  const hasAffiliateLinks = html.includes('data-has-affiliate-links="true"');
  const hasPaidLinks = html.includes('data-has-paid-links="true"');
  const awinLinks = [...html.matchAll(/<a[^>]+data-awin-link[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);
  const links = [...html.matchAll(/<a[^>]+data-amazon-paid-link[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);

  // Awin paid links on a Setup article: same disclosure order, same rel, real
  // publisher id, numeric MID, and the link text must say "(paid link)".
  if (awinLinks.length) {
    const disclosure = html.indexOf('data-affiliate-disclosure');
    if (disclosure < 0 || disclosure > html.indexOf('data-awin-link')) {
      throw new Error(`Awin disclosure not before first paid link: ${slug}`);
    }
    for (const tag of awinLinks) {
      const href = tag.match(/href="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&') ?? '';
      const rel = tag.match(/rel="([^"]+)"/)?.[1] ?? '';
      if (!/^https:\/\/www\.awin1\.com\/cread\.php\?/.test(href)) {
        throw new Error(`Awin link is not a cread URL in ${slug}: ${href}`);
      }
      if (!/awinaffid=3025417(?:&|$)/.test(href)) throw new Error(`Awin link without the publisher id in ${slug}: ${href}`);
      if (!/awinmid=\d+/.test(href)) throw new Error(`Awin link without a numeric MID in ${slug}: ${href}`);
      for (const token of ['sponsored', 'nofollow', 'noopener', 'noreferrer']) {
        if (!rel.split(' ').includes(token)) throw new Error(`Awin rel missing ${token} in ${slug}`);
      }
      if (!/\(paid link\)/i.test(tag.replace(/<[^>]*>/g, ''))) throw new Error(`Awin label not marked paid in ${slug}`);
    }
  }
  if (hasAffiliateLinks) {
    const disclosure = html.indexOf('data-affiliate-disclosure');
    const firstLink = html.indexOf('data-amazon-paid-link');
    if (disclosure < 0 || disclosure > firstLink) throw new Error(`Disclosure not before first paid link: ${slug}`);
    if (!html.includes('As an Amazon Associate I earn from qualifying purchases.')) {
      throw new Error(`Required statement missing: ${slug}`);
    }
  } else if ((links.length || awinLinks.length || html.includes('data-affiliate-disclosure')) && !hasPaidLinks) {
    throw new Error(`False affiliate markup: ${slug}`);
  }

  const seen = new Set();
  for (const tag of links) {
    const href = tag.match(/href="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
    const rel = tag.match(/rel="([^"]+)"/)?.[1] ?? '';
    if (!href) throw new Error(`Paid link missing href: ${slug}`);
    const url = new URL(href);
    if (url.protocol !== 'https:' || !['amazon.com', 'www.amazon.com'].includes(url.hostname) || url.searchParams.get('tag') !== 'nocharge-20') {
      throw new Error(`Invalid paid URL in ${slug}: ${href}`);
    }
    if (seen.has(href)) throw new Error(`Duplicate paid URL in ${slug}: ${href}`);
    seen.add(href);
    if (!rel.split(' ').includes('sponsored') || !rel.split(' ').includes('nofollow')) throw new Error(`Invalid rel in ${slug}: ${tag}`);
    if (!tag.includes('Amazon') || !tag.includes('(paid link)')) throw new Error(`Unclear paid label in ${slug}: ${tag}`);
    paidUrls.push(href);
  }
}

for (const file of ['index.html', ...expectedSlugs.map((slug) => `${slug}/index.html`)]) {
  const html = await readFile(join(dist, 'setup', file), 'utf8');
  if (/<script[^>]+(?:amazon|amzn)|<(?:iframe|img)[^>]+(?:amazon|amzn)/i.test(html)) throw new Error(`Amazon embed prohibited: ${file}`);
  if (/\b(?:Prime|in stock|star rating|customer review|limited time|lowest price|buy now)\b/i.test(html)) {
    throw new Error(`Prohibited merchant claim: ${file}`);
  }
}

const gameDirectories = (await readdir(join(dist, 'games'), { withFileTypes: true })).filter((entry) => entry.isDirectory());
/** Extracts the game shell region so a footer module is not mistaken for game UI. */
function gameSurface(html) {
  const start = html.indexOf('data-game-shell');
  if (start === -1) return '';
  const end = html.indexOf('</main>', start);
  return html.slice(start, end === -1 ? undefined : end);
}

for (const game of gameDirectories) {
  const html = await readFile(join(dist, 'games', game.name, 'index.html'), 'utf8');
  const surface = gameSurface(html);
  if (/amazon\.com|data-amazon-paid-link/i.test(surface)) throw new Error(`Amazon link in game UI: ${game.name}`);
  if (/awin1\.com|data-awin-link/i.test(surface)) throw new Error(`Awin link in game UI: ${game.name}`);
}

console.log(`Quiet Setup validation passed: ${expectedSlugs.length} articles, ${paidUrls.length} direct paid links; no merchant requests made.`);
