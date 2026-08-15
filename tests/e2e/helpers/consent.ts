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
 * Seed a stored consent decision before the page scripts run.
 *
 * `addInitScript` runs in *every* frame of the page, including the sandboxed
 * ad frames (`sandbox` without `allow-same-origin`, so they have an opaque
 * origin) and their initial `about:blank` document. Reading `localStorage`
 * there throws `SecurityError`, which Playwright reports as an uncaught
 * `pageerror`. Those frames never read the consent value, so swallow it.
 */
export const denyOptionalServices = async (page: Page) => {
  await page.addInitScript(
    ({ key, choice }) => {
      try {
        localStorage.setItem(key, JSON.stringify(choice));
      } catch {
        /* Opaque-origin frame (sandboxed ad host): storage is unavailable and unused. */
      }
    },
    { key: CONSENT_KEY, choice: DENIED_CONSENT },
  );
};
