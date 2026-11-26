import { Link } from 'react-router';
import { AdaptiveIcon } from './AdaptiveIcon';
import { getContentPath, getSectionDefinition } from '../content/sections';
import type { PublishedCatalogEntry } from '../content/schemas';

export function ContentCard({ entry, compact = false }: { entry: PublishedCatalogEntry; compact?: boolean }) {
  const section = getSectionDefinition(entry.section);
  return (
    <article className={`catalog-card${compact ? ' catalog-card--compact' : ''}`} data-section={entry.section} data-category={entry.category}>
      <div className="catalog-card__meta">
        <span>{section.title}</span>
        <span aria-hidden="true">·</span>
        <span>{entry.category}</span>
      </div>
      <h3><Link className="catalog-card__title-link" to={getContentPath(entry)}>
        {entry.assetIconId && <AdaptiveIcon iconId={entry.assetIconId} size={32} className="catalog-card__icon" />}
        <span>{entry.title}</span>
      </Link></h3>
      <p>{entry.summary}</p>
      <div className="catalog-card__bottom">
        <div className="catalog-card__tags" aria-label="Tags">
          {entry.tags.slice(0, compact ? 2 : 3).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        {entry.featured && <span className="catalog-card__featured">Featured</span>}
      </div>
    </article>
  );
}
