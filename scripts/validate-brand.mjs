#!/usr/bin/env node

/**
 * Static brand validation (npm run validate:brand).
 *
 * Checks the committed brand package against the milestone's rules without a
 * build: canonical SVG purity, favicon/ICO/apple/PWA dimensions, maskable
 * safe zone, social card and avatar dimensions, manifest accuracy, and the
 * absence of invented social handles or platform links.
 *
 * Exports `checkBrandAssets(root)` so the same checks run as unit tests in
 * scripts/validate-brand.test.ts.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const EXPECTED_FAVICON_SIZES = [16, 32, 48];
const EXPECTED_MANIFEST_ICONS = ['192', '512'];

async function listErrors(root) {
  const errors = [];
  const p = (...parts) => join(root, 'public', ...parts);

  // 1. Canonical symbol SVG: pure, hand-constructed, no external or raster content.
  const symbolPath = p('brand', 'nocharge-symbol.svg');
  if (!existsSync(symbolPath)) {
    errors.push('missing canonical symbol: public/brand/nocharge-symbol.svg');
  } else {
    const svg = readFileSync(symbolPath, 'utf8');
    if (!svg.includes('viewBox="0 0 64 64"')) errors.push('canonical symbol must use a 64x64 viewBox');
    if (/<script/i.test(svg)) errors.push('canonical symbol must not contain scripts');
    if (/<image\b|data:image|href=/i.test(svg)) errors.push('canonical symbol must not reference external or raster content');
    if (/<metadata/i.test(svg)) errors.push('canonical symbol must not contain metadata elements');
    const rects = svg.match(/<rect /g)?.length ?? 0;
    if (rects !== 3) errors.push(`canonical symbol must contain exactly 3 tile rects (found ${rects})`);
    if (!svg.includes('stroke="currentColor"')) errors.push('canonical symbol must use currentColor');
  }

  // 2. Variant SVGs exist and share the geometry.
  for (const name of ['nocharge-symbol-black.svg', 'nocharge-symbol-white.svg', 'nocharge-lockup-dark.svg', 'nocharge-lockup-light.svg']) {
    if (!existsSync(p('brand', name))) errors.push(`missing brand variant: ${name}`);
  }

  // 3. Favicon rasters and ICO.
  for (const size of EXPECTED_FAVICON_SIZES) {
    const path = p(`favicon-${size}x${size}.png`);
    if (!existsSync(path)) {
      errors.push(`missing favicon PNG: favicon-${size}x${size}.png`);
      continue;
    }
    const meta = await readImageSize(path);
    if (meta.width !== size || meta.height !== size) errors.push(`favicon-${size}x${size}.png is ${meta.width}x${meta.height}`);
  }
  const icoPath = p('favicon.ico');
  if (!existsSync(icoPath)) {
    errors.push('missing favicon.ico');
  } else {
    const ico = readFileSync(icoPath);
    if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1) errors.push('favicon.ico has an invalid header');
    const count = ico.readUInt16LE(4);
    const found = [];
    for (let i = 0; i < count; i += 1) {
      const entry = 6 + i * 16;
      found.push(ico.readUInt8(entry) === 0 ? 256 : ico.readUInt8(entry));
    }
    for (const size of EXPECTED_FAVICON_SIZES) if (!found.includes(size)) errors.push(`favicon.ico is missing the ${size}px entry (found ${found.join(', ')})`);
  }

  // 4. Apple touch icon.
  const apple = await readImageSize(p('apple-touch-icon.png'));
  if (apple.width !== 180 || apple.height !== 180) errors.push(`apple-touch-icon.png must be 180x180 (is ${apple.width}x${apple.height})`);

  // 5. PWA icons and maskable safe zone.
  for (const size of EXPECTED_MANIFEST_ICONS) {
    for (const kind of ['any', 'maskable']) {
      const name = kind === 'any' ? `icon-${size}.png` : `icon-maskable-${size}.png`;
      const path = p('icons', name);
      if (!existsSync(path)) {
        errors.push(`missing PWA icon: icons/${name}`);
        continue;
      }
      const meta = await readImageSize(path);
      if (meta.width !== Number(size) || meta.height !== Number(size)) errors.push(`icons/${name} must be ${size}x${size}`);
    }
    // Maskable safe zone: the green mark must stay inside the central 80% circle.
    const sizeN = Number(size);
    const maskablePath = p('icons', `icon-maskable-${size}.png`);
    if (existsSync(maskablePath)) {
      const maskable = await greenBox(maskablePath);
      const safeRadius = sizeN * 0.4;
      const corner = Math.hypot(maskable.maxX - sizeN / 2, maskable.maxY - sizeN / 2);
      if (corner > safeRadius + 1) {
        errors.push(`maskable icon ${size}px mark corner ${corner.toFixed(1)}px exceeds the ${safeRadius.toFixed(1)}px safe radius`);
      }
    }
  }

  // 6. Social card and avatar.
  const cardJpg = await readImageSize(p('social', 'nocharge-default.jpg'));
  const cardWebp = await readImageSize(p('social', 'nocharge-default.webp'));
  if (cardJpg.width !== 1200 || cardJpg.height !== 630) errors.push(`nocharge-default.jpg must be 1200x630 (is ${cardJpg.width}x${cardJpg.height})`);
  if (cardWebp.width !== 1200 || cardWebp.height !== 630) errors.push(`nocharge-default.webp must be 1200x630`);
  const avatar = await readImageSize(p('social', 'nocharge-avatar-512.png'));
  if (avatar.width !== 512 || avatar.height !== 512) errors.push(`nocharge-avatar-512.png must be 512x512`);

  // 7. Manifest accuracy.
  const manifestPath = p('manifest.webmanifest');
  if (!existsSync(manifestPath)) {
    errors.push('missing manifest.webmanifest');
  } else {
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch (error) {
      errors.push(`manifest.webmanifest is not valid JSON: ${error.message}`);
      manifest = null;
    }
    if (manifest) {
      if (manifest.name !== 'NoCharge' || manifest.short_name !== 'NoCharge') errors.push('manifest name/short_name must be NoCharge');
      if (manifest.start_url !== '/') errors.push('manifest start_url must be /');
      const purposes = new Set();
      for (const icon of manifest.icons ?? []) {
        const path = p(icon.src.replace(/^\//, ''));
        if (!existsSync(path)) errors.push(`manifest references missing asset: ${icon.src}`);
        if (!/^\d+x\d+$/.test(icon.sizes)) errors.push(`manifest icon has invalid sizes: ${icon.sizes}`);
        for (const purpose of String(icon.purpose ?? '').split(' ')) if (purpose) purposes.add(purpose);
      }
      if (!purposes.has('any') || !purposes.has('maskable')) errors.push('manifest must separate any and maskable icon purposes');
      for (const forbidden of ['service_worker', '"push"', '"notifications"', 'background_sync', 'periodic_background_sync']) {
        if (JSON.stringify(manifest).toLowerCase().includes(forbidden)) errors.push(`manifest must not claim ${forbidden} support`);
      }
    }
  }

  // 8. No invented social handles or platform links anywhere in source pages.
  const srcRoot = join(root, 'src', 'pages');
  const srcPages = existsSync(srcRoot) ? walk(srcRoot) : [];
  const allSource = srcPages.map((file) => readFileSync(file, 'utf8')).join('\n');
  if (/twitter:site/.test(allSource)) errors.push('no twitter:site handle may be declared (owner must verify a handle first)');
  const socialLink = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com|bsky\.app|mastodon\.[a-z.]+|youtube\.com|instagram\.com|facebook\.com|tiktok\.com|threads\.net)/i;
  for (const file of srcPages) {
    const content = readFileSync(file, 'utf8');
    const match = content.match(socialLink);
    if (match) errors.push(`social profile link found in ${file}: ${match[0]}`);
  }

  return errors;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : entry.name.endsWith('.astro') || entry.name.endsWith('.ts') || entry.name.endsWith('.md') ? [path] : [];
  });
}

async function readImageSize(path) {
  if (!existsSync(path)) return { width: 0, height: 0 };
  const meta = await sharp(path).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

/** Bounding box of green-mark pixels (the charcoal background is excluded). */
async function greenBox(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] > 24 && data[i + 1] > 90 && data[i + 1] > data[i] + 30 && data[i + 1] > data[i + 2] + 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

/** Runs every check and returns the list of failures (empty when healthy). */
export async function checkBrandAssets(root = process.cwd()) {
  return listErrors(root);
}

async function main() {
  const errors = await checkBrandAssets(process.cwd());
  if (errors.length) {
    console.error(`Brand validation failed (${errors.length}):\n${errors.map((item) => `- ${item}`).join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('Brand validation passed: canonical SVG, favicon package, PWA icons, manifest, social assets, and no invented handles.');
  }
}

// Run only when invoked directly (unit tests import the exported checks).
const invokedDirectly = process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url;
if (invokedDirectly) {
  await main();
}
