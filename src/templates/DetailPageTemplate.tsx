import { Fragment, useEffect } from 'react';
import { Link } from 'react-router';
import { AdSlot } from '../components/AdSlot';
import { AdaptiveIcon } from '../components/AdaptiveIcon';
import { H5_GAMES_ADS_ENABLED, h5GamesAdsAdapter } from '../integrations/advertising';
import { Breadcrumbs } from '../components/Primitives';
import { ContentCard } from '../components/ContentCard';
import { getSectionDefinition } from '../content/sections';
import { getRelatedEntries } from '../content/registry';
import type { PublishedCatalogEntry } from '../content/schemas';
import { InteractiveModuleSlot } from '../modules/InteractiveModuleSlot';
import { ExperienceMiniSite } from './ExperienceMiniSite';
import { ExperienceShowcase } from './ExperienceShowcase';

function anchorFor(heading: string): string {
  return heading.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

function wordCount(entry: Extract<PublishedCatalogEntry, { kind: 'guide' }>): number {
  return entry.sections.flatMap((section) => [...section.paragraphs, ...(section.steps ?? [])])
    .join(' ')
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .length;
}

export function DetailPageTemplate({ entry }: { entry: PublishedCatalogEntry }) {
  const section = getSectionDefinition(entry.section);
  const related = getRelatedEntries(entry, 3);
  const published = new Date(`${entry.publishedAt}T12:00:00Z`);
  const updated = new Date(`${entry.updatedAt}T12:00:00Z`);
  const isArcadeGame = entry.kind === 'arcade';

  useEffect(() => {
    if (!isArcadeGame) return;
    void h5GamesAdsAdapter.init({
      contentId: entry.id,
      contentType: 'game',
      published: entry.status === 'published',
      h5AdsEligible: true,
    });
  }, [entry.id, entry.status, isArcadeGame]);

  return (
    <article
      className={`page-container detail-page detail-page--${entry.section}`}
      data-experience-page={entry.kind === 'experience' ? entry.presentation ?? 'interactive-demo' : undefined}
      data-static-experience-route={entry.kind === 'experience' && (entry.presentation === 'editorial-mini-site' || entry.presentation === 'showcase') ? entry.slug : undefined}
    >
      <Breadcrumbs items={[{ label: section.title, href: section.path }, { label: entry.title }]} />
      <header className="detail-header">
        <div className="detail-header__eyebrow"><span>{section.title}</span><span aria-hidden="true">·</span><span>{entry.category}</span></div>
        <div className="detail-header__title-row">
          {entry.assetIconId && <AdaptiveIcon iconId={entry.assetIconId} size={52} className="detail-header__title-icon" />}
          <h1>{entry.title}</h1>
        </div>
        <p className="detail-header__summary">{entry.summary}</p>
        <div className="detail-header__metadata">
          {entry.kind === 'guide' && <span>By NoCharge</span>}
          <span>Published <time dateTime={entry.publishedAt}>{published.toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })}</time></span>
          <span>Updated <time dateTime={entry.updatedAt}>{updated.toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })}</time></span>
          {entry.kind === 'guide' && <span>{Math.max(1, Math.ceil(wordCount(entry) / 210))} min read</span>}
        </div>
        <div className="detail-tags" aria-label="Content tags">
          {entry.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </header>

      {entry.kind === 'guide' ? (
        <div className="guide-layout">
          <nav className="guide-toc" aria-label="On this page">
            <h2>On this page</h2>
            <ol>{entry.sections.map((sectionItem) => <li key={sectionItem.heading}><a href={`#${anchorFor(sectionItem.heading)}`}>{sectionItem.heading}</a></li>)}</ol>
          </nav>
          <div className="guide-article-body">
            {entry.sections.map((sectionItem, index) => (
              <Fragment key={sectionItem.heading}>
                <section id={anchorFor(sectionItem.heading)}>
                  <h2>{sectionItem.heading}</h2>
                  {sectionItem.paragraphs.map((paragraph, paragraphIndex) => <p key={`${sectionItem.heading}-${paragraphIndex}`}>{paragraph}</p>)}
                  {sectionItem.steps && <ol>{sectionItem.steps.map((step, stepIndex) => <li key={`${sectionItem.heading}-step-${stepIndex}`}>{step}</li>)}</ol>}
                </section>
                {index === Math.floor(entry.sections.length / 2) - 1 && <AdSlot slotId="guides-detail-mid-editorial" />}
              </Fragment>
            ))}
          </div>
        </div>
      ) : entry.kind === 'experience' && entry.presentation === 'showcase' ? (
        <ExperienceShowcase entry={entry} />
      ) : entry.kind === 'experience' && entry.presentation === 'editorial-mini-site' ? (
        <ExperienceMiniSite entry={entry} />
      ) : (
        <>
          <section className="detail-instructions" aria-labelledby="instructions-title">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 id="instructions-title">Try it in your browser.</h2>
              <p>{entry.instructions}</p>
            </div>
            <ul aria-label="Controls and instructions">{entry.controls.map((control) => <li key={control}>{control}</li>)}</ul>
          </section>
          {entry.kind === 'arcade' ? (
            <>
              <div
                className="arcade-game-ad-layout"
                data-h5-game-id={entry.id}
                data-h5-adapter-status={H5_GAMES_ADS_ENABLED ? 'active' : 'inactive'}
                data-h5-runtime-contract={entry.runtimeContract}
                data-h5-breakpoint-hooks={entry.h5Breakpoints.join(' ')}
              >
                <InteractiveModuleSlot
                  moduleId={entry.moduleId}
                  moduleLoader={entry.moduleLoader}
                  title={entry.title}
                  arcadeRuntime={{ contentId: entry.id, allowedBreakpoints: entry.h5Breakpoints }}
                />
                <AdSlot slotId="arcade-detail-companion" />
              </div>
              <div className="arcade-documentation" aria-label={`${entry.title} complete game guide`}>
                <section id="arcade-how-to-play" aria-labelledby="arcade-how-to-play-title">
                  <p className="eyebrow">How to play</p>
                  <h2 id="arcade-how-to-play-title">How to Play</h2>
                  {entry.documentation.howToPlay.map((paragraph, index) => <p key={`how-to-play-${index}`}>{paragraph}</p>)}
                </section>
                <section id="arcade-controls" aria-labelledby="arcade-controls-title">
                  <p className="eyebrow">Input and access</p>
                  <h2 id="arcade-controls-title">Controls</h2>
                  <ul>{entry.documentation.controls.map((control, index) => <li key={`control-${index}`}>{control}</li>)}</ul>
                </section>
                <section id="arcade-rules-scoring" aria-labelledby="arcade-rules-scoring-title">
                  <p className="eyebrow">A complete round</p>
                  <h2 id="arcade-rules-scoring-title">Rules &amp; Scoring</h2>
                  {entry.documentation.rulesAndScoring.map((paragraph, index) => <p key={`rules-${index}`}>{paragraph}</p>)}
                </section>
                <section id="arcade-tips" aria-labelledby="arcade-tips-title">
                  <p className="eyebrow">A steadier start</p>
                  <h2 id="arcade-tips-title">Tips</h2>
                  <ul>{entry.documentation.tips.map((tip, index) => <li key={`tip-${index}`}>{tip}</li>)}</ul>
                </section>
              </div>
            </>
          ) : (
            <>
              <InteractiveModuleSlot moduleId={entry.moduleId} moduleLoader={entry.moduleLoader} title={entry.title} />
              {entry.kind === 'experience' && (
                <div className="experience-documentation" aria-label={`${entry.title} experience documentation`}>
                  <section className="experience-documentation__section" aria-labelledby="experience-overview-title">
                    <p className="eyebrow">What this is</p>
                    <h2 id="experience-overview-title">Overview</h2>
                    {entry.documentation.overview.map((paragraph, index) => <p key={`experience-overview-${index}`}>{paragraph}</p>)}
                  </section>
                  <section className="experience-documentation__section" aria-labelledby="experience-features-title">
                    <p className="eyebrow">At a glance</p>
                    <h2 id="experience-features-title">Key Features</h2>
                    <ul>{entry.documentation.keyFeatures.map((feature, index) => <li key={`experience-feature-${index}`}>{feature}</li>)}</ul>
                  </section>
                  <section className="experience-documentation__section" aria-labelledby="experience-demo-works-title">
                    <p className="eyebrow">Inside the preview</p>
                    <h2 id="experience-demo-works-title">How the Demo Works</h2>
                    {entry.documentation.howDemoWorks.map((paragraph, index) => <p key={`experience-demo-${index}`}>{paragraph}</p>)}
                  </section>
                  <section className="experience-documentation__section" aria-labelledby="experience-platform-title">
                    <p className="eyebrow">Where it runs</p>
                    <h2 id="experience-platform-title">Platform &amp; Availability</h2>
                    {entry.documentation.platformAndAvailability.map((paragraph, index) => <p key={`experience-platform-${index}`}>{paragraph}</p>)}
                    {(entry.productWebsiteUrl || entry.googlePlayUrl || entry.itchIoUrl) && (
                      <div className="experience-platform-links" aria-label="Official product and game destinations">
                        {entry.productWebsiteUrl && (
                          <a className="button button--secondary" href={entry.productWebsiteUrl} target="_blank" rel="noopener noreferrer" data-product-website-link={entry.slug}>
                            Official product website <span aria-hidden="true">↗</span>
                          </a>
                        )}
                        {entry.googlePlayUrl && (
                          <a className="button button--primary" href={entry.googlePlayUrl} target="_blank" rel="noopener noreferrer" data-google-play-link={entry.slug}>
                            Google Play <span aria-hidden="true">↗</span>
                          </a>
                        )}
                        {entry.itchIoUrl && (
                          <a className="button button--secondary" href={entry.itchIoUrl} target="_blank" rel="noopener noreferrer" data-itchio-link={entry.slug}>
                            itch.io browser prototype <span aria-hidden="true">↗</span>
                          </a>
                        )}
                        {!entry.googlePlayUrl && entry.productWebsiteUrl && <span className="experience-platform-badge">Android availability: see product site</span>}
                      </div>
                    )}
                  </section>
                  <section className="experience-documentation__section" aria-labelledby="experience-faq-title">
                    <p className="eyebrow">Helpful details</p>
                    <h2 id="experience-faq-title">FAQ</h2>
                    <dl className="experience-documentation__faq">
                      {entry.documentation.faq.map((item, index) => (
                        <div key={`experience-faq-${index}`}>
                          <dt><h3>{item.question}</h3></dt>
                          <dd><p>{item.answer}</p></dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </div>
              )}
              {entry.kind === 'tool' && (
                <div className="tool-documentation" aria-label={`${entry.title} documentation`}>
                  <section aria-labelledby="tool-how-it-works">
                    <h2 id="tool-how-it-works">How It Works</h2>
                    {entry.howItWorks.map((paragraph, index) => <p key={`how-${index}`}>{paragraph}</p>)}
                  </section>
                  <section aria-labelledby="tool-worked-example">
                    <h2 id="tool-worked-example">Worked Example</h2>
                    <p>{entry.workedExample.scenario}</p>
                    {entry.workedExample.input && <pre className="tool-documentation__input"><code>{entry.workedExample.input}</code></pre>}
                    <ol>{entry.workedExample.steps.map((step, index) => <li key={`example-step-${index}`}>{step}</li>)}</ol>
                    <p><strong>Result:</strong> {entry.workedExample.result}</p>
                  </section>
                  <section aria-labelledby="tool-common-pitfalls-faq">
                    <h2 id="tool-common-pitfalls-faq">Common Pitfalls / FAQ</h2>
                    <h3>Common pitfalls</h3>
                    <ul>{entry.pitfalls.map((pitfall, index) => <li key={`pitfall-${index}`}>{pitfall}</li>)}</ul>
                    <h3>Frequently asked questions</h3>
                    <dl className="tool-documentation__faq">
                      {entry.faq.map((item, index) => (
                        <div key={`faq-${index}`}>
                          <dt><h4>{item.question}</h4></dt>
                          <dd><p>{item.answer}</p></dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </div>
              )}
              {entry.kind === 'tool' && <AdSlot slotId="tools-detail-post-documentation" />}
              {entry.kind === 'experience' && <AdSlot slotId="experience-detail-after-interaction" />}
            </>
          )}
        </>
      )}

      {related.length > 0 && (
        <section
          className="related-content"
          aria-labelledby="related-content-title"
          data-companion-resource-slot={entry.kind === 'experience' && entry.presentation === 'editorial-mini-site' ? entry.slug : undefined}
        >
          <div className="related-content__heading">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h2 id="related-content-title">
                {entry.kind === 'arcade' || entry.kind === 'tool' || entry.kind === 'guide'
                  ? 'Related Guides & Tools'
                  : entry.kind === 'experience' && entry.presentation === 'editorial-mini-site'
                    ? 'Companion Guides & Tools'
                    : entry.kind === 'experience' ? 'Related Experiences & Tools' : 'Related published entries'}
              </h2>
            </div>
            <Link to={section.path}>Browse {section.title} <span aria-hidden="true">→</span></Link>
          </div>
          {entry.kind === 'arcade' && <p className="related-content__intro">{entry.documentation.relatedIntro}</p>}
          {entry.kind === 'experience' && entry.presentation === 'editorial-mini-site' && (
            <p className="related-content__intro" data-companion-resource-intro>
              These published NoCharge resources connect the product overview to practical browser tools and guides. Add future companion articles or references here as they are reviewed and published.
            </p>
          )}
          <div className="catalog-grid catalog-grid--related">
            {related.map((relatedEntry) => <ContentCard key={relatedEntry.id} entry={relatedEntry} compact />)}
          </div>
        </section>
      )}
      <p className="detail-back-link"><Link to={section.path}>← Back to {section.title}</Link></p>
    </article>
  );
}
