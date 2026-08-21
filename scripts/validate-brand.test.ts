import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { checkBrandAssets } from './validate-brand.mjs';

/** Builds a minimal fixture tree so negative cases fail for the right reason. */
function fixture(overrides: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'nocharge-brand-'));
  const publicDir = join(root, 'public');
  mkdirSync(join(publicDir, 'brand'), { recursive: true });
  mkdirSync(join(publicDir, 'icons'), { recursive: true });
  mkdirSync(join(publicDir, 'social'), { recursive: true });
  const defaultFiles: Record<string, string> = {
    'brand/nocharge-symbol.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <g fill="currentColor"><rect x="8" y="8" width="22" height="22" rx="6.5"/><rect x="34" y="8" width="22" height="22" rx="6.5"/><rect x="34" y="34" width="22" height="22" rx="6.5"/></g>
      <path fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round" d="M14.5 34 H22.5 A6.5 6.5 0 0 1 30 40.5 V49.5 A6.5 6.5 0 0 1 22.5 56 H16 M8 48 V41.5 A6.5 6.5 0 0 1 14.5 34"/>
    </svg>`,
    'brand/nocharge-symbol-black.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="#000"/></svg>',
    'brand/nocharge-symbol-white.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="#fff"/></svg>',
    'brand/nocharge-lockup-dark.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 128"/>',
    'brand/nocharge-lockup-light.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 128"/>',
    'manifest.webmanifest': JSON.stringify({
      name: 'NoCharge',
      short_name: 'NoCharge',
      start_url: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      ],
    }),
  };
  for (const [path, content] of Object.entries({ ...defaultFiles, ...overrides })) {
    const target = join(publicDir, path);
    mkdirSync(join(target, '..'), { recursive: true });
    if (path.endsWith('.png') || path.endsWith('.ico')) {
      writeFileSync(target, Buffer.from(content, 'base64'));
    } else {
      writeFileSync(target, content);
    }
  }
  return root;
}

// Minimal valid 1x1 transparent PNG.
const TRANSPARENT_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('brand asset validation', () => {
  it('passes for the real repository', async () => {
    const errors = await checkBrandAssets(process.cwd());
    expect(errors).toEqual([]);
  });

  it('rejects a symbol with a script or external reference', async () => {
    const root = fixture({ 'brand/nocharge-symbol.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><script/></svg>' });
    const errors = await checkBrandAssets(root);
    expect(errors.some((error) => /script/.test(error))).toBe(true);
  });

  it('rejects wrong favicon and apple touch dimensions', async () => {
    const root = fixture();
    writeFileSync(join(root, 'public', 'favicon-16x16.png'), Buffer.from(TRANSPARENT_PNG, 'base64'));
    writeFileSync(join(root, 'public', 'favicon-32x32.png'), Buffer.from(TRANSPARENT_PNG, 'base64'));
    writeFileSync(join(root, 'public', 'favicon-48x48.png'), Buffer.from(TRANSPARENT_PNG, 'base64'));
    writeFileSync(join(root, 'public', 'favicon.ico'), Buffer.alloc(22));
    const errors = await checkBrandAssets(root);
    expect(errors.some((error) => /favicon/.test(error))).toBe(true);
  });

  it('rejects a manifest that is not NoCharge', async () => {
    const root = fixture({ 'manifest.webmanifest': JSON.stringify({ name: 'Other', short_name: 'Other', start_url: '/x' }) });
    const errors = await checkBrandAssets(root);
    expect(errors.some((error) => /manifest/.test(error))).toBe(true);
  });

  it('rejects a page that declares an invented twitter handle', async () => {
    const root = fixture();
    const pages = join(root, 'src', 'pages');
    mkdirSync(pages, { recursive: true });
    writeFileSync(join(pages, 'index.astro'), '<meta name="twitter:site" content="@NoChargeGames" />');
    const errors = await checkBrandAssets(root);
    expect(errors.some((error) => /twitter:site/.test(error))).toBe(true);
  });
});
