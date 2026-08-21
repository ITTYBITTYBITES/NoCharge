#!/usr/bin/env node

/**
 * NoCharge brand asset generator (npm run art:brand).
 *
 * Reads the canonical hand-built SVG sources in /public/brand and
 * /public/favicon.svg and writes every raster the brand package needs:
 *
 *   - Transparent press PNGs (symbol, dark/light lockups)
 *   - Favicon PNGs (16/32/48) and a multi-size favicon.ico
 *   - Apple touch icon (180x180) and PWA icons (192/512, any + maskable)
 *   - Default social card (1200x630, jpg + webp) and square avatar (512)
 *
 * It never writes to public/game-art, public/editorial-art or public/setup-art,
 * and it never generates gameplay screenshots. Text in the social card and
 * lockup rasters is composed deterministically as SVG text using the
 * documented system font stack; the script verifies the text actually
 * rendered and fails clearly when a font dependency is missing.
 */

import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const brandDir = `${root}public/brand/`;
const publicDir = `${root}public/`;

const BRAND_GREEN = '#0f9d58';
const CHARCOAL = '#121212';
const TEXT_LIGHT = '#f4f4f4';
const TEXT_MUTED = '#9a9a9a';
const FONT_STACK =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'DejaVu Sans', 'Liberation Sans', sans-serif";

/** Parse the canonical symbol geometry out of nocharge-symbol.svg. */
function readCanonicalSymbol() {
  const svg = readFileSync(`${brandDir}nocharge-symbol.svg`, 'utf8');
  const rects = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="([\d.]+)"\/>/g)];
  const pathMatch = svg.match(
    /<path fill="none" stroke="currentColor" stroke-width="([\d.]+)" stroke-linejoin="round" d="([^"]+)"/,
  );
  if (rects.length !== 3 || !pathMatch) {
    throw new Error('Canonical symbol SVG is malformed: expected 3 tiles and one doorway path.');
  }
  const tile = rects.map((rect) => ({
    x: Number(rect[1]),
    y: Number(rect[2]),
    width: Number(rect[3]),
    height: Number(rect[4]),
    rx: Number(rect[5]),
  }));
  return { tile, strokeWidth: Number(pathMatch[1]), doorPath: pathMatch[2] };
}

const symbol = readCanonicalSymbol();

/** Inner SVG markup for the mark in a single colour (64-unit coordinates). */
function markGroup({ fill, stroke = fill, strokeWidth = symbol.strokeWidth }) {
  const tiles = symbol.tile
    .map((t) => `<rect x="${t.x}" y="${t.y}" width="${t.width}" height="${t.height}" rx="${t.rx}"/>`)
    .join('');
  return `<g fill="${fill}">${tiles}</g><path fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" d="${symbol.doorPath}"/>`;
}

/** Render an SVG string to a PNG file at exact dimensions. */
async function renderPng(source, outPath, { width, height, pngOptions = {} }) {
  await sharp(Buffer.from(source), { density: 96 })
    .resize(width, height)
    .png(pngOptions)
    .toFile(outPath);
}

/**
 * Build the ICO container with PNG-compressed entries (16, 32, 48).
 * Windows Vista and every modern browser accept PNG payloads in ICO files.
 */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const directory = [];
  let offset = 6 + entries.length * 16;
  for (const { size, png } of entries) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    directory.push(entry);
  }
  return Buffer.concat([header, ...directory, ...entries.map((entry) => entry.png)]);
}

async function generateFaviconRasters() {
  const faviconSvg = await readFile(`${publicDir}favicon.svg`, 'utf8');
  const sizes = [16, 32, 48];
  const pngs = [];
  for (const size of sizes) {
    const out = `${publicDir}favicon-${size}x${size}.png`;
    await renderPng(faviconSvg, out, { width: size, height: size, pngOptions: { compressionLevel: 9, palette: true } });
    pngs.push({ size, png: await readFile(out) });
  }
  const ico = buildIco(pngs);
  await writeFile(`${publicDir}favicon.ico`, ico);
  console.log(`favicon.ico written (${ico.length} bytes; entries: ${pngs.map((p) => p.size).join(', ')})`);
}

async function generateAppleAndPwaIcons() {
  // Apple touch icon: full-bleed charcoal square (iOS applies its own mask).
  const appleBody = markGroup({ fill: BRAND_GREEN });
  await renderPng(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 64 64"><rect width="64" height="64" fill="${CHARCOAL}"/>${appleBody}</svg>`,
    `${publicDir}apple-touch-icon.png`,
    { width: 180, height: 180, pngOptions: { compressionLevel: 9, palette: true } },
  );

  for (const size of [192, 512]) {
    // "any" purpose: rounded charcoal tile, mark at the favicon footprint.
    const radius = Math.round(size * 0.22);
    const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${CHARCOAL}"/><g transform="scale(${size / 64})">${markGroup({ fill: BRAND_GREEN })}</g></svg>`;
    await renderPng(anySvg, `${publicDir}icons/icon-${size}.png`, {
      width: size,
      height: size,
      pngOptions: { compressionLevel: 9, palette: true },
    });

    // maskable: full-bleed charcoal, mark inside the central 80% safe zone.
    const safeBox = Math.round(size * 0.64);
    const pad = (size - safeBox) / 2;
    const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${CHARCOAL}"/><g transform="translate(${pad} ${pad}) scale(${safeBox / 64})">${markGroup({ fill: BRAND_GREEN })}</g></svg>`;
    await renderPng(maskableSvg, `${publicDir}icons/icon-maskable-${size}.png`, {
      width: size,
      height: size,
      pngOptions: { compressionLevel: 9, palette: true },
    });
  }
}

async function generatePressPngs() {
  // Transparent 512 symbol. The canonical mark uses currentColor, which
  // resolves to black ink in neutral press use; colour variants are covered
  // by the documented palette in docs/BRAND_GUIDE.md.
  await renderPng(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">${markGroup({ fill: '#000000' })}</svg>`,
    `${brandDir}nocharge-symbol-512.png`,
    { width: 512, height: 512, pngOptions: { compressionLevel: 9, palette: true } },
  );

  for (const [name, sourceName] of [
    ['nocharge-lockup-dark-1200.png', 'nocharge-lockup-dark.svg'],
    ['nocharge-lockup-light-1200.png', 'nocharge-lockup-light.svg'],
  ]) {
    const lockupSvg = await readFile(`${brandDir}${sourceName}`, 'utf8');
    const out = `${brandDir}${name}`;
    await renderPng(lockupSvg, out, { width: 1200, height: 320, pngOptions: { compressionLevel: 9 } });
    const ink = await countInkPixels(out);
    if (ink.ink < 2000) {
      throw new Error(`Lockup raster ${out} has almost no ink; the text font may be unavailable.`);
    }
  }
}

/** Count non-transparent pixels in a PNG. */
async function countInkPixels(pngPath) {
  const { data, info } = await sharp(pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let ink = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 24) ink += 1;
  return { ink, total: info.width * info.height };
}

async function generateSocialCard() {
  const symbolBody = `<g transform="translate(96 165) scale(4.6875)">${markGroup({ fill: BRAND_GREEN })}</g>`;
  const body = `
    <defs>
      <radialGradient id="glow" cx="22%" cy="24%" r="70%">
        <stop stop-color="${BRAND_GREEN}" stop-opacity="0.18"/>
        <stop offset="0.55" stop-color="${BRAND_GREEN}" stop-opacity="0.05"/>
        <stop offset="1" stop-color="${BRAND_GREEN}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="${CHARCOAL}"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    ${symbolBody}
    <text x="468" y="352" font-family="${FONT_STACK}" font-size="118" font-weight="700" fill="${TEXT_LIGHT}">NoCharge</text>
    <text x="470" y="420" font-family="${FONT_STACK}" font-size="34" fill="${TEXT_MUTED}">Quiet browser games and clear guides</text>`;
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${body}</svg>`;

  await mkdir(`${publicDir}social`, { recursive: true });
  const pngBuffer = await sharp(Buffer.from(source), { density: 96 }).resize(1200, 630).png().toBuffer();
  const stats = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let ink = 0;
  for (let i = 3; i < stats.data.length; i += 4) if (stats.data[i] > 24) ink += 1;
  if (ink < 20_000) throw new Error('Default social card rendered almost no content; the text font may be unavailable.');
  await sharp(pngBuffer).jpeg({ quality: 88, mozjpeg: true }).toFile(`${publicDir}social/nocharge-default.jpg`);
  await sharp(pngBuffer).webp({ quality: 86, effort: 6 }).toFile(`${publicDir}social/nocharge-default.webp`);
}

async function generateAvatar() {
  const size = 512;
  const scale = 4.375; // 64 -> 280, inside the central 80% circle
  const pad = (size - 280) / 2;
  const body = `<rect width="${size}" height="${size}" rx="112" fill="${CHARCOAL}"/><g transform="translate(${pad} ${pad}) scale(${scale})">${markGroup({ fill: BRAND_GREEN })}</g>`;
  await renderPng(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`,
    `${publicDir}social/nocharge-avatar-512.png`,
    { width: size, height: size, pngOptions: { compressionLevel: 9, palette: true } },
  );
}

async function main() {
  await mkdir(`${publicDir}icons`, { recursive: true });
  await mkdir(`${publicDir}social`, { recursive: true });
  await generateFaviconRasters();
  await generateAppleAndPwaIcons();
  await generatePressPngs();
  await generateSocialCard();
  await generateAvatar();
  console.log('Brand asset generation complete.');
}

main().catch((error) => {
  console.error(`Brand asset generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
