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
  const links = [...html.matchAll(/<a[^>]+data-amazon-paid-link[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);
  if (hasAffiliateLinks) {
    const disclosure = html.indexOf('data-affiliate-disclosure');
    const firstLink = html.indexOf('data-amazon-paid-link');
    if (disclosure < 0 || disclosure > firstLink) throw new Error(`Disclosure not before first paid link: ${slug}`);
    if (!html.includes('As an Amazon Associate I earn from qualifying purchases.')) {
      throw new Error(`Required statement missing: ${slug}`);
    }
  } else if (links.length || html.includes('data-affiliate-disclosure')) {
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
for (const game of gameDirectories) {
  const html = await readFile(join(dist, 'games', game.name, 'index.html'), 'utf8');
  if (/amazon\.com|data-amazon-paid-link/i.test(html)) throw new Error(`Amazon link in game UI: ${game.name}`);
}

console.log(`Quiet Setup validation passed: ${expectedSlugs.length} articles, ${paidUrls.length} direct paid links; no merchant requests made.`);
