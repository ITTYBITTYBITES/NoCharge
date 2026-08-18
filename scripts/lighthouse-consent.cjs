/**
 * Lighthouse opens a fresh page for each URL. Seed a persisted denied analytics
 * choice in the shared browser context first so optional analytics stays
 * unrequested during every audit. Advertising consent is managed by Google's
 * own consent message and is not part of this site-side choice.
 */
module.exports = async (browser, { url }) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem(
      'nocharge:consent',
      JSON.stringify({
        version: 1,
        analytics: false,
        updatedAt: '2026-08-15T00:00:00.000Z',
      }),
    );
  });
  await page.close();
};
