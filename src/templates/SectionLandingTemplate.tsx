import { useEffect, useMemo, useState } from 'react';
import { AdSlot } from '../components/AdSlot';
import type { AdSlotId } from '../integrations/advertising';
import { ContentCard } from '../components/ContentCard';
import { ExperienceProductDirectory, type StudioCategoryFilter } from '../components/ExperienceProductDirectory';
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

const studioFilterOptions: readonly {
  id: StudioCategoryFilter;
  label: string;
  catalogCategory: string;
}[] = [
  { id: 'all', label: 'All', catalogCategory: 'all' },
  { id: 'games', label: 'Games', catalogCategory: 'Games & Entertainment' },
  { id: 'productivity', label: 'Productivity', catalogCategory: 'Productivity & Utilities' },
];

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

  const studioFilter: StudioCategoryFilter = category === 'Games & Entertainment'
    ? 'games'
    : category === 'Productivity & Utilities'
      ? 'productivity'
      : 'all';

  const selectStudioFilter = (next: StudioCategoryFilter) => {
    const match = studioFilterOptions.find((option) => option.id === next);
    setCategory(match?.catalogCategory ?? 'all');
  };

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

  const isExperiences = section === 'experiences';
  const gameCount = isExperiences ? entries.filter((entry) => entry.category === 'Games & Entertainment').length : 0;
  const utilityCount = isExperiences ? entries.filter((entry) => entry.category === 'Productivity & Utilities').length : 0;

  return (
    <div
      className={`page-container destination-page section-landing section-landing--${section}`}
      data-studio={isExperiences ? 'ittybittybites' : undefined}
    >
      {isExperiences ? (
        <div className="studio-hero">
          <PageIntro
            eyebrow={definition.eyebrow}
            title={definition.title}
            lead={introLead}
            breadcrumb={[{ label: definition.title }]}
            status={false}
            iconId={definition.assetIconId ?? null}
          />
          <div className="studio-hero__deck">
            <div className="studio-hero__identity">
              <p className="studio-hero__kicker">ITTYBITTYBITES STUDIO GALLERY</p>
              <p className="studio-hero__headline">An IttyBittyBites Experience</p>
              <p className="studio-hero__subcopy">
                Independent Android games with atmospheric worlds alongside local-first everyday utilities — each presented in its own dedicated micro-site.
              </p>
            </div>
            <div className="studio-hero__controls">
              <div className="studio-hero__stats" aria-label="Studio catalog breakdown">
                <span className="studio-stat">{entries.length} Published Releases</span>
                <span className="studio-stat">{gameCount} Games</span>
                <span className="studio-stat">{utilityCount} Productivity Utilities</span>
              </div>
              <div className="studio-filter-pills" role="group" aria-label="Filter IttyBittyBites showcase by category">
                {studioFilterOptions.map((option) => {
                  const active = studioFilter === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`studio-filter-pill${active ? ' is-selected' : ''}`}
                      aria-pressed={active}
                      data-studio-filter={option.id}
                      onClick={() => selectStudioFilter(option.id)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <PageIntro
          eyebrow={definition.eyebrow}
          title={definition.title}
          lead={introLead}
          breadcrumb={[{ label: definition.title }]}
          status={false}
          iconId={definition.assetIconId ?? null}
        />
      )}

      {isExperiences && <ExperienceProductDirectory activeFilter={studioFilter} />}

      <section className="catalog-directory" aria-labelledby="directory-title">
        <SectionHeading
          id="directory-title"
          eyebrow={isExperiences ? 'Apps and authored experiences' : 'Published library'}
          title={isExperiences ? 'Explore the Experience library.' : `Browse ${definition.title.toLocaleLowerCase()}.`}
          aside={<span className="catalog-count">{entries.length} published {entries.length === 1 ? 'entry' : 'entries'}</span>}
        >
          {isExperiences
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
            <EmptyState kind={isExperiences ? 'apps' : section} eyebrow="No matching entries" title="No published item matches those filters.">
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
