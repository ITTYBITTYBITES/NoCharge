import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const vite = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
  logLevel: 'error',
});

const htmlEntities = (value) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&#x27;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');

function htmlPathForRoute(route) {
  const parts = route.split('/').filter(Boolean);
  return parts.length ? path.join(dist, ...parts, 'index.html') : path.join(dist, 'index.html');
}

function matches(html, pattern) {
  return [...html.matchAll(pattern)];
}

function graphNodes(structuredData, type) {
  const nodes = Array.isArray(structuredData?.['@graph']) ? structuredData['@graph'] : [structuredData];
  return nodes.filter((node) => node && (node['@type'] === type || Array.isArray(node['@type']) && node['@type'].includes(type)));
}

try {
  await vite.ssrLoadModule('/src/content/registry.test.ts');
  const [site, registry, search, assetRegistry, app, setupContent, articlesContent] = await Promise.all([
    vite.ssrLoadModule('/src/site.ts'),
    vite.ssrLoadModule('/src/content/registry.ts'),
    vite.ssrLoadModule('/src/search/index.ts'),
    vite.ssrLoadModule('/src/assets/assetRegistry.ts'),
    vite.ssrLoadModule('/src/App.tsx'),
    vite.ssrLoadModule('/src/content/setupContent.ts'),
    vite.ssrLoadModule('/src/content/articleContent.ts'),
  ]);

  const redirectPlan = JSON.parse(await readFile(path.join(root, 'scripts', 'fixtures', 'content-audit', 'redirect-plan.json'), 'utf8'));
  const pathParityManifest = JSON.parse(await readFile(path.join(root, 'scripts', 'fixtures', 'content-audit', 'v1-live-parity-manifest.json'), 'utf8'));
  assert.equal(redirectPlan.routeDecisions.length, 42, 'the legacy route ledger retains all 16 tools and 26 game guides');
  assert.equal(new Set(redirectPlan.routeDecisions.map((decision) => decision.legacyPath)).size, 42, 'the legacy ledger contains one unique decision per tool or guide route');
  const toolDecisions = redirectPlan.routeDecisions.filter((decision) => decision.contentType === 'tool');
  const guideDecisions = redirectPlan.routeDecisions.filter((decision) => decision.contentType === 'guide');
  assert.equal(toolDecisions.length, 16, 'all 16 legacy tools have explicit URL decisions');
  assert.equal(guideDecisions.length, 26, 'all 26 legacy game-guide URLs remain explicitly reviewed');
  for (const decision of toolDecisions) {
    assert.equal(decision.v2Status, 'published', `${decision.slug} has a published same-path V2 tool`);
    assert.equal(decision.action, 'retain-same-canonical-path', `${decision.slug} retains its canonical route`);
    assert.equal(decision.targetPath, decision.legacyPath, `${decision.slug} has no redirect hop`);
    assert.equal(decision.httpRedirect, null, `${decision.slug} has no HTTP redirect`);
    assert.equal(registry.getPublishedBySlug('tools', decision.slug)?.slug, decision.slug, `${decision.slug} resolves from the V2 tool registry`);
  }
  for (const decision of guideDecisions) {
    assert.equal(decision.v2Status, 'published', `${decision.slug} has a published V2 Arcade replacement`);
    assert.equal(decision.action, 'permanent-redirect-to-canonical-arcade-route', `${decision.slug} maps directly from the old game guide to its canonical Arcade route`);
    assert.equal(decision.targetPath, `/arcade/${decision.slug}/`, `${decision.slug} targets its one-hop canonical Arcade route`);
    assert.equal(decision.httpRedirect, 301, `${decision.slug} proposes one permanent redirect, not a chain`);
    assert.equal(registry.getPublishedBySlug('arcade', decision.slug)?.slug, decision.slug, `${decision.slug} resolves from the published Arcade registry`);
  }
  const proposedRedirects = redirectPlan.permanentRedirects;
  assert.equal(proposedRedirects.length, 59, 'the proposal lists 26 original game-guide redirects plus 33 named Batch 3 path decisions');
  assert.equal(new Set(proposedRedirects.map(({ from }) => from)).size, 59, 'every proposed redirect has a unique exact source path');
  const gameRedirects = proposedRedirects.filter(({ from }) => from.startsWith('/games/'));
  const learnRedirects = proposedRedirects.filter(({ from }) => from.startsWith('/learn/'));
  const dailyRedirects = proposedRedirects.filter(({ from }) => from === '/daily/');
  assert.equal(gameRedirects.length, 26, 'all 26 legacy game detail paths have a specific same-slug Arcade redirect proposal');
  assert.equal(learnRedirects.length, 6, 'six Learn topic paths map to named, directly relevant current V2 articles');
  assert.equal(dailyRedirects.length, 1, 'the single live daily path maps directly to the current Word Loom daily game');
  for (const redirect of gameRedirects) {
    const slug = redirect.from.split('/').filter(Boolean).at(-1);
    assert.equal(redirect.to, `/arcade/${slug}/`, `${redirect.from} maps directly to the same-slug Arcade route`);
    assert.equal(registry.getPublishedBySlug('arcade', slug)?.slug, slug, `${redirect.from} has a published Arcade replacement`);
  }
  const expectedLearnRedirects = {
    '/learn/browser-games-without-accounts/': '/articles/free-browser-games-no-account/',
    '/learn/local-storage-scoring/': '/articles/where-high-scores-go/',
    '/learn/unblocked-vs-no-account/': '/articles/free-browser-games-no-account/',
    '/learn/untimed-play/': '/articles/untimed-puzzle-games-in-the-browser/',
    '/learn/what-is-pass-and-play/': '/articles/two-player-games-one-device/',
    '/learn/what-is-quiet-arcade/': '/articles/what-quiet-arcade-means-at-nocharge/',
  };
  for (const redirect of learnRedirects) assert.equal(redirect.to, expectedLearnRedirects[redirect.from], `${redirect.from} has an individually named topical target`);
  assert.equal(dailyRedirects[0].to, '/arcade/word-loom/', 'the current daily route points directly to the active Word Loom daily game');
  assert.ok(proposedRedirects.every((redirect) => redirect.status === 301 && redirect.decisionStatus === 'approved-not-applied' && !redirect.from.includes('*') && !redirect.from.includes('**')), 'all 59 exact-path 301 decisions are approved but remain inactive');
  assert.equal(redirectPlan.explicitRetirements.length, 19, 'the other 19 paths have explicit no-redirect retirement recommendations');
  assert.equal(new Set(redirectPlan.explicitRetirements.map(({ path: route }) => route)).size, 19, 'each proposed retirement is a unique exact path');
  assert.ok(redirectPlan.explicitRetirements.every((retirement) => retirement.disposition === 'explicit-retirement-no-redirect' && retirement.decisionStatus === 'approved-no-redirect' && retirement.httpOutcome === '410-if-supported-otherwise-normal-404'), 'all 19 retirements are individually approved, documented, and remain non-redirects');
  assert.equal(redirectPlan.summary.samePathPublishedReplacements, 16, 'redirect summary reflects all same-path tool replacements');
  assert.equal(redirectPlan.summary.canonicalArcadeRouteReplacements, 52, '52 game-guide/game paths target their published canonical Arcade routes');
  assert.equal(redirectPlan.summary.additionalLivePathRedirectsProposed, 33, 'the 52-path decision adds 33 exact redirect proposals');
  assert.equal(redirectPlan.summary.explicitRetirementsNoRedirect, 19, 'redirect summary separately counts 19 no-redirect retirements');
  assert.equal(redirectPlan.summary.livePathAccountingUnclassified, 0, 'all 52 previously missing paths now have an individual disposition');
  assert.equal(redirectPlan.summary.deferredNoRedirectRoutes, 0, 'no legacy game-guide route remains deferred after the full rebuild');
  assert.equal(redirectPlan.summary.permanentRedirectsProposed, 59, 'the plan counts all original and new redirect proposals');
  assert.equal(redirectPlan.planStatus, 'approved-plan-not-applied', 'approved route decisions remain inactive until a separate Cloudflare operation');
  assert.deepEqual(redirectPlan.approvalRecord.scope, { exactV2LivePaths: 285, exactPath301Proposals: 59, noRedirectRetirements: 19, totalLivePaths: 363, unclassified: 0 }, 'the approval record covers all 363 live paths');
  assert.equal(pathParityManifest.userApprovalRecord.routeDispositions.redirect301ProposalsApprovedNotApplied, 59, 'the parity manifest records approved inactive 301 decisions');
  assert.equal(pathParityManifest.userApprovalRecord.policies.shop.robots, 'noindex,follow', 'the hidden Shop approval retains noindex');
  assert.equal(pathParityManifest.userApprovalRecord.policies.privacy.robots, 'index,follow', 'the approved Privacy indexing decision is recorded');
  assert.equal(pathParityManifest.userApprovalRecord.policies.terms.robots, 'index,follow', 'the approved Terms indexing decision is recorded');
  assert.equal(pathParityManifest.accounting.livePathsTotal, 363, 'the parity manifest records the complete live path inventory');
  assert.equal(pathParityManifest.accounting.exactV2Routes, 285, 'the parity manifest retains the verified exact-route count');
  assert.equal(pathParityManifest.accounting.proposedRedirectMatches, 59, 'the parity manifest records 59 exact redirect sources');
  assert.equal(pathParityManifest.accounting.explicitRetirementsNoRedirect, 19, 'the parity manifest records the 19 path-specific retirements');
  assert.equal(pathParityManifest.accounting.livePathsTotal, 363, 'the manifest carries the complete unique live sitemap count');
  assert.equal(pathParityManifest.accounting.explicitRetirementsNoRedirect, 19, 'the manifest counts no-redirect retirements as a separate disposition');
  assert.equal(pathParityManifest.accounting.missingUnaccounted, 0, 'no live path remains unclassified');
  assert.deepEqual(pathParityManifest.crawlSummary.v2PathClassificationCounts, {
    'exact-v2-route': 285,
    'proposed-redirect': 59,
    'explicit-retirement-no-redirect': 19,
    'missing-unaccounted': 0,
  }, 'the crawl summary separates explicit retirements from unclassified gaps');
  assert.equal(pathParityManifest.pathDispositionPlan.redirects.length, 33, 'the parity manifest carries each of the 33 new explicit redirect decisions');
  assert.equal(pathParityManifest.pathDispositionPlan.retirements.length, 19, 'the parity manifest carries each proposed retirement separately');
  assert.deepEqual(
    [...pathParityManifest.pathDispositionPlan.retirements.map(({ path: route }) => route)].sort(),
    [...redirectPlan.explicitRetirements.map(({ path: route }) => route)].sort(),
    'the parity manifest and redirect plan agree on every no-redirect retirement path',
  );
  assert.equal(pathParityManifest.pathDispositionPlan.noCatchAll, true, 'the route disposition plan prohibits catch-all redirects');
  assert.match(pathParityManifest.pathDispositionPlan.activationStatus, /NOT ACTIVE/iu, 'the path-disposition plan explicitly records that no redirect rule is active');
  assert.equal(app.pageRouteIdForPath('/advertising/'), 'advertising', 'the public advertising path resolves to its dedicated route component');
  assert.equal(app.pageRouteIdForPath('/advertising'), 'advertising', 'the advertising route resolver normalizes a missing trailing slash');
  assert.ok(site.indexablePaths.includes('/advertising/'), 'the current V2 advertising disclosure remains in the canonical sitemap');
  assert.ok(site.indexablePaths.includes('/privacy/'), 'Privacy is approved for indexing and sitemap inclusion');
  assert.ok(site.indexablePaths.includes('/terms/'), 'Terms is approved for indexing and sitemap inclusion');
  assert.equal(redirectPlan.currentV2Snapshot.publishedDetailRoutes, registry.getPublishedEntries().length, 'redirect ledger is synchronized with the live V2 registry count');
  assert.equal(redirectPlan.currentV2Snapshot.prerenderedPages, site.prerenderPages.length, 'redirect ledger records the current complete prerender route count');
  assert.equal(redirectPlan.currentV2Snapshot.canonicalSitemapUrls, site.indexablePaths.length, 'redirect ledger records the current indexable sitemap count');
  assert.equal(redirectPlan.currentV2Snapshot.livePathsExactV2Route, 285, 'the current audit retains 285 exact live-path matches');
  assert.equal(redirectPlan.currentV2Snapshot.livePathsProposedRedirect, 59, 'the current path ledger contains 59 proposed redirects');
  assert.equal(redirectPlan.currentV2Snapshot.livePathsWithoutRouteOrProposedRedirect, 19, 'the only live paths lacking both a V2 route and redirect are the 19 explicit retirements');
  assert.equal(redirectPlan.currentV2Snapshot.livePathsExplicitlyRetiredNoRedirect, 19, 'the current path ledger separately identifies 19 explicit no-redirect retirements');
  assert.equal(redirectPlan.currentV2Snapshot.livePathsDispositioned, 52, 'all 52 previously unaccounted paths have explicit decisions');
  assert.equal(redirectPlan.currentV2Snapshot.livePathsUnresolved, 0, 'no live path is left undispositioned');
  assert.equal(redirectPlan.currentV2Snapshot.publishedDetailRoutes, 53, 'the published detail-route target is 53');
  assert.equal(redirectPlan.currentV2Snapshot.prerenderedPages, 334, 'the current prerender inventory includes 210 Quiet Setup details, 48 Articles details, and both editorial hubs');
  assert.equal(redirectPlan.currentV2Snapshot.canonicalSitemapUrls, 330, 'the current canonical sitemap includes all approved site and app Privacy and Terms routes and excludes noindex routes');
  assert.equal(redirectPlan.currentV2Snapshot.quietSetupPages, 210, 'the route ledger records all 210 Quiet Setup detail pages');
  assert.equal(redirectPlan.currentV2Snapshot.quietSetupAmazonLinkInstances, 284, 'the route ledger records all 284 preserved Amazon link instances');
  assert.equal(redirectPlan.currentV2Snapshot.quietSetupAmazonSearchUrls, 109, 'the route ledger records 109 distinct Amazon search URLs');
  assert.equal(setupContent.setupArticleCatalog.length, 210, 'the source catalog contains all 195 Amazon-linked and 15 non-Amazon Quiet Setup details');
  assert.equal(site.quietSetupPages.length, 210, 'all 210 Quiet Setup articles receive prerender and SEO records');
  assert.equal(articlesContent.articleCatalogEntries.length, 48, 'the Articles detail catalog contains all 48 imported articles');
  assert.equal(site.articlePrerenderPages.length, 48, 'all 48 Article details receive prerender and SEO records');
  assert.equal(site.editorialHubPages.length, 2, 'Articles and Quiet Setup hubs receive prerender and SEO records');
  assert.equal(app.pageRouteIdForPath('/articles/'), 'articlesHub', 'the Articles hub resolves to its dedicated route');
  assert.equal(app.pageRouteIdForPath('/articles/registry-facts/'), 'articleDetail', 'an Article detail path resolves to its dedicated route');
  assert.equal(app.pageRouteIdForPath('/setup/'), 'setupHub', 'the Quiet Setup hub resolves to its dedicated route');
  assert.equal(app.pageRouteIdForPath('/setup/60-keyboards-and-arrow-key-access/'), 'setupDetail', 'a migrated Quiet Setup path resolves to its dedicated route');
  assert.deepEqual(
    [...redirectPlan.currentV2Snapshot.publishedToolSlugs].sort(),
    registry.getPublishedBySection('tools').map((entry) => entry.slug).sort(),
    'redirect ledger lists every current published tool slug, including the two V2-only tools',
  );
  assert.deepEqual(
    [...redirectPlan.currentV2Snapshot.publishedArcadeSlugs].sort(),
    registry.getPublishedBySection('arcade').map((entry) => entry.slug).sort(),
    'redirect ledger records every currently published Arcade title',
  );
  assert.deepEqual(
    [...redirectPlan.currentV2Snapshot.publishedExperienceSlugs].sort(),
    registry.getPublishedBySection('experiences').map((entry) => entry.slug).sort(),
    'redirect ledger records each static app/release showcase and editorial overview',
  );
  for (const section of registry.CONTENT_SECTIONS) {
    assert.equal(redirectPlan.currentV2Snapshot.publishedCounts[section.id], registry.getPublishedBySection(section.id).length, `redirect ledger has the current ${section.id} count`);
  }

  const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
  const sitemapPaths = [...sitemap.matchAll(/<loc>https:\/\/nocharge\.net([^<]*)<\/loc>/g)].map((match) => match[1]);
  const pathDispositionPages = pathParityManifest.pages.filter((page) => page.pathDisposition);
  const pathRedirectBySource = new Map(redirectPlan.permanentRedirects.map((redirect) => [redirect.from, redirect]));
  assert.equal(pathDispositionPages.length, 52, 'each formerly missing path has an individual disposition in the live-page manifest');
  assert.equal(new Set(pathDispositionPages.map((page) => page.path)).size, 52, 'the 52 individual dispositions use unique live source paths');
  assert.equal(pathParityManifest.pathDispositionPlan.redirects.length + pathParityManifest.pathDispositionPlan.retirements.length, 52, 'per-path redirects and retirements cover the complete 52-path gap');
  assert.deepEqual(
    [...pathParityManifest.accounting.redirectMatches.map(({ from }) => from)].sort(),
    [...redirectPlan.permanentRedirects.map(({ from }) => from)].sort(),
    'the manifest and redirect plan agree on every one of the 59 proposed sources',
  );
  for (const disposition of pathParityManifest.pathDispositionPlan.redirects) {
    const page = pathParityManifest.pages.find((candidate) => candidate.path === disposition.from);
    const planned = pathRedirectBySource.get(disposition.from);
    assert.ok(page && planned, `${disposition.from} appears in the live manifest and proposed redirect plan`);
    assert.equal(page.pathDisposition.type, 'proposed-redirect', `${disposition.from} is classified as a redirect proposal`);
    assert.equal(page.pathDisposition.targetPath, disposition.to, `${disposition.from} has a consistent one-hop target`);
    assert.equal(planned.to, disposition.to, `${disposition.from} target matches the redirect plan`);
    assert.equal(disposition.decisionStatus, 'approved-not-applied', `${disposition.from} is approved but not activated`);
    assert.ok(site.prerenderPaths.includes(disposition.to), `${disposition.from} target is a built V2 route`);
    assert.ok(site.indexablePaths.includes(disposition.to) && sitemapPaths.includes(disposition.to), `${disposition.from} target is canonical and indexable`);
    await access(htmlPathForRoute(disposition.to));
  }
  for (const retirement of pathParityManifest.pathDispositionPlan.retirements) {
    const page = pathParityManifest.pages.find((candidate) => candidate.path === retirement.path);
    assert.ok(page, `${retirement.path} remains in the full live inventory`);
    assert.equal(page.pathDisposition.type, 'explicit-retirement-no-redirect', `${retirement.path} is explicitly marked for retirement`);
    assert.equal(page.pathDisposition.targetPath, null, `${retirement.path} has no substitute redirect destination`);
    assert.equal(retirement.decisionStatus, 'approved-no-redirect', `${retirement.path} retirement is approved with no redirect`);
    assert.equal(retirement.httpOutcome, '410-if-supported-otherwise-normal-404', `${retirement.path} has a specific no-redirect outcome`);
    assert.ok(!site.prerenderPaths.includes(retirement.path), `${retirement.path} is not presented as a V2 route`);
    assert.ok(!pathRedirectBySource.has(retirement.path), `${retirement.path} is not captured by a redirect proposal`);
  }
  assert.equal(pathParityManifest.accounting.exactV2Routes + pathParityManifest.accounting.proposedRedirectMatches + pathParityManifest.accounting.explicitRetirementsNoRedirect, 363, 'exact routes, redirect proposals, and explicit retirements account for every live path');
  assert.equal(sitemapPaths.length, 330, 'the canonical sitemap publishes exactly 330 indexable URLs including all four Android app Privacy and Terms routes');
  assert.equal(site.prerenderPages.length, 334, 'the static build prerenders 334 HTML routes including 210 Quiet Setup details and the full Articles catalog');
  assert.equal(site.publishedContentPages.length, 53, 'all 53 published registry entries receive detail prerenders');
  assert.equal(site.publishedContentPages.length, registry.getPublishedEntries().length, 'every published registry entry automatically creates a detail prerender/SEO route');
  assert.deepEqual(
    new Set(site.publishedContentPages.map((page) => page.path)),
    new Set(registry.getPublishedContentRoutePaths()),
    'detail prerender paths are derived from the published registry rather than a manual route list',
  );
  assert.deepEqual(
    [...sitemapPaths].sort(),
    [...site.indexablePaths].sort(),
    'the sitemap contains exactly the direct canonical paths selected as indexable',
  );
  for (const route of site.indexablePaths) {
    assert.ok(sitemapPaths.includes(route), `published/indexable route ${route} appears in sitemap.xml`);
  }

  const publishedPaths = new Set(site.prerenderPages.map((page) => page.path));
  const prerenderedHtml = new Map();
  const structuredDataByPath = new Map();
  for (const route of site.prerenderPages.map((page) => page.path)) {
    const html = await readFile(htmlPathForRoute(route), 'utf8');
    prerenderedHtml.set(route, html);
    const internalShopAnchors = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/giu)].map(([, href]) => href);
    assert.ok(internalShopAnchors.every((href) => !href.startsWith('/shop/')), `${route} has no active Shop anchor`);
    assert.ok(!html.includes('https://store.nocharge.net'), `${route} has no external store destination`);
    const jsonLdScripts = matches(html, /<script\s+id="structured-data"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/giu);
    assert.ok(jsonLdScripts.length <= 1, `at most one static JSON-LD script is emitted on ${route}`);
    if (jsonLdScripts.length === 1) {
      let structuredData;
      try {
        structuredData = JSON.parse(jsonLdScripts[0][1]);
      } catch (error) {
        assert.fail(`static JSON-LD is valid JSON on ${route}: ${String(error)}`);
      }
      assert.equal(structuredData['@context'], 'https://schema.org', `JSON-LD declares schema.org context on ${route}`);
      structuredDataByPath.set(route, structuredData);
    }
  }

  const articlesHubHtml = prerenderedHtml.get('/articles/');
  const setupHubHtml = prerenderedHtml.get('/setup/');
  assert.ok(articlesHubHtml?.includes('class="articles-page"'), 'the Articles hub renders its imported library');
  assert.ok(setupHubHtml?.includes('class="setup-index"'), 'the Quiet Setup hub renders its imported topic and guide directory');
  assert.ok(setupHubHtml?.includes('href="/setup/feed.xml"'), 'the Quiet Setup hub links to its RSS feed');
  assert.equal(matches(setupHubHtml ?? '', /class="setup-card"/gu).length, 210, 'the Quiet Setup hub lists all 210 detail guides');
  assert.ok(articlesHubHtml?.includes('href="/articles/registry-facts/"'), 'the Articles hub links to the Registry facts article');
  for (const article of articlesContent.articleCatalogEntries) {
    const html = prerenderedHtml.get(article.path);
    assert.ok(html?.includes(`data-article-page="${article.slug}"`), `Article detail is prerendered with its slug: ${article.path}`);
    assert.ok(site.indexablePaths.includes(article.path) && sitemapPaths.includes(article.path), `Article detail is canonical and indexable: ${article.path}`);
    const externalArticleAnchors = [...(html ?? '').matchAll(/<a\b[^>]*href="https?:\/\/[^"]+"/giu)];
    assert.equal(externalArticleAnchors.length, 0, `Article detail has no unapproved third-party outbound anchors: ${article.path}`);
  }
  const nonAmazonSetupHtml = prerenderedHtml.get('/setup/a-low-noise-desk-setup/');
  assert.ok(nonAmazonSetupHtml?.includes('class="setup-article"'), 'the representative non-Amazon Setup detail is rendered');
  assert.ok(!/<a\b[^>]*href="https:\/\/(?:www\.)?amazon\.com\//iu.test(nonAmazonSetupHtml ?? ''), 'the non-Amazon Setup detail contains no Amazon paid link');
  const feedXml = await readFile(path.join(dist, 'setup', 'feed.xml'), 'utf8');
  assert.equal(matches(feedXml, /<item>/gu).length, 210, 'the generated Quiet Setup RSS feed contains all 210 detail guides');
  assert.ok(feedXml.includes('<link>https://nocharge.net/setup/</link>') && feedXml.includes('https://nocharge.net/setup/feed.xml'), 'the RSS channel and self link use canonical URLs');

  const advertisingHtml = prerenderedHtml.get('/advertising/');
  const contactHtml = prerenderedHtml.get('/contact/');
  const privacyHtml = prerenderedHtml.get('/privacy/');
  const termsHtml = prerenderedHtml.get('/terms/');
  assert.ok(advertisingHtml, 'the current V2 advertising disclosure route is prerendered');
  assert.ok(advertisingHtml.includes('data-advertising-status=\"current-v2-no-display-ads\"'), 'the disclosure route identifies the current V2 advertising state');
  assert.ok(advertisingHtml.includes('No display advertising is served in the current V2 build.'), 'the disclosure clearly states that V2 serves no display advertising');
  assert.ok(advertisingHtml.includes('AdSense and H5 Games Ads placements and adapters remain dormant'), 'AdSense and H5 placements are explicitly dormant');
  assert.ok(advertisingHtml.includes('The former non-Amazon affiliate program and its links are no longer used.'), 'the disclosure states that the former non-Amazon program and links are no longer used without naming retired identifiers or merchants');
  assert.ok(advertisingHtml.includes('nocharge-20') && advertisingHtml.includes('sponsored nofollow noopener noreferrer'), 'the active Amazon Associates tag and exact paid-link rel rule are stated');
  assert.ok(advertisingHtml.includes('“(paid link)”'), 'the required visible paid-link label is stated');
  assert.ok(advertisingHtml.includes('As an Amazon Associate I earn from qualifying purchases.'), 'the required Associates statement appears verbatim');
  assert.ok(advertisingHtml.includes('This article contains Amazon affiliate links. If you make a qualifying purchase through one of these links, NoCharge may earn a commission.'), 'the article-level Amazon disclosure appears verbatim');
  assert.ok(!/href="https:\/\/(?:www\.)?amazon\./iu.test(advertisingHtml), 'the disclosure route adds no Amazon outbound link');
  assert.equal(site.getPageSEO('/advertising/').robots, 'index,follow', 'the current advertising disclosure remains indexable');
  assert.ok(site.getPageSEO('/advertising/').description.includes('AdSense and H5 Games Ads remain dormant'), 'advertising SEO metadata describes the current ad state');
  assert.ok(sitemapPaths.includes('/advertising/'), 'the advertising disclosure is present in the generated sitemap');
  assert.ok(contactHtml && privacyHtml && termsHtml, 'Contact, Privacy, and Terms routes are prerendered');
  assert.ok(contactHtml.includes('href="mailto:hello@nocharge.net"') && contactHtml.includes('accessibility-barrier reports only'), 'Contact preserves the public accessibility reporting address for that limited purpose');
  assert.ok(contactHtml.includes('No general contact form or support inbox is live.') && contactHtml.includes('No response time is promised.'), 'Contact does not imply a general support channel or a response guarantee');
  assert.ok(!/does not provide a live contact form or email address/iu.test(contactHtml), 'Contact does not contradict the published Accessibility reporting address');
  assert.ok(privacyHtml.includes('hello@nocharge.net') && privacyHtml.includes('for accessibility-barrier reports only') && privacyHtml.includes('does not provide a general contact form, support inbox, or privacy-request channel'), 'Privacy limits the email address to accessibility-barrier reports and distinguishes it from general support and privacy requests');
  assert.ok(privacyHtml.includes('through your email provider'), 'Privacy explains that sending a report email happens outside in-page game and tool processing');
  assert.ok(!privacyHtml.includes('data-privacy-content-status='), 'Privacy has no obsolete review-required marker');
  assert.ok(privacyHtml.includes('nocharge-theme') && privacyHtml.includes('nocharge-seasonal-mode'), 'Privacy names both browser-local theme preference keys');
  assert.ok(privacyHtml.includes('The current Arcade source does not save game scores in browser storage'), 'Privacy accurately states that V2 game scores are not persisted to localStorage');
  assert.ok(privacyHtml.includes('does not operate a server-side database for Arcade play or tool entries'), 'Privacy states the no-account/no-game-database boundary');
  assert.ok(privacyHtml.includes('no configured third-party analytics provider') && privacyHtml.includes('no unsolicited third-party request when a page is opened'), 'Privacy discloses zero configured analytics and no third-party page-load request');
  assert.ok(!privacyHtml.includes('/shop/') && !privacyHtml.includes('store.nocharge.net') && privacyHtml.includes('Google Play') && privacyHtml.includes('itch.io') && privacyHtml.includes('YouTube player is created only after you press its Play button'), 'Privacy describes click-only Experience destinations without store references');
  assert.ok(!/incomplete|scaffold|approved source text is still required|review-required/iu.test(privacyHtml), 'Privacy contains no obsolete placeholder or review wording');
  assert.equal(site.getPageSEO('/privacy/').robots, 'index,follow', 'Privacy is approved for indexing');
  assert.ok(site.getPageSEO('/privacy/').description.includes('local browser preferences'), 'Privacy SEO metadata describes current browser-storage behavior');
  assert.ok(sitemapPaths.includes('/privacy/'), 'Privacy is included in the sitemap');
  assert.ok(!termsHtml.includes('data-terms-content-status='), 'Terms has no obsolete review-required marker');
  assert.ok(termsHtml.includes('static browser Arcade') && termsHtml.includes('client-side utilities') && termsHtml.includes('Quiet Setup'), 'Terms describes the static Arcade, client-side utilities, and Quiet Setup');
  assert.ok(!termsHtml.includes('/shop/') && !termsHtml.includes('store.nocharge.net') && termsHtml.includes('Experience links'), 'Terms removes the hidden Shop handoff and describes Experience links');
  assert.ok(termsHtml.includes('static showcases') && termsHtml.includes('app-specific legal routes'), 'Terms describes static Experience showcases and separates app-specific policies');
  assert.ok(!/unfinished|scaffold|placeholder|review-required/iu.test(termsHtml), 'Terms contains no obsolete placeholder or review wording');
  assert.equal(site.getPageSEO('/terms/').robots, 'index,follow', 'Terms is approved for indexing');
  assert.ok(site.getPageSEO('/terms/').description.includes('static Experience showcases'), 'Terms SEO metadata describes the current V2 scope');
  assert.ok(sitemapPaths.includes('/terms/'), 'Terms is included in the sitemap');
  assert.equal(app.pageRouteIdForPath('/contact/'), 'contact', 'the Contact route remains a distinct site page');
  assert.ok(site.getPageSEO('/contact/').description.includes('accessibility-barrier reports'), 'Contact SEO describes the limited reporting channel');
  assert.equal(app.pageRouteIdForPath('/privacy/'), 'privacy', 'the public site-wide Privacy path uses the public policy page');
  assert.equal(app.pageRouteIdForPath('/terms/'), 'terms', 'the public site-wide Terms path uses the public policy page');
  assert.equal(app.pageRouteIdForPath('/privacy/coosjoint/'), 'appLegal', 'the app-specific Google Play Privacy route remains separate');
  assert.equal(app.pageRouteIdForPath('/terms/coosjoint/'), 'appLegal', 'the app-specific Google Play Terms route remains separate');

  const parityManifest = JSON.parse(await readFile(path.join(root, 'scripts', 'fixtures', 'content-audit', 'v1-live-parity-manifest.json'), 'utf8'));
  const setupEvidencePages = parityManifest.pages.filter((page) => page.path.startsWith('/setup/') && page.hasAmazonLink);
  assert.equal(setupEvidencePages.length, 195, 'the audited live scope has 195 Amazon-linked Quiet Setup articles');
  const setupAmazonHrefs = new Set();
  let setupAmazonAnchorCount = 0;
  for (const evidence of setupEvidencePages) {
    const slug = evidence.path.split('/').filter(Boolean).at(-1);
    const article = await setupContent.loadSetupArticle(slug);
    assert.ok(article, `source content is migrated for ${evidence.path}`);
    assert.equal(article.path, evidence.path, `migrated content retains the exact path ${evidence.path}`);
    const html = prerenderedHtml.get(evidence.path);
    assert.ok(html, `Quiet Setup route is prerendered: ${evidence.path}`);
    assert.ok(site.indexablePaths.includes(evidence.path) && sitemapPaths.includes(evidence.path), `Quiet Setup route is indexable and in the sitemap: ${evidence.path}`);
    const articleHtml = html.match(/<article\b[^>]*class="[^"]*\bsetup-article\b[^"]*"[^>]*>[\s\S]*?<\/article>/u)?.[0];
    assert.ok(articleHtml, `semantic Setup article is rendered as static HTML: ${evidence.path}`);
    const amazonAnchors = [...articleHtml.matchAll(/<a\b[^>]*\bhref="(https:\/\/www\.amazon\.com\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/giu)];
    assert.equal(amazonAnchors.length, evidence.amazonLinks.length, `all Amazon links are present on ${evidence.path}`);
    assert.ok(articleHtml.includes('data-affiliate-disclosure="true"') && articleHtml.includes('data-disclosure-networks="amazon"'), `Amazon-only article disclosure is retained on ${evidence.path}`);
    assert.ok(!/\bdata-[a-z0-9-]*-merchants(?:=|\s|>)/iu.test(articleHtml), `Quiet Setup carries no retired merchant metadata on ${evidence.path}`);
    const statementIndex = articleHtml.indexOf('As an Amazon Associate I earn from qualifying purchases.');
    const firstAmazonLinkIndex = articleHtml.indexOf('href="https://www.amazon.com/');
    assert.ok(statementIndex >= 0 && firstAmazonLinkIndex > statementIndex, `the Associates statement precedes the first Amazon link on ${evidence.path}`);
    assert.ok(!/<(?:script|iframe)\b/iu.test(articleHtml), `the article has no embedded third-party runtime on ${evidence.path}`);
    assert.ok(!/<source\b/iu.test(articleHtml), `the article has no unmirrored responsive-image source on ${evidence.path}`);
    const externalAnchors = [...articleHtml.matchAll(/<a\b[^>]*\bhref="(https?:\/\/[^"]+)"/giu)];
    assert.equal(externalAnchors.length, amazonAnchors.length, `Amazon links are the only external anchors in ${evidence.path}`);
    for (let index = 0; index < amazonAnchors.length; index += 1) {
      const [anchor, rawHref, rawText] = amazonAnchors[index];
      const expected = evidence.amazonLinks[index];
      const href = htmlEntities(rawHref);
      const text = htmlEntities(rawText.replace(/<[^>]*>/gu, ' ').replace(/\s+/gu, ' ').trim());
      const readAttribute = (name) => anchor.match(new RegExp(`\\b${name}="([^"]*)"`, 'u'))?.[1] ?? null;
      assert.equal(href, expected.href, `exact Amazon URL/tag is preserved on ${evidence.path}`);
      assert.equal(text, expected.text, `paid-link label is preserved on ${evidence.path}`);
      assert.equal(readAttribute('target'), '_blank', `Amazon link opens in a new tab on ${evidence.path}`);
      assert.equal(readAttribute('rel'), 'sponsored nofollow noopener noreferrer', `Amazon link rel is exact on ${evidence.path}`);
      assert.ok(/\bdata-amazon-paid-link(?:=|\s|>)/u.test(anchor), `Amazon paid-link marker is retained on ${evidence.path}`);
      assert.ok(href.includes('tag=nocharge-20'), `the Associates tag is retained on ${evidence.path}`);
      setupAmazonHrefs.add(href);
      setupAmazonAnchorCount += 1;
    }
  }
  assert.equal(setupAmazonAnchorCount, 284, 'the migration preserves exactly 284 Amazon link instances');
  assert.equal(setupAmazonHrefs.size, 109, 'the migration preserves exactly 109 distinct Amazon search URLs');
  for (const setupEntry of setupContent.setupArticleCatalog) {
    const sourceArticle = await setupContent.loadSetupArticle(setupEntry.slug);
    const renderedArticle = prerenderedHtml.get(setupEntry.path);
    assert.ok(sourceArticle && renderedArticle, `Quiet Setup source and prerender exist for ${setupEntry.path}`);
    assert.ok(!/\bdata-[a-z0-9-]*-merchants(?:=|\s|>)/iu.test(JSON.stringify(sourceArticle)), `Quiet Setup source contains no retired merchant metadata: ${setupEntry.path}`);
    assert.ok(!/\bdata-[a-z0-9-]*-merchants(?:=|\s|>)/iu.test(renderedArticle), `Quiet Setup HTML contains no retired merchant metadata: ${setupEntry.path}`);
    const externalSetupAnchors = [...renderedArticle.matchAll(/<a\b[^>]*\bhref="(https?:\/\/[^"]+)"/giu)];
    assert.ok(externalSetupAnchors.every(([, href]) => /^https:\/\/(?:www\.)?amazon\.com\//iu.test(htmlEntities(href))), `Quiet Setup external links are Amazon-only after retirement cleanup: ${setupEntry.path}`);
  }

  assert.ok(contactHtml && privacyHtml && termsHtml, 'the site-wide Contact, Privacy, and Terms pages remain prerendered');

  const advertisingFooterAnchor = new RegExp('<a[^>]*href="/advertising/"[^>]*>Advertising Disclosure</a>', 'u');
  const disclosureNavigation = site.footerNavigation.find(({ to }) => to === '/advertising/');
  assert.deepEqual(disclosureNavigation, { label: 'Advertising Disclosure', to: '/advertising/' }, 'footer navigation exposes a clean advertising-disclosure link');
  assert.ok(advertisingFooterAnchor.test(advertisingHtml), 'server-rendered legal/footer navigation links to the advertising route');
  assert.ok(advertisingFooterAnchor.test(privacyHtml), 'privacy route retains the same legal/footer navigation link');
  assert.ok(advertisingFooterAnchor.test(termsHtml), 'terms route retains the same legal/footer navigation link');

  const uniqueTitles = new Set();
  const uniqueDescriptions = new Set();
  const uniqueCanonicals = new Set();
  for (const page of site.publishedContentPages) {
    const html = prerenderedHtml.get(page.path);
    assert.ok(html, `published detail HTML exists for ${page.path}`);
    const pageTitles = matches(html, /<title>([\s\S]*?)<\/title>/giu);
    const pageDescriptions = matches(html, /<meta\s+name="description"\s+content="([^"]*)"\s*\/?\s*>/giu);
    const pageCanonicals = matches(html, /<link\s+rel="canonical"\s+href="([^"]*)"\s*\/?\s*>/giu);
    assert.equal(pageTitles.length, 1, `published route has exactly one title: ${page.path}`);
    assert.equal(pageDescriptions.length, 1, `published route has exactly one description: ${page.path}`);
    assert.equal(pageCanonicals.length, 1, `published route has exactly one canonical: ${page.path}`);
    assert.equal(htmlEntities(pageTitles[0][1]), page.seo.title, `static detail title matches registry metadata for ${page.path}`);
    assert.equal(htmlEntities(pageDescriptions[0][1]), page.seo.description, `static description matches registry metadata for ${page.path}`);
    assert.equal(htmlEntities(pageCanonicals[0][1]), `https://nocharge.net${page.path}`, `canonical points directly to the trailing-slash route for ${page.path}`);
    assert.ok(page.path === '/' || page.path.endsWith('/'), `published route follows the trailing-slash convention: ${page.path}`);
    assert.ok(!uniqueTitles.has(page.seo.title), `published title is unique: ${page.path}`);
    assert.ok(!uniqueDescriptions.has(page.seo.description), `published description is unique: ${page.path}`);
    assert.ok(!uniqueCanonicals.has(page.seo.canonical), `published canonical is unique: ${page.path}`);
    uniqueTitles.add(page.seo.title);
    uniqueDescriptions.add(page.seo.description);
    uniqueCanonicals.add(page.seo.canonical);

    const robots = matches(html, /<meta\s+name="robots"\s+content="([^"]*)"\s*\/?\s*>/giu);
    assert.equal(robots.length, 1, `published route has exactly one robots directive: ${page.path}`);
    assert.equal(robots[0][1], 'index,follow', `published route is indexable: ${page.path}`);
    assert.ok(!/name="robots"[^>]*\bnoindex\b/iu.test(html), `published route has no noindex conflict: ${page.path}`);

    const [contentSection, contentSlug] = page.path.split('/').filter(Boolean);
    const entry = registry.getPublishedBySlug(contentSection, contentSlug);
    const structuredData = structuredDataByPath.get(page.path);
    assert.ok(entry && structuredData, `published detail has registry content and valid JSON-LD: ${page.path}`);
    if (entry.kind === 'tool') {
      const webpage = graphNodes(structuredData, 'WebPage')[0];
      const application = graphNodes(structuredData, 'WebApplication')[0];
      const faqPage = graphNodes(structuredData, 'FAQPage')[0];
      assert.ok(webpage && application && faqPage, `tool JSON-LD links a page, a web application, and its FAQ: ${page.path}`);
      assert.equal(webpage.description, entry.summary, `tool WebPage description matches the visible summary: ${page.path}`);
      assert.equal(application.name, entry.title, `tool application name matches the visible title: ${page.path}`);
      assert.equal(application.description, entry.summary, `tool application description matches visible copy: ${page.path}`);
      assert.equal(application.applicationCategory, entry.category, `tool category derives from the published registry: ${page.path}`);
      assert.equal(application.operatingSystem, 'Web browser', `tool execution environment is explicit: ${page.path}`);
      assert.deepEqual(application.keywords, [...entry.tags], `tool keywords match the visible tag list: ${page.path}`);
      assert.equal(application.url, `https://nocharge.net${page.path}`, `tool application URL matches its canonical route: ${page.path}`);
      assert.deepEqual(
        faqPage.mainEntity.map((question) => [question.name, question.acceptedAnswer.text]),
        entry.faq.map((item) => [item.question, item.answer]),
        `tool FAQ structured data matches the visible registry answers: ${page.path}`,
      );
      assert.ok(!('aggregateRating' in application) && !('review' in application) && !('offers' in application), `tool schema does not invent ratings, reviews, or offers: ${page.path}`);
      assert.ok(html.includes('<dl class="tool-documentation__faq">'), `tool questions and answers use a semantic definition list: ${page.path}`);
    } else if (entry.kind === 'guide') {
      const webpage = graphNodes(structuredData, 'WebPage')[0];
      const article = graphNodes(structuredData, 'Article')[0];
      assert.ok(webpage && article, `guide JSON-LD links a WebPage to an Article: ${page.path}`);
      assert.equal(article.headline, entry.title, `guide headline matches the visible title: ${page.path}`);
      assert.equal(article.description, entry.summary, `guide description matches the visible summary: ${page.path}`);
      assert.equal(article.datePublished, entry.publishedAt, `guide publication date matches visible metadata: ${page.path}`);
      assert.equal(article.dateModified, entry.updatedAt, `guide updated date matches visible metadata: ${page.path}`);
      assert.equal(article.articleSection, entry.category, `guide section label matches visible metadata: ${page.path}`);
      assert.deepEqual(article.keywords, [...entry.tags], `guide keywords match visible tags: ${page.path}`);
      assert.equal(article.author['@id'], 'https://nocharge.net/#organization', `guide author resolves to the NoCharge entity: ${page.path}`);
      assert.ok(html.includes('By NoCharge'), `guide authorship is visible on the page: ${page.path}`);
    } else if (entry.kind === 'arcade') {
      assert.equal(structuredData['@type'], 'VideoGame', `Arcade schema remains on its existing type: ${page.path}`);
    } else if (entry.kind === 'experience') {
      const webpage = graphNodes(structuredData, 'WebPage')[0];
      const faqPage = graphNodes(structuredData, 'FAQPage')[0];
      const androidApp = entry.presentation === 'editorial-mini-site' || entry.presentation === 'showcase' && Boolean(entry.googlePlayUrl);
      const applicationType = androidApp ? 'SoftwareApplication' : 'WebApplication';
      const application = graphNodes(structuredData, applicationType)[0];
      assert.ok(webpage && application && faqPage, `Experience JSON-LD links a WebPage, matching application entity, and FAQ: ${page.path}`);
      assert.equal(webpage.description, entry.summary, `Experience WebPage description matches visible summary: ${page.path}`);
      assert.equal(application.name, entry.title, `Experience application name matches visible title: ${page.path}`);
      assert.equal(application.description, entry.summary, `Experience application description matches visible summary: ${page.path}`);
      assert.equal(application.applicationCategory, entry.category, `Experience application category matches registry metadata: ${page.path}`);
      assert.deepEqual(application.keywords, [...entry.tags], `Experience keywords match registry tags: ${page.path}`);
      assert.deepEqual(application.featureList, [...entry.documentation.keyFeatures], `Experience schema features match authored documentation: ${page.path}`);
      assert.deepEqual(
        faqPage.mainEntity.map((question) => [question.name, question.acceptedAnswer.text]),
        entry.documentation.faq.map((item) => [item.question, item.answer]),
        `Experience FAQ schema matches its authored answers: ${page.path}`,
      );
      assert.ok(!('offers' in application) && !('aggregateRating' in application), `Experience schema invents no price, rating, or store offer: ${page.path}`);
      if (entry.presentation === 'editorial-mini-site') {
        assert.equal(application.operatingSystem, 'Android', `product SoftwareApplication uses the publisher-described platform: ${page.path}`);
        assert.equal(application.url, entry.productWebsiteUrl, `product SoftwareApplication points only to its official site: ${page.path}`);
        assert.deepEqual(application.sameAs, [entry.productWebsiteUrl], `product application schema exposes no store or third-party links: ${page.path}`);
        assert.equal(application.publisher.name, 'ITTYBITTYBITES', `product schema names the listing publisher without assigning NoCharge authorship: ${page.path}`);
        assert.ok(!('isAccessibleForFree' in application), `product pricing/accessibility is not inferred from the editorial page: ${page.path}`);
        for (const heading of ['Direct answer', 'Overview', 'Described features', 'Workflows and decisions', 'Use cases', 'A look at the product', 'Platform, availability, and what to verify', 'Frequently asked questions', 'Companion Guides &amp; Tools']) {
          assert.ok(html.includes(heading), `static product mini-site is prerendered in static HTML (${heading}): ${page.path}`);
        }
        assert.ok(html.includes('data-editorial-experience="true"'), `product detail uses a static editorial mini-site shell: ${page.path}`);
        assert.ok(!html.includes('interactive-viewport') && !html.includes('data-demo='), `static product route contains no demo shell or runtime: ${page.path}`);
        assert.ok(!html.includes('experience-detail-after-interaction'), `static product route contains no post-demo ad reservation: ${page.path}`);
        assert.ok(/<img\b[^>]*loading="lazy"[^>]*data-/u.test(html) || /<img\b[^>]*loading="lazy"/u.test(html), `static product artwork is emitted as lazy-loaded local images: ${page.path}`);
        const articleHtml = html.match(/<article\b[^>]*data-static-experience-route=[\s\S]*?<\/article>/u)?.[0] ?? '';
        assert.ok(articleHtml, `static product route has a semantic mini-site article: ${page.path}`);
        const hrefs = [...articleHtml.matchAll(/\bhref="([^"]+)"/gu)].map((match) => htmlEntities(match[1]));
        assert.ok(hrefs.includes(entry.productWebsiteUrl), `static page links directly to its one official product site: ${page.path}`);
        assert.ok(hrefs.every((href) => href.startsWith('/') && !href.startsWith('/shop/') || href === entry.productWebsiteUrl), `static page links only to official product and internal NoCharge resources, never Shop or stores: ${page.path}`);
        assert.ok(!hrefs.some((href) => /play\.google|apps\.apple|\/shop\/|\bdownload\b/iu.test(href)), `static page has no store, download, or Shop destinations: ${page.path}`);
        const imageAssets = entry.documentation.artwork;
        assert.equal(imageAssets.length, page.path.includes('profivue') ? 3 : 2, `static product mini-site has its scoped local artwork count: ${page.path}`);
        for (const image of imageAssets) {
          assert.ok(html.includes(`data-asset-id="${image.manifestAssetId}"`) && html.includes(`data-runtime-asset-id="${image.runtimeManifestAssetId}"`), `${image.manifestAssetId} and its derivative ID appear in the rendered figure: ${page.path}`);
          assert.ok(image.src.startsWith('/assets/'), `${image.manifestAssetId} resolves to a Vite-local emitted asset URL`);
          assert.ok(html.includes(image.src), `${image.manifestAssetId} local optimized image URL is present in static HTML`);
        }
      } else if (entry.presentation === 'showcase') {
        const androidApp = Boolean(entry.googlePlayUrl);
        assert.equal(application.operatingSystem, androidApp ? 'Android' : 'Web browser', `showcase schema reflects the verified app or browser-project platform: ${page.path}`);
        assert.equal(application.url, entry.googlePlayUrl ?? entry.itchIoUrl ?? `https://nocharge.net${page.path}`, `showcase schema points to its verified external release destination: ${page.path}`);
        const expectedSameAs = [entry.productWebsiteUrl, entry.googlePlayUrl, entry.itchIoUrl, entry.facebookUrl].filter(Boolean);
        assert.deepEqual(application.sameAs, expectedSameAs, `showcase schema contains only approved product, release, and social destinations: ${page.path}`);
        if (entry.slug === 'coosjoint') {
          const videoGame = graphNodes(structuredData, 'VideoGame')[0];
          assert.ok(videoGame && videoGame['@id'] === application['@id'], 'Coo’s Joint VideoGame JSON-LD uses the same app entity');
          assert.deepEqual(videoGame.sameAs, expectedSameAs, 'Coo’s Joint VideoGame sameAs includes the verified Facebook profile');
        }
        if (entry.facebookUrl) {
          const facebookLink = html.match(/<a\b(?=[^>]*\bdata-facebook-link="coosjoint")[^>]*>/u)?.[0];
          assert.ok(facebookLink, 'Coo’s Joint Facebook destination is a prerendered static anchor');
          assert.ok(facebookLink.includes(`href="${entry.facebookUrl}"`) && facebookLink.includes('target="_blank"')
            && facebookLink.includes('rel="noopener noreferrer"'), 'Coo’s Joint Facebook anchor has the exact URL and safe outbound-link attributes');
        } else {
          assert.ok(!html.includes('data-facebook-link='), `no other showcase receives the Coo’s Joint Facebook link: ${page.path}`);
        }
        assert.equal(application.publisher.name, 'ITTYBITTYBITES', `showcase schema names the publisher rather than NoCharge as creator: ${page.path}`);
        assert.ok(!('isAccessibleForFree' in application), `showcase schema makes no unsupported free-access claim: ${page.path}`);
        assert.ok(html.includes('data-experience-showcase=') && html.includes('data-nocharge-demo="absent"'), `static showcase is clearly identified without a local demo: ${page.path}`);
        assert.ok(!html.includes('interactive-viewport') && !html.includes('data-demo=') && !html.includes('interactive-module')
          && !html.includes('detail-instructions') && !html.includes('data-ad-slot='), `static showcase has no local demo runtime or ad reservation: ${page.path}`);
        for (const heading of ['Overview', 'What the publisher describes', 'Platform &amp; Availability', 'FAQ']) {
          assert.ok(html.includes(heading), `static showcase documentation is prerendered (${heading}): ${page.path}`);
        }
        if (entry.appLegalSlug) {
          assert.ok(html.includes(`/privacy/${entry.appLegalSlug}/`) && html.includes(`/terms/${entry.appLegalSlug}/`), `app showcase links to its matching privacy and terms routes: ${page.path}`);
          assert.ok(html.includes('data-legal-status="source-provided"'), `app showcase exposes the published legal status: ${page.path}`);
        } else {
          assert.equal(entry.slug, 'barn-road-chronicles', `only BRC has no Android app policy route: ${page.path}`);
          assert.ok(!html.includes('/privacy/barn-road-chronicles/') && !html.includes('/terms/barn-road-chronicles/'), 'BRC does not create a Google Play legal route');
        }
        assert.ok(!/<iframe\b/iu.test(html), `static showcase does not prerender a remote video or game iframe: ${page.path}`);
        if (entry.youtubeTrailers?.length) {
          assert.ok(html.includes('data-trailer-click-only="true"'), `official trailer requires a click before its remote iframe is created: ${page.path}`);
          assert.ok(!/youtube(?:-nocookie)?\.com|ytimg\.com/iu.test(html), `static showcase makes no initial YouTube request: ${page.path}`);
          assert.equal(entry.youtubeTrailers.length, 1, `only one approved trailer appears on the product showcase: ${page.path}`);
        } else {
          assert.equal(entry.slug, 'barn-road-chronicles', `only BRC has no approved YouTube trailer: ${page.path}`);
        }
        const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gu)].map((match) => htmlEntities(match[1]));
        const externalHrefs = hrefs.filter((href) => href.startsWith('https://'));
        assert.deepEqual(externalHrefs, expectedSameAs, `static showcase renders no unapproved external destination: ${page.path}`);
      } else {
        assert.equal(application.operatingSystem, 'Web browser', `locally authored Experience schema describes browser delivery: ${page.path}`);
        assert.equal(application.url, `https://nocharge.net${page.path}`, `interactive Experience application URL matches its canonical route: ${page.path}`);
        assert.ok(html.includes('interactive-viewport'), `local interactive Experience has a prerendered module shell: ${page.path}`);
        assert.ok(html.includes('data-ad-slot="experience-detail-after-interaction"'), `local Experience keeps its approved post-interaction ad reservation: ${page.path}`);
        assert.ok(!html.includes('data-youtube-trailer='), `an interactive Experience has no app trailer: ${page.path}`);
      }
    }

    const mainContent = html.match(/<main id="main-content"[^>]*>([\s\S]*?)<\/main>/iu)?.[1] ?? '';
    const headings = matches(mainContent, /<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/giu).map((match) => Number(match[1]));
    assert.ok(headings.length > 0 && headings[0] === 1, `published route begins its main-content hierarchy with an h1: ${page.path}`);
    assert.equal(headings.filter((level) => level === 1).length, 1, `published route has exactly one h1: ${page.path}`);
    let previousLevel = 0;
    for (const level of headings) {
      assert.ok(level <= previousLevel + 1, `heading levels do not skip in ${page.path} (h${previousLevel} to h${level})`);
      previousLevel = level;
    }

    if (page.path.startsWith('/arcade/')) {
      for (const heading of ['How to Play', 'Controls', 'Rules &amp; Scoring', 'Tips', 'Related Guides &amp; Tools']) {
        assert.ok(html.includes(heading), `Arcade documentation is prerendered in static HTML (${heading}): ${page.path}`);
      }
      assert.ok(html.includes('data-arcade-runtime-contract="nocharge-arcade-v1"'), `Arcade viewport publishes its typed runtime contract: ${page.path}`);
      assert.ok(html.includes('data-h5-adapter-status="inactive"'), `Arcade H5 adapter remains dormant in static HTML: ${page.path}`);
    }
    if (page.path.startsWith('/tools/')) {
      for (const heading of ['How It Works', 'Worked Example', 'Common Pitfalls / FAQ', 'Related Guides &amp; Tools']) {
        assert.ok(html.includes(heading), `tool documentation is visible in static HTML (${heading}): ${page.path}`);
      }
    }
    if (page.path.startsWith('/guides/')) {
      assert.ok(html.includes('guide-article-body'), `guide sections are rendered as static HTML: ${page.path}`);
      assert.ok(matches(html, /<section\b[^>]*id="[^"]+"/giu).length >= 4, `published guide has structured static sections: ${page.path}`);
    }
  }

  const appLegalSlugs = ['coosjoint', 'twosecondwitness', 'profivue', 'rideside'];
  for (const slug of appLegalSlugs) {
    for (const kind of ['privacy', 'terms']) {
      const route = `/${kind}/${slug}/`;
      const html = prerenderedHtml.get(route);
      assert.ok(html, `${slug} ${kind} source route is prerendered`);
      assert.ok(html.includes(`data-app-legal-route="${slug}"`) && html.includes(`data-app-legal-kind="${kind}"`), `${slug} ${kind} route is rendered by the app-specific legal page`);
      assert.ok(html.includes(`data-experience-theme="${slug}"`), `${slug} ${kind} route uses its matching per-app visual theme`);
      assert.ok(html.includes(`https://nocharge.net${route}`), `${slug} ${kind} route has a direct canonical URL`);
      assert.ok(html.includes('data-app-legal-status="source-provided"'), `${slug} ${kind} publishes a complete app policy`);
      assert.ok(html.includes('content="index,follow"'), `${slug} ${kind} is indexable for Google Play and search`);
      assert.equal(site.getPageSEO(route).robots, 'index,follow', `${slug} ${kind} SEO status matches the policy record`);
      const policyArticle = html.match(/<article\b[^>]*data-app-legal-route=[\s\S]*?<\/article>/u)?.[0] ?? '';
      assert.ok(!policyArticle.includes('data-app-legal-draft-warning') && !/\[[A-Za-z][^\]]*\]/u.test(policyArticle), `${slug} ${kind} contains no draft stub or unresolved bracket placeholders`);
      assert.ok(html.includes('data-app-legal-source-link=') && html.includes('supplied by the app publisher') && !html.includes('not independently verified'), `${slug} ${kind} page attributes its policy text without stale review-required wording`);
      assert.ok(sitemapPaths.includes(route), `${slug} ${kind} policy route is included in sitemap.xml`);
    }
  }
  assert.equal(site.prerenderPages.filter((page) => /^(?:\/privacy|\/terms)\/(?:coosjoint|twosecondwitness|profivue|rideside)\/$/u.test(page.path)).length, 8, 'only four app-specific policy pairs are prerendered');
  assert.ok(!site.prerenderPages.some((page) => /^(?:\/privacy|\/terms)\/barn-road-chronicles\/$/u.test(page.path)), 'BRC has no Play Store policy route');

  const homeStructuredData = structuredDataByPath.get('/');
  const organization = graphNodes(homeStructuredData, 'Organization')[0];
  const website = graphNodes(homeStructuredData, 'WebSite')[0];
  const homeHtml = prerenderedHtml.get('/');
  assert.ok(organization && website && homeHtml, 'homepage exposes explicit organization and website entities');
  assert.equal(organization.name, 'NoCharge', 'organization name matches the visible site brand');
  assert.equal(organization.url, 'https://nocharge.net/', 'organization identity resolves to the canonical homepage');
  assert.equal(website.publisher['@id'], organization['@id'], 'WebSite publisher is linked to the NoCharge organization entity');
  assert.ok(homeHtml.includes('NoCharge brings together browser games, product and game showcases, practical local-first tools, and useful guides.'), 'homepage visibly explains the NoCharge entity and its scope');

  for (const sectionId of ['tools', 'guides']) {
    const section = registry.CONTENT_SECTIONS.find((candidate) => candidate.id === sectionId);
    const directoryData = section && structuredDataByPath.get(section.path);
    const entries = registry.getPublishedBySection(sectionId);
    const itemList = directoryData?.mainEntity;
    assert.ok(directoryData && itemList, `${sectionId} directory has registry-derived collection JSON-LD`);
    assert.equal(directoryData['@type'], 'CollectionPage', `${sectionId} directory retains CollectionPage semantics`);
    assert.equal(itemList['@type'], 'ItemList', `${sectionId} directory collection uses an ItemList`);
    assert.equal(itemList.numberOfItems, entries.length, `${sectionId} item count is derived from published registry entries`);
    assert.deepEqual(
      itemList.itemListElement.map((listItem) => listItem.item.url).sort(),
      entries.map((entry) => `https://nocharge.net${registry.getContentPath(entry)}`).sort(),
      `${sectionId} ItemList includes only published canonical detail URLs`,
    );
  }

  for (const section of registry.CONTENT_SECTIONS) {
    const html = prerenderedHtml.get(section.path);
    assert.ok(html, `section directory is prerendered: ${section.path}`);
    const visibleHtml = htmlEntities(html);
    for (const entry of registry.getPublishedBySection(section.id)) {
      assert.ok(visibleHtml.includes(entry.title), `section directory ${section.path} includes published ${entry.title}`);
    }
  }

  const discoverHtml = prerenderedHtml.get('/discover/');
  const toolsHtml = prerenderedHtml.get('/tools/');
  const guidesHtml = prerenderedHtml.get('/guides/');
  assert.ok(discoverHtml && toolsHtml && guidesHtml, 'published directories are available for gating checks');
  const visibleDiscoverHtml = htmlEntities(discoverHtml);
  const visibleToolsHtml = htmlEntities(toolsHtml);
  const visibleGuidesHtml = htmlEntities(guidesHtml);
  for (const entry of registry.getPublishedEntries()) {
    assert.ok(visibleDiscoverHtml.includes(entry.title), `Discover includes the published entry ${entry.title}`);
  }
  for (const entry of registry.getPublishedBySection('tools')) {
    assert.ok(visibleToolsHtml.includes(entry.title), `Tools directory includes the published tool ${entry.title}`);
  }
  for (const entry of registry.getPublishedBySection('guides')) {
    assert.ok(visibleGuidesHtml.includes(entry.title), `Guides directory includes the published guide ${entry.title}`);
  }

  const iconTools = registry.getPublishedBySection('tools').filter((entry) => typeof entry.assetIconId === 'string');
  assert.equal(iconTools.length, 10, 'ten published Phase 3B tools receive explicitly mapped Batch 02 artwork');
  for (const entry of iconTools) {
    const asset = assetRegistry.approvedAssetIcons[entry.assetIconId];
    const detailHtml = prerenderedHtml.get(`/tools/${entry.slug}/`);
    assert.ok(asset && detailHtml, `${entry.slug} has a resolved icon and prerendered detail page`);
    assert.ok(toolsHtml.includes(`class="adaptive-icon catalog-card__icon"`), `Tools cards expose the semantic icon slot`);
    assert.ok(toolsHtml.includes(`data-icon-id="${entry.assetIconId}"`), `${entry.slug} icon appears on the published Tools directory card`);
    assert.ok(toolsHtml.includes(`data-asset-id="${asset.manifestAssetId}"`), `${entry.slug} card icon traces to its manifest asset`);
    assert.ok(detailHtml.includes(`class="adaptive-icon detail-header__title-icon"`), `${entry.slug} detail heading exposes the semantic icon slot`);
    assert.ok(detailHtml.includes(`data-icon-id="${entry.assetIconId}"`), `${entry.slug} icon appears on its published detail route`);
    assert.ok(detailHtml.includes(`data-asset-id="${asset.manifestAssetId}"`), `${entry.slug} detail icon traces to its manifest asset`);
  }

  assert.equal(site.publishedContentPages.length, 53, 'all current published registry records receive detail routes');
  assert.ok(site.publishedContentPages.some((page) => page.path === '/arcade/simon/'), 'the approved Simon pilot receives a prerendered detail route');
  for (const slug of [
    'lights-out', 'last-token', 'hangman', 'tic-tac-toe', 'four-in-a-row', 'twenty-forty-eight', 'word-loom',
    'beacon-lattice', 'checkers', 'color-flip', 'dots-and-boxes', 'freecell', 'gomoku', 'klondike', 'memory-match',
    'minesweeper', 'mini-sudoku', 'nine-mens-morris', 'nonogram', 'pass-the-picture', 'reversi', 'sudoku-9x9',
    'tile-garden', 'word-search', 'word-tile-rush',
  ]) {
    assert.ok(site.publishedContentPages.some((page) => page.path === `/arcade/${slug}/`), `${slug} receives a prerendered Arcade detail route`);
  }
  assert.ok(!sitemap.includes('test-draft-private-record'), 'test draft fixture never enters sitemap');
  assert.ok(!sitemap.includes('test-archived-private-record'), 'test archived fixture never enters sitemap');
  assert.ok(!sitemap.includes('test-short-tool-draft'), 'a short unpublished tool never enters sitemap');
  assert.ok(!site.publishedContentPages.some((page) => page.path.includes('test-draft') || page.path.includes('test-archived')), 'unpublished test fixtures never enter static route generation');
  assert.ok(!search.searchIndex.some((document) => document.id.includes('test-') || document.title.includes('Secret')), 'unpublished fixtures do not enter the public search index');

  const searchHtml = prerenderedHtml.get('/search/');
  assert.ok(searchHtml, 'search page is prerendered');
  assert.ok(searchHtml.includes('name="robots" content="noindex,follow"'), 'query search page remains noindex');
  assert.ok(!sitemapPaths.includes('/search/'), 'search is excluded from sitemap');
  const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
  assert.ok(robots.includes('Allow: /'), 'robots allows crawling of public routes');
  assert.ok(robots.includes('Sitemap: https://nocharge.net/sitemap.xml'), 'robots points directly to the generated sitemap');
  assert.ok(!/draft|archived|private/iu.test(robots), 'robots does not advertise unpublished content paths');

  const routeHtml = new Map(prerenderedHtml);
  const brokenLinks = [];
  const missingFragments = [];
  const nonCanonicalLinks = [];
  for (const [sourceRoute, html] of routeHtml) {
    const anchors = matches(html, /<a\b[^>]*\bhref="([^"]*)"[^>]*>/giu);
    for (const anchor of anchors) {
      const href = htmlEntities(anchor[1]).trim();
      if (!href || /^(?:mailto:|tel:|sms:|javascript:|data:)/iu.test(href)) continue;
      let url;
      try {
        url = new URL(href, `https://nocharge.net${sourceRoute}`);
      } catch {
        brokenLinks.push(`${sourceRoute} -> invalid href ${href}`);
        continue;
      }
      if (url.origin !== 'https://nocharge.net') continue;
      const pathname = decodeURIComponent(url.pathname);
      if (pathname !== '/' && !/\.[a-z0-9]{1,8}$/iu.test(pathname) && !pathname.endsWith('/')) {
        nonCanonicalLinks.push(`${sourceRoute} -> ${pathname}`);
      }
      if (publishedPaths.has(pathname) || pathname.endsWith('/') && publishedPaths.has(`${pathname}`)) {
        if (url.hash) {
          const targetHtml = routeHtml.get(pathname);
          const fragmentId = decodeURIComponent(url.hash.slice(1));
          if (targetHtml) {
            const fragmentIds = new Set([...targetHtml.matchAll(/\sid="([^"]+)"/giu)].map((match) => match[1]));
            if (!fragmentIds.has(fragmentId)) missingFragments.push(`${sourceRoute} -> ${pathname}${url.hash}`);
          }
        }
        continue;
      }
      if (pathname.endsWith('/')) {
        brokenLinks.push(`${sourceRoute} -> missing prerendered route ${pathname}`);
        continue;
      }
      const file = path.join(dist, ...pathname.split('/').filter(Boolean));
      try {
        await access(file);
      } catch {
        brokenLinks.push(`${sourceRoute} -> missing internal file ${pathname}`);
      }
    }
  }
  assert.deepEqual(brokenLinks, [], 'all internal links in prerendered pages resolve without 404s');
  assert.deepEqual(missingFragments, [], 'all internal fragment links resolve to an element id');
  assert.deepEqual(nonCanonicalLinks, [], 'internal links use one direct trailing-slash URL convention');

  for (const route of site.publishedContentPages.map((page) => page.path)) {
    assert.ok(route === '/' || route.endsWith('/'), `canonical route ends directly with a slash: ${route}`);
  }

  console.log(`Content registry/prerender checks passed (${site.publishedContentPages.length} published detail routes, ${sitemapPaths.length} canonical sitemap URLs, unique SEO, semantic HTML, published-only indexing, and zero internal 404s).`);
} finally {
  await vite.close();
}
