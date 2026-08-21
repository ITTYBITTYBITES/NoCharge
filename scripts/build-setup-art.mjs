#!/usr/bin/env node
/**
 * Build the Quiet Setup responsive illustration ladder.
 *
 * Source concepts are original AI-assisted editorial illustrations. They are
 * reviewed locally and are intentionally NOT committed: only the published
 * derivatives under `public/setup-art/` ship. Run this script with the review
 * sources present to reproduce the exact published files:
 *
 *   SETUP_ART_SOURCE=artifacts/art-src node scripts/build-setup-art.mjs
 *
 * Every concept is normalised to a true 16:9 frame at 1600×900, 1200×675 and
 * 800×450, encoded as WebP (primary) and JPEG (fallback). No background is
 * repainted and no compositing is performed here: a source concept with a
 * visible drawing defect is regenerated at the source, never patched during
 * derivative production.
 */
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export const SETUP_ART_CONCEPTS = [
  'hero',
  'keyboards',
  'pointing',
  'screens-stands',
  'puzzles-desk',
  'switches',
  'zoom-display',
  'desk-noise',
];

export const SETUP_ART_WIDTHS = [800, 1200, 1600];

const sourceDirectory = process.env.SETUP_ART_SOURCE ?? 'artifacts/art-src';
const outputDirectory = join('public', 'setup-art');

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(sourceDirectory)) {
    throw new Error(
      `Setup art sources are missing at ${sourceDirectory}. Set SETUP_ART_SOURCE to the reviewed concept directory.`,
    );
  }
  mkdirSync(outputDirectory, { recursive: true });

  const available = new Set(readdirSync(sourceDirectory));
  const rows = [];

  for (const concept of SETUP_ART_CONCEPTS) {
    const source = join(sourceDirectory, `${concept}.png`);
    if (!available.has(`${concept}.png`)) throw new Error(`Missing reviewed source concept: ${source}`);

    for (const width of SETUP_ART_WIDTHS) {
      const height = Math.round((width * 9) / 16);
      // `cover` trims the small non-16:9 remainder of the source frame from the
      // centre. Every concept is composed with a margin on all four sides, so
      // no subject is lost to this normalisation.
      const base = sharp(source).resize(width, height, { fit: 'cover', position: 'centre' });

      const webpPath = join(outputDirectory, `${concept}-${width}.webp`);
      const jpegPath = join(outputDirectory, `${concept}-${width}.jpg`);
      await base.clone().webp({ quality: 76, effort: 6 }).toFile(webpPath);
      await base.clone().jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(jpegPath);

      rows.push({ concept, width, webp: statSync(webpPath).size, jpeg: statSync(jpegPath).size });
    }
  }

  for (const row of rows) {
    console.log(`${row.concept}-${row.width}: webp ${row.webp} B / jpeg ${row.jpeg} B`);
  }
  console.log(`Wrote ${rows.length * 2} Quiet Setup assets to ${outputDirectory}.`);
}
