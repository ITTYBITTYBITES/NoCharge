import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const dir = fileURLToPath(new URL('../public/game-art/beacon-lattice/', import.meta.url));
await mkdir(dir, { recursive: true });

const preview = spawn('npx', ['astro', 'preview', '--host=127.0.0.1', '--port=4327'], {
  stdio: 'pipe',
});

const waitForServer = async () => {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch('http://127.0.0.1:4327/games/beacon-lattice/');
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Preview server did not start');
};

const stageLongPlusMixedCoverage = async (page) => {
  await page.locator('.bl').waitFor({ state: 'visible' });
  const mounted = await page.locator('[data-game-root="beacon-lattice"]').evaluate((el) =>
    el.classList.contains('is-game-mounted'),
  );
  if (!mounted) throw new Error('Beacon Lattice did not mount');
  await page.getByLabel('Puzzle selector').selectOption('bl-02-long-plus');
  await page.locator('[data-type="cross"]').click();
  await page.getByRole('button', { name: /Row 3, column 3/ }).click();
  await page.getByRole('button', { name: /Row 1, column 3/ }).click();
  await page.locator('.bl__cell.is-gap').first().waitFor();
  await page.locator('.bl__cell.is-exact').first().waitFor();
  await page.locator('.bl__cell.is-overlap').first().waitFor();
};

await waitForServer();
const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};
const browser = await chromium.launch(launchOptions);
const setup = async (width, height) => {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(() => {
    localStorage.setItem('nocharge:consent', JSON.stringify({ analytics: false }));
  });
  await page.goto('http://127.0.0.1:4327/games/beacon-lattice/', { waitUntil: 'networkidle' });
  await stageLongPlusMixedCoverage(page);
  const png = await page.locator('[data-game-viewport]').screenshot({ type: 'png' });
  await page.close();
  return png;
};

try {
  const desktop = await setup(1440, 900);
  const mobile = await setup(390, 844);
  await sharp(desktop).resize(1440, 900, { fit: 'cover' }).webp({ quality: 80 }).toFile(`${dir}screenshot-desktop.webp`);
  await sharp(mobile).resize(720, 1280, { fit: 'cover' }).webp({ quality: 80 }).toFile(`${dir}screenshot-mobile.webp`);
  console.log('Wrote DOM gameplay screenshots.');
} finally {
  await browser.close();
  preview.kill();
}
