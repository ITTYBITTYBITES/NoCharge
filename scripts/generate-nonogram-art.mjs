import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/nonogram/', import.meta.url));
await mkdir(out, { recursive: true });

const PATTERN = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
];

function art(w, h, mode = 'landscape') {
  const square = mode === 'square';
  const gridSize = 5;
  const cellSize = (square ? w * 0.5 : h * 0.5) / gridSize;
  const gx = w * 0.5 - (gridSize * cellSize) / 2;
  const gy = h * 0.5 - (gridSize * cellSize) / 2;
  const stroke = Math.max(1, w / 600);

  const cells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const filled = PATTERN[r][c];
      const fill = filled ? '#12b66a' : '#1a2420';
      cells.push(`<rect x="${gx + c * cellSize}" y="${gy + r * cellSize}" width="${cellSize - 1}" height="${cellSize - 1}" rx="2" fill="${fill}" stroke="#2a3530" stroke-width="${stroke}"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="45%" r="80%"><stop stop-color="#161e1a"/><stop offset="1" stop-color="#0a0f0c"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".7" numOctaves="2" seed="23"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .04 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${cells.join('\n')}
    <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".5"/>
  </svg>`;
}

const jobs = [
  ['cover-square.webp', 800, 800, 'square'],
  ['cover-landscape.webp', 1280, 720, 'landscape'],
  ['social-card.webp', 1200, 630, 'landscape'],
];

for (const [name, w, h, mode] of jobs) {
  await sharp(Buffer.from(art(w, h, mode))).webp({ quality: 76, effort: 6 }).toFile(`${out}${name}`);
  await sharp(Buffer.from(art(w, h, mode))).jpeg({ quality: 76 }).toFile(`${out}${name.replace('.webp', '.jpg')}`);
}

// Canonical vector source lives outside public/ (never shipped); the CI
// art-drift step in deploy.yml regenerates it and fails on any drift.
const srcOut = fileURLToPath(new URL('./art-sources/nonogram/', import.meta.url));
await mkdir(srcOut, { recursive: true });
await writeFile(srcOut + 'source.svg', art(1280, 720, 'landscape'));

let iconCells = '';
for (let r = 0; r < 5; r += 1) {
  for (let c = 0; c < 5; c += 1) {
    iconCells += `<rect x="${18 + c * 13}" y="${18 + r * 13}" width="12" height="12" rx="2" fill="${PATTERN[r][c] ? '#12b66a' : '#1a2420'}"/>`;
  }
}
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/>${iconCells}</svg>`;
await writeFile(new URL('icon.svg', `file://${out}`), icon);

console.log('Nonogram art generated.');
