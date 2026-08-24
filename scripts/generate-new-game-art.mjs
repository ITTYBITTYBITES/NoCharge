/**
 * Artwork for Word Search and Mini Sudoku.
 *
 * Usage: node scripts/generate-new-game-art.mjs <word-search|mini-sudoku>
 *
 * The post-PR #25 audit found these two packages shipping placeholder title
 * cards (game name over a dark blob). The motifs now depict the actual game:
 * a letter grid with one word highlighted (Word Search) and a 6×6 grid with
 * given digits and pencil notes (Mini Sudoku), in the Quiet Arcade palette.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const slug = process.argv[2];
if (!['word-search', 'mini-sudoku'].includes(slug)) throw new Error('unknown game');
const dir = path.join('public', 'game-art', slug);
fs.mkdirSync(dir, { recursive: true });
const accent = slug === 'word-search' ? '#38bdf8' : '#a78bfa';
const ink = '#cfd8d3';

const WS_GRID = [
  ['Q', 'U', 'I', 'E', 'T', 'X', 'S', 'K'],
  ['S', 'K', 'A', 'R', 'C', 'V', 'G', 'M'],
  ['G', 'M', 'Z', 'P', 'O', 'H', 'P', 'T'],
  ['P', 'T', 'W', 'Y', 'D', 'N', 'T', 'L'],
  ['T', 'L', 'E', 'R', 'A', 'S', 'H', 'D'],
  ['H', 'D', 'B', 'F', 'K', 'W', 'W', 'O'],
  ['W', 'O', 'R', 'Q', 'U', 'B', 'S', 'X'],
  ['S', 'X', 'H', 'N', 'T', 'F', 'N', 'R'],
];

function wordSearchArt(w, h) {
  const n = 8;
  const cell = Math.min(w, h) * 0.52 / n;
  const gx = w / 2 - (n * cell) / 2;
  const gy = h / 2 - (n * cell) / 2;
  const cells = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const highlighted = r === 0 && c < 5; // the word QUIET, row 1
      const x = gx + c * cell;
      const y = gy + r * cell;
      cells.push(
        `<rect x="${x + 1.5}" y="${y + 1.5}" width="${cell - 3}" height="${cell - 3}" rx="${cell * 0.12}" fill="${highlighted ? accent : '#182220'}" stroke="#2a3530" stroke-width="1"/>`
      );
      cells.push(
        `<text x="${x + cell / 2}" y="${y + cell / 2 + cell * 0.17}" text-anchor="middle" font-family="system-ui" font-size="${cell * 0.48}" font-weight="700" fill="${highlighted ? '#0b1512' : ink}">${WS_GRID[r][c]}</text>`
      );
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="70%" cy="42%" r="80%"><stop stop-color="${accent}" stop-opacity=".14"/><stop offset=".5" stop-color="#101b19"/><stop offset="1" stop-color="#0a1211"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".7" numOctaves="2" seed="53"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .04 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${cells.join('\n')}
    <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".5"/>
  </svg>`;
}

// A 6×6 board with 3×2 boxes (thick line every 3 columns / 2 rows),
// given digits, and one empty cell carrying pencil notes.
const MS_CELL = [
  [0, 2, 0, 5, 0, 3],
  [4, 0, 6, 0, 1, 0],
  [0, 5, 0, 3, 0, 6],
  [6, 0, 1, 0, 4, 0],
  [0, 3, 0, 6, 0, 2],
  [2, 0, 4, 0, 5, 0],
];

function miniSudokuArt(w, h) {
  const n = 6;
  const cell = Math.min(w, h) * 0.54 / n;
  const gx = w / 2 - (n * cell) / 2;
  const gy = h / 2 - (n * cell) / 2;
  const cells = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const x = gx + c * cell;
      const y = gy + r * cell;
      const thickR = r % 2 === 0 ? 0 : 2;
      const thickL = c % 3 === 0 ? 0 : 2;
      cells.push(
        `<rect x="${x + thickL / 2}" y="${y + thickR / 2}" width="${cell - thickL / 2}" height="${cell - thickR / 2}" fill="#182220" stroke="${r % 2 === 0 || c % 3 === 0 ? '#4a5852' : '#2a3530'}" stroke-width="${r % 2 === 0 || c % 3 === 0 ? 2 : 1}"/>`
      );
      const v = MS_CELL[r][c];
      if (v > 0) {
        cells.push(
          `<text x="${x + cell / 2}" y="${y + cell / 2 + cell * 0.17}" text-anchor="middle" font-family="system-ui" font-size="${cell * 0.5}" font-weight="700" fill="${ink}">${v}</text>`
        );
      } else if (r === 0 && c === 0) {
        // pencil notes in one empty cell, in the page accent colour
        cells.push(
          `<text x="${x + cell * 0.14}" y="${y + cell * 0.42}" font-family="system-ui" font-size="${cell * 0.28}" font-weight="700" fill="${accent}">135</text>`
        );
      }
    }
  }
  cells.push(`<rect x="${gx}" y="${gy}" width="${n * cell}" height="${n * cell}" fill="none" stroke="#57645b" stroke-width="3"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="70%" cy="42%" r="80%"><stop stop-color="${accent}" stop-opacity=".14"/><stop offset=".5" stop-color="#10161a"/><stop offset="1" stop-color="#0a0e11"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".7" numOctaves="2" seed="61"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .04 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${cells.join('\n')}
    <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".5"/>
  </svg>`;
}

const art = slug === 'word-search' ? wordSearchArt : miniSudokuArt;

// Same five files the pages reference — no unreferenced hero/landscape
// variants and no SVG shipped to public/ (the canonical vector source is
// written to scripts/art-sources/ for the CI art-drift step).
for (const [name, w, h] of [
  ['cover-square', 800, 800],
  ['cover-landscape', 1280, 720],
  ['guide-header', 1280, 640],
  ['social-card', 1200, 630],
]) {
  const input = Buffer.from(art(w, h));
  await sharp(input).webp({ quality: 82 }).toFile(path.join(dir, `${name}.webp`));
  await sharp(input).jpeg({ quality: 86 }).toFile(path.join(dir, `${name}.jpg`));
}

const srcDir = fileURLToPath(new URL(`./art-sources/${slug}/`, import.meta.url));
fs.mkdirSync(srcDir, { recursive: true });
fs.writeFileSync(path.join(srcDir, 'source.svg'), art(1280, 720));

if (slug === 'word-search') {
  // 5×5 letter grid with one highlighted row.
  let iconGrid = '';
  const letters = ['A', 'K', 'Q', 'U', 'I', 'E', 'T', 'R', 'S', 'N', 'B', 'D', 'F', 'H', 'L', 'M', 'O', 'P', 'W', 'C', 'G', 'V', 'Y', 'Z', 'J'];
  for (let r = 0; r < 5; r += 1) {
    for (let c = 0; c < 5; c += 1) {
      const hl = r === 2;
      iconGrid += `<rect x="${21 + c * 12.5}" y="${21 + r * 12.5}" width="11.5" height="11.5" rx="2.5" fill="${hl ? accent : '#182220'}" stroke="#2a3530" stroke-width="1"/>`;
      if (!hl) iconGrid += `<text x="${21 + c * 12.5 + 5.7}" y="${21 + r * 12.5 + 9}" text-anchor="middle" font-family="system-ui" font-size="8" font-weight="700" fill="${ink}">${letters[r * 5 + c]}</text>`;
    }
  }
  fs.writeFileSync(path.join(dir, 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/>${iconGrid}</svg>`);
} else {
  // 6×6 mini grid with thick 3×2 box lines and one accent cell.
  let iconGrid = '';
  for (let r = 0; r < 6; r += 1) {
    for (let c = 0; c < 6; c += 1) {
      iconGrid += `<rect x="${21 + c * 11.5}" y="${21 + r * 11.5}" width="10.5" height="10.5" fill="${r === 0 && c === 0 ? accent : '#182220'}" stroke="${r % 2 === 0 || c % 3 === 0 ? '#4a5852' : '#2a3530'}" stroke-width="1"/>`;
    }
  }
  fs.writeFileSync(path.join(dir, 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/>${iconGrid}<rect x="21" y="21" width="69" height="69" fill="none" stroke="#57645b" stroke-width="2"/></svg>`);
}

console.log(`Generated raster and SVG art for ${slug}.`);
