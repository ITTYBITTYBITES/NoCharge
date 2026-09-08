import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { PASS_PLAY_GAME_IDS } from '../../src/games/shared/pass-play';
import { blockGoogleEndpoints, denyOptionalServices } from './helpers/consent';

const gameDirectory = join(process.cwd(), 'src/content/games');
const gameSlugs = readdirSync(gameDirectory)
  .filter((file) => file.endsWith('.md') && !/^draft:\s*true\s*$/m.test(readFileSync(join(gameDirectory, file), 'utf8')))
  .map((file) => file.slice(0, -3));
const toolDirectory = join(process.cwd(), 'src/pages/tools');
const toolFiles = readdirSync(toolDirectory).filter((file) => file.endsWith('.astro') && file !== 'index.astro');
const toolSlugs = toolFiles
  .filter((file) => readFileSync(join(toolDirectory, file), 'utf8').includes('<ToolPage'))
  .map((file) => file.slice(0, -6));
const passPlayCount = gameSlugs.filter((slug) => (PASS_PLAY_GAME_IDS as readonly string[]).includes(slug)).length;

// These checks intentionally disable JavaScript: publisher copy and indexing
// directives must arrive in HTML, independently of game mounts or tool output.
test.describe('Static publisher content and indexing', () => {
  test.use({ javaScriptEnabled: false });
  test.beforeEach(async ({ page }) => blockGoogleEndpoints(page));

  test('search and query variants are noindex without nofollow', async ({ page }) => {
    for (const path of ['/search/', '/search/?q=nonogram', '/search/?q=solitaire']) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', 'https://nocharge.net/search/');
      await expect(page.locator('.search-shortcuts a[href="/arcade/"]')).toBeVisible();
    }
  });

  test('robots allow crawling and sitemaps contain canonical-only URLs', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toMatch(/User-agent:\s*\*\s+Allow:\s*\//);
    expect(await robots.text()).not.toMatch(/^Disallow:\s*\//m);

    for (const path of ['/sitemap.xml', '/sitemap-setup.xml']) {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      const locations = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
      expect(locations.length).toBeGreaterThan(0);
      expect(new Set(locations).size).toBe(locations.length);
      for (const location of locations) {
        const url = new URL(location);
        expect(url.origin).toBe('https://nocharge.net');
        expect(url.search).toBe('');
        expect(url.hash).toBe('');
        expect(url.pathname).not.toBe('/search/');
      }
    }
  });

  for (const slug of gameSlugs) {
    test(`${slug}: rules, example, scoring, and storage are available without scripts`, async ({ page }) => {
      const path = `/games/${slug}/`;
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `https://nocharge.net${path}`);
      await expect(page.locator('head meta[name="robots"]')).toHaveCount(0);
      const copy = page.locator('.game-about__copy');
      for (const heading of ['Objective and win/loss conditions', 'How it plays', 'Scoring and strategy', 'Local save data']) {
        await expect(copy.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      }
      await expect(copy).not.toContainText('The board, controls, and session length are documented on the game page');
      await expect(copy).not.toContainText('We did not measure long-term durability');
      await expect(copy.locator('code').first()).toBeVisible();
    });
  }

  for (const slug of toolSlugs) {
    test(`${slug}: unique explanations and valid embed example are static HTML`, async ({ page }) => {
      const path = `/tools/${slug}/`;
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `https://nocharge.net${path}`);
      const how = page.locator('[aria-labelledby="how-it-works-heading"]');
      const limits = page.locator('[aria-labelledby="tool-limits-heading"]');
      await expect(how.getByRole('heading', { name: 'Worked example', exact: true })).toBeVisible();
      await expect(limits).toBeVisible();
      await expect(limits).not.toContainText('eye exam');
      await expect(limits).not.toContainText('ergonomics assessment');
      // Playwright's text matcher skips noscript roots even when scripting is off.
      await expect(page.locator('noscript p')).toBeVisible();
      expect(await page.locator('noscript').textContent()).toContain('worked examples');
      const snippet = await page.locator('[aria-labelledby="tool-embed-heading"] code').textContent();
      expect(snippet).toContain(`<a href="https://nocharge.net${path}">`);
      expect(snippet).not.toContain('nocharge.net$');
    });
  }

  test('primary pages keep indexable unique canonicals and current catalog counts', async ({ page }) => {
    const canonicalUrls = new Set<string>();
    for (const path of ['/', '/about/', '/privacy/', '/terms/', '/contact/']) {
      expect((await page.goto(path))?.status()).toBe(200);
      const canonical = page.locator('head link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      await expect(canonical).toHaveAttribute('href', `https://nocharge.net${path}`);
      await expect(page.locator('head meta[name="robots"]')).toHaveCount(0);
      canonicalUrls.add((await canonical.getAttribute('href'))!);
      if (path === '/' || path === '/about/') {
        const lede = page.locator('main .lede').first();
        await expect(lede).toContainText(new RegExp(`${gameSlugs.length} (?:free )?browser games`));
        await expect(lede).toContainText(`${gameSlugs.length - passPlayCount} solo games`);
        await expect(lede).toContainText(`${passPlayCount} Pass & Play games`);
        await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', new RegExp(`${gameSlugs.length} free browser games`));
      }
      if (path === '/about/') {
        await expect(page.locator('[aria-labelledby="about-tools"]')).toContainText(`${toolFiles.length} utilities`);
        await expect(page.locator('[aria-labelledby="about-operator"]')).toContainText('hello@nocharge.net');
      }
    }
    expect(canonicalUrls.size).toBe(5);
  });
});

test.describe('Worked examples agree with interactive tools', () => {
  test.beforeEach(async ({ page }) => denyOptionalServices(page));

  test('nonogram uses every arrangement, not only the 200 displayed', async ({ page }) => {
    await page.goto('/tools/nonogram-clue-calculator/');
    await page.locator('[data-calc-length]').fill('5');
    await page.locator('[data-calc-runs]').fill('3');
    await page.locator('[data-calc-run]').click();
    await expect(page.locator('.calc-lines code')).toHaveText(['XXX..', '.XXX.', '..XXX']);
    await expect(page.locator('.calc-forced code')).toHaveText('? ? X ? ?');

    await page.locator('[data-calc-length]').fill('25');
    await page.locator('[data-calc-runs]').fill('1,1,1');
    await page.locator('[data-calc-run]').click();
    await expect(page.locator('[data-calc-output]')).toContainText('1771 arrangements (showing first 200)');
    await expect(page.locator('.calc-lines code')).toHaveCount(200);
    await expect(page.locator('.calc-forced code')).toHaveText(Array(25).fill('?').join(' '));

    await page.locator('[data-calc-runs]').fill('2,invalid,1');
    await page.locator('[data-calc-run]').click();
    await expect(page.locator('[data-calc-output]')).toContainText('positive whole-number runs');
  });

  test('contrast correctly distinguishes normal and large-text AA/AAA', async ({ page }) => {
    await page.goto('/tools/contrast-checker/');
    await page.locator('[data-contrast-fg]').fill('#000000');
    await page.locator('[data-contrast-bg]').fill('#ffffff');
    await expect(page.locator('[data-contrast-result]')).toHaveText('Contrast ratio 21.00:1 — Normal text AAA · large text AAA.');
    await page.locator('[data-contrast-fg]').fill('#777777');
    await expect(page.locator('[data-contrast-result]')).toHaveText('Contrast ratio 4.48:1 — Normal text below AA · large text AA.');
  });

  test('word scoring returns the published model examples', async ({ page }) => {
    await page.goto('/tools/word-scoring/');
    await page.locator('[data-scorer-length]').fill('4');
    await expect(page.locator('[data-value-linear]')).toHaveText('10 points');
    await expect(page.locator('[data-value-squared]')).toHaveText('24 points');
    await page.locator('[data-scorer-length]').fill('5');
    await expect(page.locator('[data-value-linear]')).toHaveText('13 points');
    await expect(page.locator('[data-value-squared]')).toHaveText('38 points');
    await expect(page.locator('[aria-labelledby="how-it-works-heading"]')).toContainText('five-letter word 250');
  });

  test('storage scan excludes consent and never reads saved values', async ({ page }) => {
    await page.goto('/tools/storage-inspector/');
    await page.evaluate(() => {
      localStorage.setItem('nocharge:2048:best-tile', '4096');
      localStorage.setItem('nocharge:unlisted-example', 'PRIVATE_VALUE_MUST_NOT_RENDER');
      localStorage.setItem('unrelated-example', 'ignore');
      // Existing page initialization is complete. A scan needs only key names.
      Storage.prototype.getItem = () => { throw new Error('A key-name scan must not read values'); };
    });
    await page.locator('[data-inspector-scan]').click();
    await expect(page.locator('[data-inspector-status]')).toContainText('Scanned: 2 NoCharge keys');
    await expect(page.locator('[data-inspector-rows]')).toContainText('nocharge:2048:best-tile');
    await expect(page.locator('[data-inspector-rows]')).not.toContainText('nocharge:consent');
    await expect(page.locator('[data-inspector-rows]')).not.toContainText('unrelated-example');
    expect(await page.locator('#results').innerHTML()).not.toContain('PRIVATE_VALUE_MUST_NOT_RENDER');
  });

  test('focus demo announces the actual focused button in document order', async ({ page }) => {
    await page.goto('/tools/focus-order-demo/');
    await page.getByRole('button', { name: 'Cell A1', exact: true }).focus();
    await expect(page.locator('[data-focus-status]')).toHaveText('Focused: A1');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Cell B1', exact: true })).toBeFocused();
    await expect(page.locator('[data-focus-status]')).toHaveText('Focused: B1');
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Cell A3', exact: true })).toBeFocused();
  });

  test('sudoku candidates respect grid size and Reveal rejects contradictions', async ({ page }) => {
    await page.goto('/tools/sudoku-helper/');
    await page.locator('[data-helper-size]').selectOption('6');
    const cells = page.locator('[data-helper-grid] button');
    for (let digit = 1; digit <= 5; digit += 1) {
      await cells.nth(digit).click();
      await page.keyboard.press(String(digit));
    }
    await cells.first().click();
    await expect(page.locator('[data-helper-status]')).toHaveText('Candidates for row 1, column 1: 6.');
    await page.keyboard.press('7');
    await expect(cells.first()).toHaveText('');
    await page.keyboard.press('6');
    await expect(cells.first()).toHaveText('6');
    await expect(cells.first()).toBeFocused();

    await page.locator('[data-helper-clear]').click();
    await cells.first().click();
    await page.keyboard.press('1');
    await cells.nth(1).click();
    await page.keyboard.press('1');
    await page.locator('[data-helper-reveal]').click();
    await expect(page.locator('[data-helper-status]')).toContainText('conflicting digits');
  });
});

test.describe('Catalog filters and reference examples', () => {
  test.beforeEach(async ({ page }) => denyOptionalServices(page));

  test('shared search URLs initialize their query in the static site', async ({ page }) => {
    await page.goto('/search/?q=ambient');
    await expect(page.locator('#search-input')).toHaveValue('ambient');
    await expect(page.locator('#results-list .result-item').first()).toBeVisible();
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  test('game finder applies all five example constraints', async ({ page }) => {
    await page.goto('/tools/game-finder/');
    for (const [name, value] of [['time', '5'], ['players', 'solo'], ['pressure', 'untimed'], ['input', 'keyboard'], ['kind', 'memory']]) {
      await page.locator(`input[name="${name}"][value="${value}"]`).check();
    }
    await expect(page.locator('#finder-results')).toContainText('Memory Match');
    const titles = await page.locator('.finder-card h3').allTextContents();
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    await page.locator('input[name="pressure"][value="timed"]').check();
    await expect(page.locator('#finder-results')).toContainText('No game in the current catalog matches all five answers');
  });

  test('session planner rounds the midpoint and keeps its minimum-one boundary explicit', async ({ page }) => {
    await page.goto('/tools/session-planner/');
    const memory = page.locator('.planner-card').filter({ has: page.locator('h3 a[href="/games/memory-match/"]') });
    await page.locator('[data-planner-min]').fill('10');
    await expect(memory).toContainText('about 2 runs in 10 min');
    await page.locator('[data-planner-min]').fill('1');
    await expect(memory).toContainText('about 1 run in 1 min');
    await expect(page.locator('[aria-labelledby="how-it-works-heading"]')).toContainText('minimum of one');
  });

  test('random activity uses the full pool and allows repeated draws', async ({ page }) => {
    await page.goto('/tools/random-activity/');
    const items = JSON.parse((await page.locator('#random-result').getAttribute('data-items'))!) as { title: string; href: string }[];
    const expected = items[Math.floor(0.62 * items.length)]!;
    await page.evaluate(() => { Math.random = () => 0.62; });
    for (let repeat = 0; repeat < 2; repeat += 1) {
      await page.locator('[data-random-pick]').click();
      await expect(page.locator('#random-result h3 a')).toHaveText(expected.title);
      await expect(page.locator('#random-result h3 a')).toHaveAttribute('href', expected.href);
    }
  });

  test('reduced-motion query updates both the status and the CSS demonstration', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/tools/reduced-motion-tester/');
    await expect(page.locator('[data-rm-status]')).toContainText('motion allowed');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('[data-rm-status]')).toContainText('reduce motion is on');
    await expect(page.locator('.rm-dot')).toHaveCSS('animation-name', 'none');
  });

  test('touch target example measures both 44-pixel dimensions', async ({ page }) => {
    await page.goto('/tools/touch-target-checker/');
    const canvas = page.locator('[data-tt-canvas]');
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 10, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 54, box.y + 64, { steps: 2 });
    await page.mouse.up();
    await expect(page.locator('[data-tt-readout]')).toContainText('44 × 44 px');
  });

  test('solitaire reference distinguishes shipped games from planned Spider', async ({ page }) => {
    await page.goto('/tools/solitaire-comparator/');
    await expect(page.getByRole('columnheader', { name: 'Spider (planned)' })).toBeVisible();
    await expect(page.locator('.comparator-scroll')).toContainText('8 completed King-to-Ace sequences, 13 cards each');
    await expect(page.locator('.comparator-scroll')).toContainText('hidden cards with exposed top cards');
    await expect(page.locator('.comparator-scroll')).not.toContainText('13 foundation piles');
  });
});

test.describe('Small-screen static content', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
  test.beforeEach(async ({ page }) => blockGoogleEndpoints(page));

  test('all refreshed game/tool copy and landing pages fit a 320-pixel viewport', async ({ page }) => {
    const paths = ['/', '/about/', ...gameSlugs.map((slug) => `/games/${slug}/`), ...toolSlugs.map((slug) => `/tools/${slug}/`)];
    for (const path of paths) {
      await page.goto(path);
      const dimensions = await page.evaluate(() => ({
        available: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content, path).toBeLessThanOrEqual(dimensions.available + 1);
    }
  });
});
