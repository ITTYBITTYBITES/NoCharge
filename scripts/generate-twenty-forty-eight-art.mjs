import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/twenty-forty-eight/', import.meta.url));
await mkdir(out, { recursive: true });

function art(w, h, mode = 'landscape') {
  const square = mode === 'square';
  const gridSize = 4;
  const cellSize = (square ? w * 0.55 : h * 0.55) / gridSize;
  const gx = w * 0.5 - (gridSize * cellSize) / 2;
  const gy = h * 0.5 - (gridSize * cellSize) / 2;
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
];

for (const [name, w, h, mode] of jobs) {
  await sharp(Buffer.from(art(w, h, mode))).webp({ quality: 76, effort: 6 }).toFile(`${out}${name}`);
  await sharp(Buffer.from(art(w, h, mode))).jpeg({ quality: 76 }).toFile(`${out}${name.replace('.webp', '.jpg')}`);
}

// Canonical vector source lives outside public/ (never shipped); the CI
// art-drift step in deploy.yml regenerates it and fails on any drift.
const srcOut = fileURLToPath(new URL('./art-sources/twenty-forty-eight/', import.meta.url));
await mkdir(srcOut, { recursive: true });
await writeFile(srcOut + 'source.svg', art(1280, 720, 'landscape'));

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/><g><rect x="20" y="20" width="22" height="22" rx="5" fill="#244030"/><rect x="46" y="20" width="22" height="22" rx="5" fill="#367048"/><rect x="20" y="46" width="22" height="22" rx="5" fill="#3c8050"/><rect x="46" y="46" width="22" height="22" rx="5" fill="#12b66a"/><text x="57" y="62" fill="#e8f0ec" font-size="11" font-family="system-ui" font-weight="700" text-anchor="middle">4</text><text x="31" y="36" fill="#c8d0cc" font-size="11" font-family="system-ui" font-weight="700" text-anchor="middle">8</text></g><text x="48" y="86" fill="#12b66a" font-size="14" font-family="system-ui" font-weight="700" text-anchor="middle">2048</text></svg>`;
await writeFile(new URL('icon.svg', `file://${out}`), icon);

console.log('2048 art generated.');
