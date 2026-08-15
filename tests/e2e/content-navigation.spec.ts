import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

test('home features games while the arcade owns the full game collection', async ({ page }) => {
  await denyOptionalServices(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Quick games.*Clear guides.*No clutter/s);
  await expect(page.locator('#games .game-card')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'A growing play library' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Understand the game before the next run' })).toBeVisible();

  await page.getByRole('link', { name: 'Enter the arcade' }).click();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Small games built for real breaks.');
  await expect(page.locator('.arcade-grid .game-card')).toHaveCount(3);
  await expect(page.locator('.primary-nav').getByRole('link', { name: 'Arcade', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('guide library connects guide articles, games, and sitemap URLs', async ({ page, request }) => {
  await denyOptionalServices(page);
  await page.goto('/guides/');

  await expect(page.locator('.guides-grid .guide-card')).toHaveCount(3);
  await page.locator('.guides-grid .guide-card a').first().click();
  await expect(page).toHaveURL(/\/guides\/memory-match\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Memory Match Guide');
  await expect(page.getByRole('link', { name: 'Play Memory Match' })).toHaveAttribute('href', '/games/memory-match/');
  await expect(page.locator('.guide-prose h2')).toHaveCount(5);

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  expect(xml).toContain('<loc>https://nocharge.net/arcade/</loc>');
  expect(xml).toContain('<loc>https://nocharge.net/guides/</loc>');
  expect(xml).toContain('<loc>https://nocharge.net/guides/memory-match/</loc>');
  expect((xml.match(/<url>/g) ?? []).length).toBe(10);
});
