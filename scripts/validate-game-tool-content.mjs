#!/usr/bin/env node
/** Build-output regressions for the Phase 1/2 indexing and editorial contract. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'parse5';
import { NOINDEX_ROUTES } from './sitemap-policy.mjs';

const root = process.cwd();
const dist = join(root, 'dist');
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value ?? '';
const hasClass = (node, name) => attr(node, 'class').split(/\s+/).includes(name);
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const normalizedText = (node) => text(node).replace(/\s+/g, ' ').trim();
function findAll(node, predicate) {
  return [...(predicate(node) ? [node] : []), ...(node.childNodes ?? []).flatMap((child) => findAll(child, predicate))];
}
function readPage(path) {
  const file = path === '/' ? 'index.html' : path.endsWith('.html') ? path.slice(1) : `${path.slice(1)}index.html`;
  return parse(readFileSync(join(dist, file), 'utf8'));
}
function assertCanonical(page, path) {
  const links = findAll(page, (node) => node.tagName === 'link' && attr(node, 'rel') === 'canonical');
  assert.equal(links.length, 1, `${path}: expected one canonical`);
  assert.equal(attr(links[0], 'href'), `https://nocharge.net${path}`, `${path}: wrong canonical`);
}

for (const path of NOINDEX_ROUTES) {
  const page = readPage(path);
  const robots = findAll(page, (node) => node.tagName === 'meta' && attr(node, 'name') === 'robots');
  assert.equal(robots.length, 1, `${path}: expected one robots tag`);
  assert.equal(attr(robots[0], 'content'), 'noindex', `${path}: noIndex must not force nofollow`);
}
assertCanonical(readPage('/search/'), '/search/');

const gameDirectory = join(root, 'src/content/games');
const gameSlugs = readdirSync(gameDirectory)
  .filter((file) => file.endsWith('.md') && !/^draft:\s*true\s*$/m.test(readFileSync(join(gameDirectory, file), 'utf8')))
  .map((file) => file.slice(0, -3));
const requiredHeadings = ['Objective and win/loss conditions', 'How it plays', 'Scoring and strategy', 'Local save data'];
const obsoleteCopy = [
  'The board, controls, and session length are documented on the game page',
  'Check the game page for pointer, touch, and keyboard alternatives.',
  'Best results, win counts, or puzzle progress are kept in this browser only.',
  'Sound on/off and mute are separate preferences.',
  'We did not measure long-term durability',
  'Open the game, play one run with the controls documented',
];
const gameBodies = new Set();
for (const slug of gameSlugs) {
  const path = `/games/${slug}/`;
  const page = readPage(path);
  assertCanonical(page, path);
  const copy = findAll(page, (node) => hasClass(node, 'game-about__copy'))[0];
  assert.ok(copy, `${path}: missing static game description`);
  const headings = findAll(copy, (node) => node.tagName === 'h2').map(normalizedText);
  assert.deepEqual(headings, requiredHeadings, `${path}: incomplete game-specific structure`);
  for (const heading of requiredHeadings) {
    const children = copy.childNodes ?? [];
    const start = children.findIndex((node) => node.tagName === 'h2' && normalizedText(node) === heading);
    const nextHeading = children.findIndex((node, index) => index > start && node.tagName === 'h2');
    const section = children.slice(start + 1, nextHeading === -1 ? undefined : nextHeading);
    assert.ok(section.some((node) => normalizedText(node).length > 0), `${path}: empty ${heading}`);
  }
  const body = normalizedText(copy);
  for (const phrase of obsoleteCopy) assert.ok(!body.includes(phrase), `${path}: obsolete shared boilerplate`);
  assert.ok(!gameBodies.has(body), `${path}: duplicate game description`);
  gameBodies.add(body);
}

const toolDirectory = join(root, 'src/pages/tools');
const toolSlugs = readdirSync(toolDirectory)
  .filter((file) => file.endsWith('.astro') && readFileSync(join(toolDirectory, file), 'utf8').includes('<ToolPage'))
  .map((file) => file.slice(0, -6));
const explanations = new Set();
const limitations = new Set();
for (const slug of toolSlugs) {
  const path = `/tools/${slug}/`;
  const page = readPage(path);
  assertCanonical(page, path);
  const how = findAll(page, (node) => attr(node, 'aria-labelledby') === 'how-it-works-heading')[0];
  const limits = findAll(page, (node) => attr(node, 'aria-labelledby') === 'tool-limits-heading')[0];
  assert.ok(how && limits, `${path}: missing static how/limits sections`);
  assert.ok(findAll(how, (node) => node.tagName === 'h3' && normalizedText(node) === 'Worked example').length, `${path}: missing worked example`);
  const howText = normalizedText(how);
  const limitsText = normalizedText(limits);
  assert.ok(!explanations.has(howText), `${path}: duplicate tool explanation`);
  assert.ok(!limitations.has(limitsText), `${path}: duplicate tool limitations`);
  assert.ok(!limitsText.includes('eye exam') && !limitsText.includes('ergonomics assessment'), `${path}: generic fallback remains`);
  explanations.add(howText);
  limitations.add(limitsText);

  const embedSection = findAll(page, (node) => attr(node, 'aria-labelledby') === 'tool-embed-heading')[0];
  assert.ok(embedSection, `${path}: missing embed example`);
  const snippet = findAll(embedSection, (node) => node.tagName === 'code')[0];
  const code = text(snippet);
  assert.ok(code.includes(`<a href="https://nocharge.net${path}">`), `${path}: invalid attribution link`);
  assert.ok(!code.includes('nocharge.net$'), `${path}: stray dollar sign in embed URL`);
}

console.log(`Game/tool content verification passed: ${gameSlugs.length} static game descriptions, ${toolSlugs.length} unique worked examples and limits, ${toolSlugs.length} valid embed snippets, ${NOINDEX_ROUTES.length} noindex-only routes.`);
