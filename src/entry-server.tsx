import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App, pageRouteIdForPath } from './App';
import type { PageRouteId, ServerPageComponents } from './App';
import { ThemeProvider } from './theme/ThemeProvider';
import { SeasonalThemeProvider } from './theme/SeasonalThemeProvider';

async function serverPageComponentsFor(routeId: PageRouteId, pathname: string): Promise<ServerPageComponents> {
  switch (routeId) {
    case 'home': return { home: (await import('./pages/HomePage')).HomePage };
    case 'arcadeHub': return { arcadeHub: (await import('./pages/ArcadePage')).ArcadePage };
    case 'experiencesHub': return { experiencesHub: (await import('./pages/ExperiencesPage')).ExperiencesPage };
    case 'toolsHub': return { toolsHub: (await import('./pages/ToolsPage')).ToolsPage };
    case 'guidesHub': return { guidesHub: (await import('./pages/GuidesPage')).GuidesPage };
    case 'discover': return { discover: (await import('./pages/DiscoverPage')).DiscoverPage };
    case 'shop': return { shop: (await import('./pages/ShopPage')).ShopPage };
    case 'storefrontBrand': return { storefrontBrand: (await import('./pages/StorefrontBrandPage')).StorefrontBrandRoute };
    case 'arcadeCategory': return { arcadeCategory: (await import('./pages/ArcadeCategoryRoute')).ArcadeCategoryRoute };
    case 'arcadeDetail': {
      const { ContentPageRoute } = await import('./pages/ContentPageRoute');
      return { arcadeDetail: () => <ContentPageRoute section="arcade" /> };
    }
    case 'experienceDetail': {
      const { ContentPageRoute } = await import('./pages/ContentPageRoute');
      return { experienceDetail: () => <ContentPageRoute section="experiences" /> };
    }
    case 'toolsDetail': {
      const { ContentPageRoute } = await import('./pages/ContentPageRoute');
      return { toolsDetail: () => <ContentPageRoute section="tools" /> };
    }
    case 'guideDetail': {
      const { ContentPageRoute } = await import('./pages/ContentPageRoute');
      return { guideDetail: () => <ContentPageRoute section="guides" /> };
    }
    case 'notFound': return { notFound: (await import('./pages/NotFoundPage')).NotFoundPage };
    case 'search': return { search: (await import('./pages/SearchPage')).SearchPage };
    case 'about': return { about: (await import('./pages/AboutPage')).AboutPage };
    case 'contact': return { contact: (await import('./pages/ContactPage')).ContactPage };
    case 'advertising': return { advertising: (await import('./pages/AdvertisingPage')).AdvertisingPage };
    case 'articlesHub': return { articlesHub: (await import('./pages/EditorialHubPages')).ArticlesHubPage };
    case 'articleDetail': {
      const slug = pathname.split(/[?#]/, 1)[0].split('/').filter(Boolean)[1] ?? '';
      const { loadArticle } = await import('./content/articleContent');
      const article = await loadArticle(slug);
      if (!article) return { articleDetail: (await import('./pages/NotFoundPage')).NotFoundPage };
      const { ArticlePage } = await import('./pages/ArticlesPage');
      return { articleDetail: () => <ArticlePage article={article} /> };
    }
    case 'setupHub': return { setupHub: (await import('./pages/EditorialHubPages')).QuietSetupHubPage };
    case 'setupDetail': {
      const slug = pathname.split(/[?#]/, 1)[0].split('/').filter(Boolean)[1] ?? '';
      const { loadSetupArticle } = await import('./content/setupContent');
      const article = await loadSetupArticle(slug);
      if (!article) return { setupDetail: (await import('./pages/NotFoundPage')).NotFoundPage };
      const { QuietSetupArticle } = await import('./pages/SetupPage');
      return { setupDetail: () => <QuietSetupArticle article={article} /> };
    }
    case 'privacy': {
      const { LegalPage } = await import('./pages/LegalPages');
      return { privacy: () => <LegalPage kind="privacy" /> };
    }
    case 'terms': {
      const { LegalPage } = await import('./pages/LegalPages');
      return { terms: () => <LegalPage kind="terms" /> };
    }
    case 'appLegal': return { appLegal: (await import('./pages/AppLegalPage')).AppLegalPage };
  }
}

export async function render(url: string): Promise<string> {
  const basename = import.meta.env.BASE_URL;
  const normalizedBase = basename.endsWith('/') ? basename : `${basename}/`;
  const location = normalizedBase === '/'
    ? url
    : `${normalizedBase}${url.replace(/^\/+/, '')}`;
  const pageComponents = await serverPageComponentsFor(pageRouteIdForPath(url), url);

  return renderToString(
    <ThemeProvider>
      <SeasonalThemeProvider>
        <StaticRouter basename={normalizedBase} location={location}>
          <App pageComponents={pageComponents} />
        </StaticRouter>
      </SeasonalThemeProvider>
    </ThemeProvider>,
  );
}
