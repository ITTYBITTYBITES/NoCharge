import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildFacts,
  matchesFacets,
  parseSessionRange,
  relatedGames,
  validateCatalog,
  type CatalogEntryLike,
  type GameFacts,
} from './game-catalog';

/** Read the published game frontmatter without Astro's virtual module. */
function readPublishedEntries(): CatalogEntryLike[] {
  const dir = join(process.cwd(), 'src/content/games');
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(join(dir, file), 'utf8');
      const value = (key: string) => raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
      return {
        id: file.replace(/\.md$/, ''),
        data: {
          title: value('title'),
          tagline: value('tagline'),
          genre: value('genre'),
          session: value('session'),
          artwork: {
            coverSquareFallback: value('coverSquareFallback') || undefined,
            coverLandscapeFallback: value('coverLandscapeFallback') || undefined,
          },
        },
      };
    });
}

describe('game catalog', () => {
  it('parses session ranges from published labels', () => {
    expect(parseSessionRange('5–20 min')).toEqual({ min: 5, max: 20 });
    expect(parseSessionRange('1–3 min per round')).toEqual({ min: 1, max: 3 });
    expect(parseSessionRange('About 8 min')).toEqual({ min: 4, max: 8 });
  });

  it('every published game markdown file has a consistent catalog entry', () => {
    const entries = readPublishedEntries();
    expect(entries.length).toBeGreaterThanOrEqual(17);
    const errors = validateCatalog(entries);
    expect(errors).toEqual([]);
    for (const entry of entries) {
      const facts = buildFacts(entry);
      expect(facts.sessionMax).toBeGreaterThanOrEqual(facts.sessionMin);
      expect(facts.inputs.length).toBeGreaterThan(0);
      expect(facts.storageKeys.length).toBeGreaterThan(0);
      if (facts.hasKeyboardComplete) expect(facts.inputs).toContain('keyboard');
    }
  });

  it('facet filters behave honestly', () => {
    const base: GameFacts = {
      slug: 'x', title: 'X', blurb: '', genre: 'Logic', sessionLabel: '5–10 min',
      sessionMin: 5, sessionMax: 10, players: 'solo', inputs: ['keyboard', 'pointer', 'touch'],
      pressure: 'untimed', isOriginal: false, releasedAt: '2026-01-01', updatedAt: '2026-01-01',
      storageKeys: [], hasKeyboardComplete: true, guideSlug: 'x', artSquare: '', artLandscape: '',
    };
    expect(matchesFacets(base, { maxSession: 10, keyboardComplete: true })).toBe(true);
    expect(matchesFacets(base, { maxSession: 9 })).toBe(false);
    expect(matchesFacets(base, { pressure: 'timed' })).toBe(false);
    expect(matchesFacets(base, { pressure: 'untimed' })).toBe(true);
    expect(matchesFacets(base, { players: 'pass-and-play' })).toBe(false);
  });

  it('related games prefer same genre then nearest session', () => {
    const a: GameFacts = { slug: 'a', title: 'A', blurb: '', genre: 'Logic', sessionLabel: '5–10 min', sessionMin: 5, sessionMax: 10, players: 'solo', inputs: ['keyboard'], pressure: 'untimed', isOriginal: false, releasedAt: '', updatedAt: '', storageKeys: [], hasKeyboardComplete: true, guideSlug: 'a', artSquare: '', artLandscape: '' };
    const b: GameFacts = { ...a, slug: 'b', title: 'B', genre: 'Word', sessionMax: 15 };
    const c: GameFacts = { ...a, slug: 'c', title: 'C', genre: 'Logic', sessionMax: 11 };
    const result = relatedGames(a, [a, b, c], 2);
    expect(result.map((f) => f.slug)).toEqual(['c', 'b']);
  });
});
