import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/klondike/', import.meta.url));
await mkdir(out, { recursive: true });

function art(w, h) {
  // Fan is centred in every frame. The end cards rotate, so their corners
  // extend cardH*0.563 past the card centres; shifting the stack up by
  // cardH/2 puts the rotated bounding box symmetric in the canvas (the
  // post-PR #25 audit found the 4th card clipped at the bottom of the
  // landscape and social frames, and the stack sat low in the square).
  const cx = w / 2;
  const cardW = Math.min(w * 0.16, (w * 0.8) / 4, (h * 0.8) / 2.24);
  const cardH = cardW * 1.4;
  const cy = h / 2 - cardH / 2;
  const stroke = Math.max(2, w / 400);

  const cards = [];
  const offsets = [
    { x: -cardW * 1.5, y: -cardH * 0.3, r: -12 },
    { x: -cardW * 0.5, y: -cardH * 0.1, r: -4 },
    { x: cardW * 0.5, y: cardH * 0.1, r: 4 },
    { x: cardW * 1.5, y: cardH * 0.3, r: 12 },
  ];

  for (const o of offsets) {
    cards.push(`<g transform="rotate(${o.r} ${cx + o.x} ${cy + o.y + cardH / 2})">
      <rect x="${cx + o.x - cardW / 2}" y="${cy + o.y}" width="${cardW}" height="${cardH}" rx="${cardW * 0.08}" fill="#1a2420" stroke="#2a4030" stroke-width="${stroke}"/>
      <text x="${cx + o.x - cardW * 0.3}" y="${cy + o.y + cardH * 0.3}" fill="#e85d5d" font-size="${cardW * 0.35}" font-family="serif">♥</text>
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
  ['cover-square.webp', 800, 800],
  ['cover-landscape.webp', 1280, 720],
  ['social-card.webp', 1200, 630],
];

for (const [name, w, h] of jobs) {
  await sharp(Buffer.from(art(w, h))).webp({ quality: 76, effort: 6 }).toFile(`${out}${name}`);
  // JPEG fallback
  await sharp(Buffer.from(art(w, h))).jpeg({ quality: 76 }).toFile(`${out}${name.replace('.webp', '.jpg')}`);
}

// Canonical vector source lives outside public/ (never shipped); the CI
// art-drift step in deploy.yml regenerates it and fails on any drift.
const srcOut = fileURLToPath(new URL('./art-sources/klondike/', import.meta.url));
await mkdir(srcOut, { recursive: true });
await writeFile(srcOut + 'source.svg', art(1280, 720));

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/><g transform="rotate(-10 34 52)"><rect x="20" y="30" width="28" height="40" rx="5" fill="#1a2420" stroke="#2a4030" stroke-width="2.5"/></g><g transform="rotate(8 60 46)"><rect x="46" y="26" width="28" height="40" rx="5" fill="#1e2a22" stroke="#31503a" stroke-width="2.5"/><text x="60" y="53" text-anchor="middle" fill="#e85d5d" font-size="18" font-family="serif">♥</text></g></svg>`;
await writeFile(new URL('icon.svg', `file://${out}`), icon);

console.log('Klondike art generated.');
