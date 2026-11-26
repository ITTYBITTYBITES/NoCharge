import { getPublishedBySection } from '../../content/registry';

export interface ToolGameFact {
  slug: string;
  title: string;
  summary: string;
  category: string;
  genres: readonly string[];
  sessionMin: number;
  sessionMax: number;
  players: 'solo' | 'pass-and-play';
  pressure: 'timed' | 'untimed' | 'either';
  inputs: readonly ('keyboard' | 'pointer' | 'touch')[];
  keyboardComplete: boolean;
}

/*
 * Small, tool-owned estimates for the currently published V2 game entries.
 * This overlay intentionally leaves Arcade registry records untouched. Session
 * ranges are planning estimates, not measurements or completion promises.
 */
const pickerFacts: Readonly<Record<string, Omit<ToolGameFact, 'slug' | 'title' | 'summary' | 'category'>>> = {
  'pattern-pairs': {
    genres: ['Memory', 'Logic'],
    sessionMin: 2,
    sessionMax: 5,
    players: 'solo',
    pressure: 'untimed',
    inputs: ['keyboard', 'pointer', 'touch'],
    keyboardComplete: true,
  },
  'sum-sprint': {
    genres: ['Math', 'Quick'],
    sessionMin: 1,
    sessionMax: 1,
    players: 'solo',
    pressure: 'timed',
    inputs: ['keyboard', 'pointer', 'touch'],
    keyboardComplete: true,
  },
};

export function getToolGameFacts(): ToolGameFact[] {
  return getPublishedBySection('arcade').flatMap((entry) => {
    const facts = pickerFacts[entry.slug];
    return facts ? [{
      slug: entry.slug,
      title: entry.title,
      summary: entry.summary,
      category: entry.category,
      ...facts,
    }] : [];
  });
}
