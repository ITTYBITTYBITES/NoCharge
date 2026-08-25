import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/tile-garden/', import.meta.url));
await mkdir(out, { recursive: true });

// Vector plant motifs for the four tiers. Emoji in <text> rasterized as
// literal code points (U+1F33F / U+1F33C) — the post-PR #25 audit found
// "01F 33F" strings on the shipped covers — so the tiles are drawn instead.
function plant(tier, cx, cy, m) {
  if (tier === 1) {
    return `<path d="M${cx} ${cy + m * 0.55} L${cx} ${cy - m * 0.05}" stroke="#7cc28f" stroke-width="${m * 0.09}" stroke-linecap="round"/>
      <ellipse cx="${cx - m * 0.26}" cy="${cy - m * 0.02}" rx="${m * 0.24}" ry="${m * 0.12}" fill="#3f9e63" transform="rotate(-32 ${cx - m * 0.26} ${cy - m * 0.02})"/>
      <ellipse cx="${cx + m * 0.26}" cy="${cy - m * 0.02}" rx="${m * 0.24}" ry="${m * 0.12}" fill="#5cb87a" transform="rotate(32 ${cx + m * 0.26} ${cy - m * 0.02})"/>`;
  }
  if (tier === 2) {
    return `<path d="M${cx} ${cy + m * 0.55} L${cx} ${cy - m * 0.4}" stroke="#7cc28f" stroke-width="${m * 0.08}" stroke-linecap="round"/>
      <path d="M${cx} ${cy + m * 0.2} L${cx - m * 0.3} ${cy + m * 0.05}" stroke="#7cc28f" stroke-width="${m * 0.06}" stroke-linecap="round"/>
      <path d="M${cx} ${cy} L${cx + m * 0.3} ${cy - m * 0.12}" stroke="#7cc28f" stroke-width="${m * 0.06}" stroke-linecap="round"/>
      <ellipse cx="${cx}" cy="${cy - m * 0.48}" rx="${m * 0.14}" ry="${m * 0.22}" fill="#5cb87a"/>
      <ellipse cx="${cx - m * 0.34}" cy="${cy + m * 0.02}" rx="${m * 0.16}" ry="${m * 0.1}" fill="#3f9e63" transform="rotate(-24 ${cx - m * 0.34} ${cy + m * 0.02})"/>
      <ellipse cx="${cx + m * 0.34}" cy="${cy - m * 0.15}" rx="${m * 0.16}" ry="${m * 0.1}" fill="#5cb87a" transform="rotate(24 ${cx + m * 0.34} ${cy - m * 0.15})"/>`;
  }
  if (tier === 3) {
    let petals = '';
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      petals += `<ellipse cx="${cx + Math.cos(a) * m * 0.3}" cy="${cy + Math.sin(a) * m * 0.3}" rx="${m * 0.16}" ry="${m * 0.1}" fill="#e8e3d8" transform="rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * m * 0.3} ${cy + Math.sin(a) * m * 0.3})"/>`;
    }
    return `${petals}<circle cx="${cx}" cy="${cy}" r="${m * 0.16}" fill="#f5c542"/>`;
  }
  let petals = '';
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    petals += `<circle cx="${cx + Math.cos(a) * m * 0.3}" cy="${cy + Math.sin(a) * m * 0.3}" r="${m * 0.17}" fill="#e8a3b8"/>`;
  }
  return `${petals}<circle cx="${cx}" cy="${cy}" r="${m * 0.15}" fill="#f5c542"/>`;
}

function art(w, h, mode = 'landscape') {
  const square = mode === 'square';
  const cx = w * 0.5;
  const cy = h * 0.5;
  const cellSize = (square ? w * 0.5 : h * 0.5) / 4;
  const gx = cx - cellSize * 2;
  const gy = cy - cellSize * 2;
  const stroke = Math.max(1, w / 600);

  // A board showing every growth tier, like a mid-game in the app.
  const tiers = [
    [0, 0, 1, 0],
    [0, 1, 1, 2],
    [0, 0, 1, 3],
    [0, 2, 4, 0],
  ];

  const tierColors = ['#1a2420', '#1e3028', '#254030', '#12b66a'];

  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tier = tiers[r][c];
      const fill = tierColors[tier];
      cells.push(`<rect x="${gx + c * cellSize + 2}" y="${gy + r * cellSize + 2}" width="${cellSize - 4}" height="${cellSize - 4}" rx="${cellSize * 0.1}" fill="${fill}" stroke="#2a3530" stroke-width="${stroke}"/>`);
      if (tier > 0) {
        cells.push(plant(tier, gx + c * cellSize + cellSize / 2, gy + r * cellSize + cellSize / 2, cellSize * 0.62));
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
];

for (const [name, w, h, mode] of jobs) {
  await sharp(Buffer.from(art(w, h, mode))).webp({ quality: 76, effort: 6 }).toFile(`${out}${name}`);
  await sharp(Buffer.from(art(w, h, mode))).jpeg({ quality: 76 }).toFile(`${out}${name.replace('.webp', '.jpg')}`);
}

// Canonical vector source lives outside public/ (never shipped); the CI
// art-drift step in deploy.yml regenerates it and fails on any drift.
const srcOut = fileURLToPath(new URL('./art-sources/tile-garden/', import.meta.url));
await mkdir(srcOut, { recursive: true });
await writeFile(srcOut + 'source.svg', art(1280, 720, 'landscape'));

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/><g fill="#1e3028" stroke="#2a3530" stroke-width="1.5"><rect x="20" y="20" width="26" height="26" rx="5"/><rect x="50" y="20" width="26" height="26" rx="5"/><rect x="20" y="50" width="26" height="26" rx="5"/><rect x="50" y="50" width="26" height="26" rx="5"/></g>${plant(1, 33, 33, 14)}${plant(2, 63, 33, 14)}${plant(3, 33, 63, 14)}${plant(4, 63, 63, 14)}</svg>`;
await writeFile(new URL('icon.svg', `file://${out}`), icon);

console.log('Tile Garden art generated.');
