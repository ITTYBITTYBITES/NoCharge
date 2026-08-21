#!/usr/bin/env node

/**
 * Deterministic favicon small-size inspection (section 20 of the brand
 * milestone). Renders the brand mark at every relevant size and through
 * simulated platform masks, then measures what a visual review would look
 * for: ink coverage, content bounds, the doorway gap, feature thickness at
 * 16 px, monochrome behaviour, and mask-safe margins.
 *
 * Writes previews and a measurements.json into artifacts/brand-previews/
 * (gitignored). Used by docs/BRAND_VISUAL_REVIEW.md as the programmatic
 * counterpart to the capture suite; it never contacts a browser or network.
 */

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = `${root}artifacts/brand-previews/`;
const publicDir = `${root}public/`;

const faviconSvg = readFileSync(`${publicDir}favicon.svg`, 'utf8');
const symbolWhite = readFileSync(`${publicDir}brand/nocharge-symbol-white.svg`, 'utf8');
const symbolBlack = readFileSync(`${publicDir}brand/nocharge-symbol-black.svg`, 'utf8');

async function render(svg, size) {
  return sharp(Buffer.from(svg), { density: 96 })
    .resize(size, size)
    .png()
    .toBuffer();
}

async function pixels(buffer) {
  return sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

/** Sample the RGBA pixel at unit coordinates (64-unit grid) in a size×size raster. */
function sample(data, info, unitX, unitY, size) {
  const x = Math.min(info.width - 1, Math.max(0, Math.round((unitX / 64) * size)));
  const y = Math.min(info.height - 1, Math.max(0, Math.round((unitY / 64) * size)));
  const i = (y * info.width + x) * info.channels;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

/** Bounding box of pixels with alpha > threshold. */
function contentBox(data, info, threshold = 24) {
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * info.channels;
      if (data[i + 3] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

function isGreenish(p) {
  return p.g > 90 && p.g > p.r + 30 && p.g > p.b + 30;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const measurements = { generated: '2026-08-21', sizes: {}, masks: {} };

  const sizes = [16, 24, 32, 48, 180, 192, 512];
  for (const size of sizes) {
    const buffer = await render(faviconSvg, size);
    const { data, info } = await pixels(buffer);
    let ink = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 24) ink += 1;
    const inkRatio = ink / (info.width * info.height);

    const tl = sample(data, info, 19, 19, size);
    const br = sample(data, info, 45, 45, size);
    const gutter = sample(data, info, 32, 19, size);
    const doorGap = sample(data, info, 12, 52, size);
    const doorStroke = sample(data, info, 8, 44, size);
    const bg = sample(data, info, 2, 2, size);

    measurements.sizes[size] = {
      inkRatio: Number(inkRatio.toFixed(3)),
      solidTile: isGreenish(tl),
      solidTile2: isGreenish(br),
      gutterIsBackground: !isGreenish(gutter) && gutter.a > 200,
      doorGapIsOpen: !isGreenish(doorGap) && doorGap.a > 200,
      doorStrokeVisible: isGreenish(doorStroke),
      backgroundIsCharcoal: bg.r < 40 && bg.g < 40 && bg.b < 40,
    };
    await writeFile(`${outDir}favicon-${size}.png`, buffer);
    await sharp(buffer).resize(size * 8, size * 8, { kernel: 'nearest' }).png().toFile(`${outDir}favicon-${size}-8x.png`);
  }

  // Monochrome variants on dark and light swatches.
  for (const [name, svg, bg] of [['mono-white', symbolWhite, '#121212'], ['mono-black', symbolBlack, '#ffffff']]) {
    const mark = await render(svg, 256);
    const composite = await sharp({ create: { width: 320, height: 320, channels: 4, background: '#00000000' } })
      .composite([
        { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="${bg}"/></svg>`), left: 0, top: 0 },
        { input: mark, left: 32, top: 32 },
      ])
      .png()
      .toBuffer();
    await writeFile(`${outDir}${name}.png`, composite);
    const { data: md, info: mi } = await pixels(mark);
    measurements.masks[name] = { contentBox: contentBox(md, mi) };
  }

  // Mask simulations on the full-bleed maskable 512 icon.
  const maskable512 = readFileSync(`${publicDir}icons/icon-maskable-512.png`);
  const icon512 = readFileSync(`${publicDir}icons/icon-512.png`);
  const src = await pixels(maskable512);
  const masks = {
    circle: (x, y) => (x - 256) ** 2 + (y - 256) ** 2 <= 205 ** 2,
    rounded: (x, y) => {
      const r = 92;
      const cx = Math.min(Math.max(x, r), 512 - 1 - r);
      const cy = Math.min(Math.max(y, r), 512 - 1 - r);
      return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
    },
    squircle: (x, y) => ((x - 256) / 235) ** 4 + ((y - 256) / 235) ** 4 <= 1,
  };
  for (const [name, inside] of Object.entries(masks)) {
    const out = Buffer.alloc(src.data.length);
    let clipped = 0;
    let greenOutside = 0;
    for (let y = 0; y < src.info.height; y += 1) {
      for (let x = 0; x < src.info.width; x += 1) {
        const p = (y * src.info.width + x) * 4;
        const within = inside(x, y);
        out[p] = src.data[p];
        out[p + 1] = src.data[p + 1];
        out[p + 2] = src.data[p + 2];
        out[p + 3] = within ? src.data[p + 3] : 0;
        if (!within && src.data[p + 3] > 24) {
          clipped += 1;
          if (isGreenish({ r: src.data[p], g: src.data[p + 1], b: src.data[p + 2] })) greenOutside += 1;
        }
      }
    }
    await sharp(out, { raw: { width: src.info.width, height: src.info.height, channels: 4 } }).png().toFile(`${outDir}mask-${name}.png`);
    measurements.masks[`maskable-${name}`] = { clippedPixels: clipped, greenMarkPixelsClipped: greenOutside, markFullyInside: greenOutside === 0 };
  }

  // The "any" (rounded tile) icon under a circular crop, for the record.
  const any = await pixels(icon512);
  const anyBox = contentBox(any.data, any.info);
  let anyClipped = 0;
  for (let y = 0; y < any.info.height; y += 1) {
    for (let x = 0; x < any.info.width; x += 1) {
      const p = (y * any.info.width + x) * 4;
      if (!((x - 256) ** 2 + (y - 256) ** 2 <= 205 ** 2) && any.data[p + 3] > 24) anyClipped += 1;
    }
  }
  measurements.masks.anyIcon512 = {
    contentBox: anyBox,
    clippedByCircle205: anyClipped,
    note: 'The "any" icon is square-shaped by design; circular-crop platforms should use the maskable variants.',
  };

  await writeFile(`${outDir}measurements.json`, JSON.stringify(measurements, null, 2));
  console.log('Favicon inspection written to artifacts/brand-previews/');
  console.log('Sizes:', JSON.stringify(measurements.sizes, null, 2));
  console.log('Masks:', JSON.stringify(measurements.masks, null, 2));
}

main().catch((error) => {
  console.error(`Favicon inspection failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
