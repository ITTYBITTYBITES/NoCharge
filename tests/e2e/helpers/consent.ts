import type { Page } from '@playwright/test';

export const CONSENT_KEY = 'nocharge:consent';

/** A stored "reject optional" decision, so no banner or ad interferes with a test. */
export const DENIED_CONSENT = {
  version: 1,
  analytics: false,
  advertising: false,
  updatedAt: '2026-08-15T12:00:00.000Z',
} as const;

/**
 * Seed a stored consent decision before page scripts run.
 *
 * The script is installed on both the page and its browser context. WebKit can
 * create an initial opaque about:blank document before the navigated document;
 * retrying on DOMContentLoaded/pageshow makes the same seed available once the
 * top-level page has a storage origin. Opaque sandboxed ad frames still safely
 * ignore the failed storage write.
 */
export const denyOptionalServices = async (page: Page) => {
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
