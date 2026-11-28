import { AppLegalLinks } from '../components/AppLegalLinks';
import { ExperienceMicroSiteFooter } from '../components/ExperienceMicroSiteFooter';
import { getExperienceTheme } from '../content/experienceThemes';
import type { EditorialExperienceItem } from '../content/schemas';

export function ExperienceMiniSite({ entry }: { entry: EditorialExperienceItem }) {
  const documentation = entry.documentation;
  const titleBase = entry.slug === 'profivue' ? 'profivue' : 'rideside';
  const theme = getExperienceTheme(entry.slug);
  const personality = theme?.personality ?? (entry.slug === 'profivue' ? 'cockpit' : 'logbook');
  const eyebrows = theme?.sectionEyebrows ?? {
    intro: 'Direct answer',
    overview: 'Context',
    features: 'At a glance',
    workflows: 'A practical starting point',
    useCases: 'Who it may suit',
    gallery: 'Publisher-supplied imagery',
    availability: 'Scope and caveats',
    faq: 'Straight answers',
  };

  return (
    <div
      className={`experience-mini-site experience-mini-site--${entry.slug} experience-mini-site--${personality}`}
      data-experience-mini-site={entry.slug}
      data-experience-personality={personality}
      data-editorial-experience="true"
    >
      <section className={`experience-mini-site__answer experience-mini-site__answer--${personality}`} aria-labelledby={`${titleBase}-answer-title`}>
        <div className="experience-mini-site__answer-main">
          <p className="eyebrow">{eyebrows.intro}</p>
          <h2 id={`${titleBase}-answer-title`}>What is {entry.title}?</h2>
          <p className="experience-mini-site__answer-copy">{documentation.directAnswer}</p>

          {theme?.logbookCoordinates && (
            <div className="logbook-coordinates" aria-label="Logbook scope tags">
              {theme.logbookCoordinates.map((coord) => (
                <span key={coord} className="logbook-coordinates__tag">{coord}</span>
              ))}
            </div>
          )}

          <a
            className="button button--primary experience-mini-site__official-link"
            href={entry.productWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-official-product-link={entry.slug}
          >
            Visit the official {entry.title} website <span aria-hidden="true">↗</span>
          </a>
          <AppLegalLinks appSlug={entry.appLegalSlug} />
        </div>
        <aside className="experience-mini-site__editorial-note" aria-label="Editorial scope note">
          <span className="experience-mini-site__note-label">
            {personality === 'cockpit' ? 'LEDGER NOTICE' : 'HARBOR ADVISORY'}
          </span>
          <p>
            This NoCharge page is an independent editorial overview. Described features are publisher statements,
            not independently tested guarantees; check the official site for current product details.
          </p>
        </aside>

        {theme?.cockpitMetrics && (
          <div className="cockpit-metrics" aria-label="Described margin metrics">
            {theme.cockpitMetrics.map((metric) => (
              <div key={metric.code} className="cockpit-metrics__cell">
                <span className="cockpit-metrics__code">
                  <span className="cockpit-metrics__dot" aria-hidden="true" />
                  {metric.code}
                </span>
                <strong className="cockpit-metrics__label">{metric.label}</strong>
                <span className="cockpit-metrics__detail">{metric.detail}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="experience-mini-site__section experience-mini-site__overview" aria-labelledby={`${titleBase}-overview-title`}>
        <p className="eyebrow">{eyebrows.overview}</p>
        <h2 id={`${titleBase}-overview-title`}>Overview</h2>
        <div className="experience-mini-site__prose">
          {documentation.overview.map((paragraph, index) => <p key={`overview-${index}`}>{paragraph}</p>)}
        </div>
      </section>

      <section className="experience-mini-site__section experience-mini-site__features" aria-labelledby={`${titleBase}-features-title`}>
        <p className="eyebrow">{eyebrows.features}</p>
        <h2 id={`${titleBase}-features-title`}>Described features</h2>
        {theme?.featureBoardLabel && (
          <p className="experience-mini-site__board-label">{theme.featureBoardLabel}</p>
        )}
        <ul className={`experience-mini-site__feature-list experience-mini-site__feature-list--${personality}`}>
          {documentation.keyFeatures.map((feature, index) => {
            const prefix = theme?.featureItemPrefixes?.[index] ?? `0${index + 1}`;
            return (
              <li key={`feature-${index}`} className="experience-mini-site__feature-item">
                {personality === 'logbook' ? (
                  <span className="rideside-check-head">
                    <span className="rideside-check-badge" aria-hidden="true">✓</span>
                    <span className="rideside-check-phase">{prefix}</span>
                  </span>
                ) : (
                  <span className="cockpit-strip-index">
                    <span className="cockpit-metrics__dot" aria-hidden="true" />
                    {prefix}
                  </span>
                )}
                <span className="experience-mini-site__feature-copy">{feature}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="experience-mini-site__section" aria-labelledby={`${titleBase}-workflows-title`}>
        <p className="eyebrow">{eyebrows.workflows ?? 'A practical starting point'}</p>
        <h2 id={`${titleBase}-workflows-title`}>Workflows and decisions</h2>
        <div className={`experience-mini-site__workflows experience-mini-site__workflows--${personality}`}>
          {documentation.workflows.map((workflow, index) => (
            <section className="experience-mini-site__workflow" key={`workflow-${index}`} aria-labelledby={`${titleBase}-workflow-${index}`}>
              <p className="experience-mini-site__step-label">
                {personality === 'logbook' ? `Log Entry 0${index + 1}` : `Workflow 0${index + 1}`}
              </p>
              <h3 id={`${titleBase}-workflow-${index}`}>{workflow.title}</h3>
              <p>{workflow.summary}</p>
              <ol>{workflow.steps.map((step, stepIndex) => <li key={`step-${stepIndex}`}>{step}</li>)}</ol>
            </section>
          ))}
        </div>
      </section>

      <section className="experience-mini-site__section" aria-labelledby={`${titleBase}-use-cases-title`}>
        <p className="eyebrow">{eyebrows.useCases ?? 'Who it may suit'}</p>
        <h2 id={`${titleBase}-use-cases-title`}>Use cases</h2>
        <div className={`experience-mini-site__use-cases experience-mini-site__use-cases--${personality}`}>
          {documentation.useCases.map((useCase, index) => (
            <article className="experience-mini-site__use-case" key={`use-case-${index}`}>
              <span className="experience-mini-site__case-code">
                {personality === 'cockpit' ? `CASE 0${index + 1}` : `DECK 0${index + 1}`}
              </span>
              <h3>{useCase.title}</h3>
              <p>{useCase.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="experience-mini-site__section" aria-labelledby={`${titleBase}-gallery-title`}>
        <p className="eyebrow">{eyebrows.gallery ?? 'Publisher-supplied imagery'}</p>
        <h2 id={`${titleBase}-gallery-title`}>A look at the product</h2>
        <p className="experience-mini-site__gallery-intro">These locally stored listing images are examples of the product’s presentation, not a live interface or an independent feature test.</p>
        <div className={`experience-mini-site__gallery experience-mini-site__gallery--${personality}`}>
          {documentation.artwork.map((artwork, index) => (
            <figure className="experience-mini-site__figure" key={artwork.manifestAssetId} data-asset-id={artwork.manifestAssetId} data-runtime-asset-id={artwork.runtimeManifestAssetId}>
              <div className="experience-mini-site__figure-bar">
                <span>{personality === 'cockpit' ? `SPECIMEN 0${index + 1}` : `DECK PLATE 0${index + 1}`}</span>
                <span>0{index + 1} / 0{documentation.artwork.length}</span>
              </div>
              <img
                src={artwork.src}
                width={artwork.width}
                height={artwork.height}
                alt={artwork.alt}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{artwork.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="experience-mini-site__section" aria-labelledby={`${titleBase}-availability-title`}>
        <p className="eyebrow">{eyebrows.availability}</p>
        <h2 id={`${titleBase}-availability-title`}>Platform, availability, and what to verify</h2>
        <div className="experience-mini-site__prose">
          {documentation.platformAndAvailability.map((paragraph, index) => <p key={`platform-${index}`}>{paragraph}</p>)}
        </div>
        <h3 className="experience-mini-site__subheading">Questions to confirm with the current product</h3>
        <ul className={`experience-mini-site__question-list experience-mini-site__question-list--${personality}`}>
          {documentation.evaluationQuestions.map((question, index) => <li key={`question-${index}`}>{question}</li>)}
        </ul>
      </section>

      <section className="experience-mini-site__section experience-mini-site__faq" aria-labelledby={`${titleBase}-faq-title`}>
        <p className="eyebrow">{eyebrows.faq}</p>
        <h2 id={`${titleBase}-faq-title`}>Frequently asked questions</h2>
        <dl>
          {documentation.faq.map((item, index) => (
            <div className="experience-mini-site__faq-item" key={`faq-${index}`}>
              <dt>
                <span className="experience-mini-site__faq-code">
                  {personality === 'cockpit' ? `LEDGER Q0${index + 1}` : `LOG Q0${index + 1}`}
                </span>
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
