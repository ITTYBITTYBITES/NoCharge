import { getSectionDefinition } from '../content/sections';
import { getPublishedEntries } from '../content/registry';
import type { CatalogEntry, PublishedCatalogEntry } from '../content/schemas';

export interface SearchDocument {
  id: string;
  kind: PublishedCatalogEntry['kind'];
  section: PublishedCatalogEntry['section'];
  title: string;
  excerpt: string;
  summary: string;
  category: string;
  href: string;
  keywords: readonly string[];
  featured: boolean;
  updatedAt: string;
}

export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, ' ').trim();
}

export function createSearchIndex(entries: readonly CatalogEntry[] = getPublishedEntries()): SearchDocument[] {
  return getPublishedEntries(entries).map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    section: entry.section,
    title: entry.title,
    excerpt: entry.summary,
    summary: entry.summary,
    category: entry.category,
    href: `${getSectionDefinition(entry.section).path}${entry.slug}/`,
    keywords: [...entry.tags],
    featured: entry.featured,
    updatedAt: entry.updatedAt,
  }));
}

/** Derived only from published registry records; there is no manually maintained search catalog. */
export const searchIndex: readonly SearchDocument[] = createSearchIndex();

function relevance(document: SearchDocument, queryTerms: readonly string[]): number {
  const title = normalizeSearchText(document.title);
  const summary = normalizeSearchText(document.summary);
  const category = normalizeSearchText(document.category);
  const section = normalizeSearchText(getSectionDefinition(document.section).title);
  const keywords = normalizeSearchText(document.keywords.join(' '));
  const allText = `${title} ${summary} ${category} ${section} ${keywords}`;
  if (!queryTerms.every((term) => allText.includes(term))) return 0;

  return queryTerms.reduce((score, term) => {
    if (title === term) return score + 12;
    if (title.startsWith(term)) return score + 9;
    if (title.includes(term)) return score + 6;
    if (category.includes(term)) return score + 4;
    if (keywords.includes(term)) return score + 3;
    if (section.includes(term)) return score + 2;
    return score + 1;
  }, 0);
}

export function searchSite(query: string, documents: readonly SearchDocument[] = searchIndex): SearchDocument[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const queryTerms = [...new Set(normalized.split(/\s+/u))];
  return documents
    .map((document) => ({ document, score: relevance(document, queryTerms) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score
      || Number(right.document.featured) - Number(left.document.featured)
      || right.document.updatedAt.localeCompare(left.document.updatedAt)
      || left.document.title.localeCompare(right.document.title))
    .map(({ document }) => document);
}
