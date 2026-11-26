import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App, preloadPageForPath } from './App';
import type { PageComponents } from './App';
import { ThemeProvider } from './theme/ThemeProvider';
import { SeasonalThemeProvider } from './theme/SeasonalThemeProvider';
import './design-system/tokens.css';
import './theme/event-palettes.css';
import './styles.css';
import './editorial.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('NoCharge root element was not found.');
const root: HTMLElement = rootElement;

function normalizePath(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || '/';
  if (pathOnly === '/') return '/';
  return `/${pathOnly.split('/').filter(Boolean).join('/')}/`;
}

function applicationTree(pageComponents?: PageComponents) {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <SeasonalThemeProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <App pageComponents={pageComponents} />
          </BrowserRouter>
        </SeasonalThemeProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

// Hydrate only when the static HTML was rendered for this route. A static-host
// 404 or an SPA fallback can serve a different page shell for a deep URL.
const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
const path = window.location.pathname;
const appPath = basePath && path.startsWith(`${basePath}/`)
  ? path.slice(basePath.length)
  : basePath && path === basePath
    ? '/'
    : path;
const renderedPath = root.dataset.prerenderedPath;
const hasMatchingPrerender = Boolean(
  renderedPath
  && root.querySelector('.site-shell')
  && normalizePath(renderedPath) === normalizePath(appPath),
);

async function mountApplication(): Promise<void> {
  if (root.querySelector('.site-shell') && hasMatchingPrerender) {
    // Resolve the initial route chunk before hydration. The static HTML remains
    // visible during this request, and the matching component avoids a lazy
    // Suspense boundary suspending against already-rendered server markup.
    const initialPage = await preloadPageForPath(appPath);
    hydrateRoot(root, applicationTree({ [initialPage.routeId]: initialPage.component }));
    return;
  }
  createRoot(root).render(applicationTree());
}

void mountApplication().catch(() => {
  // If a prerendered page chunk cannot be fetched, still mount the app through
  // its route-level lazy fallback instead of leaving a permanently static shell.
  createRoot(root).render(applicationTree());
});
