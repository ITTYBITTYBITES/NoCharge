import setupCatalog from './setupCatalog.json';

export interface SetupArticleSummary {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  topic: string;
}

export interface SetupArticleContent extends SetupArticleSummary {
  articleHtml: string;
}

export const setupArticleCatalog = setupCatalog as SetupArticleSummary[];
const setupArticleByPath = new Map(setupArticleCatalog.map((entry) => [entry.path, entry]));
const setupArticleLoaders = import.meta.glob<SetupArticleContent>('./setup/*.json', { import: 'default' });

export function getSetupArticleSummary(path: string): SetupArticleSummary | undefined {
  return setupArticleByPath.get(path);
}

export async function loadSetupArticle(slug: string): Promise<SetupArticleContent | null> {
  const loader = setupArticleLoaders[`./setup/${slug}.json`];
  if (!loader) return null;
  const article = await loader();
  return article.slug === slug ? article : null;
}
