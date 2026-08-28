/**
 * Site search index + matching.
 *
 * The index is a small build-time JSON document (see
 * `src/pages/search-index.json.ts`) covering every published game, guide,
 * article, setup note, learn page, collection, changelog entry, tool, and the
 * main utility pages. Matching runs entirely in the browser against that
 * static file: no search service, no query sent anywhere, no account.
 */

export type SearchKind = 'game' | 'guide' | 'article' | 'setup' | 'learn' | 'collection' | 'changelog' | 'tool' | 'page';

export interface SearchEntry {
  /** Absolute path with trailing slash, e.g. `/games/nonogram/`. */
  url: string;
  title: string;
  kind: SearchKind;
  /** Human label for the kind, e.g. "Game" or "Guide". */
  kindLabel: string;
  description: string;
  /** Words worth boosting on (genre, topic, synonyms). Already lowercase. */
  keywords: string[];
}

export interface SearchMatch {
  entry: SearchEntry;
  score: number;
  /** Which query terms hit, for accessible result messaging. */
  matchedTerms: string[];
}

const KIND_LABELS: Record<SearchKind, string> = {
  game: 'Game',
  guide: 'Guide',
  article: 'Article',
  setup: 'Setup',
  learn: 'Learn',
  collection: 'Collection',
  changelog: 'Changelog',
  tool: 'Tool',
  page: 'Page',
};

export function searchKindLabel(kind: SearchKind): string {
  return KIND_LABELS[kind] ?? 'Page';
}

/** Split a query/body into lowercase alphanumeric word tokens. */
export function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function normalizeText(entry: SearchEntry): string {
  return `${entry.title} ${entry.description} ${entry.keywords.join(' ')}`.toLowerCase();
}

/** Title tokens rank far above body tokens; kind label adds a small tie break. */
function entryRankBoost(entry: SearchEntry): number {
  if (entry.kind === 'game') return 6;
  if (entry.kind === 'guide' || entry.kind === 'tool') return 4;
  if (entry.kind === 'article' || entry.kind === 'learn') return 3;
  return 1;
}

/**
 * Score one entry against the query terms. Returns null when any term fails
 * to match (AND semantics keep the shortlist honest on multi-word queries).
 *
 * Per term: an exact title match is strongest, a title prefix is next, a body
 * (description/keyword) match is weaker, and a body prefix sits in between.
 */
export function scoreEntry(entry: SearchEntry, terms: string[]): SearchMatch | null {
  const title = entry.title.toLowerCase();
  const titleTokens = tokenize(entry.title);
  const body = normalizeText(entry);
  const bodyTokens = new Set(tokenize(body));
  const matchedTerms: string[] = [];
  let score = entryRankBoost(entry);

  for (const term of terms) {
    const exactTitle = titleTokens.includes(term);
    const titlePrefix = !exactTitle && titleTokens.some((token) => token.startsWith(term));
    const titleContains = !exactTitle && !titlePrefix && title.includes(term);
    const bodyToken = bodyTokens.has(term);
    const bodyPrefix = !bodyToken && [...bodyTokens].some((token) => token.startsWith(term));
    const bodyContains = body.includes(term);

    if (exactTitle) score += 100;
    else if (titlePrefix) score += 55;
    else if (titleContains) score += 40;
    else if (bodyToken) score += 22;
    else if (bodyPrefix) score += 12;
    else if (bodyContains) score += 8;
    else return null;

    matchedTerms.push(term);
  }

  return { entry, score, matchedTerms };
}

/**
 * Search the index. Empty queries return nothing (the page shows guidance
 * instead of a wall of results). Results are grouped by score then title.
 */
export function searchSite(entries: SearchEntry[], query: string, limit = 30): SearchMatch[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const matches: SearchMatch[] = [];
  for (const entry of entries) {
    const match = scoreEntry(entry, terms);
    if (match) matches.push(match);
  }
  matches.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
  return matches.slice(0, limit);
}

/** Parse `?q=` for a shareable, SSR-friendly initial query. */
export function readSearchQuery(value: string | null): string {
  return (value ?? '').trim().slice(0, 120);
}
