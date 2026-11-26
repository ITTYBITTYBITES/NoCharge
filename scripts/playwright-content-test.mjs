import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportDirectory = path.join(root, '.nocharge-review', 'content-phase4c');
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'mobile-390', width: 390, height: 844 },
];
const modes = ['light', 'dark'];
const eventPreview = 'halloween';
const routes = [
  { path: '/', selector: '#home-title', text: 'Play, explore' },
  { path: '/arcade/', selector: '.page-intro h1', text: 'Arcade' },
  { path: '/experiences/', selector: '.page-intro h1', text: 'App Experiences' },
  { path: '/tools/', selector: '.page-intro h1', text: 'Tools' },
  { path: '/guides/', selector: '.page-intro h1', text: 'Guides' },
  { path: '/discover/', selector: '.page-intro h1', text: 'Good things' },
  { path: '/search/?q=pattern%20pairs', selector: '.page-intro h1', text: 'Find your next' },
  { path: '/shop/', selector: '.page-intro h1', text: 'Shop' },
  { path: '/contact/', selector: '.page-intro h1', text: 'Report an accessibility barrier' },
  { path: '/advertising/', selector: '.page-intro h1', text: 'Advertising Disclosure' },
  { path: '/setup/60-keyboards-and-arrow-key-access/', selector: '.setup-article h1', text: '60% keyboards and arrow key access' },
  { path: '/privacy/', selector: '.page-intro h1', text: 'Privacy' },
  { path: '/terms/', selector: '.page-intro h1', text: 'Terms of use' },
  { path: '/arcade/pattern-pairs/', selector: '.detail-header h1', text: 'Pattern Pairs' },
  { path: '/arcade/sum-sprint/', selector: '.detail-header h1', text: 'Sum Sprint' },
  { path: '/arcade/simon/', selector: '.detail-header h1', text: 'Simon' },
  { path: '/arcade/lights-out/', selector: '.detail-header h1', text: 'Lights Out' },
  { path: '/arcade/last-token/', selector: '.detail-header h1', text: 'Last Token' },
  { path: '/arcade/hangman/', selector: '.detail-header h1', text: 'Hangman' },
  { path: '/arcade/tic-tac-toe/', selector: '.detail-header h1', text: 'Tic-Tac-Toe' },
  { path: '/arcade/four-in-a-row/', selector: '.detail-header h1', text: 'Four in a Row' },
  { path: '/arcade/twenty-forty-eight/', selector: '.detail-header h1', text: 'Twenty Forty-Eight' },
  { path: '/arcade/word-loom/', selector: '.detail-header h1', text: 'Word Loom' },
  { path: '/arcade/beacon-lattice/', selector: '.detail-header h1', text: 'Beacon Lattice' },
  { path: '/arcade/checkers/', selector: '.detail-header h1', text: 'Checkers' },
  { path: '/arcade/color-flip/', selector: '.detail-header h1', text: 'Color Flip' },
  { path: '/arcade/dots-and-boxes/', selector: '.detail-header h1', text: 'Dots & Boxes' },
  { path: '/arcade/freecell/', selector: '.detail-header h1', text: 'FreeCell' },
  { path: '/arcade/gomoku/', selector: '.detail-header h1', text: 'Gomoku' },
  { path: '/arcade/klondike/', selector: '.detail-header h1', text: 'Klondike' },
  { path: '/arcade/memory-match/', selector: '.detail-header h1', text: 'Memory Match' },
  { path: '/arcade/minesweeper/', selector: '.detail-header h1', text: 'Minesweeper' },
  { path: '/arcade/mini-sudoku/', selector: '.detail-header h1', text: 'Mini Sudoku' },
  { path: '/arcade/nine-mens-morris/', selector: '.detail-header h1', text: "Nine Men's Morris" },
  { path: '/arcade/nonogram/', selector: '.detail-header h1', text: 'Nonogram' },
  { path: '/arcade/pass-the-picture/', selector: '.detail-header h1', text: 'Pass the Picture' },
  { path: '/arcade/reversi/', selector: '.detail-header h1', text: 'Reversi' },
  { path: '/arcade/sudoku-9x9/', selector: '.detail-header h1', text: 'Sudoku 9×9' },
  { path: '/arcade/tile-garden/', selector: '.detail-header h1', text: 'Tile Garden' },
  { path: '/arcade/word-search/', selector: '.detail-header h1', text: 'Word Search' },
  { path: '/arcade/word-tile-rush/', selector: '.detail-header h1', text: 'Word Tile Rush' },
  { path: '/tools/word-counter/', selector: '.detail-header h1', text: 'Word Counter' },
  { path: '/tools/json-workbench/', selector: '.detail-header h1', text: 'JSON Workbench' },
  { path: '/tools/contrast-checker/', selector: '.detail-header h1', text: 'Contrast Checker' },
  { path: '/tools/discovery-wheel/', selector: '.detail-header h1', text: 'Discovery Wheel', assetId: 'NC11-B02-R3.1', iconId: 'discovery-wheel-tool' },
  { path: '/tools/game-finder/', selector: '.detail-header h1', text: 'Game Finder', assetId: 'NC12-B02-R3.1', iconId: 'game-finder-tool' },
  { path: '/tools/session-planner/', selector: '.detail-header h1', text: 'Session Planner', assetId: 'NC13-B02-R3.1', iconId: 'session-planner-tool' },
  { path: '/tools/random-activity/', selector: '.detail-header h1', text: 'Random Activity Picker', assetId: 'NC14-B02-R3.1', iconId: 'random-activity-tool' },
  { path: '/tools/ambient-mixer/', selector: '.detail-header h1', text: 'Ambient Mixer', assetId: 'NC15-B02-R3.1', iconId: 'ambient-mixer-tool' },
  { path: '/tools/singing-bowl-engine/', selector: '.detail-header h1', text: 'Singing Bowl Engine', assetId: 'NC16-B02-R3.1', iconId: 'singing-bowl-tool' },
  { path: '/tools/reduced-motion-tester/', selector: '.detail-header h1', text: 'Reduced Motion Preference Tester', assetId: 'NC17-B02-R3.1', iconId: 'reduced-motion-tool' },
  { path: '/tools/touch-target-checker/', selector: '.detail-header h1', text: 'Touch Target Size Checker', assetId: 'NC18-B02-R3.1', iconId: 'touch-target-tool' },
  { path: '/tools/storage-inspector/', selector: '.detail-header h1', text: 'Local Storage Key Inspector', assetId: 'NC19-B02-R3.1', iconId: 'storage-inspector-tool' },
  { path: '/tools/zoom-visualizer/', selector: '.detail-header h1', text: 'Zoom Viewport Visualizer', assetId: 'NC20-B02-R3.1', iconId: 'zoom-visualizer-tool' },
  { path: '/tools/nonogram-clue-calculator/', selector: '.detail-header h1', text: 'Nonogram Clue Calculator' },
  { path: '/tools/solitaire-comparator/', selector: '.detail-header h1', text: 'Solitaire Rules Comparator' },
  { path: '/tools/sudoku-helper/', selector: '.detail-header h1', text: 'Sudoku Pencil-Mark Helper' },
  { path: '/tools/focus-order-demo/', selector: '.detail-header h1', text: 'Keyboard Focus Order Demo' },
  { path: '/tools/word-scoring/', selector: '.detail-header h1', text: 'Word Scoring Formula Explorer' },
  { path: '/guides/a-practical-guide-to-interface-contrast/', selector: '.detail-header h1', text: 'interface contrast' },
  { path: '/guides/a-local-first-workflow-for-browser-tools/', selector: '.detail-header h1', text: 'local-first workflow' },
];
const phase4cRouteIds = {
  '/arcade/beacon-lattice/': 'beacon-lattice',
  '/arcade/checkers/': 'checkers',
  '/arcade/color-flip/': 'color-flip',
  '/arcade/dots-and-boxes/': 'dots-and-boxes',
  '/arcade/freecell/': 'freecell',
  '/arcade/gomoku/': 'gomoku',
  '/arcade/klondike/': 'klondike',
  '/arcade/memory-match/': 'memory-match',
  '/arcade/minesweeper/': 'minesweeper',
  '/arcade/mini-sudoku/': 'mini-sudoku',
  '/arcade/nine-mens-morris/': 'nine-mens-morris',
  '/arcade/nonogram/': 'nonogram',
  '/arcade/pass-the-picture/': 'pass-the-picture',
  '/arcade/reversi/': 'reversi',
  '/arcade/sudoku-9x9/': 'sudoku-9x9',
  '/arcade/tile-garden/': 'tile-garden',
  '/arcade/word-search/': 'word-search',
  '/arcade/word-tile-rush/': 'word-tile-rush',
};

const server = await preview({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  logLevel: 'error',
  preview: { host: '127.0.0.1', port: 0, strictPort: false },
});
const address = server.httpServer.address();
assert.ok(address && typeof address === 'object', 'production preview listens on a TCP port');
const origin = `http://127.0.0.1:${address.port}`;
let browser;
const pageErrors = [];
const consoleErrors = [];
const failedRequests = [];
let routeChecks = 0;
let routeScrollChecks = 0;
let responsiveChecks = 0;
let interactionChecks = 0;
let passAndPlayLayoutChecks = 0;

function pathWithEvent(route) {
  const url = new URL(route, origin);
  url.searchParams.set('previewEvent', eventPreview);
  return url.href;
}

async function expectNoHorizontalOverflow(page, label) {
  const state = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    width: window.innerWidth,
  }));
  assert.equal(state.width, label.includes('mobile') ? 390 : 1440, `${label} viewport is correct`);
  assert.ok(state.html <= state.client + 1 && state.body <= state.client + 1, `${label} has no horizontal overflow (${JSON.stringify(state)})`);
  responsiveChecks += 1;
}

async function expectPageHasNoBrokenLabels(page, route) {
  const result = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const labelledBy = [...document.querySelectorAll('[aria-labelledby]')]
      .flatMap((element) => (element.getAttribute('aria-labelledby') ?? '').split(/\s+/u));
    return { duplicates, missingLabelTargets: labelledBy.filter((id) => !ids.includes(id)) };
  });
  assert.deepEqual(result.duplicates, [], `${route} contains no duplicate IDs`);
  assert.deepEqual(result.missingLabelTargets, [], `${route} aria-labelledby targets exist`);
}

async function startPhase4cGame(page, route) {
  await page.goto(pathWithEvent(route), { waitUntil: 'domcontentloaded' });
  const game = page.locator('.phase4c-game');
  await game.waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.waitForFunction(() => document.querySelector('.phase4c-game')?.getAttribute('data-game-state') === 'playing');
  return game;
}

async function verifyArcadePauseResume(page, label, checkBlur = false) {
  const before = await page.locator('.interactive-module').getAttribute('data-game-state');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => document.querySelector('.arcade-runtime-provider')?.getAttribute('data-arcade-paused') === 'true');
  assert.equal(await page.locator('.interactive-module').getAttribute('data-game-state'), 'paused', `${label} pauses on document visibility loss`);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
  });
  await page.waitForFunction(() => document.querySelector('.arcade-runtime-provider')?.getAttribute('data-arcade-paused') === 'false');
  assert.equal(await page.locator('.interactive-module').getAttribute('data-game-state'), before, `${label} resumes the same game state after visibility returns`);
  if (checkBlur) {
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForFunction(() => document.querySelector('.arcade-runtime-provider')?.getAttribute('data-arcade-paused') === 'true');
    assert.equal(await page.locator('.interactive-module').getAttribute('data-game-state'), 'paused', `${label} pauses on browser blur`);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => document.querySelector('.arcade-runtime-provider')?.getAttribute('data-arcade-paused') === 'false');
    assert.equal(await page.locator('.interactive-module').getAttribute('data-game-state'), before, `${label} resumes after browser focus returns`);
  }
}


async function readPassAndPlayLayout(page, boardSelector) {
  await page.evaluate(() => document.fonts.ready);
  const geometry = await page.evaluate((selector) => {
    if (!window.__passAndPlayLayoutShiftObserver
      && typeof PerformanceObserver === 'function'
      && PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      window.__passAndPlayLayoutShiftEntries = [];
      window.__passAndPlayLayoutShiftObserver = new PerformanceObserver((list) => {
        window.__passAndPlayLayoutShiftEntries.push(...list.getEntries().map((entry) => ({
          value: entry.value,
          hadRecentInput: entry.hadRecentInput,
        })));
      });
      window.__passAndPlayLayoutShiftObserver.observe({ type: 'layout-shift', buffered: false });
    }
    const status = document.querySelector('.arcade-pass-and-play > .module-live-status');
    const board = document.querySelector(selector);
    if (!status || !board) return null;
    const statusRect = status.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    return { statusHeight: statusRect.height, boardTop: boardRect.top + window.scrollY };
  }, boardSelector);
  assert.ok(geometry, `pass-and-play status and ${boardSelector} are measurable`);
  return { statusHeight: Number(geometry.statusHeight.toFixed(2)), boardTop: Number(geometry.boardTop.toFixed(2)) };
}

async function expectDirectPassAndPlayTurn(page, boardSelector, expectedStatus, before, label) {
  const status = page.locator('.arcade-pass-and-play > .module-live-status');
  await page.waitForFunction((expected) => document.querySelector('.arcade-pass-and-play > .module-live-status')?.textContent?.trim() === expected, expectedStatus);
  assert.equal(await status.innerText(), expectedStatus, `${label} announces the active player immediately`);
  assert.equal(await page.getByRole('button', { name: /^Ready\b/iu }).count(), 0, `${label} has no mandatory Ready control between turns`);
  assert.equal(await page.locator('.phase4c-handoff, .four-in-a-row-handoff, .last-token-handoff, .tic-tac-toe-handoff[aria-label="Pass-and-play handoff"]').count(), 0, `${label} renders no pass gate`);
  const after = await readPassAndPlayLayout(page, boardSelector);
  assert.equal(after.statusHeight, before.statusHeight, `${label} status banner keeps a stable height between turns`);
  assert.equal(after.boardTop, before.boardTop, `${label} board/canvas does not move vertically between turns`);
  const layoutShifts = await page.evaluate(() => ({
    supported: Boolean(window.__passAndPlayLayoutShiftObserver),
    unexpected: (window.__passAndPlayLayoutShiftEntries ?? []).filter((entry) => !entry.hadRecentInput),
  }));
  assert.ok(layoutShifts.supported, `${label} has the Chromium layout-shift observer for CLS measurement`);
  assert.deepEqual(layoutShifts.unexpected, [], `${label} generates zero layout shift outside recent input`);
  passAndPlayLayoutChecks += 1;
}

async function runPassAndPlayTurnMatrix(page, setCurrentRoute) {
  setCurrentRoute('/arcade/last-token/ (matrix direct-turn geometry)');
  await page.goto(pathWithEvent('/arcade/last-token/'), { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Start round' }).click();
  let before = await readPassAndPlayLayout(page, '.last-token-pile');
  await page.getByRole('button', { name: 'Take 1 token' }).click();
  await expectDirectPassAndPlayTurn(page, '.last-token-pile', "Player 2's Turn. Take one, two, or three tokens.", before, 'Last Token');
  assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Last Token player change is not a break');

  setCurrentRoute('/arcade/tic-tac-toe/ (matrix direct-turn geometry)');
  await page.goto(pathWithEvent('/arcade/tic-tac-toe/'), { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Start match' }).click();
  before = await readPassAndPlayLayout(page, '.tic-tac-toe-grid');
  await page.locator('.tic-tac-toe-cell').nth(0).click();
  await expectDirectPassAndPlayTurn(page, '.tic-tac-toe-grid', "Player 2's Turn. Place your O.", before, 'Tic-Tac-Toe');
  assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Tic-Tac-Toe player change is not a break');

  setCurrentRoute('/arcade/four-in-a-row/ (matrix direct-turn geometry)');
  await page.goto(pathWithEvent('/arcade/four-in-a-row/'), { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Start round' }).click();
  before = await readPassAndPlayLayout(page, '.four-in-a-row-board');
  await page.locator('.four-in-a-row-row').nth(0).locator('.four-in-a-row-cell').nth(0).click();
  await expectDirectPassAndPlayTurn(page, '.four-in-a-row-board', "Player 2's Turn. Choose a column.", before, 'Four in a Row');
  assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Four in a Row player change is not a break');

  setCurrentRoute('/arcade/checkers/ (matrix direct-turn geometry)');
  await startPhase4cGame(page, '/arcade/checkers/');
  before = await readPassAndPlayLayout(page, '.checkers-board');
  await page.getByRole('button', { name: 'Row 6, column 1, man red' }).click();
  await page.getByRole('button', { name: 'Row 5, column 2, empty' }).click();
  await expectDirectPassAndPlayTurn(page, '.checkers-board', "Player 2's Turn. Black moves.", before, 'Checkers');
  assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Checkers player change is not a break');

  setCurrentRoute('/arcade/dots-and-boxes/ (matrix direct-turn geometry)');
  await startPhase4cGame(page, '/arcade/dots-and-boxes/');
  before = await readPassAndPlayLayout(page, '.phase4c-boxes');
  await page.getByRole('button', { name: 'Draw horizontal edge row 1, column 1' }).click();
  await expectDirectPassAndPlayTurn(page, '.phase4c-boxes', "Player 2's Turn.", before, 'Dots & Boxes');
  assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Dots & Boxes player change is not a break');

  setCurrentRoute('/arcade/gomoku/ (matrix direct-turn geometry)');
  await startPhase4cGame(page, '/arcade/gomoku/');
  before = await readPassAndPlayLayout(page, '.gomoku-board');
  await page.getByRole('button', { name: 'Row 8, column 8, empty' }).click();
  await expectDirectPassAndPlayTurn(page, '.gomoku-board', "Player 2's Turn.", before, 'Gomoku');
  assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Gomoku player change is not a break');

  setCurrentRoute('/arcade/nine-mens-morris/ (matrix direct-turn geometry)');
  await startPhase4cGame(page, '/arcade/nine-mens-morris/');
  before = await readPassAndPlayLayout(page, '.phase4c-morris-board');
  await page.getByRole('button', { name: /^Point 1, empty/u }).click();
  await expectDirectPassAndPlayTurn(page, '.phase4c-morris-board', "Player 2's Turn.", before, "Nine Men's Morris");
  assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', "a Nine Men's Morris player change is not a break");

  setCurrentRoute('/arcade/pass-the-picture/ (matrix direct-turn geometry)');
  await startPhase4cGame(page, '/arcade/pass-the-picture/');
  before = await readPassAndPlayLayout(page, '.phase4c-drawing-surface');
  await page.locator('.phase4c-drawing-surface').click({ position: { x: 80, y: 80 } });
  await expectDirectPassAndPlayTurn(page, '.phase4c-drawing-surface', "Artist 2's Turn.", before, 'Pass the Picture');
  assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Pass the Picture artist change is not a break');

  setCurrentRoute('/arcade/reversi/ (matrix direct-turn geometry)');
  await startPhase4cGame(page, '/arcade/reversi/');
  before = await readPassAndPlayLayout(page, '.reversi-board');
  await page.locator('.phase4c-cell--reversi.is-legal').first().click();
  await expectDirectPassAndPlayTurn(page, '.reversi-board', "Player 2's Turn.", before, 'Reversi');
  assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Reversi player change is not a break');

  interactionChecks += 9;
}

async function expectRelatedGuideNavigationScroll(page, setCurrentRoute) {
  const sourceRoute = '/guides/a-practical-guide-to-interface-contrast/';
  const destinationRoute = '/guides/a-local-first-workflow-for-browser-tools/';
  setCurrentRoute(`${sourceRoute} → ${destinationRoute} (SPA scroll and history)`);
  await page.goto(pathWithEvent(sourceRoute), { waitUntil: 'domcontentloaded' });

  const relatedHeading = page.getByRole('heading', { name: 'Related Guides & Tools', exact: true });
  await relatedHeading.waitFor({ state: 'visible' });
  await relatedHeading.scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(() => window.scrollY) > 0, 'the related guides section is reached from a scrolled position');

  const relatedCardLink = page.locator('.related-content .catalog-card__title-link')
    .filter({ hasText: 'A local-first workflow for browser tools' });
  await relatedCardLink.click();
  await page.waitForURL((url) => url.pathname === destinationRoute);
  await page.locator('.detail-header h1').filter({ hasText: 'A local-first workflow for browser tools' }).waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => window.scrollY), 0, 'related-card SPA navigation starts the destination at window.scrollY === 0');
  routeScrollChecks += 1;
  interactionChecks += 1;

  await page.goBack();
  await page.waitForURL((url) => url.pathname === sourceRoute);
  await page.locator('.detail-header h1').filter({ hasText: 'A practical guide to checking interface contrast' }).waitFor({ state: 'visible' });
  await page.goForward();
  await page.waitForURL((url) => url.pathname === destinationRoute);
  await page.locator('.detail-header h1').filter({ hasText: 'A local-first workflow for browser tools' }).waitFor({ state: 'visible' });
}

try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  for (const mode of modes) {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme: mode,
        timezoneId: 'America/New_York',
        reducedMotion: 'reduce',
      });
      await context.addInitScript((theme) => {
        try {
          localStorage.setItem('nocharge-theme', theme);
          localStorage.setItem('nocharge-seasonal-mode', 'auto');
        } catch { /* Assertions below verify the effective preference. */ }
      }, mode);
      const page = await context.newPage();
      page.setDefaultTimeout(8_000);
      page.setDefaultNavigationTimeout(15_000);
      let currentRoute = '';
      page.on('pageerror', (error) => pageErrors.push({ mode, viewport: viewport.name, route: currentRoute, message: error.message }));
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push({ mode, viewport: viewport.name, route: currentRoute, message: message.text() });
      });
      page.on('requestfailed', (request) => failedRequests.push({ mode, viewport: viewport.name, route: currentRoute, url: request.url(), reason: request.failure()?.errorText ?? 'unknown' }));

      for (const route of routes) {
        currentRoute = route.path;
        const response = await page.goto(pathWithEvent(route.path), { waitUntil: 'domcontentloaded' });
        assert.equal(response?.status(), 200, `${route.path} returns HTTP 200 (${mode}, ${viewport.name})`);
        await page.waitForFunction(({ theme, event }) => document.documentElement.dataset.theme === theme
          && document.documentElement.dataset.event === event
          && document.querySelector('select[aria-label="Seasonal theme preference"]')?.value === 'auto',
        { theme: mode, event: eventPreview });
        await page.locator(route.selector).waitFor({ state: 'visible' });
        await page.locator(route.selector).getByText(route.text, { exact: false }).waitFor({ state: 'visible' });
        assert.equal(await page.locator('main#main-content').count(), 1, `${route.path} has the shared main landmark`);
        assert.equal(await page.locator('a[href="/shop/"], a[href="https://store.nocharge.net"]').count(), 0, `${route.path} has no active Shop or store link`);
        assert.equal(await page.locator('footer a[href="/advertising/"]').count(), 1, `${route.path} has the legal/footer Advertising Disclosure link`);
        if (route.path === '/advertising/') {
          assert.equal(await page.locator('[data-advertising-status="current-v2-no-display-ads"]').count(), 1, 'the advertising page identifies the current V2 configuration');
          await page.getByRole('heading', { name: 'Amazon Associates in Quiet Setup', exact: true }).waitFor({ state: 'visible' });
          await page.locator('section[aria-labelledby="advertising-retired-title"]')
            .getByText('The former non-Amazon affiliate program and its links are no longer used.', { exact: false })
            .waitFor({ state: 'visible' });
          await page.getByText('As an Amazon Associate I earn from qualifying purchases.', { exact: false }).waitFor({ state: 'visible' });
          await page.locator('section[aria-labelledby="advertising-display-title"]')
            .getByText('No display advertising is served in the current V2 build.', { exact: false })
            .waitFor({ state: 'visible' });
          await page.getByText('AdSense and H5 Games Ads placements and adapters remain dormant', { exact: false }).waitFor({ state: 'visible' });
        }
        if (route.path.startsWith('/setup/')) {
          const article = page.locator('.setup-article');
          const firstAmazonLink = article.locator('a[href^="https://www.amazon.com/"]').first();
          await firstAmazonLink.waitFor({ state: 'visible' });
          assert.equal(await article.locator('[data-disclosure-networks="amazon"]').count(), 1, 'Quiet Setup renders an Amazon-only article disclosure');
          assert.equal(await article.locator('a[href^="https://www.amazon.com/"]').count(), 2, 'the representative Quiet Setup page preserves its two Amazon links');
          assert.equal(await firstAmazonLink.getAttribute('target'), '_blank', 'Quiet Setup Amazon link opens a new tab');
          assert.equal(await firstAmazonLink.getAttribute('rel'), 'sponsored nofollow noopener noreferrer', 'Quiet Setup Amazon link preserves its exact rel value');
          assert.ok((await firstAmazonLink.textContent())?.includes('(paid link)'), 'Quiet Setup paid link keeps its visible paid label');
          assert.equal(await article.evaluate((element) => {
            const statement = [...element.querySelectorAll('strong')].find((node) => node.textContent?.trim() === 'As an Amazon Associate I earn from qualifying purchases.');
            const link = element.querySelector('a[href^="https://www.amazon.com/"]');
            return Boolean(statement && link && (statement.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING));
          }), true, 'the exact Associates statement precedes the first Amazon link in the browser DOM');
        }
        if (route.path === '/contact/') {
          assert.equal(await page.locator('a[href="mailto:hello@nocharge.net"]').count(), 1, 'Contact preserves the limited accessibility-barrier reporting address');
          await page.getByText('No general contact form or support inbox is live.', { exact: false }).waitFor({ state: 'visible' });
          await page.getByText('No response time is promised.', { exact: false }).waitFor({ state: 'visible' });
        }
        if (route.path === '/privacy/') {
          assert.equal(await page.locator('[data-privacy-content-status]').count(), 0, 'Privacy carries no obsolete review-required marker');
          assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'index,follow', 'Privacy is indexable after the recorded content approval');
          await page.getByText('does not require a user account and does not operate a server-side database for Arcade play or tool entries', { exact: false }).waitFor({ state: 'visible' });
          await page.getByText('nocharge-theme', { exact: false }).waitFor({ state: 'visible' });
          await page.getByText('hello@nocharge.net', { exact: false }).waitFor({ state: 'visible' });
          await page.getByText('The YouTube player is created only after you press its Play button.', { exact: false }).waitFor({ state: 'visible' });
          assert.equal(await page.locator('a[href="/shop/"], a[href="https://store.nocharge.net"]').count(), 0, 'Privacy contains no Shop or store handoff');
        }
        if (route.path === '/terms/') {
          assert.equal(await page.locator('[data-terms-content-status]').count(), 0, 'Terms carries no obsolete review-required marker');
          assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'index,follow', 'Terms is indexable after the recorded content approval');
          await page.getByRole('heading', { name: 'Android apps are not covered by these website terms', exact: true }).waitFor({ state: 'visible' });
          assert.equal(await page.locator('a[href="/shop/"], a[href="https://store.nocharge.net"]').count(), 0, 'Terms contains no Shop or store handoff');
          assert.ok((await page.locator('.page-intro__lead').innerText()).includes('static Experience showcases'), 'the Terms lead describes the Experience pages as static showcases');
        }
        if (route.path === '/shop/') {
          assert.equal(await page.locator('[data-shop-status="hidden"]').count(), 1, 'the direct Shop route remains accessible in a hidden state');
          assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,follow', 'the Shop route remains noindex');
        }
        await expectNoHorizontalOverflow(page, `${mode}/${viewport.name}/${route.path}`);
        await expectPageHasNoBrokenLabels(page, route.path);

        if (route.path.startsWith('/arcade/') && route.path !== '/arcade/'
          || route.path.startsWith('/tools/') && route.path !== '/tools/') {
          await page.locator('.interactive-viewport').waitFor({ state: 'visible' });
          await page.locator('.interactive-module, .module-loading').first().waitFor({ state: 'visible' });
        }
        if (route.path.startsWith('/arcade/') && route.path !== '/arcade/') {
          await page.locator('.arcade-documentation').waitFor({ state: 'visible' });
          for (const heading of ['How to Play', 'Controls', 'Rules & Scoring', 'Tips', 'Related Guides & Tools']) {
            await page.getByRole('heading', { name: heading, exact: true }).waitFor({ state: 'visible' });
          }
          assert.equal(await page.locator('.interactive-viewport').getAttribute('data-arcade-runtime-contract'), 'nocharge-arcade-v1', `${route.path} has the typed Arcade runtime contract`);
          const phase4cId = phase4cRouteIds[route.path];
          if (phase4cId) {
            const module = page.locator('.phase4c-game');
            await module.waitFor({ state: 'visible' });
            assert.equal(await module.getAttribute('data-game-id'), phase4cId, `${route.path} mounts the intended Phase 4C game engine`);
            if (phase4cId === 'color-flip' || phase4cId === 'pass-the-picture') {
              const swatchContrast = await page.locator('.phase4c-color-button, [aria-label="Choose drawing color"] button').evaluateAll((elements) => {
                const luminance = (rgb) => rgb.match(/[\d.]+/gu).slice(0, 3).map(Number)
                  .map((channel) => { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; })
                  .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
                return elements.map((element) => {
                  const style = getComputedStyle(element);
                  const values = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
                  return { label: element.textContent.trim(), ratio: (values[0] + 0.05) / (values[1] + 0.05) };
                });
              });
              assert.ok(swatchContrast.length > 0 && swatchContrast.every(({ ratio }) => ratio >= 4.5), `${route.path} swatch labels meet 4.5:1 text contrast (${JSON.stringify(swatchContrast)})`);
            }
            assert.equal(await page.getByRole('button', { name: 'Start game' }).count(), 1, `${route.path} exposes a clear lifecycle start control`);
            assert.equal(await page.getByRole('button', { name: 'Reset to seeded start' }).count(), 1, `${route.path} exposes a deterministic reset control`);
            if (viewport.name === 'mobile-390') {
              const lifecycleControls = await page.locator('.phase4c-game-controls button').evaluateAll((elements) => elements.map((element) => {
                const rect = element.getBoundingClientRect();
                return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
              }));
              assert.ok(lifecycleControls.every((box) => box.width >= 44 && box.height >= 44 && box.left >= 0 && box.right <= viewport.width), `${route.path} lifecycle controls are touch-sized and fit 390px`);
              const mobileTargets = {
                'beacon-lattice': '.phase4c-coordinate-controls select', 'checkers': '.phase4c-coordinate-controls select', 'color-flip': '.phase4c-color-button',
                'dots-and-boxes': '.phase4c-coordinate-controls select', 'freecell': '.phase4c-card', 'gomoku': '.phase4c-coordinate-controls select',
                'klondike': '.phase4c-card', 'memory-match': '.phase4c-memory-card', 'minesweeper': '.phase4c-coordinate-controls select',
                'mini-sudoku': '.phase4c-sudoku-cell', 'nine-mens-morris': '.phase4c-coordinate-controls select',
                'nonogram': '.phase4c-nonogram-cell', 'pass-the-picture': '.phase4c-action-row .button',
                'reversi': '.phase4c-coordinate-controls select', 'sudoku-9x9': '.phase4c-coordinate-controls select',
                'tile-garden': '.phase4c-coordinate-controls select', 'word-search': '.phase4c-coordinate-controls select', 'word-tile-rush': '.phase4c-rush-cell',
              }[phase4cId];
              const targets = await page.locator(mobileTargets).evaluateAll((elements) => elements.map((element) => {
                const rect = element.getBoundingClientRect();
                return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
              }));
              assert.ok(targets.length > 0 && targets.every((box) => box.width >= 44 && box.height >= 44 && box.left >= 0 && box.right <= viewport.width), `${route.path} provides usable 44px mobile board or alternate controls inside 390px`);
            }
            if (mode === 'light' && viewport.name === 'desktop-1440') {
        const initialBoard = await module.locator('.phase4c-game-surface').innerText();
        const resetButton = page.getByRole('button', { name: 'Reset to seeded start' });
        const startButton = page.getByRole('button', { name: 'Start game' });
        await startButton.click();
        await page.waitForFunction(() => document.querySelector('.phase4c-game')?.getAttribute('data-game-state') === 'playing');
        await resetButton.click();
        await page.waitForFunction(() => document.querySelector('.phase4c-game')?.getAttribute('data-game-state') === 'idle');
              assert.equal(await module.locator('.phase4c-game-surface').innerText(), initialBoard, `${route.path} reset restores its deterministic opening board`);
              interactionChecks += 1;
            }
          }
          if (route.path.endsWith('/simon/')) {
            await page.locator('.arcade-simon__pad').first().waitFor({ state: 'visible' });
            const pads = page.locator('.arcade-simon__pad');
            assert.equal(await pads.count(), 4, 'Simon exposes four labelled pad controls');
            const padGeometry = await pads.evaluateAll((elements) => elements.map((element) => {
              const rect = element.getBoundingClientRect();
              return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
            }));
            assert.ok(padGeometry.every((box) => box.width >= 44 && box.height >= 44 && box.left >= 0 && box.right <= viewport.width), `${viewport.name} Simon controls are touch-sized and remain inside the responsive viewport`);
          }
          const rebuiltControls = {
            '/arcade/lights-out/': ['.lights-out-cell', 25],
            '/arcade/last-token/': ['.last-token-actions button', 3],
            '/arcade/hangman/': ['.hangman-keyboard button', 26],
            '/arcade/tic-tac-toe/': ['.tic-tac-toe-cell', 9],
            '/arcade/four-in-a-row/': ['.four-in-a-row-column', 7],
            '/arcade/twenty-forty-eight/': ['.twenty-forty-eight-direction', 4],
            '/arcade/word-loom/': ['.word-loom-keyboard button', 28],
          }[route.path];
          if (rebuiltControls) {
            const [selector, expectedCount] = rebuiltControls;
            const controls = page.locator(selector);
            assert.equal(await controls.count(), expectedCount, `${route.path} renders its complete labeled control set`);
            if (viewport.name === 'mobile-390') {
              const geometry = await controls.evaluateAll((elements) => elements.map((element) => {
                const rect = element.getBoundingClientRect();
                return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
              }));
              assert.ok(geometry.every((box) => box.width >= 44 && box.height >= 44 && box.left >= 0 && box.right <= viewport.width), `${route.path} controls meet the 44px touch target and stay within 390px`);
            }
          }
        }
        if (route.path.startsWith('/tools/') && route.path !== '/tools/') {
          for (const heading of ['How It Works', 'Worked Example', 'Common Pitfalls / FAQ', 'Related Guides & Tools']) {
            await page.getByRole('heading', { name: heading, exact: true }).waitFor({ state: 'visible' });
          }
          if (route.iconId) {
            const icon = page.locator('.detail-header__title-icon');
            assert.equal(await icon.getAttribute('data-icon-id'), route.iconId, `${route.path} detail heading uses its mapped semantic icon`);
            assert.equal(await icon.getAttribute('data-asset-id'), route.assetId, `${route.path} detail heading uses its mapped manifest asset`);
            assert.equal(await icon.locator('svg').count(), 1, `${route.path} detail icon is inline SVG`);
          }
        }
        if (route.path === '/tools/') {
          assert.equal(await page.locator('.catalog-card__icon[data-render-mode="inline-svg"]').count(), 10, 'the Tools directory renders all ten authorized Batch 02 card icons');
        }
        if (route.path === '/guides/a-practical-guide-to-interface-contrast/') {
          assert.ok(await page.locator('.guide-article-body > section').count() >= 4, 'published guide renders its complete article sections');
          assert.ok(await page.locator('.guide-toc a').count() >= 4, 'guide table of contents links to the article');
        }
        routeChecks += 1;
      }

      await runPassAndPlayTurnMatrix(page, (label) => { currentRoute = label; });

      if (mode === 'light' && viewport.name === 'desktop-1440') {
        await expectRelatedGuideNavigationScroll(page, (label) => { currentRoute = label; });

        currentRoute = '/arcade/ (category filtering)';
        await page.goto(pathWithEvent('/arcade/'), { waitUntil: 'domcontentloaded' });
        await page.locator('.catalog-card').first().waitFor({ state: 'visible' });
        assert.equal(await page.locator('.catalog-card').count(), 28, 'Arcade directory lists ten baseline games and eighteen Phase 4C rebuilds');
        await page.locator('select[aria-label="Filter by category"]').selectOption({ label: 'Puzzle' });
        assert.equal(await page.locator('.catalog-card').count(), 3, 'Puzzle filter returns Pattern Pairs, Lights Out, and Twenty Forty-Eight');
        assert.ok((await page.locator('.catalog-card h3').allInnerTexts()).some((title) => title.includes('Lights Out')), 'category filter includes a rebuilt logic game');
        await page.locator('select[aria-label="Filter by category"]').selectOption('all');
        assert.equal(await page.locator('.catalog-card').count(), 28, 'resetting the category filter restores all published Arcade entries');
        interactionChecks += 1;

        currentRoute = '/arcade/categories/puzzle/';
        await page.goto(pathWithEvent('/arcade/categories/puzzle/'), { waitUntil: 'domcontentloaded' });
        await page.locator('.catalog-card').first().waitFor({ state: 'visible' });
        assert.equal(await page.locator('.catalog-card').count(), 3, 'registry-derived Arcade category route filters the three published Puzzle games');
        assert.ok((await page.locator('.catalog-card h3').allInnerTexts()).some((title) => title.includes('Pattern Pairs')), 'category route renders the matching game detail link');
        interactionChecks += 1;

        currentRoute = '/discover/ (cross-section filters)';
        await page.goto(pathWithEvent('/discover/'), { waitUntil: 'domcontentloaded' });
        await page.locator('.catalog-card').first().waitFor({ state: 'visible' });
        assert.equal(await page.locator('.catalog-card').count(), 53, 'Discover includes all 53 published registry records');
        await page.locator('select[aria-label="Filter by section"]').selectOption('tools');
        assert.equal(await page.locator('.catalog-card').count(), 18, 'Discover section filter returns all published tools');
        await page.locator('select[aria-label="Discover category"]').selectOption({ label: 'Writing' });
        assert.equal(await page.locator('.catalog-card').count(), 1, 'Discover category filter narrows the current section');
        assert.ok((await page.locator('.catalog-card h3').innerText()).includes('Word Counter'), 'filtered Discover result is the matching tool');
        interactionChecks += 1;

        currentRoute = '/search/?q=pattern-pairs';
        await page.goto(pathWithEvent('/search/?q=pattern%20pairs'), { waitUntil: 'domcontentloaded' });
        await page.locator('.search-page__heading h2').waitFor({ state: 'visible' });
        await page.getByRole('link', { name: 'Pattern Pairs' }).waitFor({ state: 'visible' });
        assert.ok((await page.locator('.search-page__heading h2').innerText()).includes('1 match'), 'URL-backed client search resolves a published result');
        interactionChecks += 1;

        currentRoute = '/ (search dialog)';
        await page.goto(pathWithEvent('/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Open site search' }).click();
        const dialog = page.locator('dialog.search-dialog[open]');
        await dialog.waitFor({ state: 'visible' });
        const dialogInput = dialog.locator('input[type="search"]');
        await dialogInput.fill('orbit lab');
        await dialog.getByRole('status').getByText('No published content matches', { exact: false }).waitFor({ state: 'visible' });
        await dialogInput.fill('pocket beat');
        await dialog.getByRole('status').getByText('No published content matches', { exact: false }).waitFor({ state: 'visible' });
        await dialogInput.fill('Barn Road Chronicles');
        await dialog.getByRole('link', { name: 'Barn Road Chronicles: Act 1' }).waitFor({ state: 'visible' });
        await dialog.getByRole('link', { name: 'Barn Road Chronicles: Act 1' }).click();
        await page.locator('.detail-header h1').getByText('Barn Road Chronicles: Act 1', { exact: true }).waitFor({ state: 'visible' });
        interactionChecks += 1;

        currentRoute = '/arcade/pattern-pairs/ (game interaction)';
        await page.goto(pathWithEvent('/arcade/pattern-pairs/'), { waitUntil: 'domcontentloaded' });
        await page.locator('.pair-tile').first().waitFor({ state: 'visible' });
        await page.locator('.pair-tile').nth(0).click();
        await page.locator('.pair-tile').nth(1).click();
        await page.waitForFunction(() => document.querySelector('[aria-label="Moves"]')?.textContent === '1');
        assert.equal(await page.locator('.pair-tile.is-revealed').count(), 2, 'Pattern Pairs reveals tiles and counts a completed turn');
        await page.getByRole('button', { name: 'New round' }).click();
        await page.waitForFunction(() => document.querySelector('[aria-label="Moves"]')?.textContent === '0');
        interactionChecks += 1;

        currentRoute = '/arcade/sum-sprint/ (game interaction)';
        await page.goto(pathWithEvent('/arcade/sum-sprint/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Start 60-second round' }).click();
        await page.locator('.answer-choice[data-correct="true"]:not(:disabled)').click();
        await page.waitForFunction(() => document.querySelector('[aria-label="Score"]')?.textContent === '1');
        interactionChecks += 1;

        currentRoute = '/arcade/simon/ (pilot lifecycle interaction)';
        await page.goto(pathWithEvent('/arcade/simon/'), { waitUntil: 'domcontentloaded' });
        await page.locator('.arcade-simon__pad').first().waitFor({ state: 'visible' });
        await page.getByLabel('Calm cues').check();
        const soundButton = page.getByRole('button', { name: 'Sound off' });
        await soundButton.click();
        assert.equal(await page.getByRole('button', { name: 'Sound on' }).getAttribute('aria-pressed'), 'true', 'Simon audio is opt-in and exposes its enabled state');
        await page.getByRole('button', { name: 'Begin run' }).click();
        const firstCueButton = page.locator('.arcade-simon__pad[data-active="true"]');
        await firstCueButton.waitFor({ state: 'visible' });
        const firstCue = await firstCueButton.getAttribute('data-pad');
        assert.ok(firstCue, 'the first sequence cue is visible before response is enabled');
        await page.waitForFunction(() => document.querySelector('.arcade-simon')?.getAttribute('data-game-state') === 'input');
        await page.locator(`.arcade-simon__pad[data-pad="${firstCue}"]`).click();
        await page.waitForFunction(() => document.querySelector('.arcade-simon')?.getAttribute('data-game-state') === 'round-end'
          && document.querySelector('.arcade-runtime-provider')?.getAttribute('data-h5-last-breakpoint') === 'round-end');
        assert.equal(await page.locator('.arcade-simon__pad:enabled').count(), 0, 'Simon pauses pad input at the completed round boundary');

        await page.getByRole('button', { name: 'Next sequence' }).click();
        await page.evaluate(() => {
          Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForFunction(() => document.querySelector('.arcade-runtime-provider')?.getAttribute('data-arcade-paused') === 'true');
        assert.equal(await page.locator('.arcade-simon').getAttribute('data-game-state'), 'playing', 'visibility pause preserves the active Simon sequence state');
        await page.evaluate(() => {
          Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
          document.dispatchEvent(new Event('visibilitychange'));
          window.dispatchEvent(new Event('focus'));
        });
        await page.waitForFunction(() => document.querySelector('.arcade-runtime-provider')?.getAttribute('data-arcade-paused') === 'false');
        await page.waitForFunction(() => document.querySelector('.arcade-simon')?.getAttribute('data-game-state') === 'input');

        await page.getByRole('button', { name: 'Reset run' }).click();
        assert.equal(await page.locator('.arcade-simon').getAttribute('data-round'), '0', 'Simon reset clears the active sequence counter');
        await page.getByRole('button', { name: 'Begin run' }).click();
        const losingCueButton = page.locator('.arcade-simon__pad[data-active="true"]');
        await losingCueButton.waitFor({ state: 'visible' });
        const losingCue = await losingCueButton.getAttribute('data-pad');
        assert.ok(losingCue, 'a restarted run displays its first cue');
        await page.waitForFunction(() => document.querySelector('.arcade-simon')?.getAttribute('data-game-state') === 'input');
        const wrongPad = await page.locator('.arcade-simon__pad').evaluateAll((elements, cue) => elements.find((element) => element.getAttribute('data-pad') !== cue)?.getAttribute('data-pad') ?? '', losingCue);
        await page.locator(`.arcade-simon__pad[data-pad="${wrongPad}"]`).click();
        await page.waitForFunction(() => document.querySelector('.arcade-simon')?.getAttribute('data-game-state') === 'game-over'
          && document.querySelector('.arcade-runtime-provider')?.getAttribute('data-h5-last-breakpoint') === 'game-over');
        interactionChecks += 1;

        currentRoute = '/arcade/lights-out/ (solvable puzzle, pause, and reset)';
        await page.goto(pathWithEvent('/arcade/lights-out/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Begin puzzle' }).click();
        await verifyArcadePauseResume(page, 'Lights Out', true);
        let puzzleSeed = 1;
        const solutionPresses = [];
        for (let move = 0; move < 13; move += 1) {
          puzzleSeed = (Math.imul(puzzleSeed, 1664525) + 1013904223) >>> 0;
          solutionPresses.push(((puzzleSeed >>> 8) % 5) * 5 + puzzleSeed % 5);
        }
        for (const cellIndex of solutionPresses.reverse()) await page.locator('.lights-out-cell').nth(cellIndex).click();
        await page.waitForFunction(() => document.querySelector('.arcade-lights-out')?.getAttribute('data-game-state') === 'game-over'
          && document.querySelector('.arcade-runtime-provider')?.getAttribute('data-h5-last-breakpoint') === 'game-over');
        assert.equal(await page.locator('.arcade-lights-out .module-live-status').innerText(), 'All lights are off. Puzzle solved.', 'the seeded Lights Out board has a reversible completion path');
        await page.getByRole('button', { name: 'New puzzle' }).click();
        assert.equal(await page.locator('[aria-label="Moves"]').innerText(), '0', 'New puzzle deterministically clears the move counter');
        interactionChecks += 1;

        currentRoute = '/arcade/last-token/ (direct pass-and-play turns, stable banner, and terminal rule)';
        await page.goto(pathWithEvent('/arcade/last-token/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: '15 tokens' }).click();
        await page.getByRole('button', { name: 'Start round' }).click();
        for (let move = 0; move < 5; move += 1) {
          const before = await readPassAndPlayLayout(page, '.last-token-pile');
          await page.getByRole('button', { name: 'Take 3 tokens' }).click();
          if (move < 4) {
            const nextPlayer = move % 2 === 0 ? 2 : 1;
            await expectDirectPassAndPlayTurn(page, '.last-token-pile', `Player ${nextPlayer}'s Turn. Take one, two, or three tokens.`, before, 'Last Token');
          }
          if (move === 0) {
            assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Last Token move does not request a break');
            await verifyArcadePauseResume(page, 'Last Token');
          }
        }
        await page.waitForFunction(() => document.querySelector('.arcade-last-token')?.getAttribute('data-game-state') === 'game-over'
          && document.querySelector('.arcade-runtime-provider')?.getAttribute('data-h5-last-breakpoint') === 'game-over');
        assert.ok((await page.locator('.arcade-last-token .module-live-status').innerText()).includes('Player 2 wins'), 'taking the last token loses for the player who takes it');
        interactionChecks += 1;

        currentRoute = '/arcade/hangman/ (letter input, repeat guard, and pause)';
        await page.goto(pathWithEvent('/arcade/hangman/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Start round' }).click();
        await page.keyboard.press('R');
        await page.waitForFunction(() => document.querySelector('[aria-label="Letters guessed"]')?.textContent === '1');
        assert.equal(await page.locator('[aria-label="Incorrect guesses"]').innerText(), '0 / 6', 'a physical keyboard letter is accepted without a miss');
        await verifyArcadePauseResume(page, 'Hangman');
        for (const letter of ['O', 'C', 'H', 'A', 'D']) await page.getByRole('button', { name: `Guess ${letter}` }).click();
        await page.waitForFunction(() => document.querySelector('.arcade-hangman')?.getAttribute('data-game-state') === 'game-over'
          && document.querySelector('.arcade-runtime-provider')?.getAttribute('data-h5-last-breakpoint') === 'game-over');
        assert.equal((await page.locator('.hangman-word').innerText()).replace(/\s+/gu, ''), 'ORCHARD', 'Hangman reveals every repeated letter and the completed answer');
        interactionChecks += 1;

        currentRoute = '/arcade/tic-tac-toe/ (direct board turns, stable banner, and round boundary)';
        await page.goto(pathWithEvent('/arcade/tic-tac-toe/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Start match' }).click();
        const ticTacToeMoves = [0, 1, 3, 4, 6];
        for (let move = 0; move < ticTacToeMoves.length; move += 1) {
          const before = await readPassAndPlayLayout(page, '.tic-tac-toe-grid');
          await page.locator('.tic-tac-toe-cell').nth(ticTacToeMoves[move]).click();
          if (move < ticTacToeMoves.length - 1) {
            assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'an ordinary Tic-Tac-Toe move is not a break');
            const nextPlayer = move % 2 === 0 ? 2 : 1;
            await expectDirectPassAndPlayTurn(page, '.tic-tac-toe-grid', `Player ${nextPlayer}'s Turn. Place your ${nextPlayer === 1 ? 'X' : 'O'}.`, before, 'Tic-Tac-Toe');
          }
          if (move === 0) await verifyArcadePauseResume(page, 'Tic-Tac-Toe');
        }
        await page.waitForFunction(() => document.querySelector('.arcade-tic-tac-toe')?.getAttribute('data-game-state') === 'round-end'
          && document.querySelector('.arcade-runtime-provider')?.getAttribute('data-h5-last-breakpoint') === 'round-end');
        assert.equal(await page.locator('[aria-label="Player 1 wins"]').innerText(), '1', 'Tic-Tac-Toe records a completed board win');
        await page.getByRole('button', { name: 'Start board 2' }).click();
        assert.equal(await page.locator('.arcade-tic-tac-toe .module-live-status').innerText(), "Player 2's Turn. Place your O.", 'the opening player alternates on the next board without a Ready gate');
        interactionChecks += 1;

        currentRoute = '/arcade/four-in-a-row/ (direct board turns, stable banner, and gravity rules)';
        await page.goto(pathWithEvent('/arcade/four-in-a-row/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Start round' }).click();
        const connectFourColumns = [1, 1, 2, 2, 3, 3, 4];
        for (let move = 0; move < connectFourColumns.length; move += 1) {
          const before = await readPassAndPlayLayout(page, '.four-in-a-row-board');
          const column = connectFourColumns[move];
          await page.locator('.four-in-a-row-row').nth(0).locator('.four-in-a-row-cell').nth(column - 1).click();
          if (move < connectFourColumns.length - 1) {
            assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'an ordinary Four in a Row move is not a break');
            const nextPlayer = move % 2 === 0 ? 2 : 1;
            await expectDirectPassAndPlayTurn(page, '.four-in-a-row-board', `Player ${nextPlayer}'s Turn. Choose a column.`, before, 'Four in a Row');
          }
          if (move === 0) await verifyArcadePauseResume(page, 'Four in a Row');
        }
        await page.waitForFunction(() => document.querySelector('.arcade-four-in-a-row')?.getAttribute('data-game-state') === 'game-over'
          && document.querySelector('.arcade-runtime-provider')?.getAttribute('data-h5-last-breakpoint') === 'game-over');
        assert.ok((await page.locator('.arcade-four-in-a-row .module-live-status').innerText()).includes('Player 1 connects four'), 'Four in a Row checks a horizontal gravity-settled win');
        interactionChecks += 1;

        currentRoute = '/arcade/twenty-forty-eight/ (deterministic merges, controls, and pause)';
        await page.goto(pathWithEvent('/arcade/twenty-forty-eight/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Begin run' }).click();
        const initialTiles = await page.locator('.twenty-forty-eight-cell').allInnerTexts();
        await page.locator('.twenty-forty-eight-board').focus();
        await page.locator('.twenty-forty-eight-board').press('ArrowLeft');
        await page.waitForFunction(() => document.querySelector('[aria-label="Moves"]')?.textContent === '1');
        await verifyArcadePauseResume(page, 'Twenty Forty-Eight');
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a valid 2048 slide is not a completed game break');
        await page.getByRole('button', { name: 'Restart run' }).click();
        assert.deepEqual(await page.locator('.twenty-forty-eight-cell').allInnerTexts(), initialTiles, 'restarting Twenty Forty-Eight restores the same seeded board');
        assert.equal(await page.locator('[aria-label="Score"]').innerText(), '0', 'restarting Twenty Forty-Eight clears score');
        interactionChecks += 1;

        currentRoute = '/arcade/word-loom/ (duplicate feedback, invalid guess, and pause)';
        await page.goto(pathWithEvent('/arcade/word-loom/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Practice' }).click();
        await page.getByRole('button', { name: 'Start round' }).click();
        const wordInput = page.getByRole('textbox', { name: 'Your five-letter guess' });
        await wordInput.fill('PUPPY');
        await page.getByRole('button', { name: 'Submit guess' }).click();
        const duplicateFeedback = await page.locator('.word-loom-row').first().getAttribute('aria-label');
        assert.ok(duplicateFeedback?.includes('P present, U absent, P correct, P absent, Y absent'), 'Word Loom scores duplicate letters without over-counting answer copies');
        await verifyArcadePauseResume(page, 'Word Loom');
        await wordInput.fill('ZZZZZ');
        await page.getByRole('button', { name: 'Submit guess' }).click();
        assert.equal(await page.locator('[aria-label="Accepted guesses"]').innerText(), '1 / 6', 'an invalid Word Loom entry does not consume an attempt');
        await wordInput.fill('APPLE');
        await page.getByRole('button', { name: 'Submit guess' }).click();
        await page.waitForFunction(() => document.querySelector('.arcade-word-loom')?.getAttribute('data-game-state') === 'game-over'
          && document.querySelector('.arcade-runtime-provider')?.getAttribute('data-h5-last-breakpoint') === 'game-over');
        assert.ok((await page.locator('.arcade-word-loom .module-live-status').innerText()).includes('Solved in 2 guesses'), 'Word Loom reveals a solved practice round');
        interactionChecks += 1;

        currentRoute = '/arcade/beacon-lattice/ (pentomino coverage, lifecycle, and reset)';
        const beacon = await startPhase4cGame(page, '/arcade/beacon-lattice/');
        const beaconOpening = await beacon.locator('.phase4c-game-surface').innerText();
        await verifyArcadePauseResume(page, 'Beacon Lattice', true);
        for (const [piece, name, turns, anchor] of [[1, 'F', 3, 0], [2, 'V', 2, 1], [3, 'I', 0, 4], [4, 'U', 0, 10], [5, 'L', 3, 15]]) {
          await page.getByRole('button', { name: `Beacon ${piece} · ${name} shape` }).click();
          for (let turn = 0; turn < turns; turn += 1) await page.getByRole('button', { name: 'Rotate beacon' }).click();
          await page.getByLabel('Beacon anchor row').selectOption(String(Math.floor(anchor / 5) + 1));
          await page.getByLabel('Beacon anchor column').selectOption(String(anchor % 5 + 1));
          await page.getByRole('button', { name: 'Place selected beacon at anchor' }).click();
        }
        await page.waitForFunction(() => document.querySelector('.phase4c-game')?.getAttribute('data-game-state') === 'game-over'
          && document.querySelector('.arcade-runtime-provider')?.getAttribute('data-h5-last-breakpoint') === 'game-over');
        assert.ok((await beacon.locator('.module-live-status').innerText()).includes('Every cell is covered exactly once'), 'the five distinct beacons solve the full lattice and request only a completed-game boundary');
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.equal(await beacon.locator('.phase4c-game-surface').innerText(), beaconOpening, 'Beacon Lattice returns to its exact seeded opening board after completion');
        interactionChecks += 1;

        currentRoute = '/arcade/checkers/ (direct board turns, stable banner, and pause)';
        const checkers = await startPhase4cGame(page, '/arcade/checkers/');
        let checkersLayout = await readPassAndPlayLayout(page, '.checkers-board');
        await page.getByRole('button', { name: 'Row 6, column 1, man red' }).click();
        await page.getByRole('button', { name: 'Row 5, column 2, empty' }).click();
        await expectDirectPassAndPlayTurn(page, '.checkers-board', "Player 2's Turn. Black moves.", checkersLayout, 'Checkers');
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Checkers turn change is not an ad break');
        await verifyArcadePauseResume(page, 'Checkers', true);
        await page.getByRole('button', { name: 'Row 3, column 2, man black' }).click();
        checkersLayout = await readPassAndPlayLayout(page, '.checkers-board');
        await page.getByRole('button', { name: 'Row 4, column 1, empty' }).click();
        await expectDirectPassAndPlayTurn(page, '.checkers-board', "Player 1's Turn. Red moves.", checkersLayout, 'Checkers');
        assert.equal(await checkers.locator('.phase4c-scoreline strong').innerText(), 'Player 1 · Red to move', 'Checkers keeps the active player visible independently of move feedback');

        currentRoute = '/arcade/checkers/ (multi-jump holds the same player turn)';
        await startPhase4cGame(page, '/arcade/checkers/');
        const checkersSetupMoves = [
          ['Row 6, column 7, man red', 'Row 5, column 8, empty', "Player 2's Turn. Black moves."],
          ['Row 3, column 4, man black', 'Row 4, column 5, empty', "Player 1's Turn. Red moves."],
          ['Row 7, column 6, man red', 'Row 6, column 7, empty', "Player 2's Turn. Black moves."],
          ['Row 2, column 3, man black', 'Row 3, column 4, empty', "Player 1's Turn. Red moves."],
          ['Row 6, column 5, man red', 'Row 5, column 4, empty', "Player 2's Turn. Black moves."],
          ['Row 4, column 5, man black', 'Row 5, column 6, empty', "Player 1's Turn. Red moves."],
        ];
        for (const [source, destination, nextStatus] of checkersSetupMoves) {
          checkersLayout = await readPassAndPlayLayout(page, '.checkers-board');
          await page.getByRole('button', { name: source }).click();
          await page.getByRole('button', { name: destination }).click();
          await expectDirectPassAndPlayTurn(page, '.checkers-board', nextStatus, checkersLayout, 'Checkers setup');
        }
        checkersLayout = await readPassAndPlayLayout(page, '.checkers-board');
        await page.getByRole('button', { name: 'Row 6, column 7, man red' }).click();
        await page.getByRole('button', { name: 'Row 4, column 5, empty' }).click();
        await expectDirectPassAndPlayTurn(page, '.checkers-board', "Player 1's Turn. Continue the same capture sequence with the selected piece.", checkersLayout, 'Checkers multi-jump');
        assert.equal(await page.locator('.phase4c-scoreline strong').innerText(), 'Player 1 · Red to move', 'the first jump does not switch players while a forced capture remains');
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a partial multi-jump is not an ad break');
        checkersLayout = await readPassAndPlayLayout(page, '.checkers-board');
        await page.getByRole('button', { name: 'Row 2, column 3, empty' }).click();
        await expectDirectPassAndPlayTurn(page, '.checkers-board', "Player 2's Turn. Black moves.", checkersLayout, 'Checkers completed multi-jump');
        assert.equal(await page.locator('.phase4c-scoreline strong').innerText(), 'Player 2 · Black to move', 'the active player changes only after the full capture sequence');
        interactionChecks += 2;

        currentRoute = '/arcade/color-flip/ (mode, palette cycle, and pause)';
        const colorFlip = page.locator('.phase4c-game');
        await page.goto(pathWithEvent('/arcade/color-flip/'), { waitUntil: 'domcontentloaded' });
        await colorFlip.waitFor({ state: 'visible' });
        await page.getByRole('button', { name: 'Color cycle' }).click();
        await page.getByRole('button', { name: 'Start game' }).click();
        await page.getByRole('button', { name: 'Teal', exact: true }).click();
        await page.getByRole('button', { name: 'Lock color and continue' }).click();
        await page.getByText('Matches: 1', { exact: true }).waitFor({ state: 'visible' });
        assert.ok((await colorFlip.locator('.module-live-status').innerText()).includes('rotates to gold'), 'Color Flip applies its cycling palette rule after a submitted match');
        await verifyArcadePauseResume(page, 'Color Flip', true);
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'an intermediate Color Flip choice is not a break');
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        interactionChecks += 1;

        currentRoute = '/arcade/dots-and-boxes/ (direct edge turns, extra turn, and stable banner)';
        const dots = await startPhase4cGame(page, '/arcade/dots-and-boxes/');
        let dotsLayout = await readPassAndPlayLayout(page, '.phase4c-boxes');
        await page.getByRole('button', { name: 'Draw horizontal edge row 1, column 1' }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-boxes', "Player 2's Turn.", dotsLayout, 'Dots & Boxes');
        await verifyArcadePauseResume(page, 'Dots & Boxes', true);
        await page.getByRole('button', { name: 'Draw horizontal edge row 2, column 1' }).click();
        dotsLayout = await readPassAndPlayLayout(page, '.phase4c-boxes');
        await page.getByRole('button', { name: 'Draw vertical edge row 1, column 1' }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-boxes', "Player 2's Turn.", dotsLayout, 'Dots & Boxes');
        dotsLayout = await readPassAndPlayLayout(page, '.phase4c-boxes');
        await page.getByRole('button', { name: 'Draw vertical edge row 1, column 2' }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-boxes', "Player 2's Turn. Draw again.", dotsLayout, 'Dots & Boxes extra turn');
        assert.equal((await dots.locator('.phase4c-box-owner-grid').innerText()).includes('P2'), true, 'closing the fourth edge claims a box for Player 2');
        dotsLayout = await readPassAndPlayLayout(page, '.phase4c-boxes');
        await page.getByRole('button', { name: 'Draw horizontal edge row 1, column 2' }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-boxes', "Player 1's Turn.", dotsLayout, 'Dots & Boxes after extra turn');
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'ordinary edges and a claimed-box extra turn do not request an ad break');
        interactionChecks += 1;

        currentRoute = '/arcade/freecell/ (card move, capacity layout, and pause)';
        const freecell = await startPhase4cGame(page, '/arcade/freecell/');
        await verifyArcadePauseResume(page, 'FreeCell', true);
        const exposedFreeCellCard = page.locator('.phase4c-tableau--8 .phase4c-card-column').first().locator('.phase4c-card').last();
        await exposedFreeCellCard.click();
        await page.getByRole('button', { name: 'Free cell 1, empty' }).click();
        assert.notEqual((await page.locator('.phase4c-pile-row .phase4c-pile-slot').first().innerText()).trim(), 'Free 1', 'FreeCell moves an exposed card into an empty free cell');
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        interactionChecks += 1;

        currentRoute = '/arcade/gomoku/ (direct board turns and stable banner)';
        const gomoku = await startPhase4cGame(page, '/arcade/gomoku/');
        let gomokuLayout = await readPassAndPlayLayout(page, '.gomoku-board');
        await page.getByRole('button', { name: 'Row 8, column 8, empty' }).click();
        await expectDirectPassAndPlayTurn(page, '.gomoku-board', "Player 2's Turn.", gomokuLayout, 'Gomoku');
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Gomoku turn change is not an ad break');
        await verifyArcadePauseResume(page, 'Gomoku', true);
        gomokuLayout = await readPassAndPlayLayout(page, '.gomoku-board');
        await page.getByRole('button', { name: 'Row 8, column 9, empty' }).click();
        await expectDirectPassAndPlayTurn(page, '.gomoku-board', "Player 1's Turn.", gomokuLayout, 'Gomoku');
        interactionChecks += 1;

        currentRoute = '/arcade/klondike/ (stock draw, deterministic deal, and pause)';
        const klondike = await startPhase4cGame(page, '/arcade/klondike/');
        await page.getByRole('button', { name: /Stock, 24 cards remaining/u }).click();
        assert.ok((await page.locator('.phase4c-pile-row').innerText()).includes('Stock · 23'), 'Klondike draws one card from its deterministic stock');
        await verifyArcadePauseResume(page, 'Klondike', true);
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.ok((await klondike.locator('.phase4c-pile-row').innerText()).includes('Stock · 24'), 'Klondike reset restores the same full stock');
        interactionChecks += 1;

        currentRoute = '/arcade/memory-match/ (pair selection and mismatch pause)';
        const memory = await startPhase4cGame(page, '/arcade/memory-match/');
        await page.locator('.phase4c-memory-card').first().click();
        assert.equal(await page.locator('.phase4c-memory-card.is-face-up').count(), 1, 'Memory Match reveals the first selected card');
        await verifyArcadePauseResume(page, 'Memory Match', true);
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.equal(await page.locator('.phase4c-memory-card.is-face-up').count(), 0, 'Memory Match reset covers the entire seeded deck');
        assert.ok((await memory.locator('.module-live-status').innerText()).includes('ready'), 'Memory Match remains ready after a deterministic reset');
        interactionChecks += 1;

        currentRoute = '/arcade/minesweeper/ (safe first reveal and coordinate controls)';
        const minesweeper = await startPhase4cGame(page, '/arcade/minesweeper/');
        await verifyArcadePauseResume(page, 'Minesweeper', true);
        const mineCoordinates = page.locator('.phase4c-coordinate-controls select');
        await mineCoordinates.nth(0).selectOption('1');
        await mineCoordinates.nth(1).selectOption('1');
        await page.getByRole('button', { name: 'Reveal selected square' }).click();
        assert.ok(await page.locator('.phase4c-mine-cell.is-open').count() > 0, 'Minesweeper reveals the selected first square safely');
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a safe reveal is not a game break');
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.equal(await minesweeper.locator('.phase4c-mine-cell.is-open').count(), 0, 'Minesweeper reset hides the seeded map again');
        interactionChecks += 1;

        currentRoute = '/arcade/mini-sudoku/ (digit validation and pause)';
        const miniSudoku = await startPhase4cGame(page, '/arcade/mini-sudoku/');
        await page.getByRole('button', { name: '6', exact: true }).click();
        assert.equal(await page.locator('.phase4c-sudoku-cell').nth(5).innerText(), '6', 'Mini Sudoku accepts a non-duplicate digit in the selected cell');
        await verifyArcadePauseResume(page, 'Mini Sudoku', true);
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.equal(await page.locator('.phase4c-sudoku-cell').nth(5).innerText(), '', 'Mini Sudoku reset clears player entries but preserves fixed clues');
        assert.ok((await miniSudoku.locator('.phase4c-scoreline').innerText()).includes('Grid 6 × 6'), 'Mini Sudoku reports its compact grid dimensions');
        interactionChecks += 1;

        currentRoute = "/arcade/nine-mens-morris/ (direct placement, mill removal, and stable turns)";
        const morris = await startPhase4cGame(page, '/arcade/nine-mens-morris/');
        let morrisLayout = await readPassAndPlayLayout(page, '.phase4c-morris-board');
        await page.getByRole('button', { name: /^Point 1, empty/u }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-morris-board', "Player 2's Turn.", morrisLayout, "Nine Men's Morris");
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', "a Morris stone placement and turn change are not ad breaks");
        await verifyArcadePauseResume(page, "Nine Men's Morris", true);
        morrisLayout = await readPassAndPlayLayout(page, '.phase4c-morris-board');
        await page.getByRole('button', { name: /^Point 7, empty/u }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-morris-board', "Player 1's Turn.", morrisLayout, "Nine Men's Morris");
        morrisLayout = await readPassAndPlayLayout(page, '.phase4c-morris-board');
        await page.getByRole('button', { name: /^Point 2, empty/u }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-morris-board', "Player 2's Turn.", morrisLayout, "Nine Men's Morris");
        morrisLayout = await readPassAndPlayLayout(page, '.phase4c-morris-board');
        await page.getByRole('button', { name: /^Point 9, empty/u }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-morris-board', "Player 1's Turn.", morrisLayout, "Nine Men's Morris");
        morrisLayout = await readPassAndPlayLayout(page, '.phase4c-morris-board');
        await page.getByRole('button', { name: /^Point 3, empty/u }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-morris-board', "Player 1's Turn. Mill formed; remove an opposing stone.", morrisLayout, "Nine Men's Morris mill");
        morrisLayout = await readPassAndPlayLayout(page, '.phase4c-morris-board');
        await page.getByRole('button', { name: /^Point 7, Player 2/u }).click();
        await expectDirectPassAndPlayTurn(page, '.phase4c-morris-board', "Player 2's Turn.", morrisLayout, "Nine Men's Morris after mill removal");
        interactionChecks += 1;

        currentRoute = '/arcade/nonogram/ (large-grid coordinate fallback)';
        await page.goto(pathWithEvent('/arcade/nonogram/'), { waitUntil: 'domcontentloaded' });
        const nonogram = page.locator('.phase4c-game');
        await page.getByRole('button', { name: '10 by 10' }).click();
        await page.getByRole('button', { name: 'Start game' }).click();
        await page.getByRole('button', { name: 'Mark selected cell' }).click();
        assert.equal(await page.locator('.phase4c-nonogram-cell.mark-1').count(), 1, 'Nonogram supports a labeled large-grid coordinate control');
        await verifyArcadePauseResume(page, 'Nonogram', true);
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.equal(await page.locator('.phase4c-nonogram-cell').count(), 25, 'Nonogram reset returns to the deterministic five-by-five opening');
        assert.equal(await page.getByRole('button', { name: '5 by 5' }).getAttribute('aria-pressed'), 'true', 'Nonogram reset restores its default puzzle size');
        interactionChecks += 1;

        currentRoute = '/arcade/pass-the-picture/ (direct canvas turns and local export)';
        const passPicture = await startPhase4cGame(page, '/arcade/pass-the-picture/');
        let pictureLayout = await readPassAndPlayLayout(page, '.phase4c-drawing-surface');
        await page.getByRole('button', { name: 'Ocean', exact: true }).click();
        assert.equal(await passPicture.locator('.phase4c-scoreline strong').innerText(), "Artist 1's turn", 'the current artist stays visible after a color-control action');
        await page.locator('.phase4c-drawing-surface').click({ position: { x: 80, y: 80 } });
        assert.equal(await page.locator('.phase4c-drawing-surface polyline').count(), 1, 'a canvas click draws and commits one local stroke');
        await expectDirectPassAndPlayTurn(page, '.phase4c-drawing-surface', "Artist 2's Turn.", pictureLayout, 'Pass the Picture');
        assert.equal(await passPicture.locator('.phase4c-scoreline strong').innerText(), "Artist 2's turn", 'the next artist stays visible while drawing continues');
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'an artist turn change is not an ad break');
        await verifyArcadePauseResume(page, 'Pass the Picture', true);
        pictureLayout = await readPassAndPlayLayout(page, '.phase4c-drawing-surface');
        await page.locator('.phase4c-drawing-surface').click({ position: { x: 150, y: 120 } });
        await expectDirectPassAndPlayTurn(page, '.phase4c-drawing-surface', "Artist 3's Turn.", pictureLayout, 'Pass the Picture');
        assert.equal(await passPicture.locator('.phase4c-scoreline strong').innerText(), "Artist 3's turn", 'the artist indicator updates immediately after the second stroke');
        assert.equal(await page.locator('.phase4c-drawing-surface polyline').count(), 2, 'the next artist can immediately add a second canvas stroke');
        assert.ok((await passPicture.locator('.phase4c-scoreline').innerText()).includes('Passes: 2 / 8'), 'Pass the Picture counts both direct artist strokes');
        const drawingDownload = page.getByRole('link', { name: 'Download SVG' });
        assert.ok((await drawingDownload.getAttribute('href'))?.startsWith('data:image/svg+xml,'), 'Pass the Picture exports an SVG data URL without a remote request');
        interactionChecks += 1;

        currentRoute = '/arcade/reversi/ (direct legal-move turns and stable banner)';
        const reversi = await startPhase4cGame(page, '/arcade/reversi/');
        assert.equal(await page.locator('.phase4c-cell--reversi.is-legal').count(), 4, 'Reversi marks the four opening legal placements');
        let reversiLayout = await readPassAndPlayLayout(page, '.reversi-board');
        await page.locator('.phase4c-cell--reversi.is-legal').first().click();
        await expectDirectPassAndPlayTurn(page, '.reversi-board', "Player 2's Turn.", reversiLayout, 'Reversi');
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Reversi disc flip and turn change are not ad breaks');
        await verifyArcadePauseResume(page, 'Reversi', true);
        reversiLayout = await readPassAndPlayLayout(page, '.reversi-board');
        await page.locator('.phase4c-cell--reversi.is-legal').first().click();
        await expectDirectPassAndPlayTurn(page, '.reversi-board', "Player 1's Turn.", reversiLayout, 'Reversi');
        interactionChecks += 1;

        currentRoute = '/arcade/sudoku-9x9/ (coordinate selection and digit entry)';
        const sudoku9 = await startPhase4cGame(page, '/arcade/sudoku-9x9/');
        await page.locator('.phase4c-grid--9 .phase4c-sudoku-cell').nth(2).click();
        await page.getByRole('button', { name: '1', exact: true }).click();
        assert.equal(await page.locator('.phase4c-grid--9 .phase4c-sudoku-cell').nth(2).innerText(), '1', 'Sudoku 9×9 accepts an entry that does not duplicate a row, column, or box');
        await verifyArcadePauseResume(page, 'Sudoku 9×9', true);
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'a Sudoku entry is not a completed-game break');
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.equal(await page.locator('.phase4c-grid--9 .phase4c-sudoku-cell').nth(2).innerText(), '', 'Sudoku 9×9 reset restores its fixed clue grid');
        assert.ok((await sudoku9.locator('.phase4c-scoreline').innerText()).includes('Grid 9 × 9'), 'Sudoku 9×9 reports its full-grid dimensions');
        interactionChecks += 1;

        currentRoute = '/arcade/tile-garden/ (merge, pause, and deterministic reset)';
        const garden = await startPhase4cGame(page, '/arcade/tile-garden/');
        await page.getByRole('button', { name: 'Plant at selected bed' }).click();
        assert.equal(await page.locator('.phase4c-garden-cell.tier-2').count(), 1, 'Tile Garden merges an existing two-by-two tier-one group after a planting');
        await verifyArcadePauseResume(page, 'Tile Garden', true);
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.equal(await page.locator('.phase4c-garden-cell.tier-2').count(), 0, 'Tile Garden reset restores its seeded tier-one layout');
        assert.ok((await garden.locator('.phase4c-scoreline').innerText()).includes('Moves: 0'), 'Tile Garden reset clears its move count');
        interactionChecks += 1;

        currentRoute = '/arcade/word-search/ (endpoint selection and reset)';
        const wordSearch = await startPhase4cGame(page, '/arcade/word-search/');
        await page.getByRole('button', { name: 'Select endpoint' }).click();
        await page.getByLabel('Word Search row').selectOption('1');
        await page.getByLabel('Word Search column').selectOption('4');
        await page.getByRole('button', { name: 'Select endpoint' }).click();
        assert.ok((await page.locator('.phase4c-word-list').innerText()).includes('STAR'), 'Word Search accepts a straight listed word from its two endpoints');
        assert.equal(await page.locator('.phase4c-word-cell.is-found').count(), 4, 'Word Search highlights the complete found path');
        await verifyArcadePauseResume(page, 'Word Search', true);
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.equal(await page.locator('.phase4c-word-list .is-found').count(), 0, 'Word Search reset clears found words');
        assert.ok((await wordSearch.locator('.phase4c-scoreline').innerText()).includes('Found: 0 / 4'), 'Word Search reset restores the authored target list');
        interactionChecks += 1;

        currentRoute = '/arcade/word-tile-rush/ (timer start, pause, and reset)';
        const rush = await startPhase4cGame(page, '/arcade/word-tile-rush/');
        await page.locator('.phase4c-rush-cell:not(:disabled)').first().click();
        await verifyArcadePauseResume(page, 'Word Tile Rush', true);
        await page.waitForFunction(() => /Time: 8\ds/u.test(document.querySelector('.phase4c-scoreline strong')?.textContent ?? ''), { timeout: 4_000 });
        assert.equal(await page.locator('.arcade-runtime-provider').getAttribute('data-h5-last-breakpoint'), 'none', 'an active Word Tile Rush timer is not an ad boundary');
        await page.getByRole('button', { name: 'Reset to seeded start' }).click();
        assert.ok((await rush.locator('.phase4c-scoreline').innerText()).includes('Time: 90s'), 'Word Tile Rush reset restores its full seeded countdown');
        interactionChecks += 1;

        currentRoute = '/tools/word-counter/ (tool interaction)';
        await page.goto(pathWithEvent('/tools/word-counter/'), { waitUntil: 'domcontentloaded' });
        const wordCounterInput = page.getByRole('textbox', { name: 'Text to count' });
        await wordCounterInput.fill('One two. Three!');
        await page.waitForFunction(() => document.querySelector('[aria-label="Word count"]')?.textContent === '3'
          && document.querySelector('[aria-label="Sentence count"]')?.textContent === '2');
        await wordCounterInput.fill('We’re testing this browser counter. Does it work?');
        await page.waitForFunction(() => document.querySelector('[aria-label="Word count"]')?.textContent === '8'
          && document.querySelector('[aria-label="Sentence count"]')?.textContent === '2');
        await wordCounterInput.fill('well-made test 👩🏽‍💻');
        await page.waitForFunction(() => document.querySelector('[aria-label="Word count"]')?.textContent === '3'
          && document.querySelector('[aria-label="Sentence count"]')?.textContent === '1');
        interactionChecks += 1;

        currentRoute = '/tools/json-workbench/ (tool interaction)';
        await page.goto(pathWithEvent('/tools/json-workbench/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('textbox', { name: 'JSON input' }).fill('{"name":"NoCharge","ready":true}');
        await page.getByRole('button', { name: 'Format JSON' }).click();
        await page.waitForFunction(() => (document.querySelector('.json-workbench__output')?.textContent ?? '').includes('\n'));
        await page.getByRole('button', { name: 'Minify JSON' }).click();
        await page.waitForFunction(() => document.querySelector('.json-workbench__output')?.textContent === '{"name":"NoCharge","ready":true}');
        interactionChecks += 1;

        currentRoute = '/tools/contrast-checker/ (tool interaction)';
        await page.goto(pathWithEvent('/tools/contrast-checker/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('textbox', { name: 'Foreground hex' }).fill('#000000');
        await page.getByRole('textbox', { name: 'Background hex' }).fill('#FFFFFF');
        await page.getByText('21.00:1', { exact: true }).waitFor({ state: 'visible' });
        await page.getByText('AAA normal text · 7:1', { exact: true }).waitFor({ state: 'visible' });
        await page.getByRole('button', { name: 'Swap colors' }).click();
        await page.getByText('21.00:1', { exact: true }).waitFor({ state: 'visible' });
        await page.getByRole('textbox', { name: 'Foreground hex' }).fill('#FFF');
        await page.getByText('Enter both colors as six-digit hex values', { exact: false }).waitFor({ state: 'visible' });
        interactionChecks += 1;

        currentRoute = '/tools/discovery-wheel/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/discovery-wheel/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('link', { name: 'Pattern Pairs' }).waitFor({ state: 'visible' });
        await page.getByRole('button', { name: 'Spin the shortlist' }).click();
        await page.locator('.phase3b-tool__results h3 a').first().getByText('Sum Sprint', { exact: true }).waitFor({ state: 'visible' });
        await page.getByLabel('Session limit').selectOption('5');
        await page.getByLabel('Pace').selectOption('untimed');
        assert.equal(await page.locator('.phase3b-tool__results article').count(), 1, 'Discovery Wheel intersects its time and no-countdown constraints');
        interactionChecks += 1;

        currentRoute = '/tools/game-finder/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/game-finder/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('radio', { name: 'Memory' }).check();
        assert.equal(await page.locator('article.phase3b-tool__card').count(), 1, 'Game Finder intersects its activity category with the published game facts');
        await page.getByRole('radio', { name: 'Mouse or touch' }).check();
        assert.equal(await page.locator('article.phase3b-tool__card').count(), 1, 'Game Finder keeps the matching input-compatible result');
        await page.getByRole('button', { name: 'Reset answers' }).click();
        assert.equal(await page.locator('article.phase3b-tool__card').count(), 2, 'Game Finder reset restores the unfiltered catalog');
        interactionChecks += 1;

        currentRoute = '/tools/session-planner/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/session-planner/'), { waitUntil: 'domcontentloaded' });
        await page.locator('.phase3b-tool__results article').first().waitFor({ state: 'visible' });
        const plannerCards = await page.locator('.phase3b-tool__results article').allInnerTexts();
        assert.ok(plannerCards.some((text) => text.includes('about 2 runs in 10 min')), 'Session Planner shows the rounded-midpoint run estimate beside the range');
        await page.getByLabel('Minutes available').fill('20');
        assert.ok((await page.locator('.phase3b-tool__status').innerText()).includes('20 min'), 'Session Planner updates its bounded minute budget');
        interactionChecks += 1;

        currentRoute = '/tools/random-activity/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/random-activity/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Pick an activity' }).click();
        await page.locator('[data-random-result] a').waitFor({ state: 'visible' });
        assert.ok((await page.locator('[data-random-result] a').getAttribute('href'))?.startsWith('/'), 'Random Activity links to a canonical published entry');
        await page.getByRole('button', { name: 'Clear pick' }).click();
        assert.equal(await page.locator('[data-random-result]').count(), 0, 'Random Activity clears only the displayed pick');
        interactionChecks += 1;

        currentRoute = '/tools/ambient-mixer/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/ambient-mixer/'), { waitUntil: 'domcontentloaded' });
        assert.equal(await page.getByLabel('Soundscape volume').inputValue(), '24', 'Ambient Mixer starts at its 24-percent default when the URL has no volume');
        await page.getByLabel('Soundscape', { exact: true }).selectOption('stream');
        await page.getByRole('button', { name: 'Play soundscape' }).click();
        await page.waitForFunction(() => /playing at 24 percent|Audio unavailable/u.test(document.querySelector('.phase3b-tool__status')?.textContent ?? ''));
        const ambientStatus = await page.locator('.phase3b-tool__status').innerText();
        if (ambientStatus.includes('playing at 24 percent')) {
          await page.getByRole('button', { name: 'Stop', exact: true }).click();
          await page.getByText('Stopped. No sound is being generated.', { exact: true }).waitFor({ state: 'visible' });
        }
        interactionChecks += 1;

        currentRoute = '/tools/singing-bowl-engine/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/singing-bowl-engine/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Load pentatonic set' }).click();
        assert.equal(await page.locator('.phase3b-tool__bowl-item').count(), 5, 'Singing Bowl Engine loads its five-tone pentatonic preset');
        const bowlFrequency = page.getByRole('slider', { name: 'Bowl frequency' });
        await bowlFrequency.focus();
        await bowlFrequency.press('End');
        assert.equal(await bowlFrequency.inputValue(), '880', 'Singing Bowl Engine bounds tuning at 880 hertz');
        await page.getByRole('button', { name: 'Show share URL' }).click();
        const arrangementHash = await page.evaluate(() => window.location.hash);
        assert.ok(arrangementHash.startsWith('#tones='), 'Singing Bowl Engine encodes the arrangement in the URL fragment');
        await page.goto(pathWithEvent(`/tools/singing-bowl-engine/${arrangementHash}`), { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelectorAll('.phase3b-tool__bowl-item').length === 5);
        assert.equal(await page.locator('.phase3b-tool__bowl-item').count(), 5, 'Singing Bowl Engine restores a fragment after client hydration without losing tones');
        interactionChecks += 1;

        currentRoute = '/tools/reduced-motion-tester/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/reduced-motion-tester/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('status').filter({ hasText: 'reports prefers-reduced-motion: reduce' }).waitFor({ state: 'visible' });
        assert.equal(await page.locator('.phase3b-tool__motion-dot').evaluate((element) => getComputedStyle(element).animationName), 'none', 'Reduced Motion Tester honors the active reduce query in its CSS demo');
        interactionChecks += 1;

        currentRoute = '/tools/touch-target-checker/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/touch-target-checker/'), { waitUntil: 'domcontentloaded' });
        await page.getByLabel('Manual width in CSS pixels').fill('100');
        await page.getByLabel('Manual height in CSS pixels').fill('30');
        await page.getByText('100 × 30 CSS px. Both dimensions reach 24 CSS pixels; at least one is below 44.', { exact: true }).waitFor({ state: 'visible' });
        await page.getByLabel('Manual height in CSS pixels').fill('2501');
        await page.getByText('Enter finite width and height values from 0 to 2,000 CSS pixels.', { exact: true }).waitFor({ state: 'visible' });
        interactionChecks += 1;

        currentRoute = '/tools/storage-inspector/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/storage-inspector/'), { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
          localStorage.setItem('nocharge:score:sample', 'SECRET_VALUE');
          localStorage.setItem('nocharge:consent', 'CONSENT_VALUE');
        });
        await page.getByRole('button', { name: 'Scan this browser' }).click();
        await page.getByText('nocharge:score:sample', { exact: true }).waitFor({ state: 'visible' });
        assert.equal(await page.getByText('SECRET_VALUE', { exact: true }).count(), 0, 'Storage Inspector lists a key name without rendering its value');
        assert.equal(await page.getByText('nocharge:consent', { exact: true }).count(), 0, 'Storage Inspector excludes the exact consent key');
        await page.getByRole('button', { name: 'Clear displayed results' }).click();
        assert.equal(await page.evaluate(() => localStorage.getItem('nocharge:score:sample')), 'SECRET_VALUE', 'clearing the displayed list leaves browser storage untouched');
        interactionChecks += 1;

        currentRoute = '/tools/zoom-visualizer/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/zoom-visualizer/'), { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: '400% reflow reference' }).click();
        await page.getByRole('status').filter({ hasText: 'Equivalent viewport: 320 × 256 CSS pixels at 400% zoom.' }).waitFor({ state: 'visible' });
        interactionChecks += 1;

        currentRoute = '/tools/nonogram-clue-calculator/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/nonogram-clue-calculator/'), { waitUntil: 'domcontentloaded' });
        await page.getByLabel('Line length').fill('5');
        await page.getByLabel('Clue runs').fill('3');
        await page.getByRole('button', { name: 'Enumerate arrangements' }).click();
        await page.getByText('3 arrangements. Minimum span: 3 of 5 cells.', { exact: true }).waitFor({ state: 'visible' });
        assert.equal(await page.locator('.phase3b-tool__readout code').innerText(), '? ? X ? ?', 'Nonogram calculator finds the shared center cell across every placement');
        interactionChecks += 1;

        currentRoute = '/tools/solitaire-comparator/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/solitaire-comparator/'), { waitUntil: 'domcontentloaded' });
        await page.getByLabel('Solitaire variant focus').selectOption('spider');
        assert.equal(await page.locator('.phase3b-tool__table thead th').count(), 2, 'Solitaire Comparator can isolate one reference column');
        assert.ok((await page.locator('.phase3b-tool__table').innerText()).includes('104 cards total'), 'the Spider reference includes its two-deck scope');
        interactionChecks += 1;

        currentRoute = '/tools/sudoku-helper/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/sudoku-helper/'), { waitUntil: 'domcontentloaded' });
        await page.getByLabel('Sudoku grid size').selectOption('6');
        const sudokuFirst = page.locator('.phase3b-tool__cell').first();
        await sudokuFirst.fill('1');
        await sudokuFirst.press('ArrowRight');
        await page.getByText(/Candidates for row 1, column 2:/u).waitFor({ state: 'visible' });
        await page.getByLabel('Row 1, column 2, empty').fill('1');
        await page.getByText(/Conflict detected/u).waitFor({ state: 'visible' });
        await page.getByRole('button', { name: 'Reveal one solution (spoiler)' }).click();
        await page.getByText(/The entered clues repeat/u).waitFor({ state: 'visible' });
        await page.getByRole('button', { name: 'Clear grid' }).click();
        await page.getByRole('button', { name: 'Reveal one solution (spoiler)' }).click();
        await page.waitForFunction(() => [...document.querySelectorAll('.phase3b-tool__cell')].length === 36
          && [...document.querySelectorAll('.phase3b-tool__cell')].every((cell) => cell.value.length === 1));
        interactionChecks += 1;

        currentRoute = '/tools/focus-order-demo/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/focus-order-demo/'), { waitUntil: 'domcontentloaded' });
        const focusA1 = page.getByRole('button', { name: 'Sample cell A1' });
        await focusA1.focus();
        await focusA1.press('Tab');
        await page.getByRole('status').filter({ hasText: 'Focused: A2.' }).waitFor({ state: 'visible' });
        await page.keyboard.press('Shift+Tab');
        await page.getByRole('status').filter({ hasText: 'Focused: A1.' }).waitFor({ state: 'visible' });
        interactionChecks += 1;

        currentRoute = '/tools/word-scoring/ (Phase 3B interaction)';
        await page.goto(pathWithEvent('/tools/word-scoring/'), { waitUntil: 'domcontentloaded' });
        await page.getByLabel('Word length', { exact: true }).fill('5');
        const scoreSummary = await page.locator('.phase3b-tool__range-summary').innerText();
        assert.ok(scoreSummary.includes('13 points') && scoreSummary.includes('38 points') && scoreSummary.includes('250 points'), 'Word Scoring compares the linear, quadratic, and separate 10n² game rule');
        interactionChecks += 1;
      }

      await context.close();
    }
  }

  assert.deepEqual(pageErrors, [], 'all routes and interactions are free of uncaught page errors');
  assert.deepEqual(consoleErrors, [], 'all routes and interactions are free of browser console errors');
  assert.deepEqual(failedRequests, [], 'all routes and interactions are free of failed network requests');

  await mkdir(reportDirectory, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    result: 'PASS',
    browser: 'Playwright Chromium (headless)',
    timezoneId: 'America/New_York',
    eventPreview,
    themes: modes,
    viewports,
    routes: routes.map(({ path: routePath }) => routePath),
    checks: {
      routeThemeViewportVisits: routeChecks,
      routeScrollChecks,
      horizontalOverflowChecks: responsiveChecks,
      interactions: interactionChecks,
      passAndPlayLayoutChecks,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length,
      failedRequests: failedRequests.length,
    },
    interactionCoverage: [
      'Related guide card SPA navigation scrolls from the related section to the destination top; Back and Forward continue to work',
      'section category filtering and reset',
      'registry-derived Arcade category route',
      'cross-section Discover filters',
      'URL-backed client search and accessible search dialog',
      'Pattern Pairs and Sum Sprint gameplay plus Simon round/game-over lifecycle, opt-in audio, visibility pause/resume, reset, and 390px controls',
      'Lights Out reversible solver path, deterministic puzzle reset, keyboard focus, visibility/blur lifecycle, and H5 completion boundary',
      'Last Token pile presets, immediate next-player turns, stable banner/board geometry, final-token loss rule, and natural completion boundary',
      'Hangman physical/on-screen letter input, repeated-letter reveal, reset, and terminal loss/win boundary',
      'Tic-Tac-Toe 3×3/4×4 match state, immediate board turns, stable banner/board geometry, arrow focus, alternating starters, and round-end callback',
      'Four in a Row direct board input, gravity placement, stable banner/board geometry, keyboard column movement, and terminal win callback',
      'Twenty Forty-Eight deterministic merges/spawn/reset, arrow/WASD and touch controls, visibility pause, and milestone rule',
      'Word Loom daily/practice modes, duplicate-letter feedback, invalid-word protection, touch keyboard, and completed-round callback',
      'All 18 Phase 4C routes: typed runtime mount, complete documentation, 390px alternate controls, and deterministic seeded reset',
      'Phase 4C mechanics: Beacon Lattice full pentomino tiling; Checkers direct move; Color Flip cycle; Dots & Boxes direct turn/extra-turn rules; FreeCell move; Gomoku direct placement; Klondike stock; Memory Match; safe Minesweeper reveal; both Sudoku sizes; Morris placement and mill removal; Nonogram sizing; Pass the Picture canvas turns/SVG; Reversi direct legal moves; Tile Garden merge; Word Search endpoints; Word Tile Rush timer',
      'All Phase 4C games pause and resume on hidden/visible state and blur/focus, preserve state, and avoid break requests during moves or player changes',
      'All nine open-information multiplayer games: immediate active-player changes, no Ready gate, and stable status/board geometry in the full Light/Dark × 1440px/390px matrix',
      'Word Counter punctuation, hyphen, Unicode, and live statistics',
      'JSON Workbench format and minify',
      'Contrast Checker exact ratio, swap, thresholds, and invalid-hex handling',
      'Discovery Wheel filtering and rotating shortlist',
      'Game Finder intersections, input facts, and reset',
      'Session Planner rounded-midpoint run estimates',
      'Random Activity draw, canonical link, and display-only clear',
      'Ambient Mixer explicit audio start/stop and default volume',
      'Singing Bowl presets, frequency bounds, URL fragment restore, and hydration',
      'Reduced Motion live query and CSS response',
      'Touch Target manual dimensions and validation',
      'Storage Inspector key-name-only scan, consent exclusion, and read-only clear',
      'Zoom Visualizer 400-percent reflow estimate',
      'Nonogram line enumeration and forced-cell result',
      'Solitaire variant focus and scoped Spider reference',
      'Sudoku candidate navigation, conflict detection, and spoiler completion',
      'Focus Order forward and reverse keyboard movement',
      'Word Scoring linear, quadratic, and separate 10n² rule comparison',
      'Batch 02 icons in published tool cards and detail headings',
    ],
  };
  await writeFile(path.join(reportDirectory, 'browser-results.json'), `${JSON.stringify(report, null, 2)}\n`);
  const markdown = [
    '# NoCharge V2 Phase 4C — Arcade rebuild and interaction browser QA',
    '',
    `**Result:** ${report.result}  `,
    `**Generated:** ${report.generatedAt}  `,
    `**Browser:** ${report.browser} (${report.timezoneId})`,
    '',
    '## Matrix',
    '',
    `- Theme modes: ${modes.join(', ')}`,
    `- Event palette: ${eventPreview} (active in every visit)`,
    `- Viewports: ${viewports.map(({ name, width, height }) => `${name} (${width}×${height})`).join(', ')}`,
    `- Route/theme/viewport visits: ${routeChecks}`,
    `- SPA route-scroll checks: ${routeScrollChecks}; Back/Forward verified`,
    `- Horizontal overflow checks: ${responsiveChecks}; failures: 0`,
    `- Uncaught page errors: ${pageErrors.length}; console errors: ${consoleErrors.length}; failed requests: ${failedRequests.length}`,
    '',
    '## Route and interaction coverage',
    '',
    ...report.routes.map((routePath) => `- ${routePath}`),
    '',
    ...report.interactionCoverage.map((item) => `- ${item}`),
    '',
    `- Filter/search/module interaction checks: ${interactionChecks}`,
    `- Pass-and-play status-height, board-position, and zero-CLS assertions: ${passAndPlayLayoutChecks}; direct-turn scenarios cover all nine open-information multiplayer games in every theme/viewport combination.`,
    '- Content pages and interactive modules were checked with Light and Dark preferences plus the active Halloween event palette at both requested viewports.',
    '- The broader calendar/theme browser suite separately exercises all 16 event rules, date previews, saved preferences, color modes, responsive overflow, and visible-text contrast.',
    '',
  ].join('\n');
  await writeFile(path.join(reportDirectory, 'browser-results.md'), markdown);

  console.log(`Content browser checks passed: ${routeChecks} route/theme/viewport visits, ${routeScrollChecks} SPA route-scroll check, ${responsiveChecks} overflow checks, ${interactionChecks} filters/search/module interactions, and ${passAndPlayLayoutChecks} pass-and-play layout assertions across Light, Dark, active Halloween theme, desktop 1440px, and mobile 390px.`);
  console.log(`Report: ${path.join(reportDirectory, 'browser-results.md')}`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
