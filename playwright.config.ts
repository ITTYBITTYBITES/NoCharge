import { defineConfig, devices } from '@playwright/test';

const fullBrowserMatrix = process.env.FULL_BROWSER_MATRIX === '1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['line']] : [['list']],
  use: {
    // The meta CSP intentionally omits `upgrade-insecure-requests`: WebKit
    // applies the meta directive to plain-HTTP preview servers too, upgrading
    // `http://localhost` to HTTPS and failing the TLS handshake. The directive
    // is applied only at the production edge via response headers (see
    // SECURITY.md). Keep the trusted `localhost` name for the preview server.
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(fullBrowserMatrix
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
          {
            name: 'mobile-chromium',
            use: { ...devices['Pixel 5'] },
          },
          {
            name: 'mobile-webkit',
            use: { ...devices['iPhone 13'] },
          },
        ]
      : []),
  ],
  webServer: {
    command: './node_modules/.bin/astro preview --host=localhost --port=4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
