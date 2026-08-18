import type { Page } from '@playwright/test';

export const CONSENT_KEY = 'nocharge:consent';

/** A stored "keep analytics off" decision, so no banner or request interferes with a test. */
export const DENIED_CONSENT = {
  version: 1,
  analytics: false,
  updatedAt: '2026-08-15T12:00:00.000Z',
} as const;

/**
 * Stub every Google endpoint (analytics, AdSense, Privacy & messaging) so no
 * test ever contacts or clicks a live third party. Routed requests still emit
 * Playwright request events, so consent-order assertions keep working.
 */
export const blockGoogleEndpoints = async (page: Page) => {
  await page.route(
    /(?:googletagmanager|google-analytics|pagead2\.googlesyndication|fundingchoicesmessages\.google|googleads\.g\.doubleclick|tpc\.googlesyndication|securepubads\.g\.doubleclick)\.com/,
    async (route) => {
      await route.fulfill({ status: 204, contentType: 'text/javascript', body: '' });
    },
  );
};

/**
 * Seed a stored analytics-consent decision and stub Google endpoints before
 * page scripts run.
 *
 * The script is installed on both the page and its browser context. WebKit can
 * create an initial opaque about:blank document before the navigated document;
 * retrying on DOMContentLoaded/pageshow makes the same seed available once the
 * top-level page has a storage origin. Google's consent tag is independent of
 * this site-side analytics choice and is not touched here.
 */
export const denyOptionalServices = async (page: Page) => {
  await blockGoogleEndpoints(page);

  const persistChoice = ({ key, choice }: { key: string; choice: typeof DENIED_CONSENT }) => {
    const persist = () => {
      try {
        localStorage.setItem(key, JSON.stringify(choice));
      } catch {
        /* Opaque-origin frame: storage is unavailable and unused. */
      }
    };
    persist();
    window.addEventListener('DOMContentLoaded', persist, { once: true });
    window.addEventListener('pageshow', persist, { once: true });
  };
  const seed = { key: CONSENT_KEY, choice: DENIED_CONSENT };

  await page.context().addInitScript(persistChoice, seed);
  await page.addInitScript(persistChoice, seed);

  // A few WebKit builds initialise page storage after their first document
  // script. Apply the same already-denied choice at DOMContentLoaded as a
  // harmless test-only backstop, then notify the live consent UI.
  page.on('domcontentloaded', () => {
    void page
      .evaluate(({ key, choice }) => {
        try {
          localStorage.setItem(key, JSON.stringify(choice));
        } catch {
          return;
        }
        document.querySelector<HTMLElement>('[data-consent-banner]')?.setAttribute('hidden', '');
        window.dispatchEvent(new CustomEvent('nocharge:consentchange', { detail: choice }));
      }, seed)
      .catch(() => {
        /* navigation can replace the document while this test helper runs */
      });
  });
};
