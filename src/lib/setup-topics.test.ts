import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  SETUP_TOPIC_IDS,
  SETUP_TOPIC_LABELS,
  countByPrimaryTopic,
  formatGuideCount,
} from './setup-topics';

const CONTENT_DIRECTORY = join(process.cwd(), 'src', 'content', 'setup');

/** Minimal frontmatter reader: the collection loader is not available here. */
function readSetupFrontmatter() {
  return readdirSync(CONTENT_DIRECTORY)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(join(CONTENT_DIRECTORY, file), 'utf8');
      const frontmatter = raw.split('---')[1] ?? '';
      const value = (key: string) => frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
      return {
        id: file.replace(/\.md$/, ''),
        topic: value('topic') ?? '',
        topics: (value('topics') ?? '').replace(/[[\]]/g, '').split(',').map((t) => t.trim()).filter(Boolean),
        artwork: value('artwork') ?? '',
        draft: value('draft') === 'true',
      };
    });
}

describe('Quiet Setup topic counts', () => {
  const articles = readSetupFrontmatter();

  it('reads the eight published launch articles', () => {
    expect(articles.filter((a) => !a.draft)).toHaveLength(8);
  });

  it('counts each published article exactly once, under its primary topic', () => {
    const counts = countByPrimaryTopic(articles);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

    expect(total).toBe(articles.filter((a) => !a.draft).length);
    expect(counts).toEqual({
      keyboards: 2,
      'pointing-devices': 1,
      'screens-and-stands': 2,
      'desk-and-comfort': 2,
      'offline-puzzles': 1,
    });
  });

  it('never reports the inflated secondary-tag total the index used to display', () => {
    // The published index summed every entry of `topics`, producing
    // 4 / 3 / 3 / 7 / 2 = 19 "launch guides in the feed" for eight articles.
    const taggedTotal = articles
      .filter((a) => !a.draft)
      .reduce((sum, article) => sum + article.topics.length, 0);
    const primaryTotal = Object.values(countByPrimaryTopic(articles)).reduce((sum, n) => sum + n, 0);

    expect(taggedTotal).toBeGreaterThan(primaryTotal);
    expect(primaryTotal).toBe(8);
  });

  it('uses singular wording for one guide and plural for the rest', () => {
    const counts = countByPrimaryTopic(articles);
    expect(formatGuideCount(counts['pointing-devices'])).toBe('1 guide');
    expect(formatGuideCount(counts.keyboards)).toBe('2 guides');
    expect(formatGuideCount(0)).toBe('0 guides');
    expect(formatGuideCount(1)).toBe('1 guide');
  });

  it('labels every topic the index can render', () => {
    for (const id of SETUP_TOPIC_IDS) expect(SETUP_TOPIC_LABELS[id]).toBeTruthy();
    for (const article of articles) expect(SETUP_TOPIC_IDS).toContain(article.topic);
  });

  it('gives every published article its own illustration so adjacent cards never repeat', () => {
    const artwork = articles.filter((a) => !a.draft).map((a) => a.artwork);
    expect(artwork).toHaveLength(8);
    expect(new Set(artwork).size).toBe(8);
  });
});
