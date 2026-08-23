import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const gameIds = z.enum([
  'memory-match',
  'word-tile-rush',
  'color-flip',
  'beacon-lattice',
  'tic-tac-toe',
  'dots-and-boxes',
  'four-in-a-row',
  'reversi',
  'last-token',
  'pass-the-picture',
  'klondike',
  'freecell',
  'nonogram',
  'twenty-forty-eight',
  'tile-garden',
  'word-search',
  'mini-sudoku',
]);

const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: z.object({
    title: z.string(), tagline: z.string(), description: z.string(), emoji: z.string(),
    accent: z.string().default('#0f9d58'), tier: z.enum(['quick', 'signature']).default('quick'), runtime: gameIds,
    artwork: z.object({
      icon: z.string(), coverSquare: z.string(), coverSquareFallback: z.string(), coverLandscape: z.string(),
      coverLandscapeFallback: z.string(), guideHeader: z.string(), guideHeaderFallback: z.string(), socialCard: z.string(),
      socialCardFallback: z.string().optional(), socialCardWebp: z.string().optional(), screenshotMobile: z.string().optional(),
      screenshotDesktop: z.string().optional(), controlsDiagram: z.string().optional(), scoringDiagram: z.string().optional(),
      modesDiagram: z.string().optional(), rulesDiagram: z.string().optional(), alt: z.string(),
    }).optional(),
    presentation: z.object({
      controlsHeading: z.string(),
      controls: z.array(z.object({ label: z.string(), description: z.string() })),
      stageAspectDesktop: z.number().positive().optional(), stageAspectMobile: z.number().positive().optional(),
      controlsDiagramAlt: z.string().optional(), controlsDiagramCaption: z.string().optional(),
      secondaryDiagramAlt: z.string().optional(), secondaryDiagramCaption: z.string().optional(),
      gameplayPreviewAlt: z.string().optional(), gameplayPreviewCaption: z.string().optional(),
      relatedHeading: z.string().optional(), relatedGuideLabel: z.string().optional(),
    }).optional(),
    genre: z.string(), difficulty: z.string(), session: z.string(), featured: z.boolean().default(false),
    order: z.number().default(0), draft: z.boolean().default(false),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(), description: z.string(), game: gameIds, readTime: z.number(), updated: z.string(),
    order: z.number().default(0), featured: z.boolean().default(false), draft: z.boolean().default(false),
  }),
});

const articleBase = z.object({
  title: z.string(), description: z.string(), published: z.string(), updated: z.string(),
  author: z.string().default('NoCharge Editorial'), reviewer: z.string(), readTime: z.number().positive(),
  topics: z.array(z.string()).min(1), featured: z.boolean().default(false), draft: z.boolean().default(false),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.discriminatedUnion('kind', [
    articleBase.extend({ kind: z.literal('game'), game: gameIds, gameplayVersion: z.string().optional() }),
    articleBase.extend({ kind: z.literal('platform'), category: z.enum(['trust', 'privacy', 'accessibility', 'testing', 'announcement']) }),
  ]),
});

const collectionsContent = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/collections' }),
  schema: z.object({
    title: z.string(), description: z.string(), inclusionMethod: z.string(), reviewed: z.string(),
    games: z.array(z.object({ game: gameIds, reason: z.string().min(20) })).min(3),
    order: z.number().default(0), draft: z.boolean().default(false),
  }),
});


const setupTopics = z.enum(['keyboards', 'pointing-devices', 'screens-and-stands', 'desk-and-comfort', 'offline-puzzles', 'audio', 'lighting']);
const evidenceLevels = z.enum(['editorial-research', 'personally-used', 'hands-on-tested']);
const affiliateLink = z.object({
  label: z.string().min(1), url: z.string().url().startsWith('https://'), purpose: z.string().min(1),
  suitableFor: z.string().min(1), limitations: z.string().min(1),
});
const setup = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/setup' }),
  schema: z.object({
    title: z.string(), description: z.string(), publishedDate: z.string(), reviewedDate: z.string(),
    topic: setupTopics, topics: z.array(setupTopics).min(1), evidenceLevel: evidenceLevels,
    hasAffiliateLinks: z.boolean(), affiliateDisclosure: z.boolean().default(false),
    affiliateLinks: z.array(affiliateLink).default([]),
    artwork: z.enum(['hero', 'keyboards', 'pointing', 'screens-stands', 'puzzles-desk', 'switches', 'zoom-display', 'desk-noise', 'monitor', 'speakers', 'posture', 'footrest', 'lamp', 'bias-light', 'cables']),
    draft: z.boolean().default(false), featured: z.boolean().default(false),
  }).superRefine((data, ctx) => {
    if (data.hasAffiliateLinks && (!data.affiliateDisclosure || data.affiliateLinks.length === 0))
      ctx.addIssue({ code: 'custom', message: 'Affiliate articles require disclosure metadata and at least one link.' });
    if (!data.hasAffiliateLinks && data.affiliateLinks.length)
      ctx.addIssue({ code: 'custom', message: 'Nonaffiliate articles cannot contain affiliate links.' });
    for (const link of data.affiliateLinks) {
      const url = new URL(link.url);
      if (!['amazon.com', 'www.amazon.com'].includes(url.hostname) || url.searchParams.get('tag') !== 'nocharge-20')
        ctx.addIssue({ code: 'custom', message: 'Amazon links must use an allowed Amazon.com host and tag=nocharge-20.' });
    }
  }),
});

const changelog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/changelog' }),
  schema: z.object({
    title: z.string(), date: z.string(), summary: z.string(),
    type: z.enum(['launch', 'privacy', 'artwork', 'quality', 'update']), draft: z.boolean().default(false),
  }),
});

export const collections = { games, guides, articles, setup, collections: collectionsContent, changelog };
