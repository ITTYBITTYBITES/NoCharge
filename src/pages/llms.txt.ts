import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { TOOLS } from '../config/tools';

/**
 * A2 — llms.txt at the site root (https://llmstxt.org/ shape).
 *
 * Built from the same content collections as the rest of the site so the
 * catalog, sitemap and this file cannot drift. Update the hub links when
 * catalog hubs change; the lists below stay automatic.
 */
export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL('https://nocharge.net');
  const games = (await getCollection('games')).filter((game) => !game.data.draft).sort((a, b) => a.data.order - b.data.order);
  const guides = (await getCollection('guides')).filter((guide) => !guide.data.draft).sort((a, b) => a.data.order - b.data.order);
  const collections = (await getCollection('collections')).filter((collection) => !collection.data.draft).sort((a, b) => a.data.order - b.data.order);
  const platformArticles = (await getCollection('articles')).filter((article) => !article.data.draft && article.data.kind === 'platform').sort((a, b) => a.data.title.localeCompare(b.data.title));

  const links = (items: { id: string; title: string; extra?: string }[]) => items
    .map((item) => `- [${item.title}](${new URL(item.id, origin).toString()})${item.extra ? ` — ${item.extra}` : ''}`)
    .join('\n');

  const text = `# NoCharge

> NoCharge is a quiet arcade of free browser games — no accounts, no cloud
> profiles, and scores that stay in the browser. Every game has documented
> controls, a full guide, calm default settings, and ads kept outside gameplay.

Key details:

- Free model: every game and tool opens with no account, subscription, or download.
- Local-only scores and progress: localStorage only; no server-side profiles or cross-device sync.
- Quiet Arcade voice: calm defaults, untimed modes where the genre allows, reduced-motion support.
- Ads: one labeled AdSense banner before the footer on eligible pages; never inside the game canvas or play loop.
- Consent: analytics stays off until the visitor allows it; advertising choices use Google's Privacy & messaging message.
- Accessibility: visible focus, documented keyboard paths where the game supports them, non-color-critical states in Color Flip, and \`prefers-reduced-motion\` honored.
- Honesty limits: no fake rankings, no claims of cognitive benefit, no "works on every network" promises. School or locked-network play depends on the local network.

## Games / Arcade

- [Arcade](${new URL('/arcade/', origin).toString()}) — all games with filters, registry dates, and Pass & Play section
- Sitemap (machine list): ${new URL('/sitemap.xml', origin).toString()}

${links(games.map((game) => ({ id: `/games/${game.id}/`, title: game.data.title, extra: game.data.tagline })))}

## Guides

- [All guides](${new URL('/guides/', origin).toString()})

${links(guides.map((guide) => ({ id: `/guides/${guide.id}/`, title: guide.data.title })))}

## Collections

- [All collections](${new URL('/collections/', origin).toString()})

${links(collections.map((collection) => ({ id: `/collections/${collection.id}/`, title: collection.data.title, extra: collection.data.description })))}

## Tools

- [All tools](${new URL('/tools/', origin).toString()})

${TOOLS.map((tool) => `- [${tool.title}](${new URL(`/tools/${tool.slug}/`, origin).toString()}) — ${tool.description}`).join('\n')}

## Articles / Trust

- [All articles](${new URL('/articles/', origin).toString()})
- [Accessibility test matrix](${new URL('/accessibility/', origin).toString()})
- [Advertising policy](${new URL('/advertising/', origin).toString()})
- [Changelog](${new URL('/changelog/', origin).toString()})

${links(platformArticles.map((article) => ({ id: `/articles/${article.id}/`, title: article.data.title, extra: article.data.description })))}

## Setup

- [Quiet Setup hub](${new URL('/setup/', origin).toString()}) — ${'practical guides for keyboards, pointing devices, screens, desks, offline puzzles, audio, and lighting'}

## Daily

- [Daily hub](${new URL('/daily/', origin).toString()}) — date-seeded local dailies; streaks stay on this device

## Trust and policies

- [About](${new URL('/about/', origin).toString()})
- [Privacy](${new URL('/privacy/', origin).toString()})
- [Accessibility](${new URL('/accessibility/', origin).toString()})
- [Terms](${new URL('/terms/', origin).toString()})
- [Contact](${new URL('/contact/', origin).toString()})
- [Media kit](${new URL('/media/', origin).toString()})
- [Registry facts](${new URL('/articles/registry-facts/', origin).toString()})
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
