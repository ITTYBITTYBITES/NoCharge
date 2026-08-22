#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep as pathSep } from 'node:path';
import sharp from 'sharp';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) throw new Error('dist/ is missing. Run npm run build before checking assets.');

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

const files = filesIn(dist).map((path) => ({ path, size: statSync(path).size }));
const scripts = files.filter((file) => file.path.endsWith('.js'));
const images = files.filter((file) => /\.(?:png|jpe?g|webp|svg)$/i.test(file.path));
const scriptBytes = scripts.reduce((sum, file) => sum + file.size, 0);
const largestImage = images.sort((a, b) => b.size - a.size)[0];
const limits = { scripts: 350 * 1024, largestImage: 350 * 1024 };

if (scriptBytes > limits.scripts) {
  throw new Error(`JavaScript budget exceeded: ${scriptBytes} bytes exceeds ${limits.scripts} bytes.`);
}
if (largestImage && largestImage.size > limits.largestImage) {
  throw new Error(`Largest image budget exceeded: ${relative(dist, largestImage.path)} is ${largestImage.size} bytes.`);
}
const editorialNames = ['quiet-arcade', 'local-scores', 'more-ways', 'testing', 'collections', 'help', 'pass-play'];
const editorialWidths = [800, 1200, 1600];
const editorialDirectory = join(dist, 'editorial-art');
const editorialFiles = [];
for (const name of editorialNames) {
  for (const width of editorialWidths) {
    for (const extension of ['webp', 'jpg']) {
      const path = join(editorialDirectory, `${name}-${width}.${extension}`);
      if (!existsSync(path)) throw new Error(`Missing responsive editorial asset: ${relative(dist, path)}.`);
      const metadata = await sharp(path).metadata();
      if (metadata.width !== width || metadata.height !== Math.round(width * 9 / 16)) {
        throw new Error(`Invalid editorial dimensions: ${relative(dist, path)} is ${metadata.width}x${metadata.height}; expected ${width}x${Math.round(width * 9 / 16)}.`);
      }
      const size = statSync(path).size;
      const limit = extension === 'webp' ? 150 * 1024 : 300 * 1024;
      if (size > limit) throw new Error(`Editorial asset budget exceeded: ${relative(dist, path)} is ${size} bytes; limit is ${limit}.`);
      editorialFiles.push(relative(dist, path));
    }
  }
}
// Square (1:1) mobile variants for the four platform-article heroes.
const editorialSquareNames = ['quiet-arcade', 'local-scores', 'more-ways', 'testing'];
for (const name of editorialSquareNames) {
  for (const extension of ['webp', 'jpg']) {
    const path = join(editorialDirectory, `${name}-square.${extension}`);
    if (!existsSync(path)) throw new Error(`Missing square editorial asset: ${relative(dist, path)}.`);
    const metadata = await sharp(path).metadata();
    if (metadata.width !== 900 || metadata.height !== 900) {
      throw new Error(`Invalid square editorial dimensions: ${relative(dist, path)} is ${metadata.width}x${metadata.height}; expected 900x900.`);
    }
    const limit = extension === 'webp' ? 150 * 1024 : 300 * 1024;
    if (statSync(path).size > limit) throw new Error(`Square editorial asset budget exceeded: ${relative(dist, path)}.`);
    editorialFiles.push(relative(dist, path));
  }
}
const referencedEditorial = files
  .filter((file) => file.path.includes(`${join('dist', 'editorial-art')}${pathSep}`))
  .map((file) => relative(dist, file.path));
const expectedEditorial = new Set(editorialFiles);
for (const file of referencedEditorial) {
  if (!expectedEditorial.has(file)) throw new Error(`Unexpected editorial asset published: ${file}.`);
}
const setupNames = ['hero', 'keyboards', 'pointing', 'screens-stands', 'puzzles-desk', 'switches', 'zoom-display', 'desk-noise'];
const setupFiles = [];
for (const name of setupNames) {
  for (const width of editorialWidths) {
    for (const extension of ['webp', 'jpg']) {
      const path = join(dist, 'setup-art', `${name}-${width}.${extension}`);
      if (!existsSync(path)) throw new Error(`Missing Quiet Setup asset: ${relative(dist, path)}.`);
      const metadata = await sharp(path).metadata();
      if (metadata.width !== width || metadata.height !== Math.round(width * 9 / 16)) throw new Error(`Invalid Quiet Setup dimensions: ${relative(dist, path)}.`);
      if (statSync(path).size > (extension === 'webp' ? 150 * 1024 : 300 * 1024)) throw new Error(`Quiet Setup asset budget exceeded: ${relative(dist, path)}.`);
      setupFiles.push(relative(dist, path));
    }
  }
}
// Reject rejected variants, temporary review PNGs, or stale concepts left behind.
const publishedSetup = files
  .filter((file) => file.path.includes(`${join('dist', 'setup-art')}${pathSep}`))
  .map((file) => relative(dist, file.path));
const expectedSetup = new Set(setupFiles);
for (const file of publishedSetup) {
  if (!expectedSetup.has(file)) throw new Error(`Unexpected Quiet Setup asset published: ${file}.`);
}
console.log(
  `Asset budget passed: ${scripts.length} scripts total ${scriptBytes} bytes; largest image ${largestImage ? `${relative(dist, largestImage.path)} (${largestImage.size} bytes)` : 'none'}; ${editorialFiles.length} responsive editorial assets validated.`,
);
