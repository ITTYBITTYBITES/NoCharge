import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

test('Memory Match cards use meaningful, lazy-loaded square artwork', async ({ page }) => {
  await denyOptionalServices(page);
  await page.goto('/');

  const card = page.locator('.game-card', { hasText: 'Memory Match' });
  const artwork = card.locator('[data-game-artwork="square"]');
  const image = artwork.locator('img');

  await expect(artwork).toBeVisible();
  await expect(artwork.locator('source[type="image/webp"]')).toHaveAttribute(
    'srcset',
    '/game-art/memory-match/cover-square.webp',
  );
  await expect(image).toHaveAttribute('src', '/game-art/memory-match/cover-square.jpg');
  await expect(image).toHaveAttribute('alt', /overlapping dark cards.*matching emerald diamonds/i);
  await expect(image).toHaveAttribute('width', '800');
  await expect(image).toHaveAttribute('height', '800');
  await expect(image).toHaveAttribute('loading', 'lazy');
  await expect(card).not.toContainText('🃏');
});

test('Memory Match game header uses responsive, intrinsic LCP artwork and social metadata', async ({ page }) => {
  await denyOptionalServices(page);
  await page.goto('/games/memory-match/');

  const artwork = page.locator('.game-shell__artwork');
  const image = artwork.locator('img');

  await expect(artwork.locator('source[media="(max-width: 36rem)"][type="image/webp"]')).toHaveAttribute(
    'srcset',
    '/game-art/memory-match/cover-square.webp',
  );
  await expect(artwork.locator('source[media="(max-width: 36rem)"][type="image/jpeg"]')).toHaveAttribute(
    'srcset',
    '/game-art/memory-match/cover-square.jpg',
  );
  await expect(image).toHaveAttribute('src', '/game-art/memory-match/cover-landscape.jpg');
  await expect(image).toHaveAttribute('width', '1280');
  await expect(image).toHaveAttribute('height', '720');
  await expect(image).toHaveAttribute('loading', 'eager');
  await expect(image).toHaveAttribute('fetchpriority', 'high');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://nocharge.net/game-art/memory-match/social-card.webp',
  );
});

test('Memory Match guide provides header art, a decorative icon, and an accessible controls diagram', async ({ page }) => {
  await denyOptionalServices(page);
  await page.goto('/guides/memory-match/');

  const headerImage = page.locator('.guide-header__artwork img');
  await expect(page.locator('.guide-header__artwork source[type="image/webp"]')).toHaveAttribute(
    'srcset',
    '/game-art/memory-match/guide-header.webp',
  );
  await expect(headerImage).toHaveAttribute('src', '/game-art/memory-match/guide-header.jpg');
  await expect(headerImage).toHaveAttribute('alt', /overlapping dark cards.*matching emerald diamonds/i);

  const playIcon = page.locator('.guide-play__icon');
  await expect(playIcon).toHaveAttribute('alt', '');
  await expect(playIcon).toHaveAttribute('aria-hidden', 'true');

  const diagram = page.locator('.guide-diagram img');
  await expect(diagram).toHaveAttribute('src', '/game-art/memory-match/controls-diagram.svg');
  await expect(diagram).toHaveAttribute('width', '960');
  await expect(diagram).toHaveAttribute('height', '520');
  await expect(diagram).toHaveAttribute('loading', 'lazy');
  await expect(diagram).toHaveAttribute('alt', /Each two-card attempt|Choose one hidden card/i);
  await expect(page.locator('.guide-diagram figcaption')).toContainText('Each two-card attempt is one move');
});
