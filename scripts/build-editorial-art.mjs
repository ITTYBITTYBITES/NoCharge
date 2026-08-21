#!/usr/bin/env node
/**
 * Derive the square (1:1) mobile variants of the editorial illustrations.
 *
 * The platform-article hero mirrors the game/guide hero treatment: a 16:9
 * landscape on larger screens and a square crop on phones (see GameArtwork's
 * `variant="landscape"` + `mobileVariant="square"`). The committed 1600×900
 * editorial JPEGs are the only sources, so the square is cut from the full
 * 900-pixel height with the 900-pixel window centred on the column of peak
 * visual detail rather than the geometric centre. This keeps the subject in
 * frame even when the landscape composition is not centred.
 *
 *   node scripts/build-editorial-art.mjs
 */
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export const EDITORIAL_ART_NAMES = ['quiet-arcade', 'local-scores', 'more-ways', 'testing'];

const sourceDirectory = join('public', 'editorial-art');

async function subjectCenterX(sourcePath) {
  const { width } = await sharp(sourcePath).metadata();
  const { data, info } = await sharp(sourcePath)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Per-column edge energy: horizontal + vertical luminance gradient magnitude.
  const energy = new Float64Array(w);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      const here = data[i];
      const right = x + 1 < w ? data[i + 1] : here;
      const down = y + 1 < h ? data[i + w] : here;
      const gx = right - here;
      const gy = down - here;
      energy[x] += Math.abs(gx) + Math.abs(gy);
    }
  }

  let total = 0;
  let weighted = 0;
  for (let x = 0; x < w; x += 1) {
    total += energy[x];
    weighted += energy[x] * (x + 0.5);
  }
  const center = total > 0 ? weighted / total : w / 2;
  // Window is 900 wide; clamp so the crop stays inside the 1600px source.
  const half = Math.round(900 / 2);
  const lo = Math.min(Math.max(0, Math.round(center - half)), width - 900);
  return { center, lo };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(sourceDirectory, { recursive: true });

  for (const name of EDITORIAL_ART_NAMES) {
    const source = join(sourceDirectory, `${name}-1600.jpg`);
    const { center, lo } = await subjectCenterX(source);

    const base = sharp(source).extract({ left: lo, top: 0, width: 900, height: 900 });
    const webpPath = join(sourceDirectory, `${name}-square.webp`);
    const jpegPath = join(sourceDirectory, `${name}-square.jpg`);
    await base.clone().webp({ quality: 76, effort: 6 }).toFile(webpPath);
    await base.clone().jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(jpegPath);

    console.log(
      `${name}-square: crop left=${lo} (detail centre ${center.toFixed(1)}/1600) · webp ${statSync(webpPath).size} B · jpeg ${statSync(jpegPath).size} B`,
    );
  }
  console.log(`Wrote square editorial variants to ${sourceDirectory}.`);
}
