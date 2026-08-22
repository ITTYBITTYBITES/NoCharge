import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/freecell/', import.meta.url));
await mkdir(out, { recursive: true });

function art(w, h, mode = 'landscape') {
  const square = mode === 'square';
  const cx = square ? w * 0.5 : w * 0.55;
  const cy = h * 0.5;
  const cardW = square ? w * 0.16 : h * 0.14;
  const cardH = cardW * 1.4;
  const stroke = Math.max(2, w / 400);

  const cols = [];
  for (let i = 0; i < 8; i++) {
    const x = cx - cardW * 4 + i * (cardW + cardW * 0.15);
    const stackCount = i < 4 ? 3 : 2;
    for (let j = 0; j < stackCount; j++) {
      cols.push(`<rect x="${x}" y="${cy - cardH * 0.5 + j * cardH * 0.25}" width="${cardW}" height="${cardH}" rx="${cardW * 0.06}" fill="#1a2420" stroke="#2a4030" stroke-width="${stroke}" opacity="${1 - j * 0.15}"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="55%" cy="50%" r="80%"><stop stop-color="#182420"/><stop offset="1" stop-color="#0a0f0c"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".65" numOctaves="2" seed="11"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .04 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${cols.join('\n')}
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

console.log('FreeCell art generated.');
