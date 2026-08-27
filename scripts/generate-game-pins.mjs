#!/usr/bin/env node

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const root = join(process.cwd(), 'public', 'game-art');
const entries = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const slug of entries) {
  const directory = join(root, slug);
  const source = join(directory, 'cover-square.jpg');
  const pipeline = () => sharp(source).resize(1000, 1500, {
    fit: 'cover',
    position: 'centre',
    kernel: sharp.kernel.lanczos3,
  });

  await pipeline()
    .jpeg({ quality: 82, progressive: true, chromaSubsampling: '4:2:0' })
    .toFile(join(directory, 'pin-1000x1500.jpg'));
  await pipeline()
    .webp({ quality: 80, effort: 6 })
    .toFile(join(directory, 'pin-1000x1500.webp'));
}

console.log(`Generated 1000×1500 JPEG and WebP pins for ${entries.length} games.`);
