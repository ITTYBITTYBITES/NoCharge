import { describe, expect, it } from 'vitest';
import { readSearchQuery, scoreEntry, searchKindLabel, searchSite, tokenize, type SearchEntry } from './search';

const entries: SearchEntry[] = [
  { url: '/games/nonogram/', title: 'Nonogram', kind: 'game', kindLabel: 'Game', description: 'A picture logic game where you fill a grid from row and column clues.', keywords: ['puzzle', 'logic', 'grid', 'play'] },
  { url: '/games/klondike/', title: 'Klondike Solitaire', kind: 'game', kindLabel: 'Game', description: 'The classic one-deck solitaire card game.', keywords: ['cards', 'solitaire', 'play'] },
  { url: '/guides/nonogram/', title: 'Nonogram guide', kind: 'guide', kindLabel: 'Guide', description: 'A guide to the rules, controls, and scoring for the Nonogram game.', keywords: ['guide', 'nonogram'] },
  { url: '/tools/ambient-mixer/', title: 'Ambient Mixer', kind: 'tool', kindLabel: 'Tool', description: 'Try ten calm procedural soundscapes between game sessions.', keywords: ['tool', 'audio'] },
  { url: '/about/', title: 'About NoCharge', kind: 'page', kindLabel: 'Page', description: 'A calm browser game site with no accounts.', keywords: ['about'] },
];

describe('site search matching', () => {
  it('tokenizes queries into lowercase alphanumeric words', () => {
    expect(tokenize('Klondike  Solitaire!')).toEqual(['klondike', 'solitaire']);
    expect(tokenize('  ')).toEqual([]);
    expect(tokenize('a-b_c')).toEqual([]);
    expect(tokenize('free-cell scoring')).toEqual(['free', 'cell', 'scoring']);
  });

  it('returns nothing for empty queries', () => {
    expect(searchSite(entries, '')).toEqual([]);
    expect(searchSite(entries, '   ')).toEqual([]);
  });

  it('finds games by title and ranks exact title matches above body matches', () => {
    const results = searchSite(entries, 'nonogram');
    expect(results.map((match) => match.entry.url)).toContain('/games/nonogram/');
    expect(results[0]?.entry.url).toBe('/games/nonogram/');
    // The game title ranks above the guide that merely mentions the name.
    expect(results.findIndex((m) => m.entry.url === '/games/nonogram/')).toBeLessThan(
      results.findIndex((m) => m.entry.url === '/guides/nonogram/'),
    );
  });

  it('matches multi-word queries with AND semantics', () => {
    const results = searchSite(entries, 'classic solitaire');
    expect(results).toHaveLength(1);
    expect(results[0]?.entry.url).toBe('/games/klondike/');
  });

  it('returns no matches when one term is absent', () => {
    expect(searchSite(entries, 'nonogram blackjack')).toEqual([]);
  });

  it('matches by keyword and description terms', () => {
    const audio = searchSite(entries, 'soundscapes');
    expect(audio[0]?.entry.url).toBe('/tools/ambient-mixer/');
    const cards = searchSite(entries, 'cards');
    expect(cards[0]?.entry.url).toBe('/games/klondike/');
  });

  it('reports every matched term', () => {
    const match = scoreEntry(entries[1]!, ['klondike', 'solitaire']);
    expect(match?.matchedTerms).toEqual(['klondike', 'solitaire']);
  });

  it('caps the result list at the limit', () => {
    // Every fixture describes a "game" somewhere in its text; the limit trims
    // that matching set down rather than changing the matching itself.
    expect(searchSite(entries, 'game', 30)).toHaveLength(entries.length);
    expect(searchSite(entries, 'game', 2)).toHaveLength(2);
  });

  it('trims and bounds the shareable query parameter', () => {
    expect(readSearchQuery('  solitaire  ')).toBe('solitaire');
    expect(readSearchQuery(null)).toBe('');
    expect(readSearchQuery('x'.repeat(200))).toHaveLength(120);
  });

  it('labels every supported result kind', () => {
    expect(searchKindLabel('game')).toBe('Game');
    expect(searchKindLabel('changelog')).toBe('Changelog');
  });
});
