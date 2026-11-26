import { Link } from 'react-router';
import { SectionHeading } from './Primitives';
import {
  EXPERIENCE_PRODUCT_CATEGORIES,
  getExperienceProductUrl,
  getPublishedExperienceProducts,
} from '../content/experienceProducts';

export function ExperienceProductDirectory() {
  const products = getPublishedExperienceProducts();

  return (
    <div className="ittybitty-products" data-experience-product-directory="ittybittybites">
      {EXPERIENCE_PRODUCT_CATEGORIES.map((category, index) => {
        const categoryProducts = products.filter((product) => product.category === category);
        const headingId = `ittybitty-category-${index + 1}`;
        return (
          <section
            key={category}
            className="ittybitty-products__category"
            aria-labelledby={headingId}
            data-experience-category-group={category}
          >
            <SectionHeading
              id={headingId}
              eyebrow="ITTYBITTYBITES applications"
              title={category}
            >
              Read a static app showcase or editorial product overview, then visit the official product website for current app details. Browser prototypes, where listed, remain on their creator’s own site.
            </SectionHeading>
            {categoryProducts.length > 0 ? (
              <div className="ittybitty-products__grid">
                {categoryProducts.map((product) => (
                  <article
                    key={product.id}
                    className="ittybitty-product-card"
                    data-experience-product-id={product.id}
                    data-experience-category={product.category}
                    data-experience-hostname={product.hostname}
                  >
                    <div className="ittybitty-product-card__topline">
                      <span className="ittybitty-product-card__brand">ITTYBITTYBITES</span>
                      <span className="ittybitty-product-card__kind">Android app showcase</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.summary}</p>
                    <div className="ittybitty-product-card__availability">
                      <span className="experience-platform-badge">{product.slug === 'profivue' || product.slug === 'rideside' ? 'Product overview' : 'App showcase'}</span>
                      <span className="experience-platform-badge experience-platform-badge--external">Official site for current app details</span>
                    </div>
                    <div className="ittybitty-product-card__bottom">
                      <code>{product.hostname}</code>
                      <div className="ittybitty-product-card__actions">
                        <Link
                          className="button button--primary"
                          to={`/experiences/${product.slug}/`}
                          aria-label={product.slug === 'profivue' || product.slug === 'rideside'
                            ? `Read the ${product.name} product overview`
                            : `Read the ${product.name} app showcase`}
                          data-experience-detail-link={product.slug}
                          data-experience-detail-kind={product.slug === 'profivue' || product.slug === 'rideside' ? 'editorial-mini-site' : 'showcase'}
                        >
                          {product.slug === 'profivue' || product.slug === 'rideside' ? 'Read product overview' : 'Read app showcase'}
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
                    </div>
                  </article>
                ))}
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
