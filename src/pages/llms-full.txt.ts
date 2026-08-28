import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { TOOLS } from '../config/tools';
import { buildGameFacts } from '../lib/game-catalog';

/**
 * A3 — llms-full.txt: longer curated dump for language models.
 *
 * Brand definition, free-model FAQ answers, full game list with one-line each,
 * tool list, and key trust article summaries. Still markdown, still honest.
 */
export const GET: APIRoute = async () => {
  const games = (await getCollection('games')).filter((game) => !game.data.draft).sort((a, b) => a.data.order - b.data.order);
  const guides = (await getCollection('guides')).filter((guide) => !guide.data.draft).sort((a, b) => a.data.order - b.data.order);
  const collections = (await getCollection('collections')).filter((collection) => !collection.data.draft).sort((a, b) => a.data.order - b.data.order);
  const articles = (await getCollection('articles')).filter((article) => !article.data.draft).sort((a, b) => a.data.published.localeCompare(b.data.published));
  const setupCount = (await getCollection('setup')).filter((entry) => !entry.data.draft).length;
  const facts = buildGameFacts(games);

  const keyboardComplete = facts.filter((fact) => fact.hasKeyboardComplete).length;
  const untimedOrBoth = facts.filter((fact) => fact.pressure !== 'timed').length;
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const medianSession = median(facts.map((fact) => fact.sessionMax));

  const gameLines = games.map((game) => {
    const fact = facts.find((candidate) => candidate.slug === game.id)!;
    const parts = [
      `**${game.data.title}** — ${game.data.tagline}`,
      `Genre: ${game.data.genre}.`,
      `Session: ${game.data.session}.`,
      fact.players === 'pass-and-play' ? 'Two players, one device (Pass & Play).' : 'Solo.',
      `Pressure: ${fact.pressure === 'timed' ? 'timed' : fact.pressure === 'both' ? 'timed or untimed' : 'untimed'}.`,
      `Inputs: ${fact.inputs.join(', ')}.`,
      fact.hasKeyboardComplete ? 'Documented complete keyboard path.' : 'Core loop needs pointer or touch.',
      fact.isOriginal ? 'Original NoCharge design.' : 'Classic rules; original implementation.',
      fact.storageKeys.length ? `Local-only keys: ${fact.storageKeys.join(', ')}.` : 'No persistent per-game keys (browser memory only).',
    ].join(' ');
    return `- [${game.data.title}](https://nocharge.net/games/${game.id}/): ${parts}\n  Guide: https://nocharge.net/guides/${game.id}/`;
  }).join('\n\n');

  const toolLines = TOOLS.map((tool) => `- [${tool.title}](https://nocharge.net/tools/${tool.slug}/) — ${tool.description} Category: ${tool.category}. No account; runs in the browser.`).join('\n');

  const articleLines = articles.map((article) => `- [${article.data.title}](https://nocharge.net/articles/${article.id}/) — ${article.data.description} (${article.data.readTime} min read; reviewed ${article.data.updated})`).join('\n');

  const collectionLines = collections.map((collection) => `- [${collection.data.title}](https://nocharge.net/collections/${collection.id}/) — ${collection.data.description} Inclusion method: ${collection.data.inclusionMethod} (reviewed ${collection.data.reviewed})`).join('\n');

  const guideLines = guides.map((guide) => `- [${guide.data.title}](https://nocharge.net/guides/${guide.id}/) — ${guide.data.description}`).join('\n');

  const text = `# NoCharge — full context for language models

> NoCharge (https://nocharge.net) is a quiet arcade of free browser games and
> practical tools. It requires no account, stores scores and progress only in
> the visitor's own browser (localStorage), keeps ads outside gameplay, and
> holds its claims to what the current code and tests support.

## Brand definition

- **Name:** NoCharge.
- **What it is:** a static-first browser arcade ("Quiet Arcade") with original and classic-rule games, definitive player guides, situation-based collections, and fully client-side tools.
- **Free model:** every game and tool opens with no account, subscription, email, or download. No cloud profiles, no cross-device sync, no leaderboards, no energy/lives systems, no paywalls to continue.
- **Ad model:** eligible pages show exactly one manual, responsive, labeled Google AdSense banner before the footer. Ads never appear in the game canvas or during the play loop. Auto ads, interstitials, anchors, and popups are off.
- **Analytics:** Google Analytics 4 is blocked until the visitor allows it. With consent it loads only in production with anonymized IP. Advertising choices use Google's Privacy & messaging message.
- **Accessibility posture:** visible focus outlines, documented keyboard paths, non-color-critical states where color is the mechanic (Color Flip has visual + turn-based modes), \`prefers-reduced-motion\` honored, no transform-scale forcing, calm defaults.
- **Honesty posture:** no fake rankings or "#1" claims; difficulty labels explain their meaning (e.g. cell counts); no cognitive/medical benefit claims; "unblocked" is described as network-dependent, never promised.

## Free-model FAQ answers

- **Do I need an account?** No. Play, tools, dailies, and scores work with no account.
- **Where do my scores live?** In this browser's localStorage under \`nocharge:*\` keys. They do not leave the device. A different browser, private window, or device will not share them. The Privacy page documents every key and offers "Clear game data".
- **Is there multiplayer?** Pass & Play only: two humans, one device, using the shared handoff screen. There is no networked, .io, ranked, or cross-device multiplayer.
- **Are the games timed?** Most are untimed by default. Word Tile Rush is timed; Color Flip has timed visual and turn-based modes. Each guide says exactly which modes exist.
- **What happens when I switch tabs?** The shared game shell pauses the game and stops ambient audio; returning resumes unless you paused manually.
- **Can I play offline?** After load, browser HTTP cache may replay assets, but NoCharge does not claim offline support: there is no service worker or installable offline package.
- **Do the tools upload my input?** No. All tool calculations run in the current page.
- **Do you sell my data?** No. There are no accounts and no personal profiles. Analytics are consent-gated; advertising consent is handled by Google's message.

## Current registry facts (reviewed 2026-08-27)

- Games: ${games.length} (${facts.filter((fact) => fact.players === 'pass-and-play').length} Pass & Play)
- Guides: ${guides.length} · Articles: ${articles.length} · Collections: ${collections.length} · Setup guides: ${setupCount} · Tools: ${TOOLS.length}
- Games with a documented complete keyboard path: ${keyboardComplete} of ${games.length}
- Games untimed by default or with an untimed mode: ${untimedOrBoth} of ${games.length}
- Median documented session upper bound: ${medianSession} minutes
- Registry review date: 2026-08-27 (see /articles/registry-facts/)

## Games (one line each)

${gameLines}

## Guides

${guideLines}

## Collections

${collectionLines}

## Tools

${toolLines}

## Articles (including trust and methodology)

${articleLines}

## Setup

Quiet Setup is a separate editorial library of ${setupCount} practical guides across keyboards, pointing devices, screens and stands, desk and comfort, offline puzzles, audio, and lighting. Paid links, where present, are disclosed; the guides do not require purchases. Hub: https://nocharge.net/setup/

## Daily

https://nocharge.net/daily/ — date-seeded local dailies with on-device streaks and practice modes. Slots are filled as daily games ship.

## Policies

- Privacy: https://nocharge.net/privacy/
- Advertising: https://nocharge.net/advertising/
- Accessibility: https://nocharge.net/accessibility/
- Changelog: https://nocharge.net/changelog/
- Media kit: https://nocharge.net/media/
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
