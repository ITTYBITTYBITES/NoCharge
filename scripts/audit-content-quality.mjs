#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';

const setupDirectory = join(process.cwd(), 'src', 'content', 'setup');
const files = (await readdir(setupDirectory)).filter((file) => file.endsWith('.md')).sort();
const exactSentences = new Map();
const failures = [];

for (const file of files) {
  const text = await readFile(join(setupDirectory, file), 'utf8');
  const [frontmatter = '', body = ''] = text.replace(/^---\n/, '').split('\n---\n', 2);
  const title = frontmatter.match(/^title:\s*["']?(.+?)["']?$/m)?.[1] ?? basename(file, '.md');
  const isPhaseFive = body.includes('## Related Quiet Setup guides');
  const hasAffiliateLinks = /^hasAffiliateLinks:\s*true$/m.test(frontmatter);
  const urls = [...frontmatter.matchAll(/^\s+url:\s*["']([^"']+)["']/gm)].map((match) => match[1]);
  const internalLinks = [...body.matchAll(/\]\((\/setup\/[^)]+)\)/g)].map((match) => match[1]);
  const bodyWords = body.match(/\b[\p{L}\p{N}][\p{L}\p{N}’'-]*\b/gu) ?? [];

  if (isPhaseFive && bodyWords.length < 350) failures.push(`${file}: only ${bodyWords.length} body words (minimum 350)`);
  if (isPhaseFive && !body.trimStart().startsWith('> **Bottom line:**')) failures.push(`${file}: missing Bottom line opening`);
  if (isPhaseFive && (!body.includes('|') || !/^\|.+\|$/m.test(body))) failures.push(`${file}: missing comparison table`);
  if (isPhaseFive && internalLinks.length < 2) failures.push(`${file}: fewer than two same-library links`);
  if (new Set(urls).size !== urls.length) failures.push(`${file}: duplicate affiliate destination`);
  if (hasAffiliateLinks && urls.length === 0) failures.push(`${file}: declares affiliate links but has no destination`);
  if (!hasAffiliateLinks && urls.length > 0) failures.push(`${file}: has a paid destination but declares no affiliate links`);

  if (!isPhaseFive) continue;

  for (const sentence of body
    .split(/(?<=[.!?])\s+/)
    .map((value) => value.replace(/\s+/g, ' ').trim())
    .filter((value) => value.split(' ').length >= 10)) {
    const owners = exactSentences.get(sentence) ?? [];
    owners.push({ file, title });
    exactSentences.set(sentence, owners);
  }
}

for (const [sentence, owners] of exactSentences) {
  if (owners.length >= 20) failures.push(`Repeated sentence in ${owners.length} articles: ${sentence}`);
}

if (failures.length) {
  console.error(`Content quality audit failed (${failures.length} findings):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Content quality audit passed for ${files.length} setup articles.`);
}
