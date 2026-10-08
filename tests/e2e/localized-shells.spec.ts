import { expect, test } from '@playwright/test';

// Localized routes (/tr/, /fr-ca/) render translated chrome and game-shell
// controls around the English body copy. These checks cover the behavior the
// language work promises: document language, navigation labels, shell
// controls, pinned word games, and returning-visitor routing from the root.

test('returning visitor with a stored Turkish preference is routed from / to /tr/', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('nocharge:pref:language', JSON.stringify('tr'));
  });
  await page.goto('/');
  await page.waitForURL('**/tr/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('html')).toHaveAttribute('data-locale', 'tr');
});

test('Turkish home page sets the document language and translates the navigation', async ({ page }) => {
  await page.goto('/tr/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  const nav = page.getByRole('navigation', { name: 'Ana gezinme' });
  await expect(nav.getByRole('link', { name: 'Oyunlar' })).toBeVisible();
  await expect(page.locator('[data-locale-option="tr"]').first()).toHaveAttribute('aria-current', 'true');
});

test('English root keeps the English document language and navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Arcade' })).toBeVisible();
});

test('Turkish Color Flip shell controls are translated', async ({ page }) => {
  await page.goto('/tr/games/color-flip/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('[data-game-toolbar="pause"]').first()).toHaveText('Oyunu duraklat');
});

test('French-Canadian Color Flip shell controls are translated and tagged fr-CA', async ({ page }) => {
  await page.goto('/fr-ca/games/color-flip/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CA');
  await expect(page.locator('[data-game-toolbar="pause"]').first()).toHaveText('Mettre le jeu en pause');
});

test('word games send localized visitors to the English game', async ({ page }) => {
  // The pinned notice replaces the URL with the English game (see PinnedGameNotice).
  // Word lists are ASCII-only, so the engine never runs under a localized route.
  await page.goto('/tr/games/hangman/');
  await page.waitForURL((url) => url.pathname === '/games/hangman/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
