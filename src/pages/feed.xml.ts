import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const esc = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/**
 * General NoCharge RSS feed (/feed.xml).
 *
 * Items come from the changelog collection — the single source of truth for
 * meaningful public releases (new games, guides, articles, platform features,
 * significant updates). The feed contains no tracking pixels, no scripts and
 * no affiliate links; GUIDs are stable anchors on the changelog page.
 */
export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL('https://nocharge.net');
  const entries = (await getCollection('changelog'))
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.date.localeCompare(a.data.date) || a.data.title.localeCompare(b.data.title));

  const items = entries
    .map((entry) => {
      const itemUrl = new URL(`/changelog/#${entry.id}`, origin);
      return `    <item>
      <title>${esc(entry.data.title)}</title>
      <link>${itemUrl}</link>
      <guid isPermaLink="true">${itemUrl}</guid>
      <description>${esc(entry.data.summary)}</description>
      <pubDate>${new Date(`${entry.data.date}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${esc(entry.data.type)}</category>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NoCharge</title>
    <link>${new URL('/', origin)}</link>
    <atom:link href="${new URL('/feed.xml', origin)}" rel="self" type="application/rss+xml"/>
    <description>New games, guides, articles, and platform updates from NoCharge, the quiet browser arcade.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
