/**
 * Lighthouse opens a fresh page for each URL. Seed a persisted denied optional
 * choice in the shared browser context first so advertising and analytics stay
 * unrequested during every audit.
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
        advertising: false,
        updatedAt: '2026-08-15T00:00:00.000Z',
      }),
    );
  });
  await page.close();
};
