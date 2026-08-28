/**
 * Artwork generator for new NoCharge games.
 *
 * Usage: node scripts/generate-game-art.mjs <slug>
 *
 * Produces cover-square (800), cover-landscape (1280×720), guide-header
 * (1280×640), social-card (1200×630) in WebP + JPEG, an icon.svg, and the
 * canonical SVG source under scripts/art-sources/<slug>/source.svg.
 *
 * Each motif is an editorial illustration of the actual game in the Quiet
 * Arcade palette — no placeholder title cards.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const slug = process.argv[2];
if (!slug) throw new Error('usage: node scripts/generate-game-art.mjs <slug>');

const dir = path.join('public', 'game-art', slug);
fs.mkdirSync(dir, { recursive: true });

const ACCENTS = {
  minesweeper: '#38bdf8',
  hangman: '#fbbf24',
  'lights-out': '#a78bfa',
  simon: '#f472b6',
  'sudoku-9x9': '#60a5fa',
  'spider-solitaire': '#34d399',
  'word-loom': '#f97316',
  'crossword-mini': '#2dd4bf',
  gomoku: '#f59e0b',
  'nine-mens-morris': '#f87171',
  checkers: '#fbbf24',
  anagrams: '#22d3ee',
  pyramid: '#f472b6',
  golf: '#4ade80',
  tripeaks: '#fb923c',
  yukon: '#a3e635',
  battleship: '#60a5fa',
  yahtzee: '#f472b6',
  dominoes: '#cbd5e1',
  chess: '#e2e8f0',
  mahjong: '#34d399',
} ;
const accent = ACCENTS[slug] ?? '#0f9d58';
const ink = '#cfd8d3';

function frame(w, h, content, seed) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="70%" cy="42%" r="80%"><stop stop-color="${accent}" stop-opacity=".14"/><stop offset=".5" stop-color="#10181b"/><stop offset="1" stop-color="#0a0e11"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".7" numOctaves="2" seed="${seed ?? 53}"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .04 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${content}
    <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".5"/>
  </svg>`;
}

function minesweeperContent(w, h) {
  const n = 9;
  const cell = Math.min(w, h) * 0.56 / n;
  const gx = w / 2 - (n * cell) / 2;
  const gy = h / 2 - (n * cell) / 2;
  const cells = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const x = gx + c * cell;
      const y = gy + r * cell;
      const revealed = (r === 0 && c < 4) || (r === 1 && c < 4) || (r === 2 && c === 0);
      const flag = r === 5 && c === 7;
      const mine = r === 8 && c === 8;
      cells.push(`<rect x="${x + 1}" y="${y + 1}" width="${cell - 2}" height="${cell - 2}" rx="${cell * 0.1}" fill="${revealed || mine ? '#1a2320' : '#242f2b'}" stroke="#38453f" stroke-width="1"/>`);
      if (flag) cells.push(`<text x="${x + cell / 2}" y="${y + cell / 2 + cell * 0.18}" text-anchor="middle" font-family="system-ui" font-size="${cell * 0.5}" font-weight="800" fill="${accent}">⚑</text>`);
      if (mine) cells.push(`<text x="${x + cell / 2}" y="${y + cell / 2 + cell * 0.2}" text-anchor="middle" font-family="system-ui" font-size="${cell * 0.62}" font-weight="800" fill="#ff8f8f">✱</text>`);
      if (revealed && c < 4 && r < 2) cells.push(`<text x="${x + cell / 2}" y="${y + cell / 2 + cell * 0.18}" text-anchor="middle" font-family="system-ui" font-size="${cell * 0.44}" font-weight="800" fill="#9fb4ac">${(r + c) % 3 + 1}</text>`);
    }
  }
  return frame(w, h, cells.join('\n'), 17);
}

function hangmanContent(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const boxes = ['Q', 'U', 'I', 'E', 'T'].map((letter, index) => {
    const x = cx - 250 + index * 110;
    const done = index < 3;
    return `<rect x="${x}" y="${cy + 90}" width="84" height="110" rx="8" fill="${done ? accent : '#1c2422'}" stroke="#38453f" stroke-width="2"/>${done ? `<text x="${x + 42}" y="${cy + 176}" text-anchor="middle" font-family="system-ui" font-size="64" font-weight="800" fill="#0b1512">${letter}</text>` : ''}`;
  }).join('\n');
  const gallows = `<path d="M ${cx - 240} ${cy - 130} L ${cx - 240} ${cy - 180} L ${cx - 40} ${cy - 180} L ${cx - 40} ${cy - 150}" fill="none" stroke="#6b7a74" stroke-width="7" stroke-linecap="round"/><circle cx="${cx - 40}" cy="${cy - 112}" r="34" fill="none" stroke="#6b7a74" stroke-width="7"/><path d="M ${cx - 40} ${cy - 78} L ${cx - 40} ${cy + 20} M ${cx - 40} ${cy - 30} L ${cx - 90} ${cy + 40} M ${cx - 40} ${cy - 30} L ${cx + 10} ${cy + 40} M ${cx - 40} ${cy + 20} L ${cx - 80} ${cy + 110} M ${cx - 40} ${cy + 20} L ${cx} ${cy + 110}" fill="none" stroke="#6b7a74" stroke-width="7" stroke-linecap="round"/>`;
  return frame(w, h, `${boxes}\n${gallows}\n<text x="${cx}" y="${cy + 300}" text-anchor="middle" font-family="system-ui" font-size="30" font-weight="700" fill="${ink}">Theme: quiet words</text>`, 29);
}

function lightsOutContent(w, h) {
  const n = 5;
  const cell = Math.min(w, h) * 0.56 / n;
  const gx = w / 2 - (n * cell) / 2;
  const gy = h / 2 - (n * cell) / 2;
  const on = new Set(['0,0', '1,1', '2,2', '3,3', '4,4', '0,2', '2,0', '2,4', '4,2']);
  const cells = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const lit = on.has(`${r},${c}`);
      cells.push(`<circle cx="${gx + c * cell + cell / 2}" cy="${gy + r * cell + cell / 2}" r="${cell * 0.36}" fill="${lit ? accent : '#1b2422'}" stroke="#38453f" stroke-width="2"/>${lit ? `<circle cx="${gx + c * cell + cell / 2}" cy="${gy + r * cell + cell / 2}" r="${cell * 0.14}" fill="#0b1512"/>` : ''}`);
    }
  }
  return frame(w, h, cells.join('\n'), 41);
}

function simonContent(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.36;
  const colors = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399'];
  const seq = [0, 1, 2, 3, 1];
  const pads = seq.map((colorIndex, index) => {
    const angle = (index / seq.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius * 0.62;
    const y = cy + Math.sin(angle) * radius * 0.62;
    const active = index === 2;
    return `<circle cx="${x}" cy="${y}" r="${radius * 0.26}" fill="${active ? colors[colorIndex] : '#1c2422'}" stroke="${colors[colorIndex]}" stroke-width="3"/>`;
  }).join('\n');
  const center = `<circle cx="${cx}" cy="${cy}" r="${radius * 0.3}" fill="#12181b" stroke="#38453f" stroke-width="3"/><text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="system-ui" font-size="${radius * 0.16}" font-weight="800" fill="${ink}">pattern</text>`;
  return frame(w, h, `${pads}\n${center}`, 61);
}

function sudoku9Content(w, h) {
  const n = 9;
  const cell = Math.min(w, h) * 0.58 / n;
  const gx = w / 2 - (n * cell) / 2;
  const gy = h / 2 - (n * cell) / 2;
  const cells = [];
  const given = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const x = gx + c * cell;
      const y = gy + r * cell;
      const border = `stroke="${c % 3 === 0 ? '#4a5852' : '#2a3530'}" stroke-width="${c % 3 === 0 ? 2 : 1}"`;
      cells.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#141b19" ${border}/>`);
      const value = given[r]?.[c];
      if (value) cells.push(`<text x="${x + cell / 2}" y="${y + cell / 2 + cell * 0.17}" text-anchor="middle" font-family="system-ui" font-size="${cell * 0.46}" font-weight="700" fill="${ink}">${value}</text>`);
    }
  }
  return frame(w, h, cells.join('\n'), 71);
}

function wordLoomContent(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  let tiles = '';
  const word = 'LOOM';
  for (let i = 0; i < 8; i += 1) {
    const x = cx - 280 + i * 80;
    const filled = i < word.length;
    tiles += `<rect x="${x}" y="${cy - 70}" width="68" height="82" rx="8" fill="${filled ? '#242f2b' : '#151c1a'}" stroke="${filled ? accent : '#38453f'}" stroke-width="2"/>${filled ? `<text x="${x + 34}" y="${cy - 16}" text-anchor="middle" font-family="system-ui" font-size="52" font-weight="800" fill="${accent}">${word[i]}</text>` : ''}`;
  }
  const feedback = [['L', 'correct'], ['O', 'present'], ['O', 'absent'], ['M', 'present']];
  const row = feedback.map(([letter, state], index) => {
    const colors = { correct: '#34d399', present: '#fbbf24', absent: '#3a4440' };
    const x = cx - 280 + index * 80;
    return `<rect x="${x}" y="${cy + 60}" width="68" height="82" rx="8" fill="${colors[state]}" stroke="#38453f" stroke-width="2"/><text x="${x + 34}" y="${cy + 114}" text-anchor="middle" font-family="system-ui" font-size="52" font-weight="800" fill="${state === 'absent' ? '#0b1512' : '#0b1512'}">${letter}</text>`;
  }).join('\n');
  return frame(w, h, `${tiles}\n${row}`, 83);
}

function crosswordMiniContent(w, h) {
  const n = 5;
  const cell = Math.min(w, h) * 0.5 / n;
  const gx = w / 2 - (n * cell) / 2;
  const gy = h / 2 - (n * cell) / 2;
  const cells = [];
  const open = new Set(['0,0', '0,1', '0,2', '1,0', '1,1', '2,0', '2,1', '3,0', '3,1', '3,2', '4,0', '4,1', '4,2']);
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const x = gx + c * cell;
      const y = gy + r * cell;
      const isOpen = open.has(`${r},${c}`);
      cells.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${isOpen ? '#18211e' : '#0d1210'}" stroke="#38453f" stroke-width="1"/>`);
      if (isOpen && r === 0) cells.push(`<text x="${x + cell / 2}" y="${y + cell / 2 + cell * 0.16}" text-anchor="middle" font-family="system-ui" font-size="${cell * 0.44}" font-weight="800" fill="${accent}">${'QUIET'[c]}</text>`);
      if (isOpen && r === 1 && c === 0) cells.push(`<text x="${x + cell / 2}" y="${y + cell / 2 + cell * 0.16}" text-anchor="middle" font-family="system-ui" font-size="${cell * 0.44}" font-weight="800" fill="#9fb4ac">E</text>`);
    }
  }
  const clue = `<text x="${gx}" y="${gy - 34}" font-family="system-ui" font-size="30" font-weight="700" fill="${ink}">1 Across: peaceful</text>`;
  return frame(w, h, `${cells.join('\n')}\n${clue}`, 97);
}

function gomokuContent(w, h) {
  const n = 15;
  const cell = Math.min(w, h) * 0.56 / n;
  const gx = w / 2 - (n * cell) / 2;
  const gy = h / 2 - (n * cell) / 2;
  let lines = '';
  for (let i = 0; i < n; i += 1) lines += `<line x1="${gx}" y1="${gy + i * cell}" x2="${gx + (n - 1) * cell}" y2="${gy + i * cell}" stroke="#38453f" stroke-width="1"/>`;
  for (let i = 0; i < n; i += 1) lines += `<line x1="${gx + i * cell}" y1="${gy}" x2="${gx + i * cell}" y2="${gy + (n - 1) * cell}" stroke="#38453f" stroke-width="1"/>`;
  const stones = [];
  const black = [[7, 7], [6, 6], [8, 6], [7, 5]];
  const white = [[6, 8], [8, 8], [7, 9]];
  for (const [r, c] of black) stones.push(`<circle cx="${gx + c * cell}" cy="${gy + r * cell}" r="${cell * 0.42}" fill="#1c2422" stroke="#6b7a74" stroke-width="1.5"/>`);
  for (const [r, c] of white) stones.push(`<circle cx="${gx + c * cell}" cy="${gy + r * cell}" r="${cell * 0.42}" fill="#e8f0ec" stroke="#9fb4ac" stroke-width="1.5"/>`);
  return frame(w, h, `${lines}\n${stones.join('\n')}`, 101);
}

function nineMensMorrisContent(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const sizes = [0.42, 0.28, 0.14];
  let lines = '';
  for (const size of sizes) lines += `<rect x="${cx - size * Math.min(w, h)}" y="${cy - size * Math.min(w, h)}" width="${size * 2 * Math.min(w, h)}" height="${size * 2 * Math.min(w, h)}" fill="none" stroke="#38453f" stroke-width="2"/>`;
  lines += `<line x1="${cx - sizes[0] * Math.min(w, h)}" y1="${cy - sizes[0] * Math.min(w, h)}" x2="${cx - sizes[2] * Math.min(w, h)}" y2="${cy - sizes[2] * Math.min(w, h)}" stroke="#38453f" stroke-width="2"/>`;
  lines += `<line x1="${cx + sizes[2] * Math.min(w, h)}" y1="${cy - sizes[2] * Math.min(w, h)}" x2="${cx + sizes[0] * Math.min(w, h)}" y2="${cy - sizes[0] * Math.min(w, h)}" stroke="#38453f" stroke-width="2"/>`;
  lines += `<line x1="${cx - sizes[0] * Math.min(w, h)}" y1="${cy + sizes[0] * Math.min(w, h)}" x2="${cx - sizes[2] * Math.min(w, h)}" y2="${cy + sizes[2] * Math.min(w, h)}" stroke="#38453f" stroke-width="2"/>`;
  lines += `<line x1="${cx + sizes[2] * Math.min(w, h)}" y1="${cy + sizes[2] * Math.min(w, h)}" x2="${cx + sizes[0] * Math.min(w, h)}" y2="${cy + sizes[0] * Math.min(w, h)}" stroke="#38453f" stroke-width="2"/>`;
  const radius = Math.min(w, h) * 0.035;
  const corners = [];
  for (const size of sizes) {
    const s = size * Math.min(w, h);
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) corners.push(`<circle cx="${cx + dx * s}" cy="${cy + dy * s}" r="${radius}" fill="#e8f0ec"/>`);
    corners.push(`<circle cx="${cx - s}" cy="${cy}" r="${radius}" fill="#e8f0ec"/>`, `<circle cx="${cx + s}" cy="${cy}" r="${radius}" fill="#1c2422"/>`, `<circle cx="${cx}" cy="${cy - s}" r="${radius}" fill="#e8f0ec"/>`, `<circle cx="${cx}" cy="${cy + s}" r="${radius}" fill="#1c2422"/>`);
  }
  return frame(w, h, `${lines}\n${corners.join('\n')}`, 113);
}

function checkersContent(w, h) {
  const n = 8;
  const cell = Math.min(w, h) * 0.58 / n;
  const gx = w / 2 - (n * cell) / 2;
  const gy = h / 2 - (n * cell) / 2;
  const cells = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const light = (r + c) % 2 === 0;
      cells.push(`<rect x="${gx + c * cell}" y="${gy + r * cell}" width="${cell}" height="${cell}" fill="${light ? '#20292b' : '#12181a'}" stroke="#2a3530" stroke-width="1"/>`);
      const hasPiece = (r < 3 && (r + c) % 2 === 0) || (r > 4 && (r + c) % 2 === 0);
      if (hasPiece) {
        const dark = r < 3;
        cells.push(`<circle cx="${gx + c * cell + cell / 2}" cy="${gy + r * cell + cell / 2}" r="${cell * 0.34}" fill="${dark ? '#1c2422' : '#e8f0ec'}" stroke="#75837c" stroke-width="2"/><circle cx="${gx + c * cell + cell / 2}" cy="${gy + r * cell + cell / 2}" r="${cell * 0.12}" fill="${dark ? '#38453f' : '#9fb4ac'}"/>`);
      }
    }
  }
  return frame(w, h, cells.join('\n'), 127);
}

function anagramContent(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const letters = ['R', 'E', 'A', 'D', 'S'];
  const tiles = letters.map((letter, index) => {
    const x = cx - 220 + index * 100;
    return `<rect x="${x}" y="${cy - 60}" width="84" height="96" rx="10" fill="#242f2b" stroke="${accent}" stroke-width="2"/><text x="${x + 42}" y="${cy + 8}" text-anchor="middle" font-family="system-ui" font-size="60" font-weight="800" fill="${ink}">${letter}</text>`;
  }).join('\n');
  return frame(w, h, `${tiles}\n<text x="${cx}" y="${cy + 110}" text-anchor="middle" font-family="system-ui" font-size="30" font-weight="700" fill="${ink}">Rearrange into words</text>`, 139);
}

const MOTIFS = {
  minesweeper: minesweeperContent,
  hangman: hangmanContent,
  'lights-out': lightsOutContent,
  simon: simonContent,
  'sudoku-9x9': sudoku9Content,
  'word-loom': wordLoomContent,
  'crossword-mini': crosswordMiniContent,
  gomoku: gomokuContent,
  'nine-mens-morris': nineMensMorrisContent,
  checkers: checkersContent,
  anagrams: anagramContent,
};

const motif = MOTIFS[slug];
if (!motif) {
  console.error(`no motif for "${slug}" — add one to scripts/generate-game-art.mjs`);
  process.exit(1);
}

for (const [name, w, h] of [
  ['cover-square', 800, 800],
  ['cover-landscape', 1280, 720],
  ['guide-header', 1280, 640],
  ['social-card', 1200, 630],
]) {
  const input = Buffer.from(motif(w, h));
  await sharp(input).webp({ quality: 82 }).toFile(path.join(dir, `${name}.webp`));
  await sharp(input).jpeg({ quality: 86 }).toFile(path.join(dir, `${name}.jpg`));
}

const srcDir = fileURLToPath(new URL(`./art-sources/${slug}/`, import.meta.url));
fs.mkdirSync(srcDir, { recursive: true });
fs.writeFileSync(path.join(srcDir, 'source.svg'), motif(1280, 720));

// Icon: simple mark cropped to the motif's core, rendered with accent.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#10181b"/><g>${motif(512, 512).replace(/^[\s\S]*?<defs>[\s\S]*?<\/defs>/, '').replace(/<rect width="512" height="512" fill="url\(#bg\)"\/>/, '').replace(/<rect width="512" height="512" filter="url\(#grain\)" opacity=".5"\/>/, '')}</g></svg>`;
fs.writeFileSync(path.join(dir, 'icon.svg'), iconSvg);
console.log(`art generated for ${slug}`);
