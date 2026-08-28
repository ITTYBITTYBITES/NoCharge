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

test('every page fits its viewport without horizontal overflow', async ({ page }) => {
  test.setTimeout(600_000);
  const paths = listBuiltPages();
  // Sanity: the build must exist and contain the public site, not a stray file.
  expect(paths, 'expected built HTML pages in dist/').toContain('/');
  expect(paths.filter((path) => path.startsWith('/games/')).length).toBeGreaterThanOrEqual(4);

  const issues: OverflowIssue[] = [];
  for (const viewport of MOBILE_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const path of paths) {
      await page.goto(path, { waitUntil: 'load' });
      // Allow layout to settle after images
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
      // Allow layout to settle after images
      if (result.overflow > 1) {
        issues.push({ path, viewport: viewport.width, overflow: result.overflow, offenders: result.offenders });
      }
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
