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
  { width: 414, height: 896 },
] as const;

test('every page fits its viewport without horizontal overflow', async ({ page }) => {
  test.setTimeout(300_000);
  const paths = listBuiltPages();
  // Sanity: the build must exist and contain the public site, not a stray file.
  expect(paths, 'expected built HTML pages in dist/').toContain('/');
  expect(paths.filter((path) => path.startsWith('/games/')).length).toBeGreaterThanOrEqual(4);

  for (const viewport of MOBILE_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const path of paths) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(
        overflow,
        `${path} overflows the ${viewport.width}px viewport by ${overflow}px`,
      ).toBeLessThanOrEqual(0);
    }
  }
});
