import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const routes = [
  ['/', 'NoCharge — Play, explore, get things done', true],
  ['/arcade/', 'Arcade | NoCharge', true],
  ['/experiences/', 'App Experiences | NoCharge', true],
  ['/tools/', 'Tools | NoCharge', true],
  ['/guides/', 'Guides | NoCharge', true],
  ['/discover/', 'Discover the NoCharge library', true],
  ['/search/', 'Search NoCharge', false],
  ['/shop/', 'Shop | NoCharge', false],
  ['/about/', 'About NoCharge', false],
  ['/contact/', 'Contact NoCharge', false],
  ['/advertising/', 'Advertising Disclosure | NoCharge', true],
  ['/privacy/', 'Privacy | NoCharge', true],
  ['/terms/', 'Terms of Use | NoCharge', true],
];

for (const [route, expectedTitle, indexable] of routes) {
  const parts = route.split('/').filter(Boolean);
  const file = parts.length ? path.join(dist, ...parts, 'index.html') : path.join(dist, 'index.html');
  const html = await readFile(file, 'utf8');
  assert.ok(html.includes(`<title>${expectedTitle}</title>`), `page title exists for ${route}`);
  assert.ok(html.includes('<html lang="en" data-event="none"'), `prerendered HTML remains event-neutral for ${route}`);
  assert.ok(html.includes('id="main-content"'), `server-rendered page shell exists for ${route}`);
  assert.ok(html.includes(`data-prerendered-path="${route}"`), `route-specific prerender marker exists for ${route}`);
  assert.ok(!html.includes('href="/shop/"') && !html.includes('https://store.nocharge.net'), `store links are hidden on ${route}`);
  assert.ok(new RegExp('<a[^>]*href="/advertising/"[^>]*>Advertising Disclosure</a>', 'u').test(html), `legal/footer navigation exposes the advertising route in ${route}`);
  assert.ok(!html.includes('__SEO_'), `SEO placeholders were replaced for ${route}`);
  assert.ok(html.includes(indexable ? 'name="robots" content="index,follow"' : 'name="robots" content="noindex,follow"'), `robots directive is correct for ${route}`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const references = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/));
  assert.deepEqual(duplicateIds, [], `duplicate IDs are absent on ${route}`);
  assert.deepEqual(references.filter((id) => !ids.includes(id)), [], `aria-labelledby targets exist on ${route}`);
}

const home = await readFile(path.join(dist, 'index.html'), 'utf8');
assert.ok(home.includes('<html lang="en" data-event="none" data-event-preference="auto">'), 'prerendered HTML remains event-neutral and deterministic');
assert.ok(home.includes('id="nocharge-holiday-calendar" type="application/json">['), 'the early client bootstrap receives the typed holiday registry');
assert.ok(!home.includes('__NOCHARGE_HOLIDAY_CALENDAR_JSON__'), 'holiday registry marker was replaced during prerender');
assert.ok(home.includes('id="home-title"'), 'home is pre-rendered');
const holidayRegistryMatch = home.match(/<script id="nocharge-holiday-calendar" type="application\/json">([^<]+)<\/script>/);
assert.ok(holidayRegistryMatch, 'pre-paint holiday resolver has its event registry');
const holidayRegistry = JSON.parse(holidayRegistryMatch[1]);
assert.equal(holidayRegistry.length, 16, 'all requested event dates and the winter range are registered');
const eventPalettes = await readFile(path.join(root, 'src/theme/event-palettes.css'), 'utf8');
for (const event of holidayRegistry) {
  assert.ok(eventPalettes.includes(`:root[data-theme="light"][data-event="${event.id}"]`), `light palette is scoped for ${event.id}`);
  assert.ok(eventPalettes.includes(`:root[data-theme="dark"][data-event="${event.id}"]`), `dark palette is scoped for ${event.id}`);
}
assert.ok(home.includes('id="structured-data"'), 'home has WebSite structured data');
assert.ok(!home.includes('/shop/') && !home.includes('store.nocharge.net'), 'home contains no store link or destination reference');
assert.ok(home.includes('og:image" content="https://nocharge.net/og-nocharge.png'), 'Open Graph image is configured');
await readFile(path.join(dist, '.nojekyll'), 'utf8');

const notFound = await readFile(path.join(dist, '404.html'), 'utf8');
assert.ok(notFound.includes('This page isn’t here.'), 'custom 404 is pre-rendered');
assert.ok(notFound.includes('noindex,nofollow'), '404 is excluded from indexing');
assert.ok(notFound.includes('data-prerendered-path="/__nocharge_not_found__/"'), '404 is marked separately so an unknown URL is not hydrated as a valid route');

const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
assert.ok(sitemap.includes('<loc>https://nocharge.net/</loc>'), 'sitemap contains the indexable homepage');
for (const route of ['/arcade/', '/experiences/', '/tools/', '/guides/', '/discover/']) {
  assert.ok(sitemap.includes(`<loc>https://nocharge.net${route}</loc>`), `published directory is in the sitemap: ${route}`);
}
assert.ok(!sitemap.includes('/search/'), 'query search is excluded from the sitemap');
assert.ok(!sitemap.includes('/shop/'), 'structural Shop is excluded from the sitemap');
assert.ok(sitemap.includes('<loc>https://nocharge.net/advertising/</loc>'), 'the current V2 advertising disclosure route is included in the sitemap');

const css = await readFile(path.join(root, 'src/styles.css'), 'utf8');
assert.ok(css.includes('@media (max-width: 930px)'), 'tablet/mobile navigation breakpoint exists');
assert.ok(css.includes('@media (max-width: 680px)'), 'mobile-first layout breakpoint exists');
assert.ok(css.includes(':focus-visible'), 'visible keyboard focus styles exist');
assert.ok(css.includes('prefers-reduced-motion'), 'reduced-motion support exists');
assert.ok(css.includes('.mobile-menu-toggle'), 'mobile navigation control styles exist');

const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
assert.ok(robots.includes('Sitemap: https://nocharge.net/sitemap.xml'), 'robots points to the generated sitemap');

console.log(`Static smoke checks passed for ${routes.length} routes, 404, SEO, sitemap, navigation, and responsive/accessibility hooks.`);
