import {
  CONTENT_SECTIONS,
  contentRegistry,
  getContentPath,
  getPublishedBySection,
  getPublishedEntries,
} from './content/registry';
import type { PublishedCatalogEntry } from './content/schemas';
import { APP_LEGAL_SLUGS, getAppLegalRecord, type AppLegalKind } from './content/appLegalPolicies';
import { getPublishedStorefronts, getStorefrontBySlug } from './integrations/storefronts';
import articlesCatalog from './content/articlesCatalog.json';
import articlesHubMeta from './content/articlesHubMeta.json';
import setupHubMeta from './content/setupHubMeta.json';
import { setupArticleCatalog } from './content/setupContent';
export { footerNavigation, primaryNavigation } from './siteNavigation';

export const SITE_NAME = 'NoCharge';
export const SITE_URL = 'https://nocharge.net';
const SITE_HOME_URL = `${SITE_URL}/`;
const SITE_ORGANIZATION_ID = `${SITE_HOME_URL}#organization`;
const SITE_WEBSITE_ID = `${SITE_HOME_URL}#website`;
const SITE_DESCRIPTION = 'NoCharge brings together browser games, product and game showcases, practical local-first tools, and useful guides.';

function organizationReference() {
  return {
    '@type': 'Organization',
    '@id': SITE_ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_HOME_URL,
  };
}

export interface PageSEO {
  title: string;
  description: string;
  robots: 'index,follow' | 'noindex,follow' | 'noindex,nofollow';
  canonical?: string;
  structuredData?: Record<string, unknown>;
}

function pageSEO(
  path: string,
  title: string,
  description: string,
  indexable = false,
  structuredData?: Record<string, unknown>,
): PageSEO {
  return {
    title,
    description,
    robots: indexable ? 'index,follow' : 'noindex,follow',
    canonical: new URL(path, SITE_URL).toString(),
    ...(structuredData ? { structuredData } : {}),
  };
}

function sectionStructuredData(section: (typeof CONTENT_SECTIONS)[number]): Record<string, unknown> {
  const canonical = new URL(section.path, SITE_URL).toString();
  const base = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: section.title,
    url: canonical,
    description: section.description,
  };

  // Keep Arcade and Experiences schema unchanged; the requested directory
  // entities are the published Tools and Guides collections.
  if (section.id !== 'tools' && section.id !== 'guides') return base;

  const entries = getPublishedBySection(section.id);
  const itemType = section.id === 'tools' ? 'WebApplication' : 'Article';
  const itemAnchor = section.id === 'tools' ? 'application' : 'article';
  return {
    ...base,
    '@id': `${canonical}#directory`,
    isPartOf: { '@id': SITE_WEBSITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      '@id': `${canonical}#published-items`,
      name: section.title,
      numberOfItems: entries.length,
      itemListOrder: 'https://schema.org/ItemListUnordered',
      itemListElement: entries.map((entry) => {
        const itemUrl = new URL(getContentPath(entry), SITE_URL).toString();
        return {
          '@type': 'ListItem',
          item: {
            '@type': itemType,
            '@id': `${itemUrl}#${itemAnchor}`,
            name: entry.title,
            description: entry.summary,
            url: itemUrl,
          },
        };
      }),
    },
  };
}

const sectionPages = CONTENT_SECTIONS.map((section) => {
  const count = getPublishedBySection(section.id).length;
  const description = section.id === 'experiences'
    ? 'Browse static app and game-release showcases alongside editorial product overviews, with clear platform notes and official destinations.'
    : `${section.description} Browse ${count} published ${count === 1 ? 'entry' : 'entries'} in the ${section.title} directory.`;
  return {
    path: section.path,
    title: section.title,
    seo: pageSEO(
      section.path,
      `${section.title} | NoCharge`,
      description,
      true,
      sectionStructuredData(section),
    ),
  };
});

export const sitePages = [
  {
    path: '/',
    title: 'Home',
    seo: pageSEO(
      '/',
      'NoCharge — Play, explore, get things done',
      'Play browser games, explore static app and game-release showcases, use practical local-first tools, and read original guides on NoCharge.',
      true,
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            ...organizationReference(),
            description: SITE_DESCRIPTION,
          },
          {
            '@type': 'WebSite',
            '@id': SITE_WEBSITE_ID,
            name: SITE_NAME,
            url: SITE_HOME_URL,
            description: 'A home for browser games, product and game showcases, local-first tools, and useful guides.',
            inLanguage: 'en',
            publisher: { '@id': SITE_ORGANIZATION_ID },
          },
        ],
      },
    ),
  },
  ...sectionPages,
  {
    path: '/discover/',
    title: 'Discover',
    seo: pageSEO('/discover/', 'Discover the NoCharge library', 'Browse all published NoCharge games, static app and release showcases, local-first tools, and original guides. Filter by section, category, tag, or featured status.', true),
  },
  {
    path: '/search/',
    title: 'Search',
    seo: pageSEO('/search/', 'Search NoCharge', 'Search published NoCharge games, experiences, tools, and guides by title, description, category, section, or tag.'),
  },
  {
    path: '/shop/',
    title: 'Shop',
    seo: pageSEO('/shop/', 'Shop | NoCharge', 'The NoCharge store is unavailable. No listings, outbound store links, or checkout are offered on this page.'),
  },
  {
    path: '/about/',
    title: 'About NoCharge',
    seo: pageSEO('/about/', 'About NoCharge', 'Learn what NoCharge offers: browser games, static app and release showcases, local-first tools, and original guides.'),
  },
  {
    path: '/contact/',
    title: 'Contact',
    seo: pageSEO('/contact/', 'Contact NoCharge', 'Limited contact details for accessibility-barrier reports; no general contact form or support inbox is live.'),
  },
  {
    path: '/advertising/',
    title: 'Advertising Disclosure',
    seo: pageSEO(
      '/advertising/',
      'Advertising Disclosure | NoCharge',
      'No display ads are served in V2; AdSense and H5 Games Ads remain dormant. Optional Amazon Associates paid links appear in Quiet Setup; the former non-Amazon program and its links are no longer used.',
      true,
    ),
  },
  {
    path: '/privacy/',
    title: 'Privacy',
    seo: pageSEO('/privacy/', 'Privacy | NoCharge', 'Privacy information for the NoCharge website: local browser preferences, in-page game and tool activity, external links, and the limited accessibility-barrier reporting address.', true),
  },
  {
    path: '/terms/',
    title: 'Terms',
    seo: pageSEO('/terms/', 'Terms of Use | NoCharge', 'Terms for the NoCharge browser Arcade, client-side utilities, Quiet Setup articles, static Experience showcases, and external links; app policies are separate.', true),
  },
] as const;

const appLegalPages: PrerenderPage[] = APP_LEGAL_SLUGS.flatMap((slug) =>
  (['privacy', 'terms'] as const).map((kind: AppLegalKind) => {
    const record = getAppLegalRecord(slug)!;
    const documentTitle = kind === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
    const path = `/${kind}/${slug}/`;
    const sourceProvided = record.status === 'source-provided' && Boolean(record.policies?.[kind]?.length);
    const description = sourceProvided
      ? `Publisher-supplied ${kind === 'privacy' ? 'privacy policy' : 'terms of service'} for ${record.appName}; the publisher source is identified on the page.`
      : `Publisher draft for ${record.appName}. The supplied source is marked incomplete, so this page does not present it as a final ${kind === 'privacy' ? 'privacy policy' : 'terms of service'}.`;
    return {
      path,
      title: `${record.appName} ${documentTitle}`,
      seo: pageSEO(path, `${documentTitle} — ${record.appName} | NoCharge`, description, sourceProvided),
    };
  }),
);

export const NOT_FOUND_SEO: PageSEO = {
  title: 'Page not found | NoCharge',
  description: 'The page you are looking for could not be found on NoCharge.',
  robots: 'noindex,nofollow',
};

export function normalizePath(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || '/';
  if (pathOnly === '/') return '/';
  return `/${pathOnly.split('/').filter(Boolean).join('/')}/`;
}

export interface PrerenderPage {
  path: string;
  title: string;
  seo: PageSEO;
}

export const articlePrerenderPages: PrerenderPage[] = articlesCatalog.map((article) => {
  const canonical = new URL(article.path, SITE_URL).toString();
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  return {
    path: article.path,
    title: article.title,
    seo: pageSEO(article.path, article.seoTitle, article.description, true, {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': webpageId,
          url: canonical,
          name: article.title,
          description: article.description,
          inLanguage: 'en',
          isPartOf: { '@id': SITE_WEBSITE_ID },
          mainEntity: { '@id': articleId },
        },
        {
          '@type': 'Article',
          '@id': articleId,
          headline: article.title,
          description: article.description,
          url: canonical,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          articleSection: article.category,
          inLanguage: 'en',
          mainEntityOfPage: { '@id': webpageId },
          isPartOf: { '@id': SITE_WEBSITE_ID },
          author: organizationReference(),
          publisher: organizationReference(),
        },
      ],
    }),
  };
});

export const editorialHubPages: PrerenderPage[] = [
  {
    path: '/articles/',
    title: 'Articles',
    seo: pageSEO('/articles/', articlesHubMeta.seoTitle, articlesHubMeta.description, true, {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${new URL('/articles/', SITE_URL).toString()}#collection`,
      name: articlesHubMeta.title,
      url: new URL('/articles/', SITE_URL).toString(),
      description: articlesHubMeta.description,
      isPartOf: { '@id': SITE_WEBSITE_ID },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: articlesCatalog.length,
        itemListOrder: 'https://schema.org/ItemListUnordered',
        itemListElement: articlesCatalog.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Article',
            headline: article.title,
            description: article.description,
            url: new URL(article.path, SITE_URL).toString(),
          },
        })),
      },
    }),
  },
  {
    path: '/setup/',
    title: 'Quiet Setup',
    seo: pageSEO('/setup/', setupHubMeta.seoTitle, setupHubMeta.description, true, {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${new URL('/setup/', SITE_URL).toString()}#collection`,
      name: setupHubMeta.title,
      url: new URL('/setup/', SITE_URL).toString(),
      description: setupHubMeta.description,
      isPartOf: { '@id': SITE_WEBSITE_ID },
      numberOfItems: setupArticleCatalog.length,
    }),
  },
];

export const publishedStorefrontPages: PrerenderPage[] = getPublishedStorefronts().map((brand) => {
  const path = `/shop/${brand.slug}/`;
  return {
    path,
    title: brand.brandName,
    seo: {
      title: brand.seoTitle,
      description: brand.seoDescription,
      robots: 'index,follow',
      canonical: new URL(path, SITE_URL).toString(),
    },
  };
});

function contentStructuredData(entry: PublishedCatalogEntry, canonical: string): Record<string, unknown> {
  if (entry.kind === 'guide') {
    const webpageId = `${canonical}#webpage`;
    const articleId = `${canonical}#article`;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': webpageId,
          url: canonical,
          name: entry.title,
          description: entry.summary,
          inLanguage: 'en',
          isPartOf: { '@id': SITE_WEBSITE_ID },
          mainEntity: { '@id': articleId },
        },
        {
          '@type': 'Article',
          '@id': articleId,
          headline: entry.title,
          description: entry.summary,
          url: canonical,
          datePublished: entry.publishedAt,
          dateModified: entry.updatedAt,
          articleSection: entry.category,
          keywords: entry.tags,
          inLanguage: 'en',
          mainEntityOfPage: { '@id': webpageId },
          isPartOf: { '@id': SITE_WEBSITE_ID },
          author: organizationReference(),
          publisher: organizationReference(),
        },
      ],
    };
  }

  if (entry.kind === 'tool') {
    const webpageId = `${canonical}#webpage`;
    const applicationId = `${canonical}#application`;
    const faqId = `${canonical}#faq`;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': webpageId,
          url: canonical,
          name: entry.title,
          description: entry.summary,
          inLanguage: 'en',
          isPartOf: { '@id': SITE_WEBSITE_ID },
          mainEntity: { '@id': applicationId },
        },
        {
          '@type': 'WebApplication',
          '@id': applicationId,
          name: entry.title,
          description: entry.summary,
          applicationCategory: entry.category,
          operatingSystem: 'Web browser',
          url: canonical,
          datePublished: entry.publishedAt,
          dateModified: entry.updatedAt,
          keywords: entry.tags,
          inLanguage: 'en',
          mainEntityOfPage: { '@id': webpageId },
          isPartOf: { '@id': SITE_WEBSITE_ID },
        },
        {
          '@type': 'FAQPage',
          '@id': faqId,
          url: canonical,
          isPartOf: { '@id': webpageId },
          mainEntity: entry.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    };
  }

  if (entry.kind === 'experience') {
    const webpageId = `${canonical}#webpage`;
    const applicationId = `${canonical}#application`;
    const faqId = `${canonical}#faq`;
    const editorial = entry.presentation === 'editorial-mini-site';
    const showcase = entry.presentation === 'showcase';
    const androidApp = editorial || showcase && Boolean(entry.googlePlayUrl);
    const applicationType = androidApp ? 'SoftwareApplication' : 'WebApplication';
    const schemaType: string | string[] = entry.slug === 'coosjoint'
      ? [applicationType, 'VideoGame']
      : applicationType;
    const sameAs = editorial
      ? [entry.productWebsiteUrl]
      : [entry.productWebsiteUrl, entry.googlePlayUrl, entry.itchIoUrl, entry.facebookUrl].filter((value): value is string => Boolean(value));
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': webpageId,
          url: canonical,
          name: entry.title,
          description: entry.summary,
          datePublished: entry.publishedAt,
          dateModified: entry.updatedAt,
          inLanguage: 'en',
          isPartOf: { '@id': SITE_WEBSITE_ID },
          mainEntity: { '@id': applicationId },
        },
        {
          '@type': schemaType,
          '@id': applicationId,
          name: entry.title,
          description: entry.summary,
          applicationCategory: entry.category,
          operatingSystem: androidApp ? 'Android' : 'Web browser',
          url: editorial
            ? entry.productWebsiteUrl
            : showcase ? entry.googlePlayUrl ?? entry.itchIoUrl ?? canonical : canonical,
          sameAs: sameAs.length ? sameAs : undefined,
          ...(!editorial && !showcase ? { isAccessibleForFree: true } : {}),
          ...(!editorial ? { datePublished: entry.publishedAt, dateModified: entry.updatedAt } : {}),
          keywords: [...entry.tags],
          featureList: [...entry.documentation.keyFeatures],
          inLanguage: 'en',
          mainEntityOfPage: { '@id': webpageId },
          isPartOf: { '@id': SITE_WEBSITE_ID },
          ...(editorial || showcase
            ? { publisher: { '@type': 'Organization', name: 'ITTYBITTYBITES' } }
            : { creator: organizationReference() }),
        },
        {
          '@type': 'FAQPage',
          '@id': faqId,
          url: canonical,
          isPartOf: { '@id': webpageId },
          mainEntity: entry.documentation.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    };
  }

  // Preserve the existing Arcade structured-data contract.
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: entry.title,
    description: entry.seo.description,
    applicationCategory: entry.category,
    operatingSystem: 'Web browser',
    url: canonical,
    isAccessibleForFree: true,
  };
}

export const publishedContentPages: PrerenderPage[] = getPublishedEntries(contentRegistry).map((entry) => {
  const path = getContentPath(entry);
  const canonical = new URL(path, SITE_URL).toString();
  return {
    path,
    title: entry.title,
    seo: {
      title: entry.seo.title,
      description: entry.seo.description,
      robots: 'index,follow',
      canonical,
      structuredData: contentStructuredData(entry, canonical),
    },
  };
});

export const quietSetupPages: PrerenderPage[] = setupArticleCatalog.map((article) => ({
  path: article.path,
  title: article.title,
  seo: pageSEO(article.path, article.seoTitle, article.description, true),
}));

function arcadeCategorySEO(path: string): PageSEO | undefined {
  const match = normalizePath(path).match(/^\/arcade\/categories\/([^/]+)\/$/);
  if (!match) return undefined;
  const slug = match[1];
  const category = [...new Set(getPublishedBySection('arcade').map((entry) => entry.category))]
    .find((value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '') === slug);
  if (!category) return undefined;
  return pageSEO(path, `${category} games | NoCharge Arcade`, `Published browser games in the ${category} category.`, false);
}

export function getPageSEO(pathname: string): PageSEO {
  const normalized = normalizePath(pathname);
  const staticPage = sitePages.find((page) => page.path === normalized);
  if (staticPage) return staticPage.seo;

  const editorialPage = [...editorialHubPages, ...articlePrerenderPages].find((page) => page.path === normalized);
  if (editorialPage) return editorialPage.seo;

  const appLegalPage = appLegalPages.find((page) => page.path === normalized);
  if (appLegalPage) return appLegalPage.seo;

  const contentPage = publishedContentPages.find((page) => page.path === normalized);
  if (contentPage) return contentPage.seo;

  const setupPage = quietSetupPages.find((page) => page.path === normalized);
  if (setupPage) return setupPage.seo;

  const categoryPage = arcadeCategorySEO(normalized);
  if (categoryPage) return categoryPage;

  const storefrontMatch = normalized.match(/^\/shop\/([^/]+)\/$/);
  if (storefrontMatch) {
    const brand = getStorefrontBySlug(storefrontMatch[1]);
    if (brand && brand.status === 'published') {
      return publishedStorefrontPages.find((page) => page.path === normalized)?.seo ?? {
        title: `${brand.brandName} | NoCharge Shop`,
        description: 'This brand storefront page is being prepared.',
        robots: 'noindex,follow',
      };
    }
  }
  return NOT_FOUND_SEO;
}

export const prerenderPages: PrerenderPage[] = [
  ...sitePages.map((page) => ({ path: page.path, title: page.title, seo: page.seo })),
  ...editorialHubPages,
  ...articlePrerenderPages,
  ...appLegalPages,
  ...publishedContentPages,
  ...quietSetupPages,
  ...publishedStorefrontPages,
];
export const prerenderPaths = prerenderPages.map((page) => page.path);
export const indexablePaths = prerenderPages.filter((page) => page.seo.robots === 'index,follow').map((page) => page.path);
