import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { TOOLS } from '../config/tools';
import { searchKindLabel, type SearchEntry, type SearchKind } from '../lib/search';

/**
 * Build-time search index. A static JSON file shipped with the site; the
 * `/search/` page fetches it and ranks entirely in the browser. Nothing a
 * visitor types is sent to a server.
 */

function entry(url: string, title: string, kind: SearchKind, description: string, keywords: string[] = []): SearchEntry {
  return { url, title, kind, kindLabel: searchKindLabel(kind), description: description.trim(), keywords };
}

function keywordsFromTopics(topics: unknown): string[] {
  return Array.isArray(topics) ? topics.map((topic) => String(topic).toLowerCase()).filter(Boolean) : [];
}

export const GET: APIRoute = async () => {
  const [games, guides, articles, setup, learn, collections, changelog] = await Promise.all([
    getCollection('games'),
    getCollection('guides'),
    getCollection('articles'),
    getCollection('setup'),
    getCollection('learn'),
    getCollection('collections'),
    getCollection('changelog'),
  ]);

  const index: SearchEntry[] = [
    // Standalone pages first; order does not affect ranking.
    entry('/', 'NoCharge home', 'page', 'Quick, calm browser games with no account required. Play solo or pass and play on one device.', ['home', 'quiet arcade', 'no account']),
    entry('/arcade/', 'Arcade', 'page', 'Browse every NoCharge game: solitaire, puzzles, word games, and two-player pass and play titles.', ['all games', 'play']),
    entry('/daily/', 'Daily hub', 'page', 'One featured game per day, with a fresh seeded run each day.', ['daily', 'today']),
    entry('/guides/', 'Game guides', 'page', 'Rules, controls, scoring details, accessibility notes, and strategies for every game.', ['help', 'how to play', 'rules']),
    entry('/articles/', 'Articles', 'page', 'Editorial articles about quiet play, accessibility, privacy, and setup.', ['blog', 'editorial']),
    entry('/tools/', 'Tools', 'page', 'Free client-side tools: game finders, accessibility checks, setup calculators, and the ambient mixer.', ['utilities']),
    entry('/learn/', 'Learn', 'page', 'Plain explainers about the quiet arcade, pass and play, privacy, no accounts, and pressure-free play.', ['about', 'explainers']),
    entry('/setup/', 'Setup notes', 'page', 'Reviewed notes about keyboards, pointing devices, screens, desk comfort, audio, and lighting.', ['equipment', 'hardware', 'ergonomics']),
    entry('/collections/', 'Collections', 'page', 'Curated game collections with a stated inclusion method: keyboard-friendly, untimed, no accounts, and short breaks.', ['curated', 'lists']),
    entry('/help/', 'Help', 'page', 'How sound, saves, daily runs, and controls work on NoCharge.', ['support', 'faq', 'sound']),
    entry('/about/', 'About NoCharge', 'page', 'What NoCharge is: a small, calm, general-audience browser game site with no accounts.', ['about', 'mission']),
    entry('/accessibility/', 'Accessibility', 'page', 'How NoCharge approaches keyboard play, reduced motion, contrast, touch targets, and screen readers.', ['a11y', 'wcag']),
    entry('/my-arcade/', 'My Arcade', 'page', 'Local-only saved progress, best scores, and recently played games stored in this browser.', ['saves', 'progress', 'scores']),
    entry('/changelog/', 'Changelog', 'page', 'A timeline of launches, updates, artwork, privacy, and quality changes.', ['updates', 'history']),
    entry('/privacy/', 'Privacy', 'page', 'What NoCharge stores locally, what is never collected, and how analytics and advertising choices work.', ['data', 'cookies', 'local storage']),
    entry('/contact/', 'Contact', 'page', 'Reach the NoCharge editor by email.', ['email', 'support']),

    ...TOOLS.map((tool) =>
      entry(`/tools/${tool.slug}/`, tool.title, 'tool', `${tool.description} Useful when ${tool.usefulWhen}`, ['tool', 'utility', tool.category]),
    ),

    ...games
      .filter((game) => !game.data.draft)
      .map((game) =>
        entry(
          `/games/${game.id}/`,
          game.data.title,
          'game',
          `${game.data.tagline}. ${game.data.description}`,
          [game.data.genre, game.data.difficulty, game.data.session, 'play', game.id],
        ),
      ),

    ...guides
      .filter((guide) => !guide.data.draft)
      .map((guide) =>
        entry(`/guides/${guide.id}/`, guide.data.title, 'guide', guide.data.description, [
          'guide',
          'rules',
          'how to play',
          guide.data.game,
        ]),
      ),

    ...articles
      .filter((article) => !article.data.draft)
      .map((article) =>
        entry(`/articles/${article.id}/`, article.data.title, 'article', article.data.description, [
          'article',
          ...keywordsFromTopics(article.data.topics),
        ]),
      ),

    ...setup
      .filter((note) => !note.data.draft)
      .map((note) =>
        entry(`/setup/${note.id}/`, note.data.title, 'setup', note.data.description, [
          'setup',
          note.data.topic,
          ...keywordsFromTopics(note.data.topics),
        ]),
      ),

    ...learn
      .filter((page) => !page.data.draft)
      .map((page) =>
        entry(`/learn/${page.id}/`, page.data.title, 'learn', page.data.description, ['learn', 'explainer', page.data.topic]),
      ),

    ...collections
      .filter((collection) => !collection.data.draft)
      .map((collection) =>
        entry(`/collections/${collection.id}/`, collection.data.title, 'collection', collection.data.description, [
          'collection',
          'curated',
        ]),
      ),

    ...changelog
      .filter((item) => !item.data.draft)
      .map((item) =>
        entry(`/changelog/#${item.id}`, item.data.title, 'changelog', item.data.summary, [
          'changelog',
          'update',
          item.data.type,
        ]),
      ),
  ];

  return new Response(JSON.stringify({ generated: new Date().toISOString().slice(0, 10), entries: index }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // The index changes only on deploy; allow shared caching while keeping
      // it fresh (stale-while-revalidate serves instantly then updates).
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
};
