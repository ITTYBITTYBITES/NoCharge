import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const vite = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const escapeHtml = (value = '') => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

try {
  const [{ render }, site, themes] = await Promise.all([
    vite.ssrLoadModule('/src/entry-server.tsx'),
    vite.ssrLoadModule('/src/site.ts'),
    vite.ssrLoadModule('/src/theme/holidayCalendar.ts'),
  ]);
  const calendarJson = JSON.stringify(themes.holidayCalendar)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
  const baseTemplate = (await readFile(path.join(dist, 'index.html'), 'utf8'))
    .replaceAll('__NOCHARGE_HOLIDAY_CALENDAR_JSON__', calendarJson);
  if (baseTemplate.includes('__NOCHARGE_HOLIDAY_CALENDAR_JSON__')) {
    throw new Error('Holiday calendar JSON was not embedded in the HTML template.');
  }

  const templateForRoute = (routePath) => {
    const template = baseTemplate.replace('__NOCHARGE_PRERENDER_PATH__', escapeHtml(routePath));
    if (template.includes('__NOCHARGE_PRERENDER_PATH__')) {
      throw new Error(`Prerender route marker was not replaced for ${routePath}.`);
    }
    return template;
  };

  const withSEO = (template, seo) => {
    const jsonLd = seo.structuredData
      ? JSON.stringify(seo.structuredData).split('<').join(String.fromCharCode(92) + 'u003c')
      : '';
    let html = template
      .replaceAll('__SEO_TITLE__', escapeHtml(seo.title))
      .replaceAll('__SEO_DESCRIPTION__', escapeHtml(seo.description))
      .replaceAll('__SEO_ROBOTS__', escapeHtml(seo.robots))
      .replaceAll('__OG_TITLE__', escapeHtml(seo.title))
      .replaceAll('__OG_DESCRIPTION__', escapeHtml(seo.description))
      .replaceAll('__OG_URL__', escapeHtml(seo.canonical ?? ''))
      .replaceAll('__SEO_JSONLD__', jsonLd);

    if (!seo.structuredData) {
      html = html.replace('<script id="structured-data" type="application/ld+json"></script>', '');
    }
    if (seo.canonical) {
      html = html.replace(
        '<link rel="canonical" href="__SEO_CANONICAL__" />',
        `<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`,
      );
    } else {
      html = html.replace('<link rel="canonical" href="__SEO_CANONICAL__" />', '');
    }
    return html;
  };

  for (const route of site.prerenderPages) {
    const html = withSEO(templateForRoute(route.path), route.seo).replace('<!--app-html-->', await render(route.path));
    const routeParts = route.path.split('/').filter(Boolean);
    const output = routeParts.length === 0
      ? path.join(dist, 'index.html')
      : path.join(dist, ...routeParts, 'index.html');
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html, 'utf8');
    console.log(`  prerendered ${route.path}`);
  }

  const notFoundHtml = withSEO(templateForRoute('/__nocharge_not_found__/'), site.NOT_FOUND_SEO)
    .replace('<!--app-html-->', await render('/__nocharge_not_found__/'));
  await writeFile(path.join(dist, '404.html'), notFoundHtml, 'utf8');

  const urls = site.indexablePaths
    .map((route) => `  <url><loc>${escapeHtml(new URL(route, site.SITE_URL).toString())}</loc></url>`)
    .join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(path.join(dist, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`  generated sitemap.xml (${site.indexablePaths.length} indexable URL${site.indexablePaths.length === 1 ? '' : 's'})`);
} finally {
  await vite.close();
}
