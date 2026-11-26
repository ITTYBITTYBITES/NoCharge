export interface RegisteredApplicationImage {
  manifestAssetId: string;
  runtimeManifestAssetId: string;
  sourcePath: string;
  optimizedPath: string;
  /** Stable Vite public URL; the delivered file mirrors the manifest-listed derivative byte-for-byte. */
  src: string;
  width: number;
  height: number;
}

function registerImage(
  manifestAssetId: string,
  sourcePath: string,
  optimizedPath: string,
): RegisteredApplicationImage {
  return {
    manifestAssetId,
    runtimeManifestAssetId: `${manifestAssetId}-OPT`,
    sourcePath,
    optimizedPath,
    src: `/assets/${optimizedPath}`,
    width: 768,
    height: 1376,
  };
}

/**
 * First-party local copies of images from the exact publisher listings.
 * public/assets mirrors each manifest-listed optimized derivative so prerendered HTML and client routes use one stable URL.
 */
export const applicationIdentityAssets = {
  profivue: [
    registerImage('NC-PV-01', 'application-identities/profivue/source/profivue-before-buy.png', 'application-identities/profivue/optimized/profivue-before-buy.webp'),
    registerImage('NC-PV-02', 'application-identities/profivue/source/profivue-cost-breakdown.png', 'application-identities/profivue/optimized/profivue-cost-breakdown.webp'),
    registerImage('NC-PV-03', 'application-identities/profivue/source/profivue-marketplace-profiles.png', 'application-identities/profivue/optimized/profivue-marketplace-profiles.webp'),
  ],
  rideside: [
    registerImage('NC-RS-01', 'application-identities/rideside/source/rideside-trip-memory-card.png', 'application-identities/rideside/optimized/rideside-trip-memory-card.webp'),
    registerImage('NC-RS-02', 'application-identities/rideside/source/rideside-watercraft-checklist.png', 'application-identities/rideside/optimized/rideside-watercraft-checklist.webp'),
  ],
} as const satisfies Record<'profivue' | 'rideside', readonly RegisteredApplicationImage[]>;
