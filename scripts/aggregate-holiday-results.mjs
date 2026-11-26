import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const reportDirectory = path.join(root, '.nocharge-review', 'holiday-theme');
const batchCount = Number(process.env.HOLIDAY_ROUTE_BATCH_COUNT ?? 4);
assert.ok(Number.isSafeInteger(batchCount) && batchCount > 0, 'HOLIDAY_ROUTE_BATCH_COUNT must be a positive integer');

async function collectPrerenderedRoutes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const routes = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) routes.push(...await collectPrerenderedRoutes(entryPath));
    else if (entry.isFile() && entry.name === 'index.html') {
      const relativeDirectory = path.relative(dist, path.dirname(entryPath));
      routes.push(!relativeDirectory || relativeDirectory === '.' ? '/' : `/${relativeDirectory.split(path.sep).join('/')}/`);
    }
  }
  return routes;
}

const homeHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
const calendarMatch = homeHtml.match(/<script id="nocharge-holiday-calendar" type="application\/json">([^<]+)<\/script>/u);
assert.ok(calendarMatch, 'the production home page includes the holiday registry');
const events = JSON.parse(calendarMatch[1]);
assert.equal(events.length, 16, 'the production holiday registry contains 16 palettes');
const sitemapHtml = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapRoutes = [...sitemapHtml.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(([, url]) => new URL(url).pathname);
assert.equal(sitemapRoutes.length, 330, 'the canonical sitemap contains 330 URLs');
const baseRoutes = [
  '/', '/arcade/', '/experiences/', '/tools/', '/guides/', '/discover/', '/search/', '/shop/',
  '/about/', '/contact/', '/advertising/', '/privacy/', '/terms/',
];
const prerenderedRoutes = [...new Set(await collectPrerenderedRoutes(dist))].sort();
assert.equal(prerenderedRoutes.length, 334, 'the production build contains all 334 prerendered HTML routes');
const sitemapAndBaseRoutes = new Set([...baseRoutes, ...sitemapRoutes]);
const noindexPrerenderedRoutes = prerenderedRoutes.filter((route) => !sitemapAndBaseRoutes.has(route));
const allRoutes = [...new Set([...baseRoutes, ...sitemapRoutes, ...noindexPrerenderedRoutes])];
assert.equal(allRoutes.length, 334, 'the holiday matrix inventory includes all 334 prerendered routes, including noindex routes');
assert.ok([...baseRoutes, ...sitemapRoutes].every((route) => prerenderedRoutes.includes(route)),
  'all required base and sitemap URLs exist in the prerendered route inventory');

const expectedBatchRoutes = (index) => {
  const start = Math.floor((index - 1) * allRoutes.length / batchCount);
  const end = Math.floor(index * allRoutes.length / batchCount);
  return allRoutes.slice(start, end);
};
const reports = [];
for (let index = 1; index <= batchCount; index += 1) {
  const stem = `playwright-results-batch-${String(index).padStart(2, '0')}-of-${String(batchCount).padStart(2, '0')}`;
  const report = JSON.parse(await readFile(path.join(reportDirectory, `${stem}.json`), 'utf8'));
  const expectedRoutes = expectedBatchRoutes(index);
  assert.equal(report.routeCoverage?.batch?.index, index, `${stem} records its expected batch index`);
  assert.equal(report.routeCoverage?.batch?.count, batchCount, `${stem} records the expected batch count`);
  assert.equal(report.routeCoverage?.totalRoutes, allRoutes.length, `${stem} declares the full route inventory`);
  assert.deepEqual(report.routes, expectedRoutes, `${stem} covers its exact contiguous route slice`);
  assert.deepEqual(report.routeCoverage?.selectedRoutes, expectedRoutes, `${stem} records its exact selected route slice`);
  assert.equal(report.result, 'PASS', `${stem} passed independently`);
  assert.equal(report.checks?.routeChecks, expectedRoutes.length * events.length * 2 * 2, `${stem} executed every route × palette × theme × viewport check`);
  assert.equal(report.checks?.eventThemeViewportCombinations, events.length * 2 * 2, `${stem} checked all event/theme/viewport combinations`);
  assert.equal(report.checks?.datePreviewChecks, events.length * 2 * 2, `${stem} checked all 16 date previews across both modes and viewports`);
  assert.deepEqual(report.events.map(({ id }) => id).sort(), events.map(({ id }) => id).sort(), `${stem} uses the production event registry`);
  assert.deepEqual(report.themes, ['light', 'dark'], `${stem} covers light and dark modes`);
  assert.deepEqual(report.viewports.map(({ name, width, height }) => [name, width, height]), [
    ['desktop-1440', 1440, 1000], ['mobile-390', 390, 844],
  ], `${stem} covers both required viewports`);
  reports.push({ stem, report });
}

const routeOccurrences = new Map();
for (const { report } of reports) {
  for (const route of report.routes) routeOccurrences.set(route, (routeOccurrences.get(route) ?? 0) + 1);
}
assert.deepEqual([...routeOccurrences.keys()], allRoutes, 'the batches collectively cover every production route');
assert.ok([...routeOccurrences.values()].every((count) => count === 1), 'each route belongs to exactly one route batch');
const uniqueCombinationCount = events.length * 2 * 2;
const routeVisitCount = allRoutes.length * uniqueCombinationCount;
const rootBatch = reports.find(({ report }) => report.routes.includes('/'));
assert.ok(rootBatch, 'the root route is included in exactly one batch');
assert.equal(rootBatch.report.checks.eventPaletteModeViewportChecks, uniqueCombinationCount,
  'the root route checks distinct palette tokens for all events, themes, and viewports');

const failures = reports.flatMap(({ stem, report }) => report.failures.map((failure) => ({ batch: stem, ...failure })));
const sumCheck = (key) => reports.reduce((total, { report }) => total + (report.checks[key] ?? 0), 0);
const checks = {
  routeChecks: reports.reduce((total, { report }) => total + report.checks.routeChecks, 0),
  eventThemeViewportCombinations: uniqueCombinationCount,
  datePreviewChecks: uniqueCombinationCount,
  eventPaletteModeViewportChecks: sumCheck('eventPaletteModeViewportChecks'),
  preferenceAndPreviewChecks: reports[0].report.checks.preferenceAndPreviewChecks,
  layoutStabilityChecks: reports[0].report.checks.layoutStabilityChecks,
  pageErrors: sumCheck('pageErrors'),
  consoleErrors: sumCheck('consoleErrors'),
  requestErrors: sumCheck('requestErrors'),
  horizontalOverflowFailures: sumCheck('horizontalOverflowFailures'),
  visibleTextContrastFailures: sumCheck('visibleTextContrastFailures'),
  minimumContrastRatio: 4.5,
};
assert.equal(checks.routeChecks, routeVisitCount, 'aggregate route visits equal 334 routes × 16 palettes × two modes × two viewports');
if (checks.pageErrors || checks.consoleErrors || checks.requestErrors || checks.horizontalOverflowFailures || checks.visibleTextContrastFailures) {
  failures.push({ message: 'At least one aggregate browser, request, overflow, or contrast check failed.' });
}
const batchPass = reports.every(({ report }) => report.result === 'PASS');
const report = {
  generatedAt: new Date().toISOString(),
  result: batchPass && failures.length === 0 ? 'PASS' : 'FAIL',
  browser: reports[0].report.browser,
  timezoneId: reports[0].report.timezoneId,
  routes: allRoutes,
  routeCoverage: {
    totalRoutes: allRoutes.length,
    batchCount,
    routeVisitsPerRoute: uniqueCombinationCount,
    routeBatches: reports.map(({ stem, report: batchReport }) => ({
      file: `${stem}.json`,
      result: batchReport.result,
      batch: batchReport.routeCoverage.batch,
      routeCount: batchReport.routes.length,
      routeChecks: batchReport.checks.routeChecks,
    })),
  },
  batch: null,
  themes: reports[0].report.themes,
  viewports: reports[0].report.viewports,
  events: reports[0].report.events,
  checks,
  previewSyntax: reports[0].report.previewSyntax,
  failures,
};
const outputStem = 'playwright-results';
await writeFile(path.join(reportDirectory, `${outputStem}.json`), `${JSON.stringify(report, null, 2)}\n`);

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ordinalNames = ['first', 'second', 'third', 'fourth', 'fifth'];
const describeDateRule = (event) => {
  const rule = event.dateRule;
  if (rule.type === 'fixed') return `${monthNames[rule.month - 1]} ${rule.day}`;
  if (rule.type === 'nth-weekday') return `${ordinalNames[rule.occurrence - 1]} ${weekdayNames[rule.weekday]} in ${monthNames[rule.month - 1]}`;
  if (rule.type === 'last-weekday') return `last ${weekdayNames[rule.weekday]} in ${monthNames[rule.month - 1]}`;
  if (rule.type === 'easter') return 'Gregorian Easter Sunday';
  return `${monthNames[rule.start.month - 1]} ${rule.start.day}–${monthNames[rule.end.month - 1]} ${rule.end.day}`;
};
const eventRows = report.events.map((event) => `| ${event.id} | ${event.name} | ${describeDateRule(event)} | ${event.windowType} | ${event.priority} |`).join('\n');
const batchRows = report.routeCoverage.routeBatches.map((item) => `| ${item.file} | ${item.result} | ${item.routeCount} | ${item.routeChecks} |`).join('\n');
const markdown = [
  '# NoCharge V2 — holiday and event theme Playwright QA',
  '',
  `**Result:** ${report.result}  `,
  `**Generated:** ${report.generatedAt}  `,
  `**Browser:** ${report.browser} (${report.timezoneId} local-date context)`,
  '',
  '## Coverage',
  '',
  `- Prerendered routes: ${allRoutes.length}; canonical sitemap URLs: ${sitemapRoutes.length}`,
  `- Seasonal palettes: ${events.length}`,
  `- Primary themes: ${report.themes.join(', ')}`,
  `- Viewports: ${report.viewports.map(({ name, width, height }) => `${name} (${width}×${height})`).join(', ')}`,
  `- Distinct event × theme × viewport combinations: ${uniqueCombinationCount} (${events.length} palettes × ${report.themes.length} themes × ${report.viewports.length} viewports)`,
  `- Full route visits: ${checks.routeChecks} (${allRoutes.length} routes × ${uniqueCombinationCount} combinations)`,
  `- Date-preview resolver checks: ${checks.datePreviewChecks} (${events.length} event dates × ${report.themes.length} themes × ${report.viewports.length} viewports)`,
  `- Root-route event palette token checks: ${checks.eventPaletteModeViewportChecks}`,
  `- Visible text contrast floor: 4.5:1; failures: ${checks.visibleTextContrastFailures}`,
  '- Contrast method: visible DOM text with computed foregrounds, composited translucent CSS colors, and gradient color stops; clipped assistive-only text and aria-hidden decorative artwork are excluded.',
  `- Horizontal overflow failures: ${checks.horizontalOverflowFailures}`,
  `- Page errors: ${checks.pageErrors}; console errors: ${checks.consoleErrors}; failed/HTTP error requests: ${checks.requestErrors}`,
  `- Seasonal preference, mode independence, storage, and preview/fallback checks: ${checks.preferenceAndPreviewChecks}`,
  `- Seasonal activation layout geometry comparisons: ${checks.layoutStabilityChecks}`,
  '- Execution: four sequential route batches; one Chromium worker per batch. Each production route was visited for every event, theme, and viewport.',
  '',
  '## Route-batch evidence',
  '',
  '| Batch report | Result | Routes | Route visits |',
  '|---|---|---:|---:|',
  batchRows,
  '',
  '## Event registry',
  '',
  '| ID | Event | Date rule | Window | Priority |',
  '|---|---|---|---:|---:|',
  eventRows,
  '',
  'Week windows are Sunday through Saturday inclusive in the visitor’s local calendar. Day windows include only the holiday’s local calendar date. Month/day range endpoints are inclusive; if the end month/day is earlier than the start, the range crosses into the following year. Overlaps resolve by day over week over range; ties then use higher priority, shorter actual span, nearer anchor date, and finally ascending event ID.',
  '',
  '## Preview URLs',
  '',
  '- Event: <code>/shop/?previewEvent=halloween</code>',
  '- Date: <code>/shop/?previewDate=2026-02-14</code> (strict local <code>YYYY-MM-DD</code>)',
  '- Neutral: <code>/shop/?previewEvent=none</code>',
  '',
  'Invalid preview values fall back to the visitor’s local-date resolution and saved Seasonal Auto/Standard preference. Static/prerendered documents start with <code>data-event=none</code>; the inline client bootstrap applies the event before first paint.',
  '',
  '## Result details',
  '',
  `The full machine-readable result is <code>${outputStem}.json</code>. ${report.result === 'PASS' ? 'All requested Playwright matrix checks passed across all 334 routes and 16 seasonal palettes.' : 'See its failures array and the per-batch reports for diagnostics.'}`,
].join('\n');
await writeFile(path.join(reportDirectory, `${outputStem}.md`), markdown);

console.log(`Holiday matrix aggregation ${report.result}: ${checks.routeChecks} route visits across ${allRoutes.length} routes, ${events.length} palettes, ${report.themes.length} themes, and ${report.viewports.length} viewports.`);
console.log(`Report: ${path.join(reportDirectory, `${outputStem}.md`)}`);
if (report.result !== 'PASS') process.exitCode = 1;
