import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const accent = '#2dd4bf';
const highlight = '#9ff4e4';
const dirUrl = new URL('../public/game-art/beacon-lattice/', import.meta.url);
const dir = fileURLToPath(dirUrl);
await mkdir(dir, { recursive: true });

const lattice = (w, h) => {
  const lines = [];
  for (let i = 1; i <= 6; i += 1) {
    const x = (w * i) / 7;
    const y = (h * i) / 7;
    lines.push(
      `<path d="M${w * 0.12} ${y * 0.7 + h * 0.18} H${w * 0.88}" fill="none" stroke="${accent}" stroke-opacity=".22" stroke-width="${w / 700}"/>`,
      `<path d="M${x} ${h * 0.18} V${h * 0.82}" fill="none" stroke="${accent}" stroke-opacity=".18" stroke-width="${w / 700}"/>`,
    );
  }
  const marks = [
    [`M${w * 0.32} ${h * 0.38} h${w * 0.08} M${w * 0.36} ${h * 0.34} v${h * 0.08}`, accent],
    [`M${w * 0.58} ${h * 0.34} l${w * 0.06} ${h * 0.08} M${w * 0.64} ${h * 0.34} l${-w * 0.06} ${h * 0.08}`, highlight],
    [`M${w * 0.3} ${h * 0.62} h${w * 0.1}`, accent],
    [`M${w * 0.62} ${h * 0.58} v${h * 0.08}`, highlight],
  ]
    .map(
      ([d, color]) =>
        `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w / 180}" stroke-linecap="round"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="b" cx="68%" cy="40%" r="75%"><stop stop-color="${accent}" stop-opacity=".16"/><stop offset=".5" stop-color="#151a18"/><stop offset="1" stop-color="#101210"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#b)"/>${lines.join('')}${marks}<circle cx="${w * 0.8}" cy="${h * 0.22}" r="${Math.min(w, h) * 0.16}" fill="${highlight}" opacity=".05"/></svg>`;
};

// Canonical vector source lives outside public/ (never shipped); the CI
// art-drift step in deploy.yml regenerates it and fails on any drift.
const srcDir = fileURLToPath(new URL('./art-sources/beacon-lattice/', import.meta.url));
await mkdir(srcDir, { recursive: true });
await writeFile(srcDir + 'source.svg', lattice(1280, 720));
const jobs = [
  ['cover-square', 800, 800],
  ['cover-landscape', 1280, 720],
  ['guide-header', 1280, 640],
  ['social-card', 1200, 630],
];
for (const [name, w, h] of jobs) {
  const input = Buffer.from(lattice(w, h));
  await sharp(input).webp({ quality: 78, effort: 6 }).toFile(`${dir}${name}.webp`);
  await sharp(input).jpeg({ quality: 80, mozjpeg: true }).toFile(`${dir}${name}.jpg`);
}

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/><path d="M20 28 H76 M20 48 H76 M20 68 H76 M32 18 V78 M48 18 V78 M64 18 V78" fill="none" stroke="${accent}" stroke-opacity=".45" stroke-width="2"/><path d="M40 48 H56 M48 40 V56" fill="none" stroke="${highlight}" stroke-width="5" stroke-linecap="round"/></svg>`;
await writeFile(new URL('icon.svg', dirUrl), icon);

const controls = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 520" role="img"><rect width="960" height="520" rx="28" fill="#121412"/><g transform="translate(48 70)"><text fill="${highlight}" font-family="system-ui" font-size="18" font-weight="700">01 · Choose</text><rect y="40" width="250" height="220" rx="20" fill="#1d231f" stroke="${accent}" stroke-opacity=".5"/><text x="125" y="160" text-anchor="middle" fill="#e0e0e0" font-family="system-ui" font-size="22">Select type</text></g><g transform="translate(355 70)"><text fill="${highlight}" font-family="system-ui" font-size="18" font-weight="700">02 · Place</text><rect y="40" width="250" height="220" rx="20" fill="#1d231f" stroke="${accent}" stroke-opacity=".5"/><text x="125" y="160" text-anchor="middle" fill="#e0e0e0" font-family="system-ui" font-size="22">Tap a cell</text></g><g transform="translate(662 70)"><text fill="${highlight}" font-family="system-ui" font-size="18" font-weight="700">03 · Read</text><rect y="40" width="250" height="220" rx="20" fill="#1d231f" stroke="${accent}" stroke-opacity=".5"/><text x="125" y="160" text-anchor="middle" fill="#e0e0e0" font-family="system-ui" font-size="22">0 / 1 / 2+</text></g><text x="48" y="470" fill="#9a9a9a" font-family="system-ui" font-size="18">Touch, pointer, and keyboard use the same place-and-read loop.</text></svg>`;
await writeFile(new URL('controls-diagram.svg', dirUrl), controls);

const coverage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 520" role="img"><rect width="960" height="520" rx="28" fill="#121412"/><g transform="translate(40 60)"><text fill="${highlight}" font-family="system-ui" font-size="18" font-weight="700">Cross</text><path d="M70 150 H170 M120 100 V200" stroke="${accent}" stroke-width="8" stroke-linecap="round"/></g><g transform="translate(260 60)"><text fill="${highlight}" font-family="system-ui" font-size="18" font-weight="700">Diagonal</text><path d="M70 100 L170 200 M170 100 L70 200" stroke="${accent}" stroke-width="8" stroke-linecap="round"/></g><g transform="translate(500 60)"><text fill="${highlight}" font-family="system-ui" font-size="18" font-weight="700">Horizontal</text><path d="M60 150 H180" stroke="${accent}" stroke-width="8" stroke-linecap="round"/></g><g transform="translate(720 60)"><text fill="${highlight}" font-family="system-ui" font-size="18" font-weight="700">Vertical</text><path d="M110 90 V210" stroke="${accent}" stroke-width="8" stroke-linecap="round"/></g><text x="48" y="470" fill="#9a9a9a" font-family="system-ui" font-size="18">Coverage 0 is a gap, 1 is exact, and 2 or more is an overlap.</text></svg>`;
await writeFile(new URL('coverage-diagram.svg', dirUrl), coverage);

console.log('Beacon Lattice artwork written.');
