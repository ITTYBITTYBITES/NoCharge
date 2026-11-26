import { useEffect, useMemo, useState } from 'react';
import { AdSlot } from '../components/AdSlot';
import type { AdSlotId } from '../integrations/advertising';
import { ContentCard } from '../components/ContentCard';
import { ExperienceProductDirectory } from '../components/ExperienceProductDirectory';
import { EmptyState, PageIntro, SectionHeading } from '../components/Primitives';
import { getSectionDefinition } from '../content/sections';
import { getPublishedBySection } from '../content/registry';
import type { ContentSection } from '../content/schemas';

type SortOrder = 'featured' | 'newest' | 'title';

const directoryAdSlots: Record<ContentSection, AdSlotId> = {
  arcade: 'arcade-hub-footer',
  experiences: 'experiences-hub-footer',
  tools: 'tools-hub-footer',
  guides: 'guides-hub-footer',
};

export function SectionLandingTemplate({ section, initialCategory }: { section: ContentSection; initialCategory?: string }) {
  const definition = getSectionDefinition(section);
  const entries = getPublishedBySection(section);
  const categories = [...new Set(entries.map((entry) => entry.category))].sort((a, b) => a.localeCompare(b));
  const tags = [...new Set(entries.flatMap((entry) => [...entry.tags]))].sort((a, b) => a.localeCompare(b));
  const [category, setCategory] = useState(initialCategory ?? 'all');
  const [tag, setTag] = useState('all');
  const [sort, setSort] = useState<SortOrder>('featured');

  useEffect(() => {
    if (initialCategory !== undefined) setCategory(initialCategory);
  }, [initialCategory]);

  const visibleEntries = useMemo(() => entries
    .filter((entry) => category === 'all' || entry.category === category)
    .filter((entry) => tag === 'all' || entry.tags.some((entryTag) => entryTag.toLocaleLowerCase() === tag.toLocaleLowerCase()))
    .sort((left, right) => {
      if (sort === 'featured' && left.featured !== right.featured) return left.featured ? -1 : 1;
      if (sort === 'newest' && left.updatedAt !== right.updatedAt) return right.updatedAt.localeCompare(left.updatedAt);
      return left.title.localeCompare(right.title);
    }), [entries, category, tag, sort]);

  const resetFilters = () => {
    setCategory('all');
    setTag('all');
    setSort('featured');
  };

  const introLead = section === 'experiences'
    ? 'Browse static app and game-release showcases alongside editorial product overviews. Each page identifies its platform and links to an official destination.'
    : definition.description;

  return (
    <div className={`page-container destination-page section-landing section-landing--${section}`}>
      <PageIntro eyebrow={definition.eyebrow} title={definition.title} lead={introLead} breadcrumb={[{ label: definition.title }]} status={false} iconId={definition.assetIconId ?? null} />
      {section === 'experiences' && <ExperienceProductDirectory />}
      <section className="catalog-directory" aria-labelledby="directory-title">
        <SectionHeading
          id="directory-title"
          eyebrow={section === 'experiences' ? 'Apps and authored experiences' : 'Published library'}
          title={section === 'experiences' ? 'Explore the Experience library.' : `Browse ${definition.title.toLocaleLowerCase()}.`}
          aside={<span className="catalog-count">{entries.length} published {entries.length === 1 ? 'entry' : 'entries'}</span>}
        >
          {section === 'experiences'
            ? 'This library includes static app and release showcases plus editorial product overviews. Filter by category or tag, then choose how you want the entries ordered.'
            : 'Filter by category or tag, then choose how you want the directory ordered. Only published entries appear here.'}
        </SectionHeading>
        <div className="catalog-filters" aria-label={`${definition.title} filters`}>
          <label>
            <span>Category</span>
            <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>Tag</span>
            <select aria-label="Filter by tag" value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="all">All tags</option>
              {tags.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select aria-label="Sort entries" value={sort} onChange={(event) => setSort(event.target.value as SortOrder)}>
              <option value="featured">Featured first</option>
              <option value="newest">Recently updated</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
        </div>
        <p className="catalog-results-count" aria-live="polite">Showing {visibleEntries.length} of {entries.length} {entries.length === 1 ? 'entry' : 'entries'}.</p>
        {visibleEntries.length > 0 ? (
          <div className="catalog-grid">
            {visibleEntries.map((entry) => <ContentCard key={entry.id} entry={entry} />)}
          </div>
        ) : (
          <div className="catalog-empty-state">
            <EmptyState kind={section === 'experiences' ? 'apps' : section} eyebrow="No matching entries" title="No published item matches those filters.">
              Clear one or both filters to see the complete published directory.
            </EmptyState>
            <button className="button button--secondary" type="button" onClick={resetFilters}>Clear filters</button>
          </div>
        )}
      </section>
      {initialCategory === undefined && <AdSlot slotId={directoryAdSlots[section]} />}
    </div>
  );
}
