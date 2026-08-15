const { chromium } = require('@playwright/test');

module.exports = {
  ci: {
    collect: {
      url: [
        'http://127.0.0.1:4323/',
        'http://127.0.0.1:4323/arcade/',
        'http://127.0.0.1:4323/guides/',
        'http://127.0.0.1:4323/games/memory-match/',
        'http://127.0.0.1:4323/games/word-tile-rush/',
        'http://127.0.0.1:4323/games/color-flip/',
      ],
      numberOfRuns: 1,
      startServerCommand: 'npx astro preview --host 127.0.0.1 --port 4323',
      startServerReadyPattern: 'Local',
      startServerReadyTimeout: 30_000,
      chromePath: chromium.executablePath(),
      puppeteerScript: 'scripts/lighthouse-consent.cjs',
      puppeteerLaunchOptions: {
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      },
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        budgets: require('./budget.json'),
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
    },
  },
};
