import { AppLegalLinks } from '../components/AppLegalLinks';
import { ExperienceMicroSiteFooter } from '../components/ExperienceMicroSiteFooter';
import type { EditorialExperienceItem } from '../content/schemas';

export function ExperienceMiniSite({ entry }: { entry: EditorialExperienceItem }) {
  const documentation = entry.documentation;
  const titleBase = entry.slug === 'profivue' ? 'profivue' : 'rideside';
  return (
    <div
      className={`experience-mini-site experience-mini-site--${entry.slug}`}
      data-experience-mini-site={entry.slug}
      data-editorial-experience="true"
    >
      <section className="experience-mini-site__answer" aria-labelledby={`${titleBase}-answer-title`}>
        <div>
          <p className="eyebrow">Direct answer</p>
          <h2 id={`${titleBase}-answer-title`}>What is {entry.title}?</h2>
          <p className="experience-mini-site__answer-copy">{documentation.directAnswer}</p>
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
        <p className="experience-mini-site__editorial-note">
          This NoCharge page is an independent editorial overview. Described features are publisher statements,
          not independently tested guarantees; check the official site for current product details.
        </p>
      </section>

      <section className="experience-mini-site__section" aria-labelledby={`${titleBase}-overview-title`}>
        <p className="eyebrow">Context</p>
        <h2 id={`${titleBase}-overview-title`}>Overview</h2>
        {documentation.overview.map((paragraph, index) => <p key={`overview-${index}`}>{paragraph}</p>)}
      </section>

      <section className="experience-mini-site__section" aria-labelledby={`${titleBase}-features-title`}>
        <p className="eyebrow">At a glance</p>
        <h2 id={`${titleBase}-features-title`}>Described features</h2>
        <ul className="experience-mini-site__feature-list">
          {documentation.keyFeatures.map((feature, index) => <li key={`feature-${index}`}>{feature}</li>)}
        </ul>
      </section>

      <section className="experience-mini-site__section" aria-labelledby={`${titleBase}-workflows-title`}>
        <p className="eyebrow">A practical starting point</p>
        <h2 id={`${titleBase}-workflows-title`}>Workflows and decisions</h2>
        <div className="experience-mini-site__workflows">
          {documentation.workflows.map((workflow, index) => (
            <section className="experience-mini-site__workflow" key={`workflow-${index}`} aria-labelledby={`${titleBase}-workflow-${index}`}>
              <p className="experience-mini-site__step-label">Workflow {index + 1}</p>
              <h3 id={`${titleBase}-workflow-${index}`}>{workflow.title}</h3>
              <p>{workflow.summary}</p>
              <ol>{workflow.steps.map((step, stepIndex) => <li key={`step-${stepIndex}`}>{step}</li>)}</ol>
            </section>
          ))}
        </div>
      </section>

      <section className="experience-mini-site__section" aria-labelledby={`${titleBase}-use-cases-title`}>
        <p className="eyebrow">Who it may suit</p>
        <h2 id={`${titleBase}-use-cases-title`}>Use cases</h2>
        <div className="experience-mini-site__use-cases">
          {documentation.useCases.map((useCase, index) => (
            <article className="experience-mini-site__use-case" key={`use-case-${index}`}>
              <h3>{useCase.title}</h3>
              <p>{useCase.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="experience-mini-site__section" aria-labelledby={`${titleBase}-gallery-title`}>
        <p className="eyebrow">Publisher-supplied imagery</p>
        <h2 id={`${titleBase}-gallery-title`}>A look at the product</h2>
        <p className="experience-mini-site__gallery-intro">These locally stored listing images are examples of the product’s presentation, not a live interface or an independent feature test.</p>
        <div className="experience-mini-site__gallery">
          {documentation.artwork.map((artwork) => (
            <figure className="experience-mini-site__figure" key={artwork.manifestAssetId} data-asset-id={artwork.manifestAssetId} data-runtime-asset-id={artwork.runtimeManifestAssetId}>
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
        <p className="eyebrow">Scope and caveats</p>
        <h2 id={`${titleBase}-availability-title`}>Platform, availability, and what to verify</h2>
        {documentation.platformAndAvailability.map((paragraph, index) => <p key={`platform-${index}`}>{paragraph}</p>)}
        <h3 className="experience-mini-site__subheading">Questions to confirm with the current product</h3>
        <ul className="experience-mini-site__question-list">
          {documentation.evaluationQuestions.map((question, index) => <li key={`question-${index}`}>{question}</li>)}
        </ul>
      </section>

      <section className="experience-mini-site__section experience-mini-site__faq" aria-labelledby={`${titleBase}-faq-title`}>
        <p className="eyebrow">Straight answers</p>
        <h2 id={`${titleBase}-faq-title`}>Frequently asked questions</h2>
        <dl>
          {documentation.faq.map((item, index) => (
            <div className="experience-mini-site__faq-item" key={`faq-${index}`}>
              <dt><h3>{item.question}</h3></dt>
              <dd><p>{item.answer}</p></dd>
            </div>
          ))}
        </dl>
      </section>

      <ExperienceMicroSiteFooter slug={entry.slug} appName={entry.title} />
    </div>
  );
}
