import { expect, test } from '@playwright/test';

// Localized routes (/tr/, /fr-ca/, /es/, /de/, /pt-br/, /ja/, /nl/) render translated chrome and
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

// Portuguese (Brazil), Japanese, and Dutch. Each row is checked against the
// strings in its own dictionary, so a missing or mistyped key shows up here.
const NEW_LOCALES = [
  {
    code: 'pt-br',
    path: '/pt-br/',
    htmlLang: 'pt-BR',
    navName: 'Principal',
    navArcade: 'Jogos',
    pause: 'Pausar o jogo',
    hintStart: 'Escolha uma cor para esta rodada',
    gridName: 'Grade de peças para avançar com toques',
    freecellMoves: 'Movimentos',
    freecellWon: 'Vencidas',
    englishOnly: 'Por enquanto, esta página está disponível somente em inglês.',
    readEnglish: 'Leia em inglês',
    nativeName: 'Português (Brasil)',
  },
  {
    code: 'ja',
    path: '/ja/',
    htmlLang: 'ja',
    navName: 'メイン',
    navArcade: 'アーケード',
    pause: 'ゲームを一時停止',
    hintStart: 'このラウンドの色を選び',
    gridName: 'タップで進むタイルのグリッド',
    freecellMoves: '手数',
    freecellWon: '勝利',
    englishOnly: 'このページは現在、英語版のみです。',
    readEnglish: '英語で読む',
    nativeName: '日本語',
  },
  {
    code: 'nl',
    path: '/nl/',
    htmlLang: 'nl',
    navName: 'Hoofdmenu',
    navArcade: 'Spellen',
    pause: 'Spel pauzeren',
    hintStart: 'Kies een kleur voor deze ronde',
    gridName: 'Raster van tegels om op te tikken',
    freecellMoves: 'Zetten',
    freecellWon: 'Gewonnen',
    englishOnly: 'Deze pagina is voorlopig alleen in het Engels beschikbaar.',
    readEnglish: 'Lees hem in het Engels',
    nativeName: 'Nederlands',
  },
] as const;

for (const locale of NEW_LOCALES) {
  test(`returning visitor with a stored ${locale.nativeName} preference is routed from / to ${locale.path}`, async ({ page }) => {
    await page.addInitScript((code) => {
      window.localStorage.setItem('nocharge:pref:language', JSON.stringify(code));
    }, locale.code);
    await page.goto('/');
    await page.waitForURL(`**${locale.path}`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('html')).toHaveAttribute('data-locale', locale.code);
  });

  test(`${locale.nativeName} home page sets the document language and translates the navigation`, async ({ page }) => {
    await page.goto(locale.path);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    const nav = page.getByRole('navigation', { name: locale.navName });
    await expect(nav.getByRole('link', { name: locale.navArcade })).toBeVisible();
    await expect(page.locator(`[data-locale-option="${locale.code}"]`).first()).toHaveAttribute('aria-current', 'true');
  });

  test(`${locale.nativeName} Color Flip shell controls and game HUD are translated`, async ({ page }) => {
    await page.goto(`${locale.path}games/color-flip/`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('[data-game-toolbar="pause"]').first()).toHaveText(locale.pause);
    await expect(page.getByRole('group', { name: locale.gridName })).toBeVisible();
    await expect(page.locator('[data-cf="hint"]')).toContainText(locale.hintStart);
  });

  test(`${locale.nativeName} FreeCell HUD counters are translated`, async ({ page }) => {
    await page.goto(`${locale.path}games/freecell/`);
    await expect(page.locator('[data-fc="moves"]').locator('xpath=..')).toContainText(locale.freecellMoves);
    await expect(page.locator('[data-fc="won"]').locator('xpath=..')).toContainText(locale.freecellWon);
  });

  test(`${locale.nativeName} editorial page keeps the English body behind a localized notice`, async ({ page }) => {
    await page.goto(`${locale.path}articles/what-quiet-arcade-means-at-nocharge/`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('main')).toHaveAttribute('lang', 'en');
    const notice = page.locator('aside.locale-notice');
    await expect(notice).toContainText(locale.englishOnly);
    await expect(notice.getByRole('link', { name: locale.readEnglish })).toHaveAttribute(
      'href',
      '/articles/what-quiet-arcade-means-at-nocharge/',
    );
  });

  test(`${locale.nativeName} word games send visitors to the English game`, async ({ page }) => {
    await page.goto(`${locale.path}games/hangman/`);
    await page.waitForURL((url) => url.pathname === '/games/hangman/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
}

test('the language switcher offers Português (Brasil), 日本語, and Nederlands in the footer', async ({ page }) => {
  await page.goto('/');
  for (const locale of NEW_LOCALES) {
    const option = page.locator(`footer [data-locale-option="${locale.code}"]`);
    await expect(option).toHaveText(locale.nativeName);
    await expect(option).toHaveAttribute('lang', locale.htmlLang);
    await expect(option).toHaveAttribute('href', locale.path);
  }
});

test('the header language menu lists every language without growing the header', async ({ page }) => {
  await page.goto('/ja/');
  const summary = page.locator('.lang-menu__summary');
  await expect(summary).toContainText('日本語');
  const headerHeight = async () => Math.round((await page.locator('.site-header').boundingBox())?.height ?? 0);
  const closedHeight = await headerHeight();
  await summary.click();
  const panel = page.locator('.lang-menu__panel');
  await expect(panel.getByRole('link', { name: 'Português (Brasil)' })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Nederlands' })).toBeVisible();
  await expect(panel.locator('[data-locale-option="ja"]')).toHaveAttribute('aria-current', 'true');
  // The open panel floats over the page, so the header keeps its one-row height.
  expect(await headerHeight()).toBe(closedHeight);
  expect(closedHeight).toBeLessThanOrEqual(100);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});
