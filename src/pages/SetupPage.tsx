import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { loadSetupArticle, type SetupArticleContent } from '../content/setupContent';
import { NotFoundPage } from './NotFoundPage';

export function QuietSetupArticle({ article }: { article: SetupArticleContent }) {
  return (
    <div className="setup-route" data-quiet-setup-page={article.slug}>
      <div className="setup-route__content" dangerouslySetInnerHTML={{ __html: article.articleHtml }} />
    </div>
  );
}

export function SetupPageRoute() {
  const { slug } = useParams();
  const [loaded, setLoaded] = useState<{ slug: string; article: SetupArticleContent | null } | null>(null);

  useEffect(() => {
    if (!slug) return undefined;
    let active = true;
    void loadSetupArticle(slug).then((article) => {
      if (active) setLoaded({ slug, article });
    }).catch(() => {
      if (active) setLoaded({ slug, article: null });
    });
    return () => { active = false; };
  }, [slug]);

  if (!slug) return <NotFoundPage />;
  if (loaded?.slug !== slug) {
    return (
      <div className="setup-route setup-route--loading" role="status" aria-live="polite">
        Loading Quiet Setup article…
      </div>
    );
  }
  if (!loaded.article) return <NotFoundPage />;
  return <QuietSetupArticle article={loaded.article} />;
}
