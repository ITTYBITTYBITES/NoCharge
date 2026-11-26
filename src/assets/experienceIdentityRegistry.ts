import coosJointCafeVignetteSvg from '../../assets/application-identities/coos-cafe/optimized/coos-joint-shift-vignette.svg?raw';

/**
 * Archived Coo’s Joint identity artwork, isolated from the shared NoCharge icon registry.
 * It is retained for asset provenance and tests; the published /experiences/coosjoint/ route is
 * a static showcase and does not load this registry or a local gameplay preview.
 */
export const coosJointCafeVignette = {
  manifestAssetId: 'NC-CJ-01',
  sourcePath: 'application-identities/coos-cafe/source/coos-joint-shift-vignette.svg',
  optimizedPath: 'application-identities/coos-cafe/optimized/coos-joint-shift-vignette.svg',
  format: 'svg',
  width: 720,
  height: 300,
  svgMarkup: coosJointCafeVignetteSvg,
} as const;
