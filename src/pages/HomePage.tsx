import { Link } from 'react-router';
import { ContentCard } from '../components/ContentCard';
import { AdSlot } from '../components/AdSlot';
import { BrandMark } from '../components/Brand';
import { ArrowIcon, SearchIcon } from '../components/Icons';
import { DestinationRow, SectionHeading, StatusBadge, TextLink } from '../components/Primitives';
import { CONTENT_SECTIONS } from '../content/sections';
import { getFeaturedEntries, getFacets, getPublishedEntries } from '../content/registry';

const tints = ['lime', 'peach', 'blue', 'lilac'] as const;
const sectionDestinations = CONTENT_SECTIONS.map((section, index) => {
  const count = getFacets().sections.find((facet) => facet.id === section.id)?.count ?? 0;
  return {
    number: String(index + 1).padStart(2, '0'),
    kind: section.icon,
    title: section.title,
    href: section.path,
    tint: tints[index],
    description: section.description,
    badge: <StatusBadge>{count} published</StatusBadge>,
  };
});
const destinations = [
  ...sectionDestinations,
  {
    number: '05', kind: 'discover' as const, title: 'Discover', href: '/discover/', tint: 'yellow' as const,
    description: 'Filter the complete published library across games, experiences, tools, and guides.',
    badge: <StatusBadge>{getPublishedEntries().length} entries</StatusBadge>,
  },
 ];

function HeroArtwork() {
  return (
    <div className="home-hero__visual" aria-hidden="true">
      <div className="hero-visual__grid" />
      <div className="hero-orbit hero-orbit--outer" />
      <div className="hero-orbit hero-orbit--inner" />
      <span className="hero-planet hero-planet--coral" />
      <span className="hero-planet hero-planet--blue" />
      <span className="hero-orbit-dot" />
      <div className="hero-brand-tile"><BrandMark /></div>
      <span className="hero-word hero-word--play">PLAY</span>
      <span className="hero-word hero-word--make">MAKE</span>
      <span className="hero-word hero-word--explore">EXPLORE</span>
      <span className="hero-sticker">ZERO<br />FUSS</span>
      <span className="hero-visual-caption">A NEW PLACE FOR THE CURIOUS</span>
    </div>
  );
}

export function HomePage() {
  const featured = CONTENT_SECTIONS
    .map((section) => getFeaturedEntries(section.id)[0])
    .filter((entry) => entry !== undefined);
  const libraryCount = getPublishedEntries().length;

  return (
    <div className="page-container home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <p className="eyebrow"><span className="eyebrow-star" aria-hidden="true">✳</span> A new place for the curious</p>
          <h1 id="home-title">Play, explore,<br /><span>get things done.</span></h1>
          <p className="home-hero__lead">NoCharge brings together small browser games, product and game showcases, practical local-first tools, and useful guides. Pick a quick activity or search the published library.</p>
          <form className="home-search-form" action="/search/" method="get" role="search">
            <label htmlFor="home-site-search">Search {libraryCount} published entries</label>
            <div className="home-search-form__field">
              <SearchIcon />
              <input id="home-site-search" type="search" name="q" placeholder="Try memory, writing, music…" autoComplete="off" />
              <button type="submit" aria-label="Search published content">Search</button>
            </div>
          </form>
          <div className="home-hero__actions">
            <a className="button button--primary" href="#destinations">Explore the site <ArrowIcon /></a>
            <TextLink to="/about/">What is NoCharge?</TextLink>
          </div>
          <div className="home-hero__note"><span className="note-line" />No account, download, or backend is needed for the starter tools and games.</div>
        </div>
        <HeroArtwork />
      </section>

      <section className="home-destinations section-spacing" id="destinations" aria-labelledby="destinations-title">
        <SectionHeading id="destinations-title" eyebrow="Five ways in" title="One place, plenty to explore." aside={<span className="section-index">01 <i>/</i> 05</span>}>
          Choose a destination, or browse everything together in Discover.
        </SectionHeading>
        <div className="destination-list">
          {destinations.map((destination) => <DestinationRow key={destination.href} {...destination} />)}
        </div>
      </section>

      <section className="home-featured section-spacing" aria-labelledby="home-featured-title">
        <SectionHeading id="home-featured-title" eyebrow="One from every section" title="A good place to begin." aside={<TextLink to="/discover/">Browse all {libraryCount} entries</TextLink>}>
          Four published highlights, selected from the same registry that powers each directory and search.
        </SectionHeading>
        <div className="catalog-grid home-featured__grid">
          {featured.map((entry) => <ContentCard key={entry.id} entry={entry} />)}
        </div>
      </section>

      <section className="home-note section-spacing" aria-labelledby="home-note-title">
        <div className="home-note__orbit" aria-hidden="true"><span /><span /><span /></div>
        <div className="home-note__content">
          <p className="eyebrow eyebrow--light">Made to be useful</p>
          <h2 id="home-note-title">Small things that work.<br /><em>Clear about what they do.</em></h2>
          <p>Play a short game, adjust a visual simulation, make a rhythm, or format a text snippet. Interactive controls are labeled, tools process their input in this browser, and guides explain the useful details.</p>
          <div className="home-note__bottom">
            <Link to="/guides/a-local-first-workflow-for-browser-tools/" className="button button--light">Read the local-first guide <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <section className="home-last section-spacing" aria-label="A note about NoCharge">
        <div className="home-last__mark" aria-hidden="true"><BrandMark /></div>
        <div>
          <p className="eyebrow">A good place to start</p>
          <h2>Curiosity, without the clutter.</h2>
        </div>
        <p>Six clear destinations, one local search index, and a library that only features published content.</p>
      </section>
      <AdSlot slotId="home-footer" />
    </div>
  );
}
