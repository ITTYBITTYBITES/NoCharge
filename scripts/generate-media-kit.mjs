#!/usr/bin/env node

/**
 * NoCharge media kit generator (npm run kit:media).
 *
 * Builds public/media/nocharge-media-kit.zip deterministically: stable
 * ordering, fixed timestamps, UTF-8 names, deflate where it helps. The
 * archive contains only genuine, committed assets — no credentials, analytics
 * IDs, source maps, temporary captures, or fabricated screenshots.
 *
 * Canonical facts live on the /media/ page; FACTS.txt inside the archive is a
 * static snapshot whose counts are re-derived from the content collections at
 * generation time so the two cannot silently drift.
 */

import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { deflateRawSync, crc32 } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicDir = `${root}public/`;

// Fixed timestamp so the archive bytes are reproducible (2026-08-21 12:00 UTC).
const DOS_TIME = ((12 << 11) | (0 << 5) | 0) & 0xffff;
const DOS_DATE = (((2026 - 1980) << 9) | (8 << 5) | 21) & 0xffff;

/** Count non-draft entries in a content collection directory. */
function countCollection(collection) {
  const dir = join(root, 'src', 'content', collection);
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .filter((name) => !/^draft:\s*true\s*$/m.test(readFileSync(join(dir, name), 'utf8').split('---')[1] ?? ''))
    .length;
}

function buildFacts() {
  const games = ['Memory Match', 'Word Tile Rush', 'Color Flip', 'Beacon Lattice'];
  const lines = [
    'NoCharge — media kit facts',
    '==========================',
    '',
    'Canonical source: https://nocharge.net/media/ (the HTML page is the canonical facts source).',
    `Last reviewed: 2026-08-21. Counts below are generated from the repository content collections on this date.`,
    '',
    `Games: ${countCollection('games')} original browser games — ${games.join(', ')}.`,
    `Guides: ${countCollection('guides')} definitive game guides.`,
    `Articles: ${countCollection('articles')} original articles.`,
    `Quiet Setup guides: ${countCollection('setup')}.`,
    `Collections: ${countCollection('collections')}.`,
    '',
    'My Arcade is a browser-local dashboard; it is not an account.',
    'No account is required; there is no cloud save and no synchronization.',
    'Scores, progress, and preferences stay in the local browser storage of the device used.',
    'Each game supports phone and desktop input; Memory Match, Word Tile Rush, and Beacon Lattice',
    'have native keyboard controls, and Color Flip includes keyboard play and an untimed turn-based mode.',
    'NoCharge is a general-audience site and is not directed to children.',
    '',
    'The only genuine mounted-DOM gameplay capture currently published is Beacon Lattice',
    'screenshot-desktop.webp. Covers are original editorial artwork.',
    '',
  ];
  return lines.join('\n');
}

function buildReadme() {
  return `NoCharge media kit
==================

Contents
--------
brand/         Brand symbol (SVG, black, white), dark/light lockups, and a 512x512 PNG symbol.
social/        Default social card (JPG 1200x630) and square avatar (PNG 512x512).
game-covers/   One square cover (WebP 800x800) per game: memory-match, word-tile-rush,
               color-flip, beacon-lattice.
screenshots/   beacon-lattice.webp — the only genuine mounted-DOM gameplay capture on file.
FACTS.txt      Snapshot of the canonical facts; the HTML page at https://nocharge.net/media/
               is the canonical source.

Usage guidance
--------------
- Use the files as provided. Do not distort, rotate, redraw, or recombine the symbol.
- Preserve clear space and do not crop the open doorway.
- Do not recolor the mark outside the approved variants (black, white, brand green,
  deep green on light backgrounds).
- Do not imply endorsement or sponsorship by NoCharge.
- Do not present generated concept art or previews as gameplay.
- Write "NoCharge" and the game names accurately: Memory Match, Word Tile Rush,
  Color Flip, Beacon Lattice.

Contact
-------
hello@nocharge.net

Regeneration
------------
The archive is generated deterministically from the committed assets with:
  npm run kit:media
The generation script and validation checks live in scripts/generate-media-kit.mjs
and scripts/validate-media-kit.mjs.
`;
}

// ---------------------------------------------------------------------------
// Minimal deterministic ZIP writer (store + deflate, UTF-8 names).
// ---------------------------------------------------------------------------

function dosDateTime() {
  return { time: DOS_TIME, date: DOS_DATE };
}

function zipEntry(name, data) {
  const method = data.length > 96 ? 8 : 0; // deflate anything worth compressing
  const compressed = method === 8 ? deflateRawSync(data, { level: 9 }) : data;
  const crc = crc32(data) >>> 0;
  const { time, date } = dosDateTime();
  const nameBuf = Buffer.from(name, 'utf8');

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0x0800, 6); // UTF-8 names
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4); // version made by
  central.writeUInt16LE(20, 6); // version needed
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt16LE(time, 12);
  central.writeUInt16LE(date, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt16LE(0, 30); // extra
  central.writeUInt16LE(0, 32); // comment
  central.writeUInt16LE(0, 34); // disk
  central.writeUInt16LE(0, 36); // internal attrs
  central.writeUInt32LE(0, 38); // external attrs
  central.writeUInt32LE(0, 42); // offset (patched later)

  return { name, local, central, compressed, nameBuf };
}

function buildZip(files) {
  const entries = files.map(({ name, data }) => zipEntry(name, data));
  const parts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    entry.central.writeUInt32LE(offset, 42);
    parts.push(entry.local, entry.nameBuf, entry.compressed);
    centralParts.push(entry.central, entry.nameBuf);
    offset += entry.local.length + entry.nameBuf.length + entry.compressed.length;
  }
  const centralStart = offset;
  const central = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(centralStart, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, central, eocd]);
}

// ---------------------------------------------------------------------------

const rootPrefix = 'nocharge-media-kit/';
const files = [];

function addFile(archivePath, sourcePath) {
  const data = typeof sourcePath === 'string' ? readFileSync(sourcePath) : sourcePath;
  files.push({ name: `${rootPrefix}${archivePath}`, data });
}

const brand = (name) => join(publicDir, 'brand', name);
const social = (name) => join(publicDir, 'social', name);
const gameArt = (slug, name) => join(publicDir, 'game-art', slug, name);

addFile('README.txt', Buffer.from(buildReadme(), 'utf8'));
addFile('FACTS.txt', Buffer.from(buildFacts(), 'utf8'));
addFile('brand/nocharge-symbol.svg', brand('nocharge-symbol.svg'));
addFile('brand/nocharge-symbol-black.svg', brand('nocharge-symbol-black.svg'));
addFile('brand/nocharge-symbol-white.svg', brand('nocharge-symbol-white.svg'));
addFile('brand/nocharge-lockup-dark.svg', brand('nocharge-lockup-dark.svg'));
addFile('brand/nocharge-lockup-light.svg', brand('nocharge-lockup-light.svg'));
addFile('brand/nocharge-symbol-512.png', brand('nocharge-symbol-512.png'));
addFile('social/nocharge-default.jpg', social('nocharge-default.jpg'));
addFile('social/nocharge-avatar-512.png', social('nocharge-avatar-512.png'));
for (const slug of ['memory-match', 'word-tile-rush', 'color-flip', 'beacon-lattice']) {
  addFile(`game-covers/${slug}.webp`, gameArt(slug, 'cover-square.webp'));
}
addFile('screenshots/beacon-lattice.webp', gameArt('beacon-lattice', 'screenshot-desktop.webp'));

// Directory entries (store only) so unzip tools create the folder tree.
const dirs = ['', 'brand', 'social', 'game-covers', 'screenshots']
  .map((dir) => ({ name: `${rootPrefix}${dir}`.replace(/([^/])$/, '$1/'), data: Buffer.alloc(0) }))
  .sort((a, b) => a.name.localeCompare(b.name));
const zip = buildZip([...dirs, ...files.sort((a, b) => a.name.localeCompare(b.name))]);

const outDir = join(publicDir, 'media');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'nocharge-media-kit.zip');
writeFileSync(outPath, zip);

const total = files.reduce((sum, file) => sum + file.data.length, 0);
console.log(
  `Media kit written: ${outPath} (${zip.length} bytes; ${files.length} files, ${total} bytes uncompressed; deterministic timestamps).`,
);
