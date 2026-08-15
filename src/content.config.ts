import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    emoji: z.string(),
    accent: z.string().default('#0f9d58'),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { games };
