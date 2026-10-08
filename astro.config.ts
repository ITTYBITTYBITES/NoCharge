import { defineConfig } from 'astro/config';
import { localizedRoutes } from './src/i18n/localized-routes';

export default defineConfig({
  site: 'https://nocharge.net',
  output: 'static',
  build: {
    format: 'directory',
  },
  // English stays at the root. Turkish and Canadian French live under
  // /tr/ and /fr-ca/. Pages are mirrored by `localizedRoutes()`; see
  // src/i18n/localized-routes.ts.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr', 'fr-ca'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [localizedRoutes()],
  vite: {
    server: {
      host: true,
      allowedHosts: true,
    },
    preview: {
      host: true,
      allowedHosts: true,
    },
  },
});
