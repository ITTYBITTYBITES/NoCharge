import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ContentCard } from '../components/ContentCard';
import { PageIntro } from '../components/Primitives';
import { getFeaturedEntries } from '../content/registry';
import { searchSite } from '../search';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const featured = getFeaturedEntries();
  const results = searchSite(query);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim();
    setSearchParams(normalized ? { q: normalized } : {}, { replace: false });
  };

  return (
    <div className="page-container destination-page search-page">
      <PageIntro
        eyebrow="Search the published library"
        title="Find your next good click."
        lead="Search titles, summaries, sections, categories, and tags. The index is built locally from published registry entries only."
        breadcrumb={[{ label: 'Search' }]}
        status={false}
      />
      <section className="search-page__body" aria-labelledby="search-page-title">
        <form className="search-page__form" role="search" onSubmit={submit}>
          <label htmlFor="site-search-input">Search games, experiences, tools, and guides</label>
          <div className="search-field search-page__field">
            <input
              id="site-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “memory”, “writing”, or a tag…"
              autoComplete="off"
            />
            <button className="button button--primary" type="submit">Search</button>
          </div>
        </form>
        {query.trim() ? (
          <>
            <div className="search-page__heading">
              <p className="eyebrow">Search results</p>
              <h2 id="search-page-title">{results.length} {results.length === 1 ? 'match' : 'matches'} for “{query.trim()}”</h2>
            </div>
            {results.length > 0 ? (
              <div className="catalog-grid">
                {results.map((result) => <SearchResultCard key={result.id} title={result.title} excerpt={result.excerpt} href={result.href} section={result.section} category={result.category} />)}
              </div>
            ) : <p className="search-page__empty" role="status">No published entries match that query. Try a shorter word, section, category, or tag.</p>}
          </>
        ) : (
          <>
            <div className="search-page__heading">
              <p className="eyebrow">Start with a featured entry</p>
              <h2 id="search-page-title">A few worthwhile places to begin.</h2>
            </div>
            <div className="catalog-grid">
              {featured.map((entry) => <ContentCard key={entry.id} entry={entry} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SearchResultCard({ title, excerpt, href, section, category }: { title: string; excerpt: string; href: string; section: string; category: string }) {
  return (
    <article className="catalog-card">
      <div className="catalog-card__meta"><span>{section}</span><span aria-hidden="true">·</span><span>{category}</span></div>
      <h3><Link to={href}>{title}</Link></h3>
      <p>{excerpt}</p>
    </article>
  );
}
