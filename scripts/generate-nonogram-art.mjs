import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/nonogram/', import.meta.url));
await mkdir(out, { recursive: true });

function art(w, h, mode = 'landscape') {
  const square = mode === 'square';
  const gridSize = 5;
  const cellSize = (square ? w * 0.5 : h * 0.5) / gridSize;
  const gx = square ? w * 0.25 : w * 0.35;
  const gy = h * 0.25;
  const stroke = Math.max(1, w / 600);

  const pattern = [
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ];

  const cells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const filled = pattern[r][c];
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
  ['hero-square.webp', 1200, 1200, 'square'],
];

for (const [name, w, h, mode] of jobs) {
  await sharp(Buffer.from(art(w, h, mode))).webp({ quality: 76, effort: 6 }).toFile(`${out}${name}`);
  await sharp(Buffer.from(art(w, h, mode))).jpeg({ quality: 76 }).toFile(`${out}${name.replace('.webp', '.jpg')}`);
}

console.log('Nonogram art generated.');
