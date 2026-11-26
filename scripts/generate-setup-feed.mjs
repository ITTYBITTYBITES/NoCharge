import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'src', 'content', 'setupCatalog.json');
const publicFeedPath = path.join(root, 'public', 'setup', 'feed.xml');
const siteUrl = 'https://nocharge.net';

const xmlEscape = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

function rssDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  assert.ok(Number.isFinite(date.getTime()), `valid RSS date: ${value}`);
  return date.toUTCString();
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
assert.equal(catalog.length, 210, 'Quiet Setup feed source has exactly 210 detail guides');
assert.equal(new Set(catalog.map(({ path: route }) => route)).size, catalog.length, 'Quiet Setup feed paths are unique');

const items = [...catalog]
  .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.path.localeCompare(right.path))
  .map((article) => {
    const canonicalUrl = new URL(article.path, siteUrl).toString();
    const description = article.description || 'A NoCharge Quiet Setup guide with practical no-purchase checks and stated limitations.';
    return [
      '    <item>',
      `      <title>${xmlEscape(article.title)}</title>`,
      `      <link>${xmlEscape(canonicalUrl)}</link>`,
      `      <guid isPermaLink="true">${xmlEscape(canonicalUrl)}</guid>`,
      `      <description>${xmlEscape(description)}</description>`,
      `      <category>${xmlEscape(article.topic)}</category>`,
      `      <pubDate>${rssDate(article.updatedAt || article.publishedAt)}</pubDate>`,
      '    </item>',
    ].join('\n');
  });

const latestDate = catalog.reduce((latest, article) => article.updatedAt > latest ? article.updatedAt : latest, '1970-01-01');
const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  '  <channel>',
  '    <title>NoCharge Quiet Setup</title>',
  `    <link>${siteUrl}/setup/</link>`,
  `    <atom:link href="${siteUrl}/setup/feed.xml" rel="self" type="application/rss+xml" />`,
  '    <description>Quiet Setup guides about controls, displays, stands, desk choices, audio, lighting, and offline puzzles. No purchase is required to use the advice.</description>',
  '    <language>en-us</language>',
  `    <lastBuildDate>${rssDate(latestDate)}</lastBuildDate>`,
  ...items,
  '  </channel>',
  '</rss>',
  '',
].join('\n');

await mkdir(path.dirname(publicFeedPath), { recursive: true });
await writeFile(publicFeedPath, feed, 'utf8');
console.log(`Generated Quiet Setup RSS feed (${items.length} items): ${path.relative(root, publicFeedPath)}`);
