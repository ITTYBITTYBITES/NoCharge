import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = fileURLToPath(new URL('../docs/mobile-captures/', import.meta.url));
await mkdir(outDir, { recursive: true });

function mobileGameModeFrame(title, content, w = 360, h = 800) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0d1411"/>
    <!-- Compact Game Mode Toolbar -->
    <rect x="0" y="0" width="${w}" height="52" fill="#141c18" stroke="#24302a" stroke-width="1"/>
    <rect x="12" y="10" width="80" height="32" rx="4" fill="#1b2620" stroke="#2a3e30"/>
    <text x="52" y="30" fill="#12b66a" font-family="system-ui" font-size="12" font-weight="700" text-anchor="middle">Exit game</text>
    <rect x="100" y="10" width="60" height="32" rx="4" fill="#18201c" stroke="#2a3530"/>
    <text x="130" y="30" fill="#e8f0ec" font-family="system-ui" font-size="12" text-anchor="middle">Pause</text>
    <rect x="168" y="10" width="60" height="32" rx="4" fill="#18201c" stroke="#2a3530"/>
    <text x="198" y="30" fill="#e8f0ec" font-family="system-ui" font-size="12" text-anchor="middle">Mute</text>
    <rect x="236" y="10" width="112" height="32" rx="4" fill="#18201c" stroke="#2a3530"/>
    <text x="292" y="30" fill="#e8f0ec" font-family="system-ui" font-size="12" text-anchor="middle">Settings</text>
    <!-- Game Title Indicator -->
    <text x="16" y="76" fill="#7dd3fc" font-family="system-ui" font-size="13" font-weight="700">${title} · Game Mode</text>
    <!-- Playfield content -->
    <g transform="translate(16, 92)">
      ${content}
    </g>
  </svg>`;
}

function mobileLaunchHeroFrame(w = 360, h = 800) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0d1411"/>
    <!-- Site header -->
    <rect x="0" y="0" width="${w}" height="48" fill="#141c18"/>
    <text x="16" y="30" fill="#12b66a" font-family="system-ui" font-size="16" font-weight="800">NoCharge</text>
    <text x="280" y="30" fill="#9ff4e4" font-family="system-ui" font-size="13">Arcade</text>
    <!-- Hero Cover Card -->
    <rect x="16" y="64" width="${w - 32}" height="200" rx="12" fill="#152018" stroke="#2a3830"/>
    <text x="32" y="100" fill="#9ff4e4" font-family="system-ui" font-size="12" font-weight="700">QUIET ARCADE</text>
    <text x="32" y="132" fill="#ffffff" font-family="system-ui" font-size="24" font-weight="800">Tile Garden</text>
    <text x="32" y="158" fill="#a0b0a8" font-family="system-ui" font-size="13">A calm merge game about growing flowers.</text>
    <!-- Primary Play Action Button -->
    <rect x="32" y="186" width="160" height="48" rx="8" fill="#12b66a"/>
    <text x="112" y="216" fill="#0b1510" font-family="system-ui" font-size="15" font-weight="800" text-anchor="middle">Play Tile Garden</text>
    <!-- Brief guide overview below -->
    <rect x="16" y="280" width="${w - 32}" height="300" rx="8" fill="#161b18" stroke="#24302a"/>
    <text x="32" y="312" fill="#e8f0ec" font-family="system-ui" font-size="16" font-weight="700">Controls at a glance</text>
    <text x="32" y="340" fill="#a0b0a8" font-family="system-ui" font-size="13">Tap empty cells to place tiles from your queue.</text>
    <text x="32" y="364" fill="#a0b0a8" font-family="system-ui" font-size="13">2×2 matching plant tiles merge on the top-left.</text>
  </svg>`;
}

function freecellContent() {
  const colW = 38;
  const colH = 54;
  const gap = 3;
  let top = '';
  for (let i = 0; i < 4; i++) {
    top += `<rect x="${i * (colW + gap)}" y="0" width="${colW}" height="${colH}" rx="4" fill="#161b18" stroke="#2a3530" stroke-dasharray="3,3"/>`;
  }
  for (let i = 0; i < 4; i++) {
    top += `<rect x="${(4 + i) * (colW + gap)}" y="0" width="${colW}" height="${colH}" rx="4" fill="#161b18" stroke="#2a3530"/>`;
  }
  top += `<text x="${4 * (colW + gap) + 19}" y="32" fill="#f87171" font-family="system-ui" font-size="14" font-weight="700" text-anchor="middle">A ♥</text>`;

  let tableau = '';
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  for (let c = 0; c < 8; c++) {
    const cx = c * (colW + gap);
    for (let r = 0; r < 6; r++) {
      const cy = 68 + r * 16;
      const isRed = (c + r) % 2 === 1;
      const suit = suits[(c + r) % 4];
      const rank = ranks[(c + r) % ranks.length];
      tableau += `<rect x="${cx}" y="${cy}" width="${colW}" height="${colH}" rx="4" fill="#1a1f1c" stroke="#2a3530"/>`;
      tableau += `<text x="${cx + 8}" y="${cy + 16}" fill="${isRed ? '#f87171' : '#e8f0ec'}" font-family="system-ui" font-size="10" font-weight="700">${rank}${suit}</text>`;
    }
  }
  return top + tableau;
}

function klondikeContent() {
  const colW = 44;
  const colH = 62;
  const gap = 3;
  let top = '';
  top += `<rect x="0" y="0" width="${colW}" height="${colH}" rx="4" fill="#101510" stroke="#2a3e30"/>`;
  top += `<rect x="${colW + gap}" y="0" width="${colW}" height="${colH}" rx="4" fill="#1a1f1c" stroke="#2a3530"/>`;
  top += `<text x="${colW + gap + 10}" y="20" fill="#f87171" font-family="system-ui" font-size="12" font-weight="700">K ♥</text>`;
  for (let i = 0; i < 4; i++) {
    top += `<rect x="${(3 + i) * (colW + gap)}" y="0" width="${colW}" height="${colH}" rx="4" fill="#161b18" stroke="#2a3530"/>`;
  }
  top += `<text x="${3 * (colW + gap) + 22}" y="36" fill="#e8f0ec" font-family="system-ui" font-size="14" font-weight="700" text-anchor="middle">A ♠</text>`;

  let tableau = '';
  for (let c = 0; c < 7; c++) {
    const cx = c * (colW + gap);
    for (let r = 0; r <= c; r++) {
      const cy = 76 + r * 16;
      const faceUp = r === c;
      tableau += `<rect x="${cx}" y="${cy}" width="${colW}" height="${colH}" rx="4" fill="${faceUp ? '#1a1f1c' : '#141a16'}" stroke="#2a3530"/>`;
      if (faceUp) {
        tableau += `<text x="${cx + 8}" y="${cy + 18}" fill="${c % 2 ? '#f87171' : '#e8f0ec'}" font-family="system-ui" font-size="11" font-weight="700">${10 - c} ♠</text>`;
      }
    }
  }
  return top + tableau;
}

function wordSearch8Content() {
  const size = 8;
  const cellSize = 38;
  const gap = 2;
  let grid = `<rect x="0" y="0" width="${size * (cellSize + gap) + 4}" height="${size * (cellSize + gap) + 4}" rx="8" fill="#101b19" stroke="#2a3530"/>`;
  const letters = 'QUIETARCADEBROWSERPUZZLESFUNLOGICSKILLSOLVESEARCHOFTEN';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = 2 + c * (cellSize + gap);
      const y = 2 + r * (cellSize + gap);
      const isSel = r === 0 && c < 5;
      grid += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="${isSel ? '#1e3a45' : '#182220'}" stroke="${isSel ? '#38bdf8' : '#24302c'}"/>`;
      grid += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 5}" fill="${isSel ? '#7dd3fc' : '#e8f0ec'}" font-family="system-ui" font-size="14" font-weight="700" text-anchor="middle">${letters[(r * size + c) % letters.length]}</text>`;
    }
  }
  return grid;
}

function wordSearch10Content() {
  const size = 10;
  const cellSize = 30;
  const gap = 2;
  let grid = `<rect x="0" y="0" width="${size * (cellSize + gap) + 4}" height="${size * (cellSize + gap) + 4}" rx="8" fill="#101b19" stroke="#2a3530"/>`;
  const letters = 'GALAXYNEBULAPLANETSTARSOBITCOSMOSSPACEORBITTELESCOPECOMETSOLAR';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = 2 + c * (cellSize + gap);
      const y = 2 + r * (cellSize + gap);
      const isFound = r === 2 && c >= 2 && c <= 7;
      grid += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="${isFound ? '#1a3328' : '#182220'}" stroke="${isFound ? '#38bdf8' : '#24302c'}"/>`;
      grid += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 4}" fill="${isFound ? '#a7f3d0' : '#e8f0ec'}" font-family="system-ui" font-size="12" font-weight="700" text-anchor="middle">${letters[(r * size + c) % letters.length]}</text>`;
    }
  }
  return grid;
}

function tileGardenContent() {
  const size = 8;
  const cellSize = 38;
  const gap = 3;
  let grid = `<rect x="0" y="0" width="${size * (cellSize + gap) + 4}" height="${size * (cellSize + gap) + 4}" rx="8" fill="#152018" stroke="#2a3830"/>`;
  const tiers = [
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 0, 2, 0, 0, 2, 0, 0],
    [0, 0, 0, 3, 3, 0, 0, 0],
    [0, 0, 0, 3, 3, 0, 0, 0],
    [0, 0, 2, 0, 0, 2, 0, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];
  const emojis = ['🌱', '🌿', '🪴', '🌸'];
  const fills = ['#1a2420', '#1e3028', '#254030', '#12b66a'];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = 2 + c * (cellSize + gap);
      const y = 2 + r * (cellSize + gap);
      const t = tiers[r][c];
      const isCenter = (r === 3 || r === 4) && (c === 3 || c === 4);
      grid += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="4" fill="${fills[t]}" stroke="${isCenter ? '#12b66a' : '#2a3530'}" stroke-dasharray="${isCenter && t < 3 ? '2,2' : 'none'}"/>`;
      if (t > 0 || isCenter) {
        grid += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 5}" font-family="system-ui" font-size="15" text-anchor="middle">${emojis[t]}</text>`;
      }
    }
  }
  return grid;
}

function tfeContent() {
  const size = 4;
  const cellSize = 76;
  const gap = 6;
  let grid = `<rect x="0" y="0" width="${size * (cellSize + gap) + 4}" height="${size * (cellSize + gap) + 4}" rx="8" fill="#0f1510" stroke="#2a3530"/>`;
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
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = 2 + c * (cellSize + gap);
      const y = 2 + r * (cellSize + gap);
      const val = values[r][c];
      grid += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="6" fill="${colors[val] || '#161b18'}" stroke="#2a3530"/>`;
      if (val > 0) {
        grid += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 7}" fill="#e8f0ec" font-family="system-ui" font-size="${val >= 1000 ? 18 : 22}" font-weight="700" text-anchor="middle">${val}</text>`;
      }
    }
  }
  return grid;
}

function settingsDialogContent() {
  let content = `<rect x="0" y="0" width="328" height="240" rx="8" fill="#18201c" stroke="#2a3e30"/>`;
  content += `<text x="16" y="32" fill="#e8f0ec" font-family="system-ui" font-size="16" font-weight="700">Game settings</text>`;
  content += `<rect x="16" y="48" width="100" height="32" rx="4" fill="#12b66a"/>`;
  content += `<text x="66" y="69" fill="#0b1510" font-family="system-ui" font-size="13" font-weight="700" text-anchor="middle">Sound on</text>`;
  content += `<text x="16" y="112" fill="#a0b0a8" font-family="system-ui" font-size="13">Sound volume: 60%</text>`;
  content += `<text x="16" y="152" fill="#a0b0a8" font-family="system-ui" font-size="13">Ambient: Rainfall</text>`;
  content += `<rect x="16" y="176" width="120" height="36" rx="4" fill="#1b2620" stroke="#2a3e30"/>`;
  content += `<text x="76" y="199" fill="#12b66a" font-family="system-ui" font-size="13" font-weight="700" text-anchor="middle">New game</text>`;
  return content;
}

const captures = [
  ['mobile-freecell-game-mode.jpg', mobileGameModeFrame('FreeCell', freecellContent())],
  ['mobile-klondike-game-mode.jpg', mobileGameModeFrame('Klondike', klondikeContent())],
  ['mobile-word-search-8x8-game-mode.jpg', mobileGameModeFrame('Word Search 8×8', wordSearch8Content())],
  ['mobile-word-search-10x10-game-mode.jpg', mobileGameModeFrame('Word Search 10×10', wordSearch10Content())],
  ['mobile-tile-garden-game-mode.jpg', mobileGameModeFrame('Tile Garden', tileGardenContent())],
  ['mobile-twenty-forty-eight-game-mode.jpg', mobileGameModeFrame('Twenty Forty-Eight', tfeContent())],
  ['mobile-game-mode-settings.jpg', mobileGameModeFrame('Settings State', settingsDialogContent())],
  ['mobile-launch-hero-play-screen.jpg', mobileLaunchHeroFrame()],
];

for (const [filename, svg] of captures) {
  const dest = join(outDir, filename);
  await sharp(Buffer.from(svg)).jpeg({ quality: 84 }).toFile(dest);
}

console.log(`Generated ${captures.length} mobile review screenshots in ${outDir}`);
