import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

for (const path of [
  '/',
  '/arcade/',
  '/my-arcade/',
  '/guides/',
  '/guides/memory-match/',
  '/guides/word-tile-rush/',
  '/guides/color-flip/',
  '/guides/beacon-lattice/',
  '/privacy/',
  '/about/',
  '/terms/',
  '/advertising/',
  '/accessibility/',
  '/changelog/',
  '/articles/',
  '/articles/memory-match-systematic-board-scan/',
  '/articles/how-nocharge-tests-browser-games/',
  '/collections/',
  '/collections/keyboard-friendly-browser-games/',
  '/games/memory-match/',
  '/games/word-tile-rush/',
  '/games/color-flip/',
  '/games/beacon-lattice/',
  '/404.html',
]) {
  test(`has no automatically detectable accessibility violations: ${path}`, async ({ page }) => {
    await denyOptionalServices(page);
    await page.goto(path);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test('ships a restrictive document policy with only the documented Google origins', async ({ page }) => {
  await denyOptionalServices(page);
  await page.goto('/games/memory-match/');

  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("form-action 'self'");
  // Official AdSense and Privacy & messaging origins, no broad wildcards.
  expect(policy).toContain('https://pagead2.googlesyndication.com');
  expect(policy).toContain('https://fundingchoicesmessages.google.com');
  expect(policy).toContain('https://googleads.g.doubleclick.net');
  expect(policy).toContain('https://tpc.googlesyndication.com');
  expect(policy).not.toContain('*.google.com');
  expect(policy).not.toContain('*.googlesyndication.com');
  // Google's ad-quality (invalid-traffic detection) endpoint is reachable
  // for connections only; it is not a script, image, or frame source.
  const directive = (name: string) => policy?.match(new RegExp(`${name}\\s+([^;]+)`))?.[1] ?? '';
  const connectSrc = directive('connect-src');
  expect(connectSrc).toContain('https://*.adtrafficquality.google');
  expect(directive('script-src')).not.toContain('adtrafficquality');
  expect(directive('img-src')).not.toContain('adtrafficquality');
  expect(directive('frame-src')).not.toContain('adtrafficquality');
  // The removed Adsterra provider is gone from the policy.
  expect(policy).not.toContain('highperformanceformat');
  // The meta CSP must not force HTTPS upgrades: WebKit applies the meta
  // directive to plain-HTTP local previews and fails the TLS handshake.
  // upgrade-insecure-requests is applied only at the production edge.
  expect(policy).not.toContain('upgrade-insecure-requests');

  // The banner is a native AdSense <ins>, never a custom sandboxed iframe.
  await expect(page.locator('[data-ad-banner] ins.adsbygoogle')).toHaveCount(1);
  await expect(page.locator('.ad-slot__frame, iframe[src*="/ads/"]')).toHaveCount(0);
  await expect(page.locator('[data-ad-banner] iframe')).toHaveCount(0);
});

test('publishes security contact details and the custom 404', async ({ request }) => {
  const security = await request.get('/.well-known/security.txt');
  expect(security.ok()).toBe(true);
  const securityBody = await security.text();
  expect(securityBody).toContain('Contact: mailto:hello@nocharge.net');
  expect(securityBody).toContain('Canonical: https://nocharge.net/.well-known/security.txt');
  expect(securityBody).toContain('Expires:');

  const missing = await request.get('/this-page-does-not-exist/');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('That page slipped away.');
});

test('links the verified contact address from the footer and every trust page', async ({ page }) => {
  await denyOptionalServices(page);
  const trustPaths = ['/about/', '/privacy/', '/terms/', '/advertising/', '/accessibility/'];

  for (const path of trustPaths) {
    await page.goto(path);
    const mailtoLinks = await page
      .getByRole('link')
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute('href'))
          .filter((href): href is string => typeof href === 'string' && href.startsWith('mailto:')),
      );
    expect(mailtoLinks.length, `${path} should expose a contact mailto link`).toBeGreaterThan(0);
    for (const href of mailtoLinks) {
      expect(href, `${path} must only reference the verified address`).toBe('mailto:hello@nocharge.net');
    }
  }
});

test('footer links to the verified address and the accessibility page', async ({ page }) => {
  await denyOptionalServices(page);
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await expect(footer.getByRole('link', { name: 'hello@nocharge.net' })).toHaveAttribute(
    'href',
    'mailto:hello@nocharge.net',
  );
  await expect(footer.getByRole('link', { name: 'Accessibility', exact: true })).toHaveAttribute(
    'href',
    '/accessibility/',
  );
});
