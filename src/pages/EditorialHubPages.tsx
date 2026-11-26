import articlesHub from '../content/articlesHub.json';
import setupHub from '../content/setupHub.json';

export function ArticlesHubPage() {
  return (
    <div className="editorial-hub-route editorial-hub-route--articles" data-articles-hub>
      <div className="editorial-hub-route__content" dangerouslySetInnerHTML={{ __html: articlesHub.articleHtml }} />
    </div>
  );
}

export function QuietSetupHubPage() {
  return (
    <div className="editorial-hub-route editorial-hub-route--setup" data-quiet-setup-hub>
      <div className="editorial-hub-route__content" dangerouslySetInnerHTML={{ __html: setupHub.articleHtml }} />
    </div>
  );
}
