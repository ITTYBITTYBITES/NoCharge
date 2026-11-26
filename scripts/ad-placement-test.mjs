import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
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

function htmlPathForRoute(route) {
  const parts = route.split('/').filter(Boolean);
  return parts.length ? path.join(dist, ...parts, 'index.html') : path.join(dist, 'index.html');
}

function expectedSlotIds(route) {
  if (route === '/') return ['home-footer'];
  if (route === '/arcade/') return ['arcade-hub-footer'];
  if (route === '/experiences/') return ['experiences-hub-footer'];
  if (route === '/tools/') return ['tools-hub-footer'];
  if (route === '/guides/') return ['guides-hub-footer'];
  if (route === '/discover/') return ['discover-footer'];
  const parts = route.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'arcade') return ['arcade-detail-companion'];
  if (parts.length === 2 && parts[0] === 'experiences') {
    return ['profivue', 'rideside', 'barn-road-chronicles', 'coosjoint', 'twosecondwitness'].includes(parts[1])
      ? []
      : ['experience-detail-after-interaction'];
  }
  if (parts.length === 2 && parts[0] === 'tools') return ['tools-detail-post-documentation'];
  if (parts.length === 2 && parts[0] === 'guides') return ['guides-detail-mid-editorial'];
  return [];
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'u'))?.[1] ?? null;
}

async function collectFiles(directory) {
  const children = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(children.map((child) => {
    const childPath = path.join(directory, child.name);
    return child.isDirectory() ? collectFiles(childPath) : [childPath];
  }));
  return nested.flat();
}

const blockedNetworkPatterns = [
  /adsbygoogle/i,
  /googlesyndication/i,
  /doubleclick\.net/i,
  /googleadservices/i,
  /googletagmanager/i,
  /google-analytics/i,
  /analytics\.js/i,
  /gtag\/(?:js|js\?)/i,
  /ca-pub-[\da-z-]+/i,
];

try {
  const advertising = await vite.ssrLoadModule('/src/integrations/advertising.ts');
  const site = await vite.ssrLoadModule('/src/site.ts');
  const arcadeRuntime = await vite.ssrLoadModule('/src/modules/arcade/runtime.ts');
  assert.equal(advertising.MONETIZATION_CONFIG.enabled, false, 'central monetization master switch is off');
  assert.equal(advertising.MONETIZATION_CONFIG.networkRequestsAllowed, false, 'third-party network requests are disabled centrally');
  assert.equal(advertising.MONETIZATION_CONFIG.adsense.enabled, false, 'AdSense is disabled centrally');
  assert.equal(advertising.MONETIZATION_CONFIG.h5GamesAds.enabled, false, 'H5 Games Ads is disabled centrally');
  assert.equal(advertising.getAdSlotStatus(), 'inactive', 'all rendered slot status derives as inactive');
  assert.equal(advertising.H5_GAMES_ADS_ENABLED, false, 'H5 adapter cannot initialize in this phase');
  assert.deepEqual(advertising.MONETIZATION_CONFIG.adsense, {
    enabled: false,
    requestedEnabled: false,
    publisherIdValid: false,
  }, 'AdSense has no requested activation or publisher ID by default');
  assert.deepEqual(advertising.MONETIZATION_CONFIG.h5GamesAds, {
    enabled: false,
    requestedEnabled: false,
  }, 'H5 Games Ads remains inactive by default');

  const futureActivationRequest = advertising.createMonetizationConfig({
    VITE_ADSENSE_CLIENT_ID: 'ca-pub-1234567890123456',
    VITE_ADS_ENABLED: 'true',
    VITE_H5_ADS_ENABLED: 'true',
  });
  assert.equal(futureActivationRequest.adsense.requestedEnabled, true, 'VITE_ADS_ENABLED is read as future activation intent');
  assert.equal(futureActivationRequest.adsense.publisherIdValid, true, 'VITE_ADSENSE_CLIENT_ID is format-checked without being exposed');
  assert.equal(futureActivationRequest.h5GamesAds.requestedEnabled, true, 'VITE_H5_ADS_ENABLED is read as future activation intent');
  assert.equal(futureActivationRequest.enabled, false, 'environment intent cannot bypass the Phase 6A activation lock');
  assert.equal(futureActivationRequest.networkRequestsAllowed, false, 'environment intent cannot enable third-party requests');
  assert.equal(futureActivationRequest.adsense.enabled, false, 'a valid ID and opt-in flag still do not activate AdSense in this phase');
  assert.equal(futureActivationRequest.h5GamesAds.enabled, false, 'H5 opt-in still does not activate the adapter in this phase');
  assert.equal(advertising.getAdSlotStatus(futureActivationRequest), 'inactive', 'slots stay dormant even when future activation variables are supplied');
  const invalidPublisherRequest = advertising.createMonetizationConfig({
    VITE_ADSENSE_CLIENT_ID: 'publisher-placeholder',
    VITE_ADS_ENABLED: 'true',
  });
  assert.equal(invalidPublisherRequest.adsense.publisherIdValid, false, 'malformed publisher identifiers fail closed');
  assert.equal(invalidPublisherRequest.adsense.enabled, false, 'malformed publisher identifiers never activate AdSense');
  assert.deepEqual(Object.keys(advertising.AD_SLOT_LAYOUTS), [
    'home-footer',
    'arcade-hub-footer',
    'experiences-hub-footer',
    'tools-hub-footer',
    'guides-hub-footer',
    'discover-footer',
    'arcade-detail-companion',
    'experience-detail-after-interaction',
    'tools-detail-post-documentation',
    'guides-detail-mid-editorial',
  ], 'the central registry contains only the approved placement IDs');
  for (const layout of Object.values(advertising.AD_SLOT_LAYOUTS)) {
    assert.ok(['page-footer', 'directory-footer', 'arcade-companion-banner', 'experience-after-interaction', 'post-documentation-footer', 'mid-editorial'].includes(layout.zone), 'every slot maps to an approved zone');
  }

  const eligibleGame = {
    contentId: 'arcade-pattern-pairs',
    contentType: 'game',
    published: true,
    h5AdsEligible: true,
  };
  assert.equal(advertising.canInitializeH5GamesAds(eligibleGame), false, 'central config keeps even an otherwise eligible game inactive');
  assert.deepEqual(await advertising.h5GamesAdsAdapter.init(eligibleGame), { status: 'inactive' }, 'H5 adapter init resolves immediately as inactive');
  const lifecycleCalls = { before: 0, after: 0, dismissed: 0, done: 0 };
  for (const type of ['preroll', 'next', 'reward']) {
    const result = await advertising.h5GamesAdsAdapter.requestBreak({
      type,
      onBeforeAd: () => { lifecycleCalls.before += 1; },
      onAfterAd: () => { lifecycleCalls.after += 1; },
      onAdDismissed: () => { lifecycleCalls.dismissed += 1; },
      onBreakDone: (breakResult) => {
        assert.equal(breakResult.type, type, `${type} no-op completion preserves its lifecycle type`);
        lifecycleCalls.done += 1;
      },
    });
    assert.deepEqual(result, { status: 'inactive', type }, `${type} break resolves as an inactive no-op`);
  }
  assert.deepEqual(lifecycleCalls, { before: 0, after: 0, dismissed: 0, done: 3 }, 'inactive lifecycle never pauses/mutes or reports a dismiss; completion proceeds safely');
  for (const lifecycleMethod of ['onBeforeAd', 'onAfterAd', 'onAdDismissed']) {
    assert.equal(typeof advertising.h5GamesAdsAdapter[lifecycleMethod], 'function', `${lifecycleMethod} is exposed as a typed lifecycle hook`);
    assert.doesNotThrow(() => advertising.h5GamesAdsAdapter[lifecycleMethod](), `${lifecycleMethod} is inert while disabled`);
  }

  const runtimeEvents = [];
  const requestedBreaks = [];
  const emittedBreakpoints = [];
  const coordinator = new arcadeRuntime.ArcadeRuntimeCoordinator({
    contentId: 'arcade-simon',
    allowedBreakpoints: ['round-end', 'game-over'],
    adapter: { requestBreak: async (request) => {
      requestedBreaks.push(request);
      return { status: 'inactive', type: request.type };
    } },
    onBreakpoint: (point) => emittedBreakpoints.push(point),
  });
  const mockRuntime = {
    init: () => runtimeEvents.push('init'),
    start: () => runtimeEvents.push('start'),
    pause: (reason) => runtimeEvents.push(`pause:${reason}`),
    resume: () => runtimeEvents.push('resume'),
    destroy: () => runtimeEvents.push('destroy'),
    onRoundEnd: async () => {},
    onGameOver: async () => {},
  };
  const unregisterRuntime = coordinator.register(mockRuntime);
  coordinator.start();
  coordinator.setPauseReason('hidden', true);
  coordinator.setPauseReason('blur', true);
  coordinator.setPauseReason('hidden', false);
  assert.equal(runtimeEvents.includes('resume'), false, 'clearing one pause reason cannot resume a game while another reason remains');
  coordinator.setPauseReason('blur', false);
  assert.deepEqual(runtimeEvents.slice(0, 4), ['init', 'start', 'pause:hidden', 'resume'], 'the coordinator dispatches typed lifecycle start/pause/resume actions');
  const naturalEvent = { outcome: 'win', round: 1 };
  await coordinator.requestBreak('round-end', naturalEvent);
  assert.equal(requestedBreaks[0]?.type, 'next', 'a completed round maps only to the adapter next break type');
  assert.equal(requestedBreaks[0]?.name, 'arcade-simon:round-end:win:round-1', 'the break name records the natural boundary and result');
  assert.deepEqual(emittedBreakpoints, ['round-end'], 'only the allowed natural boundary is emitted');
  requestedBreaks[0]?.onBeforeAd?.();
  requestedBreaks[0]?.onAfterAd?.();
  assert.ok(runtimeEvents.includes('pause:ad-break') && runtimeEvents.filter((event) => event === 'resume').length === 2,
    'approved future ad callbacks pause and restore only through the game lifecycle');
  const requestedBeforeInvalid = requestedBreaks.length;
  await coordinator.requestBreak('routine-move', naturalEvent);
  assert.equal(requestedBreaks.length, requestedBeforeInvalid, 'routine moves cannot reach the H5 adapter');
  await coordinator.requestBreak('game-over', { outcome: 'loss', round: 1 });
  assert.equal(requestedBreaks.length, requestedBeforeInvalid + 1, 'the terminal state is the other registered natural boundary');
  unregisterRuntime();
  coordinator.dispose();
  assert.equal(runtimeEvents.filter((event) => event === 'destroy').length, 1, 'unmount destroys a registered game exactly once');

  const htmlPaths = new Map();
  for (const route of site.prerenderPages.map((page) => page.path)) {
    htmlPaths.set(route, htmlPathForRoute(route));
  }
  const routeHtml = new Map();
  for (const [route, file] of htmlPaths) routeHtml.set(route, await readFile(file, 'utf8'));
  routeHtml.set('/__404__/', await readFile(path.join(dist, '404.html'), 'utf8'));

  let slotCount = 0;
  for (const [route, html] of routeHtml) {
    const expected = route === '/__404__/' ? [] : expectedSlotIds(route);
    const tags = [...html.matchAll(/<aside\b[^>]*\bdata-ad-slot="([^"]+)"[^>]*>/giu)].map((match) => match[0]);
    const actual = tags.map((tag) => attribute(tag, 'data-ad-slot'));
    assert.deepEqual(actual, expected, `${route} renders exactly its approved ad slots and no others`);

    for (const tag of tags) {
      const slotId = attribute(tag, 'data-ad-slot');
      const layout = advertising.AD_SLOT_LAYOUTS[slotId];
      assert.ok(layout, `${route} ad slot ${slotId} exists in the central placement registry`);
      assert.equal(attribute(tag, 'data-ad-page-type'), layout.pageType, `${slotId} has its configured page type`);
      assert.equal(attribute(tag, 'data-ad-zone'), layout.zone, `${slotId} has its configured placement zone`);
      assert.equal(attribute(tag, 'data-ad-status'), 'inactive', `${slotId} is explicitly inactive in prerendered HTML`);
      assert.equal(attribute(tag, 'data-ad-enabled'), 'false', `${slotId} is not enabled in prerendered HTML`);
      assert.equal(attribute(tag, 'data-ad-network-requests'), 'false', `${slotId} cannot initiate network requests`);
      assert.equal(attribute(tag, 'data-ad-label'), 'Advertisement', `${slotId} carries the requested ad-label structure`);
      assert.ok(html.includes('<span class="ad-slot__label" aria-hidden="true">Advertisements</span>'), `${slotId} contains the policy-clear future label`);
      slotCount += 1;
    }

    for (const pattern of blockedNetworkPatterns) {
      assert.ok(!pattern.test(html), `${route} contains no live ad/tracking endpoint or publisher ID (${pattern})`);
    }
    const scriptSources = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/giu)].map((match) => match[1]);
    for (const source of scriptSources) {
      const url = new URL(source, 'https://nocharge.net');
      assert.equal(url.origin, 'https://nocharge.net', `${route} loads only same-origin scripts`);
    }
    assert.equal(matchesIn(html, /<iframe\b[^>]*\bsrc=/giu), 0, `${route} has no remote/ad iframe`);
  }

  const sellerRecord = 'google.com, pub-1566091161594729, DIRECT, f08c47fec0942fa0\n';
  const sourceAdsTxt = await readFile(path.join(root, 'public', 'ads.txt'), 'utf8');
  const sourceAppAdsTxt = await readFile(path.join(root, 'public', 'app-ads.txt'), 'utf8');
  const adsTxt = await readFile(path.join(dist, 'ads.txt'), 'utf8');
  const appAdsTxt = await readFile(path.join(dist, 'app-ads.txt'), 'utf8');
  assert.equal(sourceAdsTxt, sellerRecord, 'public/ads.txt contains exactly the live root seller record');
  assert.equal(sourceAppAdsTxt, sellerRecord, 'public/app-ads.txt contains exactly the live root seller record');
  assert.equal(adsTxt, sellerRecord, 'dist/ads.txt contains exactly the live root seller record');
  assert.equal(appAdsTxt, sellerRecord, 'dist/app-ads.txt contains exactly the live root seller record');
  assert.equal(adsTxt, appAdsTxt, 'both emitted seller files match the live root responses byte-for-byte');
  const envExample = await readFile(path.join(root, '.env.example'), 'utf8');
  for (const variable of ['VITE_ADSENSE_CLIENT_ID=', 'VITE_ADS_ENABLED=false', 'VITE_H5_ADS_ENABLED=false']) {
    assert.ok(envExample.includes(variable), `.env.example documents safe default ${variable}`);
  }

  const bundleFiles = (await collectFiles(path.join(dist, 'assets'))).filter((file) => /\.js$/u.test(file));
  assert.ok(bundleFiles.length > 0, 'production build has JavaScript bundles to inspect for dormant vendor code');
  for (const bundleFile of bundleFiles) {
    const bundle = await readFile(bundleFile, 'utf8');
    for (const pattern of blockedNetworkPatterns) {
      assert.ok(!pattern.test(bundle), `${path.relative(dist, bundleFile)} contains no live ad/analytics endpoint or publisher ID (${pattern})`);
    }
  }

  const notFound = routeHtml.get('/__404__/');
  assert.ok(notFound && !notFound.includes('data-ad-slot='), 'the 404 page has no ad slot');
  for (const excludedRoute of ['/search/', '/shop/', '/about/', '/contact/', '/advertising/', '/privacy/', '/terms/']) {
    const html = routeHtml.get(excludedRoute);
    assert.ok(html && !html.includes('data-ad-slot='), `${excludedRoute} is an excluded ad surface`);
  }

  const arcadeDetail = routeHtml.get('/arcade/pattern-pairs/');
  assert.ok(arcadeDetail, 'representative Arcade detail route is prerendered');
  assert.ok(arcadeDetail.includes('data-h5-runtime-contract="nocharge-arcade-v1"'), 'Arcade detail exposes the typed lifecycle contract');
  assert.ok(arcadeDetail.includes('data-h5-breakpoint-hooks="game-over"'), 'Pattern Pairs exposes only its natural terminal boundary');
  assert.ok(arcadeDetail.includes('data-h5-adapter-status="inactive"'), 'Arcade detail H5 adapter remains explicitly inactive');
  assert.ok(arcadeDetail.indexOf('class="interactive-viewport"') < arcadeDetail.indexOf('data-ad-slot="arcade-detail-companion"'), 'Arcade companion slot follows the entire game surface');
  assert.ok(arcadeDetail.indexOf('class="detail-instructions"') < arcadeDetail.indexOf('data-ad-slot="arcade-detail-companion"'), 'Arcade slot never precedes the game instructions or Play controls');
  const simonDetail = routeHtml.get('/arcade/simon/');
  assert.ok(simonDetail, 'the published Simon reference pilot is prerendered');
  assert.ok(simonDetail.includes('data-h5-breakpoint-hooks="round-end game-over"'), 'Simon exposes only completed-round and terminal-game callbacks');
  assert.ok(simonDetail.includes('data-h5-adapter-status="inactive"'), 'Simon remains connected only to the dormant H5 adapter');
  assert.ok(simonDetail.indexOf('class="interactive-viewport"') < simonDetail.indexOf('data-ad-slot="arcade-detail-companion"'), 'Simon companion slot follows its complete playable surface');
  for (const heading of ['How to Play', 'Controls', 'Rules &amp; Scoring', 'Tips', 'Related Guides &amp; Tools']) {
    assert.ok(simonDetail.includes(heading), `Simon ${heading} section is prerendered`);
  }
  const toolDetail = routeHtml.get('/tools/word-counter/');
  assert.ok(toolDetail, 'representative Tool detail route is prerendered');
  assert.ok(toolDetail.indexOf('class="tool-documentation"') < toolDetail.indexOf('data-ad-slot="tools-detail-post-documentation"'), 'Tool slot follows documentation and FAQs');
  const guideDetail = routeHtml.get('/guides/a-local-first-workflow-for-browser-tools/');
  assert.ok(guideDetail, 'representative Guide detail route is prerendered');
  assert.ok(guideDetail.indexOf('class="guide-article-body"') < guideDetail.indexOf('data-ad-slot="guides-detail-mid-editorial"'), 'Guide slot is inside the editorial body at a section boundary');

  console.log(`Ad placement static checks passed (${slotCount} approved, inactive slots across ${site.prerenderPages.length} prerender routes; zero live ad/tracking references; H5 no-op lifecycle verified).`);
} finally {
  await vite.close();
}

function matchesIn(value, pattern) {
  return [...value.matchAll(pattern)].length;
}
