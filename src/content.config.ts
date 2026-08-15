import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    emoji: z.string(),
    accent: z.string().default('#0f9d58'),
    artwork: z
      .object({
        icon: z.string(),
        coverSquare: z.string(),
        coverSquareFallback: z.string(),
        coverLandscape: z.string(),
        coverLandscapeFallback: z.string(),
        guideHeader: z.string(),
        guideHeaderFallback: z.string(),
        socialCard: z.string(),
        alt: z.string(),
      })
      .optional(),
    genre: z.string(),
    difficulty: z.string(),
    session: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    game: z.string(),
    readTime: z.number(),
    updated: z.string(),
    order: z.number().default(0),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { games, guides };
