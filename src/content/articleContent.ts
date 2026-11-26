import articleCatalog from './articlesCatalog.json';

export interface ArticleSummary {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
}

export interface ArticleContent extends ArticleSummary {
  articleHtml: string;
}

export const articleCatalogEntries = articleCatalog as ArticleSummary[];
const articleByPath = new Map(articleCatalogEntries.map((article) => [article.path, article]));
const articleLoaders = import.meta.glob<ArticleContent>('./articles/*.json', { import: 'default' });

export function getArticleSummary(path: string): ArticleSummary | undefined {
  return articleByPath.get(path);
}

export async function loadArticle(slug: string): Promise<ArticleContent | null> {
  const loader = articleLoaders[`./articles/${slug}.json`];
  if (!loader) return null;
  const article = await loader();
  return article.slug === slug ? article : null;
}
