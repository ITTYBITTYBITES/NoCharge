import { fileURLToPath } from 'node:url';

import { readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

import { expect, test } from '@playwright/test';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');

/** Every HTML page in the production build (run `npm run build` first). */
function listBuiltPages(): string[] {
  const pages = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.html')) continue;
      const rel = relative(DIST, full).split(sep).join('/');
      if (rel === 'index.html') pages.add('/');
      else pages.add(`/${rel.replace(/index\.html$/, '')}`);
    }
  };
  walk(DIST);
  return [...pages].sort();
}

const MOBILE_VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
] as const;

interface OverflowIssue {
  path: string;
  viewport: number;
  overflow: number;
  offenders: { tag: string; cls: string; text: string; right: number; width: number }[];
}

const PAGE_CHUNK_SIZE = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function collectPagesOrEmpty(): string[] {
  try {
    return listBuiltPages();
  } catch {
    // A missing dist/ is reported by the sanity test, not at collection time.
    return [];
  }
}

const ALL_PAGES = collectPagesOrEmpty();

test('the build exposes the public pages for the overflow sweep', () => {
  const paths = listBuiltPages();
  // Sanity: the build must exist and contain the public site, not a stray file.
  expect(paths, 'expected built HTML pages in dist/').toContain('/');
  expect(paths.filter((path) => path.startsWith('/games/')).length).toBeGreaterThanOrEqual(4);
});

// One test per viewport and page chunk. The sweep used to run every page at every
// viewport inside one test; with localized pages it outgrew the 10-minute test
// timeout on slower CI runners. Chunking keeps each test within its own budget and
// changes no assertion.
for (const viewport of MOBILE_VIEWPORTS) {
  chunk(ALL_PAGES, PAGE_CHUNK_SIZE).forEach((paths, index) => {
    const first = index * PAGE_CHUNK_SIZE + 1;
    const last = first + paths.length - 1;
    test(`pages ${first}-${last} of ${ALL_PAGES.length} fit ${viewport.width}px without horizontal overflow`, async ({ page }) => {
      test.setTimeout(600_000);
      const issues: OverflowIssue[] = [];
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const path of paths) {
          await page.goto(path, { waitUntil: 'load' });
          await page.waitForTimeout(100);
          const result = await page.evaluate(() => {
            const doc = document.documentElement;
            const overflow = doc.scrollWidth - window.innerWidth;
            const offenders: OverflowIssue['offenders'] = [];
            document.querySelectorAll('*').forEach((el) => {
              const r = el.getBoundingClientRect();
              if (r.right > window.innerWidth + 1 || r.left < -1) {
                const cls = typeof el.className === 'string' ? el.className : '';
                offenders.push({
                  tag: el.tagName.toLowerCase(),
                  cls: cls.slice(0, 70),
                  text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50),
                  right: Math.round(r.right),
                  width: Math.round(r.width),
                });
              }
            });
            return { overflow, offenders: offenders.slice(0, 12) };
          });
          if (result.overflow > 1) {
            issues.push({ path, viewport: viewport.width, overflow: result.overflow, offenders: result.offenders });
          }
          // Container-chain diagnostics for the tool page that blew up.
          if (path === '/tools/nonogram-clue-calculator/' && result.overflow > 1000) {
            const chain = await page.evaluate(() => {
              const fields = (sel: string) => {
                const el = document.querySelector(sel) as HTMLElement | null;
                if (!el) return null;
                const cs = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                return {
                  left: Math.round(r.left),
                  width: Math.round(r.width),
                  scrollWidth: el.scrollWidth,
                  display: cs.display,
                  gridTemplateColumns: cs.gridTemplateColumns,
                  maxWidth: cs.maxWidth,
                  minWidth: cs.minWidth,
                  overflowX: cs.overflowX,
                };
              };
              return {
                shell: fields('.site-shell'),
                main: fields('.site-main'),
                toolPage: fields('.tool-page'),
                mainSlot: fields('.tool-page__main'),
                controls: fields('.calc-controls'),
                output: fields('.calc-output'),
                lines: fields('.calc-lines'),
              };
            });
            issues.push({
              path: `${path}#chain`,
              viewport: viewport.width,
              overflow: result.overflow,
              offenders: Object.entries(chain).map(([k, v]) => ({
                tag: k,
                cls: JSON.stringify(v),
                text: '',
                right: 0,
                width: 0,
              })) as any,
            });
          }
      }

      const detail = issues
        .map((issue) => {
          const offenderLines = issue.offenders
            .map((o) => `      <${o.tag} class="${o.cls}" right=${o.right} width=${o.width}> ${o.text}`)
            .join('\n');
          return `  - ${issue.path} overflows ${issue.viewport}px by ${issue.overflow}px\n${offenderLines}`;
        })
        .join('\n');
      expect(issues, `Horizontal overflow detected:\n${detail}`).toEqual([]);
    });
  });
}
