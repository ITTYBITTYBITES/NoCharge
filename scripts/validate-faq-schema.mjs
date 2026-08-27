#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
const htmlFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path);
  }
}
await walk(dist);

const decode = (value) => value
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&nbsp;', ' ');
const normalize = (value) => decode(String(value)).replace(/\s+/g, ' ').trim();

let faqPages = 0;
let questions = 0;
const failures = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const visibleText = normalize(html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '));
  const structured = [];
  for (const match of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(match[1]);
      structured.push(...(Array.isArray(value) ? value : [value]));
    } catch (error) {
      failures.push(`${relative(dist, file)}: invalid JSON-LD (${error instanceof Error ? error.message : String(error)})`);
    }
  }

  for (const faq of structured.filter((item) => item?.['@type'] === 'FAQPage')) {
    faqPages += 1;
    const entities = Array.isArray(faq.mainEntity) ? faq.mainEntity : [];
    if (!entities.length) failures.push(`${relative(dist, file)}: FAQPage has no questions`);
    for (const entity of entities) {
      questions += 1;
      const question = normalize(entity?.name ?? '');
      const answer = normalize(entity?.acceptedAnswer?.text ?? '');
      if (!question || !visibleText.includes(question)) failures.push(`${relative(dist, file)}: schema question is not visible: ${question}`);
      if (!answer || !visibleText.includes(answer)) failures.push(`${relative(dist, file)}: schema answer is not visible for: ${question}`);
    }
  }
}

if (faqPages < 250) failures.push(`Expected FAQPage on at least 250 built pages after phases 2–5; found ${faqPages}.`);
if (failures.length) {
  console.error(`FAQ schema validation failed (${failures.length} findings):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`FAQ schema validation passed: ${faqPages} pages and ${questions} visible question/answer pairs.`);
}
