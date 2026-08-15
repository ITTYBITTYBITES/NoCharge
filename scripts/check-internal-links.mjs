#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) throw new Error('dist/ is missing. Run npm run build before checking internal links.');

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

function routeExists(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded === '/') return existsSync(join(dist, 'index.html'));
  const clean = decoded.replace(/^\/+/, '');
  if (existsSync(join(dist, clean))) return true;
  if (existsSync(join(dist, clean, 'index.html'))) return true;
  if (existsSync(join(dist, `${clean}.html`))) return true;
  return false;
}

const errors = [];
const htmlFiles = filesIn(dist).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const references = [...html.matchAll(/\b(?:href|src)=(?:"([^"]*)"|'([^']*)')/gi)].map((match) => match[1] ?? match[2]);
  for (const reference of references) {
    if (!reference || reference.startsWith('#') || reference.startsWith('mailto:') || reference.startsWith('tel:')) continue;
    if (/^(?:https?:|data:|javascript:|about:)/i.test(reference)) continue;
    if (!reference.startsWith('/')) continue;
    const pathname = reference.split(/[?#]/, 1)[0];
    if (!routeExists(pathname)) errors.push(`${relative(dist, file)} → ${reference}`);
  }
}

if (errors.length) {
  console.error(`Found ${errors.length} broken internal reference(s):\n${errors.map((item) => `- ${item}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Internal-link validation passed for ${htmlFiles.length} HTML files.`);
}
