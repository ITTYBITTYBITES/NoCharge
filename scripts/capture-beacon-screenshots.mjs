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

await waitForServer();
const browser = await chromium.launch();
const setup = async (width, height) => {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(() => {
    localStorage.setItem('nocharge:consent', JSON.stringify({ analytics: false }));
  });
  await page.goto('http://127.0.0.1:4327/games/beacon-lattice/');
  await page.evaluate(() => {
    const api = window.__NOCHARGE_BEACON_LATTICE_TEST__;
    if (!api) throw new Error('test seam missing');
    api.loadPuzzle('bl-02-long-plus');
    api.applyPlacements([
      { x: 2, y: 2, type: 'cross' },
      { x: 2, y: 0, type: 'cross' },
    ]);
  });
  const png = await page.locator('[data-game-viewport]').screenshot({ type: 'png' });
  await page.close();
  return png;
};

const desktop = await setup(1440, 900);
const mobile = await setup(390, 844);
await sharp(desktop).resize(1440, 900, { fit: 'cover' }).webp({ quality: 80 }).toFile(`${dir}screenshot-desktop.webp`);
await sharp(mobile).resize(720, 1280, { fit: 'cover' }).webp({ quality: 80 }).toFile(`${dir}screenshot-mobile.webp`);
await browser.close();
preview.kill();
console.log('Wrote DOM gameplay screenshots.');
