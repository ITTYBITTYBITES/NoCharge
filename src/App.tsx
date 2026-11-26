import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ElementType } from 'react';
import { Route, Routes, useLocation, useNavigationType } from 'react-router';
import type { PageSEO } from './site';
import { SiteLayout } from './layouts/SiteLayout';
import { usePageSEO } from './seo/usePageSEO';
import { loadArticle } from './content/articleContent';
import { loadSetupArticle } from './content/setupContent';

export type PageRouteId =
  | 'home'
  | 'arcadeHub'
  | 'experiencesHub'
  | 'toolsHub'
  | 'guidesHub'
  | 'discover'
  | 'shop'
  | 'storefrontBrand'
  | 'arcadeCategory'
  | 'arcadeDetail'
  | 'experienceDetail'
  | 'toolsDetail'
  | 'guideDetail'
  | 'notFound'
  | 'search'
  | 'about'
  | 'contact'
  | 'advertising'
  | 'articlesHub'
  | 'articleDetail'
  | 'setupHub'
  | 'setupDetail'
  | 'privacy'
  | 'terms'
  | 'appLegal';

export type PageComponents = Partial<Record<PageRouteId, ElementType>>;
/** Server-only component overrides keep every prerender synchronous and complete. */
export type ServerPageComponents = PageComponents;

type PageLoader = () => Promise<{ default: ComponentType }>;

const pageLoaders: Record<PageRouteId, PageLoader> = {
  home: () => import('./pages/HomePage').then(({ HomePage }) => ({ default: HomePage })),
  arcadeHub: () => import('./pages/ArcadePage').then(({ ArcadePage }) => ({ default: ArcadePage })),
  experiencesHub: () => import('./pages/ExperiencesPage').then(({ ExperiencesPage }) => ({ default: ExperiencesPage })),
  toolsHub: () => import('./pages/ToolsPage').then(({ ToolsPage }) => ({ default: ToolsPage })),
  guidesHub: () => import('./pages/GuidesPage').then(({ GuidesPage }) => ({ default: GuidesPage })),
  discover: () => import('./pages/DiscoverPage').then(({ DiscoverPage }) => ({ default: DiscoverPage })),
  shop: () => import('./pages/ShopPage').then(({ ShopPage }) => ({ default: ShopPage })),
  storefrontBrand: () => import('./pages/StorefrontBrandPage').then(({ StorefrontBrandRoute }) => ({ default: StorefrontBrandRoute })),
  arcadeCategory: () => import('./pages/ArcadeCategoryRoute').then(({ ArcadeCategoryRoute }) => ({ default: ArcadeCategoryRoute })),
  arcadeDetail: () => import('./pages/ContentPageRoute').then(({ ContentPageRoute }) => ({ default: () => <ContentPageRoute section="arcade" /> })),
  experienceDetail: () => import('./pages/ContentPageRoute').then(({ ContentPageRoute }) => ({ default: () => <ContentPageRoute section="experiences" /> })),
  toolsDetail: () => import('./pages/ContentPageRoute').then(({ ContentPageRoute }) => ({ default: () => <ContentPageRoute section="tools" /> })),
  guideDetail: () => import('./pages/ContentPageRoute').then(({ ContentPageRoute }) => ({ default: () => <ContentPageRoute section="guides" /> })),
  notFound: () => import('./pages/NotFoundPage').then(({ NotFoundPage }) => ({ default: NotFoundPage })),
  search: () => import('./pages/SearchPage').then(({ SearchPage }) => ({ default: SearchPage })),
  about: () => import('./pages/AboutPage').then(({ AboutPage }) => ({ default: AboutPage })),
  contact: () => import('./pages/ContactPage').then(({ ContactPage }) => ({ default: ContactPage })),
  advertising: () => import('./pages/AdvertisingPage').then(({ AdvertisingPage }) => ({ default: AdvertisingPage })),
  articlesHub: () => import('./pages/EditorialHubPages').then(({ ArticlesHubPage }) => ({ default: ArticlesHubPage })),
  articleDetail: () => import('./pages/ArticlesPage').then(({ ArticlePageRoute }) => ({ default: ArticlePageRoute })),
  setupHub: () => import('./pages/EditorialHubPages').then(({ QuietSetupHubPage }) => ({ default: QuietSetupHubPage })),
  setupDetail: () => import('./pages/SetupPage').then(({ SetupPageRoute }) => ({ default: SetupPageRoute })),
  privacy: () => import('./pages/LegalPages').then(({ LegalPage }) => ({ default: () => <LegalPage kind="privacy" /> })),
  terms: () => import('./pages/LegalPages').then(({ LegalPage }) => ({ default: () => <LegalPage kind="terms" /> })),
  appLegal: () => import('./pages/AppLegalPage').then(({ AppLegalPage }) => ({ default: AppLegalPage })),
};

const clientPageComponents: Record<PageRouteId, ElementType> = {
  home: lazy(pageLoaders.home),
  arcadeHub: lazy(pageLoaders.arcadeHub),
  experiencesHub: lazy(pageLoaders.experiencesHub),
  toolsHub: lazy(pageLoaders.toolsHub),
  guidesHub: lazy(pageLoaders.guidesHub),
  discover: lazy(pageLoaders.discover),
  shop: lazy(pageLoaders.shop),
  storefrontBrand: lazy(pageLoaders.storefrontBrand),
  arcadeCategory: lazy(pageLoaders.arcadeCategory),
  arcadeDetail: lazy(pageLoaders.arcadeDetail),
  experienceDetail: lazy(pageLoaders.experienceDetail),
  toolsDetail: lazy(pageLoaders.toolsDetail),
  guideDetail: lazy(pageLoaders.guideDetail),
  notFound: lazy(pageLoaders.notFound),
  search: lazy(pageLoaders.search),
  about: lazy(pageLoaders.about),
  contact: lazy(pageLoaders.contact),
  advertising: lazy(pageLoaders.advertising),
  articlesHub: lazy(pageLoaders.articlesHub),
  articleDetail: lazy(pageLoaders.articleDetail),
  setupHub: lazy(pageLoaders.setupHub),
  setupDetail: lazy(pageLoaders.setupDetail),
  privacy: lazy(pageLoaders.privacy),
  terms: lazy(pageLoaders.terms),
  appLegal: lazy(pageLoaders.appLegal),
};

function normalizePath(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || '/';
  if (pathOnly === '/') return '/';
  return `/${pathOnly.split('/').filter(Boolean).join('/')}/`;
}

export function pageRouteIdForPath(pathname: string): PageRouteId {
  const route = normalizePath(pathname);
  if (route === '/') return 'home';
  if (route === '/arcade/') return 'arcadeHub';
  if (route === '/experiences/') return 'experiencesHub';
  if (route === '/tools/') return 'toolsHub';
  if (route === '/guides/') return 'guidesHub';
  if (route === '/discover/') return 'discover';
  if (route === '/shop/') return 'shop';
  if (/^\/shop\/[^/]+\/$/u.test(route)) return 'storefrontBrand';
  if (/^\/arcade\/categories\/[^/]+\/$/u.test(route)) return 'arcadeCategory';
  if (/^\/arcade\/[^/]+\/$/u.test(route)) return 'arcadeDetail';
  if (/^\/experiences\/[^/]+\/$/u.test(route)) return 'experienceDetail';
  if (/^\/tools\/[^/]+\/$/u.test(route)) return 'toolsDetail';
  if (/^\/guides\/[^/]+\/$/u.test(route)) return 'guideDetail';
  if (route === '/search/') return 'search';
  if (route === '/about/') return 'about';
  if (route === '/contact/') return 'contact';
  if (route === '/advertising/') return 'advertising';
  if (route === '/articles/') return 'articlesHub';
  if (/^\/articles\/[^/]+\/$/u.test(route)) return 'articleDetail';
  if (route === '/setup/') return 'setupHub';
  if (/^\/setup\/[^/]+\/$/u.test(route)) return 'setupDetail';
  if (/^\/(?:privacy|terms)\/[^/]+\/$/u.test(route)) return 'appLegal';
  if (route === '/privacy/') return 'privacy';
  if (route === '/terms/') return 'terms';
  return 'notFound';
}

/** Resolve only the initial route component before hydration to avoid suspending
 * a server-rendered boundary while its lazy page chunk is still in flight. */
export async function preloadPageForPath(pathname: string): Promise<{ routeId: PageRouteId; component: ComponentType }> {
  const routeId = pageRouteIdForPath(pathname);
  if (routeId === 'articleDetail') {
    const slug = normalizePath(pathname).split('/')[2] ?? '';
    const article = await loadArticle(slug);
    if (!article) {
      const { NotFoundPage } = await import('./pages/NotFoundPage');
      return { routeId, component: NotFoundPage };
    }
    const { ArticlePage } = await import('./pages/ArticlesPage');
    return { routeId, component: () => <ArticlePage article={article} /> };
  }
  if (routeId === 'setupDetail') {
    const slug = normalizePath(pathname).split('/')[2] ?? '';
    const article = await loadSetupArticle(slug);
    if (!article) {
      const { NotFoundPage } = await import('./pages/NotFoundPage');
      return { routeId, component: NotFoundPage };
    }
    const { QuietSetupArticle } = await import('./pages/SetupPage');
    return { routeId, component: () => <QuietSetupArticle article={article} /> };
  }
  const { default: component } = await pageLoaders[routeId]();
  return { routeId, component };
}

function RoutedPage({ routeId, pageComponents }: { routeId: PageRouteId; pageComponents?: PageComponents }) {
  const Page = pageComponents?.[routeId] ?? clientPageComponents[routeId];
  return (
    <Suspense fallback={<p className="route-loading" role="status" aria-live="polite">Loading page…</p>}>
      <Page />
    </Suspense>
  );
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function scrollInstantlyToTop(): void {
  window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
}

function scrollInstantlyToHash(hash: string): () => void {
  const fragment = hash.slice(1);
  if (!fragment) {
    scrollInstantlyToTop();
    return () => {};
  }

  let targetId = fragment;
  try {
    targetId = decodeURIComponent(fragment);
  } catch {
    // Keep the literal fragment as a fallback if the URL contains bad escapes.
  }

  let observer: MutationObserver | null = null;
  let timeoutId: number | null = null;
  const stopWatching = () => {
    observer?.disconnect();
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  };
  const scrollToTarget = () => {
    const target = document.getElementById(targetId);
    if (!target) return false;
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    stopWatching();
    return true;
  };

  if (scrollToTarget()) return stopWatching;

  // Clear any previous route's retained scroll while a lazy destination loads.
  // If its fragment is rendered shortly after the route transition, move there.
  scrollInstantlyToTop();
  observer = new MutationObserver(() => { scrollToTarget(); });
  observer.observe(document.body, { childList: true, subtree: true });
  timeoutId = window.setTimeout(stopWatching, 5_000);
  return stopWatching;
}

function RouteScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousLocationKey = useRef(location.key);

  useIsomorphicLayoutEffect(() => {
    if (previousLocationKey.current === location.key) return;
    previousLocationKey.current = location.key;

    // Leave POP navigation to the browser's native scroll restoration.
    if (navigationType === 'POP') return;
    if (location.hash) return scrollInstantlyToHash(location.hash);
    scrollInstantlyToTop();
  }, [location.key, location.hash, navigationType]);

  return null;
}

function RouteContent({ pageComponents }: { pageComponents?: PageComponents }) {
  const location = useLocation();
  const initialPath = useRef(location.pathname);
  const [pageSEO, setPageSEO] = useState<PageSEO | null>(null);

  // Static HTML already has its final SEO metadata. Load the larger metadata
  // module only after client navigation, not during the initial route load.
  useEffect(() => {
    if (initialPath.current === location.pathname) return;
    initialPath.current = location.pathname;
    let cancelled = false;
    void import('./site').then(({ getPageSEO }) => {
      if (!cancelled) setPageSEO(getPageSEO(location.pathname));
    });
    return () => { cancelled = true; };
  }, [location.pathname]);
  usePageSEO(pageSEO);

  const page = (routeId: PageRouteId) => <RoutedPage routeId={routeId} pageComponents={pageComponents} />;

  return (
    <Routes>
      <Route path="/" element={page('home')} />
      <Route path="/arcade/" element={page('arcadeHub')} />
      <Route path="/experiences/" element={page('experiencesHub')} />
      <Route path="/tools/" element={page('toolsHub')} />
      <Route path="/guides/" element={page('guidesHub')} />
      <Route path="/discover/" element={page('discover')} />
      <Route path="/shop/" element={page('shop')} />
      <Route path="/shop/:brandSlug/" element={page('storefrontBrand')} />
      <Route path="/arcade/categories/:slug/" element={page('arcadeCategory')} />
      <Route path="/arcade/:slug/" element={page('arcadeDetail')} />
      <Route path="/experiences/:slug/" element={page('experienceDetail')} />
      <Route path="/tools/:slug/" element={page('toolsDetail')} />
      <Route path="/guides/:slug/" element={page('guideDetail')} />
      <Route path="/discover/collections/:slug/" element={page('notFound')} />
      <Route path="/search/" element={page('search')} />
      <Route path="/about/" element={page('about')} />
      <Route path="/contact/" element={page('contact')} />
      <Route path="/advertising/" element={page('advertising')} />
      <Route path="/articles/" element={page('articlesHub')} />
      <Route path="/articles/:slug/" element={page('articleDetail')} />
      <Route path="/setup/" element={page('setupHub')} />
      <Route path="/setup/:slug/" element={page('setupDetail')} />
      <Route path="/privacy/" element={page('privacy')} />
      <Route path="/terms/" element={page('terms')} />
      <Route path="/privacy/:appSlug/" element={page('appLegal')} />
      <Route path="/terms/:appSlug/" element={page('appLegal')} />
      <Route path="*" element={page('notFound')} />
    </Routes>
  );
}

export function App({ pageComponents }: { pageComponents?: PageComponents } = {}) {
  return (
    <SiteLayout>
      <RouteScrollManager />
      <RouteContent pageComponents={pageComponents} />
    </SiteLayout>
  );
}
