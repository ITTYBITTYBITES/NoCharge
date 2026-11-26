import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

const expectedProducts = [
  { id: 'ittybittybites-product-coosjoint', slug: 'coosjoint', name: "Coo's Joint: Coffee Idle", category: 'Games & Entertainment', hostname: 'coosjoint.nocharge.net' },
  { id: 'ittybittybites-product-twosecondwitness', slug: 'twosecondwitness', name: 'The 2-Second Witness', category: 'Games & Entertainment', hostname: 'twosecondwitness.nocharge.net' },
  { id: 'ittybittybites-product-profivue', slug: 'profivue', name: 'ProfiVue', category: 'Productivity & Utilities', hostname: 'profivue.nocharge.net' },
  { id: 'ittybittybites-product-rideside', slug: 'rideside', name: 'RideSide', category: 'Productivity & Utilities', hostname: 'rideside.nocharge.net' },
];
const expectedExperienceSlugs = ['barn-road-chronicles', ...expectedProducts.map((product) => product.slug)].sort();
const staticProductSlugs = new Set(['profivue', 'rideside']);
const showcaseProductSlugs = new Set(['coosjoint', 'twosecondwitness']);
const staticShowcaseSlugs = new Set([...showcaseProductSlugs, 'barn-road-chronicles']);

function graphNodes(structuredData, type) {
  const nodes = Array.isArray(structuredData?.['@graph']) ? structuredData['@graph'] : [structuredData];
  return nodes.filter((node) => node && (node['@type'] === type || Array.isArray(node['@type']) && node['@type'].includes(type)));
}

function htmlEntities(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&quot;', '\"').replaceAll('&#39;', "'").replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
}

try {
  const [productDirectory, storefronts, registry, site] = await Promise.all([
    vite.ssrLoadModule('/src/content/experienceProducts.ts'),
    vite.ssrLoadModule('/src/integrations/storefronts.ts'),
    vite.ssrLoadModule('/src/content/registry.ts'),
    vite.ssrLoadModule('/src/site.ts'),
  ]);

  const products = productDirectory.getPublishedExperienceProducts();
  assert.deepEqual(products.map(({ id, slug, name, category, hostname }) => ({ id, slug, name, category, hostname })), expectedProducts,
    'the four requested ITTYBITTYBITES destinations retain their approved product names, categories, and hosts');
  assert.deepEqual(productDirectory.EXPERIENCE_PRODUCT_CATEGORIES, ['Games & Entertainment', 'Productivity & Utilities'],
    'both required product categories are available');
  assert.deepEqual(productDirectory.validateExperienceProducts(), [], 'the product-site registry passes uniqueness and URL validation');
  assert.equal(new Set(products.map((product) => product.id)).size, 4, 'product IDs are unique');
  assert.equal(new Set(products.map((product) => product.slug)).size, 4, 'product slugs are unique');
  assert.equal(new Set(products.map((product) => product.hostname)).size, 4, 'product hosts are unique');
  assert.ok(products.every((product) => product.status === 'published'), 'all four requested product destinations are published');
  assert.ok(products.every((product) => productDirectory.getExperienceProductUrl(product) === `https://${product.hostname}/`),
    'product-site links use HTTPS and the exact configured host');

  const currentExperiences = registry.getPublishedBySection('experiences');
  assert.deepEqual(currentExperiences.map(({ slug }) => slug).sort(), expectedExperienceSlugs,
    'the five published Experiences are static showcases or editorial product overviews, with no local interactive demos');
  assert.ok(products.every((product) => {
    const entry = registry.getPublishedBySlug('experiences', product.slug);
    return entry?.kind === 'experience' && entry.id !== product.id && entry.productWebsiteUrl === productDirectory.getExperienceProductUrl(product)
      && (staticProductSlugs.has(product.slug)
        ? entry.presentation === 'editorial-mini-site' && entry.moduleLoader === undefined && Boolean(entry.appLegalSlug)
        : entry.presentation === 'showcase' && entry.moduleLoader === undefined && Boolean(entry.appLegalSlug)
          && entry.youtubeTrailers?.length === 1);
  }), 'product-site records remain separate from static showcase and editorial detail entries, with no local product demo modules');

  assert.equal(storefronts.STOREFRONT_PROVIDER, 'Square Online', 'the Shop provider remains Square Online');
  assert.deepEqual(storefronts.storefrontBrands, [], 'the existing Square storefront registry remains empty and untouched');
  assert.deepEqual(storefronts.getPublishedStorefronts(), [], 'no Square storefront is published or repurposed as an application');
  assert.deepEqual(storefronts.getPublishedStorefronts().map((store) => store.squareStorefrontUrl), [], 'no Square URLs are activated');
  assert.ok(products.every((product) => !storefronts.storefrontBrands.some((store) => store.id === product.id || store.slug === product.slug || store.nochargeSubdomain === product.hostname)),
    'no app product or product host enters the storefront registry');

  const routePaths = site.prerenderPages.map((page) => page.path);
  assert.equal(routePaths.filter((route) => route === '/experiences/').length, 1, 'the Experiences directory route is unique');
  assert.equal(routePaths.filter((route) => route === '/shop/').length, 1, 'the Shop directory route remains unique');
  assert.equal(routePaths.filter((route) => route.startsWith('/experiences/')).length, 6, 'one directory and five published static Experience detail routes are prerendered');
  assert.equal(routePaths.filter((route) => /^(?:\/privacy|\/terms)\/(?:coosjoint|twosecondwitness|profivue|rideside)\/$/u.test(route)).length, 8, 'all eight app-specific privacy/terms pages are prerendered');
  assert.equal(new Set(routePaths).size, routePaths.length, 'the new routes introduce no prerender conflicts');
  for (const slug of expectedExperienceSlugs) assert.ok(routePaths.includes(`/experiences/${slug}/`), `${slug} has a local canonical Experience detail route`);
  assert.ok(!site.primaryNavigation.some((item) => item.to === '/shop/'), 'the hidden Shop route is absent from primary navigation');
  assert.equal(site.primaryNavigation.filter((item) => item.to === '/experiences/').length, 1, 'Experiences appears once in primary navigation');

  const experiencesHtml = await readFile(path.join(dist, 'experiences', 'index.html'), 'utf8');
  const shopHtml = await readFile(path.join(dist, 'shop', 'index.html'), 'utf8');
  assert.match(experiencesHtml, /coosjoint\.nocharge\.net/i, 'Experiences metadata includes its application showcase');
  assert.ok(shopHtml.includes('data-shop-status="hidden"'), 'the directly accessible Shop route is marked hidden');
  assert.ok(!/href="(?:\/shop\/|https:\/\/store\.nocharge\.net)/u.test(shopHtml), 'the hidden Shop route has no Shop or store link');
  assert.ok(!experiencesHtml.includes('https://store.nocharge.net'), 'the Experiences directory remains free of the Shop/store destination');
  assert.ok(experiencesHtml.includes('data-experience-product-directory="ittybittybites"'), 'the Experiences directory renders the separate ITTYBITTYBITES listing');
  assert.ok(experiencesHtml.includes('data-experience-category-group="Games &amp; Entertainment"'), 'Games & Entertainment is rendered');
  assert.ok(experiencesHtml.includes('data-experience-category-group="Productivity &amp; Utilities"'), 'Productivity & Utilities is rendered');
  for (const slug of expectedExperienceSlugs) assert.ok(experiencesHtml.includes(`href="/experiences/${slug}/"`), `${slug} has a directory detail link`);

  for (const product of expectedProducts) {
    const article = [...experiencesHtml.matchAll(/<article\b[^>]*data-experience-product-id="([^"]+)"[^>]*>[\s\S]*?<\/article>/gu)]
      .find(([, id]) => id === product.id)?.[0];
    assert.ok(article, `${product.name} has a server-rendered product card`);
    assert.ok(article.includes(`data-experience-hostname="${product.hostname}"`), `${product.name} displays its configured host`);
    assert.ok(article.includes(`href="https://${product.hostname}/"`), `${product.name} links to its official product website`);
    assert.ok(article.includes(`href="/experiences/${product.slug}/"`), `${product.name} links to its local Experience detail`);
    assert.ok(article.includes('target="_blank"') && article.includes('rel="noopener noreferrer"'), `${product.name} external link opens safely`);
    assert.ok(article.includes('Official site for current app details'), `${product.name} frames the official site as its current-information destination`);
    assert.ok(article.includes(staticProductSlugs.has(product.slug) ? 'Read product overview' : 'Read app showcase'), `${product.name} card action matches its editorial overview or static showcase route`);
    assert.ok(htmlEntities(article).includes(product.name), `${product.name} is visible in the card`);
    assert.ok(!/square|checkout|cart|payment/iu.test(article), `${product.name} is not presented as commerce or checkout`);

    const detailPath = `/experiences/${product.slug}/`;
    const detailHtml = await readFile(path.join(dist, 'experiences', product.slug, 'index.html'), 'utf8');
    assert.ok(detailHtml.includes(`href="https://nocharge.net${detailPath}"`), `${product.name} has its own canonical detail URL`);
    const isStaticProduct = staticProductSlugs.has(product.slug);
    if (isStaticProduct) {
      for (const heading of ['Direct answer', 'Overview', 'Described features', 'Workflows and decisions', 'Use cases', 'A look at the product', 'Platform, availability, and what to verify', 'Frequently asked questions', 'Companion Guides &amp; Tools']) {
        assert.ok(detailHtml.includes(heading), `${product.name} static mini-site has prerendered ${heading}`);
      }
      assert.ok(detailHtml.includes(`data-static-experience-route="${product.slug}"`), `${product.name} has a dedicated static detail route`);
      assert.ok(detailHtml.includes(`data-experience-theme="${product.slug}"`), `${product.name} applies its dedicated visual theme`);
      assert.ok(detailHtml.includes(`data-app-microsite-footer="${product.slug}"`), `${product.name} renders its standalone micro-site footer`);
      assert.ok(detailHtml.includes('data-editorial-experience="true"'), `${product.name} renders the editorial mini-site template`);
      assert.equal((detailHtml.match(/data-app-legal-link="privacy"/gu) ?? []).length, 1, `${product.name} links its app privacy page exactly once`);
      assert.equal((detailHtml.match(/data-app-legal-link="terms"/gu) ?? []).length, 1, `${product.name} links its app terms page exactly once`);
      assert.ok(!detailHtml.includes('interactive-viewport') && !detailHtml.includes('data-demo=') && !detailHtml.includes('detail-instructions'), `${product.name} static route contains no preview runtime or demo shell`);
      assert.ok(!detailHtml.includes('experience-detail-after-interaction'), `${product.name} static route has no post-demo ad reservation`);
      assert.ok(detailHtml.includes(`data-official-product-link="${product.slug}"`), `${product.name} links to its official product website`);
      assert.ok(!detailHtml.includes('data-product-website-link=') && !detailHtml.includes('data-google-play-link=') && !detailHtml.includes('data-itchio-link='), `${product.name} does not expose unapproved third-party destinations`);
      assert.ok(!detailHtml.includes('href="/shop/"') && !detailHtml.includes('play.google.com') && !detailHtml.includes('apps.apple.com'), `${product.name} has no Shop or app-store link`);
      assert.doesNotMatch(htmlEntities(detailHtml), /Google Play|App Store|\bdownload\b|NoCharge Shop/iu, `${product.name} has no store/download callout in its server-rendered route`);
      const anchorHrefs = [...detailHtml.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/giu)].map((match) => htmlEntities(match[1]));
      const officialUrl = `https://${product.hostname}/`;
      assert.equal(anchorHrefs.filter((href) => href === officialUrl).length, 1, `${product.name} has exactly one official external link`);
      assert.ok(anchorHrefs.every((href) => href.startsWith('/') || href.startsWith('#') || href === officialUrl), `${product.name} links only to its official host and internal NoCharge pages`);
      assert.ok(detailHtml.includes('data-companion-resource-slot='), `${product.name} reserves an internal companion-resource slot`);
      const expectedAssetIds = product.slug === 'profivue' ? ['NC-PV-01', 'NC-PV-02', 'NC-PV-03'] : ['NC-RS-01', 'NC-RS-02'];
      const imageTags = [...detailHtml.matchAll(/<img\b[^>]*>/giu)].map((match) => match[0]);
      assert.equal(imageTags.length, expectedAssetIds.length, `${product.name} renders all its local listing images`);
      for (const [index, assetId] of expectedAssetIds.entries()) {
        assert.ok(detailHtml.includes(`data-asset-id="${assetId}"`) && detailHtml.includes(`data-runtime-asset-id="${assetId}-OPT"`), `${product.name} registers ${assetId} and its derivative in the figure`);
        assert.match(imageTags[index], /\bloading="lazy"/u, `${assetId} is lazy-loaded`);
        assert.match(imageTags[index], /\bdecoding="async"/u, `${assetId} decodes asynchronously`);
        assert.match(imageTags[index], /\bsrc="\/assets\//u, `${assetId} uses a locally emitted optimized image`);
        assert.match(imageTags[index], /\balt="[^"]{50,}"/u, `${assetId} has useful alt text`);
      }
      const miniSiteSchemaMatch = detailHtml.match(/<script\s+id="structured-data"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/u);
      assert.ok(miniSiteSchemaMatch, `${product.name} has prerendered JSON-LD`);
      const miniSiteSchema = JSON.parse(miniSiteSchemaMatch[1]);
      const softwareApplication = graphNodes(miniSiteSchema, 'SoftwareApplication')[0];
      const productFaq = graphNodes(miniSiteSchema, 'FAQPage')[0];
      const productWebPage = graphNodes(miniSiteSchema, 'WebPage')[0];
      const productEntry = registry.getPublishedBySlug('experiences', product.slug);
      assert.ok(softwareApplication && productFaq && productWebPage && productEntry?.kind === 'experience' && productEntry.presentation === 'editorial-mini-site', `${product.name} has matching software, WebPage, and FAQ schema nodes`);
      assert.equal(softwareApplication.operatingSystem, 'Android', `${product.name} software schema uses only the publisher-described platform`);
      assert.equal(softwareApplication.url, officialUrl, `${product.name} software schema links only to the official product site`);
      assert.deepEqual(softwareApplication.sameAs, [officialUrl], `${product.name} schema contains no store or third-party destination`);
      assert.equal(softwareApplication.publisher.name, 'ITTYBITTYBITES', `${product.name} schema attributes the publisher separately from NoCharge`);
      assert.deepEqual(softwareApplication.featureList, [...productEntry.documentation.keyFeatures], `${product.name} software features match its authored editorial copy`);
      assert.deepEqual(
        productFaq.mainEntity.map((question) => [question.name, question.acceptedAnswer.text]),
        productEntry.documentation.faq.map((item) => [item.question, item.answer]),
        `${product.name} FAQ JSON-LD matches the visible authored answers`,
      );
      assert.equal(productWebPage.url, `https://nocharge.net${detailPath}`, `${product.name} WebPage schema keeps the local canonical URL`);
      assert.ok(!('offers' in softwareApplication) && !('aggregateRating' in softwareApplication) && !('isAccessibleForFree' in softwareApplication), `${product.name} schema invents no offer, rating, or price-accessibility claim`);
    } else if (showcaseProductSlugs.has(product.slug)) {
      const expectedVideoId = product.slug === 'coosjoint' ? 'bNMkbd4iv-g' : 'tOFySpe6yt0';
      const legalStatus = 'source-provided';
      assert.ok(detailHtml.includes(`data-experience-showcase="${product.slug}"`), `${product.name} uses the static showcase template`);
      assert.ok(detailHtml.includes(`data-experience-theme="${product.slug}"`), `${product.name} applies its dedicated visual theme`);
      assert.ok(detailHtml.includes(`data-app-microsite-footer="${product.slug}"`), `${product.name} renders its standalone micro-site footer`);
      assert.ok(detailHtml.includes('data-nocharge-demo="absent"'), `${product.name} explicitly contains no NoCharge demo`);
      assert.ok(!detailHtml.includes('data-demo=') && !detailHtml.includes('interactive-viewport') && !detailHtml.includes('interactive-module') && !detailHtml.includes('detail-instructions'), `${product.name} has no local game module or demo shell`);
      assert.ok(!detailHtml.includes('experience-detail-after-interaction') && !detailHtml.includes('data-ad-slot='), `${product.name} has no post-demo ad reservation`);
      assert.ok(detailHtml.includes(`data-youtube-trailer="${product.slug}"`) && detailHtml.includes(`data-youtube-video-id="${expectedVideoId}"`), `${product.name} retains only its approved official trailer ID`);
      assert.ok(detailHtml.includes(`data-trailer-play="${product.slug}"`) && detailHtml.includes('data-trailer-click-only="true"'), `${product.name} trailer requires an explicit click`);
      assert.ok(!/<iframe\b/iu.test(detailHtml) && !/youtube(?:-nocookie)?\.com|ytimg\.com/iu.test(detailHtml), `${product.name} makes no YouTube embed request before a play click`);
      assert.equal((detailHtml.match(/data-app-legal-link="privacy"/gu) ?? []).length, 1, `${product.name} links its app privacy route`);
      assert.equal((detailHtml.match(/data-app-legal-link="terms"/gu) ?? []).length, 1, `${product.name} links its app terms route`);
      assert.ok(detailHtml.includes(`data-legal-status="${legalStatus}"`), `${product.name} exposes its verified or draft legal status accurately`);
      assert.ok(detailHtml.includes(`data-product-website-link="${product.slug}"`), `${product.name} links to its official product website`);
      assert.ok(detailHtml.includes(`data-google-play-link="${product.slug}"`), `${product.name} links to its verified Play listing`);
      assert.ok(detailHtml.includes(`data-itchio-link="${product.slug}"`), `${product.name} distinguishes the separate creator-hosted itch.io project`);
      for (const heading of ['Overview', 'What the publisher describes', 'Platform &amp; Availability', 'FAQ']) {
        assert.ok(detailHtml.includes(heading), `${product.name} has prerendered static ${heading} copy`);
      }
      const externalHrefs = [...detailHtml.matchAll(/<a\b[^>]*\bhref="(https:\/\/[^"]+)"[^>]*>/giu)].map((match) => htmlEntities(match[1]));
      const expectedExternalHrefs = [
        `https://${product.hostname}/`,
        product.slug === 'coosjoint'
          ? 'https://play.google.com/store/apps/details?id=com.ittybittybites.cooscafe'
          : 'https://play.google.com/store/apps/details?id=com.ittybittybites.the2secondwitness',
        product.slug === 'coosjoint'
          ? 'https://ittybittybites.itch.io/coos-joint-idle-coffee-syndicate'
          : 'https://ittybittybites.itch.io/2-second-witness',
        ...(product.slug === 'coosjoint' ? ['https://www.facebook.com/profile.php?id=61596369614569'] : []),
      ];
      assert.deepEqual(externalHrefs.sort(), expectedExternalHrefs.sort(), `${product.name} exposes only its approved product, release, and social destinations`);
      if (product.slug === 'coosjoint') {
        const facebookLink = detailHtml.match(/<a\b(?=[^>]*\bdata-facebook-link="coosjoint")[^>]*>/u)?.[0];
        assert.ok(facebookLink && facebookLink.includes('href="https://www.facebook.com/profile.php?id=61596369614569"')
          && facebookLink.includes('target="_blank"') && facebookLink.includes('rel="noopener noreferrer"'),
        'Coo’s Joint Facebook is a static outbound anchor with safe isolation');
      } else {
        assert.ok(!detailHtml.includes('data-facebook-link='), `${product.name} has no unrelated Facebook destination`);
      }
      const schemaMatch = detailHtml.match(/<script\s+id="structured-data"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/u);
      assert.ok(schemaMatch, `${product.name} has prerendered JSON-LD`);
      const schema = JSON.parse(schemaMatch[1]);
      const app = graphNodes(schema, 'SoftwareApplication')[0];
      const faq = graphNodes(schema, 'FAQPage')[0];
      const entry = registry.getPublishedBySlug('experiences', product.slug);
      assert.ok(app && faq && entry?.kind === 'experience' && entry.presentation === 'showcase', `${product.name} JSON-LD identifies the app without calling the page a web game`);
      assert.equal(app.operatingSystem, 'Android', `${product.name} structured data reflects its Android app platform`);
      assert.equal(app.url, entry.googlePlayUrl, `${product.name} structured data uses the verified Android listing URL`);
      assert.deepEqual(app.sameAs, [entry.productWebsiteUrl, entry.googlePlayUrl, entry.itchIoUrl, entry.facebookUrl].filter(Boolean), `${product.name} structured data links the distinct approved product, release, and social destinations`);
      if (product.slug === 'coosjoint') {
        const videoGame = graphNodes(schema, 'VideoGame')[0];
        assert.ok(videoGame && videoGame['@id'] === app['@id'], 'Coo’s Joint includes a VideoGame type on its existing static app entity');
        assert.ok(videoGame.sameAs.includes('https://www.facebook.com/profile.php?id=61596369614569'), 'Coo’s Joint VideoGame sameAs includes the Facebook profile');
      }
      assert.equal(app.publisher.name, 'ITTYBITTYBITES', `${product.name} structured data names its app publisher`);
      assert.ok(!('offers' in app) && !('aggregateRating' in app) && !('isAccessibleForFree' in app), `${product.name} structured data invents no pricing, rating, or free-access claim`);
      assert.deepEqual(faq.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]),
        entry.documentation.faq.map((item) => [item.question, item.answer]), `${product.name} FAQ schema matches the visible authored answers`);
      assert.ok(!/\b(?:coming soon|lorem ipsum|placeholder text|todo|tbd)\b/iu.test(detailHtml), `${product.name} has no visible placeholder copy`);
    } else {
      assert.fail(`${product.name} is not classified as a static product page`);
    }


  }

  const barnRoadHtml = await readFile(path.join(dist, 'experiences', 'barn-road-chronicles', 'index.html'), 'utf8');
  assert.ok(experiencesHtml.includes('Barn Road Chronicles: Act 1'), 'the Experiences directory publishes a local Barn Road Chronicles showcase card');
  assert.ok(barnRoadHtml.includes('data-experience-showcase="barn-road-chronicles"') && barnRoadHtml.includes('data-nocharge-demo="absent"'), 'BRC is a static outbound showcase with no NoCharge demo');
  assert.ok(barnRoadHtml.includes('data-experience-theme="barn-road-chronicles"') && barnRoadHtml.includes('data-app-microsite-footer="barn-road-chronicles"'), 'BRC renders its dedicated visual theme and standalone micro-site footer');
  assert.ok(barnRoadHtml.includes('data-itchio-link="barn-road-chronicles"')
    && barnRoadHtml.includes('href="https://ittybittybites.itch.io/barn-road-chronicles-act-1/"'), 'BRC links only to the verified creator-owned itch.io HTML5 listing');
  assert.ok(!barnRoadHtml.includes('data-product-website-link="barn-road-chronicles"')
    && !barnRoadHtml.includes('data-google-play-link="barn-road-chronicles"')
    && !barnRoadHtml.includes('/privacy/barn-road-chronicles/')
    && !barnRoadHtml.includes('/terms/barn-road-chronicles/'), 'BRC has no invented product website, Android listing, or app-policy route');
  for (const detail of ['HTML5', 'itch.io', 'mobile-first', 'touch-first', 'browser save', 'optional audio', 'Prototype', 'point-and-click', 'future H5 Games Ads candidate']) {
    assert.ok(htmlEntities(barnRoadHtml).toLocaleLowerCase().includes(detail.toLocaleLowerCase()), `Barn Road Chronicles has source-scoped editorial about ${detail}`);
  }
  for (const heading of ['Overview', 'What the publisher describes', 'Platform &amp; Availability', 'FAQ']) {
    assert.ok(barnRoadHtml.includes(heading), `Barn Road Chronicles has prerendered static ${heading} documentation`);
  }
  assert.ok(barnRoadHtml.includes('data-h5-candidate="true"') && barnRoadHtml.includes('data-h5-candidate-status="deferred"'), 'BRC is labelled only as a future H5 Games Ads candidate');
  assert.ok(!barnRoadHtml.includes('data-h5-game-id=') && !barnRoadHtml.includes('data-h5-ad-slot=')
    && !barnRoadHtml.includes('data-ad-slot=') && !barnRoadHtml.includes('ca-pub-'), 'BRC has no game-ad runtime, placement, publisher ID, or live ad');
  assert.ok(!barnRoadHtml.includes('data-youtube-trailer=') && !/<iframe\b/iu.test(barnRoadHtml), 'BRC has no remote trailer or game embed');
  assert.ok(!barnRoadHtml.includes('BarnRoadChroniclesPreview') && !barnRoadHtml.includes('interactive-viewport') && !barnRoadHtml.includes('data-demo='), 'BRC static HTML does not contain its retired local preview runtime');
  const brcExternalHrefs = [...barnRoadHtml.matchAll(/<a\b[^>]*\bhref="(https:\/\/[^"]+)"[^>]*>/giu)].map((match) => htmlEntities(match[1]));
  assert.deepEqual(brcExternalHrefs, ['https://ittybittybites.itch.io/barn-road-chronicles-act-1/'], 'BRC publishes one itch.io destination and no Play Store or product subdomain');
  const barnRoadSchemaMatch = barnRoadHtml.match(/<script\s+id="structured-data"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/u);
  assert.ok(barnRoadSchemaMatch, 'Barn Road Chronicles has prerendered JSON-LD');
  const barnRoadSchema = JSON.parse(barnRoadSchemaMatch[1]);
  const barnRoadApplication = graphNodes(barnRoadSchema, 'WebApplication')[0];
  const barnRoadFaq = graphNodes(barnRoadSchema, 'FAQPage')[0];
  assert.ok(barnRoadApplication && barnRoadFaq, 'Barn Road Chronicles keeps WebApplication and FAQ structured data for its external HTML5 project');
  assert.deepEqual(barnRoadApplication.sameAs, ['https://ittybittybites.itch.io/barn-road-chronicles-act-1/'], 'BRC structured data includes only the verified itch.io destination');
  assert.equal(barnRoadApplication.operatingSystem, 'Web browser', 'BRC structured data describes the creator-hosted browser project');
  assert.equal(barnRoadApplication.url, 'https://ittybittybites.itch.io/barn-road-chronicles-act-1/', 'BRC schema points to the creator-hosted listing, not a NoCharge demo');
  assert.ok(!('offers' in barnRoadApplication) && !('aggregateRating' in barnRoadApplication) && !('isAccessibleForFree' in barnRoadApplication), 'BRC schema invents no pricing, rating, or free-access claim');

  for (const slug of ['orbit-lab', 'pocket-beat']) {
    assert.ok(!routePaths.includes(`/experiences/${slug}/`), `${slug} has no public Experience route`);
    await assert.rejects(readFile(path.join(dist, 'experiences', slug, 'index.html'), 'utf8'), { code: 'ENOENT' },
      `${slug} has no prerendered detail document`);
  }

  assert.ok(shopHtml.includes('<title>Shop | NoCharge</title>'), 'Shop metadata reflects the hidden destination');
  assert.ok(shopHtml.includes('data-shop-status="hidden"') && shopHtml.includes('No store destination is available'), 'the direct Shop route contains only an unavailable state');
  assert.ok(!shopHtml.includes('data-nocharge-store-link') && !shopHtml.includes('data-experience-product-directory='), 'the hidden Shop route contains no store link or product cards');
  assert.ok(!/href="(?:\/shop\/|https:\/\/store\.nocharge\.net)/u.test(shopHtml), 'the hidden Shop route has no internal or external store links');
  assert.ok(!expectedProducts.some((product) => shopHtml.includes(product.hostname)), 'Shop contains none of the product-site hosts');
  assert.ok(!site.indexablePaths.includes('/shop/'), 'the hidden Shop route remains noindex and out of the sitemap');
  for (const routeHtml of [experiencesHtml, shopHtml]) {
    assert.ok(!routeHtml.includes('href="/shop/"') && !routeHtml.includes('https://store.nocharge.net'), 'the rendered route has no active Shop or store link');
    if (routeHtml === experiencesHtml) assert.ok(routeHtml.includes('href="/experiences/"'), 'Experiences navigation remains available');
  }

  console.log('Experience / hidden-Shop checks passed: five static Experience pages, four official app destinations, three release showcases, two editorial mini-sites, click-only approved trailers, app-specific legal routes, no store links, and no route conflicts.');
} finally {
  await vite.close();
}
