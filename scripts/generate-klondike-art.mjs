import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/klondike/', import.meta.url));
await mkdir(out, { recursive: true });

function art(w, h, mode = 'landscape') {
  const square = mode === 'square';
  const cx = square ? w * 0.5 : w * 0.6;
  const cy = h * 0.5;
  const cardW = square ? w * 0.22 : h * 0.18;
  const cardH = cardW * 1.4;
  const stroke = Math.max(2, w / 400);

  const cards = [];
  const offsets = [
    { x: -cardW * 1.5, y: -cardH * 0.3, r: -12 },
    { x: -cardW * 0.5, y: -cardH * 0.1, r: -4 },
    { x: cardW * 0.5, y: cardH * 0.1, r: 4 },
    { x: cardW * 1.5, y: cardH * 0.3, r: 12 },
  ];

  for (const o of offsets) {
    cards.push(`<g transform="rotate(${o.r} ${cx + o.x + cardW / 2} ${cy + o.y + cardH / 2})">
      <rect x="${cx + o.x}" y="${cy + o.y}" width="${cardW}" height="${cardH}" rx="${cardW * 0.08}" fill="#1a2420" stroke="#2a4030" stroke-width="${stroke}"/>
      <text x="${cx + o.x + cardW * 0.2}" y="${cy + o.y + cardH * 0.3}" fill="#e85d5d" font-size="${cardW * 0.35}" font-family="serif">♥</text>
    </g>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="60%" cy="45%" r="80%"><stop stop-color="#1a2820"/><stop offset="1" stop-color="#0a0f0c"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".7" numOctaves="2" seed="7"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .04 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${cards.join('\n')}
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
  // JPEG fallback
  await sharp(Buffer.from(art(w, h, mode))).jpeg({ quality: 76 }).toFile(`${out}${name.replace('.webp', '.jpg')}`);
}

console.log('Klondike art generated.');
