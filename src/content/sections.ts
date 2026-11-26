import type { ContentSection, SectionDefinition } from './schemas';

export const CONTENT_SECTIONS: readonly SectionDefinition[] = [
  {
    id: 'arcade',
    title: 'Arcade',
    eyebrow: '01 / Play',
    description: 'Small, complete browser games for a thoughtful break: clear rules, no downloads, and a fresh round whenever you want one.',
    path: '/arcade/',
    icon: 'arcade',
    assetIconId: null,
  },
  {
    id: 'experiences',
    title: 'App Experiences',
    eyebrow: '02 / Try',
    description: 'Browse static app and game-release showcases alongside editorial product overviews, with clear platform notes and official destinations.',
    path: '/experiences/',
    icon: 'apps',
    assetIconId: null,
  },
  {
    id: 'tools',
    title: 'Tools',
    eyebrow: '03 / Make it useful',
    description: 'Practical browser utilities that do their work locally, show their results plainly, and leave you in control of your input.',
    path: '/tools/',
    icon: 'tools',
    assetIconId: 'tools-section',
  },
  {
    id: 'guides',
    title: 'Guides',
    eyebrow: '04 / Learn',
    description: 'Carefully structured, original articles with useful context, concrete steps, and references to help you act on what you learn.',
    path: '/guides/',
    icon: 'guides',
    assetIconId: 'guides-section',
  },
];

export function getSectionDefinition(section: ContentSection): SectionDefinition {
  const definition = CONTENT_SECTIONS.find((candidate) => candidate.id === section);
  if (!definition) throw new Error(`Unknown content section: ${section}`);
  return definition;
}

export function getContentPath(entry: { section: ContentSection; slug: string }): string {
  return `${getSectionDefinition(entry.section).path}${entry.slug}/`;
}
