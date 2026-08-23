#!/usr/bin/env node
/**
 * Regenerate only the Quiet Setup concepts that failed the visual audit.
 *
 * Programmatic SVG composition in the existing charcoal / teal / amber / slate
 * family. No embedded words. Rasterized at 800×450, 1200×675, 1600×900 in
 * WebP and JPEG. Does not touch topic-correct concepts.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export const MISMATCHED = [
  'room-lighting',
  'screen-film',
  'chair-posture',
  'large-dual-monitors',
];

const WIDTHS = [800, 1200, 1600];
const OUT = join('public', 'setup-art');

const C = {
  bg: '#181c1d',
  bgLift: '#22282a',
  charcoal: '#202527',
  desk: '#2a3134',
  deskEdge: '#c9964a',
  teal: '#7ec8b8',
  tealDeep: '#4f9e90',
  amber: '#d4a05a',
  amberSoft: '#e5c08a',
  slate: '#5a6e80',
  slateLite: '#7a8ea0',
  screen: '#3d4c52',
  screenDark: '#243033',
  coral: '#c96b5a',
  figure: '#88a09a',
  figureDark: '#5e756f',
};

function commonDefs(id) {
  return `
    <defs>
      <radialGradient id="${id}-bg" cx="50%" cy="42%" r="78%">
        <stop offset="0" stop-color="${C.bgLift}"/>
        <stop offset="1" stop-color="${C.bg}"/>
      </radialGradient>
      <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity=".35"/>
      </filter>
      <filter id="${id}-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="18" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="${id}-grain">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="11"/>
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .035 0"/>
      </filter>
    </defs>`;
}

function frame(w, h, id, drawing) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${commonDefs(id)}
    <rect width="${w}" height="${h}" fill="url(#${id}-bg)"/>
    ${drawing}
    <rect width="${w}" height="${h}" filter="url(#${id}-grain)" opacity=".55"/>
  </svg>`;
}

/** Bias / ambient light: monitor from the front with a warm wall glow behind it. */
function roomLighting(w, h) {
  const cx = w * 0.5;
  const monW = w * 0.42;
  const monH = h * 0.38;
  const monX = cx - monW / 2;
  const monY = h * 0.22;
  const bezel = Math.max(6, w * 0.012);
  const standW = monW * 0.16;
  const standH = h * 0.07;
  const baseW = monW * 0.34;
  const glowR = Math.max(monW, monH) * 0.72;
  return frame(
    w,
    h,
    'rl',
    `
    <ellipse cx="${cx}" cy="${monY + monH * 0.45}" rx="${glowR}" ry="${glowR * 0.62}" fill="${C.amber}" opacity=".22" filter="url(#rl-glow)"/>
    <ellipse cx="${cx}" cy="${monY + monH * 0.2}" rx="${monW * 0.62}" ry="${monH * 0.55}" fill="${C.amberSoft}" opacity=".18"/>
    <rect x="${w * 0.12}" y="${h * 0.78}" width="${w * 0.76}" height="${h * 0.045}" rx="${h * 0.01}" fill="${C.desk}"/>
    <rect x="${w * 0.12}" y="${h * 0.818}" width="${w * 0.76}" height="${h * 0.012}" fill="${C.deskEdge}"/>
    <g filter="url(#rl-soft)">
      <rect x="${monX}" y="${monY}" width="${monW}" height="${monH}" rx="${bezel * 1.4}" fill="${C.slate}" stroke="${C.teal}" stroke-width="${bezel * 0.55}"/>
      <rect x="${monX + bezel}" y="${monY + bezel}" width="${monW - bezel * 2}" height="${monH - bezel * 2}" rx="${bezel * 0.6}" fill="${C.screenDark}"/>
      <rect x="${monX + bezel * 2.2}" y="${monY + bezel * 2.4}" width="${monW - bezel * 4.4}" height="${(monH - bezel * 4.8) * 0.18}" rx="3" fill="${C.teal}" opacity=".35"/>
      <rect x="${monX + bezel * 2.2}" y="${monY + bezel * 5.2}" width="${(monW - bezel * 4.4) * 0.62}" height="${(monH - bezel * 4.8) * 0.1}" rx="3" fill="${C.slateLite}" opacity=".35"/>
    </g>
    <rect x="${cx - standW / 2}" y="${monY + monH}" width="${standW}" height="${standH}" fill="${C.slate}"/>
    <rect x="${cx - baseW / 2}" y="${monY + monH + standH}" width="${baseW}" height="${h * 0.018}" rx="3" fill="${C.amber}"/>
    `,
  );
}

/** Monitor with a matte film sheet applied; one corner lifted. */
function screenFilm(w, h) {
  const monW = w * 0.48;
  const monH = h * 0.42;
  const monX = w * 0.26;
  const monY = h * 0.18;
  const bezel = Math.max(6, w * 0.011);
  const innerX = monX + bezel;
  const innerY = monY + bezel;
  const innerW = monW - bezel * 2;
  const innerH = monH - bezel * 2;
  const peel = innerW * 0.22;
  return frame(
    w,
    h,
    'sf',
    `
    <rect x="${w * 0.1}" y="${h * 0.8}" width="${w * 0.8}" height="${h * 0.04}" rx="${h * 0.01}" fill="${C.desk}"/>
    <rect x="${w * 0.1}" y="${h * 0.834}" width="${w * 0.8}" height="${h * 0.01}" fill="${C.deskEdge}"/>
    <g filter="url(#sf-soft)">
      <rect x="${monX}" y="${monY}" width="${monW}" height="${monH}" rx="${bezel * 1.3}" fill="${C.slate}"/>
      <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${bezel * 0.5}" fill="${C.screen}"/>
      <!-- glossy reflection on the uncovered strip -->
      <path d="M${innerX + innerW * 0.72} ${innerY} L${innerX + innerW} ${innerY} L${innerX + innerW} ${innerY + innerH * 0.55} Z" fill="#dfe8ea" opacity=".18"/>
      <!-- matte film covering most of the screen -->
      <path d="M${innerX} ${innerY}
               H${innerX + innerW - peel}
               L${innerX + innerW - peel * 0.35} ${innerY + peel * 0.55}
               V${innerY + innerH}
               H${innerX}
               Z" fill="${C.teal}" opacity=".28"/>
      <!-- lifted film corner -->
      <path d="M${innerX + innerW - peel} ${innerY}
               L${innerX + innerW - peel * 0.12} ${innerY - peel * 0.42}
               L${innerX + innerW + peel * 0.08} ${innerY + peel * 0.18}
               L${innerX + innerW - peel * 0.35} ${innerY + peel * 0.55}
               Z" fill="${C.tealDeep}" opacity=".85"/>
      <path d="M${innerX + innerW - peel} ${innerY}
               L${innerX + innerW - peel * 0.35} ${innerY + peel * 0.55}
               L${innerX + innerW - peel * 0.55} ${innerY + peel * 0.18}
               Z" fill="${C.amberSoft}" opacity=".35"/>
    </g>
    <rect x="${monX + monW * 0.42}" y="${monY + monH}" width="${monW * 0.16}" height="${h * 0.07}" fill="${C.slate}"/>
    <rect x="${monX + monW * 0.32}" y="${monY + monH + h * 0.07}" width="${monW * 0.36}" height="${h * 0.016}" rx="3" fill="${C.amber}"/>
    `,
  );
}

/** Side-on desk chair with an upright seated figure at a desk. */
function chairPosture(w, h) {
  const deskY = h * 0.46;
  const deskX = w * 0.38;
  const deskW = w * 0.42;
  const seatX = w * 0.28;
  const seatY = h * 0.56;
  const seatW = w * 0.2;
  const seatH = h * 0.045;
  return frame(
    w,
    h,
    'cp',
    `
    <!-- floor -->
    <rect x="${w * 0.12}" y="${h * 0.82}" width="${w * 0.76}" height="${h * 0.03}" rx="4" fill="${C.desk}"/>
    <!-- desk -->
    <rect x="${deskX}" y="${deskY}" width="${deskW}" height="${h * 0.045}" rx="4" fill="${C.desk}" filter="url(#cp-soft)"/>
    <rect x="${deskX}" y="${deskY + h * 0.04}" width="${deskW}" height="${h * 0.01}" fill="${C.deskEdge}"/>
    <rect x="${deskX + deskW * 0.12}" y="${deskY + h * 0.05}" width="${w * 0.028}" height="${h * 0.32}" fill="${C.slate}"/>
    <rect x="${deskX + deskW * 0.82}" y="${deskY + h * 0.05}" width="${w * 0.028}" height="${h * 0.32}" fill="${C.slate}"/>
    <!-- monitor on desk -->
    <rect x="${deskX + deskW * 0.38}" y="${deskY - h * 0.2}" width="${deskW * 0.34}" height="${h * 0.17}" rx="6" fill="${C.slate}" stroke="${C.teal}" stroke-width="${w * 0.006}"/>
    <rect x="${deskX + deskW * 0.41}" y="${deskY - h * 0.18}" width="${deskW * 0.28}" height="${h * 0.125}" rx="3" fill="${C.screenDark}"/>
    <rect x="${deskX + deskW * 0.52}" y="${deskY - h * 0.03}" width="${deskW * 0.06}" height="${h * 0.03}" fill="${C.slate}"/>
    <!-- chair base -->
    <ellipse cx="${seatX + seatW * 0.42}" cy="${h * 0.81}" rx="${seatW * 0.55}" ry="${h * 0.018}" fill="${C.charcoal}"/>
    <rect x="${seatX + seatW * 0.36}" y="${seatY + seatH}" width="${w * 0.022}" height="${h * 0.2}" fill="${C.slate}"/>
    <path d="M${seatX + seatW * 0.18} ${h * 0.81} L${seatX + seatW * 0.42} ${seatY + seatH + h * 0.04} L${seatX + seatW * 0.66} ${h * 0.81}" fill="none" stroke="${C.slateLite}" stroke-width="${w * 0.01}" stroke-linecap="round"/>
    <!-- seat + back -->
    <rect x="${seatX}" y="${seatY}" width="${seatW}" height="${seatH}" rx="6" fill="${C.tealDeep}"/>
    <rect x="${seatX}" y="${h * 0.34}" width="${w * 0.038}" height="${h * 0.24}" rx="6" fill="${C.teal}"/>
    <rect x="${seatX + w * 0.006}" y="${h * 0.42}" width="${w * 0.026}" height="${h * 0.08}" rx="4" fill="${C.amber}" opacity=".85"/>
    <!-- seated figure, upright: hips on the seat, back along the chair -->
    <circle cx="${seatX + seatW * 0.48}" cy="${h * 0.325}" r="${h * 0.042}" fill="${C.figure}"/>
    <path d="M${seatX + seatW * 0.48} ${h * 0.368}
             C${seatX + seatW * 0.5} ${h * 0.46}, ${seatX + seatW * 0.52} ${h * 0.52}, ${seatX + seatW * 0.55} ${seatY + seatH * 0.35}
             M${seatX + seatW * 0.5} ${h * 0.44}
             L${deskX + w * 0.05} ${deskY + h * 0.01}
             M${seatX + seatW * 0.55} ${seatY + seatH * 0.35}
             L${seatX + seatW * 0.95} ${h * 0.79}
             M${seatX + seatW * 0.55} ${seatY + seatH * 0.35}
             L${seatX + seatW * 0.18} ${h * 0.79}"
          fill="none" stroke="${C.figure}" stroke-width="${w * 0.016}" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  );
}

/** One large monitor beside a dual-monitor pair. */
function largeDualMonitors(w, h) {
  const y = h * 0.22;
  const largeW = w * 0.38;
  const largeH = h * 0.42;
  const largeX = w * 0.08;
  const smallW = w * 0.2;
  const smallH = h * 0.26;
  const gap = w * 0.018;
  const pairX = w * 0.52;
  const pairY = y + (largeH - smallH);
  const bezel = Math.max(5, w * 0.008);
  const deskY = h * 0.78;

  const monitor = (x, my, mw, mh, screenFill) => `
    <g filter="url(#ld-soft)">
      <rect x="${x}" y="${my}" width="${mw}" height="${mh}" rx="${bezel * 1.4}" fill="${C.slate}"/>
      <rect x="${x + bezel}" y="${my + bezel}" width="${mw - bezel * 2}" height="${mh - bezel * 2}" rx="${bezel * 0.5}" fill="${screenFill}"/>
    </g>
    <rect x="${x + mw * 0.42}" y="${my + mh}" width="${mw * 0.16}" height="${h * 0.055}" fill="${C.slate}"/>
    <rect x="${x + mw * 0.28}" y="${my + mh + h * 0.055}" width="${mw * 0.44}" height="${h * 0.014}" rx="3" fill="${C.amber}"/>
  `;

  return frame(
    w,
    h,
    'ld',
    `
    <rect x="${w * 0.05}" y="${deskY}" width="${w * 0.9}" height="${h * 0.038}" rx="4" fill="${C.desk}"/>
    <rect x="${w * 0.05}" y="${deskY + h * 0.032}" width="${w * 0.9}" height="${h * 0.01}" fill="${C.deskEdge}"/>
    ${monitor(largeX, y, largeW, largeH, C.screenDark)}
    <rect x="${largeX + bezel * 2.4}" y="${y + bezel * 2.6}" width="${(largeW - bezel * 4.8) * 0.7}" height="${(largeH - bezel * 5) * 0.12}" rx="3" fill="${C.teal}" opacity=".4"/>
    <rect x="${largeX + bezel * 2.4}" y="${y + bezel * 5.4}" width="${(largeW - bezel * 4.8) * 0.92}" height="${(largeH - bezel * 5) * 0.08}" rx="3" fill="${C.slateLite}" opacity=".28"/>
    <rect x="${largeX + bezel * 2.4}" y="${y + bezel * 7.6}" width="${(largeW - bezel * 4.8) * 0.55}" height="${(largeH - bezel * 5) * 0.08}" rx="3" fill="${C.slateLite}" opacity=".22"/>
    ${monitor(pairX, pairY, smallW, smallH, C.screen)}
    ${monitor(pairX + smallW + gap, pairY, smallW, smallH, C.screen)}
    <rect x="${pairX + bezel * 2}" y="${pairY + bezel * 2.2}" width="${(smallW - bezel * 4) * 0.8}" height="${(smallH - bezel * 4) * 0.14}" rx="2" fill="${C.teal}" opacity=".35"/>
    <rect x="${pairX + smallW + gap + bezel * 2}" y="${pairY + bezel * 2.2}" width="${(smallW - bezel * 4) * 0.8}" height="${(smallH - bezel * 4) * 0.14}" rx="2" fill="${C.coral}" opacity=".32"/>
    `,
  );
}

const builders = {
  'room-lighting': roomLighting,
  'screen-film': screenFilm,
  'chair-posture': chairPosture,
  'large-dual-monitors': largeDualMonitors,
};

mkdirSync(OUT, { recursive: true });

for (const name of MISMATCHED) {
  const build = builders[name];
  for (const width of WIDTHS) {
    const height = Math.round((width * 9) / 16);
    const input = Buffer.from(build(width, height));
    await sharp(input).webp({ quality: 82, effort: 6 }).toFile(join(OUT, `${name}-${width}.webp`));
    await sharp(input).jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(join(OUT, `${name}-${width}.jpg`));
  }
}

console.log(`Generated ${MISMATCHED.length * WIDTHS.length * 2} Quiet Setup mismatch repairs.`);
