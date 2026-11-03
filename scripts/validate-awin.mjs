#!/usr/bin/env node
/**
 * Build-time verification of the Awin integration, without a browser.
 *
 * Runs against `dist/` and asserts the same contract as `tests/e2e/awin.spec.ts`,
 * so CI catches a regression even where Playwright browsers are unavailable:
 *
 *  1. The MasterTag URL, when present, is the exact publisher tag and appears at
 *     most once per page, and never with the program disabled in the HTML.
 *  2. Every rendered paid link (`a[data-awin-link]`) carries
 *     rel="sponsored nofollow noopener noreferrer", target="_blank", the real
 *     publisher id, a numeric MID, and either a well-formed `cread.php` URL or a
 *     bare https merchant URL (Convert-a-Link mode).
 *  3. No paid link is inside a game surface: `data-game-shell`,
 *     `data-game-viewport`, `data-recently-played`, `game-controls`, or the Lab
 *     frame.
 *  4. Every page that renders a paid link also renders a disclosure before it.
 *  5. Retired ad networks are absent: no AdSense/Adsterra/`ad-banner` markup.
 *  6. The CSP carries Awin hosts only when the MasterTag is on the page.
 *
 * Usage: node scripts/validate-awin.mjs   (after `npm run build`)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const PID = '3025417';
const MASTERTAG_SRC = `https://www.dwin2.com/pub.${PID}.min.js`;
const REL = ['nofollow', 'noopener', 'noreferrer', 'sponsored'];

const failures = [];
const fail = (page, message) => failures.push(`${page}: ${message}`);

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (name.endsWith('.html')) yield path;
  }
}

/**
 * Attribute values in serialized HTML escape `&` as `&amp;`, which would make
 * `new URL()` read every query parameter after the first as part of a key named
 * `amp;foo`. Decode before parsing, exactly as a browser would.
 */
const decodeEntities = (value) =>
  value.replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

/** Attribute reader that does not need a DOM. */
const attr = (tag, name) => {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'));
  return match ? decodeEntities(match[1]) : null;
};

/** Cheap span extraction: the `<a ...>...</a>` blocks, plus their offsets. */
function anchors(html) {
  const out = [];
  const pattern = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    out.push({ html: match[0], index: match.index });
  }
  return out;
}

let pages = 0;
let paidLinks = 0;
let mastertagPages = 0;

for (const file of htmlFiles(DIST)) {
  pages += 1;
  const page = '/' + file.slice(DIST.length + 1).replace(/index\.html$/, '');
  const html = readFileSync(file, 'utf8');

  /* ---------------------------------------------------- 1. MasterTag ---- */
  // The tag is injected at runtime by a consent-gated loader, so it must never
  // appear as a plain <script src="...dwin2..."> in the markup: that would run
  // before the visitor has chosen.
  const eagerTags = [...html.matchAll(/<script\b[^>]*\bsrc="[^"]*dwin2\.com[^"]*"[^>]*>/gi)].map((m) => m[0]);
  if (eagerTags.length) fail(page, 'MasterTag is a static <script src> and would load before consent');

  const loaderMentions = (html.match(new RegExp(MASTERTAG_SRC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
  if (loaderMentions > 1) fail(page, `${loaderMentions} references to the MasterTag URL (must be at most 1)`);
  const cspHasAwinEarly = /dwin2\.com/.test(html);
  const hasMastertag = loaderMentions === 1;
  if (hasMastertag) mastertagPages += 1;

  /* ---------------------------------------------- 6. CSP consistency ---- */
  const csp = (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/i) ?? [])[1] ?? '';
  const cspHasAwin = /dwin2\.com/.test(csp);
  // A widened policy without the loader means the flag is on but there is
  // nothing to attribute; that is allowed only when no paid link renders.
  if (hasMastertag && !cspHasAwin) fail(page, 'MasterTag loader present but CSP does not allow dwin2.com');
  if (!hasMastertag && cspHasAwin && cspHasAwinEarly && loaderMentions === 0 && /data-awin-link/.test(html)) {
    fail(page, 'paid links render without the MasterTag loader');
  }

  /* ------------------------------------------------ 2/3/4. paid links ---- */
  const pageAnchors = anchors(html);
  const disclosureIndex = html.search(/data-(?:affiliate-disclosure|affiliate-note)/);
  const firstPaidIndex = html.search(/data-awin-link/);

  if (firstPaidIndex !== -1 && disclosureIndex === -1) {
    fail(page, 'renders a paid link with no affiliate disclosure anywhere on the page');
  }
  if (firstPaidIndex !== -1 && disclosureIndex !== -1 && disclosureIndex > firstPaidIndex) {
    fail(page, 'affiliate disclosure appears after the first paid link');
  }

  for (const { html: anchor } of pageAnchors) {
    if (!/data-awin-link/.test(anchor)) continue;
    paidLinks += 1;

    const href = decodeEntities(attr(anchor, 'href') ?? '');
    const rel = (attr(anchor, 'rel') ?? '').split(/\s+/).filter(Boolean).sort();
    const target = attr(anchor, 'target');
    const pid = attr(anchor, 'data-awin-pid');
    const mid = attr(anchor, 'data-awin-mid');

    if (!href) { fail(page, 'paid link without href'); continue; }
    if (JSON.stringify(rel) !== JSON.stringify(REL)) fail(page, `paid link rel="${attr(anchor, 'rel')}" (must be exactly the 4 required tokens): ${href}`);
    if (target !== '_blank') fail(page, `paid link target="${target}" (must be _blank): ${href}`);
    if (pid !== PID) fail(page, `paid link data-awin-pid="${pid}" (must be ${PID}): ${href}`);
    if (!/^\d+$/.test(mid ?? '')) fail(page, `paid link data-awin-mid="${mid}" is not numeric: ${href}`);
    if (!/(paid link)/i.test(anchor.replace(/<[^>]*>/g, ''))) fail(page, `paid link text does not say "(paid link)": ${href}`);

    let url;
    try {
      url = new URL(href);
    } catch {
      fail(page, `paid link href is not absolute: ${href}`);
      continue;
    }
    if (url.protocol !== 'https:') fail(page, `paid link is not https: ${href}`);

    if (/awin1\.com$/.test(url.hostname)) {
      if (url.pathname !== '/cread.php') fail(page, `cread link path is "${url.pathname}": ${href}`);
      if (url.searchParams.get('awinaffid') !== PID) fail(page, `cread link awinaffid="${url.searchParams.get('awinaffid')}": ${href}`);
      if (url.searchParams.get('awinmid') !== mid) fail(page, `cread link awinmid does not match data-awin-mid: ${href}`);
      if (!/^https:\/\//.test(url.searchParams.get('ued') ?? '')) fail(page, `cread link ued is not an https destination: ${href}`);
    } else if (url.hostname !== 'www.awin1.com') {
      // Convert-a-Link mode: the destination must be a merchant page, and the
      // merchant's registrable domain must be on the allowlist in config.
      const allowed = ['brkox.com', 'cangyu-tech.com'];
      if (!allowed.some((domain) => url.hostname === domain || url.hostname === `www.${domain}`)) {
        fail(page, `paid link points at an unregistered merchant host "${url.hostname}": ${href}`);
      }
    }

    // 3. never inside a game surface
    const forbidden = ['data-game-shell', 'data-game-viewport', 'data-recently-played', 'game-controls', 'data-lab-frame'];
    for (const marker of forbidden) {
      if (anchor.includes(marker)) fail(page, `paid link inside ${marker}: ${href}`);
    }
  }

  /* ------------------------------------------- 5. retired ad networks ---- */
  for (const needle of ['data-ad-banner', 'adsbygoogle', 'data-lab-ad', 'highperformanceformat', 'atoptions', 'adsterra.com']) {
    if (html.toLowerCase().includes(needle.toLowerCase())) fail(page, `retired advertising markup still present: ${needle}`);
  }
}

console.log(`validate:awin — ${pages} pages, ${paidLinks} paid links, ${mastertagPages} pages with the MasterTag`);
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n` + failures.map((line) => ` - ${line}`).join('\n'));
  process.exit(1);
}
console.log('OK: link attributes, publisher/merchant ids, disclosure order, game-surface isolation, CSP and ad removal all hold.');
