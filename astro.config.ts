import { defineConfig } from 'astro/config';
import { localizedRoutes } from './src/i18n/localized-routes';

export default defineConfig({
  site: 'https://nocharge.net',
  output: 'static',
  build: {
    format: 'directory',
  },
  // English stays at the root. Turkish, Canadian French, Spanish, and German
  // live under /tr/, /fr-ca/, /es/, and /de/. Pages are mirrored by
  // `localizedRoutes()`; see src/i18n/localized-routes.ts.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr', 'fr-ca', 'es', 'de'],
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
