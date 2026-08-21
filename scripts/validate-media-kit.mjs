#!/usr/bin/env node

/**
 * Media kit archive validation (npm run validate:media-kit).
 *
 * Parses public/media/nocharge-media-kit.zip and verifies the archive is
 * valid, contains exactly the approved files, matches the committed source
 * files byte-for-byte, carries no credentials or analytics identifiers, and
 * uses the deterministic timestamps produced by generate-media-kit.mjs.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const root = process.cwd();
const zipPath = join(root, 'public', 'media', 'nocharge-media-kit.zip');
const prefix = 'nocharge-media-kit/';

function listZipEntries(buffer) {
  if (buffer.length < 22) throw new Error('ZIP file is too small');
  if (buffer.readUInt32LE(0) !== 0x04034b50) throw new Error('ZIP has an invalid local-file signature');
  // Locate the end-of-central-directory record.
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('ZIP has no end-of-central-directory record');
  const count = buffer.readUInt16LE(eocd + 10);
  const centralStart = buffer.readUInt32LE(eocd + 16);
  const entries = [];
  let offset = centralStart;
  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('ZIP central directory entry is corrupt');
    const method = buffer.readUInt16LE(offset + 10);
    const time = buffer.readUInt16LE(offset + 12);
    const date = buffer.readUInt16LE(offset + 14);
    const crc = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    // Local header check: name length must match the local record.
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50 || localNameLength !== nameLength) {
      throw new Error(`ZIP local header mismatch for ${name}`);
    }
    const dataStart = localOffset + 30 + nameLength + extraLength;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);
    entries.push({ name, method, time, date, crc, compressedSize, uncompressedSize, raw });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function main() {
  if (!existsSync(zipPath)) throw new Error('Missing public/media/nocharge-media-kit.zip. Run npm run kit:media first.');
  const buffer = readFileSync(zipPath);
  const entries = listZipEntries(buffer);

  const expected = [
    'nocharge-media-kit/',
    'nocharge-media-kit/brand/',
    'nocharge-media-kit/social/',
    'nocharge-media-kit/game-covers/',
    'nocharge-media-kit/screenshots/',
    'nocharge-media-kit/README.txt',
    'nocharge-media-kit/FACTS.txt',
    'nocharge-media-kit/brand/nocharge-symbol.svg',
    'nocharge-media-kit/brand/nocharge-symbol-black.svg',
    'nocharge-media-kit/brand/nocharge-symbol-white.svg',
    'nocharge-media-kit/brand/nocharge-lockup-dark.svg',
    'nocharge-media-kit/brand/nocharge-lockup-light.svg',
    'nocharge-media-kit/brand/nocharge-symbol-512.png',
    'nocharge-media-kit/social/nocharge-default.jpg',
    'nocharge-media-kit/social/nocharge-avatar-512.png',
    'nocharge-media-kit/game-covers/memory-match.webp',
    'nocharge-media-kit/game-covers/word-tile-rush.webp',
    'nocharge-media-kit/game-covers/color-flip.webp',
    'nocharge-media-kit/game-covers/beacon-lattice.webp',
    'nocharge-media-kit/screenshots/beacon-lattice.webp',
  ];

  const names = entries.map((entry) => entry.name);
  for (const name of expected) {
    if (!names.includes(name)) throw new Error(`Media kit is missing ${name}`);
  }
  for (const name of names) {
    if (!expected.includes(name)) throw new Error(`Media kit contains an unexpected file: ${name}`);
  }

  // Deterministic timestamps and byte-identical sources.
  const fileEntries = entries.filter((entry) => !entry.name.endsWith('/'));
  const stamps = new Set(fileEntries.map((entry) => `${entry.time}:${entry.date}`));
  if (stamps.size !== 1) throw new Error(`Media kit timestamps are not deterministic: ${[...stamps].join(', ')}`);

  const sourceMap = {
    'README.txt': 'GENERATED',
    'FACTS.txt': 'GENERATED',
    'brand/nocharge-symbol.svg': 'public/brand/nocharge-symbol.svg',
    'brand/nocharge-symbol-black.svg': 'public/brand/nocharge-symbol-black.svg',
    'brand/nocharge-symbol-white.svg': 'public/brand/nocharge-symbol-white.svg',
    'brand/nocharge-lockup-dark.svg': 'public/brand/nocharge-lockup-dark.svg',
    'brand/nocharge-lockup-light.svg': 'public/brand/nocharge-lockup-light.svg',
    'brand/nocharge-symbol-512.png': 'public/brand/nocharge-symbol-512.png',
    'social/nocharge-default.jpg': 'public/social/nocharge-default.jpg',
    'social/nocharge-avatar-512.png': 'public/social/nocharge-avatar-512.png',
    'game-covers/memory-match.webp': 'public/game-art/memory-match/cover-square.webp',
    'game-covers/word-tile-rush.webp': 'public/game-art/word-tile-rush/cover-square.webp',
    'game-covers/color-flip.webp': 'public/game-art/color-flip/cover-square.webp',
    'game-covers/beacon-lattice.webp': 'public/game-art/beacon-lattice/cover-square.webp',
    'screenshots/beacon-lattice.webp': 'public/game-art/beacon-lattice/screenshot-desktop.webp',
  };

  for (const entry of fileEntries) {
    const name = entry.name.slice(prefix.length);
    const sourcePath = sourceMap[name];
    if (!sourcePath) throw new Error(`No source mapping for ${entry.name}`);
    const data = entry.method === 8 ? inflateRawSync(entry.raw) : entry.raw;
    if (data.length !== entry.uncompressedSize) throw new Error(`Size mismatch in ${entry.name}`);
    if (sourcePath === 'GENERATED') continue; // generated text, checked for content below
    const source = readFileSync(join(root, sourcePath));
    if (!data.equals(source)) throw new Error(`Media kit file ${name} does not match its committed source`);
  }

  // No credentials, analytics IDs, or private identifiers inside the archive.
  const allText = fileEntries
    .filter((entry) => entry.name.endsWith('.txt'))
    .map((entry) => (entry.method === 8 ? inflateRawSync(entry.raw) : entry.raw).toString('utf8'))
    .join('\n');
  for (const pattern of [/ca-pub-[0-9]+/, /G-[A-Z0-9]{6,}/, /GTM-[A-Z0-9]+/, /AW-[0-9]+/, /(?:secret|api[_-]?key|token)\s*[:=]/i, /nocharge-20/, /amazon\.com/]) {
    if (pattern.test(allText)) throw new Error(`Media kit text contains a forbidden pattern: ${pattern}`);
  }
  const joinedBinary = Buffer.concat(fileEntries.map((entry) => (entry.method === 8 ? inflateRawSync(entry.raw) : entry.raw)));
  if (/ca-pub-[0-9]+/.test(joinedBinary.toString('latin1'))) throw new Error('Media kit binary content contains an AdSense publisher ID');

  console.log(`Media kit validation passed: ${fileEntries.length} files, ${buffer.length} bytes, deterministic timestamps, sources byte-identical.`);
}

main().catch((error) => {
  console.error(`Media kit validation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
