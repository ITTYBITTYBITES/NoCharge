import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../public/game-art/beacon-lattice/', import.meta.url));

function boardSvg(width, height, mobile) {
  const cell = mobile ? 92 : 88;
  const originX = mobile ? 40 : 220;
  const originY = mobile ? 280 : 160;
  const plus = new Set(['2,1', '1,2', '2,2', '3,2', '2,3']);
  let cells = '';
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      const key = `${x},${y}`;
      const required = plus.has(key);
      const fill = required ? '#172420' : '#171917';
      const label = required ? '1 · Exact' : '—';
      const glyph = key === '2,2' ? '+' : '';
      cells += `<rect x="${originX + x * (cell + 6)}" y="${originY + y * (cell + 6)}" width="${cell}" height="${cell}" rx="10" fill="${fill}" stroke="${required ? '#2dd4bf' : '#2a2a2a'}"/>`;
      if (glyph) {
        cells += `<text x="${originX + x * (cell + 6) + cell / 2}" y="${originY + y * (cell + 6) + cell / 2 - 6}" text-anchor="middle" fill="#2dd4bf" font-family="system-ui" font-size="22" font-weight="700">${glyph}</text>`;
      }
      cells += `<text x="${originX + x * (cell + 6) + cell / 2}" y="${originY + y * (cell + 6) + cell / 2 + 16}" text-anchor="middle" fill="#e0e0e0" font-family="system-ui" font-size="12">${label}</text>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#121212"/>
    <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="16" fill="#1c1c1c"/>
    <text x="48" y="70" fill="#e0e0e0" font-family="system-ui" font-size="28" font-weight="700">Beacon Lattice</text>
    <text x="48" y="104" fill="#9a9a9a" font-family="system-ui" font-size="16">First plus · Beacons 1 · Par 1</text>
    <rect x="48" y="122" width="160" height="36" rx="18" fill="#16332d" stroke="#2dd4bf"/>
    <text x="128" y="145" text-anchor="middle" fill="#e0e0e0" font-family="system-ui" font-size="14">1 · Cross + (0)</text>
    ${cells}
  </svg>`;
}

await sharp(Buffer.from(boardSvg(1440, 900, false))).webp({ quality: 80 }).toFile(`${dir}screenshot-desktop.webp`);
await sharp(Buffer.from(boardSvg(720, 1280, true))).webp({ quality: 80 }).toFile(`${dir}screenshot-mobile.webp`);
console.log('Wrote Beacon Lattice gameplay screenshots from the First plus solved state.');
