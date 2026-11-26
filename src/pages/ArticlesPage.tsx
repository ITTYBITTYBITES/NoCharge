import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { ArticleContent } from '../content/articleContent';
import { loadArticle } from '../content/articleContent';
import { NotFoundPage } from './NotFoundPage';

export function ArticlePage({ article }: { article: ArticleContent }) {
  return (
    <div className="editorial-article-route" data-article-page={article.slug}>
      <div className="editorial-article-route__content" dangerouslySetInnerHTML={{ __html: article.articleHtml }} />
    </div>
  );
}

export function ArticlePageRoute() {
  const { slug } = useParams();
  const [loaded, setLoaded] = useState<{ slug: string; article: ArticleContent | null } | null>(null);

  useEffect(() => {
    if (!slug) return undefined;
    let active = true;
    void loadArticle(slug).then((article) => {
      if (active) setLoaded({ slug, article });
    }).catch(() => {
      if (active) setLoaded({ slug, article: null });
    });
    return () => { active = false; };
  }, [slug]);

  if (!slug) return <NotFoundPage />;
  if (loaded?.slug !== slug) {
    return (
      <div className="editorial-article-route editorial-article-route--loading" role="status" aria-live="polite">
        Loading article…
      </div>
    );
  }
  if (!loaded.article) return <NotFoundPage />;
  return <ArticlePage article={loaded.article} />;
}
