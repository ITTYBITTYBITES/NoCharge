import { expect, test } from '@playwright/test';
import { denyOptionalServices } from './helpers/consent';

test.beforeEach(async ({ page }) => denyOptionalServices(page));

test('site search returns matching games, guides, and tools from the static index', async ({ page }) => {
  await page.goto('/search/');
  const input = page.locator('#search-input');
  await expect(input).toBeVisible();

  await input.fill('solitaire');
  await expect(page.locator('#search-status')).toContainText('result');
  const results = page.locator('#results-list .result-item');
  await expect(results.first()).toBeVisible();
  const titles = await results.locator('.result-item__title').allTextContents();
  expect(titles.join(' ')).toContain('Klondike');

  // The query is reflected in the URL so searches are shareable.
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/q=solitaire/);
});

test('site search shows a clear no-results state and recovers', async ({ page }) => {
  await page.goto('/search/');
  await page.locator('#search-input').fill('zzzznotapage');
  await expect(page.locator('#no-results')).toBeVisible();
  await expect(page.locator('#results-list .result-item')).toHaveCount(0);

  await page.locator('#search-input').fill('nonogram');
  await expect(page.locator('#no-results')).toBeHidden();
  await expect(page.locator('#results-list .result-item').first()).toBeVisible();
});

test('site search opens from the header and an initial query runs on load', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Search NoCharge' }).click();
  await expect(page).toHaveURL(/\/search\/?$/);
  await expect(page.locator('#search-input')).toBeFocused();

  await page.goto('/search/?q=ambient');
  await expect(page.locator('#results-list .result-item').first()).toBeVisible();
  await expect(page.locator('#results-list .result-item__title').first()).toContainText('Ambient Mixer');
});
