import { describe, expect, it } from 'vitest';

import { checkEndpoint, checkProduction, expectedRoutes } from './check-production.mjs';

describe('production uptime check', () => {
  it('rejects non-200 responses and slow responses', async () => {
    await expect(
      checkEndpoint({
        baseUrl: 'https://example.test',
        path: '/',
        thresholdMs: 1_000,
        fetcher: async () => new Response('no', { status: 503 }),
      }),
    ).rejects.toThrow('returned 503');
  });

  it('checks public routes, health metadata, and sitemap routes without user data', async () => {
    const seen: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      const url = new URL(String(input));
      seen.push(url.pathname);
      if (url.pathname === '/health.json') {
        return new Response(JSON.stringify({ status: 'ok', site: 'NoCharge', release: 'test', builtAt: '2026-08-15T00:00:00.000Z' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (url.pathname === '/sitemap.xml') {
        const locations = expectedRoutes
          .map((path) => `<url><loc>https://example.test${path}</loc></url>`)
          .join('');
        return new Response(`<?xml version="1.0"?><urlset>${locations}</urlset>`, { status: 200 });
      }
      return new Response('ok', { status: 200 });
    };

    const result = await checkProduction({
      baseUrl: 'https://example.test',
      thresholdMs: 1_000,
      fetcher,
      log: () => {},
    });

    expect(result.health).toMatchObject({ status: 'ok', site: 'NoCharge' });
    expect(seen).toContain('/health.json');
    expect(seen).toContain('/sitemap.xml');
    expect(seen).toEqual(expect.arrayContaining(expectedRoutes));
  });
});
