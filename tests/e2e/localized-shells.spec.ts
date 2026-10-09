import { expect, test } from '@playwright/test';

// Localized routes (/tr/, /fr-ca/, /es/, /de/) render translated chrome and
// game-shell controls around the English body copy. These checks cover the
// behavior the language work promises: document language, navigation labels,
// shell controls, pinned word games, and returning-visitor routing from the root.

test('returning visitor with a stored Turkish preference is routed from / to /tr/', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('nocharge:pref:language', JSON.stringify('tr'));
  });
  await page.goto('/');
  await page.waitForURL('**/tr/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('html')).toHaveAttribute('data-locale', 'tr');
});

test('returning visitor with a stored Spanish preference is routed from / to /es/', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('nocharge:pref:language', JSON.stringify('es'));
  });
  await page.goto('/');
  await page.waitForURL('**/es/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('html')).toHaveAttribute('data-locale', 'es');
});

test('returning visitor with a stored German preference is routed from / to /de/', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('nocharge:pref:language', JSON.stringify('de'));
  });
  await page.goto('/');
  await page.waitForURL('**/de/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('html')).toHaveAttribute('data-locale', 'de');
});

test('Turkish home page sets the document language and translates the navigation', async ({ page }) => {
  await page.goto('/tr/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  const nav = page.getByRole('navigation', { name: 'Ana gezinme' });
  await expect(nav.getByRole('link', { name: 'Oyunlar' })).toBeVisible();
  await expect(page.locator('[data-locale-option="tr"]').first()).toHaveAttribute('aria-current', 'true');
});

test('Spanish home page sets the document language and translates the navigation', async ({ page }) => {
  await page.goto('/es/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link', { name: 'Juegos' })).toBeVisible();
  await expect(page.locator('[data-locale-option="es"]').first()).toHaveAttribute('aria-current', 'true');
});

test('German home page sets the document language and translates the navigation', async ({ page }) => {
  await page.goto('/de/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
  await expect(nav.getByRole('link', { name: 'Spiele' })).toBeVisible();
  await expect(page.locator('[data-locale-option="de"]').first()).toHaveAttribute('aria-current', 'true');
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

test('Spanish Color Flip shell controls and game HUD are translated', async ({ page }) => {
  await page.goto('/es/games/color-flip/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('[data-game-toolbar="pause"]').first()).toHaveText('Pausar el juego');
  // Decoupled game HUD strings come from the es dictionary.
  await expect(page.getByRole('group', { name: 'Cuadrícula de casillas para avanzar con toques' })).toBeVisible();
  await expect(page.locator('[data-cf="hint"]')).toContainText('Elige un color para esta ronda');
});

test('German Color Flip shell controls and game HUD are translated', async ({ page }) => {
  await page.goto('/de/games/color-flip/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('[data-game-toolbar="pause"]').first()).toHaveText('Spiel pausieren');
  // Decoupled game HUD strings come from the de dictionary.
  await expect(page.getByRole('group', { name: 'Feldraster zum Tippen und Weitergehen' })).toBeVisible();
  await expect(page.locator('[data-cf="hint"]')).toContainText('Wählen Sie eine Farbe für diese Runde');
});

test('FreeCell HUD counters are labeled in Spanish and German', async ({ page }) => {
  await page.goto('/es/games/freecell/');
  await expect(page.locator('[data-fc="moves"]').locator('xpath=..')).toContainText('Movimientos');
  await expect(page.locator('[data-fc="won"]').locator('xpath=..')).toContainText('Ganadas');

  await page.goto('/de/games/freecell/');
  await expect(page.locator('[data-fc="moves"]').locator('xpath=..')).toContainText('Züge');
  await expect(page.locator('[data-fc="won"]').locator('xpath=..')).toContainText('Gewonnen');
});

test('Spanish and German editorial pages keep the English body behind a localized notice', async ({ page }) => {
  await page.goto('/es/articles/what-quiet-arcade-means-at-nocharge/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('main')).toHaveAttribute('lang', 'en');
  const notice = page.locator('aside.locale-notice');
  await expect(notice).toContainText('Esta página por ahora solo está disponible en inglés.');
  await expect(notice.getByRole('link', { name: 'Leer en inglés' })).toHaveAttribute('href', '/articles/what-quiet-arcade-means-at-nocharge/');

  await page.goto('/de/articles/what-quiet-arcade-means-at-nocharge/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('main')).toHaveAttribute('lang', 'en');
  await expect(page.locator('aside.locale-notice')).toContainText('Diese Seite ist bisher nur auf Englisch verfügbar.');
  await expect(page.locator('aside.locale-notice').getByRole('link', { name: 'Auf Englisch lesen' })).toHaveAttribute(
    'href',
    '/articles/what-quiet-arcade-means-at-nocharge/',
  );
});

test('word games send localized visitors to the English game', async ({ page }) => {
  // The pinned notice replaces the URL with the English game (see PinnedGameNotice).
  // Word lists are ASCII-only, so the engine never runs under a localized route.
  await page.goto('/tr/games/hangman/');
  await page.waitForURL((url) => url.pathname === '/games/hangman/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('Spanish and German word-game URLs land on the English game', async ({ page }) => {
  await page.goto('/es/games/hangman/');
  await page.waitForURL((url) => url.pathname === '/games/hangman/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.goto('/de/games/hangman/');
  await page.waitForURL((url) => url.pathname === '/games/hangman/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
