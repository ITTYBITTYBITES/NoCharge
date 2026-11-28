import { Link } from 'react-router';
import { SectionHeading } from './Primitives';
import {
  EXPERIENCE_PRODUCT_CATEGORIES,
  getExperienceProductUrl,
  getPublishedExperienceProducts,
  type ExperienceProductCategory,
} from '../content/experienceProducts';
import { getExperienceTheme } from '../content/experienceThemes';

export type StudioCategoryFilter = 'all' | 'games' | 'productivity';

const filterToCategory: Record<Exclude<StudioCategoryFilter, 'all'>, ExperienceProductCategory> = {
  games: 'Games & Entertainment',
  productivity: 'Productivity & Utilities',
};

export function ExperienceProductDirectory({
  activeFilter = 'all',
}: {
  activeFilter?: StudioCategoryFilter;
}) {
  const products = getPublishedExperienceProducts();
  const brcTheme = getExperienceTheme('barn-road-chronicles');
  const visibleCategories = activeFilter === 'all'
    ? EXPERIENCE_PRODUCT_CATEGORIES
    : EXPERIENCE_PRODUCT_CATEGORIES.filter((category) => category === filterToCategory[activeFilter]);

  return (
    <div className="ittybitty-products" data-experience-product-directory="ittybittybites">
      {visibleCategories.map((category) => {
        const categoryIndex = EXPERIENCE_PRODUCT_CATEGORIES.indexOf(category);
        const categoryProducts = products.filter((product) => product.category === category);
        const headingId = `ittybitty-category-${categoryIndex + 1}`;
        const isGamesGroup = category === 'Games & Entertainment';
        return (
          <section
            key={category}
            className="ittybitty-products__category"
            aria-labelledby={headingId}
            data-experience-category-group={category}
          >
            <SectionHeading
              id={headingId}
              eyebrow={isGamesGroup ? 'IttyBittyBites · Independent Games' : 'IttyBittyBites · Local-First Utilities'}
              title={category}
            >
              {isGamesGroup
                ? 'Static app showcases and release notes for independent games. Visit each official site or release page for current build details.'
                : 'Editorial overviews for everyday Android utilities. Review described workflows here, then check the official site for current app details.'}
            </SectionHeading>
            {categoryProducts.length > 0 ? (
              <div className={`ittybitty-products__grid${isGamesGroup ? ' ittybitty-products__grid--bento-games' : ' ittybitty-products__grid--bento-utilities'}`}>
                {categoryProducts.map((product) => {
                  const theme = getExperienceTheme(product.slug);
                  const isEditorial = product.slug === 'profivue' || product.slug === 'rideside';
                  return (
                    <article
                      key={product.id}
                      className="ittybitty-product-card"
                      data-experience-product-id={product.id}
                      data-experience-category={product.category}
                      data-experience-hostname={product.hostname}
                      data-card-theme={product.slug}
                    >
                      <div className="ittybitty-product-card__banner">
                        <div className="ittybitty-product-card__topline">
                          <span className="ittybitty-product-card__brand">ITTYBITTYBITES</span>
                          <span className="ittybitty-product-card__motif">{theme?.motifBadge ?? 'Official Micro-Site'}</span>
                        </div>
                        <div className="ittybitty-product-card__chips">
                          <span className="studio-chip studio-chip--category">{theme?.categoryBadge ?? (isEditorial ? 'Productivity' : 'Game')}</span>
                          <span className="studio-chip studio-chip--platform">{isEditorial ? 'Android Utility' : 'Android'}</span>
                        </div>
                      </div>
                      <div className="ittybitty-product-card__body">
                        <h3>{product.name}</h3>
                        <p>{product.summary}</p>
                        <div className="ittybitty-product-card__availability">
                          <span className="experience-platform-badge">{isEditorial ? 'Product overview' : 'App showcase'}</span>
                          <span className="experience-platform-badge experience-platform-badge--external">Official site for current app details</span>
                        </div>
                        <div className="ittybitty-product-card__bottom">
                          <code>{product.hostname}</code>
                          <div className="ittybitty-product-card__actions">
                            <Link
                              className="button button--primary"
                              to={`/experiences/${product.slug}/`}
                              aria-label={isEditorial
                                ? `Read the ${product.name} product overview`
                                : `Read the ${product.name} app showcase`}
                              data-experience-detail-link={product.slug}
                              data-experience-detail-kind={isEditorial ? 'editorial-mini-site' : 'showcase'}
                            >
                              {isEditorial ? 'Read product overview' : 'Read app showcase'}
                            </Link>
                            <a
                              className="button button--secondary"
                              href={getExperienceProductUrl(product)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Visit ${product.name} product website at ${product.hostname} (opens in a new tab)`}
                              data-experience-product-link={product.slug}
                            >
                              Official product site <span aria-hidden="true">↗</span>
                            </a>
                          </div>
                          {theme?.appLegalSlug && (
                            <div className="ittybitty-product-card__legal" aria-label={`${product.name} legal documents`}>
                              <Link to={`/privacy/${theme.appLegalSlug}/`}>Privacy Policy</Link>
                              <span aria-hidden="true">·</span>
                              <Link to={`/terms/${theme.appLegalSlug}/`}>Terms of Service</Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {isGamesGroup && (
                  <article
                    className="ittybitty-prototype-card"
                    data-card-theme="barn-road-chronicles"
                    data-experience-category="Games & Entertainment"
                  >
                    <div className="ittybitty-prototype-card__banner">
                      <span className="ittybitty-product-card__brand">ITTYBITTYBITES</span>
                      <span className="ittybitty-product-card__motif">{brcTheme?.motifBadge ?? 'Lantern Field Journal'}</span>
                      <div className="ittybitty-product-card__chips">
                        <span className="studio-chip studio-chip--category">Game</span>
                        <span className="studio-chip studio-chip--platform">HTML5 Prototype</span>
                      </div>
                    </div>
                    <div className="ittybitty-prototype-card__body">
                      <div className="ittybitty-prototype-card__copy">
                        <h3>Barn Road Chronicles: Act 1</h3>
                        <p>
                          Touch-first HTML5 point-and-click mystery prototype hosted by ITTYBITTYBITES on itch.io. Read the field-journal release showcase and outbound launch details.
                        </p>
                      </div>
                      <div className="ittybitty-prototype-card__actions">
                        <span className="experience-platform-badge">Release showcase</span>
                        <Link
                          className="button button--primary"
                          to="/experiences/barn-road-chronicles/"
                        >
                          Read release showcase
                        </Link>
                      </div>
                    </div>
                  </article>
                )}
              </div>
            ) : (
              <p className="ittybitty-products__empty">No application is currently published in this category.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
