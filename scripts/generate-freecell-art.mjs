import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

const out = fileURLToPath(new URL('../public/game-art/freecell/', import.meta.url));
await mkdir(out, { recursive: true });

function art(w, h) {
  // Eight tableau columns plus a free-cell / foundation row, all centred
  // and sized to fit the canvas (the post-PR #25 audit found the old
  // square frame clipped at both edges and the landscape frame showing
  // empty outlines).
  const cx = w / 2;
  const cardW = Math.min(w * 0.092, h * 0.239);
  const cardH = cardW * 1.4;
  const gap = cardW * 0.15;
  const tableW = 8 * cardW + 7 * gap;
  const small = cardW * 0.8;
  const rowGap = cardW * 0.35;
  const stackH = cardH + 3 * cardH * 0.25; // 4-card fan
  const totalH = small + rowGap + stackH;
  const topY = (h - totalH) / 2;
  const tableTop = topY + small + rowGap;
  const stroke = Math.max(1.5, w / 500);

  const parts = [];
  // Free cells (left) and foundations (right): four outlined squares each.
  for (let i = 0; i < 4; i += 1) {
    const fx = cx - tableW / 2 + i * (small + gap);
    const fx2 = cx + tableW / 2 - small - i * (small + gap);
    parts.push(`<rect x="${fx}" y="${topY}" width="${small}" height="${small}" rx="${small * 0.1}" fill="#161d18" stroke="#3b4f43" stroke-width="${stroke}"/>`);
    parts.push(`<rect x="${fx2}" y="${topY}" width="${small}" height="${small}" rx="${small * 0.1}" fill="#161d18" stroke="#3b4f43" stroke-width="${stroke}"/>`);
  }
  // Tableau: 8 columns, dealt fan of 4 (first half) / 3 (second half) cards.
  const ranks = [
    ['A', '#e07171'],
    ['2', '#d8e0dc'],
    ['3', '#e07171'],
    ['K', '#d8e0dc'],
    ['Q', '#e07171'],
    ['J', '#d8e0dc'],
    ['10', '#e07171'],
    ['4', '#d8e0dc'],
  ];
  for (let i = 0; i < 8; i += 1) {
    const x = cx - tableW / 2 + i * (cardW + gap);
    const stackCount = i < 4 ? 4 : 3;
    for (let j = 0; j < stackCount; j += 1) {
      const y = tableTop + j * cardH * 0.25;
      const isTop = j === stackCount - 1;
      parts.push(`<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="${cardW * 0.06}" fill="${isTop ? '#28352c' : '#202a23'}" stroke="${isTop ? '#3b4f43' : '#31443a'}" stroke-width="${stroke}"/>`);
      if (isTop) {
        const [label, color] = ranks[i];
        parts.push(`<text x="${x + cardW * 0.18}" y="${y + cardH * 0.3}" fill="${color}" font-size="${cardW * 0.34}" font-family="serif" font-weight="700">${label}</text>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="55%" cy="50%" r="80%"><stop stop-color="#182420"/><stop offset="1" stop-color="#0a0f0c"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".65" numOctaves="2" seed="11"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .04 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${parts.join('\n')}
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
  await sharp(Buffer.from(art(w, h))).jpeg({ quality: 76 }).toFile(`${out}${name.replace('.webp', '.jpg')}`);
}

// Canonical vector source lives outside public/ (never shipped); the CI
// art-drift step in deploy.yml regenerates it and fails on any drift.
const srcOut = fileURLToPath(new URL('./art-sources/freecell/', import.meta.url));
await mkdir(srcOut, { recursive: true });
await writeFile(srcOut + 'source.svg', art(1280, 720));

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/><g fill="#161d18" stroke="#3b4f43" stroke-width="2"><rect x="16" y="18" width="13" height="13" rx="2.5"/><rect x="33" y="18" width="13" height="13" rx="2.5"/><rect x="50" y="18" width="13" height="13" rx="2.5"/><rect x="67" y="18" width="13" height="13" rx="2.5"/></g><g><rect x="22" y="44" width="26" height="36" rx="4" fill="#202a23" stroke="#31443a" stroke-width="2" transform="rotate(-8 35 62)"/><rect x="46" y="40" width="26" height="36" rx="4" fill="#28352c" stroke="#3b4f43" stroke-width="2" transform="rotate(7 59 58)"/><text x="59" y="58" fill="#e07171" font-size="13" font-family="serif" font-weight="700" text-anchor="middle">A</text></g></svg>`;
await writeFile(new URL('icon.svg', `file://${out}`), icon);

console.log('FreeCell art generated.');
