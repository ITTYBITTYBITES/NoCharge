#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

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
console.log(
  `Asset budget passed: ${scripts.length} scripts total ${scriptBytes} bytes; largest image ${largestImage ? `${relative(dist, largestImage.path)} (${largestImage.size} bytes)` : 'none'}.`,
);
