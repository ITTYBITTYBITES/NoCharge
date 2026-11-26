import { AppLegalLinks } from '../components/AppLegalLinks';
import { ClickToLoadYouTubeTrailer } from '../components/ClickToLoadYouTubeTrailer';
import type { ShowcaseExperienceItem } from '../content/schemas';

export function ExperienceShowcase({ entry }: { entry: ShowcaseExperienceItem }) {
  const documentation = entry.documentation;
  const prefix = `showcase-${entry.slug}`;
  const isBrc = entry.slug === 'barn-road-chronicles';
  return (
    <div
      className={`experience-showcase experience-showcase--${entry.slug}`}
      data-experience-showcase={entry.slug}
      data-static-experience="true"
      data-nocharge-demo="absent"
      data-h5-candidate={entry.h5GamesAdsCandidate ? 'true' : undefined}
      data-h5-candidate-status={entry.h5GamesAdsCandidate ? 'deferred' : undefined}
    >
      <section className="experience-showcase__intro" aria-labelledby={`${prefix}-release-title`}>
        <div className="experience-showcase__intro-copy">
          <p className="eyebrow">Official release destinations</p>
          <h2 id={`${prefix}-release-title`}>{isBrc ? 'A creator-hosted HTML5 prototype' : 'An Android app showcase'}</h2>
          <p>
            {isBrc
              ? 'This NoCharge page is an outbound listing for the creator-hosted itch.io project. It does not embed the game, load its assets, or provide a local demo.'
              : 'This NoCharge page is a static product showcase. It does not reproduce the Android app or load a gameplay module.'}
          </p>
          {entry.appLegalSlug && <AppLegalLinks appSlug={entry.appLegalSlug} draft={entry.appLegalSlug === 'coosjoint'} />}
        </div>
        {entry.youtubeTrailers?.map((trailer) => (
          <ClickToLoadYouTubeTrailer
            key={trailer.videoId}
            title={trailer.title}
            videoId={trailer.videoId}
            experienceSlug={entry.slug}
          />
        ))}
      </section>

      <section className="experience-showcase__section" aria-labelledby={`${prefix}-overview-title`}>
        <p className="eyebrow">Context</p>
        <h2 id={`${prefix}-overview-title`}>Overview</h2>
        {documentation.overview.map((paragraph, index) => <p key={`overview-${index}`}>{paragraph}</p>)}
      </section>

      <section className="experience-showcase__section" aria-labelledby={`${prefix}-features-title`}>
        <p className="eyebrow">At a glance</p>
        <h2 id={`${prefix}-features-title`}>What the publisher describes</h2>
        <ul>
          {documentation.keyFeatures.map((feature, index) => <li key={`feature-${index}`}>{feature}</li>)}
        </ul>
      </section>

      <section className="experience-showcase__section experience-showcase__availability" aria-labelledby={`${prefix}-availability-title`}>
        <p className="eyebrow">Official destinations</p>
        <h2 id={`${prefix}-availability-title`}>Platform &amp; Availability</h2>
        {documentation.platformAndAvailability.map((paragraph, index) => <p key={`platform-${index}`}>{paragraph}</p>)}
        <div className="experience-showcase__links" aria-label="Official product, release, and social destinations">
          {entry.productWebsiteUrl && (
            <a className="button button--secondary" href={entry.productWebsiteUrl} target="_blank" rel="noopener noreferrer" data-product-website-link={entry.slug}>
              Official product website <span aria-hidden="true">↗</span>
            </a>
          )}
          {entry.googlePlayUrl && (
            <a className="button button--primary" href={entry.googlePlayUrl} target="_blank" rel="noopener noreferrer" data-google-play-link={entry.slug}>
              Google Play app listing <span aria-hidden="true">↗</span>
            </a>
          )}
          {entry.itchIoUrl && (
            <a className="button button--secondary" href={entry.itchIoUrl} target="_blank" rel="noopener noreferrer" data-itchio-link={entry.slug}>
              {isBrc ? 'Open on itch.io' : 'Separate itch.io project'} <span aria-hidden="true">↗</span>
            </a>
          )}
          {entry.facebookUrl && (
            <a className="button button--secondary" href={entry.facebookUrl} target="_blank" rel="noopener noreferrer" data-facebook-link={entry.slug}>
              Follow Coo&apos;s Joint on Facebook <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </section>

      <section className="experience-showcase__section" aria-labelledby={`${prefix}-faq-title`}>
        <p className="eyebrow">Helpful details</p>
        <h2 id={`${prefix}-faq-title`}>FAQ</h2>
        <dl className="experience-showcase__faq">
          {documentation.faq.map((item, index) => (
            <div key={`faq-${index}`}>
              <dt><h3>{item.question}</h3></dt>
              <dd><p>{item.answer}</p></dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
