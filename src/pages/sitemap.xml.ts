import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { TOOLS } from '../config/tools';
import { DAILY_SLOTS } from '../config/dailies';

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL('https://nocharge.net');
  const games = (await getCollection('games'))
    .filter((game) => !game.data.draft)
    .sort((a, b) => a.data.order - b.data.order);
  const guides = (await getCollection('guides'))
    .filter((guide) => !guide.data.draft)
    .sort((a, b) => a.data.order - b.data.order);
  const articles = (await getCollection('articles'))
    .filter((article) => !article.data.draft)
    .sort((a, b) => a.data.title.localeCompare(b.data.title));
  const setup = (await getCollection('setup')).filter((entry) => !entry.data.draft);
  const curatedCollections = (await getCollection('collections'))
    .filter((collection) => !collection.data.draft)
    .sort((a, b) => a.data.order - b.data.order);
  const learn = (await getCollection('learn')).filter((entry) => !entry.data.draft);
  const paths = [
    '/',
    '/arcade/',
    ...games.map((game) => `/games/${game.id}/`),
    ...DAILY_SLOTS.filter((slot) => slot.status === 'live').map((slot) => `/games/${slot.slug}/?daily=1`),
    '/daily/',
    '/guides/',
    ...guides.map((guide) => `/guides/${guide.id}/`),
    '/articles/',
    ...articles.map((article) => `/articles/${article.id}/`),
    '/articles/registry-facts/',
    '/learn/',
    ...learn.map((entry) => `/learn/${entry.id}/`),
    '/learn/glossary/',
    '/setup/',
    ...setup.map((entry) => `/setup/${entry.id}/`),
    '/collections/',
    ...curatedCollections.map((collection) => `/collections/${collection.id}/`),
    '/about/',
    '/media/',
    '/help/',
    '/contact/',
    '/tools/',
    ...TOOLS.map((tool) => `/tools/${tool.slug}/`),
    '/terms/',
    '/advertising/',
    '/privacy/',
    '/accessibility/',
    '/search/',
  ];
  const urls = paths
    .map((path) => `  <url><loc>${new URL(path, origin).toString()}</loc></url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    },
  );
};
