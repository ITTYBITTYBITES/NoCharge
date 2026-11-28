import { AppLegalLinks } from '../components/AppLegalLinks';
import { ClickToLoadYouTubeTrailer } from '../components/ClickToLoadYouTubeTrailer';
import { ExperienceMicroSiteFooter } from '../components/ExperienceMicroSiteFooter';
import { getAppLegalRecord } from '../content/appLegalPolicies';
import { getExperienceTheme } from '../content/experienceThemes';
import type { ShowcaseExperienceItem } from '../content/schemas';

export function ExperienceShowcase({ entry }: { entry: ShowcaseExperienceItem }) {
  const documentation = entry.documentation;
  const prefix = `showcase-${entry.slug}`;
  const isBrc = entry.slug === 'barn-road-chronicles';
  const legalRecord = getAppLegalRecord(entry.appLegalSlug);
  const legalIsDraft = legalRecord?.status === 'publisher-draft';
  const theme = getExperienceTheme(entry.slug);
  const personality = theme?.personality ?? 'speakeasy';
  const eyebrows = theme?.sectionEyebrows ?? {
    intro: 'Official release destinations',
    overview: 'Context',
    features: 'At a glance',
    availability: 'Official destinations',
    faq: 'Helpful details',
  };

  const faqPrefix = personality === 'casefile'
    ? (index: number) => `Q-0${index + 1}`
    : personality === 'journal'
      ? (index: number) => `Note 0${index + 1}`
      : (index: number) => `0${index + 1}`;

  return (
    <div
      className={`experience-showcase experience-showcase--${entry.slug} experience-showcase--${personality}`}
      data-experience-showcase={entry.slug}
      data-experience-personality={personality}
      data-static-experience="true"
      data-nocharge-demo="absent"
      data-h5-candidate={entry.h5GamesAdsCandidate ? 'true' : undefined}
      data-h5-candidate-status={entry.h5GamesAdsCandidate ? 'deferred' : undefined}
    >
      <section
        className={`experience-showcase__intro experience-showcase__intro--${personality}`}
        aria-labelledby={`${prefix}-release-title`}
      >
        <div className="experience-showcase__intro-copy">
          <p className="eyebrow">{eyebrows.intro}</p>
          <h2 id={`${prefix}-release-title`}>{isBrc ? 'A creator-hosted HTML5 prototype' : 'An Android app showcase'}</h2>
          <p>
            {isBrc
              ? 'This NoCharge page is an outbound listing for the creator-hosted itch.io project. It does not embed the game, load its assets, or provide a local demo.'
              : 'This NoCharge page is a static product showcase. It does not reproduce the Android app or load a gameplay module.'}
          </p>
          {personality === 'casefile' && (
            <div className="experience-showcase__dossier-strip">
              <span>STATUS // STATIC DOSSIER</span>
              <span>RUNTIME // NONE HOSTED</span>
            </div>
          )}
          {entry.appLegalSlug && <AppLegalLinks appSlug={entry.appLegalSlug} draft={legalIsDraft} />}
        </div>

        {entry.youtubeTrailers?.length ? (
          <div className={`experience-showcase__stage experience-showcase__stage--${personality}`}>
            {theme?.trailerStageEyebrow && (
              <div className="experience-showcase__stage-bar">
                <span className="experience-showcase__stage-label">{theme.trailerStageEyebrow}</span>
                {theme.trailerStageHeading && (
                  <span className="experience-showcase__stage-sub">{theme.trailerStageHeading}</span>
                )}
              </div>
            )}
            {entry.youtubeTrailers.map((trailer) => (
              <ClickToLoadYouTubeTrailer
                key={trailer.videoId}
                title={trailer.title}
                videoId={trailer.videoId}
                experienceSlug={entry.slug}
                eyebrowLabel={theme?.trailerStageEyebrow}
                noteLabel={theme?.trailerNote}
              />
            ))}
          </div>
        ) : theme?.fieldLedger ? (
          <aside className="experience-showcase__field-ledger" aria-label="Prototype field dispatch summary">
            <p className="experience-showcase__field-ledger-title">Field Dispatch Record</p>
            <dl className="experience-showcase__field-ledger-list">
              {theme.fieldLedger.map((item) => (
                <div key={item.label} className="experience-showcase__field-ledger-row">
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        ) : null}
      </section>

      <section className="experience-showcase__section experience-showcase__overview" aria-labelledby={`${prefix}-overview-title`}>
        <p className="eyebrow">{eyebrows.overview}</p>
        <h2 id={`${prefix}-overview-title`}>Overview</h2>
        <div className="experience-showcase__prose">
          {documentation.overview.map((paragraph, index) => <p key={`overview-${index}`}>{paragraph}</p>)}
        </div>
      </section>

      <section className="experience-showcase__section experience-showcase__features" aria-labelledby={`${prefix}-features-title`}>
        <p className="eyebrow">{eyebrows.features}</p>
        <h2 id={`${prefix}-features-title`}>What the publisher describes</h2>
        <div className={`experience-showcase__feature-board experience-showcase__feature-board--${personality}`}>
          {theme?.featureBoardLabel && (
            <p className="experience-showcase__board-header">{theme.featureBoardLabel}</p>
          )}
          <ul className="experience-showcase__feature-list">
            {documentation.keyFeatures.map((feature, index) => {
              const itemPrefix = theme?.featureItemPrefixes?.[index] ?? `0${index + 1}`;
              return (
                <li key={`feature-${index}`} className="experience-showcase__feature-item">
                  <span className="experience-showcase__feature-tag">{itemPrefix}</span>
                  <span className="experience-showcase__feature-text">{feature}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="experience-showcase__section experience-showcase__availability" aria-labelledby={`${prefix}-availability-title`}>
        <p className="eyebrow">{eyebrows.availability}</p>
        <h2 id={`${prefix}-availability-title`}>Platform &amp; Availability</h2>
        <div className="experience-showcase__prose">
          {documentation.platformAndAvailability.map((paragraph, index) => <p key={`platform-${index}`}>{paragraph}</p>)}
        </div>
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

      <section className="experience-showcase__section experience-showcase__faq-section" aria-labelledby={`${prefix}-faq-title`}>
        <p className="eyebrow">{eyebrows.faq}</p>
        <h2 id={`${prefix}-faq-title`}>FAQ</h2>
        <dl className="experience-showcase__faq">
          {documentation.faq.map((item, index) => (
            <div key={`faq-${index}`} className="experience-showcase__faq-card">
              <dt>
                <span className="experience-showcase__faq-index">{faqPrefix(index)}</span>
                <h3>{item.question}</h3>
              </dt>
              <dd><p>{item.answer}</p></dd>
            </div>
          ))}
        </dl>
      </section>

      <ExperienceMicroSiteFooter slug={entry.slug} appName={entry.title} />
    </div>
  );
}
