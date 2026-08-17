import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test('accessibility statement returns 200 with unique metadata and canonical URL', async ({ page, request }) => {
  const response = await request.get('/accessibility/');
  expect(response.status()).toBe(200);

  await page.goto('/accessibility/');
  await expect(page).toHaveTitle('Accessibility Statement · NoCharge');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /How NoCharge approaches keyboard, touch, pointer, focus, motion, color, and assistive-technology support/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://nocharge.net/accessibility/');
});

test('accessibility statement has one H1, breadcrumbs, and logical heading structure', async ({ page }) => {
  await page.goto('/accessibility/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('.breadcrumbs')).toBeVisible();

  const levels = await page.evaluate(() =>
    [...document.querySelectorAll('main h1, main h2, main h3')].map((heading) => Number(heading.tagName[1])),
  );
  expect(levels[0]).toBe(1);
  for (let index = 1; index < levels.length; index += 1) {
    // Headings descend one level at a time; no level is skipped or jumped.
    expect(Math.abs(levels[index] - levels[index - 1])).toBeLessThanOrEqual(1);
  }
  expect(levels.filter((level) => level === 2).length).toBeGreaterThan(5);
});

test('accessibility statement links the verified address and omits ads and structured data', async ({ page }) => {
  await page.goto('/accessibility/');

  const mailtoLinks = await page
    .getByRole('link')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute('href'))
        .filter((href): href is string => typeof href === 'string' && href.startsWith('mailto:')),
    );
  expect(mailtoLinks).toContain('mailto:hello@nocharge.net');

  await expect(page.locator('[data-consent-ad]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});
