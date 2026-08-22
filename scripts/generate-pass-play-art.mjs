/**
 * Artwork packages for the six Pass & Play games.
 *
 * Usage: node scripts/generate-pass-play-art.mjs [slug ...]
 * With no arguments, regenerates all six packages.
 *
 * Like the existing per-game generators, this produces icon.svg plus
 * cover-square, cover-landscape, guide-header, and social-card images in
 * WebP and JPEG form. Motifs are programmatic vector compositions — no
 * gameplay screenshots (those are separate mounted-DOM captures).
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const GAMES = {
  'tic-tac-toe': {
    accent: '#60a5fa',
    highlight: '#b9d8ff',
    motif: (w, h, accent, highlight) => {
      const s = Math.min(w, h) * 0.62;
      const x0 = (w - s) / 2;
      const y0 = (h - s) / 2;
      const cell = s / 3;
      const grid = [1, 2]
        .map((i) => {
          const gx = x0 + i * cell;
          const gy = y0 + i * cell;
          return `<line x1="${gx}" y1="${y0}" x2="${gx}" y2="${y0 + s}" stroke="#5b6b60" stroke-width="${s / 90}" stroke-linecap="round"/><line x1="${x0}" y1="${gy}" x2="${x0 + s}" y2="${gy}" stroke="#5b6b60" stroke-width="${s / 90}" stroke-linecap="round"/>`;
        })
        .join('');
      const mark = (row, col, kind, color) => {
        const cx = x0 + col * cell + cell / 2;
        const cy = y0 + row * cell + cell / 2;
        const r = cell * 0.22;
        if (kind === 'x') {
          return `<path d="M${cx - r} ${cy - r} L${cx + r} ${cy + r} M${cx + r} ${cy - r} L${cx - r} ${cy + r}" stroke="${color}" stroke-width="${cell / 11}" stroke-linecap="round" fill="none"/>`;
        }
        return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="${cell / 11}" fill="none"/>`;
      };
      return `${grid}
        ${mark(0, 0, 'x', accent)}${mark(0, 1, 'o', highlight)}${mark(0, 2, 'x', accent)}
        ${mark(1, 0, 'o', highlight)}${mark(1, 1, 'x', accent)}${mark(1, 2, 'o', highlight)}
        ${mark(2, 0, 'x', accent)}${mark(2, 1, 'o', highlight)}${mark(2, 2, 'x', accent)}
        <line x1="${x0 + cell * 0.24}" y1="${y0 + 2 * cell + cell / 2}" x2="${x0 + 3 * cell - cell * 0.24}" y2="${y0 + 2 * cell + cell / 2}" stroke="#e8e3d8" stroke-width="${cell / 26}" stroke-linecap="round" stroke-dasharray="${cell / 9} ${cell / 7}"/>`;
    },
  },
  'dots-and-boxes': {
    accent: '#f472b6',
    highlight: '#ffd3ea',
    motif: (w, h, accent, highlight) => {
      const cols = 5;
      const rows = 4;
      const pitch = Math.min(w / (cols + 1.6), h / (rows + 1.6));
      const x0 = w / 2 - ((cols - 1) * pitch) / 2;
      const y0 = h / 2 - ((rows - 1) * pitch) / 2;
      const dot = (r, c) => `<circle cx="${x0 + c * pitch}" cy="${y0 + r * pitch}" r="${pitch / 16}" fill="#cfc9ba"/>`;
      let dots = '';
      let edges = '';
      let boxes = '';
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) dots += dot(r, c);
      }
      const hEdge = (r, c, color) =>
        `<line x1="${x0 + c * pitch}" y1="${y0 + r * pitch}" x2="${x0 + (c + 1) * pitch}" y2="${y0 + r * pitch}" stroke="${color}" stroke-width="${pitch / 13}" stroke-linecap="round"/>`;
      const vEdge = (r, c, color) =>
        `<line x1="${x0 + c * pitch}" y1="${y0 + r * pitch}" x2="${x0 + c * pitch}" y2="${y0 + (r + 1) * pitch}" stroke="${color}" stroke-width="${pitch / 13}" stroke-linecap="round"/>`;
      edges += hEdge(1, 1, accent) + hEdge(2, 1, accent) + vEdge(1, 1, accent) + vEdge(1, 2, accent);
      boxes += `<rect x="${x0 + 1 * pitch + pitch / 14}" y="${y0 + 1 * pitch + pitch / 14}" width="${pitch - pitch / 7}" height="${pitch - pitch / 7}" rx="${pitch / 12}" fill="${accent}" opacity=".22"/>`;
      edges += hEdge(2, 3, highlight) + hEdge(3, 3, highlight) + vEdge(2, 3, highlight) + vEdge(2, 4, highlight);
      boxes += `<rect x="${x0 + 3 * pitch + pitch / 14}" y="${y0 + 2 * pitch + pitch / 14}" width="${pitch - pitch / 7}" height="${pitch - pitch / 7}" rx="${pitch / 12}" fill="${highlight}" opacity=".2"/>`;
      return `${boxes}${edges}${dots}`;
    },
  },
  'four-in-a-row': {
    accent: '#a78bfa',
    highlight: '#ffd28a',
    motif: (w, h, accent, highlight) => {
      const cols = 7;
      const rows = 6;
      const disc = Math.min(w / (cols + 1.4), h / (rows + 1.4));
      const x0 = w / 2 - (cols * disc) / 2;
      const y0 = h / 2 - (rows * disc) / 2;
      const grid = `<rect x="${x0 - disc * 0.18}" y="${y0 - disc * 0.18}" width="${cols * disc + disc * 0.36}" height="${rows * disc + disc * 0.36}" rx="${disc * 0.5}" fill="#1b241f" stroke="#39443c" stroke-width="${disc / 22}"/>`;
      const filled = [
        [5, 2, accent],
        [4, 2, highlight],
        [3, 2, accent],
        [5, 3, highlight],
        [4, 3, accent],
        [2, 2, highlight],
        [5, 4, accent],
        [3, 3, accent],
      ];
      const discs = filled
        .map(([row, col, color]) => {
          const cx = x0 + col * disc + disc / 2;
          const cy = y0 + row * disc + disc / 2;
          return `<circle cx="${cx}" cy="${cy}" r="${disc * 0.38}" fill="${color}" opacity=".92"/><circle cx="${cx - disc * 0.1}" cy="${cy - disc * 0.12}" r="${disc * 0.12}" fill="#ffffff" opacity=".14"/>`;
        })
        .join('');
      return `${grid}${discs}`;
    },
  },
  reversi: {
    accent: '#2dd4bf',
    highlight: '#e8e3d8',
    motif: (w, h, accent, highlight) => {
      const n = 8;
      const cell = Math.min(w / (n + 1.6), h / (n + 1.6));
      const s = n * cell;
      const x0 = w / 2 - s / 2;
      const y0 = h / 2 - s / 2;
      let board = `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" rx="${cell / 3}" fill="#1d2a24" stroke="#39443c" stroke-width="${cell / 16}"/>`;
      for (let r = 0; r < n; r += 1) {
        for (let c = 0; c < n; c += 1) {
          if ((r + c) % 2 === 0) {
            board += `<rect x="${x0 + c * cell}" y="${y0 + r * cell}" width="${cell}" height="${cell}" fill="#223129" opacity=".7"/>`;
          }
        }
      }
      const disc = (r, c, color) => {
        const cx = x0 + c * cell + cell / 2;
        const cy = y0 + r * cell + cell / 2;
        return `<circle cx="${cx}" cy="${cy}" r="${cell * 0.38}" fill="${color}" stroke="#0d120f" stroke-width="${cell / 30}"/>`;
      };
      const discs =
        disc(3, 3, accent) +
        disc(3, 4, highlight) +
        disc(4, 3, highlight) +
        disc(4, 4, accent) +
        disc(2, 3, accent) +
        disc(5, 4, highlight) +
        disc(2, 2, highlight);
      const ring = `<circle cx="${x0 + 5 * cell + cell / 2}" cy="${y0 + 5 * cell + cell / 2}" r="${cell * 0.34}" fill="none" stroke="${accent}" stroke-width="${cell / 14}" stroke-dasharray="${cell / 6} ${cell / 6}"/>`;
      return `${board}${discs}${ring}`;
    },
  },
  'last-token': {
    accent: '#fb923c',
    highlight: '#ffe0bd',
    motif: (w, h, accent, highlight) => {
      const piles = [3, 2, 5];
      const token = Math.min(w / 12, h / 7);
      const gap = token * 2.2;
      const totalW = 2 * gap + token;
      const x0 = w / 2 - totalW / 2;
      const baseY = h * 0.66;
      let art = '';
      piles.forEach((count, pile) => {
        const px = x0 + pile * gap;
        art += `<ellipse cx="${px}" cy="${baseY + token * 0.75}" rx="${token * 1.35}" ry="${token * 0.22}" fill="#000" opacity=".28"/>`;
        for (let i = 0; i < count; i += 1) {
          const cx = px + (i % 2 === 0 ? 0 : token * 0.16);
          const cy = baseY - Math.floor(i / 2) * token * 0.95;
          const color = pile === 1 && i >= count - 1 ? highlight : accent;
          art += `<circle cx="${cx}" cy="${cy}" r="${token * 0.52}" fill="${color}" opacity=".92"/><circle cx="${cx - token * 0.14}" cy="${cy - token * 0.16}" r="${token * 0.16}" fill="#fff" opacity=".16"/>`;
        }
      });
      return art;
    },
  },
  'pass-the-picture': {
    accent: '#facc15',
    highlight: '#fff3c4',
    motif: (w, h, accent, highlight) => {
      const s = Math.min(w, h) * 0.72;
      const x0 = (w - s) / 2;
      const y0 = (h - s) / 2;
      const palette = ['#f87171', '#facc15', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#e8e3d8', '#2dd4bf'];
      const swatch = palette
        .map((color, i) => {
          const cx = x0 + s * (0.14 + i * 0.105);
          const cy = y0 + s * 0.86;
          return `<circle cx="${cx}" cy="${cy}" r="${s * 0.032}" fill="${color}"/>`;
        })
        .join('');
      return `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" rx="${s / 16}" fill="#f6f2e8" opacity=".95"/>
        <path d="M${x0 + s * 0.2} ${y0 + s * 0.32} q${s * 0.15} ${-s * 0.18} ${s * 0.3} 0" stroke="#f87171" stroke-width="${s / 55}" fill="none" stroke-linecap="round"/>
        <circle cx="${x0 + s * 0.35}" cy="${y0 + s * 0.28}" r="${s * 0.02}" fill="#233"/>
        <circle cx="${x0 + s * 0.65}" cy="${y0 + s * 0.28}" r="${s * 0.02}" fill="#233"/>
        <path d="M${x0 + s * 0.3} ${y0 + s * 0.52} q${s * 0.2} ${s * 0.22} ${s * 0.4} 0" stroke="#60a5fa" stroke-width="${s / 55}" fill="none" stroke-linecap="round"/>
        <path d="M${x0 + s * 0.24} ${y0 + s * 0.68} q${s * 0.26} ${-s * 0.1} ${s * 0.5} ${s * 0.02}" stroke="#34d399" stroke-width="${s / 60}" fill="none" stroke-linecap="round"/>
        ${swatch}`;
    },
  },
};

const frame = (w, h, accent, inner) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="bg" cx="72%" cy="42%" r="80%">
      <stop stop-color="${accent}" stop-opacity=".16"/>
      <stop offset=".5" stop-color="#171f1b"/>
      <stop offset="1" stop-color="#101210"/>
    </radialGradient>
    <filter id="grain"><feTurbulence baseFrequency=".75" seed="47"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .025 0"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${w * 0.82}" cy="${h * 0.24}" r="${Math.min(w, h) * 0.3}" fill="${accent}" opacity=".05"/>
  ${inner}
  <rect width="${w}" height="${h}" filter="url(#grain)"/>
</svg>`;

async function generate(slug) {
  const game = GAMES[slug];
  if (!game) throw new Error(`Unknown Pass & Play slug: ${slug}`);
  const dir = fileURLToPath(new URL(`../public/game-art/${slug}/`, import.meta.url));
  await mkdir(dir, { recursive: true });
  const art = (w, h) => frame(w, h, game.accent, game.motif(w, h, game.accent, game.highlight));
  const jobs = [
    ['cover-square', 800, 800],
    ['cover-landscape', 1280, 720],
    ['guide-header', 1280, 640],
    ['social-card', 1200, 630],
  ];
  await writeFile(new URL('source.svg', `file://${dir}`), art(1280, 720));
  for (const [name, w, h] of jobs) {
    const input = Buffer.from(art(w, h));
    await sharp(input).webp({ quality: 78, effort: 6 }).toFile(`${dir}${name}.webp`);
    await sharp(input).jpeg({ quality: 80, mozjpeg: true }).toFile(`${dir}${name}.jpg`);
  }
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/><g transform="translate(18 18)">${game.motif(60, 60, game.accent, game.highlight)}</g></svg>`;
  await writeFile(new URL('icon.svg', `file://${dir}`), icon);
  process.stdout.write(`pass-play art: ${slug}\n`);
}

const slugs = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
await (slugs.length ? Promise.all(slugs.map(generate)) : Promise.all(Object.keys(GAMES).map(generate)));
