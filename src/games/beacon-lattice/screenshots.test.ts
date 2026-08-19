import { statSync } from 'node:fs';

import sharp from 'sharp';
import { describe, expect, test } from 'vitest';

describe('gameplay screenshots', () => {
  test('desktop and mobile captures exist at the documented sizes', async () => {
    const desktop = await sharp('public/game-art/beacon-lattice/screenshot-desktop.webp').metadata();
    const mobile = await sharp('public/game-art/beacon-lattice/screenshot-mobile.webp').metadata();
    expect(desktop.width).toBe(1440);
    expect(desktop.height).toBe(900);
    expect(mobile.width).toBe(720);
    expect(mobile.height).toBe(1280);
    expect(statSync('public/game-art/beacon-lattice/screenshot-desktop.webp').size).toBeLessThan(180 * 1024);
    expect(statSync('public/game-art/beacon-lattice/screenshot-mobile.webp').size).toBeLessThan(140 * 1024);
  });
});
