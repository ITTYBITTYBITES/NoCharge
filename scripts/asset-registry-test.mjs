import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'assets', 'manifest.csv');
const approvalRecord = 'Approved by explicit user review for the manifest-listed UI slot only (2026-11-16)';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/u, ''));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('assets/manifest.csv has an unterminated quoted field.');
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/u, ''));
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  const [headers, ...values] = rows;
  assert.ok(headers?.length, 'manifest has a CSV header');
  return values.map((valuesRow, index) => {
    assert.equal(valuesRow.length, headers.length, `manifest row ${index + 2} has the correct number of CSV columns`);
    return Object.fromEntries(headers.map((header, column) => [header, valuesRow[column]]));
  });
}

const manifest = parseCsv(await readFile(manifestPath, 'utf8'));
const byManifestId = new Map(manifest.map((row) => [row.asset_id, row]));
const r31Rows = manifest.filter((row) => /^NC\d{2}-R3\.1$/u.test(row.asset_id));
const batch02Rows = manifest.filter((row) => /^NC\d{2}-B02-R3\.1$/u.test(row.asset_id));
assert.equal(r31Rows.length, 10, 'manifest contains exactly ten Batch 01 R3.1 source proposals');
assert.equal(new Set(r31Rows.map((row) => row.asset_id)).size, 10, 'Batch 01 R3.1 manifest IDs are unique');
for (const row of r31Rows) assert.equal(row.approval_status, approvalRecord, `${row.asset_id} records the user's scoped approval`);
assert.equal(batch02Rows.length, 10, 'manifest contains exactly ten Batch 02 source assets');
assert.equal(new Set(batch02Rows.map((row) => row.asset_id)).size, 10, 'Batch 02 manifest IDs are unique');
for (const row of batch02Rows) {
  assert.match(row.approval_status, /Authorized for this manifest-listed active non-game V2 tool target/u, `${row.asset_id} records its scoped tool-only authorization`);
  assert.match(row.website_integration_status, /Integrated via AdaptiveIcon on the published V2 tool card and detail heading/u, `${row.asset_id} documents the rendered tool-card and detail targets`);
}

for (const row of manifest.filter((entry) => /^NC\d{2}(?:-WEB|-R2)?$/u.test(entry.asset_id))) {
  assert.match(row.approval_status, /Rejected/u, `${row.asset_id} remains rejected`);
}
for (const row of manifest.filter((entry) => /^NC\d{2}-R3$/u.test(entry.asset_id))) {
  assert.match(row.approval_status, /Awaiting/u, `${row.asset_id} remains pending`);
  assert.match(row.website_integration_status, /Not integrated/u, `${row.asset_id} remains unusable`);
}

const vite = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
  logLevel: 'error',
});

try {
  await vite.ssrLoadModule('/src/assets/assetRegistry.test.tsx');
  const [idsModule, assetModule, registryModule, experienceIdentityModule, witnessIdentityModule, applicationIdentityModule] = await Promise.all([
    vite.ssrLoadModule('/src/assets/iconIds.ts'),
    vite.ssrLoadModule('/src/assets/assetRegistry.ts'),
    vite.ssrLoadModule('/src/content/registry.ts'),
    vite.ssrLoadModule('/src/assets/experienceIdentityRegistry.ts'),
    vite.ssrLoadModule('/src/assets/twoSecondWitnessIdentityRegistry.ts'),
    vite.ssrLoadModule('/src/assets/applicationIdentityRegistry.ts'),
  ]);
  const { ASSET_ICON_IDS } = idsModule;
  const { approvedAssetIcons } = assetModule;
  const { CONTENT_SECTIONS, contentRegistry } = registryModule;
  const { coosJointCafeVignette } = experienceIdentityModule;
  const { twoSecondWitnessAssets } = witnessIdentityModule;
  const { applicationIdentityAssets } = applicationIdentityModule;
  assert.equal(ASSET_ICON_IDS.length, 20, 'typed allowlist has ten Batch 01 and ten Batch 02 R3.1 IDs');
  assert.equal(Object.keys(approvedAssetIcons).length, 20, 'central resolver exposes exactly twenty registered assets');

  const expectedRows = new Set([...r31Rows, ...batch02Rows].map((row) => row.asset_id));
  const resolvedRows = new Set();
  for (const iconId of ASSET_ICON_IDS) {
    const asset = approvedAssetIcons[iconId];
    assert.ok(asset, `${iconId} has an asset resolver entry`);
    assert.ok(expectedRows.has(asset.manifestAssetId), `${iconId} resolves only to an approved R3.1 manifest row`);
    resolvedRows.add(asset.manifestAssetId);
    const manifestRow = byManifestId.get(asset.manifestAssetId);
    assert.ok(manifestRow, `${asset.manifestAssetId} exists in the canonical manifest`);
    assert.equal(asset.sourcePath, manifestRow.filename, `${iconId} source path agrees with the manifest`);
    assert.equal(asset.optimizedPath, manifestRow.optimized_filename, `${iconId} optimized path agrees with the manifest`);
    assert.equal(manifestRow.dimensions_px, '24x24', `${iconId} retains the audited dimensions`);
    assert.equal(manifestRow.format, 'SVG', `${iconId} remains vector artwork`);

    const sourcePath = path.join(root, 'assets', asset.sourcePath);
    const optimizedPath = path.join(root, 'assets', asset.optimizedPath);
    const [source, optimized, sourceInfo, optimizedInfo] = await Promise.all([
      readFile(sourcePath, 'utf8'),
      readFile(optimizedPath, 'utf8'),
      stat(sourcePath),
      stat(optimizedPath),
    ]);
    assert.equal(sourceInfo.size, Number(manifestRow.file_size_bytes), `${iconId} source byte count agrees with the manifest`);
    assert.equal(asset.svgMarkup, optimized, `${iconId} runtime import is the exact optimized manifest derivative`);

    for (const [label, svg] of [['source', source], ['optimized', optimized]]) {
      assert.match(svg, /<svg\b[^>]*width="24"[^>]*height="24"[^>]*viewBox="0 0 24 24"/u, `${iconId} ${label} SVG has explicit 24px dimensions and viewBox`);
      assert.match(svg, /currentColor/u, `${iconId} ${label} SVG inherits neutral theme color`);
      assert.match(svg, /var\(--nocharge-icon-accent/u, `${iconId} ${label} SVG uses the adaptive accent token`);
      assert.doesNotMatch(svg, /<script\b|<foreignObject\b|<image\b|<style\b|\son[a-z]+\s*=/iu, `${iconId} ${label} SVG contains no scriptable or embedded-content elements`);
      assert.doesNotMatch(svg, /(?:xlink:)?href\s*=|url\(\s*['"]?(?:https?:|\/\/)/iu, `${iconId} ${label} SVG contains no external references`);
      assert.doesNotMatch(svg, /<rect\b[^>]*\bx="0"[^>]*\by="0"[^>]*\bwidth="24"[^>]*\bheight="24"[^>]*\bfill=/iu, `${iconId} ${label} SVG has no opaque full-canvas background`);
    }
    assert.ok(optimizedInfo.size > 0 && optimizedInfo.size < sourceInfo.size, `${iconId} optimized derivative exists and is smaller than its source`);
  }
  assert.deepEqual(resolvedRows, expectedRows, 'every R3.1 manifest row has exactly one typed resolver ID');

  const importedAssets = [...(await readFile(path.join(root, 'src/assets/assetRegistry.ts'), 'utf8')).matchAll(/^import\s+\w+\s+from\s+'([^']+)'/gmu)]
    .map((match) => match[1]);
  const batch01Imports = importedAssets.filter((specifier) => specifier.includes('/batch-01-'));
  const batch02Imports = importedAssets.filter((specifier) => specifier.includes('/batch-02-'));
  assert.equal(batch01Imports.length, 10, 'the resolver retains all ten approved Batch 01 R3.1 derivatives');
  assert.equal(batch02Imports.length, 10, 'the resolver imports exactly ten Batch 02 derivatives');
  assert.ok(importedAssets.every((specifier) => /^\.\.\/\.\.\/assets\/brand\/nocharge\/batch-0[12]-r3\.1\/optimized\/[^/]+\.svg\?raw$/u.test(specifier)),
    'the resolver imports only approved optimized R3.1 derivatives, with no rejected, pending, public, or arbitrary paths');

  const activeSlots = CONTENT_SECTIONS.filter((section) => typeof section.assetIconId === 'string')
    .map((section) => [section.id, section.assetIconId]);
  assert.deepEqual(activeSlots, [['tools', 'tools-section'], ['guides', 'guides-section']], 'only existing matching Tools and Guides hub headings render approved artwork');
  for (const [sectionId, iconId] of activeSlots) {
    const asset = approvedAssetIcons[iconId];
    const row = byManifestId.get(asset.manifestAssetId);
    assert.ok(row.website_integration_status.includes(`mapped ${sectionId === 'tools' ? 'Tools' : 'Guides'} hub heading`), `${asset.manifestAssetId} manifest status names its exact rendered target`);
  }

  const expectedToolIcons = [
    ['discovery-wheel', 'discovery-wheel-tool'],
    ['game-finder', 'game-finder-tool'],
    ['session-planner', 'session-planner-tool'],
    ['random-activity', 'random-activity-tool'],
    ['ambient-mixer', 'ambient-mixer-tool'],
    ['singing-bowl-engine', 'singing-bowl-tool'],
    ['reduced-motion-tester', 'reduced-motion-tool'],
    ['touch-target-checker', 'touch-target-tool'],
    ['storage-inspector', 'storage-inspector-tool'],
    ['zoom-visualizer', 'zoom-visualizer-tool'],
  ];
  const assignedToolIcons = contentRegistry
    .filter((entry) => entry.kind === 'tool' && typeof entry.assetIconId === 'string')
    .map((entry) => [entry.slug, entry.assetIconId])
    .sort(([a], [b]) => a.localeCompare(b));
  assert.deepEqual(assignedToolIcons, [...expectedToolIcons].sort(([a], [b]) => a.localeCompare(b)), 'only the ten mapped Phase 3B tools receive Batch 02 icons in their manifest-backed card/detail slots');
  assert.ok(contentRegistry.filter((entry) => entry.kind === 'arcade').every((entry) => !entry.assetIconId), 'no Arcade game receives a Batch 02 entry icon');
  for (const [slug, iconId] of expectedToolIcons) {
    const asset = approvedAssetIcons[iconId];
    const row = byManifestId.get(asset.manifestAssetId);
    assert.ok(asset && row, `${iconId} resolves through its manifest source row`);
    assert.ok(row.website_integration_status.includes(`/tools/${slug}/`), `${asset.manifestAssetId} remains scoped to its exact tool path`);
    assert.ok(row.website_integration_status.includes('published V2 tool card and detail heading'), `${asset.manifestAssetId} status agrees with the rendered UI slots`);
  }
  for (const row of r31Rows.filter((entry) => !['NC09-R3.1', 'NC10-R3.1'].includes(entry.asset_id))) {
    assert.match(row.website_integration_status, /not rendered/u, `${row.asset_id} is approved but not repurposed for a missing V2 target`);
  }

  const cafeSourcePath = path.join(root, 'assets', coosJointCafeVignette.sourcePath);
  const cafeOptimizedPath = path.join(root, 'assets', coosJointCafeVignette.optimizedPath);
  const [cafeSource, cafeOptimized, cafeRow, cafeOptimizedRow, cafeSourceInfo, cafeOptimizedInfo] = await Promise.all([
    readFile(cafeSourcePath, 'utf8'),
    readFile(cafeOptimizedPath, 'utf8'),
    Promise.resolve(byManifestId.get('NC-CJ-01')),
    Promise.resolve(byManifestId.get('NC-CJ-01-OPT')),
    stat(cafeSourcePath),
    stat(cafeOptimizedPath),
  ]);
  assert.ok(cafeRow && cafeOptimizedRow, 'original Coo’s Joint artwork and its runtime derivative are registered in the canonical manifest');
  assert.match(cafeRow.generation_status, /Hand-authored original vector artwork/u, 'the source manifest row records clean-room art authorship');
  assert.match(cafeRow.approval_status, /explicit Phase 5B-1 request for Coo’s Joint identity art only/u, 'the source manifest row records the user-approved app-only scope');
  assert.match(cafeRow.website_integration_status, /Not integrated into the published static Experience route/u, 'the source art is archived and not included in the static app showcase');
  assert.equal(cafeOptimizedRow.optimized_filename, '', 'the derivative manifest row does not invent a second optimized file');
  assert.equal(coosJointCafeVignette.manifestAssetId, 'NC-CJ-01', 'the experience asset registry exposes the app-scoped manifest ID');
  assert.equal(coosJointCafeVignette.format, 'svg', 'the original café vignette is a vector asset');
  assert.equal(coosJointCafeVignette.width, 720, 'the café vignette has the audited width');
  assert.equal(coosJointCafeVignette.height, 300, 'the café vignette has the audited height');
  assert.equal(coosJointCafeVignette.sourcePath, cafeRow.filename, 'the experience registry source agrees with the manifest');
  assert.equal(coosJointCafeVignette.optimizedPath, cafeRow.optimized_filename, 'the experience registry derivative agrees with the manifest');
  assert.equal(cafeRow.optimized_filename, cafeOptimizedRow.filename, 'the source row points at the registered optimized derivative');
  assert.equal(cafeRow.dimensions_px, '720x300', 'the source row records the responsive SVG viewBox dimensions');
  assert.equal(cafeOptimizedRow.dimensions_px, cafeRow.dimensions_px, 'the runtime derivative retains its source dimensions');
  assert.equal(cafeRow.format, 'SVG', 'the source row records the authored vector format');
  assert.equal(cafeOptimizedRow.format, 'SVG', 'the derivative row records the optimized vector format');
  assert.equal(cafeSourceInfo.size, Number(cafeRow.file_size_bytes), 'the original artwork byte count agrees with the manifest');
  assert.equal(cafeOptimizedInfo.size, Number(cafeOptimizedRow.file_size_bytes), 'the runtime derivative byte count agrees with the manifest');
  assert.ok(cafeOptimizedInfo.size > 0 && cafeOptimizedInfo.size < cafeSourceInfo.size, 'the optimized artwork exists and is smaller than its source');
  assert.equal(coosJointCafeVignette.svgMarkup, cafeOptimized, 'the app-local registry imports the exact optimized derivative');
  assert.equal(cafeOptimized, cafeSource.trim().replace(/>\s+</gu, '><').replace(/\s+/gu, ' '), 'the runtime artwork is a whitespace-only, lossless source derivative');
  for (const [label, svg] of [['source', cafeSource], ['optimized', cafeOptimized]]) {
    assert.match(svg, /<svg\b[^>]*width="720"[^>]*height="300"[^>]*viewBox="0 0 720 300"/u, `Coo’s Joint ${label} SVG has explicit dimensions and a responsive viewBox`);
    assert.match(svg, /var\(--event-(?:surface|border|accent)\)/u, `Coo’s Joint ${label} art adapts to seasonal palette tokens`);
    assert.match(svg, /var\(--(?:ink|paper-strong|surface-muted|text-secondary)\)/u, `Coo’s Joint ${label} art adapts to Light and Dark tokens`);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|<image\b|<style\b|\son[a-z]+\s*=/iu, `Coo’s Joint ${label} art has no scriptable or embedded-content elements`);
    assert.doesNotMatch(svg, /(?:xlink:)?href\s*=|url\(\s*['"]?(?:https?:|\/\/)/iu, `Coo’s Joint ${label} art contains no linked resources`);
    assert.doesNotMatch(svg, /#[0-9a-f]{3,8}\b/iu, `Coo’s Joint ${label} art contains no fixed color that would bypass the page palettes`);
  }
  const coosPreviewSource = await readFile(path.join(root, 'src/modules/experiences/CoffeeIdlePreview.tsx'), 'utf8');
  const sharedAssetRegistrySource = await readFile(path.join(root, 'src/assets/assetRegistry.ts'), 'utf8');
  const experienceRegistrySource = await readFile(path.join(root, 'src/content/registry.ts'), 'utf8');
  assert.ok(coosPreviewSource.includes("from '../../assets/experienceIdentityRegistry'"), 'the dormant Coo’s Joint preview source resolves only its isolated artwork registry');
  assert.ok(coosPreviewSource.includes("data-asset-id={coosJointCafeVignette.manifestAssetId}"), 'the archived preview source retains the art manifest identity');
  assert.ok(coosPreviewSource.includes('dangerouslySetInnerHTML={{ __html: coosJointCafeVignette.svgMarkup }}'), 'the archived preview source renders its isolated art inline without remote requests');
  assert.doesNotMatch(sharedAssetRegistrySource, /application-identities\/coos-cafe/u, 'Coo’s Joint art stays out of the shared icon batches');
  assert.doesNotMatch(experienceRegistrySource, /moduleLoader:\s*\(\)\s*=>\s*import\('\.\.\/modules\/experiences\/CoffeeIdlePreview'\)/u, 'the published Coo’s Joint route remains a static showcase with no local preview loader');

  const witnessAssets = [
    twoSecondWitnessAssets.emblem,
    ...Object.values(twoSecondWitnessAssets.scenes),
    ...Object.values(twoSecondWitnessAssets.props),
  ];
  const witnessRows = manifest.filter((row) => /^NC-2SW-\d{2}(?:-OPT)?$/u.test(row.asset_id));
  assert.equal(witnessAssets.length, 15, 'The 2-Second Witness registers one emblem, four scenes, and ten prop illustrations');
  assert.equal(witnessRows.length, 30, 'the canonical manifest records fifteen W2 source and runtime derivative pairs');
  assert.equal(new Set(witnessRows.map((row) => row.asset_id)).size, 30, 'all NC-2SW source and derivative IDs are unique');
  const witnessPreviewSource = await readFile(path.join(root, 'src/modules/experiences/TwoSecondWitnessPreview.tsx'), 'utf8');
  const witnessRegistrySource = await readFile(path.join(root, 'src/assets/twoSecondWitnessIdentityRegistry.ts'), 'utf8');
  const witnessReadme = await readFile(path.join(root, 'assets/application-identities/two-second-witness/README.md'), 'utf8');
  assert.ok(witnessPreviewSource.includes("from '../../assets/twoSecondWitnessIdentityRegistry'"), 'the dormant W2 preview source resolves only its isolated art registry');
  assert.ok(witnessPreviewSource.includes('data-asset-id={sceneArtwork.manifestAssetId}'), 'each revealed scene retains its manifest-backed identity');
  assert.ok(witnessPreviewSource.includes('data-asset-id={propArtwork.manifestAssetId}'), 'each illustrated prop retains its manifest-backed identity');
  assert.ok(witnessPreviewSource.includes('dangerouslySetInnerHTML'), 'registered original SVG markup renders inline without creating a network image request');
  assert.ok(witnessReadme.includes('No external artwork, image library, font file, logo, or raster reference was used.'), 'the app-local attribution ledger documents original artwork and non-reuse');
  assert.ok(witnessReadme.includes('`/experiences/twosecondwitness/` only.'), 'the attribution ledger keeps this art scoped to the requested W2 route');
  assert.doesNotMatch(coosPreviewSource, /twoSecondWitness|NC-2SW|two-second-witness/u, 'W2 identity art is not imported or referenced by Coo’s Joint');
  assert.doesNotMatch(sharedAssetRegistrySource, /application-identities\/two-second-witness/u, 'W2 art stays out of the shared icon registry');
  assert.doesNotMatch(experienceRegistrySource, /moduleLoader:\s*\(\)\s*=>\s*import\('\.\.\/modules\/experiences\/TwoSecondWitnessPreview'\)/u, 'The 2-Second Witness remains a static showcase with no local preview loader');

  const expectedWitnessIds = new Set();
  for (const asset of witnessAssets) {
    const id = asset.manifestAssetId;
    assert.match(id, /^NC-2SW-\d{2}$/u, `${id} uses the W2-only manifest namespace`);
    expectedWitnessIds.add(id);
    expectedWitnessIds.add(`${id}-OPT`);
    const sourceRow = byManifestId.get(id);
    const optimizedRow = byManifestId.get(`${id}-OPT`);
    assert.ok(sourceRow && optimizedRow, `${id} and its runtime derivative are present in the manifest`);
    assert.match(sourceRow.generation_status, /Original hand-authored vector artwork for NOCHARGE V2 Phase 5B-2/u, `${id} records clean-room authorship`);
    assert.match(sourceRow.approval_status, /explicit Phase 5B-2 request for The 2-Second Witness only/u, `${id} records the app-only authorization`);
    assert.match(sourceRow.website_integration_status, /Not integrated into the published static Experience route/u, `${id} is archived and not rendered by the static W2 showcase`);
    assert.equal(sourceRow.optimized_filename, optimizedRow.filename, `${id} points to its registered runtime derivative`);
    assert.equal(optimizedRow.optimized_filename, '', `${id}-OPT does not claim another derivative`);
    assert.equal(asset.sourcePath, sourceRow.filename, `${id} registry source path agrees with the manifest`);
    assert.equal(asset.optimizedPath, optimizedRow.filename, `${id} registry runtime path agrees with the manifest`);
    assert.equal(sourceRow.dimensions_px, `${asset.width}x${asset.height}`, `${id} source dimensions agree with the registry`);
    assert.equal(optimizedRow.dimensions_px, sourceRow.dimensions_px, `${id}-OPT preserves the source dimensions`);
    assert.equal(sourceRow.format, 'SVG', `${id} is recorded as original vector art`);
    assert.equal(optimizedRow.format, 'SVG', `${id}-OPT is recorded as a vector derivative`);

    const sourcePath = path.join(root, 'assets', asset.sourcePath);
    const optimizedPath = path.join(root, 'assets', asset.optimizedPath);
    const [source, optimized, sourceInfo, optimizedInfo] = await Promise.all([
      readFile(sourcePath, 'utf8'),
      readFile(optimizedPath, 'utf8'),
      stat(sourcePath),
      stat(optimizedPath),
    ]);
    assert.equal(sourceInfo.size, Number(sourceRow.file_size_bytes), `${id} source byte count agrees with the canonical manifest`);
    assert.equal(optimizedInfo.size, Number(optimizedRow.file_size_bytes), `${id}-OPT byte count agrees with the canonical manifest`);
    assert.ok(optimizedInfo.size > 0 && optimizedInfo.size < sourceInfo.size, `${id} runtime derivative is present and smaller than its source`);
    assert.equal(asset.svgMarkup, optimized, `${id} isolated asset registry retains the exact manifest-listed optimized SVG`);
    assert.equal(optimized.trim(), source.trim().replace(/>\s+</gu, '><').replace(/\s+/gu, ' '), `${id}-OPT is a lossless whitespace-only derivative`);

    const [width, height] = sourceRow.dimensions_px.split('x');
    const svgDimensions = new RegExp(`<svg\\b[^>]*width="${width}"[^>]*height="${height}"[^>]*viewBox="0 0 ${width} ${height}"`, 'u');
    for (const [label, svg] of [['source', source], ['optimized', optimized]]) {
      assert.match(svg, svgDimensions, `${id} ${label} SVG has explicit audited dimensions and viewBox`);
      assert.match(svg, /var\(--ink\)/u, `${id} ${label} SVG uses the Light/Dark ink token`);
      assert.match(svg, /var\(--event-accent\)/u, `${id} ${label} SVG uses the seasonal accent token`);
      assert.match(svg, /aria-hidden="true"/u, `${id} ${label} SVG is marked decorative with adjacent visible text`);
      assert.match(svg, /focusable="false"/u, `${id} ${label} SVG cannot receive keyboard focus`);
      assert.doesNotMatch(svg, /<script\b|<foreignObject\b|<image\b|<style\b|\son[a-z]+\s*=/iu, `${id} ${label} SVG contains no scripts or embedded active content`);
      assert.doesNotMatch(svg, /(?:xlink:)?href\s*=|url\(\s*['"]?(?:https?:|\/\/)/iu, `${id} ${label} SVG contains no external references`);
      assert.doesNotMatch(svg, /#[0-9a-f]{3,8}\b/iu, `${id} ${label} SVG contains no fixed color that bypasses V2 palettes`);
    }
    const expectedImport = `../../assets/${asset.optimizedPath}?raw`;
    assert.ok(witnessRegistrySource.includes(expectedImport), `${id} optimized derivative is imported locally by the dedicated W2 registry`);
  }
  assert.deepEqual(new Set(witnessRows.map((row) => row.asset_id)), expectedWitnessIds, 'every NC-2SW manifest row is an expected source or optimized registry asset');

  // BRC remains an outbound-only static showcase. Its clean-room concept art is kept as a
  // provenance archive, but no preview module, runtime registry, or demo stylesheet ships.
  const barnRoadRows = manifest.filter((row) => /^NC-BRC-\d{2}(?:-OPT)?$/u.test(row.asset_id));
  assert.equal(barnRoadRows.length, 28, 'the provenance manifest retains fourteen BRC source/derivative pairs');
  assert.equal(new Set(barnRoadRows.map((row) => row.asset_id)).size, 28, 'all archived NC-BRC source and derivative IDs are unique');
  const barnRoadReadme = await readFile(path.join(root, 'assets/application-identities/barn-road-chronicles/README.md'), 'utf8');
  assert.ok(barnRoadReadme.includes('not copies, traces, crops, color edits, or derivatives of the itch.io listing'), 'BRC attribution explicitly prohibits reuse of listing art');
  assert.ok(barnRoadReadme.includes('static outbound showcase'), 'BRC attribution records the current outbound-only presentation');
  assert.ok(barnRoadReadme.includes('runtime identity registry have been removed'), 'BRC attribution states that no local artwork registry or preview is shipped');
  assert.doesNotMatch(experienceRegistrySource, /BarnRoadChroniclesPreview|barnRoadChroniclesIdentityRegistry|NC-BRC-\d{2}/u, 'the published registry has no BRC preview or artwork import');
  const stylesSource = await readFile(path.join(root, 'src/styles.css'), 'utf8');
  assert.doesNotMatch(stylesSource, /brc-demo|Barn Road Chronicles field vignette/u, 'the global stylesheet has no retired BRC demo rules');
  await assert.rejects(readFile(path.join(root, 'src/modules/experiences/BarnRoadChroniclesPreview.tsx'), 'utf8'), { code: 'ENOENT' }, 'the orphaned BRC local prototype component is removed');
  await assert.rejects(readFile(path.join(root, 'src/assets/barnRoadChroniclesIdentityRegistry.ts'), 'utf8'), { code: 'ENOENT' }, 'the BRC artwork is not exposed through a runtime identity registry');
  assert.doesNotMatch(coosPreviewSource, /barnRoadChronicles|NC-BRC|barn-road-chronicles/u, 'BRC artwork is not referenced by Coo’s Joint');
  assert.doesNotMatch(witnessPreviewSource, /barnRoadChronicles|NC-BRC|barn-road-chronicles/u, 'BRC artwork is not referenced by The 2-Second Witness');
  assert.doesNotMatch(sharedAssetRegistrySource, /application-identities\/barn-road-chronicles/u, 'archived BRC art stays out of shared icon batches');

  const expectedBarnRoadIds = new Set();
  for (let number = 1; number <= 14; number += 1) {
    const id = `NC-BRC-${String(number).padStart(2, '0')}`;
    expectedBarnRoadIds.add(id);
    expectedBarnRoadIds.add(`${id}-OPT`);
    const sourceRow = byManifestId.get(id);
    const optimizedRow = byManifestId.get(`${id}-OPT`);
    assert.ok(sourceRow && optimizedRow, `${id} and its archived derivative have manifest entries`);
    assert.match(sourceRow.generation_status, /Original hand-authored vector artwork for NOCHARGE V2 Phase 5B-3/u, `${id} records clean-room BRC authorship`);
    assert.match(sourceRow.approval_status, /explicit Phase 5B-3 request for Barn Road Chronicles only/u, `${id} records route-scoped authorization`);
    assert.match(sourceRow.website_integration_status, /^Not integrated into the published static Experience route \/experiences\/barn-road-chronicles\/; retained in the source\/optimized asset archive for provenance\/audit only and not imported, bundled, or rendered\.$/u, `${id} is clearly recorded as archived, not as demo artwork`);
    assert.equal(sourceRow.optimized_filename, optimizedRow.filename, `${id} points to its registered lossless derivative`);
    assert.equal(optimizedRow.optimized_filename, '', `${id}-OPT does not claim a second derivative`);
    assert.match(optimizedRow.website_integration_status, /^Not integrated into the published static Experience route \/experiences\/barn-road-chronicles\//u, `${id}-OPT is also marked as archive-only`);
    assert.equal(sourceRow.dimensions_px, optimizedRow.dimensions_px, `${id}-OPT preserves the audited source dimensions`);
    assert.equal(sourceRow.format, 'SVG', `${id} is recorded as original vector art`);
    assert.equal(optimizedRow.format, 'SVG', `${id}-OPT is recorded as a vector derivative`);

    const sourcePath = path.join(root, 'assets', sourceRow.filename);
    const optimizedPath = path.join(root, 'assets', optimizedRow.filename);
    const [source, optimized, sourceInfo, optimizedInfo] = await Promise.all([
      readFile(sourcePath, 'utf8'),
      readFile(optimizedPath, 'utf8'),
      stat(sourcePath),
      stat(optimizedPath),
    ]);
    assert.equal(sourceInfo.size, Number(sourceRow.file_size_bytes), `${id} archived source size agrees with the manifest`);
    assert.equal(optimizedInfo.size, Number(optimizedRow.file_size_bytes), `${id}-OPT archived size agrees with the manifest`);
    assert.ok(optimizedInfo.size > 0 && optimizedInfo.size < sourceInfo.size, `${id}-OPT is smaller than its archived source`);
    assert.equal(optimized.trim(), source.trim().replace(/>\s+</gu, '><').replace(/\s+/gu, ' '), `${id}-OPT is a lossless whitespace-only derivative`);

    const [width, height] = sourceRow.dimensions_px.split('x');
    const svgDimensions = new RegExp(`<svg\\b[^>]*width="${width}"[^>]*height="${height}"[^>]*viewBox="0 0 ${width} ${height}"`, 'u');
    for (const [label, svg] of [['source', source], ['optimized', optimized]]) {
      assert.match(svg, svgDimensions, `${id} ${label} SVG has audited dimensions and viewBox`);
      assert.match(svg, /var\(--ink\)/u, `${id} ${label} SVG uses the Light/Dark ink token`);
      assert.match(svg, /var\(--event-accent\)/u, `${id} ${label} SVG uses the seasonal accent token`);
      assert.match(svg, /aria-hidden="true"/u, `${id} ${label} SVG is decorative beside visible interface text`);
      assert.match(svg, /focusable="false"/u, `${id} ${label} SVG cannot receive keyboard focus`);
      assert.doesNotMatch(svg, /<script\b|<foreignObject\b|<image\b|<style\b|\son[a-z]+\s*=/iu, `${id} ${label} SVG contains no active or embedded content`);
      assert.doesNotMatch(svg, /(?:xlink:)?href\s*=|url\(\s*['"]?(?:https?:|\/\/)/iu, `${id} ${label} SVG has no external references`);
      assert.doesNotMatch(svg, /#[0-9a-f]{3,8}\b/iu, `${id} ${label} SVG has no fixed palette colors`);
    }
  }
  assert.deepEqual(new Set(barnRoadRows.map((row) => row.asset_id)), expectedBarnRoadIds, 'every NC-BRC manifest row maps to one archived source or derivative');

  const expectedApplicationAssets = {
    profivue: ['NC-PV-01', 'NC-PV-02', 'NC-PV-03'],
    rideside: ['NC-RS-01', 'NC-RS-02'],
  };
  const applicationRows = manifest.filter((row) => /^NC-(?:PV|RS)-\d{2}(?:-OPT)?$/u.test(row.asset_id));
  assert.equal(applicationRows.length, 10, 'the manifest has five publisher image sources and five optimized derivatives');
  assert.equal(new Set(applicationRows.map((row) => row.asset_id)).size, 10, 'all ProfiVue/RideSide source and derivative IDs are unique');
  const applicationRegistrySource = await readFile(path.join(root, 'src/assets/applicationIdentityRegistry.ts'), 'utf8');
  assert.doesNotMatch(applicationRegistrySource, /https?:\/\//u, 'application asset registry contains no hotlinked image source');
  assert.match(applicationRegistrySource, /src:\s*`\/assets\/\$\{optimizedPath\}`/u, 'the registry maps manifest derivatives to stable, same-origin Vite public URLs');

  for (const [slug, assetIds] of Object.entries(expectedApplicationAssets)) {
    const appAssets = applicationIdentityAssets[slug];
    assert.deepEqual(appAssets.map((asset) => asset.manifestAssetId), assetIds, `${slug} identity registry exposes only its scoped source asset IDs`);
    const experience = contentRegistry.find((entry) => entry.kind === 'experience' && entry.slug === slug);
    assert.ok(experience?.kind === 'experience' && experience.presentation === 'editorial-mini-site', `${slug} registry record is static, not interactive`);
    assert.ok(!experience?.moduleLoader, `${slug} record has no demo module loader`);
    assert.deepEqual(experience.documentation.artwork.map((asset) => asset.manifestAssetId), assetIds, `${slug} mini-site references its exact manifest source assets`);
    assert.ok(experience.documentation.artwork.every((asset) => asset.src.startsWith('/assets/')), `${slug} emits only same-origin locally hosted runtime image URLs`);

    for (const asset of appAssets) {
      assert.match(asset.manifestAssetId, slug === 'profivue' ? /^NC-PV-\d{2}$/u : /^NC-RS-\d{2}$/u, `${asset.manifestAssetId} stays in its app-only namespace`);
      assert.equal(asset.runtimeManifestAssetId, `${asset.manifestAssetId}-OPT`, `${asset.manifestAssetId} points at its distinct runtime derivative ID`);
      const sourceRow = byManifestId.get(asset.manifestAssetId);
      const optimizedRow = byManifestId.get(asset.runtimeManifestAssetId);
      assert.ok(sourceRow && optimizedRow, `${asset.manifestAssetId} source and optimized rows exist`);
      assert.equal(sourceRow.filename, asset.sourcePath, `${asset.manifestAssetId} source path agrees with the manifest-backed registry`);
      assert.equal(sourceRow.optimized_filename, asset.optimizedPath, `${asset.manifestAssetId} source row points to the runtime derivative`);
      assert.equal(optimizedRow.filename, asset.optimizedPath, `${asset.manifestAssetId}-OPT path agrees with the registry`);
      assert.equal(optimizedRow.optimized_filename, '', `${asset.manifestAssetId}-OPT does not claim an unlisted second derivative`);
      assert.equal(sourceRow.dimensions_px, '768x1376', `${asset.manifestAssetId} source row records the exact listing-image dimensions`);
      assert.equal(optimizedRow.dimensions_px, sourceRow.dimensions_px, `${asset.manifestAssetId}-OPT preserves source dimensions`);
      assert.equal(sourceRow.format, 'PNG', `${asset.manifestAssetId} preserves the publisher PNG source format`);
      assert.equal(optimizedRow.format, 'WebP', `${asset.manifestAssetId}-OPT records the local WebP runtime format`);
      assert.match(sourceRow.generation_status, /exact ITTYBITTYBITES Google Play listing/u, `${asset.manifestAssetId} records exact publisher-listing provenance`);
      assert.match(sourceRow.approval_status, /User-authorized local use of official Google Play listing imagery/u, `${asset.manifestAssetId} records scoped user authorization`);
      assert.match(sourceRow.website_integration_status, new RegExp(`lazy-loaded editorial figure on /experiences/${slug}/`, 'u'), `${asset.manifestAssetId} records its exact lazy route scope`);
      assert.match(optimizedRow.generation_status, /Lossless WebP conversion/u, `${asset.manifestAssetId}-OPT records a genuine format conversion`);
      assert.match(optimizedRow.technical_or_visual_issues, /pixel-identical RGB decode/u, `${asset.manifestAssetId}-OPT records pixel-preserving conversion`);
      assert.match(optimizedRow.website_integration_status, /lazy-loaded/u, `${asset.manifestAssetId}-OPT is documented as lazy-loaded`);
      const [sourceBuffer, optimizedBuffer, publicMirrorBuffer, sourceInfo, optimizedInfo] = await Promise.all([
        readFile(path.join(root, 'assets', sourceRow.filename)),
        readFile(path.join(root, 'assets', optimizedRow.filename)),
        readFile(path.join(root, 'public', 'assets', asset.optimizedPath)),
        stat(path.join(root, 'assets', sourceRow.filename)),
        stat(path.join(root, 'assets', optimizedRow.filename)),
      ]);
      assert.equal(sourceInfo.size, Number(sourceRow.file_size_bytes), `${asset.manifestAssetId} source byte count matches the manifest`);
      assert.equal(optimizedInfo.size, Number(optimizedRow.file_size_bytes), `${asset.manifestAssetId}-OPT byte count matches the manifest`);
      assert.ok(optimizedInfo.size > 0 && optimizedInfo.size < sourceInfo.size, `${asset.manifestAssetId}-OPT is smaller than its retained PNG source`);
      assert.deepEqual([...sourceBuffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${asset.manifestAssetId} source is a real PNG file`);
      assert.equal(optimizedBuffer.subarray(0, 4).toString('ascii'), 'RIFF', `${asset.manifestAssetId}-OPT has a WebP RIFF header`);
      assert.equal(optimizedBuffer.subarray(8, 12).toString('ascii'), 'WEBP', `${asset.manifestAssetId}-OPT is a real WebP asset`);
      assert.deepEqual(publicMirrorBuffer, optimizedBuffer, `${asset.manifestAssetId}-OPT public runtime copy exactly mirrors its manifest-listed derivative`);
      assert.equal(asset.src, `/assets/${asset.optimizedPath}`, `${asset.manifestAssetId} references the same-origin public mirror URL`);
      assert.equal(asset.width, 768, `${asset.manifestAssetId} registry width matches the image source`);
      assert.equal(asset.height, 1376, `${asset.manifestAssetId} registry height matches the image source`);
    }
    const readme = await readFile(path.join(root, 'assets/application-identities', slug, 'README.md'), 'utf8');
    assert.match(readme, /publisher-supplied materials/u, `${slug} attribution ledger identifies publisher-supplied imagery`);
    assert.match(readme, /pixel-for-pixel match/u, `${slug} attribution ledger documents lossless derivative verification`);
    assert.match(readme, new RegExp(`/experiences/${slug}/`, 'u'), `${slug} attribution ledger scopes reuse to its own route`);
  }
  const applicationRuntimeRows = new Set(applicationIdentityAssets.profivue.concat(applicationIdentityAssets.rideside)
    .flatMap((asset) => [asset.manifestAssetId, asset.runtimeManifestAssetId]));
  assert.deepEqual(new Set(applicationRows.map((row) => row.asset_id)), applicationRuntimeRows, 'every scoped app manifest row maps to exactly one typed registry asset');
  const miniSiteSource = await readFile(path.join(root, 'src/templates/ExperienceMiniSite.tsx'), 'utf8');
  assert.match(miniSiteSource, /loading="lazy"/u, 'static listing images use native lazy loading');
  assert.match(miniSiteSource, /decoding="async"/u, 'static listing images decode asynchronously');
  assert.doesNotMatch(experienceRegistrySource, /ProfiVuePreview|RideSidePreview|profivue-preview|rideside-preview/u, 'no ProfiVue or RideSide preview engine remains in the published registry');

  console.log('Manifest/asset checks passed (20 shared approved icons, isolated Coo’s Joint/W2 provenance assets, archived BRC artwork excluded from runtime, and five publisher-supplied ProfiVue/RideSide source/optimized pairs).');
} finally {
  await vite.close();
}
