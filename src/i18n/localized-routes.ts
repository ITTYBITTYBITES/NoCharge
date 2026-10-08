/**
 * Astro integration: mirror every page under each locale prefix.
 *
 * Each file in `src/pages/` is registered once more at `/<locale>/<route>`,
 * pointing at the same entrypoint. Pages read their locale from `Astro.url`,
 * so one template serves English and every prefixed locale. This keeps
 * localized navigation from 404ing, and content that has no translation
 * falls back to English copy inside the localized shell (see
 * `src/i18n/coverage.ts`).
 *
 * Node-only. Imported by `astro.config.ts` and nowhere in browser code.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AstroIntegration } from 'astro';
import { PREFIXED_LOCALES } from './config';

/** Page files that must not be mirrored (embeds and the root-only 404). */
const EXCLUDED_PAGES = new Set(['404.astro']);
const EXCLUDED_DIRECTORIES = new Set(['embed']);

function collectPages(directory: string, base = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      return EXCLUDED_DIRECTORIES.has(entry.name) ? [] : collectPages(join(directory, entry.name), relativePath);
    }
    if (!entry.name.endsWith('.astro') || EXCLUDED_PAGES.has(relativePath)) return [];
    return [relativePath];
  });
}

/** `index.astro` → `` (root of its folder); `tools/index.astro` → `tools`; `games/[slug].astro` → `games/[slug]`. */
export function pagePattern(relativePage: string): string {
  const withoutExtension = relativePage.replace(/\.astro$/, '');
  if (withoutExtension === 'index') return '';
  return withoutExtension.endsWith('/index') ? withoutExtension.slice(0, -'/index'.length) : withoutExtension;
}

export function localizedRoutes(): AstroIntegration {
  return {
    name: 'nocharge-localized-routes',
    hooks: {
      'astro:config:setup': ({ injectRoute, config }) => {
        const pagesDirectory = fileURLToPath(new URL('./src/pages/', config.root));
        const pages = collectPages(pagesDirectory);
        for (const locale of PREFIXED_LOCALES) {
          for (const page of pages) {
            const route = pagePattern(page);
            const entrypoint = pathToFileURL(join(pagesDirectory, ...page.split('/')));
            injectRoute({
              pattern: `/${locale}${route ? `/${route}` : ''}`,
              entrypoint,
              prerender: true,
            });
          }
        }
      },
    },
  };
}
