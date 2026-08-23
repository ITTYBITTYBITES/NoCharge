import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/twenty-forty-eight/', import.meta.url));
await mkdir(out, { recursive: true });

function art(w, h, mode = 'landscape') {
  const square = mode === 'square';
  const gridSize = 4;
  const cellSize = (square ? w * 0.55 : h * 0.55) / gridSize;
  const gx = square ? w * 0.225 : w * 0.35;
  const gy = h * 0.225;
  const stroke = Math.max(1, w / 600);
  const gap = cellSize * 0.08;

  const values = [
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [512, 1024, 2048, 0],
    [0, 0, 0, 0],
  ];

  const colors = {
    2: '#1c2820', 4: '#1e3428', 8: '#244030', 16: '#2a5038',
    32: '#306040', 64: '#367048', 128: '#3c8050', 256: '#428858',
    512: '#489060', 1024: '#4e9868', 2048: '#12b66a', 0: '#161b18',
  };

  const cells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const val = values[r][c];
      const fill = colors[val] || '#161b18';
      const textFill = val >= 8 ? '#e8f0ec' : '#c8d0cc';
      cells.push(`<rect x="${gx + c * cellSize + gap}" y="${gy + r * cellSize + gap}" width="${cellSize - gap * 2}" height="${cellSize - gap * 2}" rx="${cellSize * 0.08}" fill="${fill}" stroke="#2a3530" stroke-width="${stroke}"/>`);
      if (val > 0) {
        const fs = val >= 1000 ? cellSize * 0.22 : cellSize * 0.3;
        cells.push(`<text x="${gx + c * cellSize + cellSize / 2}" y="${gy + r * cellSize + cellSize / 2 + fs * 0.3}" fill="${textFill}" font-size="${fs}" font-family="system-ui" font-weight="700" text-anchor="middle">${val}</text>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="55%" cy="45%" r="80%"><stop stop-color="#161e1a"/><stop offset="1" stop-color="#0a0f0c"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".7" numOctaves="2" seed="31"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .04 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect x="${gx - gap}" y="${gy - gap}" width="${gridSize * cellSize + gap * 2}" height="${gridSize * cellSize + gap * 2}" rx="${cellSize * 0.12}" fill="#0f1510"/>
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

console.log('2048 art generated.');
