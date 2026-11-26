import { renderToStaticMarkup } from 'react-dom/server';
import { AdaptiveIcon } from '../components/AdaptiveIcon';
import { CONTENT_SECTIONS, contentRegistry } from '../content/registry';
import { approvedAssetIcons, resolveAssetIcon } from './assetRegistry';
import { ASSET_ICON_IDS, isAssetIconId } from './iconIds';
import type { AssetIconId } from './iconIds';

function equal(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function truthy(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function sameMembers(actual: readonly string[], expected: readonly string[], message: string): void {
  const left = [...actual].sort();
  const right = [...expected].sort();
  equal(JSON.stringify(left), JSON.stringify(right), message);
}

sameMembers(Object.keys(approvedAssetIcons), ASSET_ICON_IDS, 'the resolver contains exactly the typed approved icon IDs');
equal(ASSET_ICON_IDS.length, 20, 'the typed allowlist contains ten original R3.1 assets and ten Batch 02 tool assets');
truthy(isAssetIconId('guides-section'), 'a known approved ID passes the runtime guard');
equal(isAssetIconId('nc09-r3-1-guides-section.svg'), false, 'raw file paths are not accepted as semantic IDs');
equal(isAssetIconId('../../assets/brand/nocharge/batch-01-r3.1/source/nc09.svg'), false, 'traversal paths are not accepted as semantic IDs');
equal(resolveAssetIcon('__proto__'), undefined, 'unknown runtime values fail closed');
equal(resolveAssetIcon('R3'), undefined, 'unapproved proposal families cannot resolve');

for (const id of ASSET_ICON_IDS) {
  const asset = resolveAssetIcon(id);
  truthy(asset, `${id} resolves from the approved registry`);
  equal(asset.id, id, `${id} resolves to its own semantic ID`);
  equal(asset.format, 'svg', `${id} is a vector asset`);
  equal(asset.width, 24, `${id} has the audited width`);
  equal(asset.height, 24, `${id} has the audited height`);
  truthy(asset.manifestAssetId.endsWith('R3.1'), `${id} maps to an R3.1 manifest row`);
  truthy(asset.optimizedPath.includes('/optimized/'), `${id} uses the registered optimized derivative`);
  truthy(asset.svgMarkup.startsWith('<svg'), `${id} imports its SVG markup from the build-time asset`);
}

const sectionSlots = Object.fromEntries(CONTENT_SECTIONS.map((section) => [section.id, section.assetIconId ?? null]));
equal(JSON.stringify(sectionSlots), JSON.stringify({
  arcade: null,
  experiences: null,
  tools: 'tools-section',
  guides: 'guides-section',
}), 'only the actual Guides and Tools hubs use their mapped Batch 01 heading icons');
sameMembers(
  CONTENT_SECTIONS.map((section) => section.assetIconId).filter((id): id is AssetIconId => typeof id === 'string'),
  ['guides-section', 'tools-section'],
  'no Daily, genre, or Pass & Play art is applied to a different or nonexistent V2 target',
);
const expectedToolIcons = [
  'discovery-wheel:discovery-wheel-tool',
  'game-finder:game-finder-tool',
  'session-planner:session-planner-tool',
  'random-activity:random-activity-tool',
  'ambient-mixer:ambient-mixer-tool',
  'singing-bowl-engine:singing-bowl-tool',
  'reduced-motion-tester:reduced-motion-tool',
  'touch-target-checker:touch-target-tool',
  'storage-inspector:storage-inspector-tool',
  'zoom-visualizer:zoom-visualizer-tool',
];
sameMembers(
  contentRegistry.filter((entry) => entry.kind === 'tool' && typeof entry.assetIconId === 'string')
    .map((entry) => `${entry.slug}:${entry.assetIconId}`),
  expectedToolIcons,
  'the ten Batch 02 icons are assigned only to their exact published tool entries',
);
truthy(contentRegistry.filter((entry) => entry.kind === 'arcade').every((entry) => !entry.assetIconId), 'game entries do not receive tool identity icons');

const decorative = renderToStaticMarkup(<AdaptiveIcon iconId="tools-section" size={44} />);
truthy(decorative.includes('data-asset-id="NC10-R3.1"'), 'the Tools heading renders the approved manifest asset');
truthy(decorative.includes('data-render-mode="inline-svg"'), 'approved SVGs use the inline theme-adaptive render mode');
truthy(decorative.includes('aria-hidden="true"'), 'decorative icons are hidden from assistive technology');
truthy(decorative.includes('<svg'), 'the approved icon is inline, not an image request');
truthy(decorative.includes('width="44" height="44"'), 'the inline SVG receives explicit rendered dimensions');
equal(decorative.includes('<title'), false, 'source title nodes are removed before assigning use-specific semantics');
equal(decorative.includes('<desc'), false, 'source descriptions are removed before assigning use-specific semantics');
equal(decorative.includes('<img'), false, 'the inline SVG path does not create an image element');

const meaningful = renderToStaticMarkup(<AdaptiveIcon iconId="guides-section" size={32} alt={'Guides & "how-to"'} />);
truthy(meaningful.includes('role="img"'), 'a meaning-bearing icon receives image semantics');
truthy(meaningful.includes('aria-label="Guides &amp; &quot;how-to&quot;"'), 'meaningful alt text is safely escaped');
equal(meaningful.includes('aria-hidden="true"'), false, 'a meaning-bearing icon is not hidden');
truthy(meaningful.includes('width="32" height="32"'), 'custom icon dimensions are applied to the vector');

const structuralFallback = renderToStaticMarkup(<AdaptiveIcon size={40} />);
truthy(structuralFallback.includes('data-icon-fallback="true"'), 'missing icon IDs render a structural fallback');
truthy(structuralFallback.includes('adaptive-icon__fallback-mark'), 'the default fallback is a CSS structure, not replacement artwork');
truthy(structuralFallback.includes('aria-hidden="true"'), 'a decorative structural fallback is hidden from assistive technology');
equal(structuralFallback.includes('<svg'), false, 'the structural fallback has no pending/rejected SVG');
equal(structuralFallback.includes('<img'), false, 'the structural fallback makes no image request');

const staleReference = renderToStaticMarkup(<AdaptiveIcon iconId={'../../assets/other.svg' as AssetIconId} size={-8} />);
truthy(staleReference.includes('data-icon-fallback="true"'), 'an invalid runtime reference fails over to the structural fallback');
truthy(staleReference.includes('width:1px;height:1px'), 'dimensions are bounded to a safe positive value');

console.log('Asset registry tests passed (approved ID allowlist, manifest targets, accessible inline SVG, and structural fallback).');
