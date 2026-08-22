import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/tile-garden/', import.meta.url));
await mkdir(out, { recursive: true });

function art(w, h, mode = 'landscape') {
  const square = mode === 'square';
  const cx = square ? w * 0.5 : w * 0.55;
  const cy = h * 0.5;
  const cellSize = (square ? w * 0.5 : h * 0.5) / 4;
  const gx = cx - cellSize * 2;
  const gy = cy - cellSize * 2;
  const stroke = Math.max(1, w / 600);

  const tiers = [
    [0, 0, 1, 0],
    [0, 1, 1, 2],
    [0, 0, 1, 0],
    [0, 0, 0, 0],
  ];

  const tierColors = ['#1a2420', '#1e3028', '#254030', '#12b66a'];
  const tierEmoji = ['🌱', '🌿', '🌼', '🌸'];

  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tier = tiers[r][c];
      const fill = tierColors[tier];
      cells.push(`<rect x="${gx + c * cellSize + 2}" y="${gy + r * cellSize + 2}" width="${cellSize - 4}" height="${cellSize - 4}" rx="${cellSize * 0.1}" fill="${fill}" stroke="#2a3530" stroke-width="${stroke}"/>`);
      if (tier > 0) {
        const fs = cellSize * 0.4;
        cells.push(`<text x="${gx + c * cellSize + cellSize / 2}" y="${gy + r * cellSize + cellSize / 2 + fs * 0.3}" font-size="${fs}" text-anchor="middle">${tierEmoji[tier]}</text>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="55%" cy="50%" r="80%"><stop stop-color="#152018"/><stop offset="1" stop-color="#0a0f0c"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".7" numOctaves="2" seed="47"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .04 0"/></filter>
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
  ['hero-square.webp', 1200, 1200, 'square'],
];

for (const [name, w, h, mode] of jobs) {
  await sharp(Buffer.from(art(w, h, mode))).webp({ quality: 76, effort: 6 }).toFile(`${out}${name}`);
  await sharp(Buffer.from(art(w, h, mode))).jpeg({ quality: 76 }).toFile(`${out}${name.replace('.webp', '.jpg')}`);
}

console.log('Tile Garden art generated.');
