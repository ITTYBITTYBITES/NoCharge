import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AdSlot } from '../components/AdSlot';
import { ContentCard } from '../components/ContentCard';
import { DestinationGlyph } from '../components/Icons';
import { EmptyState, PageIntro, SectionHeading } from '../components/Primitives';
import { CONTENT_SECTIONS } from '../content/sections';
import { getFacets, getPublishedEntries } from '../content/registry';

export function DiscoverPage() {
  const entries = getPublishedEntries();
  const facets = getFacets();
  const [section, setSection] = useState('all');
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const visibleEntries = useMemo(() => entries
    .filter((entry) => section === 'all' || entry.section === section)
    .filter((entry) => category === 'all' || entry.category === category)
    .filter((entry) => tag === 'all' || entry.tags.some((entryTag) => entryTag.toLocaleLowerCase() === tag.toLocaleLowerCase()))
    .filter((entry) => !featuredOnly || entry.featured)
    .sort((left, right) => Number(right.featured) - Number(left.featured)
      || right.updatedAt.localeCompare(left.updatedAt)
      || left.title.localeCompare(right.title)),
  [entries, section, category, tag, featuredOnly]);

  const clearFilters = () => {
    setSection('all');
    setCategory('all');
    setTag('all');
    setFeaturedOnly(false);
  };

  return (
    <div className="page-container destination-page discover-page">
      <PageIntro
        eyebrow="05 / Find something"
        title="Good things, ready to explore."
        lead="Browse every published NoCharge game, app or release showcase, tool, and guide from one place. Filter by section, category, tag, or featured pick."
        breadcrumb={[{ label: 'Discover' }]}
        status={false}
      />
      <section className="discover-directory" aria-labelledby="discover-library-title">
        <SectionHeading id="discover-library-title" eyebrow="The published library" title="Find a useful next click." aside={<span className="catalog-count">{entries.length} published entries</span>}>
          Every card links to its public detail page. Draft and archived records are not included in these results or filters.
        </SectionHeading>
        <div className="catalog-filters catalog-filters--discover" aria-label="Discover filters">
          <label>
            <span>Section</span>
            <select aria-label="Filter by section" value={section} onChange={(event) => setSection(event.target.value)}>
              <option value="all">All sections</option>
              {facets.sections.map((item) => <option key={item.id} value={item.id}>{item.label} ({item.count})</option>)}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select aria-label="Discover category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {facets.categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>Tag</span>
            <select aria-label="Discover tag" value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="all">All tags</option>
              {facets.tags.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="catalog-checkbox">
            <input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} />
            <span>Featured only</span>
          </label>
        </div>
        <p className="catalog-results-count" aria-live="polite">Showing {visibleEntries.length} of {entries.length} published entries.</p>
        {visibleEntries.length > 0 ? (
          <div className="catalog-grid">
            {visibleEntries.map((entry) => <ContentCard key={entry.id} entry={entry} />)}
          </div>
        ) : (
          <div className="catalog-empty-state">
            <EmptyState kind="discover" eyebrow="No matching entries" title="Nothing published matches those filters.">
              Clear the filters to browse the complete public library.
            </EmptyState>
            <button className="button button--secondary" type="button" onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </section>

      <section className="section-spacing" aria-labelledby="discover-section-links-title">
        <SectionHeading id="discover-section-links-title" eyebrow="Browse by destination" title="Choose a section." />
        <div className="explore-links">
          {CONTENT_SECTIONS.map((item, index) => (
            <Link key={item.id} className="explore-link" to={item.path}>
              <span className="explore-link__glyph"><DestinationGlyph kind={item.icon} /></span>
              <span className="explore-link__body"><strong>{item.title}</strong><small>{item.description}</small></span>
              <span className="explore-link__num">{String(index + 1).padStart(2, '0')}</span>
            </Link>
          ))}
        </div>
      </section>
      <AdSlot slotId="discover-footer" />
    </div>
  );
}
