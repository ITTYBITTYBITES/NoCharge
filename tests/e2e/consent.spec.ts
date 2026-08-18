import { expect, test } from '@playwright/test';

import { CONSENT_KEY, blockGoogleEndpoints } from './helpers/consent';

/**
 * Google's Privacy & messaging consent message manages advertising choices,
 * so these tests only touch the site's analytics consent dialog. Requests to
 * every Google endpoint are stubbed so no test ever waits on or hits a live
 * third party, and no test clicks on an ad.
 */

test('blocks optional analytics until the visitor chooses', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await blockGoogleEndpoints(page);

  await page.goto('/');

  await expect(page.locator('[data-consent-banner]')).toBeVisible();
  expect(requests.some((url) => /googletagmanager|google-analytics/.test(url))).toBe(false);
});

test('stores analytics-only choices and loads analytics only when allowed', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await blockGoogleEndpoints(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Customize' }).click();
  await page.locator('[data-consent-modal] [data-consent-analytics]').check();
  await page.getByRole('button', { name: 'Save choices' }).click();

  await expect(page.locator('[data-consent-banner]')).toBeHidden();
  await expect.poll(() => requests.some((url) => url.includes('googletagmanager.com/gtag/js'))).toBe(true);

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), CONSENT_KEY);
  expect(stored).toMatchObject({ version: 1, analytics: true });
  // The obsolete Adsterra advertising boolean is gone from the schema.
  expect('advertising' in stored).toBe(false);
});

test('the site dialog never claims to control Google advertising', async ({ page }) => {
  await blockGoogleEndpoints(page);
  await page.goto('/');

  await page.getByRole('button', { name: 'Customize' }).click();
  const modal = page.locator('[data-consent-modal]');
  await expect(modal).toBeVisible();

  // No advertising toggle remains anywhere in the dialog.
  await expect(modal.locator('[data-consent-advertising]')).toHaveCount(0);
  await expect(modal.getByRole('checkbox')).toHaveCount(1);
  await expect(modal.getByRole('checkbox', { name: /^Analytics\b/ })).toBeVisible();
  // The dialog points advertising choices at Google's own consent message.
  await expect(modal).toContainText("Advertising choices are shown by Google");

  // The consent API exposes analytics only.
  const api = await page.evaluate(() => (window as Window & { NoChargeConsent: { get: () => Record<string, unknown> } }).NoChargeConsent.get());
  expect(Object.keys(api).sort()).toEqual(['analytics', 'updatedAt', 'version']);
});

test('ignores a legacy stored advertising boolean instead of translating it into Google consent', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await blockGoogleEndpoints(page);
  await page.addInitScript(
    ({ key }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          analytics: true,
          advertising: true,
          updatedAt: '2026-08-15T12:00:00.000Z',
        }),
      );
    },
    { key: CONSENT_KEY },
  );

  await page.goto('/');

  // The legacy analytics value is respected…
  await expect.poll(() => requests.some((url) => url.includes('googletagmanager.com/gtag/js'))).toBe(true);
  // …while the legacy advertising boolean is dropped from the live choice.
  const api = await page.evaluate(() => (window as Window & { NoChargeConsent: { get: () => Record<string, unknown> } }).NoChargeConsent.get());
  expect(api).toMatchObject({ version: 1, analytics: true });
  expect('advertising' in api).toBe(false);
  // And no Google consent or TCF state is fabricated by NoCharge.
  expect(await page.evaluate(() => typeof (window as Window & { __tcfapi?: unknown }).__tcfapi)).toBe('undefined');
});
